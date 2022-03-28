import Git from './git.ts';

import { assertObject, urlMap } from 'src/testdata/data.ts';

for (const [url, expected] of Object.entries(urlMap)) {
  Deno.test('Testing ' + url, async () => {
    const parsed = await Git.parseGitRemoteUrl(url);

    assertObject(
      parsed,
      expected,
    );
  });
}
