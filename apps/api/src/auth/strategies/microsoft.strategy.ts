import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
// passport-microsoft does not ship types; profile follows standard passport OAuth2 shape
// eslint-disable-next-line @typescript-eslint/no-require-imports
const MicrosoftStrategy = require('passport-microsoft').Strategy;
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class MicrosoftOAuthStrategy extends PassportStrategy(
  MicrosoftStrategy,
  'microsoft',
) {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.getOrThrow('MICROSOFT_CLIENT_ID'),
      clientSecret: config.getOrThrow('MICROSOFT_CLIENT_SECRET'),
      callbackURL: config.getOrThrow('MICROSOFT_CALLBACK_URL'),
      tenant: config.get('MICROSOFT_TENANT_ID', 'common'),
      scope: ['user.read'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (err: unknown, user: unknown) => void,
  ) {
    // Microsoft profile emails array OR _json.mail / userPrincipalName
    const email =
      profile.emails?.[0]?.value ??
      profile._json?.mail ??
      profile._json?.userPrincipalName;

    const user = await this.authService.findOrCreateOAuthUser({
      provider: 'microsoft',
      providerAccountId: profile.id,
      email,
      name: profile.displayName,
      avatar: undefined,
      accessToken,
      refreshToken,
    });
    done(null, user);
  }
}
