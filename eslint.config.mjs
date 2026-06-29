import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The codebase uses `any` deliberately in several UI components; keep it a
  // warning rather than a hard error so `npm run lint` stays green.
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
  // lib/*.js and validate.js are intentional CommonJS Node scripts (validate.js
  // runs via `node validate.js`, and the libs are shared with it), so allow require().
  {
    files: ["**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
