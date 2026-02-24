import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import {
  Strategy,
  SlackOAuthParams,
  SlackProfile,
} from 'passport-slack-oauth2';
import { ConfigService } from '@nestjs/config';
import { AuthService, SafeUser } from '../auth.service';

/**
 * Slack OAuth 2.0 login strategy.
 *
 * Registered under the name 'slack' so guards reference it via
 * AuthGuard('slack').
 *
 * The third argument `true` adjusts the arity reported to passport-oauth2
 * so it calls the verify callback as:
 *   verify(accessToken, refreshToken, params, profile, done)
 * NestJS strips the trailing `done` and passes the first four args to
 * validate(), then calls done(null, returnValue) automatically.
 *
 * Required Slack OAuth scopes for user-login:
 *   identity.basic, identity.email, identity.avatar
 * Set SLACK_SCOPES=identity.basic,identity.email,identity.avatar in .env
 */
@Injectable()
export class SlackStrategy extends PassportStrategy(Strategy, 'slack', true) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.getOrThrow<string>('SLACK_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('SLACK_CLIENT_SECRET'),
      // Must point to /auth/slack/callback (update SLACK_CALLBACK_URL in .env)
      callbackURL: config.getOrThrow<string>('SLACK_CALLBACK_URL'),
      scope: config.getOrThrow<string>('SLACK_SCOPES').split(','),
      passReqToCallback: false,
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string | undefined,
    _params: SlackOAuthParams,
    profile: SlackProfile,
  ): Promise<SafeUser> {
    return this.authService.findOrCreateOAuthUser({
      provider: 'slack',
      // profile.id is the Slack user ID (e.g. "U1234567890")
      providerAccountId: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
    });
  }
}