import GithubProvider from './github.com.ts';

import { assertEquals } from 'deps';

const url = 'ssh://github.com:4444/jhechtf/some-repo';
const parsed = new URL(url);
const provider = new GithubProvider(parsed);

Deno.test('Check compare', () => {
  const diffUrl = provider.gitDiffUrl('v0.1.0');
  assertEquals(
    diffUrl,
    'https://github.com:4444/jhechtf/some-repo/compare/v0.1.0..HEAD',
  );
  const diffUrl2 = provider.gitDiffUrl('v0.1.0', 'v0.2.0');
  assertEquals(
    diffUrl2,
    'https://github.com:4444/jhechtf/some-repo/compare/v0.1.0..v0.2.0',
  );
});
