export const url = (hostname = 'github.com') =>
  new URL(`ssh://${hostname}:22/user/some-repo`);
