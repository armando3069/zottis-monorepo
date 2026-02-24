import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { SlackStrategy } from './strategies/slack.strategy';
// import { MicrosoftOAuthStrategy } from './strategies/microsoft.strategy';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Cast needed: @nestjs/jwt uses the `ms` StringValue type; env var is a plain string
          expiresIn: config.get('JWT_EXPIRES_IN', '7d') as any,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    LocalStrategy,
    GoogleStrategy,
    SlackStrategy,
    //MicrosoftOAuthStrategy,
    JwtAuthGuard,
  ],
  // Export JwtAuthGuard so other modules can apply it on protected routes
  exports: [JwtAuthGuard],
})
export class AuthModule {}