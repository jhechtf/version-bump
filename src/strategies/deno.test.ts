import { describe, it, beforeAll, afterAll, assertEquals } from '../../deps.ts';
import { setupPackage, fakeGitHistory, postTestCleanup } from 'util';
import { container } from '../container.ts';
import args from '../../args.ts';
import { Git } from '../git.ts';
import { VersionStrategy } from '../versionStrategy.ts';
import DenoVersionStrategy from './deno.ts';

beforeAll(async () => {
  const path = await setupPackage('deno-vs-test', 'git@github.com:fake/repo.git');
  await Deno.writeTextFile(`${path}/deps.ts`, 'export const VERSION = \'0.1.1\'');

  await fakeGitHistory(
    path,
    [
      {
        subject: 'chore: Initial commit',
        tag: '0.1.1',
      }
    ]
  );

  const path2 = await setupPackage('deno-vs-test-empty', 'git@github.com:fake/repo.git');
  
  await fakeGitHistory(
    path2,
    [
      {
        subject: 'chore: Initial commit',
        tag: '0.1.1'
      }
    ]
  )

  container.bind<Git>(Git).to(Git);
  container.bind<VersionStrategy>(VersionStrategy).to(DenoVersionStrategy);
});

afterAll(async () => {
  await postTestCleanup(args);
});

describe('Deno Version Strategy', () => {
  it('Fetches the current version with a deps.ts file present', async () => {
    container.bind('cwd').toConstantValue('packages/deno-vs-test');
    const vs = container.get(VersionStrategy);
    const currentVersion = await vs.getCurrentVersion();
    assertEquals(currentVersion, '0.1.1');
    container.unbind('cwd');
  });

  it('Falls back to a git tag version', async () => {
    container.bind('cwd').toConstantValue('packages/deno-vs-test-empty');
    const vs = container.get(VersionStrategy);
    const currentVersion = await vs.getCurrentVersion();
    assertEquals(currentVersion, '0.1.1');
    container.unbind('cwd');
  });

  it('Bumps the version correctly with a given deps.ts', async () => {
    container.bind('cwd').toConstantValue('packages/deno-vs-test');
    const vs = container.get(VersionStrategy);
    await vs.bump('2.0.0');
    const current = await vs.getCurrentVersion();
    assertEquals(current, '2.0.0');
  });

  it('Creates a deps.ts file when there isn\'t one', async () => {
    container.rebind('cwd').toConstantValue('packages/deno-vs-test-empty');
    const vs = container.get(VersionStrategy);
    await vs.bump('1.2.3');
    const current = await vs.getCurrentVersion();
    assertEquals(current, '1.2.3');
  });
  

})