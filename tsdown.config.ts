import { defineConfig } from 'tsdown'

const moduleId = 'harness-whale'

const entry = { client: 'src/client/index.ts' }

export default defineConfig([
  {
    entry,
    outDir: 'lib',
    clean: true,
    dts: false,
    format: 'iife',
    globalName: 'HarnessWhale',
    platform: 'browser',
    target: 'es2022',
    loader: { '.png': 'base64', '.webp': 'base64' },
    sourcemap: true,
    outputOptions: { entryFileNames: '[name].js' },
    banner: `window.__ModuleLoader__.load({ id: ${JSON.stringify(moduleId)}, factory: (require) => {`,
    footer: 'return HarnessWhale; }});',
  },
  {
    entry,
    outDir: 'lib',
    clean: false,
    dts: { emitDtsOnly: true },
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    loader: { '.png': 'base64', '.webp': 'base64' },
  },
  {
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    clean: false,
    dts: true,
    format: 'esm',
    platform: 'node',
    fixedExtension: false,
    target: 'node22',
    sourcemap: true,
  },
])
