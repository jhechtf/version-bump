import { emptyDir } from 'https://deno.land/std@0.132.0/fs/empty_dir.ts';
import {
  afterAll,
  assertEquals,
  assertMatch,
  beforeAll,
  describe,
  it,
} from './deps.ts';

import { fakeGitHistory, runCommand, setupPackage } from 'util';

// Use the CLI from the exported object.
// import cli from ../cli.ts';

beforeAll(async () => {
  const packagePath = await setupPackage(
    'new-cli',
    'ssh://git@gitlab.com:fake/test.git',
  );
  await fakeGitHistory(packagePath, [{
    subject: 'feat: cool new feature',
    tag: '',
    author: 'Fake Test <fake@test.com>',
  }, {
    subject: 'fix: something else',
    tag: '',
    author: 'Fake Test<fake@test.com>',
  }]);
  await Deno.writeTextFile(
    `${packagePath}/deps.ts`,
    'export const VERSION = "0.1.0";',
  );
});

afterAll(async () => {
  if (!Deno.args.includes('--skipTeardown')) {
    console.info('Tearing down...');
    await emptyDir('packages');
    await Deno.remove('packages', { recursive: true });
  }
});

describe('CLI', () => {
  it('Works with dry runs', async () => {
    const { stdout, code } = await runCommand(
      'deno',
      ['run', '-A', '../../cli.ts', '--dryRun'],
      'packages/new-cli',
    );
    const readFile = await Deno.readTextFile('packages/new-cli/deps.ts');
    assertEquals(code, 0);
    assertMatch(stdout, /CHANGES WILL NOT BE SAVED/);
    assertMatch(readFile, /export const VERSION = "0.1.0";/);
  });

  it('Works with raw runs', async () => {
    await runCommand(
      'deno',
      ['run', '-A', '../../cli.ts'],
      'packages/new-cli',
    );
    const depsFile = await Deno.readTextFile('packages/new-cli/deps.ts');
    assertMatch(depsFile, /export const VERSION = "0\.2\.0";/);
  });
});
