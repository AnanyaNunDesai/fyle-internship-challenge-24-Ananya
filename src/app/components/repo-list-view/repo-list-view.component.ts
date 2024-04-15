import { AsyncPipe, NgClass, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { Observable, catchError, ignoreElements, of } from 'rxjs';
import { RepositoryPipe } from 'src/app/pipes/repository-pipe';
import { ApiService } from 'src/app/services/api.service';
import { User } from 'src/app/constants/user';

@Component({
  selector: 'repo-list-view',
  templateUrl: './repo-list-view.component.html',
  providers: [ApiService],
  imports: [
    FormsModule,
    NgFor,
    NgIf,
    NgClass,
    AsyncPipe,
    NgxSkeletonLoaderModule,
    RepositoryPipe,
  ],
  standalone: true,
})
export class RepoListViewComponent {
  inputValue: string = '';
  repoPage = 1;
  reposPerPage = 10;
  currentReposPerPage = 10;
  repoList$: Observable<Object[]> | null = null;
  repoListError$: Observable<string> | null = null;
  user$: Observable<User> | null = null;
  userError$: Observable<boolean> | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.user$ = this.apiService.getCachedUser();
    this.repoList$ = this.apiService.getCachedRepos();
    this.inputValue = this.apiService.getCachedUsername() ?? '';
    this.currentReposPerPage = this.apiService.getCachedReposPerPage() ?? 10;
  }

  setReposPerPage(numRepos: number) {
    this.reposPerPage = numRepos;
  }

  searchUserReposOnPage(newPage: number) {
    this.repoPage = newPage;
    this.repoList$ = this.apiService.getReposOnPage(
      this.inputValue,
      this.currentReposPerPage,
      this.repoPage
    ) as Observable<Object[]>;
    this.repoListError$ = this.repoList$.pipe(
      ignoreElements(),
      catchError((err) =>
        of(
          `Detail retrieval unsuccessful. Received a response of ${err.status}.`
        )
      )
    );
  }

  performSearch() {
    this.repoList$ = this.apiService.getRepos(
      this.inputValue,
      this.reposPerPage
    ) as Observable<Object[]>;
    this.currentReposPerPage = this.reposPerPage;
    this.repoListError$ = this.repoList$.pipe(
      ignoreElements(),
      catchError((err) =>
        of(
          `Detail retrieval unsuccessful. Received a response of ${err.status}.`
        )
      )
    );
    this.user$ = this.apiService.getUser(this.inputValue);
    this.userError$ = this.user$.pipe(
      ignoreElements(),
      catchError(() => of(true))
    );
  }
}
