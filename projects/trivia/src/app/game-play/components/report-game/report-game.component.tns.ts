import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import {
    ReportQuestion, User, Game, QuestionMetadata, Category, Question
} from 'shared-library/shared/model';
import { AppState, categoryDictionary } from '../../../store';
import * as gameplayactions from '../../store/actions';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { ModalDialogParams } from 'nativescript-angular/directives/dialogs';
import * as Toast from 'nativescript-toast';
import { Utils } from 'shared-library/core/services';
import { isAndroid } from 'tns-core-modules/ui/page/page';
import { AutoUnsubscribe } from 'ngx-auto-unsubscribe';

@Component({
    selector: 'report-game',
    templateUrl: './report-game.component.html',
    styleUrls: ['./report-game.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})

@AutoUnsubscribe({ 'arrayName': 'subscriptions' })
export class ReportGameComponent implements OnInit, OnDestroy {

    question: Question;
    reportQuestion: ReportQuestion;
    user: User;
    game: Game;
    ref: any;
    userDict: { [key: string]: User };
    categoryDict$: Observable<{ [key: number]: Category }>;
    categoryDict: { [key: number]: Category };
    issue = '';
    checkTest: boolean;
    reportOptions?: Array<ReportOption>;
    selectedOption: string = null;
    otherReason: string = null;
    subscriptions = [];

    @ViewChildren('textField') textField: QueryList<ElementRef>;

    constructor(private store: Store<AppState>, private params: ModalDialogParams, public utils: Utils,
        private cd: ChangeDetectorRef) {
        this.categoryDict$ = store.select(categoryDictionary);
        this.subscriptions.push(this.categoryDict$.subscribe(categoryDict => {
            this.categoryDict = categoryDict;
            this.cd.markForCheck();
        }));

        this.question = params.context.question;
        this.user = params.context.user;
        this.game = params.context.game;
        this.userDict = params.context.userDict;

        this.reportOptions = [
            new ReportOption('Offensive content'),
            new ReportOption('Spelling or grammar error'),
            new ReportOption('Wrong answer'),
            new ReportOption('Incorrect category or tags'),
            new ReportOption('Question is not clear'),
            new ReportOption('Spam'),
            new ReportOption('Other')
        ];
    }

    ngOnInit() {
        this.reportQuestion = new ReportQuestion();
    }

    saveReportQuestion() {
        this.hideKeyboard();
        if (this.selectedOption == null) {
            Toast.makeText('Select issue!').show();
            return;
        }
        if (this.otherReason === null && this.selectedOption === 'Other') {
            Toast.makeText('Reason is required!').show();
            return;
        } {
            this.reportQuestion.gameId = this.game.gameId;
            let reason: string;

            this.reportQuestion.created_uid = this.user.userId;
            if (this.selectedOption === 'Other') {
                reason = this.otherReason;
            } else {
                reason = this.selectedOption;
            }
            const info: { [key: string]: QuestionMetadata } = {};
            const questionMetadata = new QuestionMetadata();
            questionMetadata.reason = reason;

            info[this.question.id] = { ...questionMetadata };
            this.reportQuestion.questions = info;
            this.store.dispatch(new gameplayactions.SaveReportQuestion({ reportQuestion: this.reportQuestion, game: this.game }));
            this.params.closeCallback();
        }

    }

    changeCheckedRadio(reportOption: ReportOption): void {
        reportOption.selected = !reportOption.selected;
        if (!reportOption.selected) {
            return;
        }
        this.selectedOption = reportOption.text;
        // uncheck all other optionss
        this.reportOptions.forEach(option => {
            if (option.text !== reportOption.text) {
                option.selected = false;
            }
        });
    }

    get otherAnswer() {
        const otherAnswer = this.question.answers.filter(ans => !ans.correct).map(ans => ans.answerText);
        return otherAnswer;
    }

    get correctAnswer() {
        const correctAnswer = this.question.answers.filter(ans => ans.correct).map(ans => ans.answerText);
        return correctAnswer;
    }

    get categoryName() {
        const categories = this.question.categoryIds.map(id => {
            return this.categoryDict[id];
        });
        return categories.map(category => category.categoryName).join(',');
    }

    onClose(): void {
        this.params.closeCallback();
    }

    ngOnDestroy() {
    }

    hideKeyboard() {
        this.textField
            .toArray()
            .map((el) => {
                if (isAndroid) {
                    el.nativeElement.android.clearFocus();
                }
                return el.nativeElement.dismissSoftInput();
            });
    }

}

export class ReportOption {
    text: string;
    selected: Boolean = false;
    constructor(text: string) {
        this.text = text;
    }
}

