/**
 * File is currently WIP. Ignore contents for now.
 */

if (import.meta.main) {
  console.info(
    'This is not the version-bump CLI file. You want to run the cli.ts file in the same directory.',
  );
}

export * from './src/git.ts';
export * from './src/gitProvider.ts';
export * from './src/versionStrategy.ts';
export * from './src/gitConvention.ts';
export * from './args.ts';
export * from './src/changelogWriter.ts';
