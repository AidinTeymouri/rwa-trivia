import { Injectable } from '@angular/core';
import { Action } from '@ngrx/store';
import { ActionWithPayload } from './action-with-payload';

import { User } from '../../../model';

@Injectable()
export class UserActions {

  static LOGOFF = 'LOGOFF';
  logoff(): ActionWithPayload<null> {
    return {
      type: UserActions.LOGOFF,
      payload: null
    };
  }

  static LOGIN_SUCCESS = 'LOGIN_SUCCESS';
  loginSuccess(user: User): ActionWithPayload<User> {
    return {
      type: UserActions.LOGIN_SUCCESS,
      payload: user
    };
  }

  static ADD_USER_WITH_ROLES = 'ADD_USER_WITH_ROLES';
  addUserWithRoles(user: User): ActionWithPayload<User> {
    return {
      type: UserActions.ADD_USER_WITH_ROLES,
      payload: user
    };
  }

  static ADD_USER_PROFILE_DATA = 'ADD_USER_PROFILE_DATA';
  addUserProfileData(user: User): ActionWithPayload<User> {
    return {
      type: UserActions.ADD_USER_PROFILE_DATA,
      payload: user
    };
  }

  static ADD_USER_PROFILE_DATA_SUCCESS = 'ADD_USER_PROFILE_DATA_SUCCESS';
  addUserProfileDataSuccess(): ActionWithPayload<null> {
    return {
      type: UserActions.ADD_USER_PROFILE_DATA_SUCCESS,
      payload: null
    };
  }


  static LOAD_USER_BY_ID = 'LOAD_USER_BY_ID';
  loadUserById(user: User): ActionWithPayload<User> {
    return {
      type: UserActions.LOAD_USER_BY_ID,
      payload: user
    };
  }

  static LOAD_USER_BY_ID_SUCCESS = 'LOAD_USER_BY_ID_SUCCESS';
  loadUserByIdSuccess(user: User): ActionWithPayload<User> {
    return {
      type: UserActions.LOAD_USER_BY_ID_SUCCESS,
      payload: user
    };
  }
}
