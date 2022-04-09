import { emptyDir } from 'deps';

import { runCommand } from 'src/util.ts';
import { Commit } from 'src/commit.ts';

const providers = [
  'github.com',
  'gitlab.com',
  'bitbucket.com'
];

const strategies = [
  'deno',
  'node'
];

const GIT_USERNAME = 'Testing';
const GIT_EMAIL = 'testing@email.com';

type UnsavedCommit =  Omit<Commit, 'sha' | 'author'> & {
  tag?: string;
};

const commits: UnsavedCommit[] = [
  {
    subject: 'fix: Testing'
  },
  {
    subject: 'feat: Added feature',
    body: 'this has a body'
  },
  {
    subject: 'feat: New cool feature',
    body: 'BREAKING testing'
  }
];

const basePackageDir = 'packages';

async function writeGitHistory(dir: string, remote: string, user: { username: string; email: string; }, commits: UnsavedCommit[]): Promise<boolean> {
  console.info(dir, user, commits);

  // Step 1: initiate Git
  await runCommand('git', [
    'init'
  ], dir);

  // Add username + email needed for commits
  await runCommand('git', [
    'config',
    'user.name',
    user.username
  ], dir);

  await runCommand('git', [
    'config',
    'user.email',
    user.email
  ], dir);

  // Add remote url
  await runCommand('git', [
    'remote',
    'add',
    'origin',
    remote
  ], dir);
  
  // Step 2: Add commits. 

  for(const commit of commits) {
    console.info('Adding commit ', commit);
    const args = ['commit', '-m', commit.subject];
    if(commit.body) args.push('-m', commit.body);
    // Need to allow empty changes.
    args.push('--allow-empty');

    await runCommand('git', args, dir);
  }

  return false;
}

async function setupTestingEnv(): Promise<void> {
  console.log('Setting up mock packages...');
  for(const provider of  providers) {
    for(const strategy of strategies) {
      console.info(`Writing to ${basePackageDir}/${provider}/${strategy}`);
      await emptyDir(`${basePackageDir}/${provider}/${strategy}`);
      if(strategy === 'node') {
        console.info('Writing package.json file...');
        await Deno.writeTextFile(`${basePackageDir}/${provider}/${strategy}/package.json`, `{"version": "0.1.0"}`);
      } else if (strategy  === 'deno') {
        console.info('Writing deps.ts file');
        await Deno.writeTextFile(`${basePackageDir}/${provider}/${strategy}/deps.ts`, `export const VERSION =  "0.1.0";`)
      }

      console.info('Write fake commits now...');
      await writeGitHistory(`${basePackageDir}/${provider}/${strategy}`, 
        `ssh://${provider}:user/some-repo.git`,
      {
        username: GIT_USERNAME,
        email: GIT_EMAIL
      }, commits);
    }
  }
  
}

Deno.test('CLI Test', async (t) => {
  await setupTestingEnv();
  // await t.step({
  //   name: 'Testing Deno Preset',
  //   fn: async () => {
  //     const output = await runCommand('git', ['log'], 'packages/deno');
  //     console.info(output.stdout);
  //     const commandRun = await runCommand(
  //       'deno',
  //       ['run', '-A', '../../mod.ts'],
  //       'packages/deno',
  //     );
  //     console.log(commandRun);
  //   },
  // });
});
