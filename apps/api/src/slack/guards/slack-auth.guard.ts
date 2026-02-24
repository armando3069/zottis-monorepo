import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class SlackAuthGuard extends AuthGuard('slack') {}
