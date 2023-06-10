import { assertEquals, emptyDir, ensureDir } from '../../deps.ts';
import { container } from '../container.ts';
import { runCommand } from '../util.ts';
import CargoVersionStrategy from './cargo.ts';
import { VersionStrategy } from '../versionStrategy.ts';
import { Git } from '../git.ts';

Deno.test(
  'Cargo Testing',
  async (t) => {
    // build a cargo package
    await ensureDir('packages/cargo-vs');
    await emptyDir('packages/cargo-vs');
    await runCommand(
      'git',
      ['init'],
      'packages/cargo-vs',
    );
    await runCommand(
      'git',
      ['config', 'commit.gpgsign', 'false'],
      'packages/cargo-vs',
    );
    await runCommand(
      'git',
      ['config', 'user.email', 'testing@test.com'],
      'packages/cargo-vs',
    );
    await runCommand(
      'git',
      ['config', 'user.name', 'Testing'],
      'packages/cargo-vs',
    );
    await Deno.writeTextFile(
      'packages/cargo-vs/Cargo.toml',
      `[package]
version = "0.1.1"

[dependencies]
`,
    );
    await runCommand(
      'git',
      ['commit', '-m', 'chore: Initial Commit', '--allow-empty'],
      'packages/cargo-vs',
    );
    await runCommand(
      'git',
      ['tag', '0.1.1'],
      'packages/cargo-vs',
    );

    container.bind('cwd').toConstantValue('packages/cargo-vs');
    container.bind<Git>(Git).to(Git);
    // container.bind(Git, {
    //   useClass: Git,
    // });
    container.bind<VersionStrategy>(VersionStrategy).to(CargoVersionStrategy);

    await t.step('Test GetCurrentVersion', async () => {
      // const vsInstance = container.resolve<VersionStrategy>(VersionStrategy);
      // const currentVersion = await vsInstance.getCurrentVersion();
      // assertEquals(currentVersion, '0.1.1');
    });
    await t.step('Test Bump Version', async () => {
      // const vsInstance = container.resolve<VersionStrategy>(VersionStrategy);
      // await vsInstance.bump('2.0.0');
      // const newVersion = await vsInstance.getCurrentVersion();
      // assertEquals(newVersion, '2.0.0');
    });

    // TODO(jim): Add in a version that does not have a good Cargo.toml file.
  },
);
