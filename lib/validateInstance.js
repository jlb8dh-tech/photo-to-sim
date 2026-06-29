// Shared validator: checks an instance object against the template rules.
// Used by both the CLI (validate.js) and the API (after Claude generates an instance).
//
// Returns { ok, errors, warnings, passed } — pure, no file I/O, no process.exit.

function validateInstance(instance) {
  const errors = [];
  const warnings = [];
  const passed = [];

  const fail = (msg) => errors.push(msg);
  const warn = (msg) => warnings.push(msg);
  const ok = (msg) => passed.push(msg);

  const metaFields = [
    'clientId', 'pilotName', 'eyebrow', 'trainingTitle',
    'welcomeTitle', 'welcomeSubtitle', 'siteLabel', 'pilotWeekLabel',
  ];
  metaFields.forEach((f) => {
    if (instance.meta?.[f]) ok(`meta.${f} present`);
    else fail(`meta.${f} is required but missing`);
  });

  ['webhookUrl', 'storageKey', 'languages'].forEach((f) => {
    if (instance.delivery?.[f]) ok(`delivery.${f} present`);
    else fail(`delivery.${f} is required but missing`);
  });

  if (!instance.roles || instance.roles.length === 0) {
    fail('roles array is empty or missing');
  } else {
    ok(`roles: ${instance.roles.length} defined (${instance.roles.join(', ')})`);
  }

  const { totalQuestions, passThreshold } = instance.scoring || {};
  if (!totalQuestions) fail('scoring.totalQuestions missing');
  else ok(`scoring.totalQuestions = ${totalQuestions}`);

  if (!passThreshold) fail('scoring.passThreshold missing');
  else if (passThreshold > totalQuestions) fail(`scoring.passThreshold (${passThreshold}) > totalQuestions (${totalQuestions})`);
  else ok(`scoring.passThreshold = ${passThreshold} (valid, <= ${totalQuestions})`);

  const langs = instance.delivery?.languages || [];
  langs.forEach((lang) => {
    const qs = instance.questions?.[lang];
    if (!qs) { fail(`questions.${lang} missing`); return; }
    if (qs.length !== totalQuestions) fail(`questions.${lang}: expected ${totalQuestions}, got ${qs.length}`);
    else ok(`questions.${lang}: ${qs.length} question(s) — correct count`);

    qs.forEach((q, qi) => {
      const correctCount = (q.answers || []).filter((a) => a.correct).length;
      if (correctCount !== 1) fail(`questions.${lang}[${qi}] has ${correctCount} correct answers — must be exactly 1`);
      else ok(`questions.${lang}[${qi}] "${q.num}": exactly 1 correct answer`);

      (q.answers || []).forEach((a, ai) => {
        if (!a.fb || a.fb.trim().length < 20) warn(`questions.${lang}[${qi}].answers[${ai}] (${a.key}): feedback seems very short`);
      });
    });
  });

  langs.forEach((lang) => {
    const vids = instance.videos?.[lang];
    if (!vids) { fail(`videos.${lang} missing`); return; }
    if (vids.length !== totalQuestions) fail(`videos.${lang}: expected ${totalQuestions}, got ${vids.length}`);
    else ok(`videos.${lang}: ${vids.length} video path(s) — correct count`);
  });

  langs.forEach((lang) => {
    const rm = instance.roleMessages?.[lang];
    if (!rm) { fail(`roleMessages.${lang} missing`); return; }
    instance.roles?.forEach((role) => {
      if (!rm[role]) fail(`roleMessages.${lang} missing entry for role: "${role}"`);
      else {
        if (!rm[role].pass) fail(`roleMessages.${lang}["${role}"].pass missing`);
        else ok(`roleMessages.${lang}["${role}"].pass present`);
        if (!rm[role].fail) fail(`roleMessages.${lang}["${role}"].fail missing`);
        else ok(`roleMessages.${lang}["${role}"].fail present`);
      }
    });
  });

  const adminFields = ['dashboardTitle', 'context', 'pilotBadge', 'placeholderCompleted', 'placeholderTotal'];
  adminFields.forEach((f) => {
    if (instance.admin?.[f] !== undefined) ok(`admin.${f} present`);
    else fail(`admin.${f} missing`);
  });

  const chart = instance.admin?.chart;
  if (!chart) {
    fail('admin.chart missing');
  } else {
    if (chart.labels?.length !== totalQuestions) fail(`admin.chart.labels: expected ${totalQuestions}, got ${chart.labels?.length}`);
    else ok(`admin.chart.labels: ${chart.labels.length} label(s) — correct count`);

    if (chart.failPct?.length !== totalQuestions) fail(`admin.chart.failPct: expected ${totalQuestions}, got ${chart.failPct?.length}`);
    else ok('admin.chart.failPct: correct count');

    if (chart.passPct?.length !== totalQuestions) fail(`admin.chart.passPct: expected ${totalQuestions}, got ${chart.passPct?.length}`);
    else ok('admin.chart.passPct: correct count');

    chart.labels?.forEach((_, i) => {
      const sum = (chart.failPct?.[i] || 0) + (chart.passPct?.[i] || 0);
      if (sum !== 100) warn(`admin.chart[${i}]: failPct + passPct = ${sum}, expected 100`);
      else ok(`admin.chart[${i}]: failPct + passPct = 100`);
    });
  }

  const hazards = instance.admin?.hazards;
  if (!hazards || hazards.length === 0) warn('admin.hazards is empty — dashboard will have no hazard data');
  else ok(`admin.hazards: ${hazards.length} hazard(s) defined`);

  if (!instance.$template) warn('instance.$template reference missing — cannot confirm which template version this targets');
  else ok(`$template reference: ${instance.$template}`);

  return { ok: errors.length === 0, errors, warnings, passed };
}

module.exports = { validateInstance };
