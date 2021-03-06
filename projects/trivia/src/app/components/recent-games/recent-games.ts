import { Component, ChangeDetectionStrategy, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { User, GameStatus, Game } from 'shared-library/shared/model';
import { AppState, appState } from '../../store';
import { Observable } from 'rxjs';
import { UserActions } from 'shared-library/core/store/actions';
import { AutoUnsubscribe } from 'ngx-auto-unsubscribe';


@AutoUnsubscribe({ 'arrayName': 'subscriptions' })
export class RecentGames implements OnDestroy {

  user: User;
  recentGames: Game[] = [];
  startIndex = 0;
  nextIndex = 4;
  maxIndex = 10;
  GameStatus = GameStatus;
  recentGames$: Observable<Game[]>;
  userDict$: Observable<{ [key: string]: User }>;
  userDict: { [key: string]: User } = {};
  subscriptions = [];
  cd: ChangeDetectorRef;

  constructor(store: Store<AppState>,
    cd: ChangeDetectorRef,
    userActions: UserActions) {

    this.cd = cd;
    this.subscriptions.push(store.select(appState.coreState).pipe(select(s => s.user)).subscribe(user => {
      this.user = user;
      store.dispatch(userActions.getGameResult(user));
    }));

    this.recentGames$ = store.select(appState.coreState).pipe(select(s => s.getGameResult));

    this.subscriptions.push(this.recentGames$.subscribe((recentGames) => {
      this.recentGames = recentGames;
      this.cd.markForCheck();
    }));
  }

  getMoreCard() {
    if (this.recentGames.length > this.maxIndex) {
      if ((this.nextIndex + this.maxIndex) >= this.recentGames.length) {
        this.nextIndex = this.recentGames.length;
      } else {
        this.nextIndex = this.nextIndex + this.maxIndex;
      }
    } else {
      this.nextIndex = this.nextIndex + this.recentGames.length;
    }
    this.cd.markForCheck();
  }

  ngOnDestroy() {
  }

}
