# Version Bump

We bumpin' versions like it's 1999.

Inspiration for this project comes from
[Standard Version](https://github.com/conventional-changelog/standard-version).

## Version Bump 2.0

Version Bump has moved from TSyringe to Inversify. The move was done largely as
an effort to enable Version Bump to run in versions of Deno that used TypeScript
5+, which made some changes to decorators that broke TSyringe.

For Version Bump `>=2.0.0` you will need to be on at least `deno>=1.31.0`.

## Notes

**VERSION 0.2.0 IS BROKEN. DO _NOT_ USE**

If you are using a version of Deno that has TypeScript 5, you will need to use
Version Bump `>=1.1.1`, OR run with the `--no-check` (not advised) option, e.g.:

```
deno run -A --no-check https://deno.land/x/version_bump/cli.ts
```

This is because TS 5 made some updates to decorators which changed the
definitions for certain types of decorators.

### Things to come

Nothing so far, but feel free to file a new
[Issue](https://github.com/jhechtf/version-bump/issues) in the Github repo to
request something

## Installation and Usage

### Configuration File

If you create a `.vbump.json` file in the same directory where you would run
`version-bump`, then you can use it to hold configuration options so that you
don't have to pass in the information every time you run the CLI.

The values you can pass in the file are documented in the schema JSON noted
below.

```jsonc
{
  "$schema": "https://deno.land/x/version_bump/schema/config.json",
  // Could also be set to a local file like "./custom-preset".
  "preset": "https://some-host.com/custom-preset.ts"
}
```

### As a task

The preferred way to use Version Bump would be to add a task definition to your
`deno.json` file like so

```json
{
  "tasks": {
    "version-bump": "deno run -A https://deno.land/x/version_bump@1.1.0/cli.ts"
  }
}
```

#### In GitHub Actions

Create a workflow called `version.yml` in `.github/workflows` with the following
contents

**NOTE 1:** Version Bump defaults to whoever the current Git user is. If your
Github branch has protection rules that require pull requests or signed commits,
this job _will_ fail. Work is being done to determine the best way to sign
commits through actions. See
[#33](https://github.com/jhechtf/version-bump/issues/33) for information as it
comes.

**NOTE 2:** When using `actions/checkout@v3` you must set a `fetch-depth` to `0`
in order to get all the commit history. If your repository has many commits
between version releases, this might cause an increase in run time and could
possibly fail.

```yml
name: Version Bump
on:
  push:
    branches: ["mainline"]

permissions:
  contents: write
jobs:
  bump:
    name: Bump and Push
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          # Gotta set the fetch depth to 0 so that it fetches everything
          fetch-depth: 0
      - uses: denoland/setup-deno@v1
      - run: git config user.name "version-bot" && git config user.email "your-email+bot@gmail.com"
      - run: deno task version-bump
      - run: git push && git push --tags
```

### Installation (not recommended)

For Deno `<1.20`, you must install or run the script directly.

```
deno install -A -n version-bump https://deno.land/x/version_bump/cli.ts
# In the git directory you want to version bump
version-bump
```

#### Alternative

```
deno run -A https://deno.land/x/version_bump/cli.ts
```

## Options

Currently we have the following command-line arguments you can pass.

### --firstRelease

Adding `--firstRelease` will not bump version, regardless of commits and will
instead release it as the version found by the strategy (default: `deno`, which
looks in your `deps.ts` file for an export named `VERSION`).

### --preset

**Default** `angular`

The preset is the engine that determines what the new version will be based on
the current version, the commits, and arguments passed to the CLI.

To make a custom implementation please see
[Making a Git Convention](#making-a-git-convention)

### --allowEmpty

**Default** `false`.

Generally not recommended to use as it would allow for empty commits to occur.

### --versionStrategy

**Default** `deno`

The strategy to fetch version information. The default is `deno`, and the only
other options currently bundled together is the `node` and `cargo` strategies.
Please see the table below for more information about these two items.

| Preset | Preset Value | Primary Version Source | Fallback |
| ----- | ----- | --- | --- |
| Deno (legacy) | `deno` | `VERSION` export in root `deps.ts` | Most recent git tag or `0.1.0` |
| Deno(Json) | `deno-json`| `"version"` key in `deno.json` or `deno.jsonc` | ^ 
| Cargo | `cargo` | `version` key in `[package]` section of `Cargo.toml` | ^ |
| Node | `node` | `"version"` key in `package.json` | ^ |
| JSR | `jsr` | `"version"` key in `jsr.json` | ^ 


In order to make a custom `VersionStrategy` please check the
[Making a Version Strategy](#making-a-version-strategy)

### --changelogWriter

**Default** `default`

The changelog writer is the class responsible for putting the data in stored
into the commits into the CHANGELOG.md file.

In order pass a custom changelog writer you must extends the changelog writer
class and make sure to pass the `.ts` extension. E.g. if you have a changelog
writer at `src/custom.changelog.ts` you would reference it with

```
version-bump --changelogWriter src/custom.changelog.ts
```

See [Making a Changelog Writer](#making-a-changelog-writer) for how to code your
own custom ChangelogWriter

### --changelogPath

**Default** `CHANGELOG.md`

A string value representing the position of the CHANGELOG.md file in reference
of the
<abbr title="Current Working Directory">CWD</abbr>.

### --baseVersion

**Default** `false`

The base version to use if no version can be found. Defaults to `false` to allow
for the users to send in a version that is not `0.1.0`.

### --firstRelease

**Default** `false`

Whether or not this is the first release. This way no bumping of the
`--baseVersion` is done.

### --versionPrefix

**Default** ``

The version prefix, used when writing tags. If a version is found that does not
have the version prefix, such as values that would occur in the `VERSION` export
or the `version` key in a package.json file the value is prepended on to look
for the corresponding tags.

### --hostUrl

Currently unused. Set it to whatever you want, it changes nothing!

### --dryRun

**Default** `false`

Whether or not this is a dry run. Setting to `true` will disable writing the
updates to the files used by your VersionStrategy.

### --historic

**Default** `false`

Should this be a _historic_ run? A historic run differs a bit between a regular
run in one main way:

_Historic runs go through all commits, and attempt to use the current convention
to build a CHANGELOG starting from the very beginning of the packages Git
history_. Regular runs only work in the last batch of commits, and work to
progress the project one group of commits at a time.

This is a good flag to run if you are, say, moving from using one version prefix
to another. For example, if you were originally using the `--versionPrefix`
argument of `v`, but no longer wish to append `v` to your calculated version,
run this command with the version prefix you would like to use. It will not
re-tag the old commits, but it will create a good CHANGELOG with appropriate
diff URLs.

### --logLevel

**Default** `ERROR`

This controls how much information you see about the inner workings of the
Version Bump CLI. The levels are as followed, with each level including the
levels below them:

- DEBUG (most logging)
- INFO
- WARNING
- ERROR
- CRITICAL (least logging)

Please see [the documentation](https://deno.land/std@0.132.0/log/) about the
Deno Logger for more thorough information about logging levels.

## References

This section has the references for building custom implementation of the inner
classes that relate to Version Bump.

Please note that unless otherwise stated, in order to be picked up by the system
the exported class _must_ be the default export. E.g.

```ts
// ✅ Good
export default class CustomChangelogWriter extends ChangelogWriter {
  // Rest of code
}

// ❌ Bad
export class CustomChangelogWriter extends ChangelogWriter {
  // rest of code
}
```

### Injectables

There are a few injectables that can be used in your code. These will have their
given defaults, but will be determined at run-time for the CLI. They can be
included by including them in the constructor in the case of classes, _OR_ by
using the `inject` decorator for certain tokens.

#### Classes

These classes can be injected into your code by TSyringe so long as your class
is correctly marked as `@injectable`.

- `Git`

#### Tokens

These tokens can be registered in via the `@inject` decorator on a constructor.

|  Token   |       Type       | Example                                                                 |
| :------: | :--------------: | :---------------------------------------------------------------------- |
|  `cwd`   |     `string`     | `constructor(@inject('cwd') public readonly cwd: string) {}`            |
|  `args`  |      `Args`      | `constructor(@inject('args) public readonly args: Args) {}`             |
| `logger` | `LoggerInstance` | `constructor(@inject('logger') public readonly log: LoggerInstance) {}` |

**NOTE** The `LoggerInstance` type is an inferred type from an import. Work is
in process to determine how best to wrap it into something more cohesive with
the system, but for now it is fine to use as it adds level-based logging to the
application.

### Making a Changelog Writer

To make a `ChangelogWriter` you will need to import the base `ChangelogWriter`
class.

This will ask for 2 methods to be available on the class. Below is a quick
description of purpose behind each of those methods.

- `write(filePath: string, newContent: string): Promise<boolean>` &ndash; Takes
  the filePath (determined at runtime), the new content based on the value
  returned from chosen `generateChangelogEntry`
- `generateChangelogEntry(newVersion: string, previousVersion: string,commits: Commit[]):`
  &ndash; Generates the actual entry that will be written in the CHANGELOG file
  for the given `newVersion` (calculated by the `GitConvention`),
  `previousVersion` (gathered by the `VersionStrategy`, and the commits,
  gathered by any relevant CLI tool (and the `Git` class))

#### Usage

```ts
// CustomChangelogWriter.ts
import {
  type Args,
  ChangelogWriter,
  Commit,
  Git,
  GitProvider,
  inject,
  injectable,
} from 'https://deno.land/x/version_bump/mod.ts';

@injectable()
export default class CustomChangelogWriter extends ChangelogWriter {
  // Needed to make the compiler happy.
  public provider: GitProvider = new GitProvider();
  /**
   * Please note that the constructor does not have a given form -- it can use any of the [injectables](#injectables) in the code base. The signature used for the default is given below for reference
   */
  constructor(
    @inject('gitProvider') public readonly gitProvider: GitProvider,
    @inject('args') public readonly args: Args,
    @inject('logger') public readonly log: LoggerInstance,
    @inject(Git) public readonly git: Git,
  ) {
    super();
  }

  async write(
    filePath: string,
    newContent: string,
  ): Promise<boolean> {
    /// implementation here
  }

  generateChangelogEntry(
    newVersion: string,
    previousVersion: string,
    commits: Commit[],
  ): Promise<string> {
    /// Implementation here.
  }
}
```

Then, when you call the file you would use it as follows

```sh
version-bump --changelogWriter ./CustomChangelogWriter.ts
```

### Making a Version Strategy

The `VersionStrategy` class is used to gather the current version of the
project. In general is a good idea to have a fallback to checking for git tags,
please see the implementation of the `DenoTsStrategy` to see how this could be
implemented.

The `VersionStrategy` requires the following two methods:

- `bump(newVersion: string): Promise<boolean>` &ndash; Takes in the version
  calculated from our `GitConvention` and responsible for writing it into the
  primary <abbr title="Source of Truth">SoT</abbr>. Should return `true` for
  successful writes, and `false` upon any failure (or simply `throw`-ing the
  error is acceptable as well).
- `getCurrentVersion(): Promise<string>` &ndash; Responsible for determining the
  current version of the project. Should fallback to checking for Git tags if
  version is not determinable otherwise.

#### Usage

```ts
// CustomVersionStrategy.ts
import {
  injectable,
  VersionStrategy,
} from 'https://deno.land/x/version_bump/mod.ts';

@injectable()
export default class CustomVersionStrategy extends VersionStrategy {
  bump(newVersion: string): Promise<boolean> {
    // Code here
  }
  getCurrentVersion(): Promise<string> {
    //Code here
  }
}
```

To use your custom VersionStrategy you would supply the argument as such:

```sh
# Project-specific
version-bump --versionStrategy CustomVersionStrategy.ts
# Hosted somewhere
version-bump --versionStrategy https://company-website.com/CustomVersionStrategy.ts
```

### Making a Git Provider

The `GitProvider` class is injected at runtime, determined by the origin URL. We
include 3 providers:

- GitHub
- GitLab
- BitBucket

However, if you are using a custom Git hosting provider that isn't supported you
can create your own. The GitProviders require the following methods:

- `gitDiffUrl(from: string, to?: string): string` &ndash; The URL for the
  web-viewable difference editor.
- `commitUrl(commit: string): string` &ndash; The URL for the web-viewable
  changes for a single commit.

#### Usage

```ts
import { GitProvider } from 'https://deno.land/x/version_bump/mod.ts';
// NOTE: This class should NOT be injectable and it _should_ have a constructor that matches the one below.
export default class CustomProvider extends GitProvider {
  constructor(url: URL) {}
  gitDiffUrl(from: string, to = 'HEAD'): string {
    // Code
  }
  commitUrl(commit: string): string {
    // code
  }
}
```

To use, you would provide the argument like so

```sh
# Local to the current file
version-bump --gitProvider customProvider.ts
# Local, located in a different directory
version-bump --gitProvider ../../customProvider.ts
# Shared somewhere else
version-bump --gitProvider https://esm.sh/some-preset/mod.ts
```

### Making a Git Convention

The `GitConvention` is the real powerhorse here. To make one you would need need
the following code

The GitConvention expects two methods:

- `calculateBump(args: CalculateBumpArgs): Promise<string>` &ndash; Calculates
  the bump based on the current Args, the current version resolved through the
  `VersionStrategy`, and the gathered `Commits`.
- `generateCommit(args: GenerateCommitArgs): Promise<string>` &ndash; Generates
  the new commit based off the custom convention's standards. For example, the
  Angular convention takes the default bump to be a `patch` level bump,
  increasing the last number of a semantic version such as `x.y.z` by one. If
  there are any features, this counts as a minor release, and would bump the `y`
  value by one. Any release that broke the forward API would count as a major
  release and would break the `x` value of the example.

#### Usage

```ts
// CustomConvention.ts
import {
  CalculateBumpArgs,
  GenerateCommitArgs,
  GitConvention,
  injectable,
} from 'https://deno.land/x/version_bump/mod.ts';

@injectable()
export default class CustomConvention extends GitConvention {
  calculateBump(args: CalculateBumpArgs): Promise<string> {
    // Code
  }
  generateCommit(args: GenerateCommitArgs): Promise<string> {
    // Code
  }
}
```

You would use this in the command like as follows:

```sh
version-bump --preset ./CustomConvention.ts
```
