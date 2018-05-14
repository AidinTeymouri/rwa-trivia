import { Component, Input, Output, OnInit, OnDestroy, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { User, Game } from '../../../model';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState, appState } from '../../../store';
import * as gameplayactions from '../../store/actions';
import { gameplayState } from '../../store';
import * as html2canvas from 'html2canvas';


@Component({
  selector: 'game-over',
  templateUrl: './game-over.component.html',
  styleUrls: ['./game-over.component.scss']
})
export class GameOverComponent implements OnInit {
  @Input() correctCount: number;
  @Input() noOfQuestions: number;
  @Output() gameOverContinueClicked = new EventEmitter();
  @Output() viewQuestionClicked = new EventEmitter<any>();
  @Input() categoryName: string;
  @Input() game: Game;
  @Input() userDict: { [key: string]: User };
  user$: Observable<User>;
  user: User;
  otherUserId: string;
  otherUserInfo: User;
  questionsArray = [];


  continueButtonClicked(event: any) {
    this.gameOverContinueClicked.emit();
  }

  constructor(private store: Store<AppState>) {
    this.user$ = this.store.select(appState.coreState).select(s => s.user);
    this.user$.subscribe(user => {
      if (user !== null) {
        this.user = user;
      }
    });

    this.store.select(gameplayState).select(s => s.userAnsweredQuestion).subscribe(stats => {
      if (stats != null) {
        this.questionsArray = stats;
      }
    });
  }
  ngOnInit() {
    if (this.game) {
      this.otherUserId = this.game.playerIds.filter(userId => userId !== this.user.userId)[0];
      this.otherUserInfo = this.userDict[this.otherUserId];
    }
  }
  bindQuestions() {
    if (this.questionsArray.length === 0) {
      this.store.dispatch(new gameplayactions.GetUsersAnsweredQuestion({ userId: this.user.userId, game: this.game }));
    }

  }
  shareScore() {

    html2canvas(document.querySelector('.share-content')).then((canvas) => {
      const context = canvas.getContext('2d');
      const img = document.getElementById('yourImage');
      roundedImage(365, 58, 70, 60, 40);
      context.clip();
      context.drawImage(img, 365, 58, 70, 60);
      document.body.appendChild(canvas);
      const image = canvas.toDataURL('image/jpg');
      console.log(JSON.stringify(image));

      function roundedImage(x, y, width, height, radius) {
        context.beginPath();
        context.moveTo(x + radius, y);
        context.lineTo(x + width - radius, y);
        context.quadraticCurveTo(x + width, y, x + width, y + radius);
        context.lineTo(x + width, y + height - radius);
        context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        context.lineTo(x + radius, y + height);
        context.quadraticCurveTo(x, y + height, x, y + height - radius);
        context.lineTo(x, y + radius);
        context.quadraticCurveTo(x, y, x + radius, y);
        context.closePath();
      }
    });
  }
}
