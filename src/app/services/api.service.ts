import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map, of } from 'rxjs';
import { User } from '../constants/user';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private httpClient: HttpClient) {}

  getUser(githubUsername: string) {
    const cachedUser = this.getCachedUser(githubUsername);

    if (cachedUser !== null) {
      return cachedUser;
    } else {
      return this.httpClient
        .get(`https://api.github.com/users/${githubUsername}`)
        .pipe(
          map((userObj) => {
            localStorage.removeItem('user');

            const userBlob = userObj as any;
            const user = {
              username: userBlob['login'],
              name: userBlob['name'],
              imageUrl: userBlob['avatar_url'],
              bio: userBlob['bio'],
              location: userBlob['location'],
              twitterHandle: userBlob['twitter_username'],
              githubUrl: userBlob['html_url'],
            } as User;

            localStorage.setItem('user', JSON.stringify(user));
            return user;
          })
        );
    }
  }

  getCachedUser(githubUsername?: string): Observable<User> | null {
    let username = '';
    const storedUsername = localStorage.getItem('username');

    if (githubUsername) {
      username = githubUsername;
    } else if (storedUsername) {
      username = storedUsername;
    } else {
      return null;
    }

    const cachedUserJson = localStorage.getItem('user');

    if (!cachedUserJson) {
      return null;
    } else {
      const user = JSON.parse(cachedUserJson) as User;

      if (username !== user.username.toLowerCase()) {
        return null;
      } else {
        return of(JSON.parse(cachedUserJson) as User);
      }
    }
  }

  getCachedRepos() {
    const storedUsername = localStorage.getItem('username');
    const storedPerPage = localStorage.getItem('perPage');

    if (!storedUsername || !storedPerPage) {
      return null;
    } else {
      const repos = localStorage.getItem(storedUsername);

      if (!repos) {
        return null;
      } else {
        return of(JSON.parse(repos)[0]);
      }
    }
  }

  getCachedUsername(): string | null {
    const storedUsername = localStorage.getItem('username');

    if (!storedUsername) {
      return null;
    } else {
      return storedUsername;
    }
  }

  getCachedReposPerPage(): number | null {
    const perPage = localStorage.getItem('perPage');

    if (!perPage) {
      return null;
    } else {
      return parseInt(perPage);
    }
  }

  // Convenience function called when hitting search button
  getRepos(githubUsername: string, perPage: number) {
    return this.getReposOnPage(githubUsername, perPage, 1);
  }

  // Retrieves a user's repositories for a specific page while using cache
  getReposOnPage(githubUsername: string, perPage: number, page: number) {
    const reposJson = localStorage.getItem(githubUsername);

    if (reposJson) {
      const pagesRepos = JSON.parse(reposJson);
      // Newly retrieving repositories for this specific page of chosen user
      if (
        !pagesRepos[page - 1] ||
        (page === 1 && pagesRepos[0].length != perPage)
      ) {
        return this.httpClient
          .get(
            `https://api.github.com/users/${githubUsername}/repos?page=${page}&per_page=${perPage}`
          )
          .pipe(
            map((data) => {
              const newRepos = data as Object[];

              // Assumes new pages are only retrieved by going to next page
              if (pagesRepos.length < page) {
                pagesRepos.push(newRepos);
                localStorage.setItem(
                  githubUsername,
                  JSON.stringify(pagesRepos)
                );
              }
              return data;
            })
          );
      } else {
        return of(pagesRepos[page - 1]);
      }
    }
    // Newly retrieving repositories for this user from GitHub in general
    else {
      return this.httpClient
        .get(
          `https://api.github.com/users/${githubUsername}/repos?page=${page}&per_page=${perPage}`
        )
        .pipe(
          map((data) => {
            // Wipe local storage to store new users' repos
            localStorage.removeItem('username');
            localStorage.removeItem('perPage');
            localStorage.removeItem(githubUsername);

            localStorage.setItem('username', githubUsername);
            localStorage.setItem('perPage', String(perPage));

            // Cache first page of this list of repos for user
            const repos = data as Object[];
            localStorage.setItem(githubUsername, JSON.stringify([repos]));
            return data;
          })
        );
    }
  }
}
