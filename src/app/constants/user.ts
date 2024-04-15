export interface User {
  readonly username: string;
  readonly name?: string;
  readonly imageUrl?: string;
  readonly bio?: string;
  readonly location?: string;
  readonly twitterHandle?: string;
  readonly githubUrl: string;
}
