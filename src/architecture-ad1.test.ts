// AD-1 fixture cases on virtual (path, source) pairs through the shared `check`
// (src/architecture-scan.ts), the AD-1 check 1 engine tsconfig gate, and the AD-11 layout purity
// scan.
import { readFileSync } from 'node:fs';
import { posix } from 'node:path';
import ts from 'typescript';
import { describe, expect, it } from 'vitest';
import {
  type Case,
  collectImports,
  E,
  ENGINE_TOKENS,
  ET,
  js,
  MATH_COMPUTED,
  MATH_RANDOM,
  NAV,
  ROOT,
  run,
  S,
  ST,
  strip,
  TOKENS,
  U,
  UT,
  UV,
} from './architecture-scan';

describe('AD-1 engine tokens', () => {
  run([
    {
      name: 'identifier $window is not window',
      path: E,
      source: 'export const $window = 1;',
    },
    ...TOKENS.map(
      (t): Case => ({
        name: `token ${t}`,
        path: E,
        source: `export const a = ${t};`,
        // localStorage is also outside storage.ts
        fails: t === 'localStorage' ? ['engine-token', 'local-storage'] : 'engine-token',
      }),
    ),
    { name: 'Math.random()', path: E, source: 'Math.random();', fails: 'engine-token' },
    { name: "Math['random']", path: E, source: "Math['random']();", fails: 'engine-token' },
    { name: "Math ['random']", path: E, source: "Math ['random']();", fails: 'engine-token' },
    { name: "Math?.['random']", path: E, source: "Math?.['random']();", fails: 'engine-token' },
    { name: 'Math?.random()', path: E, source: 'Math?.random();', fails: 'engine-token' },
    { name: 'Math . random()', path: E, source: 'Math . random();', fails: 'engine-token' },
    {
      name: 'Math newline .random()',
      path: E,
      source: 'Math\n  .random();',
      fails: 'engine-token',
    },
    {
      name: 'template placeholder Date.now()',
      path: E,
      source: js('const s = ~@{Date.now()}~;'),
      fails: 'engine-token',
    },
    { name: 'property name x.process', path: E, source: 'x.process;', fails: 'engine-token' },
    {
      name: 'object key { fetch: 1 }',
      path: E,
      source: 'const o = { fetch: 1 };',
      fails: 'engine-token',
    },
    {
      name: 'engine .d.ts declare const document',
      path: 'src/engine/x.d.ts',
      source: 'declare const document: unknown;',
      fails: 'engine-token',
    },
    { name: 'Math.floor and Math.imul', path: E, source: 'Math.floor(Math.imul(a, b));' },
    { name: 'Dated and consoleLike', path: E, source: 'const Dated = 1; const consoleLike = 2;' },
    { name: 'xMath.random()', path: E, source: 'xMath.random();' },
    { name: 'Math.randomize()', path: E, source: 'Math.randomize();' },
    { name: 'engine test uses Date.now()', path: ET, source: 'Date.now();' },
  ]);
});

describe('AD-1 stripper', () => {
  run([
    { name: 'token in a line comment', path: E, source: '// Date.now()\nexport {};' },
    { name: 'token in a block comment', path: E, source: '/* window */ export {};' },
    {
      name: 'token in a JSDoc comment',
      path: E,
      source: '/** uses no document */\nexport const a = 1;',
    },
    { name: 'token in a string', path: E, source: "const s = 'Date';" },
    { name: 'token in a double-quoted string', path: E, source: 'const s = "window.document";' },
    { name: 'token in a regex literal', path: E, source: 'const r = /Date|console/;' },
    {
      name: 'token in a template literal part',
      path: E,
      source: js('const s = ~Date @{a} window~;'),
    },
    {
      name: 'token in a template middle part',
      path: E,
      source: js('const s = ~a@{x}Date@{y}b~;'),
    },
    {
      name: 'division is not a regex',
      path: E,
      source: 'a / 2; Date.now(); b / 3;',
      fails: 'engine-token',
    },
    {
      name: "'//' in a string",
      path: E,
      source: "const u = '//'; Date.now();",
      fails: 'engine-token',
    },
    {
      name: '"/*" in a string',
      path: E,
      source: 'const s = "/*"; Date.now(); // */',
      fails: 'engine-token',
    },
    {
      name: 'nested template',
      path: E,
      source: js('const s = ~a@{~b@{Date.now()}~}~;'),
      fails: 'engine-token',
    },
    {
      name: "'}' string inside a placeholder",
      path: E,
      source: js("const s = ~@{'}' + Date.now()}~;"),
      fails: 'engine-token',
    },
    { name: 'History API text in a shell string', path: S, source: "const s = 'history.back()';" },
  ]);
});

describe('AD-1 engine directives', () => {
  run([
    {
      name: '/// <reference lib="dom" />',
      path: E,
      source: '/// <reference lib="dom" />\nexport {};',
      fails: 'engine-directive',
    },
    {
      name: '/// <reference types="node" />',
      path: E,
      source: '/// <reference types="node" />\nexport {};',
      fails: 'engine-directive',
    },
    {
      name: '// @ts-nocheck',
      path: E,
      source: '// @ts-nocheck\nexport {};',
      fails: 'engine-directive',
    },
    {
      name: '// @ts-ignore',
      path: E,
      source: '// @ts-ignore\nexport const a: number = 1;',
      fails: 'engine-directive',
    },
    {
      name: '// @ts-expect-error',
      path: E,
      source: '// @ts-expect-error\nexport const a: number = 1;',
      fails: 'engine-directive',
    },
    {
      name: '// @TS-NOCHECK',
      path: E,
      source: '// @TS-NOCHECK\nexport {};',
      fails: 'engine-directive',
    },
    {
      name: '/// <REFERENCE LIB="dom" />',
      path: E,
      source: '/// <REFERENCE LIB="dom" />\nexport {};',
      fails: 'engine-directive',
    },
    {
      name: 'reference directive in an engine test',
      path: ET,
      source: '/// <reference lib="dom" />\nexport {};',
    },
    { name: '@ts-nocheck in an engine test', path: ET, source: '// @ts-nocheck\nexport {};' },
  ]);
});

describe('AD-1 scan scope', () => {
  run([
    {
      name: '.d.ts in a stray directory',
      path: 'src/lib/x.d.ts',
      source: 'declare const x: string;',
      fails: 'stray-file',
    },
    {
      name: '.mts under engine',
      path: 'src/engine/x.mts',
      source: 'export {};',
      fails: 'extension',
    },
    { name: '.mjs under shell', path: 'src/shell/x.mjs', source: 'export {};', fails: 'extension' },
    { name: '.cjs at the root', path: 'src/x.cjs', source: '', fails: 'extension' },
    { name: '.cts under shell', path: 'src/shell/x.cts', source: 'export {};', fails: 'extension' },
    { name: '.tsx under ui', path: 'src/ui/x.tsx', source: 'export {};', fails: 'extension' },
    { name: '.jsx under ui', path: 'src/ui/x.jsx', source: 'export {};', fails: 'extension' },
    { name: '.js under engine', path: 'src/engine/x.js', source: 'export {};', fails: 'extension' },
    {
      name: '.svelte under engine',
      path: 'src/engine/X.svelte',
      source: '<p>x</p>',
      fails: 'extension',
    },
    { name: 'stray root .ts', path: 'src/foo.ts', source: 'export {};', fails: 'stray-file' },
    { name: 'stray directory', path: 'src/lib/x.ts', source: 'export {};', fails: 'stray-file' },
    { name: 'stray root .svelte', path: 'src/App.svelte', source: '<p>x</p>', fails: 'stray-file' },
    {
      name: 'ui .d.ts binding named history',
      path: 'src/ui/x.d.ts',
      source: 'declare const history: unknown;',
      fails: 'history-binding',
    },
    {
      name: 'shell .d.ts localStorage',
      path: 'src/shell/x.d.ts',
      source: 'declare const s: typeof localStorage;',
      fails: 'local-storage',
    },
    {
      name: 'root .d.ts deep engine import',
      path: 'src/x.d.ts',
      source: "import type { Card } from './engine/deal';",
      fails: 'deep-engine-import',
    },
    { name: 'root .d.ts', path: 'src/x.d.ts', source: 'declare const __APP_VERSION__: string;' },
    {
      name: 'root .d.ts importing the engine index',
      path: 'src/x.d.ts',
      source: "import type { CardId } from './engine';",
    },
    {
      name: 'main.ts',
      path: 'src/main.ts',
      source: "import { createSession } from './engine/index';\ncreateSession(1);",
    },
    {
      name: 'non-code file under engine',
      path: 'src/engine/tsconfig.json',
      source: '{ "window": 1 }',
    },
    { name: 'css under ui', path: 'src/ui/app.css', source: 'body { color: red; }' },
  ]);
});

describe('AD-1 import forms', () => {
  run([
    {
      name: "shell import x = require('../engine/deal')",
      path: S,
      source: "import x = require('../engine/deal');",
      fails: 'deep-engine-import',
    },
    {
      name: "shell export * from '../engine/deal'",
      path: S,
      source: "export * from '../engine/deal';",
      fails: 'deep-engine-import',
    },
    {
      name: 'shell import.meta.globEager',
      path: S,
      source: "import.meta.globEager('./*.ts');",
      fails: 'import-meta-glob',
    },
    {
      name: 'shell test importing ui',
      path: ST,
      source: "import { x } from '../ui/x';",
      fails: 'cross-layer-import',
    },
    {
      name: 'commented-out UI deep import',
      path: U,
      source: "// import { deal } from '../engine/deal';\nexport {};",
    },
    {
      name: "UI import type from '../engine'",
      path: U,
      source: "import type { CardId } from '../engine';",
    },
    {
      name: "UI import type from '../engine/'",
      path: U,
      source: "import type { CardId } from '../engine/';",
    },
    {
      name: "UI import type from '../engine/index'",
      path: U,
      source: "import type { CardId } from '../engine/index';",
    },
    {
      name: 'UI export type from the engine',
      path: U,
      source: "export type { CardId } from '../engine';",
    },
    {
      name: "UI '../engine/index.js'",
      path: U,
      source: "import type { CardId } from '../engine/index.js';",
      fails: 'deep-engine-import',
    },
    {
      name: "UI '../engine/index.ts'",
      path: U,
      source: "import type { CardId } from '../engine/index.ts';",
      fails: 'deep-engine-import',
    },
    {
      name: 'shell value import of the engine index',
      path: S,
      source: "import { createSession } from '../engine';",
    },
    {
      name: "shell '../engine/index'",
      path: S,
      source: "import { createSession } from '../engine/index';",
    },
    {
      name: 'no-substitution template specifier',
      path: S,
      source: js('await import(~../engine/deal~);'),
      fails: 'deep-engine-import',
    },
    {
      name: 'UI inline import { type CardId }',
      path: U,
      source: "import { type CardId } from '../engine';",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'UI import-type expression',
      path: U,
      source: "type C = import('../engine').CardId;",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'UI value re-export',
      path: U,
      source: "export { createSession } from '../engine';",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'UI export * from the engine',
      path: U,
      source: "export * from '../engine';",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'UI dynamic import of the engine',
      path: U,
      source: "await import('../engine');",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'UI side-effect import of the engine',
      path: U,
      source: "import '../engine';",
      fails: 'ui-value-engine-import',
    },
    {
      name: 'shell side-effect import of ui',
      path: S,
      source: "import '../ui/x';",
      fails: 'cross-layer-import',
    },
    {
      name: 'shell non-literal import(x)',
      path: S,
      source: 'await import(x);',
      fails: 'non-literal-import',
    },
    {
      name: 'main.ts non-literal import(x)',
      path: 'src/main.ts',
      source: 'await import(x);',
      fails: 'non-literal-import',
    },
    {
      name: 'shell template import with a placeholder',
      path: S,
      source: js('await import(~./@{x}~);'),
      fails: 'non-literal-import',
    },
    {
      name: 'shell import.meta.glob',
      path: S,
      source: "import.meta.glob('./*.ts');",
      fails: 'import-meta-glob',
    },
    {
      name: 'main.ts import.meta.glob',
      path: 'src/main.ts',
      source: "import.meta.glob('./ui/*.svelte');",
      fails: 'import-meta-glob',
    },
    {
      name: "shell import '../ui'",
      path: S,
      source: "import '../ui';",
      fails: 'cross-layer-import',
    },
    {
      name: "UI import x = require('../engine')",
      path: U,
      source: "import x = require('../engine');",
      fails: 'ui-value-engine-import',
    },
    { name: 'import.meta alone', path: S, source: 'export const dev = import.meta.env.DEV;' },
    {
      name: 'main.ts deep engine import',
      path: 'src/main.ts',
      source: "import { deal } from './engine/deal';",
    },
  ]);
});

describe('AD-1 layer table', () => {
  run([
    {
      name: "shell '../engine/deal'",
      path: S,
      source: "import { deal } from '../engine/deal';",
      fails: 'deep-engine-import',
    },
    {
      name: "UI '../engine/deal'",
      path: U,
      source: "import type { Card } from '../engine/deal';",
      fails: 'deep-engine-import',
    },
    {
      name: "UI '/src/engine/deal'",
      path: U,
      source: "import type { Card } from '/src/engine/deal';",
      fails: 'deep-engine-import',
    },
    {
      name: "engine '../shell/x'",
      path: E,
      source: "import { x } from '../shell/x';",
      fails: 'engine-import',
    },
    {
      name: "engine './words.txt?raw'",
      path: E,
      source: "import w from './words.txt?raw';",
      fails: ['engine-import', 'engine-import'], // a query and a non-code extension
    },
    {
      name: "engine './deal.js'",
      path: E,
      source: "import { deal } from './deal.js';",
      fails: 'engine-import',
    },
    {
      name: "engine './deal.ts'",
      path: E,
      source: "import { deal } from './deal.ts';",
      fails: 'engine-import',
    },
    {
      name: "engine '/src/engine/deal'",
      path: E,
      source: "import { deal } from '/src/engine/deal';",
      fails: 'engine-import',
    },
    {
      name: 'engine bare specifier',
      path: E,
      source: "import x from 'lodash';",
      fails: 'engine-import',
    },
    {
      name: "shell '../ui/x'",
      path: S,
      source: "import { x } from '../ui/x';",
      fails: 'cross-layer-import',
    },
    {
      name: "shell '../main'",
      path: S,
      source: "import app from '../main';",
      fails: 'cross-layer-import',
    },
    {
      name: "shell '../main.js'",
      path: S,
      source: "import app from '../main.js';",
      fails: 'cross-layer-import',
    },
    {
      name: "UI '../main'",
      path: U,
      source: "import app from '../main';",
      fails: 'cross-layer-import',
    },
    { name: 'stray src/foo.ts', path: 'src/foo.ts', source: '', fails: 'stray-file' },
    { name: "UI '../shell/x'", path: U, source: "import { x } from '../shell/x';" },
    {
      name: 'shell dictionary ?url asset',
      path: S,
      source: "import url from '../../generated/dictionary/en.txt?url';",
    },
    { name: "UI 'svelte'", path: U, source: "import { mount } from 'svelte';" },
    { name: "UI './Card.svelte'", path: U, source: "import Card from './Card.svelte';" },
    { name: "shell './storage'", path: S, source: "import { read } from './storage';" },
    {
      name: "shell '../../fixtures/x.json'",
      path: S,
      source: "import x from '../../fixtures/x.json';",
    },
    { name: "engine './deal'", path: E, source: "import { deal } from './deal';" },
    { name: "engine './lang/en'", path: E, source: "import { EN } from './lang/en';" },
    {
      name: "engine '..' from lang/",
      path: 'src/engine/lang/en.ts',
      source: "import { deal } from '..';",
    },
    { name: "engine './deal.data'", path: E, source: "import { t } from './deal.data';" },
  ]);
});

describe('AD-1 engine tests', () => {
  run([
    {
      name: 'engine test dynamic fixtures JSON with the option',
      path: ET,
      source: "await import('../../fixtures/a.json', { with: { type: 'json' } });",
    },
    {
      name: 'engine test dynamic fixtures JSON without the option',
      path: ET,
      source: "await import('../../fixtures/a.json');",
      fails: 'engine-import',
    },
    {
      name: 'engine test dictionary ?url',
      path: ET,
      source: "import url from '../../generated/dictionary/en.txt?url';",
      fails: ['engine-import', 'engine-import', 'engine-import'], // query, leaves src/engine/, extension,
    },
    { name: "engine test './deal'", path: ET, source: "import { deal } from './deal';" },
    { name: 'engine test vitest', path: ET, source: "import { it } from 'vitest';" },
    {
      name: 'engine test fixtures JSON with the attribute',
      path: ET,
      source: "import a from '../../fixtures/a.json' with { type: 'json' };",
    },
    {
      name: 'engine test dictionary ?raw',
      path: ET,
      source: "import words from '../../generated/dictionary/en.txt?raw';",
    },
    {
      name: 'engine test nested fixtures JSON',
      path: ET,
      source: "import a from '../../fixtures/sub/a.json' with { type: 'json' };",
      fails: ['engine-import', 'engine-import'], // leaves src/engine/ and has an extension
    },
    {
      name: "engine test 'vitest/config'",
      path: ET,
      source: "import { defineConfig } from 'vitest/config';",
      fails: 'engine-import',
    },
    {
      name: "engine test '@vitest/expect'",
      path: ET,
      source: "import { x } from '@vitest/expect';",
      fails: 'engine-import',
    },
    {
      name: 'engine test fixtures JSON without the attribute',
      path: ET,
      source: "import a from '../../fixtures/a.json';",
      fails: 'engine-import',
    },
    {
      name: "engine test '../shell/x'",
      path: ET,
      source: "import { x } from '../shell/x';",
      fails: 'engine-import',
    },
    {
      name: "engine test 'node:fs'",
      path: ET,
      source: "import { readFileSync } from 'node:fs';",
      fails: 'engine-import',
    },
    {
      name: "engine test fixtures JSON with { type: 'css' }",
      path: ET,
      source: "import a from '../../fixtures/a.json' with { type: 'css' };",
      fails: 'engine-import',
    },
    {
      name: 'engine test other generated ?raw',
      path: ET,
      source: "import w from '../../generated/other.txt?raw';",
      fails: ['engine-import', 'engine-import', 'engine-import'], // query, leaves src/engine/, extension
    },
    {
      name: 'engine test fixtures JSON ?raw with the attribute',
      path: ET,
      source: "import a from '../../fixtures/a.json?raw' with { type: 'json' };",
      fails: ['engine-import', 'engine-import', 'engine-import'], // query, leaves src/engine/, extension
    },
    {
      name: 'engine source fixtures JSON with the attribute',
      path: E,
      source: "import a from '../../fixtures/a.json' with { type: 'json' };",
      fails: ['engine-import', 'engine-import'], // leaves src/engine/ and has an extension
    },
  ]);
});

describe('AD-1 History API', () => {
  run([
    {
      name: 'history.pushState',
      path: S,
      source: "history.pushState({}, '');",
      fails: 'history-api',
    },
    {
      name: 'window.history.back()',
      path: U,
      source: 'window.history.back();',
      fails: 'history-api',
    },
    { name: 'history?.back()', path: S, source: 'history?.back();', fails: 'history-api' },
    {
      name: 'window.history?.pushState',
      path: S,
      source: "window.history?.pushState({}, '');",
      fails: 'history-api',
    },
    { name: 'history . go(-1)', path: S, source: 'history . go(-1);', fails: 'history-api' },
    {
      name: 'history newline .state',
      path: S,
      source: 'const s = history\n  .state;',
      fails: 'history-api',
    },
    {
      name: 'loaded().history.length',
      path: S,
      source: 'const n = loaded().history.length;',
      fails: 'history-api',
    },
    {
      name: 'main.ts history.back()',
      path: 'src/main.ts',
      source: 'history.back();',
      fails: 'history-api',
    },
    { name: 'nav.ts history.pushState', path: NAV, source: "history.pushState({}, '');" },
    { name: 'loaded().history.records', path: S, source: 'const r = loaded().history.records;' },
    { name: 'scoreHistory.length', path: S, source: 'const n = scoreHistory.length;' },
    { name: 'myhistory.back()', path: S, source: 'myhistory.back();' },
    { name: 'history.goTo()', path: S, source: 'history.goTo();' },
  ]);
});

describe('AD-1 history bindings', () => {
  run([
    {
      name: 'enum history',
      path: S,
      source: 'enum history {}',
      fails: 'history-binding',
    },
    {
      name: 'namespace history',
      path: S,
      source: 'namespace history {}',
      fails: 'history-binding',
    },
    {
      name: 'module history',
      path: S,
      source: 'module history {}',
      fails: 'history-binding',
    },
    {
      name: 'class history',
      path: S,
      source: 'class history {}',
      fails: 'history-binding',
    },
    {
      name: 'const [history] = x',
      path: S,
      source: 'const [history] = x;',
      fails: 'history-binding',
    },
    {
      name: 'catch (history)',
      path: S,
      source: 'try {} catch (history) {}',
      fails: 'history-binding',
    },
    {
      name: 'for (const history of xs)',
      path: S,
      source: 'for (const history of xs) {}',
      fails: 'history-binding',
    },
    {
      name: "import history = require('./h')",
      path: S,
      source: "import history = require('./h');",
      fails: 'history-binding',
    },
    { name: 'const history', path: S, source: 'const history = 1;', fails: 'history-binding' },
    { name: 'let history', path: S, source: 'let history = 1;', fails: 'history-binding' },
    { name: 'var history', path: S, source: 'var history = 1;', fails: 'history-binding' },
    {
      name: 'function history()',
      path: S,
      source: 'function history() {}',
      fails: 'history-binding',
    },
    {
      name: 'parameter (history) =>',
      path: S,
      source: 'const f = (history) => 0;',
      fails: 'history-binding',
    },
    {
      name: 'typed parameter (history: Foo) =>',
      path: S,
      source: 'const f = (history: Foo) => 0;',
      fails: 'history-binding',
    },
    {
      name: 'function f(history: Foo)',
      path: S,
      source: 'function f(history: Foo) {}',
      fails: 'history-binding',
    },
    {
      name: 'const { history } = x',
      path: S,
      source: 'const { history } = x;',
      fails: 'history-binding',
    },
    {
      name: 'const { history: h } = x',
      path: S,
      source: 'const { history: h } = x;',
      fails: 'history-binding',
    },
    {
      name: 'shorthand { history }',
      path: S,
      source: 'const o = { history };',
      fails: 'history-binding',
    },
    {
      name: 'method shorthand { history() {} }',
      path: S,
      source: 'const o = { history() {} };',
      fails: 'history-binding',
    },
    {
      name: 'import history from',
      path: S,
      source: "import history from './h';",
      fails: 'history-binding',
    },
    {
      name: 'import * as history',
      path: S,
      source: "import * as history from './h';",
      fails: 'history-binding',
    },
    {
      name: 'import { a as history }',
      path: S,
      source: "import { a as history } from './h';",
      fails: 'history-binding',
    },
    {
      name: 'function expression history',
      path: S,
      source: 'const f = function history() {};',
      fails: 'history-binding',
    },
    {
      name: 'class expression history',
      path: S,
      source: 'const C = class history {};',
      fails: 'history-binding',
    },
    {
      name: 'destructuring assignment ({ history: h } = x)',
      path: S,
      source: '({ history: h } = x);',
      fails: 'history-binding',
    },
    {
      name: 'nested destructuring assignment ({ a: { history: h } } = x)',
      path: S,
      source: '({ a: { history: h } } = x);',
      fails: 'history-binding',
    },
    {
      name: 'object-literal getter history',
      path: S,
      source: 'const o = { get history() { return 1; } };',
      fails: 'history-binding',
    },
    {
      name: 'object-literal setter history',
      path: S,
      source: 'const o = { set history(v) {} };',
      fails: 'history-binding',
    },
    { name: 'class getter history', path: S, source: 'class C { get history() { return 1; } }' },
    { name: 'scoreHistory', path: S, source: 'const scoreHistory = 1;' },
    { name: 'interface member', path: S, source: 'interface L { history: H }' },
    { name: 'type literal member', path: S, source: 'type T = { history?: H };' },
    { name: 'class field', path: S, source: 'class C { history = x; }' },
    { name: 'property assignment o.history = x', path: S, source: 'o.history = x;' },
    { name: 'object-literal key history: x', path: S, source: 'const o = { history: x };' },
    { name: 'loaded().history', path: S, source: 'const h = loaded().history;' },
    { name: 'nav.ts const history', path: NAV, source: 'const history = window.history;' },
  ]);
});

describe('AD-1 popstate', () => {
  run([
    {
      name: "'popstate' in a string",
      path: S,
      source: "addEventListener('popstate', f);",
      fails: 'popstate',
    },
    { name: 'window.onpopstate', path: S, source: 'window.onpopstate = f;', fails: 'popstate' },
    {
      name: 'popstate only in a comment',
      path: S,
      source: '// popstate is nav.ts business\nexport {};',
    },
    { name: 'nav.ts popstate', path: NAV, source: "addEventListener('popstate', f);" },
  ]);
});

describe('AD-1 localStorage', () => {
  run([
    {
      name: 'shell localStorage',
      path: S,
      source: "localStorage.getItem('x');",
      fails: 'local-storage',
    },
    {
      name: 'UI localStorage',
      path: U,
      source: "localStorage.getItem('x');",
      fails: 'local-storage',
    },
    {
      name: 'storage.ts localStorage',
      path: 'src/shell/storage.ts',
      source: "localStorage.getItem('x');",
    },
    { name: 'localStorage in a shell string', path: S, source: "const s = 'localStorage';" },
    { name: 'localStorageKey', path: S, source: 'const localStorageKey = 1;' },
  ]);
});

describe('AD-1 test-file exemptions', () => {
  run([
    { name: 'engine test Date.now()', path: ET, source: 'Date.now();' },
    {
      name: 'shell test localStorage and history.pushState',
      path: ST,
      source: "localStorage.getItem('x');\nhistory.pushState({}, '');",
    },
    {
      name: 'UI test const history and popstate',
      path: UT,
      source: "const history = 1;\nconst e = 'popstate';",
    },
    { name: 'UI test localStorage', path: UT, source: 'localStorage.clear();' },
    {
      name: 'engine test localStorage',
      path: ET,
      source: 'localStorage.clear();',
      fails: 'local-storage',
    },
    {
      name: 'engine test history.pushState',
      path: ET,
      source: "history.pushState({}, '');",
      fails: 'history-api',
    },
    {
      name: "engine test 'popstate'",
      path: ET,
      source: "const e = 'popstate';",
      fails: 'popstate',
    },
    {
      name: 'UI test value-importing the engine',
      path: UT,
      source: "import { createSession } from '../engine';",
      fails: 'ui-value-engine-import',
    },
  ]);
});

describe('AD-1 .svelte extraction', () => {
  run([
    {
      name: 'markup {#each xs as history}',
      path: UV,
      source: '{#each xs as history}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#each xs as { history }}',
      path: UV,
      source: '{#each xs as { history }}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {@const history = x}',
      path: UV,
      source: '{#each xs as x}{@const history = x}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#snippet row(history)}',
      path: UV,
      source: '{#snippet row(history)}<p>x</p>{/snippet}',
      fails: 'history-binding',
    },
    {
      name: 'markup {:then history}',
      path: UV,
      source: '{#await p}<p>x</p>{:then history}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup {:catch history}',
      path: UV,
      source: '{#await p}<p>x</p>{:catch history}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup let:history',
      path: UV,
      source: '<List let:history><p>x</p></List>',
      fails: 'history-binding',
    },
    {
      name: 'markup {@const { history } = x}',
      path: UV,
      source: '{#each xs as x}{@const { history } = x}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {:then { history }}',
      path: UV,
      source: '{#await p}<p>x</p>{:then { history }}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup {:catch { history }}',
      path: UV,
      source: '{#await p}<p>x</p>{:catch { history }}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#each xs as record} reading record.history',
      path: UV,
      source: '{#each xs as record}<p>{record.history}</p>{/each}',
    },
    {
      name: 'ownership words in a script comment and strings',
      path: UV,
      source: [
        '<script lang="ts">',
        '  // popstate is handled in nav.ts',
        "  const a = 'history.back()';",
        "  const b = 'localStorage';",
        '</script>',
        '<p>{a}{b}</p>',
      ].join('\n'),
    },
    {
      name: 'instance and module scripts each hold a violation',
      path: UV,
      source: [
        '<script module lang="ts">',
        "  import app from '../main';",
        '</script>',
        '<script lang="ts">',
        "  import { deal } from '../engine/deal';",
        '</script>',
        '<p>x</p>',
      ].join('\n'),
      fails: ['cross-layer-import', 'deep-engine-import'],
    },
    {
      name: 'legacy context="module" script',
      path: UV,
      source: '<script context="module" lang="ts">\n  const history = 1;\n</script>\n<p>x</p>',
      fails: 'history-binding',
    },
    {
      name: 'markup onclick history.back()',
      path: UV,
      source: '<button onclick={() => history.back()}>Back</button>',
      fails: 'history-api',
    },
    {
      name: 'markup svelte:window onpopstate',
      path: UV,
      source: '<svelte:window onpopstate={onPop} />',
      fails: 'popstate',
    },
    {
      name: 'markup localStorage',
      path: UV,
      source: "<p>{localStorage.getItem('x')}</p>",
      fails: 'local-storage',
    },
    {
      name: 'markup text with an apostrophe, HTML comment and style',
      path: UV,
      source: [
        '<script lang="ts">',
        "  import type { CardId } from '../engine';",
        "  import { x } from '../shell/x';",
        '</script>',
        '<!-- history.back() and popstate live in nav.ts -->',
        "<p>it's the score history</p>",
        '<style>.popstate { color: red; }</style>',
      ].join('\n'),
    },
    {
      name: 'script closed by </script > with whitespace',
      path: UV,
      source: '<script>\nconst history = 1;\n</script >\n<p>{history}</p>',
      fails: 'history-binding',
    },
    {
      name: 'script closed by </script\\n> with a newline',
      path: UV,
      source: "<script>\nimport { deal } from '../engine/deal';\n</script\n>",
      fails: 'deep-engine-import',
    },
    {
      name: 'markup {#snippet history()}',
      path: UV,
      source: '{#snippet history()}<p>x</p>{/snippet}',
      fails: 'history-binding',
    },
    {
      name: 'markup <svelte:options customElement={{ extend: (history) => history }} />',
      path: UV,
      source: '<svelte:options customElement={{ extend: (history) => history }} />',
      fails: 'history-binding',
    },
    {
      name: 'markup {#each xs as x, history} index',
      path: UV,
      source: '{#each xs as x, history}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {const history = x}',
      path: UV,
      source: '{const history = 1}<p>{history}</p>',
      fails: 'history-binding',
    },
    {
      name: 'markup {let history = x}',
      path: UV,
      source: '{let history = $state(0)}<p>{history}</p>',
      fails: 'history-binding',
    },
    {
      name: 'markup { #each xs as history} with whitespace after {',
      path: UV,
      source: '{ #each xs as history}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup { @const history = x} with whitespace after {',
      path: UV,
      source: '{#each xs as x}{ @const history = x}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#await p then history}',
      path: UV,
      source: '{#await p then history}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#await p catch history}',
      path: UV,
      source: '{#await p catch history}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#each xs as { ...history }}',
      path: UV,
      source: '{#each xs as { ...history }}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#snippet row(...history)}',
      path: UV,
      source: '{#snippet row(...history)}<p>x</p>{/snippet}',
      fails: 'history-binding',
    },
    {
      name: 'markup let:item={history}',
      path: UV,
      source: '<List let:item={history}><p>x</p></List>',
      fails: 'history-binding',
    },
    {
      name: 'markup {@const { a = 1, history } = x}',
      path: UV,
      source: '{#each xs as x}{@const { a = 1, history } = x}<p>x</p>{/each}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#snippet row<T>(history: T)}',
      path: UV,
      source: '<script lang="ts"></script>\n{#snippet row<T>(history: T)}<p>x</p>{/snippet}',
      fails: 'history-binding',
    },
    {
      name: 'markup {#snippet row(a = f(), history)}',
      path: UV,
      source: '{#snippet row(a = f(), history)}<p>x</p>{/snippet}',
      fails: 'history-binding',
    },
    {
      name: 'markup {:then { a: { b }, history }}',
      path: UV,
      source: '{#await p}<p>x</p>{:then { a: { b }, history }}<p>y</p>{/await}',
      fails: 'history-binding',
    },
    {
      name: 'markup arrow parameter (history) => …',
      path: UV,
      source: '<button onclick={(history) => f(history)}>x</button>',
      fails: 'history-binding',
    },
    {
      name: 'markup {@attach (history) => …}',
      path: UV,
      source: '<div {@attach (history) => f(history)}></div>',
      fails: 'history-binding',
    },
    {
      name: 'markup shorthand attribute {history}',
      path: UV,
      source: '<Comp {history} />',
      fails: 'history-binding',
    },
    {
      name: 'markup shorthand object {{ history }}',
      path: UV,
      source: '<Comp data={{ history }} />',
      fails: 'history-binding',
    },
    {
      name: '<script> inside an HTML comment',
      path: UV,
      source:
        '<!-- <script> -->\n{#each xs as history}<p>x</p>{/each}\n<script>const a = 1;</script>',
      fails: 'history-binding',
    },
    {
      name: '<script> inside a markup string',
      path: UV,
      source:
        "<p>{'<script>'}</p>{#each xs as history}<p>x</p>{/each}<script>const a = 1;</script>",
      fails: 'history-binding',
    },
    {
      name: 'svelte:head script body',
      path: UV,
      source: '<svelte:head><script>const history = 1;</script></svelte:head>',
      fails: 'history-binding',
    },
    {
      name: 'markup {#each xs as x (history)} key is a reference',
      path: UV,
      source: '{#each xs as x (history)}<p>x</p>{/each}',
    },
    {
      name: 'markup history={history} attribute is a reference',
      path: UV,
      source: '<Comp history={history} />',
    },
    {
      name: 'markup {@render row(history)} argument is a reference',
      path: UV,
      source: '{@render row(history)}',
    },
  ]);
});

// --- AD-1 check 1 gate ----------------------------------------------------------------------

describe('AD-1 engine tsconfig', () => {
  it('AD-1 src/engine/tsconfig.json covers engine sources only and has no DOM or Node globals', () => {
    const parsed = ts.getParsedCommandLineOfConfigFile(
      posix.join(ROOT, 'src/engine/tsconfig.json'),
      {},
      {
        ...ts.sys,
        onUnRecoverableConfigFileDiagnostic: (d) => {
          throw new Error(ts.flattenDiagnosticMessageText(d.messageText, '\n'));
        },
      },
    );
    if (!parsed) throw new Error('src/engine/tsconfig.json did not parse');
    expect(parsed.errors).toEqual([]);
    const files = parsed.fileNames.map((f) => posix.relative(ROOT, f));
    expect(files).toContain('src/engine/deal.ts');
    expect(files.filter((f) => f.endsWith('.test.ts'))).toEqual([]);

    const virtual = posix.join(ROOT, 'src/engine/__virtual__.ts');
    const source = 'export const globals = [navigator, document, Buffer];\n';
    const host = ts.createCompilerHost(parsed.options);
    const realGetSourceFile = host.getSourceFile.bind(host);
    const realFileExists = host.fileExists.bind(host);
    const realReadFile = host.readFile.bind(host);
    host.getSourceFile = (name, language, ...rest) =>
      name === virtual
        ? ts.createSourceFile(name, source, language)
        : realGetSourceFile(name, language, ...rest);
    host.fileExists = (name) => name === virtual || realFileExists(name);
    host.readFile = (name) => (name === virtual ? source : realReadFile(name));
    const program = ts.createProgram({ rootNames: [virtual], options: parsed.options, host });
    const sf = program.getSourceFile(virtual);
    if (!sf) throw new Error('virtual engine source missing from the program');
    const messages = program
      .getSemanticDiagnostics(sf)
      .map((d) => ts.flattenDiagnosticMessageText(d.messageText, '\n'));
    for (const name of ['navigator', 'document', 'Buffer']) {
      expect(messages.some((m) => m.startsWith(`Cannot find name '${name}'`))).toBe(true);
    }
  });
});

// --- AD-11 layout purity --------------------------------------------------------------------

const IMPORT_META = /(?<![\w$])import\s*\.\s*meta(?![\w$])/;
const LAYOUT_PURE = [
  'src/ui/layout/bands.ts',
  'src/ui/layout/fit.ts',
  'src/ui/layout/geometry.ts',
  'src/ui/layout/tray.ts',
];

/** AD-11 "geometry.ts is pure": the AD-1 engine tokens, `import.meta` and any `svelte` import. */
function layoutPurityViolations(path: string, source: string): string[] {
  const sf = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const full = strip(sf, false);
  const found = new Set<string>();
  for (const m of full.matchAll(ENGINE_TOKENS)) found.add(m[1]);
  if (MATH_RANDOM.test(full)) found.add('Math.random');
  if (MATH_COMPUTED.test(full)) found.add('Math[');
  if (IMPORT_META.test(full)) found.add('import.meta');
  for (const { spec } of collectImports(sf).imports) {
    if (spec === 'svelte' || spec?.startsWith('svelte/')) found.add(`import ${spec}`);
  }
  return [...found];
}

describe('AD-11 layout modules are pure', () => {
  const cases: [string, string, string[]][] = [
    ['window', 'const w = window.innerWidth;', ['window']],
    ['document', 'const c = document.documentElement.clientWidth;', ['document']],
    ['a timer', 'setTimeout(() => {}, 0);', ['setTimeout']],
    ['Math.random', 'const r = Math.random();', ['Math.random']],
    ['import.meta', 'const dev = import.meta.env.DEV;', ['import.meta']],
    ["a 'svelte' import", "import { untrack } from 'svelte';", ['import svelte']],
    ["a 'svelte/…' import", "import { writable } from 'svelte/store';", ['import svelte/store']],
    ['tokens in comments and strings', "// window import.meta\nconst s = 'document';", []],
    ['a relative import', "import { BAND_ORDER } from './bands';", []],
  ];
  for (const [label, source, expected] of cases) {
    it(`AD-11 purity scan: ${label} → ${JSON.stringify(expected)}`, () => {
      expect(layoutPurityViolations('src/ui/layout/x.ts', source)).toEqual(expected);
    });
  }

  it('AD-11 src/ui/layout/bands.ts, fit.ts, geometry.ts and tray.ts pass the purity scan', () => {
    const violations = LAYOUT_PURE.flatMap((p) =>
      layoutPurityViolations(p, readFileSync(posix.join(ROOT, p), 'utf8')).map((v) => `${p}: ${v}`),
    );
    expect(violations).toEqual([]);
  });
});

describe('AD-7 F18 stored-key helpers', () => {
  it('AD-7 F18 src/shell/stored-key.ts imports no shell module', () => {
    const path = 'src/shell/stored-key.ts';
    const source = readFileSync(posix.join(ROOT, path), 'utf8');
    const sf = ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
    expect(collectImports(sf).imports).toEqual([]);
  });
});
