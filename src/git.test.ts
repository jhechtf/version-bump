import {
  assertEquals,
  assertRejects,
  container,
  emptyDir,
  ensureDir,
} from '../deps.ts';
import '../args.ts';
// import './cwd.ts';
import { Git } from './git.ts';

import { assertObject, urlMap } from './testdata/data.ts';

import { runCommand } from './util.ts';

/**
 * Things we should test in descending order:
 * 1. git.logs
 * 2. git.add
 * 3. git.tag
 * 4. git.latestTag
 * 5. git.commit
 * 6. git.tagExists
 * 7. git.remote
 */

/**
 * Rough thought process to get the tests up and going.
 * 1. Build a directory in the packages/ dir.
 * 2. Add a bunch of fake commits to it, including tags.
 * This could be done with a new helper function, which might help increase testing
 * visibility in the main cli tests.
 * 3. Ensure that the values are correct.
 * 4. Profit
 */

export async function prepareGitTests() {
  // ensure the directory is there.
  await ensureDir('packages/git-test');
  // initialize git
  await runCommand(
    'git',
    ['init'],
    'packages/git-test',
  );
  // Setup username
  await runCommand(
    'git',
    ['config', 'user.name', 'Testing'],
    'packages/git-test',
  );
  await runCommand(
    'git',
    ['config','commit.gpgsign', 'false'],
    'packages/git-test'
  )
  // Setup user email
  await runCommand(
    'git',
    ['config', 'user.email', 'testing@test.test'],
    'packages/git-test',
  );

  await runCommand(
    'git',
    ['commit', '-m', 'test commit', '--allow-empty'],
    'packages/git-test',
  );

  await runCommand(
    'git',
    ['tag', '0.1.0'],
    'packages/git-test',
  );

  await runCommand(
    'git',
    ['commit', '-m', 'new commit', '--allow-empty'],
    'packages/git-test',
  );

  await runCommand(
    'git',
    ['tag', '0.2.0'],
    'packages/git-test',
  );
}

for (const [url, expected] of Object.entries(urlMap)) {
  Deno.test('Testing ' + url, () => {
    const parsed = Git.parseGitRemoteUrl(url);
    assertObject(
      parsed,
      expected,
    );
  });
}

Deno.test('Git Class', async (t) => {
  await prepareGitTests();
  container.register('cwd', { useValue: 'packages/git-test' });
  const git = container.resolve(Git);

  await t.step('Logs work', async () => {
    // Grab items
    const items = await git.logs();

    // Make sure we have the correct count.
    assertEquals(
      items.length,
      2,
    );
    // Assert that the objects look correct.
    // We include the sha because there's no way we can check that.
    assertObject(items[0], {
      ...items[0],
      subject: 'new commit',
      author: 'Testing',
      tag: '0.2.0',
      body: '',
    });

    assertObject(items[1], {
      ...items[1],
      subject: 'test commit',
      author: 'Testing',
      tag: '0.1.0',
      body: '',
    });

    await assertRejects(() => git.logs('BAD_THING'));
  });

  await t.step('Commit works', async () => {
    await git.commit('testing commit functionality', true);
    const logs = await git.logs();

    assertObject(
      logs[0],
      { ...logs[0], subject: 'testing commit functionality' },
    );
  });

  await t.step('Tag works', async () => {
    let commits = await git.logs('HEAD~1');
    assertEquals(
      commits.length,
      1,
    );
    assertEquals(
      commits[0].tag,
      '',
    );

    await git.tag('0.3.0');
    commits = await git.logs('HEAD~1');
    assertObject(
      commits[0],
      {
        ...commits[0],
        tag: '0.3.0',
      },
    );
  });

  await t.step('tagExists returns correctly', async () => {
    assertEquals(
      await git.tagExists('0.3.0'),
      true,
    );

    assertEquals(
      await git.tagExists('1.0.0'),
      false,
    );
  });

  await t.step('getLatestTag works correctly', async () => {
    const currentTag = await git.getLatestTag();

    assertEquals(
      currentTag,
      '0.3.0',
    );
  });

  await t.step('Add and commit work', async () => {
    await Deno.writeTextFile('packages/git-test/some-new-file.txt', '');
    assertEquals(
      await git.add(['some-new-file.txt']),
      true,
    );
    // We have to use this because git status is not needed in the Git class.
    let statusOutput = await runCommand('git', ['status'], 'packages/git-test');
    assertEquals(
      statusOutput.stdout.includes('new file:'),
      true,
    );
    assertEquals(
      statusOutput.stdout.includes('some-new-file.txt'),
      true,
    );

    await git.commit('with new file');
    const logs = await git.logs('HEAD~1');
    assertEquals(
      logs.length,
      1,
    );
    assertObject(
      logs[0],
      { ...logs[0], subject: 'with new file' },
    );
    statusOutput = await runCommand('git', ['status'], 'packages/git-test');
    assertEquals(
      statusOutput.stdout.includes('nothing to commit'),
      true,
    );
    const diff = await runCommand('git', [
      'diff',
      'HEAD~1..HEAD',
      '--name-only',
    ], 'packages/git-test');
    assertEquals(
      diff.stdout.trim(),
      'some-new-file.txt',
    );
  });

  await t.step('Remote functions', async () => {
    await git.remote('add', 'origin', 'git@github.com:some-user/some-repo.git');
    const remote = await git.remote();
    assertEquals(
      remote.stdout && remote.stdout.trim(),
      'git@github.com:some-user/some-repo.git',
    );
  });

  await emptyDir('packages/git-test');
});
