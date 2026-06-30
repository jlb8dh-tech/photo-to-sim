// No-op build shim.
//
// This Vercel project was originally scaffolded by v0.dev, which set the
// project Build Command to:
//
//     node .v0/inject-built-with-v0.mjs && next build
//
// The real v0 helper that injects a "Built with v0" badge is not part of this
// repository, so the command failed with MODULE_NOT_FOUND before `next build`
// ever ran. This harmless no-op satisfies that command so the build proceeds.
// (vercel.json also pins the build to a plain `next build`.)
console.log('[.v0] no-op build shim — proceeding to next build');
