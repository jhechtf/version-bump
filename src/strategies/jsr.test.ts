import {
  afterAll,
  afterEach,
  assertEquals,
  beforeAll,
  describe,
  it,
} from '../../deps.ts';
import { container } from '../container.ts';
import { fakeGitHistory, postTestCleanup, setupPackage } from 'util';
import args from '../../args.ts';
import { VersionStrategy } from '../versionStrategy.ts';
import { Git } from '../git.ts';
import JsrStrategy from './jsr.ts';

beforeAll(async () => {
  const path = await setupPackage(
    'jsr-vs-test',
    'git@github.com:fake/repo.git',
  );
  await Deno.writeTextFile(
    `${path}/jsr.json`,
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

  const path2 = await setupPackage(
    'jsr-vs-test-empty',
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
  container.bind<VersionStrategy>(VersionStrategy).to(JsrStrategy);
});

afterAll(async () => {
  await postTestCleanup(args);
});

describe('JSR Version Strategy', () => {
  afterEach(() => {
    container.unbind('cwd');
  });

  it('Fetches the current version with a deps.ts file present', async () => {
    container.bind('cwd').toConstantValue('packages/jsr-vs-test');
    const vs = container.get(VersionStrategy);
    const currentVersion = await vs.getCurrentVersion();
    assertEquals(currentVersion, '0.1.0');
  });

  it('Falls back to a git tag version', async () => {
    container.bind('cwd').toConstantValue('packages/jsr-vs-test-empty');
    const vs = container.get(VersionStrategy);
    const currentVersion = await vs.getCurrentVersion();
    assertEquals(currentVersion, '0.1.1');
  });

  it('Bumps the version correctly with a given jsr.json', async () => {
    container.bind('cwd').toConstantValue('packages/jsr-vs-test');
    const vs = container.get(VersionStrategy);
    await vs.bump('2.0.0');
    const current = await vs.getCurrentVersion();
    assertEquals(current, '2.0.0');
  });

  it("Creates a jsr.json file when there isn't one", async () => {
    container.bind('cwd').toConstantValue('packages/jsr-vs-test-empty');
    const vs = container.get(VersionStrategy);
    await vs.bump('1.2.3');
    const current = await vs.getCurrentVersion();
    assertEquals(current, '1.2.3');
  });
});
