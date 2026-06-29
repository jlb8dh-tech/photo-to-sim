import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Job ID required' });
  }

  try {
    const { data: job, error } = await supabase
      .from('training_jobs')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const response = {
      status: job.status,
      videoUrl: job.video_url,
      error: job.error
    };

    if (job.script_json) {
      response.questions = [
        {
          question: 'What was the main safety concern?',
          options: job.script_json.hazards || ['Option A', 'Option B', 'Option C']
        },
        {
          question: 'What should you do first?',
          options: ['Report to supervisor', 'Document hazard', 'Evacuate area']
        }
      ];
    }

    return res.status(200).json(response);
  } catch (err) {
    console.error('Status error:', err);
    return res.status(500).json({ error: err.message });
  }
}
