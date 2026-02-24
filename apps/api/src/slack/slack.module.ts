/**
 * @deprecated
 * Slack OAuth is now handled entirely by AuthModule.
 * Routes: GET /auth/slack  and  GET /auth/slack/callback
 * Strategy: src/auth/strategies/slack.strategy.ts
 *
 * This module is intentionally empty and no longer imported by AppModule.
 */
import { Module } from '@nestjs/common';

@Module({})
export class SlackModule {}