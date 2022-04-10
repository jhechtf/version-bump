import GitlabProvider from './gitlab.com.ts';

import { url } from './shared.data.ts';

import { assertEquals } from 'deps';

const provider = new GitlabProvider(url('gitlab.com'));

Deno.test('Gitlab Provider', async (t) => {
  await t.step({
    name: 'commit URL',
    fn: () =>
      assertEquals(
        provider.commitUrl('abcdef'),
        'https://gitlab.com/user/some-repo/-/commit/abcdef',
      ),
  });

  await t.step({
    name: 'diff URL',
    fn: () =>
      assertEquals(
        provider.gitDiffUrl('v0.1.0', 'v0.2.0'),
        'https://gitlab.com/user/some-repo/-/compare/v0.1.0..v0.2.0',
      ),
  });
});
