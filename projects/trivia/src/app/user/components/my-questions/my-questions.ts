import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import { QuestionActions } from 'shared-library/core/store';
import { User, Question, QuestionStatus, Category } from 'shared-library/shared/model';
import { AppState, appState, categoryDictionary } from '../../../store';
import { userState } from '../../../user/store';
import * as userActions from '../../store/actions';
export class MyQuestions {

  publishedQuestions: Question[];
  unpublishedQuestions: Question[];
  categoryDictObs: Observable<{ [key: number]: Category }>;
  user: User;
  loaderBusy = false;
  subscriptions = [];

  constructor(public store: Store<AppState>,
    public questionActions: QuestionActions,
  ) {

    this.loaderBusy = true;
    this.categoryDictObs = store.select(categoryDictionary);

    this.subscriptions.push(this.store.select(appState.coreState).pipe(take(1)).subscribe((s) => {
      this.user = s.user;
    }));
    this.subscriptions.push(this.store.select(userState).pipe(select(s => s.userPublishedQuestions)).subscribe((questions) => {
      this.publishedQuestions = questions;
      this.hideLoader();
    }));
    this.subscriptions.push(this.store.select(userState).pipe(select(s => s.userUnpublishedQuestions)).subscribe((questions) => {
      this.unpublishedQuestions = questions;
      this.hideLoader();
    }));
  }

  hideLoader() {
    if (this.publishedQuestions && this.unpublishedQuestions) {
      setTimeout(() => {
        this.toggleLoader(false);
      }, 1000);
    }
  }


  toggleLoader(flag: boolean) {
    this.loaderBusy = flag;
  }
}
