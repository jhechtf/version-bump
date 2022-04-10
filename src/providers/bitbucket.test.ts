import { assertEquals } from 'deps';

import BitbucketProvider from './bitbucket.com.ts';

import { url } from './shared.data.ts';

const provider = new BitbucketProvider(url('bitbucket.com'));

Deno.test('Bitbucket Provider', async (t) => {
  await t.step({
    name: 'commit URL',
    fn: () =>
      assertEquals(
        provider.commitUrl('abcdef'),
        'https://bitbucket.com/user/some-repo/commit/abcdef',
      ),
  });

  await t.step({
    name: 'diff URL',
    fn: () =>
      assertEquals(
        provider.gitDiffUrl('v0.1.0', 'v1.0.0'),
        'https://bitbucket.com/user/some-repo/compare/v0.1.0..v1.0.0',
      ),
  });
});
