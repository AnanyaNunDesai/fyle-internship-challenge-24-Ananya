import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RepoListViewComponent } from './repo-list-view.component';
import { ApiService } from 'src/app/services/api.service';
import { firstValueFrom, of, throwError } from 'rxjs';
import mockCachedRepositories from 'src/app/mock-data/mock-cached-repositories.data';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Repository } from 'src/app/constants/repository';
import mockApiRepositories from 'src/app/mock-data/mock-api-repositories.data';
import { HttpErrorResponse } from '@angular/common/http';
import { mockUser } from 'src/app/mock-data/mock-user.data';

describe('RepoListViewComponent', () => {
  let component: RepoListViewComponent;
  let fixture: ComponentFixture<RepoListViewComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  beforeEach(waitForAsync(() => {
    apiService = jasmine.createSpyObj('ApiService', [
      'getUser',
      'getCachedUser',
      'getCachedRepos',
      'getRepos',
      'getReposOnPage',
      'getCachedUsername',
      'getCachedReposPerPage',
    ]);

    TestBed.configureTestingModule({
      imports: [RepoListViewComponent, HttpClientTestingModule],
      providers: [{ provide: ApiService, useValue: apiService }],
    }).compileComponents();
    TestBed.overrideComponent(RepoListViewComponent, {
      set: {
        providers: [{ provide: ApiService, useValue: apiService }],
      },
    });

    spyOn(Storage.prototype, 'setItem').and.callFake(() => {
      return;
    });

    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;

    apiService.getUser.and.returnValue(of(mockUser));
    apiService.getRepos.and.returnValue(of(mockApiRepositories));
    apiService.getCachedUser.and.returnValue(of(mockUser));
    apiService.getCachedRepos.and.returnValue(of(mockCachedRepositories));
    apiService.getReposOnPage.and.returnValue(of(mockApiRepositories));
    apiService.getCachedUsername.and.returnValue('mock-user');
    apiService.getCachedReposPerPage.and.returnValue(10);
    fixture = TestBed.createComponent(RepoListViewComponent);
    component = fixture.componentInstance;
  }));

  it('should create the app', () => {
    expect(component).toBeTruthy();
  });

  it(`should have retrieved nothing from empty cache`, async () => {
    apiService.getCachedRepos.and.returnValue(of(null));
    apiService.getReposOnPage.and.returnValue(of(null));
    apiService.getCachedUsername.and.returnValue(null);
    apiService.getCachedReposPerPage.and.returnValue(null);

    component.ngOnInit();
    fixture.detectChanges();

    const repoList = await firstValueFrom(component.repoList$!);

    expect(component.inputValue).toEqual('');
    expect(component.currentReposPerPage).toEqual(10);
    expect(repoList).toBeFalsy();
  });

  it(`should have retrieved proper values from cache`, async () => {
    component.ngOnInit();
    fixture.detectChanges();

    const repoList = await firstValueFrom(component.repoList$!);

    expect(component.inputValue).toEqual('mock-user');
    expect(component.currentReposPerPage).toEqual(10);
    expect(
      repoList.every((repoObj, idx) => {
        const repo = repoObj as Repository;
        const mockRepo = mockCachedRepositories[idx] as Repository;
        const sameName = repo.name == mockRepo.name;
        const sameDesc = repo.description == mockRepo.description;
        const sameTopics = repo.topics == mockRepo.topics;
        return sameName && sameDesc && sameTopics;
      })
    );
  });

  it('should set value for reposPerPage but not currentReposPerPage', () => {
    component.setReposPerPage(25);
    fixture.detectChanges();
    expect(component.reposPerPage)
      .withContext('set to 10 at first')
      .toMatch(/25/i);
    expect(component.currentReposPerPage)
      .withContext('currently defaulted to 10')
      .toMatch(/10/i);
  });

  it(`should successfully retrieve repos from api, with reposPerPage set to 25`, async () => {
    component.setReposPerPage(25);
    fixture.detectChanges();
    component.performSearch();
    fixture.detectChanges();

    const repoList = await firstValueFrom(component.repoList$!);
    expect(component.currentReposPerPage).toEqual(component.reposPerPage);
    expect(
      repoList.every((repoObj, idx) => {
        const repo = repoObj as Repository;
        const mockRepo = mockApiRepositories[idx] as Repository;
        const sameName = repo.name == mockRepo.name;
        const sameDesc = repo.description == mockRepo.description;
        const sameTopics = repo.topics == mockRepo.topics;
        return sameName && sameDesc && sameTopics;
      })
    );
  });

  it(`should return an error message if call to a users' repos fails`, async () => {
    apiService.getRepos.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 444 }))
    );

    component.performSearch();
    fixture.detectChanges();

    const err = await firstValueFrom(component.repoListError$!);
    expect(err).toContain(
      `Detail retrieval unsuccessful. Received a response of 444.`
    );
  });

  it(`should successfully retrieve repos from a page`, async () => {
    component.setReposPerPage(50);
    fixture.detectChanges();
    component.searchUserReposOnPage(2);
    fixture.detectChanges();

    apiService.getReposOnPage.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 444 }))
    );

    component.performSearch();
    fixture.detectChanges();

    const repoList = await firstValueFrom(component.repoList$!);
    expect(component.repoPage).toEqual(2);
    expect(component.currentReposPerPage).toEqual(component.reposPerPage);
    expect(
      repoList.every((repoObj, idx) => {
        const repo = repoObj as Repository;
        const mockRepo = mockApiRepositories[idx] as Repository;
        const sameName = repo.name == mockRepo.name;
        const sameDesc = repo.description == mockRepo.description;
        const sameTopics = repo.topics == mockRepo.topics;
        return sameName && sameDesc && sameTopics;
      })
    );
  });

  it(`should return an error message if call to a users' repos of a specific page fails`, async () => {
    apiService.getReposOnPage.and.returnValue(
      throwError(() => new HttpErrorResponse({ status: 404 }))
    );

    component.searchUserReposOnPage(3);
    fixture.detectChanges();

    const err = await firstValueFrom(component.repoListError$!);
    expect(err).toContain(
      `Detail retrieval unsuccessful. Received a response of 404.`
    );
  });

  it(`should return an error message if user retrieval was unsuccessful`, async () => {
    apiService.getUser.and.returnValue(throwError(() => true));

    component.performSearch();
    fixture.detectChanges();

    const err = await firstValueFrom(component.userError$!);
    expect(err).toEqual(true);
  });
});
