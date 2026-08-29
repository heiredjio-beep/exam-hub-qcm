import * as userRepository from '../Repositorie/userRepository';
import * as password from '../Security/password';
import * as jwt from '../Security/jwt';
import { HttpError } from '../Security/httpError';
import type { SafeUser } from '../Model/user';


export async function login(email: string, plainPassword: string): Promise<{ token: string; user: SafeUser }> {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new HttpError(401, 'Identifiants invalides');
  }

  const passwordMatches = await password.compare(plainPassword, user.passwordHash);
  if (!passwordMatches) {
    throw new HttpError(401, 'Identifiants invalides');
  }


  if (!user.isActive) {
    throw new HttpError(403, 'Ce compte a ete desactive');
  }

  const token = jwt.sign({ sub: user.id, role: user.role });

  return {
    token,
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
  };
}