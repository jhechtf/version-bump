# Version Bump

We bumpin' versions like it's 1999.

Inspiration for this project comes from
[Standard Version](https://github.com/conventional-changelog/standard-version).

## Notes

Version 0.1.0 has been formally released. All other changes will come from
regular feature development (including merge requests).

However, _do not_ consider this a stable release, and expect changes as I work
my way up to a 1.0.0 release.

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

### --versionPrefix

Adding `--versionPrefix` will change the prefix used to tag commits.

**Default** `v`

### --firstRelease

Adding `--firstRelease` will not bump version, regardless of commits and will
instead release it as the version found by the strategy (default: `deno`, which
looks in your `deps.ts` file for an export named `VERSION`).

### --strategy

Specifies the bumping strategy used by the CLI. Default is `deno`. Other
pre-built options are `node`, which looks for a `package.json` file and updates
the contents.

Can be a custom `strategy` implementation, hosted either publically or in your
own repository.

## Idea Usage

Roughly the goal will be to do something like:

_Note:_ this is a perfect example, and is not how the code currently works.
**_The code is not at 1.0.0 yet_**

```
deno install -A --no-check -n version-bump https://deno.land/version-bump/cli.ts
# Or directly with 
deno run -A https://deno.land/version-bump/cli.ts
```

And to call it in your CI process like so:

```
version-bump
# Starting version: v0.2.0
# Calculating bump based on commits between tag v0.2.0 and HEAD...
# Bumping version to v0.2.1...
# Adding commit "chore(release): version 0.2.1" ...
# Success! Push up commit with "git push --follow-tags"
```

Using a different preset would be something like this

```
version-bump --preset https://deno.land/x/some-preset/mod.ts
# Starting version: v0.2.0
# Calculating bump based on commits between tag v0.2.0 and HEAD...
# Bumping Version to v1.0.0
# Adding commit ":tada: v1.0.0"
# Success! Push up commit with "git push --follow-tags"
```
