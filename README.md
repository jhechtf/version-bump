# Version Bump

We bumpin' versions like it's 1999.

Inspiration for this project comes from
[Standard Version](https://github.com/conventional-changelog/standard-version).

## Notes

Version 0.1.0 has been formally released. All other changes will come from
regular feature development (including merge requests).

However, _do not_ consider this a stable release, and expect changes as I work
my way up to a 1.0.0 release. You can check progress at the
[v1.0.0](https://github.com/jhechtf/version-bump/milestone/1) Milestone.

### Things to come

1. A configuration file spec so that the user doesn't need to supply every
   argument to the command line.
2. Documentation on how to create custom version bump strategies, git providers,
   presets, and even the changelog writer.

## Installation

Run

```
deno install -A -n version-bump https://deno.land/x/version_bump
# In the git directory you want to version bump
version-bump
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
other option currently bundled together is the `node` strategy. Please see the
table below for more information about these two items.

|                        | Deno                               | Node                                           |
| :--------------------: | ---------------------------------- | ---------------------------------------------- |
| Primary Version Source | `VERSION` export in root `deps.ts` | `"version"` field in root `package.json` file. |
|        Fallback        | most recent git tag or `0.1.0`     | most recent git tag or `0.1.0`.                |

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

**Default** `v`

The version prefix, used when writing tags. If a version is found that does not
have the version prefix, such as values that would occur in the `VERSION` export
or the `version` key in a package.json file the value is prepended on to look
for the corresponding tags.

This is done because most people do not tag the values as the raw semantic
version, e.g. `git tag 1.10.3`, and would instead opt for `git tag v1.10.3`.

### --hostUrl

Currently unused. Set it to whatever you want, it changes nothing!

### --dryRun

**Default** `false`

Whether or not this is a dry run. Setting to `true` will disable writing the
updates to the files used by your VersionStrategy.

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

### Making a Changelog Writer

To make a `ChangelogWriter` you will need to import the base `ChangelogWriter`
class.

This will ask for 3 methods to be available on the class. Below is a quick
description of purpose behind each of those methods.

- `write(filePath: string, newVersion: string, commits: Commit): Promise<boolean>`
  &ndash; Takes the filePath (determined at runtime), the new version based on
  the chosen `GitConvention`, and the commits between this commit and the last
  one. It is up to you to determine.
- `read(filePath: string): Promise<string>` &ndash; Reads through the contents
  of the given filepath. returns a Promise that resolves to a string.
- `setGitProvider(provider: GitProvider): void` &ndash; Sets the internal git
  provider based on the git remote URL of the repository. This will happen at
  runtime and this value should be used when writing your changelog to ensure
  that the links are formatted correctly.

#### Usage

```ts
// CustomChangelogWriter.ts
import {
  ChangelogWriter,
  Commit,
  Cwd,
  Git,
  GitProvider,
  Injectable,
  VersionArgs,
} from 'https://deno.land/x/version_bump/mod.ts';

@Injectable()
export default class CustomChangelogWriter extends ChangelogWriter {
  // Needed to make the compiler happy.
  public provider: GitProvider = new GitProvider();
  /**
   * Please note that the constructor does not have a given form -- it can use any of the [Injectables](#injectables) in the code base. The signature used for the default is given below for reference
   */
  constructor(
    public readonly git: Git,
    public readonly cwd: Cwd,
    public readonly args: VersionArgs,
  ) {
    super();
  }

  async write(
    filePath: string,
    newVersion: string,
    commits: Commit[],
  ): Promise<string> {
    /// implementation here
  }

  async read(filePath: string): Promise<string> {
    /// implementation here.
  }

  setGitProvider(provider: GitProvider): void {
    this.provider = provider;
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
  Injectable,
  VersionStrategy,
} from 'https://deno.land/x/version_bump/mod.ts';

@Injectable()
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
// NOTE: This class should NOT be Injectable and it _should_ have a constructor that matches the one below.
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
  Injectable,
} from 'https://deno.land/x/version_bump/mod.ts';

@Injectable()
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
