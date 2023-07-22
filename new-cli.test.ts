import { emptyDir } from 'https://deno.land/std@0.132.0/fs/empty_dir.ts';
import {
  afterAll,
  assertEquals,
  assertMatch,
  beforeAll,
  describe,
  it,
} from './deps.ts';

import {
  fakeGitHistory,
  generateFakeVersionSource,
  runCommand,
  setupPackage,
} from 'util';

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

  // Base config test
  const configPath = await setupPackage(
    'config-test',
    'ssh://git@bitbucket.com:fake/test.git',
  );
  await generateFakeVersionSource(configPath, 'deno', '1.0.0');
  await fakeGitHistory(configPath, [
    {
      subject: 'fix: Some bug fix',
    },
    {
      subject: 'feat: Some other thing',
    },
  ]);
  const something = {
    releaseAs: '2.0.0',
  };
  await Deno.writeTextFile(
    `${configPath}/.vbump.json`,
    JSON.stringify(something, null, 2),
  );

  // Full Custom config test
  const fullCustom = await setupPackage(
    'config-test-custom',
    'ssh://git@github.com:fake/test.git',
  );
  const content = {
    versionStrategy: '../../src/testdata/testVersionStrategy.ts',
    preset: '../../src/testdata/testGitConvention.ts',
    changelogWriter: '../../src/testdata/testChangelogWriter.ts',
    gitProvider: '../../src/testdata/testGitProvider.ts',
    changelogPath: 'BOB.md',
  };
  await fakeGitHistory(fullCustom, [
    {
      subject: 'hello',
    },
  ]);
  await Deno.writeTextFile(
    `${fullCustom}/.vbump.json`,
    JSON.stringify(content, null, 2),
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

  it('Works with config files', async () => {
    await runCommand(
      'deno',
      ['run', '-A', '../../cli.ts'],
      'packages/config-test',
    );
    const deps = await Deno.readTextFile('packages/config-test/deps.ts');
    assertMatch(deps, /export const VERSION = '2\.0\.0';/);

    const changelogContent = await Deno.readTextFile(
      'packages/config-test/CHANGELOG.md',
    );
    assertMatch(changelogContent, /^## \[2\.0\.0\]\(.+\)/m);
  });

  it('Works with config files (full custom)', async () => {
    await runCommand(
      'deno',
      ['run', '-A', '../../cli.ts'],
      'packages/config-test-custom',
    );

    const versionData = await Deno.readTextFile(
      'packages/config-test-custom/.version',
    );
    assertEquals(versionData, '1');

    const badChangelog = await Deno.readTextFile(
      'packages/config-test-custom/CHANGELOG.md',
    )
      .catch(() => '');

    assertEquals(badChangelog, '');

    const goodChangelog = await Deno.readTextFile(
      'packages/config-test-custom/BOB.md',
    );

    assertMatch(
      goodChangelog,
      /^## 1 \(https:\/\/custom-domain-name.com\/repo\/.+\)/,
    );
  });
});
