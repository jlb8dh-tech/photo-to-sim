const allowedLanguages = new Set(["en", "es", "fr", "pt"]);
const allowedLevels = new Set(["red", "amber", "green"]);
const allowedModuleStatuses = new Set(["ready", "locked"]);
const allowedStatuses = new Set(["active", "draft"]);

function typeOf(value) {
  if (Array.isArray(value)) return "array";
  if (value === null) return "null";
  return typeof value;
}

function requireObject(value, path, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${path} must be an object`);
    return false;
  }
  return true;
}

function requireArray(value, path, errors, { minItems, maxItems } = {}) {
  if (!Array.isArray(value)) {
    errors.push(`${path} must be an array`);
    return false;
  }
  if (minItems !== undefined && value.length < minItems) {
    errors.push(`${path} must contain at least ${minItems} item(s)`);
  }
  if (maxItems !== undefined && value.length > maxItems) {
    errors.push(`${path} must contain at most ${maxItems} item(s)`);
  }
  return true;
}

function requireString(value, path, errors) {
  if (typeof value !== "string") {
    errors.push(`${path} must be a string, got ${typeOf(value)}`);
    return false;
  }
  return true;
}

function requireInteger(value, path, errors) {
  if (!Number.isInteger(value)) {
    errors.push(`${path} must be an integer, got ${typeOf(value)}`);
    return false;
  }
  return true;
}

function requireBoolean(value, path, errors) {
  if (typeof value !== "boolean") {
    errors.push(`${path} must be a boolean, got ${typeOf(value)}`);
    return false;
  }
  return true;
}

function validateTopLevel(instance, errors) {
  requireString(instance.$template, "$template", errors);
  requireString(instance.instanceId, "instanceId", errors);
  requireString(instance.createdAt, "createdAt", errors);
  requireString(instance.status, "status", errors);

  if (typeof instance.status === "string" && !allowedStatuses.has(instance.status)) {
    errors.push('status must be "active" or "draft"');
  }
}

function validateMeta(instance, errors) {
  if (!requireObject(instance.meta, "meta", errors)) return;
  for (const field of [
    "clientId",
    "pilotName",
    "eyebrow",
    "trainingTitle",
    "welcomeTitle",
    "welcomeSubtitle",
    "siteLabel",
    "pilotWeekLabel"
  ]) {
    requireString(instance.meta[field], `meta.${field}`, errors);
  }
}

function validateDelivery(instance, errors) {
  if (!requireObject(instance.delivery, "delivery", errors)) return;
  requireString(instance.delivery.webhookUrl, "delivery.webhookUrl", errors);
  requireString(instance.delivery.storageKey, "delivery.storageKey", errors);

  if (requireArray(instance.delivery.languages, "delivery.languages", errors, { minItems: 1 })) {
    for (const [index, lang] of instance.delivery.languages.entries()) {
      requireString(lang, `delivery.languages[${index}]`, errors);
      if (!allowedLanguages.has(lang)) {
        errors.push(`delivery.languages[${index}] must be one of en, es, fr, pt`);
      }
    }
  }
}

function validateRoles(instance, errors) {
  if (!requireArray(instance.roles, "roles", errors, { minItems: 1 })) return;
  for (const [index, role] of instance.roles.entries()) {
    requireString(role, `roles[${index}]`, errors);
  }
}

function validateModules(instance, errors) {
  if (!requireArray(instance.modules, "modules", errors, { minItems: 1 })) return;
  for (const [index, mod] of instance.modules.entries()) {
    const base = `modules[${index}]`;
    if (!requireObject(mod, base, errors)) continue;
    requireString(mod.num, `${base}.num`, errors);
    requireString(mod.title, `${base}.title`, errors);
    requireString(mod.status, `${base}.status`, errors);
    if (typeof mod.status === "string" && !allowedModuleStatuses.has(mod.status)) {
      errors.push(`${base}.status must be "ready" or "locked"`);
    }
    if (mod.lockMsg !== undefined) {
      requireString(mod.lockMsg, `${base}.lockMsg`, errors);
    }
  }
}

function validateQuestions(instance, errors) {
  if (!requireObject(instance.questions, "questions", errors)) return;
  const languages = instance.delivery?.languages ?? [];

  for (const lang of languages) {
    const questions = instance.questions[lang];
    if (!requireArray(questions, `questions.${lang}`, errors, { minItems: 1 })) continue;

    for (const [questionIndex, question] of questions.entries()) {
      const base = `questions.${lang}[${questionIndex}]`;
      if (!requireObject(question, base, errors)) continue;
      requireString(question.num, `${base}.num`, errors);
      requireString(question.text, `${base}.text`, errors);
      requireString(question.sub, `${base}.sub`, errors);

      if (!requireArray(question.answers, `${base}.answers`, errors, { minItems: 3, maxItems: 5 })) continue;

      let correctCount = 0;
      for (const [answerIndex, answer] of question.answers.entries()) {
        const answerBase = `${base}.answers[${answerIndex}]`;
        if (!requireObject(answer, answerBase, errors)) continue;
        requireString(answer.key, `${answerBase}.key`, errors);
        requireString(answer.text, `${answerBase}.text`, errors);
        requireBoolean(answer.correct, `${answerBase}.correct`, errors);
        requireString(answer.fb, `${answerBase}.fb`, errors);
        if (answer.correct === true) correctCount += 1;
      }

      if (correctCount !== 1) {
        errors.push(`${base}.answers must contain exactly one correct answer`);
      }
    }
  }
}

function validateVideos(instance, errors) {
  if (!requireObject(instance.videos, "videos", errors)) return;
  const languages = instance.delivery?.languages ?? [];
  const totalQuestions = instance.scoring?.totalQuestions;

  for (const lang of languages) {
    const videos = instance.videos[lang];
    if (!requireArray(videos, `videos.${lang}`, errors)) continue;
    if (Number.isInteger(totalQuestions) && videos.length !== totalQuestions) {
      errors.push(`videos.${lang}.length must equal scoring.totalQuestions`);
    }
    for (const [index, video] of videos.entries()) {
      requireString(video, `videos.${lang}[${index}]`, errors);
    }
  }
}

function validateScoring(instance, errors) {
  if (!requireObject(instance.scoring, "scoring", errors)) return;
  requireInteger(instance.scoring.totalQuestions, "scoring.totalQuestions", errors);
  requireInteger(instance.scoring.passThreshold, "scoring.passThreshold", errors);

  if (
    Number.isInteger(instance.scoring.totalQuestions) &&
    Number.isInteger(instance.scoring.passThreshold) &&
    instance.scoring.passThreshold > instance.scoring.totalQuestions
  ) {
    errors.push("scoring.passThreshold must be <= scoring.totalQuestions");
  }

  const languages = instance.delivery?.languages ?? [];
  for (const lang of languages) {
    const questionCount = instance.questions?.[lang]?.length;
    if (Number.isInteger(questionCount) && questionCount !== instance.scoring.totalQuestions) {
      errors.push(`scoring.totalQuestions must equal questions.${lang}.length`);
    }
  }
}

function validateRoleMessages(instance, errors) {
  if (!requireObject(instance.roleMessages, "roleMessages", errors)) return;
  const languages = instance.delivery?.languages ?? [];
  const roles = instance.roles ?? [];

  for (const lang of languages) {
    const messages = instance.roleMessages[lang];
    if (!requireObject(messages, `roleMessages.${lang}`, errors)) continue;

    for (const role of roles) {
      const roleMessage = messages[role];
      if (!requireObject(roleMessage, `roleMessages.${lang}.${role}`, errors)) continue;
      requireString(roleMessage.pass, `roleMessages.${lang}.${role}.pass`, errors);
      requireString(roleMessage.fail, `roleMessages.${lang}.${role}.fail`, errors);
    }
  }
}

function validateAdmin(instance, errors) {
  if (!requireObject(instance.admin, "admin", errors)) return;
  requireString(instance.admin.dashboardTitle, "admin.dashboardTitle", errors);
  requireString(instance.admin.context, "admin.context", errors);
  requireString(instance.admin.pilotBadge, "admin.pilotBadge", errors);
  requireInteger(instance.admin.placeholderCompleted, "admin.placeholderCompleted", errors);
  requireInteger(instance.admin.placeholderTotal, "admin.placeholderTotal", errors);

  if (requireArray(instance.admin.hazards, "admin.hazards", errors)) {
    for (const [index, hazard] of instance.admin.hazards.entries()) {
      const base = `admin.hazards[${index}]`;
      if (!requireObject(hazard, base, errors)) continue;
      requireString(hazard.name, `${base}.name`, errors);
      requireInteger(hazard.pct, `${base}.pct`, errors);
      if (Number.isInteger(hazard.pct) && (hazard.pct < 0 || hazard.pct > 100)) {
        errors.push(`${base}.pct must be between 0 and 100`);
      }
      requireString(hazard.level, `${base}.level`, errors);
      if (typeof hazard.level === "string" && !allowedLevels.has(hazard.level)) {
        errors.push(`${base}.level must be red, amber, or green`);
      }
    }
  }

  if (!requireObject(instance.admin.chart, "admin.chart", errors)) return;
  const { labels, failPct, passPct } = instance.admin.chart;

  requireArray(labels, "admin.chart.labels", errors);
  requireArray(failPct, "admin.chart.failPct", errors);
  requireArray(passPct, "admin.chart.passPct", errors);

  if (Array.isArray(labels) && Number.isInteger(instance.scoring?.totalQuestions) && labels.length !== instance.scoring.totalQuestions) {
    errors.push("admin.chart.labels.length must equal scoring.totalQuestions");
  }

  if (Array.isArray(labels) && Array.isArray(failPct) && labels.length !== failPct.length) {
    errors.push("admin.chart.failPct.length must equal admin.chart.labels.length");
  }
  if (Array.isArray(labels) && Array.isArray(passPct) && labels.length !== passPct.length) {
    errors.push("admin.chart.passPct.length must equal admin.chart.labels.length");
  }

  if (Array.isArray(failPct) && Array.isArray(passPct)) {
    const length = Math.min(failPct.length, passPct.length);
    for (let index = 0; index < length; index += 1) {
      requireInteger(failPct[index], `admin.chart.failPct[${index}]`, errors);
      requireInteger(passPct[index], `admin.chart.passPct[${index}]`, errors);
      if (Number.isInteger(failPct[index]) && Number.isInteger(passPct[index]) && failPct[index] + passPct[index] !== 100) {
        errors.push(`admin.chart.failPct[${index}] + admin.chart.passPct[${index}] must equal 100`);
      }
    }
  }
}

export function validateInstance(instance) {
  const errors = [];
  if (!requireObject(instance, "instance", errors)) {
    return { ok: false, errors };
  }

  validateTopLevel(instance, errors);
  validateMeta(instance, errors);
  validateDelivery(instance, errors);
  validateRoles(instance, errors);
  validateModules(instance, errors);
  validateScoring(instance, errors);
  validateQuestions(instance, errors);
  validateVideos(instance, errors);
  validateRoleMessages(instance, errors);
  validateAdmin(instance, errors);

  return { ok: errors.length === 0, errors };
}

export function assertValidInstance(instance) {
  const result = validateInstance(instance);
  if (!result.ok) {
    const error = new Error(`Invalid template instance:\n- ${result.errors.join("\n- ")}`);
    error.validationErrors = result.errors;
    throw error;
  }
  return instance;
}
