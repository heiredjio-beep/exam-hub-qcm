import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';

export interface TokenPayload {
  sub: number;
  role: 'ADMIN' | 'STUDENT';
}

export function sign(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwt.secret, {
    expiresIn: env.jwt.expiresIn as SignOptions['expiresIn'],
  });
}

export function verify(token: string): TokenPayload {
  return jwt.verify(token, env.jwt.secret) as unknown as TokenPayload;
}
