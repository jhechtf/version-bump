import { capitalize, fileExists } from './util.ts';

import { assertEquals } from 'deps';

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
