import {
  assertEquals,
  assertMatch,
  assertNotEquals,
  assertRejects,
  emptyDir,
} from './deps.ts';
import _cli from './cli.ts';
import args from './args.ts';

import { runCommand } from './src/util.ts';
import { Commit } from './src/commit.ts';

const strategies = [
  'deno',
  'node',
  'cargo',
  'historic',
  'multiple-changelog-runs',
] as const;

type UnsavedCommit = Omit<Commit, 'sha' | 'author' | 'tag'> & {
  tag?: string;
};

const GIT_USERNAME = 'Testing';
const GIT_EMAIL = 'testing@email.com';

async function writeGitHistory(
  dir: string,
  remote: string,
  user: { username: string; email: string },
  commits: UnsavedCommit[],
): Promise<boolean> {
  console.group(dir);

  console.info('initializing git in repo ');
  // Step 1: initiate Git
  await runCommand('git', [
    'init',
  ], dir);

  console.info('Configuring username');
  // Add username + email needed for commits
  await runCommand('git', [
    'config',
    'user.name',
    user.username,
  ], dir);

  console.info('disabling gpg signing (in case user has it enabled)');
  await runCommand(
    'git',
    ['config', 'commit.gpgsign', 'false'],
    dir,
  );

  console.info('Configuring email');
  await runCommand('git', [
    'config',
    'user.email',
    user.email,
  ], dir);

  console.info('Adding origin', remote);
  // Add remote url
  await runCommand('git', [
    'remote',
    'add',
    'origin',
    remote,
  ], dir);

  // Step 2: Add commits.

  for (const commit of commits) {
    console.info('Writing commit', commit.subject);
    const args = ['commit', '-m', commit.subject];
    if (commit.body) args.push('-m', commit.body);

    args.push('--allow-empty');

    await runCommand('git', args, dir);

    if (commit.tag) await runCommand('git', ['tag', commit.tag], dir);
  }
  console.groupEnd();

  return true;
}

const commitMap: UnsavedCommit[] = [
  {
    subject: 'chore: initial commit',
  },
  {
    subject: 'chore(release): 0.1.0',
    tag: '0.1.0',
  },
  {
    subject: 'fix: fixed render bug',
    body: 'some random body text',
  },
  {
    subject: 'chore(release): 0.1.1',
    tag: '0.1.1',
  },
  {
    subject: 'feat: Adds in new feature',
    body: 'assorted body text',
  },
];

async function setupTestingEnv(): Promise<void> {
  console.log('Setting up mock packages...');
  for (const strategy of strategies) {
    console.info(`Working for repo with strategy ${strategy}`);
    const packageUrl = `packages/github.com/${strategy}`;
    // Makes the empty directory.
    await emptyDir(packageUrl);
    await writeGitHistory(packageUrl, 'ssh://github.com:user/some-repo.git', {
      username: GIT_USERNAME,
      email: GIT_EMAIL,
    }, commitMap);

    if (strategy === 'deno' || strategy === 'historic') {
      await Deno.writeTextFile(
        `${packageUrl}/deps.ts`,
        `export const VERSION = "0.1.1"`,
      );
    } else if (strategy === 'cargo') {
      await Deno.writeTextFile(
        `${packageUrl}/Cargo.toml`,
        '[package]\nversion = "0.1"\n\n[dependencies]\nsomething = { version = "1.0.0" }',
      );
    } else {
      await Deno.writeTextFile(
        `${packageUrl}/package.json`,
        `{"version": "0.1.1"}`,
      );
    }
  }

  // No Tags
  await emptyDir('packages/github.com/no-tags');
  await writeGitHistory(
    'packages/github.com/no-tags',
    'ssh://github.com:user/some-repo.git',
    {
      username: GIT_USERNAME,
      email: GIT_EMAIL,
    },
    commitMap.map((v) => ({
      ...v,
      tag: undefined,
    })),
  );
  // No Git History
  await emptyDir('packages/github.com/no-extra-commit');
  await writeGitHistory(
    'packages/github.com/no-extra-commit',
    'ssh://github.com:user/some-repo.git',
    { username: GIT_USERNAME, email: GIT_EMAIL },
    [
      {
        subject: 'chore(release): 0.1.0',
        tag: '0.1.0',
      },
    ],
  );

  // Full Custom
  await emptyDir('packages/github.com/full-custom');
  await writeGitHistory(
    'packages/github.com/full-custom',
    'ssh://github.com:user/some-repo.git',
    { username: GIT_USERNAME, email: GIT_EMAIL },
    [
      {
        subject: 'hello',
      },
    ],
  );
}

async function tearDown() {
  await emptyDir('packages');
  await Deno.remove('packages', { recursive: true });
}

Deno.test('CLI Test', async (t) => {
  // Setup Testing Environment
  await setupTestingEnv();

  // The Changelog Header

  const HEADER = [
    '# Changelog',
    'All notable changes to this project will be documented in this file.',
    'File has been auto generated by version-bump. See [version-bump](https://deno.land/x/version_bump)',
  ];
  args.dryRun = true;
  // Testing Deno preset
  await t.step({
    name: 'Deno Preset',
    fn: async () => {
      await runCommand('deno', [
        'run',
        '-A',
        '../../../cli.ts',
      ], 'packages/github.com/deno');

      // Grab the changelog file.
      const changelogContent = await Deno.readTextFile(
        'packages/github.com/deno/CHANGELOG.md',
      );

      // Ensure the header is present.
      assertEquals(
        changelogContent.includes(
          HEADER.join('\n\n'),
        ),
        true,
      );
      assertEquals(
        changelogContent.includes('## [0.2.0]'),
        true,
      );
      assertEquals(changelogContent.includes('### Features'), true);
      assertMatch(
        changelogContent,
        /\- Adds in new feature\n\s+\[(\w{8})\]\(https:\/\/github.com\/user\/some-repo\/commit\/\1\w+\)/,
      );
      const verisonContent = await Deno.readTextFile(
        'packages/github.com/deno/deps.ts',
      );

      assertMatch(
        verisonContent,
        /VERSION = "0\.2\.0"/,
      );
    },
  });

  await t.step({
    name: 'Testing Node Preset',
    fn: async () => {
      await runCommand('deno', [
        'run',
        '-A',
        '../../../cli.ts',
        '--versionStrategy',
        'node',
      ], 'packages/github.com/node');

      // Grab the changelog file.
      const changelogContent = await Deno.readTextFile(
        'packages/github.com/node/CHANGELOG.md',
      );

      // Ensure the header is present.
      assertEquals(
        changelogContent.includes(
          HEADER.join('\n\n'),
        ),
        true,
      );
      assertEquals(
        changelogContent.includes('## [0.2.0]'),
        true,
      );
      assertEquals(changelogContent.includes('### Features'), true);
      assertMatch(
        changelogContent,
        /\- Adds in new feature\n\s+\[(\w{8})\]\(https:\/\/github.com\/user\/some-repo\/commit\/\1\w+\)/,
      );

      const packageContent = JSON.parse(
        await Deno.readTextFile('packages/github.com/node/package.json'),
      ) as any;

      assertEquals(
        packageContent.version,
        '0.2.0',
      );
    },
  });

  await t.step({
    name: 'Historic Test',
    fn: async () => {
      await runCommand(
        'deno',
        [
          'run',
          '-A',
          '../../../cli.ts',
          '--historic',
        ],
        'packages/github.com/historic',
      );
      const content = await Deno.readTextFile(
        'packages/github.com/historic/CHANGELOG.md',
      );
      const matches = content.match(/^## (.*)$/mg);

      if (!matches?.length) {
        throw new Error('Expected matches in CHANGELOG file. None found');
      }

      assertEquals(
        matches?.length,
        3,
      );

      assertEquals(
        matches[2],
        '## 0.1.0',
      );

      assertEquals(
        matches[0],
        '## [0.2.0](https://github.com/user/some-repo/compare/0.1.1..0.2.0)',
      );

      const deps = await Deno.readTextFile(
        'packages/github.com/historic/deps.ts',
      );

      assertMatch(
        deps,
        /VERSION = "0\.2\.0"/,
      );
    },
  });

  await t.step('Multiple Deno Runs', async () => {
    // Run the first time and ensure that everything is there...
    await runCommand(
      'deno',
      [
        'run',
        '-A',
        '../../../cli.ts',
        '--versionStrategy',
        'node',
      ],
      'packages/github.com/multiple-changelog-runs',
    );

    let currentChangelogContents = await Deno.readTextFile(
      'packages/github.com/multiple-changelog-runs/CHANGELOG.md',
    );

    assertMatch(
      currentChangelogContents,
      /## \[0\.2\.0\]/,
    );

    assertMatch(
      currentChangelogContents,
      /### Features/,
    );

    // Add more commits and run the command again.
    await runCommand(
      'git',
      [
        'commit',
        '-m',
        'fix: extra commit',
        '--allow-empty',
      ],
      'packages/github.com/multiple-changelog-runs',
    );

    await runCommand(
      'deno',
      [
        'run',
        '-A',
        '../../../cli.ts',
        '--versionStrategy',
        'node',
      ],
      'packages/github.com/multiple-changelog-runs',
    );

    currentChangelogContents = await Deno.readTextFile(
      'packages/github.com/multiple-changelog-runs/CHANGELOG.md',
    );

    // Assert the old content is still there...
    assertMatch(
      currentChangelogContents,
      /## \[0\.2\.1\]/,
    );

    assertMatch(
      currentChangelogContents,
      /## \[0\.2\.1\]/,
    );

    assertMatch(
      currentChangelogContents,
      /### Bug Fixes/,
    );
  });

  await t.step('Test Cargo VersionStrategy', async () => {
    await runCommand(
      'deno',
      [
        'run',
        '-A',
        '../../../cli.ts',
        '--versionStrategy',
        'cargo',
      ],
      'packages/github.com/cargo',
    );
    // Grab the changelog file.
    const changelogContent = await Deno.readTextFile(
      'packages/github.com/cargo/CHANGELOG.md',
    );

    // Ensure the header is present.
    assertEquals(
      changelogContent.includes(
        HEADER.join('\n\n'),
      ),
      true,
    );
    assertEquals(
      changelogContent.includes('## [0.2.0]'),
      true,
    );
    assertEquals(changelogContent.includes('### Features'), true);
    assertMatch(
      changelogContent,
      /\- Adds in new feature\n\s+\[(\w{8})\]\(https:\/\/github.com\/user\/some-repo\/commit\/\1\w+\)/,
    );

    const packageContent = await Deno.readTextFile(
      'packages/github.com/cargo/Cargo.toml',
    );

    assertEquals(
      packageContent.includes('version = "0.2.0"'),
      true,
    );
  });

  await t.step('No Tags test', async () => {
    await runCommand(
      'deno',
      [
        'run',
        '-A',
        '../../../cli.ts',
      ],
      'packages/github.com/no-tags',
    );

    const changelogContent = await Deno.readTextFile(
      'packages/github.com/no-tags/CHANGELOG.md',
    );

    assertMatch(
      changelogContent,
      /## \[0\.2\.0\]\(.*0\.1\.0\.\.0\.2\.0\)/,
    );

    const depsFile = await Deno.readTextFile(
      'packages/github.com/no-tags/deps.ts',
    );
    assertMatch(
      depsFile,
      /const VERSION = "0\.2\.0"/,
    );
  });

  await t.step('No Extra Commits', async () => {
    await assertRejects(
      () =>
        runCommand(
          'deno',
          ['run', '-A', '../../../cli.ts'],
          'packages/github.com/no-extra-commit',
        ),
      Error,
    );
  });

  await t.step('Full Custom', async () => {
    /**
     * Guns-a-blazing, let's custom do _everything_.
     */
    await runCommand(
      'deno',
      [
        'run',
        '-A',
        '../../../cli.ts',
        '--versionStrategy',
        '../../../src/testdata/testVersionStrategy.ts',
        '--preset',
        '../../../src/testdata/testGitConvention.ts',
        '--changelogWriter',
        '../../../src/testdata/testChangelogWriter.ts',
        '--gitProvider',
        '../../../src/testdata/testGitProvider.ts',
      ],
      'packages/github.com/full-custom',
    );

    // Grab contents of relevant items.
    const versionInfo = await Deno.readTextFile(
      'packages/github.com/full-custom/.version',
    ).catch(() => '');
    const changelog = await Deno.readTextFile(
      'packages/github.com/full-custom/CHANGELOG.md',
    ).catch(() => '');

    assertNotEquals(versionInfo, '');
    assertNotEquals(changelog, '');

    assertEquals(versionInfo, '1');
    assertMatch(
      changelog,
      /## 1 \(https:\/\/custom-domain-name\.com\/repo\/0\.1\.0\.\.1\)/,
    );
    assertMatch(
      changelog,
      /hello \- https:\/\/custom-domain-name\.com\/repo\/\-\/[a-z0-9]+/,
    );
  });

  // Remove the packages if we aren't skipping teardown to do an inspection of
  // the directories for reasons.
  if (!Deno.args.includes('--skipTeardown')) {
    await tearDown();
  }
});
