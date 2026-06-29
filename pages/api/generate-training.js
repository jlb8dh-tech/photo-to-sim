import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { photo } = req.body;
  if (!photo) {
    return res.status(400).json({ error: 'Photo required' });
  }

  try {
    const { data: job, error: jobError } = await supabase
      .from('training_jobs')
      .insert([{ status: 'analyzing', photo_base64: photo }])
      .select();

    if (jobError) throw jobError;
    const jobId = job[0].id;

    orchestrateTraining(jobId, photo).catch(err => {
      console.error(`Job ${jobId} failed:`, err);
    });

    return res.status(200).json({ jobId });
  } catch (err) {
    console.error('Generate error:', err);
    return res.status(500).json({ error: err.message });
  }
}

async function orchestrateTraining(jobId, photoBase64) {
  try {
    await updateJob(jobId, 'analyzing');
    const photoBuffer = Buffer.from(photoBase64.split(',')[1], 'base64');
    
    const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-opus-4-6',
        max_tokens: 1000,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Analyze this facility photo for safety hazards and create a training scenario script. Return JSON: {scenario, hazards, risks}' },
              { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: photoBuffer.toString('base64') } }
            ]
          }
        ]
      })
    });

    const claudeData = await claudeRes.json();
    const scriptJson = JSON.parse(claudeData.content[0].text);

    await updateJob(jobId, 'voicing');
    const elevenRes = await fetch('https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', {
      method: 'POST',
      headers: {
        'xi-api-key': process.env.ELEVENLABS_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        text: scriptJson.scenario,
        model_id: 'eleven_monolingual_v1'
      })
    });

    const audioBuffer = await elevenRes.arrayBuffer();
    const audioUrl = `data:audio/mpeg;base64,${Buffer.from(audioBuffer).toString('base64')}`;

    await updateJob(jobId, 'rendering');
    const runwayRes = await fetch('https://api.runwayml.com/v1/image_to_video', {
      method: 'POST',
      headers: {
        'authorization': `Bearer ${process.env.RUNWAY_API_KEY}`,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        image: photoBase64,
        model: 'gen4',
        duration: 15
      })
    });

    const runwayData = await runwayRes.json();
    let taskId = runwayData.id;

    let videoUrl = null;
    for (let i = 0; i < 30; i++) {
      const statusRes = await fetch(`https://api.runwayml.com/v1/tasks/${taskId}`, {
        headers: { 'authorization': `Bearer ${process.env.RUNWAY_API_KEY}` }
      });
      const statusData = await statusRes.json();

      if (statusData.status === 'SUCCEEDED') {
        videoUrl = statusData.output[0];
        break;
      } else if (statusData.status === 'FAILED') {
        throw new Error('Video generation failed');
      }
      await new Promise(r => setTimeout(r, 2000));
    }

    await supabase
      .from('training_jobs')
      .update({
        status: 'done',
        script_json: scriptJson,
        audio_url_en: audioUrl,
        video_url: videoUrl
      })
      .eq('id', jobId);

  } catch (err) {
    await supabase
      .from('training_jobs')
      .update({ status: 'failed', error: err.message })
      .eq('id', jobId);
  }
}

async function updateJob(jobId, status) {
  await supabase
    .from('training_jobs')
    .update({ status })
    .eq('id', jobId);
}
