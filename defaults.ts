export const argDefaults = {
  allowEmpty: false,
  preset: 'angular',
  versionStrategy: 'deno',
  changelogWriter: 'default',
  changelogPath: 'CHANGELOG.md',
  baseVersion: false,
  firstRelease: false,
  versionPrefix: '',
  hostUrl: '',
  dryRun: false,
  gitProvider: '',
  logLevel: 'ERROR',
  config: '.vbump.json',
  // Below this pertains to historic Changelog builds
  historic: false,
  retag: true,
};
