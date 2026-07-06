/**
 * Ambient declaration for plain (non-module) CSS side-effect imports, e.g. `import "./globals.css"`.
 * TypeScript 6 defaults `noUncheckedSideEffectImports` to true, and Next.js only ships
 * declarations for `*.module.css`/`.sass`/`.scss`, not plain stylesheets.
 */
declare module "*.css" {}
