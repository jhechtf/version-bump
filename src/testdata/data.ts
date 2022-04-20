import { assertEquals } from '../../deps.ts';

export function assertObject<T>(actual: T, expected: T) {
  for (const [key, value] of Object.entries(expected)) {
    assertEquals(
      actual[key as keyof T],
      value,
      `Property ${key} does not match actual: ${
        actual[key as keyof T]
      }, expected: ${value}`,
    );
  }
}

export const urlMap = {
  'ssh://root@192.167.0.1:2222/var/something.git': {
    href: 'ssh://root@192.167.0.1:2222/var/something',
    username: 'root',
    port: '2222',
    pathname: '/var/something',
    host: '192.167.0.1:2222',
    hostname: '192.167.0.1',
    password: '',
    hash: '',
  },
  'ssh://some@host.com:3333/hello/something.git': {
    href: 'ssh://some@host.com:3333/hello/something',
    username: 'some',
    port: '3333',
    pathname: '/hello/something',
    host: 'host.com:3333',
    hostname: 'host.com',
    password: '',
    hash: '',
  },
  'https://github.com/jhechtf/something.git': {
    href: 'ssh://git@github.com:22/jhechtf/something',
    username: 'git',
    port: '22',
    pathname: '/jhechtf/something',
    host: 'github.com:22',
    hostname: 'github.com',
    password: '',
    hash: '',
  },
  'https://github.com:9999/jhechtf/something.git': {
    href: 'ssh://git@github.com:9999/jhechtf/something',
    username: 'git',
    port: '9999',
    pathname: '/jhechtf/something',
    host: 'github.com:9999',
    hostname: 'github.com',
    password: '',
    hash: '',
  },
  'git@github.com:jhechtf/testing-something.git': {
    href: 'ssh://git@github.com:22/jhechtf/testing-something',
    username: 'git',
    port: '22',
    pathname: '/jhechtf/testing-something',
    hostname: 'github.com',
    password: '',
    hash: '',
  },
  'ssh://testing:password@domain.com:5252/some-git.git': {
    href: 'ssh://testing@domain.com:5252/some-git',
    username: 'testing',
    port: '5252',
    pathname: '/some-git',
    hostname: 'domain.com',
    password: '',
    hash: '',
  },
  'ssh://git@github-hub.com:9999/very/nested-route/thing.git': {
    href: 'ssh://git@github-hub.com:9999/very/nested-route/thing',
    username: 'git',
    port: '9999',
    pathname: '/very/nested-route/thing',
    hostname: 'github-hub.com',
    password: '',
    hash: '',
  },
};
