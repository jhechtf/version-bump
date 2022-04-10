import { assertEquals, emptyDir } from 'deps';

import { runCommand } from 'src/util.ts';
import { Commit } from 'src/commit.ts';

const strategies = [
  'deno',
  'node',
];

type UnsavedCommit = Omit<Commit, 'sha' | 'author'> & {
  tag?: string;
};

const GIT_USERNAME = 'Testing';
const GIT_EMAIL = 'testing@email.com';

const basePackageDir = 'packages';

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
    tag: 'v0.1.0',
  },
  {
    subject: 'fix: fixed render bug',
    body: 'some random body text',
  },
  {
    subject: 'chore(release): 0.1.1',
    tag: 'v0.1.1',
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

    if (strategy === 'deno') {
      await Deno.writeTextFile(
        `${packageUrl}/deps.ts`,
        `export const VERSION = "0.1.1"`,
      );
    } else {
      await Deno.writeTextFile(
        `${packageUrl}/package.json`,
        `{"version": "0.1.1"}`,
      );
    }
  }
}

async function tearDown() {
  await emptyDir('packages');
  await Deno.remove('packages', { recursive: true });
}

Deno.test('CLI Test', async (t) => {
  // Setup Testing Environment
  await setupTestingEnv();
  await t.step({
    name: 'Testing Deno Preset',
    fn: async () => {
      const output = await runCommand(
        'git',
        ['log'],
        'packages/github.com/deno',
      );
      console.info(output);
    },
  });

  // Remove the packages if we aren't skipping teardown to do an inspection of
  // the directories for reasons.
  if (!Deno.args.includes('--skipTeardown')) {
    await tearDown();
  }
});
