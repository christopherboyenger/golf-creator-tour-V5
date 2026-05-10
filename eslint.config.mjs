import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "next-env.d.ts",
      "node_modules/**",
      ".codex-reference-old/**",
      ".codex-reference-screenshots/**",
      ".codex-video-deps/**"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript")
];

export default eslintConfig;
