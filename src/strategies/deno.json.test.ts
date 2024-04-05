import {
  afterAll,
  afterEach,
  assertEquals,
  beforeAll,
  describe,
  it,
  resolve,
} from '../../deps.ts';
import { container } from '../container.ts';
import { fakeGitHistory, postTestCleanup, setupPackage } from 'util';
import args from '../../args.ts';
import { VersionStrategy } from '../versionStrategy.ts';
import { Git } from '../git.ts';
import DenoJsonStrategy from './deno.json.ts';
import { assert } from 'https://deno.land/std@0.132.0/_util/assert.ts';

beforeAll(async () => {
  const path = await setupPackage(
    'deno-json-vs-test',
    'git@github.com:fake/repo.git',
  );
  await Deno.writeTextFile(
    `${path}/deno.json`,
    JSON.stringify(
      {
        version: '0.1.0',
        name: '@test/something',
        keywords: ['testing'],
      },
      null,
      2,
    ),
  );

  const path3 = await setupPackage(
    'deno-json-vs-test-with-jsonc',
    'git@github.com:fake/repo.git',
  );
  await Deno.writeTextFile(
    `${path3}/deno.jsonc`,
    `{
  // Current version
  "version": "0.1.1",
  // Name
  "name": "@testing/test-repo"
}`,
  );
  await fakeGitHistory(
    path3,
    [
      {
        subject: 'chore: Initial commit',
        tag: '0.1.1',
      },
    ],
  );

  const path2 = await setupPackage(
    'deno-json-vs-test-empty',
    'git@github.com:fake/repo.git',
  );
  await fakeGitHistory(
    path2,
    [
      {
        subject: 'chore: Initial commit',
        tag: '0.1.1',
      },
    ],
  );

  await fakeGitHistory(
    path,
    [
      {
        subject: 'chore: Initial commit',
        tag: '0.1.0',
      },
    ],
  );

  container.bind<Git>(Git).to(Git);
  container.bind<VersionStrategy>(VersionStrategy).to(DenoJsonStrategy);
});

afterAll(async () => {
  await postTestCleanup(args);
});

describe('Deno JSON Version Strategy', () => {
  afterEach(() => {
    container.unbind('cwd');
  });

  it('Fetches the current version with a deps.ts file present', async () => {
    container.bind('cwd').toConstantValue('packages/deno-json-vs-test');
    const vs = container.get(VersionStrategy);
    const currentVersion = await vs.getCurrentVersion();
    assertEquals(currentVersion, '0.1.0');
  });

  it('Falls back to a git tag version', async () => {
    container.bind('cwd').toConstantValue('packages/deno-json-vs-test-empty');
    const vs = container.get(VersionStrategy);
    const currentVersion = await vs.getCurrentVersion();
    assertEquals(currentVersion, '0.1.1');
  });

  it('Bumps the version correctly with a given deno.json', async () => {
    container.bind('cwd').toConstantValue('packages/deno-json-vs-test');
    const vs = container.get(VersionStrategy);
    await vs.bump('2.0.0');
    const current = await vs.getCurrentVersion();
    assertEquals(current, '2.0.0');
  });

  it("Creates a deno.json file when there isn't one", async () => {
    container.bind('cwd').toConstantValue('packages/deno-json-vs-test-empty');
    const vs = container.get(VersionStrategy);
    await vs.bump('1.2.3');
    const current = await vs.getCurrentVersion();
    assertEquals(current, '1.2.3');
  });

  it('Gets the version if there is a deno.jsonc file', async () => {
    container.bind('cwd').toConstantValue(
      'packages/deno-json-vs-test-with-jsonc',
    );
    const vs = container.get(VersionStrategy);
    assertEquals(await vs.getCurrentVersion(), '0.1.1');
  });

  it('Bumps the version when there is a .jsonc file', async () => {
    container.bind('cwd').toConstantValue(
      'packages/deno-json-vs-test-with-jsonc',
    );
    const vs = container.get(VersionStrategy);
    await vs.bump('2.1.1');
    const current = await vs.getCurrentVersion();
    assertEquals(current, '2.1.1');
    const raw = await Deno.readTextFile(
      resolve('packages/deno-json-vs-test-with-jsonc', 'deno.jsonc'),
    );
    assertEquals(
      raw,
      `{
  // Current version
  "version": "2.1.1",
  // Name
  "name": "@testing/test-repo"
}`,
    );
  });
});
