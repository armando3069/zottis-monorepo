import { Strategy as OAuth2Strategy } from 'passport-oauth2';

declare module 'passport-slack-oauth2' {
  export interface SlackStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string | string[];
    passReqToCallback?: boolean;
    skipUserProfile?: boolean;
    tokenURL?: string;
    authorizationURL?: string;
    profileURL?: string;
    team?: string;
    user_scope?: string | string[];
    name?: string;
  }

  export interface SlackTeam {
    id: string;
    name: string;
  }

  export interface SlackEnterprise {
    id: string;
    name: string;
  }

  export interface SlackAuthedUser {
    id: string;
    scope?: string;
    access_token?: string;
    token_type?: string;
  }

  /**
   * Raw parameters returned by the Slack token endpoint.
   * Shape follows the Slack OAuth v2 response:
   * https://api.slack.com/methods/oauth.v2.access
   */
  export interface SlackOAuthParams {
    access_token: string;
    token_type: string;
    scope: string;
    bot_user_id?: string;
    app_id?: string;
    team?: SlackTeam;
    enterprise?: SlackEnterprise | null;
    authed_user?: SlackAuthedUser;
  }

  export interface SlackProfile {
    provider: 'Slack';
    id: string;
    displayName: string;
    user?: {
      name: string;
      id: string;
      email?: string;
      image_24?: string;
      image_32?: string;
      image_48?: string;
      image_72?: string;
      image_192?: string;
    };
    team?: SlackTeam;
  }

  type VerifyCallback = (error: Error | null, user?: unknown) => void;

  type VerifyFunction = (
    accessToken: string,
    refreshToken: string | undefined,
    params: SlackOAuthParams,
    profile: SlackProfile,
    done: VerifyCallback,
  ) => void;

  export class Strategy extends OAuth2Strategy {
    constructor(options: SlackStrategyOptions, verify: VerifyFunction);
    name: string;
  }
}
