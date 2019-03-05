import admin from '../db/firebase.client';
const functions = require('firebase-functions');
const fs = require('fs');
const path = require('path');
const mailConfig = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../../../config/mail.config.json'), 'utf8'));
import { AppSettings } from './../services/app-settings.service';
import { LeaderBoardService as generalleaderBoardService } from '../services/leaderboard.service';
const appSettings: AppSettings = new AppSettings();
const generalAccountService = require('../services/account.service');

import {
    Game, Question, Category, User, UserStatConstants, Invitation,
    TriggerConstants, PlayerMode, OpponentType, friendInvitationConstants
} from '../../projects/shared-library/src/lib/shared/model';
import { ESUtils } from '../utils/ESUtils';
import { GameLeaderBoardStats } from '../utils/game-leader-board-stats';
import { UserContributionStat } from '../utils/user-contribution-stat';
import { FriendGameStats } from '../utils/friend-game-stats';
import { MailClient } from '../utils/mail-client';
import { SystemStatsCalculations } from '../utils/system-stats-calculations';


// Take the text parameter passed to this HTTP endpoint and insert it into the
// Realtime Database under the path /messages/:pushId/original
exports.addMessage = (firebaseFunctions: any) => {

    firebaseFunctions.https.onRequest((req, res) => {
        // Grab the text parameter.

        const original = req.query.text;
        // Push it into the Realtime Database then send a response
        admin.database().ref('/messages').push({ original: original }).then(snapshot => {
            // Redirect with 303 SEE OTHER to the URL of the pushed object in the Firebase console.
            res.redirect(303, snapshot.ref);
        });
    });

};

exports.onQuestionWrite = functions.firestore.document('/questions/{questionId}').onWrite((change, context) => {

    const data = change.after.data();

    if (data) {
        const question: Question = data;

        data.createdOn = (data.createdOn && data.createdOn['_seconds']) ? new Date(data.createdOn['_seconds'] * 1000) : new Date();

        // add or update
        ESUtils.createOrUpdateIndex(ESUtils.QUESTIONS_INDEX, data.categoryIds['0'], question, context.params.questionId);

        const userContributionStat: UserContributionStat = new UserContributionStat();
        userContributionStat.getUser(question.created_uid, UserStatConstants.initialContribution).then((userDictResults) => {
            console.log('updated user category stat');
        });
        const systemStatsCalculations: SystemStatsCalculations = new SystemStatsCalculations();
        systemStatsCalculations.updateSystemStats('total_questions').then((stats) => {
            console.log(stats);
        });
    } else {
        // delete
        ESUtils.removeIndex(ESUtils.QUESTIONS_INDEX, context.params.questionId);
    }

});



exports.onInvitationWrite = functions.firestore.document('/invitations/{invitationId}').onWrite((change, context) => {

    const beforeEventData = change.before.data();
    const afterEventData = change.after.data();
    const invitation: Invitation = afterEventData;

    if (afterEventData !== beforeEventData && mailConfig.enableMail && invitation.status === friendInvitationConstants.PENDING) {
        const url = `${mailConfig.hosturl}${invitation.id}`;
        const htmlContent = `You have a new invitation request. Click <a href="${url}">Accept Invitation</a> to accept the invitation.`;
        const mail: MailClient = new MailClient(invitation.email, TriggerConstants.invitationMailSubject,
            TriggerConstants.invitationTxt, htmlContent);
        mail.sendMail();

    }

});


// update stats based on gamr creation
exports.onGameCreate = functions.firestore.document('/games/{gameId}').onCreate((snap, context) => {

    const data = snap.data();

    if (data) {
        console.log('game data created');
        const systemStatsCalculations: SystemStatsCalculations = new SystemStatsCalculations();
        systemStatsCalculations.updateSystemStats('active_games').then((stats) => {
            console.log(stats);
        });
    }

});


exports.onGameUpdate = functions.firestore.document('/games/{gameId}').onUpdate((change, context) => {

    const beforeEventData = change.before.data();
    const afterEventData = change.after.data();

    if (afterEventData !== beforeEventData) {
        console.log('data changed');
        const game: Game = Game.getViewModel(afterEventData);
        if (game.gameOver) {

            const gameLeaderBoardStats: GameLeaderBoardStats = new GameLeaderBoardStats();

            gameLeaderBoardStats.getGameUsers(game).then((status) => {
                console.log('status', status);
            });


            if (Number(game.gameOptions.playerMode) === PlayerMode.Opponent &&
                Number(game.gameOptions.opponentType) === OpponentType.Friend) {
                const friendGameStats: FriendGameStats = new FriendGameStats();
                friendGameStats.calculateFriendsGameState(game).then((status1) => {
                    console.log('friend stat status', status1);
                });
            }

            const systemStatsCalculations: SystemStatsCalculations = new SystemStatsCalculations();
            return systemStatsCalculations.updateSystemStats('active_games').then((stats) => {
                console.log(stats);
                return stats;
            });
        }
    }
});



// update stats based on user creation
exports.onUserCreate = functions.firestore.document('/users/{userId}').onCreate(async (snap, context) => {

    const data = snap.data();

    if (data) {
        console.log('user data created');
        const systemStatsCalculations: SystemStatsCalculations = new SystemStatsCalculations();
        systemStatsCalculations.updateSystemStats('total_users').then((stats) => {
            console.log(stats);
        });

        const appSetting = await appSettings.getAppSettings();
        if (appSetting.lives.enable) {
            const accountObj: any = {};
            accountObj.id = data.userId;
            accountObj.lives = appSetting.lives.max_lives;
            generalAccountService.setAccount(accountObj);
        }
    }

});

exports.onAccountUpdate = functions.firestore.document('/accounts/{accountId}').onUpdate((change, context) => {

    const beforeEventData = change.before.data();
    const afterEventData = change.after.data();

    if (afterEventData !== beforeEventData) {
        const account: Account = afterEventData;

        return generalleaderBoardService.getLeaderBoardStats().then((lbsStats) => {
            lbsStats = (lbsStats.data()) ? lbsStats.data() : {};
            lbsStats = generalleaderBoardService.calculateLeaderBoardStats(account, lbsStats);
            // console.log('lbsStats', lbsStats);
            return generalleaderBoardService.setLeaderBoardStats({ ...lbsStats }).then((leaderBoardStat) => {
                console.log('updated leaderboardstats');
                return leaderBoardStat;
            }, error => {
                console.log('leaderBoardStat error', error);
                return error;
            });


        }, error => {
            console.log('leaderBoardStat error', error);
            return error;
        });
    }

});
