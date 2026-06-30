'use client';

import { useCallback, useRef, useState } from 'react';

type Photo = { base64: string; dataUrl: string; mediaType: string };

const LANGS = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
];

const STEPS = [
  'Reading the facility photo',
  'Identifying hazardous energy sources',
  'Writing scenario-based questions',
  'Generating role-specific feedback',
  'Validating against the template',
];

// Downscale + re-encode in the browser so we never POST a giant base64 blob.
function fileToBase64(file: File, maxDim = 1024, quality = 0.82): Promise<Photo> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const scale = maxDim / Math.max(width, height);
        width = Math.round(width * scale);
        height = Math.round(height * scale);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ base64: dataUrl.split(',')[1], dataUrl, mediaType: 'image/jpeg' });
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function Home() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [langs, setLangs] = useState<string[]>(['en']);
  const [numQ, setNumQ] = useState(2);
  const [hint, setHint] = useState('');
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(-1);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = useCallback(async (file?: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    setError('');
    try {
      setPhoto(await fileToBase64(file));
    } catch {
      setError('Could not read that image. Try a JPG or PNG.');
    }
  }, []);

  const toggleLang = (code: string) => {
    setLangs((prev) => (prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]));
  };

  const generate = async () => {
    setBusy(true);
    setResult(null);
    setError('');
    setPicks({});
    // Animate the step ticker while the request is in flight.
    let i = 0;
    setStep(0);
    const ticker = setInterval(() => {
      i = Math.min(i + 1, STEPS.length - 1);
      setStep(i);
    }, 1400);
    try {
      const res = await fetch('/api/generate-training', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoBase64: photo?.base64,
          mediaType: photo?.mediaType,
          languages: langs.length ? langs : ['en'],
          totalQuestions: numQ,
          clientHint: hint,
        }),
      });
      const data = await res.json();
      clearInterval(ticker);
      setStep(STEPS.length);
      setResult(data);
    } catch (e: any) {
      clearInterval(ticker);
      setError('Generation failed: ' + (e?.message || e));
    } finally {
      setBusy(false);
      setTimeout(() => setStep(-1), 600);
    }
  };

  const instance = result?.instance;
  const activeLang = langs.includes('en') ? 'en' : langs[0] || 'en';
  const questions = instance?.questions?.[activeLang] || [];

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(instance, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (instance.instanceId || 'instance') + '.json';
    a.click();
  };

  return (
    <>
      <main>
        <header className="hero">
          <a className="signin" href="/login">Sign in</a>
          <div className="brand">BLCK&nbsp;UNICRN</div>
          <h1>Photo&nbsp;→&nbsp;Sim</h1>
          <p className="tag">
            Drop a photo of any facility. Claude reads the hazards and writes a deployable,
            scenario-based safety simulation — scenario, quiz, feedback, and dashboard.
          </p>
        </header>

        <section className="card">
          <div
            className={'drop' + (dragOver ? ' over' : '') + (photo ? ' has' : '')}
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); onFile(e.dataTransfer.files?.[0]); }}
          >
            {photo ? (
              <img src={photo.dataUrl} alt="facility" className="preview" />
            ) : (
              <div className="dropmsg">
                <div className="plus">＋</div>
                <strong>Drop a facility photo</strong>
                <span>or click to browse · JPG / PNG</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </div>

          <div className="controls">
            <div className="ctrl">
              <label>Languages</label>
              <div className="chips">
                {LANGS.map((l) => (
                  <button
                    key={l.code}
                    className={'chip' + (langs.includes(l.code) ? ' on' : '')}
                    onClick={() => toggleLang(l.code)}
                    type="button"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="ctrl">
              <label>Questions</label>
              <div className="chips">
                {[1, 2].map((n) => (
                  <button
                    key={n}
                    className={'chip' + (numQ === n ? ' on' : '')}
                    onClick={() => setNumQ(n)}
                    type="button"
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="ctrl grow">
              <label>Context hint (optional)</label>
              <input
                className="text"
                placeholder="e.g. chemical plant, night shift, contractors on site"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
              />
            </div>
          </div>

          <button className="go" onClick={generate} disabled={busy}>
            {busy ? 'Generating…' : 'Generate simulation'}
          </button>

          {(busy || step >= 0) && (
            <ol className="steps">
              {STEPS.map((s, i) => (
                <li key={s} className={i < step ? 'done' : i === step ? 'active' : ''}>
                  <span className="dot" />{s}
                </li>
              ))}
            </ol>
          )}
          {error && <p className="err">{error}</p>}
        </section>

        {instance && (
          <section className="card result">
            <ValidationBadge result={result} />

            <div className="metahead">
              <div className="eyebrow">{instance.meta?.eyebrow}</div>
              <h2>{instance.meta?.trainingTitle}</h2>
              <div className="site">{instance.meta?.siteLabel}</div>
              <p className="welcome">{instance.meta?.welcomeSubtitle}</p>
            </div>

            <VideoPanel
              videoEnabled={result?.videoEnabled}
              photo={photo}
              promptText={`Cinematic establishing shot of this facility for a safety briefing — ${instance.meta?.trainingTitle || 'workplace safety'}. Slow camera move, realistic lighting.`}
            />

            {questions.map((q: any, qi: number) => (
              <Question
                key={qi}
                q={q}
                pick={picks[qi]}
                onPick={(k: string) => setPicks((p) => ({ ...p, [qi]: k }))}
                audioEnabled={result?.audioEnabled}
                lang={activeLang}
              />
            ))}

            <div className="hazards">
              <h3>Most-missed hazards</h3>
              {(instance.admin?.hazards || []).map((h: any, i: number) => (
                <div className="haz" key={i}>
                  <span className={'lvl ' + h.level} />
                  <span className="hname">{h.name}</span>
                  <span className="hpct">{h.pct}%</span>
                </div>
              ))}
            </div>

            <div className="actions">
              <button className="ghost" onClick={downloadJson}>↓ Download instance JSON</button>
              <span className="hintnote">Drops straight into your sim template — passes <code>validate.js</code>.</span>
            </div>
          </section>
        )}
      </main>
      <Styles />
    </>
  );
}

function ValidationBadge({ result }: { result: any }) {
  const v = result?.validation;
  const ok = v?.ok;
  const warnings = v?.warnings?.length || 0;
  const modeLabel =
    ({
      live: 'Live · Claude vision',
      mock: 'Sample output (no API key set)',
      'mock-no-photo': 'Sample output (no photo)',
      'error-fallback': 'Fallback sample (generation error)',
    } as Record<string, string>)[result?.mode] || result?.mode;
  return (
    <div className={'vbadge ' + (ok ? 'pass' : 'failv')}>
      <strong>{ok ? '✓ Valid against template' : '✗ Validation errors'}</strong>
      <span className="vmode">{modeLabel}{result?.model ? ` · ${result.model}` : ''}</span>
      {warnings > 0 && <span className="vwarn">{warnings} warning{warnings > 1 ? 's' : ''}</span>}
      {result?.error && <span className="verr">{result.error}</span>}
      {!ok && (v?.errors || []).slice(0, 4).map((e: string, i: number) => <span key={i} className="verr">{e}</span>)}
    </div>
  );
}

function VideoPanel({
  videoEnabled,
  photo,
  promptText,
}: {
  videoEnabled?: boolean;
  photo: Photo | null;
  promptText: string;
}) {
  const [status, setStatus] = useState<'idle' | 'starting' | 'polling' | 'done' | 'failed' | 'mock'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [msg, setMsg] = useState('');
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const stop = () => { if (timer.current) { clearInterval(timer.current); timer.current = null; } };

  const poll = (taskId: string) => {
    let tries = 0;
    stop();
    timer.current = setInterval(async () => {
      tries += 1;
      if (tries > 45) { // ~3 min ceiling
        stop();
        setStatus('failed');
        setMsg('Timed out waiting for Runway. Try again.');
        return;
      }
      try {
        const res = await fetch(`/api/video/${taskId}`);
        const d = await res.json();
        if (typeof d.progress === 'number') setProgress(Math.round(d.progress * 100));
        if (d.status === 'SUCCEEDED' && d.videoUrl) {
          stop();
          setVideoUrl(d.videoUrl);
          setStatus('done');
        } else if (d.status === 'FAILED' || d.error) {
          stop();
          setStatus('failed');
          setMsg(d.error ? String(d.error) : 'Runway reported a failure.');
        }
      } catch {
        // transient — keep polling
      }
    }, 4000);
  };

  const start = async () => {
    setStatus('starting');
    setVideoUrl(null);
    setProgress(0);
    setMsg('');
    try {
      const res = await fetch('/api/video/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoBase64: photo?.base64, mediaType: photo?.mediaType, promptText }),
      });
      const d = await res.json();
      if (d.mode === 'mock') { setStatus('mock'); return; }
      if (!res.ok || !d.taskId) { setStatus('failed'); setMsg(d.error || 'Could not start video.'); return; }
      setStatus('polling');
      poll(d.taskId);
    } catch (e: any) {
      setStatus('failed');
      setMsg(e?.message || 'Could not start video.');
    }
  };

  // Without a photo there's nothing to animate (e.g. mock-no-photo run).
  const noPhoto = !photo;

  return (
    <div className="vpanel">
      <div className="vhead">
        <h3>Scenario video</h3>
        {videoEnabled && !noPhoto && status !== 'polling' && status !== 'starting' && (
          <button className="vbtn" onClick={start} type="button">
            {status === 'done' ? '↻ Regenerate' : '▶ Generate video (Runway)'}
          </button>
        )}
      </div>

      {noPhoto && <p className="vnote">Upload a facility photo to generate a scenario video.</p>}

      {!videoEnabled && !noPhoto && status === 'idle' && (
        <p className="vnote">Set <code>RUNWAY_API_KEY</code> to generate a video from this photo. (Other features are unaffected.)</p>
      )}
      {videoEnabled && !noPhoto && status === 'idle' && (
        <p className="vnote">Generate a short cinematic clip from the uploaded photo with Runway gen4_turbo.</p>
      )}

      {(status === 'starting' || status === 'polling') && (
        <div className="vprog">
          <div className="spinner" />
          <span>{status === 'starting' ? 'Starting Runway task…' : `Rendering video… ${progress ? progress + '%' : ''}`}</span>
        </div>
      )}

      {status === 'mock' && (
        <div className="vmock">
          <strong>Mock preview</strong>
          <span>Video generation runs live once <code>RUNWAY_API_KEY</code> is set. The prompt that would be sent:</span>
          <em>{promptText}</em>
        </div>
      )}

      {status === 'failed' && <p className="verr">⚠ {msg}</p>}

      {status === 'done' && videoUrl && (
        <video className="vvideo" src={videoUrl} controls autoPlay loop muted />
      )}
    </div>
  );
}

function Question({
  q,
  pick,
  onPick,
  audioEnabled,
  lang,
}: {
  q: any;
  pick?: string;
  onPick: (k: string) => void;
  audioEnabled?: boolean;
  lang: string;
}) {
  const answered = pick != null;
  const [audioState, setAudioState] = useState<'idle' | 'loading' | 'playing' | 'error'>('idle');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playScenario = async () => {
    if (audioState === 'playing' && audioRef.current) {
      audioRef.current.pause();
      setAudioState('idle');
      return;
    }
    setAudioState('loading');
    try {
      const res = await fetch('/api/voiceover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: q.text, language: lang }),
      });
      if (!res.ok) throw new Error('tts');
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setAudioState('idle'); URL.revokeObjectURL(url); };
      audio.onerror = () => setAudioState('error');
      await audio.play();
      setAudioState('playing');
    } catch {
      setAudioState('error');
    }
  };

  const audioLabel = {
    idle: '▶ Play scenario',
    loading: '… generating audio',
    playing: '❚❚ Stop',
    error: '⚠ Audio failed — retry',
  }[audioState];

  return (
    <div className="q">
      <div className="qnum">{q.num}</div>
      <p className="qtext">{q.text}</p>
      {audioEnabled && (
        <button
          className={'play' + (audioState === 'playing' ? ' on' : '')}
          onClick={playScenario}
          disabled={audioState === 'loading'}
          type="button"
        >
          {audioLabel}
        </button>
      )}
      {q.sub && <div className="qsub">{q.sub}</div>}
      <div className="answers">
        {q.answers.map((a: any) => {
          const chosen = pick === a.key;
          let cls = 'ans';
          if (answered) {
            if (a.correct) cls += ' correct';
            else if (chosen) cls += ' wrong';
          }
          return (
            <button key={a.key} className={cls} onClick={() => !answered && onPick(a.key)} disabled={answered} type="button">
              <span className="akey">{a.key}</span>
              <span className="atext">{a.text}</span>
              {answered && a.correct && <span className="mark">✓</span>}
              {answered && chosen && !a.correct && <span className="mark">✗</span>}
            </button>
          );
        })}
      </div>
      {answered && (
        <div className={'fb ' + (q.answers.find((a: any) => a.key === pick)?.correct ? 'good' : 'bad')}>
          {q.answers.find((a: any) => a.key === pick)?.fb}
        </div>
      )}
    </div>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Manrope:wght@400;500;700;800&display=swap');
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #07070c; color: #e9e9f2; font-family: 'Manrope', system-ui, sans-serif; }
      a, code { color: #67e8f9; }
      main { max-width: 860px; margin: 0 auto; padding: 48px 20px 96px; }
      .hero { text-align: center; margin-bottom: 36px; position: relative; }
      .signin { position: absolute; top: 0; right: 0; font-size: 13px; font-weight: 700; text-decoration: none; color: #9aa0b5; }
      .signin:hover { color: #67e8f9; }
      .brand { letter-spacing: .35em; font-weight: 800; font-size: 13px; color: #a78bfa; }
      h1 { font-family: 'Bebas Neue', sans-serif; font-size: 76px; line-height: .95; margin: 8px 0 6px;
           background: linear-gradient(100deg, #a78bfa, #67e8f9); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .tag { color: #9aa0b5; max-width: 560px; margin: 0 auto; font-size: 15px; }
      .card { background: linear-gradient(180deg, #11111c, #0c0c14); border: 1px solid #1f1f30; border-radius: 18px; padding: 24px; margin-bottom: 24px; }
      .drop { border: 1.5px dashed #34344d; border-radius: 14px; min-height: 220px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: .15s; overflow: hidden; background: #0a0a12; }
      .drop.over { border-color: #a78bfa; background: #12101e; }
      .drop.has { border-style: solid; }
      .dropmsg { text-align: center; color: #8b90a8; display: grid; gap: 4px; }
      .dropmsg strong { color: #d6d8e6; font-size: 18px; }
      .plus { font-size: 40px; color: #a78bfa; }
      .preview { width: 100%; max-height: 360px; object-fit: contain; }
      .controls { display: flex; flex-wrap: wrap; gap: 18px; margin: 20px 0 4px; }
      .ctrl { display: grid; gap: 8px; }
      .ctrl.grow { flex: 1; min-width: 220px; }
      .ctrl label { font-size: 12px; letter-spacing: .12em; text-transform: uppercase; color: #7c819a; }
      .chips { display: flex; gap: 8px; }
      .chip { background: #15152270; border: 1px solid #2a2a40; color: #c7c9d9; padding: 9px 14px; border-radius: 10px; cursor: pointer; font-weight: 600; font-size: 14px; }
      .chip.on { background: linear-gradient(100deg, #a78bfa, #67e8f9); color: #07070c; border-color: transparent; }
      .text { background: #0a0a12; border: 1px solid #2a2a40; color: #e9e9f2; padding: 11px 13px; border-radius: 10px; width: 100%; font-size: 14px; font-family: inherit; }
      .go { margin-top: 18px; width: 100%; padding: 15px; border: none; border-radius: 12px; font-weight: 800; font-size: 16px; cursor: pointer;
            background: linear-gradient(100deg, #a78bfa, #67e8f9); color: #07070c; }
      .go:disabled { opacity: .6; cursor: default; }
      .steps { list-style: none; padding: 0; margin: 22px 0 0; display: grid; gap: 10px; }
      .steps li { display: flex; align-items: center; gap: 12px; color: #6c7088; font-size: 14px; }
      .steps li .dot { width: 9px; height: 9px; border-radius: 50%; background: #2a2a40; flex: none; }
      .steps li.active { color: #e9e9f2; }
      .steps li.active .dot { background: #67e8f9; box-shadow: 0 0 0 4px #67e8f933; }
      .steps li.done { color: #9aa0b5; }
      .steps li.done .dot { background: #a78bfa; }
      .err { color: #fca5a5; margin-top: 14px; }
      .vbadge { display: flex; flex-wrap: wrap; align-items: center; gap: 10px 14px; padding: 12px 16px; border-radius: 12px; margin-bottom: 22px; font-size: 13px; }
      .vbadge.pass { background: #0c2018; border: 1px solid #1c5b3f; }
      .vbadge.failv { background: #221013; border: 1px solid #5b1c28; }
      .vbadge strong { font-size: 14px; }
      .vmode { color: #9aa0b5; }
      .vwarn { color: #fbbf24; }
      .verr { color: #fca5a5; flex-basis: 100%; }
      .metahead { margin-bottom: 26px; }
      .eyebrow { color: #a78bfa; letter-spacing: .18em; text-transform: uppercase; font-size: 12px; font-weight: 700; }
      .metahead h2 { font-family: 'Bebas Neue', sans-serif; font-size: 40px; margin: 6px 0; letter-spacing: .02em; }
      .site { color: #9aa0b5; font-size: 14px; }
      .welcome { color: #b9bdd0; font-size: 15px; margin-top: 12px; }
      .q { border-top: 1px solid #1f1f30; padding: 22px 0; }
      .qnum { color: #67e8f9; font-weight: 800; letter-spacing: .1em; font-size: 12px; text-transform: uppercase; }
      .qtext { font-size: 17px; line-height: 1.5; margin: 8px 0; }
      .qsub { color: #8b90a8; font-size: 13px; margin-bottom: 14px; font-style: italic; }
      .play { display: inline-flex; align-items: center; gap: 6px; margin: 4px 0 12px; background: #15102270; border: 1px solid #3a2a55; color: #c9b8f0; padding: 7px 13px; border-radius: 999px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 600; }
      .play:hover:not(:disabled) { border-color: #a78bfa; color: #e9e9f2; }
      .play.on { background: linear-gradient(100deg, #a78bfa, #67e8f9); color: #07070c; border-color: transparent; }
      .play:disabled { opacity: .7; cursor: default; }
      .answers { display: grid; gap: 10px; }
      .ans { display: flex; gap: 12px; align-items: flex-start; text-align: left; background: #0a0a12; border: 1px solid #24243a; color: #dcdef0; padding: 13px 15px; border-radius: 11px; cursor: pointer; font-family: inherit; font-size: 14px; line-height: 1.45; }
      .ans:hover:not(:disabled) { border-color: #a78bfa; }
      .ans:disabled { cursor: default; }
      .ans.correct { border-color: #1c5b3f; background: #0c2018; }
      .ans.wrong { border-color: #5b1c28; background: #221013; }
      .akey { font-weight: 800; color: #a78bfa; flex: none; }
      .atext { flex: 1; }
      .mark { font-weight: 800; }
      .ans.correct .mark { color: #34d399; }
      .ans.wrong .mark { color: #fca5a5; }
      .fb { margin-top: 12px; padding: 13px 15px; border-radius: 11px; font-size: 14px; line-height: 1.5; }
      .fb.good { background: #0c2018; color: #b7f0d3; }
      .fb.bad { background: #221013; color: #f3c4cb; }
      .vpanel { border-top: 1px solid #1f1f30; padding-top: 22px; margin-bottom: 8px; }
      .vhead { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
      .vhead h3 { font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: #8b90a8; margin: 0; }
      .vbtn { background: #15102270; border: 1px solid #3a2a55; color: #c9b8f0; padding: 9px 15px; border-radius: 999px; cursor: pointer; font-family: inherit; font-size: 13px; font-weight: 700; }
      .vbtn:hover { border-color: #a78bfa; color: #e9e9f2; }
      .vnote { color: #8b90a8; font-size: 14px; margin: 12px 0 0; }
      .vprog { display: flex; align-items: center; gap: 12px; margin-top: 16px; color: #c7c9d9; font-size: 14px; }
      .spinner { width: 16px; height: 16px; border-radius: 50%; border: 2px solid #2a2a40; border-top-color: #67e8f9; animation: spin 0.8s linear infinite; flex: none; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .vmock { display: grid; gap: 6px; margin-top: 14px; padding: 14px 16px; border: 1px dashed #34344d; border-radius: 12px; background: #0a0a12; }
      .vmock strong { color: #c9b8f0; font-size: 14px; }
      .vmock span { color: #8b90a8; font-size: 13px; }
      .vmock em { color: #b9bdd0; font-size: 13px; }
      .vvideo { width: 100%; border-radius: 12px; margin-top: 16px; background: #000; }
      .hazards { border-top: 1px solid #1f1f30; padding-top: 22px; margin-top: 8px; }
      .hazards h3 { font-size: 13px; letter-spacing: .14em; text-transform: uppercase; color: #8b90a8; }
      .haz { display: flex; align-items: center; gap: 12px; padding: 9px 0; border-bottom: 1px solid #14141f; }
      .lvl { width: 10px; height: 10px; border-radius: 50%; flex: none; }
      .lvl.red { background: #ef4444; } .lvl.amber { background: #f59e0b; } .lvl.green { background: #22c55e; }
      .hname { flex: 1; font-size: 14px; }
      .hpct { color: #9aa0b5; font-weight: 700; }
      .actions { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; margin-top: 24px; }
      .ghost { background: transparent; border: 1px solid #34344d; color: #e9e9f2; padding: 12px 18px; border-radius: 11px; cursor: pointer; font-weight: 700; font-family: inherit; }
      .ghost:hover { border-color: #a78bfa; }
      .hintnote { color: #8b90a8; font-size: 13px; }
      @media (max-width: 560px) { h1 { font-size: 56px; } }
    `}</style>
  );
}
