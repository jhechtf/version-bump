import GitlabProvider from './gitlab.com.ts';

import { assertEquals } from 'deps';

const url = 'ssh://gitlab.com:443/jhechtf/some-repo';
const parsed = new URL(url);
const provider = new GitlabProvider(parsed);

Deno.test('hello', () => {
  const diffUrl = provider.gitDiffUrl('v0.1.0');
  assertEquals(
    diffUrl,
    'https://gitlab.com/jhechtf/some-repo/-/compare/v0.1.0..HEAD',
  );
});
