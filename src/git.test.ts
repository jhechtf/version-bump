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

// It is possible that along with the changes being made to test the actual CLI
// itself that we could add in something more specific for this?
