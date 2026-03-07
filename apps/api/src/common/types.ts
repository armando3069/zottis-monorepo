import { Request } from '@nestjs/common';

export interface JwtPayload {
  sub: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: { id: number; email: string; name?: string | null; avatar?: string | null };
}
