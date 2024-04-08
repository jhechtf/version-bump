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
import JsonStrategy from './json.ts';

const map = new Map<string, string>([
  ['deno', 'deno.json'],
  ['deno-jsonc', 'deno.jsonc'],
  ['node', 'package.json'],
  ['jsr', 'jsr.json']
]);

const paths = new Map<string, string>();

// await beforeAll(async () => {

//   for(const [shortName, jsonFile] of map) {
//     console.info('yo?');
//     const path = await setupPackage(
//       `universal-json-${shortName}-test`,
//       'git@github.com:fake/repo.git'
//     );
//     paths.set(shortName, path);
//     console.info(paths);
//     await Deno.writeTextFile(
//       `${path}/${jsonFile}`,
//       JSON.stringify({
//         version: '0.1.0',
//         name: '@testing/something',
//         keywords: ['testing']
//       }, null, 2)
//     );

//     await fakeGitHistory(path, [
//       {
//         subject: 'chore: Initial commit',
//         tag: '0.1.0'
//       },
//     ]);
//   }

//   const path = await setupPackage(
//     'universal-json-vs-test',
//     'git@github.com:fake/repo.git',
//   );
//   await Deno.writeTextFile(
//     `${path}/deno.json`,
//     JSON.stringify(
//       {
//         version: '0.1.0',
//         name: '@test/something',
//         keywords: ['testing'],
//       },
//       null,
//       2,
//     ),
//   );

//   const path3 = await setupPackage(
//     'universal-json-vs-test-with-jsonc',
//     'git@github.com:fake/repo.git',
//   );
//   await Deno.writeTextFile(
//     `${path3}/jsr.json`,
//     `{
//   // Current version
//   "version": "0.1.1",
//   // Name
//   "name": "@testing/test-repo"
// }`,
//   );
//   await fakeGitHistory(
//     path3,
//     [
//       {
//         subject: 'chore: Initial commit',
//         tag: '0.1.1',
//       },
//     ],
//   );

//   const path2 = await setupPackage(
//     'universal-json-vs-test-empty',
//     'git@github.com:fake/repo.git',
//   );
//   await fakeGitHistory(
//     path2,
//     [
//       {
//         subject: 'chore: Initial commit',
//         tag: '0.1.1',
//       },
//     ],
//   );

//   await fakeGitHistory(
//     path,
//     [
//       {
//         subject: 'chore: Initial commit',
//         tag: '0.1.0',
//       },
//     ],
//   );

//   container.bind<Git>(Git).to(Git);
//   container.bind<VersionStrategy>(VersionStrategy).to(JsonStrategy);
// });

afterAll(async () => {
  await postTestCleanup(args);
});

describe('Generic JSON Version Strategy', async () => {
  await beforeAll(async () => {

  for(const [shortName, jsonFile] of map) {
    console.info('yo?');
    const path = await setupPackage(
      `universal-json-${shortName}-test`,
      'git@github.com:fake/repo.git'
    );
    paths.set(shortName, path);
    console.info(paths);
    await Deno.writeTextFile(
      `${path}/${jsonFile}`,
      JSON.stringify({
        version: '0.1.0',
        name: '@testing/something',
        keywords: ['testing']
      }, null, 2)
    );

    await fakeGitHistory(path, [
      {
        subject: 'chore: Initial commit',
        tag: '0.1.0'
      },
    ]);
  }

  const path = await setupPackage(
    'universal-json-vs-test',
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
    'universal-json-vs-test-with-jsonc',
    'git@github.com:fake/repo.git',
  );
  await Deno.writeTextFile(
    `${path3}/jsr.json`,
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
    'universal-json-vs-test-empty',
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
  container.bind<VersionStrategy>(VersionStrategy).to(JsonStrategy);
});
  afterEach(() => {
    container.unbind('cwd');
  });
  it('testing', ()=>{
    container.bind('cwd').toConstantValue('');
    assertEquals(1, 1);
  });
  console.info(paths);
  for(const [shortName, path] of paths) {
    console.info(shortName);
    const file = map.get(shortName) as string;
    describe(`${shortName} ${file}`, () => {
      args.jsonFile = file;
      it('Reads version correctly', async () => {
        container.bind('cwd').toConstantValue(path);
        const vs = container.get(VersionStrategy);
        const currentVersion = await vs.getCurrentVersion();
        assertEquals(currentVersion, '0.1.0');
      });
    });
  }

  it('Fetches the current version with a deps.ts file present', async () => {
    container.bind('cwd').toConstantValue('packages/universal-json-vs-test');
    const vs = container.get(VersionStrategy);
    const currentVersion = await vs.getCurrentVersion();
    assertEquals(currentVersion, '0.1.0');
  });

  it('Falls back to a git tag version', async () => {
    container.bind('cwd').toConstantValue(
      'packages/universal-json-vs-test-empty',
    );
    const vs = container.get(VersionStrategy);
    const currentVersion = await vs.getCurrentVersion();
    assertEquals(currentVersion, '0.1.1');
  });

  it('Bumps the version correctly with a given deno.json', async () => {
    container.bind('cwd').toConstantValue('packages/universal-json-vs-test');
    const vs = container.get(VersionStrategy);
    await vs.bump('2.0.0');
    const current = await vs.getCurrentVersion();
    assertEquals(current, '2.0.0');
  });

  it("Creates a deno.json file when there isn't one", async () => {
    container.bind('cwd').toConstantValue(
      'packages/universal-json-vs-test-empty',
    );
    const vs = container.get(VersionStrategy);
    await vs.bump('1.2.3');
    const current = await vs.getCurrentVersion();
    assertEquals(current, '1.2.3');
  });

  it('Gets the version if there is a jsr.json file', async () => {
    container.bind('cwd').toConstantValue(
      'packages/universal-json-vs-test-with-jsonc',
    );
    const vs = container.get(VersionStrategy);
    assertEquals(await vs.getCurrentVersion(), '0.1.1');
  });

  it('Bumps the version when there is a .json file', async () => {
    container.bind('cwd').toConstantValue(
      'packages/universal-json-vs-test-with-jsonc',
    );
    const vs = container.get(VersionStrategy);
    await vs.bump('2.1.1');
    const current = await vs.getCurrentVersion();
    assertEquals(current, '2.1.1');
    const raw = await Deno.readTextFile(
      resolve('packages/universal-json-vs-test-with-jsonc', 'jsr.json'),
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
