import {
  Body,
  Controller,
  ExecutionContext,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';

const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:3000';

/** Google OAuth guard — redirects to /auth/login?error=... on failure. */
@Injectable()
class GoogleGuard extends AuthGuard('google') {
  handleRequest(err: any, user: any, info: any, ctx: ExecutionContext) {
    if (err || !user) {
      const reason = err?.message ?? info?.message ?? err?.code ?? 'oauth_failed';
      console.error('[GoogleGuard] auth failed — err:', err?.message ?? err, '| info:', info);
      const res = ctx.switchToHttp().getResponse<Response>();
      res.redirect(`${FRONTEND}/auth/login?error=${encodeURIComponent(reason)}`);
      return null;
    }
    return user;
  }
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ─── Email / Password ─────────────────────────────────────────────────────

  @Post('signup')
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  /**
   * LocalAuthGuard runs LocalStrategy.validate() first.
   * If valid, req.user is the safe user object returned by validate().
   */
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Req() req: Request) {
    return this.authService.login(req.user as any);
  }

  // ─── Google OAuth ──────────────────────────────────────────────────────────

  /** Passport redirects the browser to Google's consent screen. */
  @Get('google')
  @UseGuards(GoogleGuard)
  googleLogin() {}

  /** Google redirects back here after the user authenticates. */
  @Get('google/callback')
  @UseGuards(GoogleGuard)
  googleCallback(@Req() req: Request, @Res() res: Response) {
    if (res.headersSent || !req.user) return;
    const token = this.authService.loginOAuth(req.user as any);
    res.redirect(`${FRONTEND}/auth/callback?token=${token}`);
  }

  // ─── Microsoft OAuth ───────────────────────────────────────────────────────

  @Get('microsoft')
  @UseGuards(AuthGuard('microsoft'))
  microsoftLogin() {}

  @Get('microsoft/callback')
  @UseGuards(AuthGuard('microsoft'))
  microsoftCallback(@Req() req: Request, @Res() res: Response) {
    const token = this.authService.loginOAuth(req.user as any);
    res.redirect(`${FRONTEND}/auth/callback?token=${token}`);
  }

  // ─── Slack OAuth ───────────────────────────────────────────────────────────

  /** Passport redirects the browser to Slack's OAuth consent screen. */
  @Get('slack')
  @UseGuards(AuthGuard('slack'))
  slackLogin() {}

  /** Slack redirects back here after the user authenticates. */
  @Get('slack/callback')
  @UseGuards(AuthGuard('slack'))
  slackCallback(@Req() req: Request, @Res() res: Response) {
    const token = this.authService.loginOAuth(req.user as any);
    res.redirect(`${FRONTEND}/auth/callback?token=${token}`);
  }

  // ─── Protected route example ───────────────────────────────────────────────

  /** Returns the currently authenticated user (from JWT). */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: Request) {
    // req.user is set by JwtStrategy.validate() — never contains password_hash
    return req.user;
  }
}