import AngularPreset from './angular.ts';
import {
  assertEquals,
  assertThrows,
} from 'https://deno.land/std@0.132.0/testing/asserts.ts';

const preset = new AngularPreset();
Deno.test('Breaking Changes', async () => {
  const base = '1.0.0';
  const versionBump = await preset.calculateBump({
    currentVersion: base,
    commits: [{
      subject: 'fix: Testing something',
      author: 'User',
      body: 'BREAKING: we did the thing',
      sha: '123',
      tag: '',
    }],
    args: {
      _: [],
    },
  });

  assertEquals(
    versionBump,
    '2.0.0',
  );
});

Deno.test('Minor version changes', async () => {
  const base = '1.0.0';
  const versionBump = await preset.calculateBump({
    currentVersion: base,
    commits: [
      {
        subject: 'fix: Testing',
        author: 'User 2',
        sha: '123',
        tag: '',
      },
      {
        subject: 'fix: Test 1',
        author: 'User',
        sha: '345',
        tag: '',
      },
      {
        subject: 'feat: Test 2',
        author: 'User 2',
        sha: '1234',
        tag: '',
      },
    ],
    args: {
      _: [],
    },
  });

  assertEquals(
    versionBump,
    '1.1.0',
  );
});

Deno.test('Patch version change', async () => {
  const base = '1.0.0';
  const versionbump = await preset.calculateBump({
    currentVersion: base,
    commits: [
      {
        subject: 'fix: Testing',
        author: 'User',
        sha: '123',
        tag: '',
      },
      {
        subject: 'fix: Other fix',
        author: 'User 3',
        sha: '456',
        tag: '',
      },
      {
        subject: 'fix: other other thing.',
        author: 'Test',
        body: 'This is just some random information.',
        sha: 'ksdfj',
        tag: '',
      },
    ],
    args: {
      _: [],
    },
  });

  assertEquals(
    versionbump,
    '1.0.1',
  );
});

Deno.test('Release As test', async () => {
  let bump = await preset.calculateBump({
    currentVersion: '0.1.0',
    commits: [{
      subject: 'feat: new thing',
      body: 'BREAKING: we fixed it',
      author: 'Testing',
      tag: '',
      sha: '',
    }],
    args: {
      _: [],
      releaseAs: '0.2.0',
    },
  });

  assertEquals(
    bump,
    '0.2.0',
  );

  bump = await preset.calculateBump({
    currentVersion: '0.1.0',
    commits: [
      {
        subject: 'feat: new thing',
        body: 'BREAKING: we fixed it',
        author: 'Testing',
        tag: '',
        sha: '',
      },
    ],
    args: {
      _: [],
      firstRelease: true,
    },
  });

  assertEquals(
    bump,
    '0.1.0',
  );

  assertThrows(() =>
    preset.calculateBump({
      currentVersion: 'waffle fries',
      commits: [],
      args: {
        _: [],
      },
    })
  );
});
