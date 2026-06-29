const fs = require('fs');
const { validateInstance } = require('./lib/validateInstance');

const instancePath = process.argv[2] || 'instance-circor.json';
const instance = JSON.parse(fs.readFileSync(instancePath, 'utf8'));

const { ok, errors, warnings, passed } = validateInstance(instance);
const langs = instance.delivery?.languages || [];

console.log('\n════════════════════════════════════════════════');
console.log('  BLCK UNICRN — Template Validation Report');
console.log(`  Instance:  ${instance.instanceId}`);
console.log(`  Template:  ${instance['$template'] || 'unspecified'}`);
console.log(`  Languages: ${langs.join(', ')}`);
console.log('════════════════════════════════════════════════\n');

console.log(`PASSED (${passed.length})`);
passed.forEach((p) => console.log('  ✓ ' + p));

if (warnings.length > 0) {
  console.log(`\nWARNINGS (${warnings.length})`);
  warnings.forEach((w) => console.log('  ⚠ ' + w));
}

if (!ok) {
  console.log(`\nERRORS (${errors.length})`);
  errors.forEach((e) => console.log('  ✗ ' + e));
  console.log('\n  ✗ VALIDATION FAILED\n');
  process.exit(1);
} else {
  console.log('\n  ✓ ALL CHECKS PASSED — instance is valid against template\n');
}
