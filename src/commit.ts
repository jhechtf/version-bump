export interface Commit {
  sha: string;
  author: string;
  subject: string;
  body?: string;
}
