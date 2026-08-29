import bcrypt from 'bcrypt';
import { env } from '../config/env';

/**
 * Hachage et verification des mots de passe.
 * Cout bcrypt lu depuis la config centralisee, jamais en dur ici.
 */

export async function hash(plain: string): Promise<string> {
  return bcrypt.hash(plain, env.bcryptRounds);
}

export async function compare(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}