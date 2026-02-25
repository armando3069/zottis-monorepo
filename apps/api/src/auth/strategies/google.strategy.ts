import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';
import { AuthService, SafeUser } from '../auth.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    config: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: config.getOrThrow('GOOGLE_CLIENT_ID'),
      clientSecret: config.getOrThrow('GOOGLE_CLIENT_SECRET'),
      callbackURL: config.getOrThrow('GOOGLE_CALLBACK_URL'),
      scope: ['openid', 'email', 'profile'],
      state: false, // stateless JWT app — no session middleware
    });
  }

  // @nestjs/passport v11 calls done(null, returnValue) automatically.
  // Never call done() manually — that causes a double-call that overwrites
  // the successful user with undefined and triggers fail().
  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<SafeUser> {
    return this.authService.findOrCreateOAuthUser({
      provider: 'google',
      providerAccountId: profile.id,
      email: profile.emails?.[0]?.value,
      name: profile.displayName,
      avatar: profile.photos?.[0]?.value,
      accessToken,
      refreshToken,
    });
  }
}
