import { TestBed } from '@angular/core/testing';

import { ApiService } from './api.service';
import { HttpClient, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import mockApiRepositories from '../mock-data/mock-api-repositories.data';
import { firstValueFrom, of } from 'rxjs';
import mockCachedRepositories from '../mock-data/mock-cached-repositories.data';
import { mockUser } from '../mock-data/mock-user.data';

describe('ApiService', () => {
  let service: ApiService;
  let httpClient: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpClient = TestBed.inject(HttpClient);

    spyOn(Storage.prototype, 'setItem').and.callFake(() => {
      return;
    });
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fail to retrieve cached repos and return null', () => {
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === 'username') {
        return 'invalid-user';
      } else if (param === 'perPage') {
        return '5';
      } else {
        return null;
      }
    });

    const repos = service.getCachedRepos();
    expect(repos).toEqual(null);
  });

  it('should not retrieve any cached repos as cache is empty', async () => {
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      return null;
    });

    const repos$ = service.getCachedRepos();
    expect(repos$).toEqual(null);
  });

  it('should successfully retrieve cached repos and return an object', async () => {
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === 'username') {
        return 'valid-user';
      } else if (param === 'perPage') {
        return '10';
      } else if (param === 'valid-user') {
        return JSON.stringify(mockApiRepositories);
      } else {
        return null;
      }
    });

    const repos$ = service.getCachedRepos();
    expect(repos$).toBeTruthy();
    const repoList = await firstValueFrom(repos$!);
    expect(repoList).toEqual(mockApiRepositories[0]);
  });

  it('should not retrieve a cached user as cache is empty', async () => {
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      return null;
    });

    const validUser = service.getCachedUsername();
    expect(validUser).toEqual(null);
  });

  it('should successfully retrieve a cached user via param', async () => {
    const userJson = JSON.stringify(mockUser);

    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === 'username') {
        return null;
      } else {
        return userJson;
      }
    });

    const validUser$ = service.getCachedUser(mockUser.username);
    const validUser = await firstValueFrom(validUser$!);
    expect(validUser).toEqual(mockUser);
  });

  it('should successfully retrieve a cached user via a stored username', async () => {
    const userJson = JSON.stringify(mockUser);

    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === 'username') {
        return mockUser.username;
      } else {
        return userJson;
      }
    });

    const validUser$ = service.getCachedUser();
    const validUser = await firstValueFrom(validUser$!);
    expect(validUser).toEqual(mockUser);
  });

  it('should not retrieve a cached user with missing username', async () => {
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      return null;
    });

    const validUser = service.getCachedUser();
    expect(validUser).toEqual(null);
  });

  it('should not retrieve a cached user with invalid username', async () => {
    const userJson = JSON.stringify(mockUser);

    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === 'username') {
        return mockUser.username;
      } else {
        return userJson;
      }
    });

    const validUser = service.getCachedUser('invalid-username');
    expect(validUser).toEqual(null);
  });

  it('should not retrieve a cached username as cache is empty', async () => {
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      return null;
    });

    const validUser = service.getCachedUsername();
    expect(validUser).toEqual(null);
  });

  it('should successfully retrieve a cached username', async () => {
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === 'username') {
        return 'valid-user';
      } else {
        return null;
      }
    });

    const validUser = service.getCachedUsername();
    expect(validUser).toEqual('valid-user');
  });

  it('should not retrieve a cached repo count per page as cache is empty', async () => {
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      return null;
    });

    const validUser = service.getCachedReposPerPage();
    expect(validUser).toEqual(null);
  });

  it('should successfully retrieve a cached repo count per page', async () => {
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === 'perPage') {
        return '25';
      } else {
        return null;
      }
    });

    const validUser = service.getCachedReposPerPage();
    expect(validUser).toEqual(25);
  });

  it('should successfully retrieve user on refresh via cache', async () => {
    const userJson = JSON.stringify(mockUser);

    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === 'username') {
        return mockUser.username;
      } else {
        return userJson;
      }
    });

    const user$ = service.getUser(mockUser.username);
    expect(user$).toBeTruthy();
    const user = await firstValueFrom(user$!);
    expect(user).toEqual(mockUser);
  });

  it('should successfully retrieve user via api', async () => {
    spyOn(httpClient, 'get').and.returnValue(
      of({
        login: mockUser.username,
        name: mockUser.name,
        avatar_url: mockUser.imageUrl,
        bio: mockUser.bio,
        location: mockUser.location,
        twitter_username: mockUser.twitterHandle,
        html_url: mockUser.githubUrl,
      })
    );
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === mockUser.username) {
        return JSON.stringify(mockUser);
      } else {
        return null;
      }
    });

    const user$ = service.getUser(mockUser.username);
    expect(user$).toBeTruthy();
    const user = await firstValueFrom(user$!);
    expect(user).toEqual(mockUser);
  });

  it('should successfully retrieve repositories on new page via api', async () => {
    spyOn(httpClient, 'get').and.returnValue(of(mockApiRepositories));
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === 'valid-user') {
        return JSON.stringify(mockApiRepositories);
      } else {
        return null;
      }
    });

    const repos$ = service.getReposOnPage('valid-user', 10, 5);
    expect(repos$).toBeTruthy();
    const repoList = await firstValueFrom(repos$!);
    expect(repoList).toEqual(mockApiRepositories);
  });

  it('should successfully retrieve repositories upon search', async () => {
    spyOn(httpClient, 'get').and.returnValue(of(mockApiRepositories));
    spyOn(Storage.prototype, 'getItem').and.callFake(() => {
      return null;
    });

    // Value of reposPerPage and retrieved repos length are equal and visited before
    const repos$ = service.getRepos('valid-user', 10);
    expect(repos$).toBeTruthy();
    const repoList = await firstValueFrom(repos$!);
    expect(repoList).toEqual(mockApiRepositories);
  });

  it('should successfully retrieve repositories on cached page', async () => {
    spyOn(Storage.prototype, 'getItem').and.callFake((param) => {
      if (param === 'valid-user2') {
        return JSON.stringify([mockCachedRepositories]);
      } else {
        return null;
      }
    });

    // Value of reposPerPage and retrieved repos length are equal and visited before
    const repos$ = service.getReposOnPage('valid-user2', 2, 1);
    expect(repos$).toBeTruthy();
    const repoList = await firstValueFrom(repos$!);
    expect(repoList).toEqual(mockCachedRepositories);
  });

  it('should successfully retrieve repositories for an entirely new user', async () => {
    spyOn(Storage.prototype, 'getItem').and.callFake(() => {
      return null;
    });
    spyOn(httpClient, 'get').and.returnValue(of(mockApiRepositories));

    // Value of reposPerPage and retrieved repos length are equal and visited before
    const repos$ = service.getReposOnPage('invalid-user', 10, 1);
    expect(repos$).toBeTruthy();
    const repoList = await firstValueFrom(repos$!);
    expect(repoList).toEqual(mockApiRepositories);
  });
});
