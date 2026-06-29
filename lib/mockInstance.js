// Deterministic sample sim, used when ANTHROPIC_API_KEY is not set (offline demo)
// or as a guaranteed fallback if generation fails. Conforms to template.json.

const QUESTION_BANK = {
  en: [
    {
      num: 'Q1 of N',
      text: "You arrive at a warehouse charging bay to service an electric forklift. The charger is still plugged into the wall panel, the battery connector is attached, and a coolant/hydraulic line on the lift mast shows residual pressure. The forklift key is off. A coworker says \"it's off, just go ahead.\" What is the correct first action?",
      sub: 'Hazardous-energy isolation before service.',
      answers: [
        { key: 'A', text: 'Begin work — the key is off and the lift is parked.', correct: false, fb: 'Incorrect. Key-off does not isolate stored energy: the charger is still energized at the wall panel, the battery connector carries DC voltage, and the hydraulic line holds residual pressure. Each is an independent energy source that must be controlled.' },
        { key: 'B', text: 'Disconnect the charger at the panel, unplug the battery connector, relieve hydraulic pressure, then apply your lock and verify zero energy.', correct: true, fb: 'Correct. This isolates every energy source — AC at the panel, DC at the battery, and stored hydraulic pressure — then locks and verifies zero state before any service begins, per OSHA 29 CFR 1910.147.' },
        { key: 'C', text: 'Trust your coworker and start, but keep an eye on the gauges.', correct: false, fb: 'Watching a gauge is not energy control. A live electrical or hydraulic source can injure you before a gauge reading helps. Isolate and verify first.' },
        { key: 'D', text: 'Note the live charger in the log and service the lift anyway.', correct: false, fb: 'Documentation never substitutes for isolation. Working on energized equipment risks shock, arc flash, and hydraulic injection injury. Control the hazard first, document after.' },
      ],
    },
    {
      num: 'Q2 of N',
      text: 'Your lockout is in place on the charging panel. A contractor electrician arrives to help and asks: "Your lock is already on — should I just sign your tag, or do I need my own lock?" What do you tell them?',
      sub: 'Multi-employer lockout/tagout.',
      answers: [
        { key: 'A', text: 'Your lock covers the panel, so they can start safely.', correct: false, fb: 'Incorrect. Under OSHA 29 CFR 1910.147, every authorized worker exposed to the hazard must apply their own personal lock. Your lock protects you, not them.' },
        { key: 'B', text: 'They must apply their own personal lock to the panel, in addition to yours, before starting.', correct: true, fb: 'Correct. Multi-employer lockout requires each exposed worker to apply their own lock — the hasp holds multiple locks for exactly this reason, and each worker removes only their own.' },
        { key: 'C', text: 'They should sign the lockout log confirming your lock is enough.', correct: false, fb: 'A signature does not stop re-energization. The physical lock applied by the worker is the protection; a log entry is only supplementary documentation.' },
        { key: 'D', text: 'Remove your lock so they can put theirs on instead.', correct: false, fb: 'Removing your lock creates a window with no protection at all. Lockout is additive — each worker adds a lock without removing any existing one.' },
      ],
    },
  ],
  es: [
    {
      num: 'P1 de N',
      text: 'Llega a una bahía de carga para dar servicio a un montacargas eléctrico. El cargador sigue conectado al panel de pared, el conector de la batería está puesto y una línea hidráulica muestra presión residual. La llave está apagada. Un compañero dice "está apagado, adelante". ¿Cuál es la primera acción correcta?',
      sub: 'Aislamiento de energía peligrosa antes del servicio.',
      answers: [
        { key: 'A', text: 'Comenzar — la llave está apagada y el montacargas está estacionado.', correct: false, fb: 'Incorrecto. Apagar la llave no aísla la energía almacenada: el cargador sigue energizado, el conector de batería tiene voltaje CC y la línea hidráulica mantiene presión. Cada fuente debe controlarse.' },
        { key: 'B', text: 'Desconectar el cargador en el panel, desconectar la batería, liberar la presión hidráulica, aplicar su candado y verificar energía cero.', correct: true, fb: 'Correcto. Esto aísla cada fuente — CA en el panel, CC en la batería y presión hidráulica — luego bloquea y verifica el estado de energía cero antes de comenzar, según OSHA 29 CFR 1910.147.' },
        { key: 'C', text: 'Confiar en el compañero y comenzar, vigilando los manómetros.', correct: false, fb: 'Vigilar un manómetro no es control de energía. Una fuente eléctrica o hidráulica viva puede lesionarlo antes de que una lectura ayude. Aísle y verifique primero.' },
        { key: 'D', text: 'Anotar el cargador conectado en el registro y dar servicio de todos modos.', correct: false, fb: 'La documentación nunca sustituye al aislamiento. Trabajar con equipo energizado arriesga descarga, arco eléctrico e inyección hidráulica. Controle el peligro primero.' },
      ],
    },
    {
      num: 'P2 de N',
      text: 'Su bloqueo está aplicado en el panel de carga. Un electricista contratista llega y pregunta: "Su candado ya está puesto, ¿solo firmo su etiqueta o necesito mi propio candado?" ¿Qué le responde?',
      sub: 'Bloqueo/etiquetado multi-empleador.',
      answers: [
        { key: 'A', text: 'Su candado cubre el panel, puede comenzar de forma segura.', correct: false, fb: 'Incorrecto. Según OSHA 29 CFR 1910.147, cada trabajador autorizado expuesto debe aplicar su propio candado personal. Su candado lo protege a usted, no a él.' },
        { key: 'B', text: 'Debe aplicar su propio candado personal al panel, además del suyo, antes de comenzar.', correct: true, fb: 'Correcto. El bloqueo multi-empleador exige que cada trabajador expuesto aplique su propio candado — el portacandados admite varios, y cada quien retira solo el suyo.' },
        { key: 'C', text: 'Debe firmar el registro confirmando que su candado es suficiente.', correct: false, fb: 'Una firma no detiene la re-energización. El candado físico aplicado por el trabajador es la protección; el registro es solo documentación complementaria.' },
        { key: 'D', text: 'Retirar su candado para que él ponga el suyo en su lugar.', correct: false, fb: 'Retirar su candado crea una ventana sin protección. El bloqueo es aditivo — cada trabajador agrega un candado sin retirar ninguno existente.' },
      ],
    },
  ],
};

const ROLE_MESSAGES = {
  en: {
    pass: 'Strong response. This is the discipline that keeps you and your coworkers safe on every service.',
    fail: 'Workers face this exact decision point routinely. Every service is a fresh energy audit — no assumptions, no shortcuts.',
  },
  es: {
    pass: 'Buena respuesta. Esta disciplina es lo que los mantiene seguros a usted y a sus compañeros en cada servicio.',
    fail: 'Los trabajadores enfrentan este punto de decisión con frecuencia. Cada servicio es una nueva auditoría de energía — sin suposiciones.',
  },
};

function buildMockInstance({ languages = ['en'], totalQuestions = 2 } = {}) {
  const langs = languages.filter((l) => QUESTION_BANK[l]).length ? languages.filter((l) => QUESTION_BANK[l]) : ['en'];
  const n = Math.max(1, Math.min(totalQuestions, 2));

  const roles = ['Maintenance Technician', 'Contractor', 'Supervisor', 'EHS Leader'];

  const questions = {};
  const videos = {};
  const roleMessages = {};
  langs.forEach((lang) => {
    questions[lang] = QUESTION_BANK[lang].slice(0, n).map((q, i) => ({
      ...q,
      num: q.num.replace('N', String(n)).replace(/Q1|P1/, i === 0 ? (lang === 'es' ? 'P1' : 'Q1') : (lang === 'es' ? 'P2' : 'Q2')),
    }));
    videos[lang] = Array.from({ length: n }, (_, i) => `scene_q${i + 1}_${lang}.mp4`);
    roleMessages[lang] = {};
    roles.forEach((r) => { roleMessages[lang][r] = { ...ROLE_MESSAGES[lang] }; });
  });

  const labels = Array.from({ length: n }, (_, i) => `Q${i + 1}`);
  return {
    $template: 'circor-loto@1.0.0',
    instanceId: 'sample-warehouse-charging-bay',
    createdAt: '2026-01-01',
    status: 'active',
    _mock: true,
    meta: {
      clientId: 'demo',
      pilotName: 'Photo-to-Sim Demo',
      eyebrow: 'Workplace Safety Training',
      trainingTitle: 'Hazardous Energy Awareness',
      welcomeTitle: 'Welcome, team.',
      welcomeSubtitle: 'A personalized safety simulation generated from a photo of your facility. (Sample output — set ANTHROPIC_API_KEY for live generation.)',
      siteLabel: 'Warehouse Charging Bay — Sample',
      pilotWeekLabel: 'Demo — Week 1',
    },
    delivery: {
      webhookUrl: 'https://script.google.com/macros/s/REPLACE_ME/exec',
      storageKey: 'demoUsers',
      languages: langs,
    },
    roles,
    modules: [
      { num: '01', title: 'Welcome & Safety Matters', status: 'ready' },
      { num: '02', title: 'Facility Hazard Simulation', status: 'ready' },
      { num: '03', title: 'Knowledge Check', status: 'locked', lockMsg: 'Unlocks after Module 2' },
    ],
    scoring: { totalQuestions: n, passThreshold: n },
    videos,
    questions,
    roleMessages,
    admin: {
      dashboardTitle: 'Photo-to-Sim Demo Dashboard',
      context: `Warehouse charging bay · ${langs.join(' + ')} · Sample data`,
      pilotBadge: 'DEMO — SAMPLE DATA',
      placeholderCompleted: 12,
      placeholderTotal: 18,
      hazards: [
        { name: 'Multi-source energy isolation', pct: 74, level: 'red' },
        { name: 'Multi-employer lockout compliance', pct: 61, level: 'red' },
        { name: 'Hydraulic pressure verification', pct: 48, level: 'amber' },
        { name: 'Zero-energy verification', pct: 22, level: 'green' },
      ],
      chart: {
        labels,
        failPct: Array.from({ length: n }, (_, i) => (i === 0 ? 79 : 64)),
        passPct: Array.from({ length: n }, (_, i) => (i === 0 ? 21 : 36)),
      },
    },
  };
}

module.exports = { buildMockInstance };
