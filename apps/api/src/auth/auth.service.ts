import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';

export interface SafeUser {
  id: number;
  email: string;
  name: string | null;
  avatar: string | null;
}

interface OAuthPayload {
  provider: string;
  providerAccountId: string;
  email?: string;
  name?: string;
  avatar?: string;
  accessToken: string;
  refreshToken?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  // ─── Email / Password ────────────────────────────────────────────────────────

  async signup(dto: SignupDto): Promise<{ access_token: string }> {
    const exists = await this.prisma.users.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already in use');

    const hash = await argon2.hash(dto.password);
    const user = await this.prisma.users.create({
      data: { email: dto.email, password_hash: hash, name: dto.name ?? null },
    });

    return { access_token: this.signJwt(user.id, user.email) };
  }

  /** Called by LocalStrategy to authenticate a user before issuing a token. */
  async validateLocalUser(
    email: string,
    password: string,
  ): Promise<SafeUser | null> {
    const user = await this.prisma.users.findUnique({ where: { email } });
    if (!user || !user.password_hash) return null;

    const valid = await argon2.verify(user.password_hash, password);
    if (!valid) return null;

    return { id: user.id, email: user.email, name: user.name, avatar: user.avatar };
  }

  /** Called by LocalAuthGuard-protected /login route after LocalStrategy succeeds. */
  login(user: SafeUser): { access_token: string } {
    return { access_token: this.signJwt(user.id, user.email) };
  }

  // ─── OAuth ───────────────────────────────────────────────────────────────────

  /**
   * Upsert logic shared by Google and Microsoft strategies:
   * 1. Existing auth_account  → update tokens, return its user.
   * 2. Existing user by email → link new auth_account, return user.
   * 3. No user at all         → create user + auth_account, return new user.
   */
  async findOrCreateOAuthUser(payload: OAuthPayload): Promise<SafeUser> {
    // 1. Look up by provider + provider_account_id
    const existingAccount = await this.prisma.auth_accounts.findUnique({
      where: {
        provider_provider_account_unique: {
          provider: payload.provider,
          provider_account_id: payload.providerAccountId,
        },
      },
      include: { user: { select: { id: true, email: true, name: true, avatar: true } } },
    });

    if (existingAccount) {
      await this.prisma.auth_accounts.update({
        where: { id: existingAccount.id },
        data: {
          access_token: payload.accessToken,
          refresh_token: payload.refreshToken ?? null,
        },
      });
      return existingAccount.user;
    }

    // 2. Try to link to an existing user by email
    let user = payload.email
      ? await this.prisma.users.findUnique({
          where: { email: payload.email },
          select: { id: true, email: true, name: true, avatar: true },
        })
      : null;

    // 3. Create a brand-new user if we couldn't find one
    if (!user) {
      // Fallback email keeps the unique constraint satisfied when provider has no email
      const email =
        payload.email ??
        `${payload.provider}_${payload.providerAccountId}@oauth.local`;

      user = await this.prisma.users.create({
        data: {
          email,
          name: payload.name ?? null,
          avatar: payload.avatar ?? null,
          // password_hash intentionally omitted — OAuth-only user has no password
        },
        select: { id: true, email: true, name: true, avatar: true },
      });
    }

    // Create the auth_accounts row linking provider → user
    await this.prisma.auth_accounts.create({
      data: {
        user_id: user.id,
        provider: payload.provider,
        provider_account_id: payload.providerAccountId,
        access_token: payload.accessToken,
        refresh_token: payload.refreshToken ?? null,
      },
    });

    return user;
  }

  /** Returns a raw JWT string for use in OAuth callback redirects. */
  loginOAuth(user: SafeUser): string {
    return this.signJwt(user.id, user.email);
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private signJwt(userId: number, email: string): string {
    return this.jwt.sign({ sub: userId, email });
  }
}