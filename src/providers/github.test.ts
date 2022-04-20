import GithubProvider from './github.com.ts';

import { assertEquals } from '../../deps.ts';

import { url } from './shared.data.ts';

const provider = new GithubProvider(url('github.com'));

Deno.test('Check compare', async (t) => {
  await t.step({
    name: 'commit URL',
    fn: () =>
      assertEquals(
        provider.commitUrl('abcdef'),
        'https://github.com/user/some-repo/commit/abcdef',
      ),
  });

  await t.step({
    name: 'compare URL',
    fn: () =>
      assertEquals(
        provider.gitDiffUrl('v0.1.0', 'v0.2.0'),
        'https://github.com/user/some-repo/compare/v0.1.0..v0.2.0',
      ),
  });
});
