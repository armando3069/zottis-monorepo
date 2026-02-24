import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, SlackOAuthParams, SlackProfile } from 'passport-slack-oauth2';
import { ConfigService } from '@nestjs/config';

export interface SlackOAuthResult {
  accessToken: string;
  refreshToken: string | undefined;
  teamId: string | undefined;
  teamName: string | undefined;
  botUserId: string | undefined;
  authedUserId: string | undefined;
  scope: string | undefined;
  profile: SlackProfile;
}

/**
 * Slack OAuth 2.0 strategy.
 *
 * Registers under the name 'slack' so guards can reference it via
 * @UseGuards(AuthGuard('slack')).
 *
 * The third argument `true` tells @nestjs/passport to set the internal
 * verify-callback arity to validate.length + 1. passport-oauth2 uses
 * arity to decide whether to pass the raw token-endpoint `params` object,
 * so this is required to receive the Slack workspace metadata.
 */
@Injectable()
export class SlackStrategy extends PassportStrategy(Strategy, 'slack', true) {
  constructor(private readonly config: ConfigService) {
    super({
      clientID: config.getOrThrow<string>('SLACK_CLIENT_ID'),
      clientSecret: config.getOrThrow<string>('SLACK_CLIENT_SECRET'),
      callbackURL: config.getOrThrow<string>('SLACK_CALLBACK_URL'),
      scope: config.getOrThrow<string>('SLACK_SCOPES').split(','),
      passReqToCallback: false,
    });
  }

  validate(
    accessToken: string,
    refreshToken: string | undefined,
    params: SlackOAuthParams,
    profile: SlackProfile,
  ): SlackOAuthResult {
    return {
      accessToken,
      refreshToken,
      teamId: params.team?.id,
      teamName: params.team?.name,
      botUserId: params.bot_user_id,
      authedUserId: params.authed_user?.id,
      scope: params.scope,
      profile,
    };
  }
}
