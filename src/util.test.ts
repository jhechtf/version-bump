import { capitalize, fileExists, resolveFileImportUrl } from './util.ts';

import { assertEquals } from '../deps.ts';

Deno.test('File Exists Function', async () => {
  const value = await fileExists('./deps.ts');
  assertEquals(value, true);
  const falseValue = await fileExists('./false.json');
  assertEquals(falseValue, false);
});

Deno.test('Test capitalize function', () => {
  const cases = {
    'i should be capitalized': 'I should be capitalized',
    '   i should be capitalized': 'I should be capitalized',
    'íglesia': 'Íglesia',
  };

  for (const [original, capitalized] of Object.entries(cases)) {
    assertEquals(
      capitalize(original),
      capitalized,
      `${capitalized}`,
    );
  }
});

Deno.test('Resolve file url', () => {
  const fromUrl = resolveFileImportUrl(
    'https://deno.land/x/version_bump@0.1.0/cli.ts',
    'src',
    'providers',
    'github.com.ts',
  );
  assertEquals(
    fromUrl,
    'https://deno.land/x/version_bump@0.1.0/src/providers/github.com.ts',
  );

  const fromFile = resolveFileImportUrl(
    'file:///C:/Users/someUser/cli.ts',
    'src',
    'providers',
    'github.com.ts',
  );

  assertEquals(
    fromFile,
    'file:///C:/Users/someUser/src/providers/github.com.ts',
  );

  const noStrip = resolveFileImportUrl(
    'https://deno.land/x/version_bump@0.1.0',
    false,
    'src',
    'providers',
    'github.com.ts',
  );

  assertEquals(
    noStrip,
    'https://deno.land/x/version_bump@0.1.0/src/providers/github.com.ts',
  );
});
