import { ROLES } from '../../shared/constants/roles.js';
import { AppError } from '../../utils/app-error.js';
import { signToken } from '../../utils/jwt.js';
import { hashPassword, verifyPassword } from '../../utils/password.js';
import * as authRepository from './auth.repository.js';

const issueToken = (user) =>
  signToken({ sub: user.id, role: user.role, email: user.email });

const publicUser = (user) => ({
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  role: user.role,
});

export async function login({ email, password }) {
  const user = await authRepository.findByEmail(email);
  if (!user || !user.isActive) {
    throw AppError.unauthorized('Invalid credentials');
  }
  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    throw AppError.unauthorized('Invalid credentials');
  }
  return { token: issueToken(user), user: publicUser(user) };
}

export async function register({ fullName, email, password, role }) {
  const existing = await authRepository.findByEmail(email);
  if (existing) throw AppError.conflict('Email is already registered');

  const passwordHash = await hashPassword(password);
  const user = await authRepository.insertUser({
    fullName,
    email,
    passwordHash,
    role: role ?? ROLES.STAFF,
  });
  return { token: issueToken(user), user: publicUser(user) };
}

export async function me(userId) {
  const user = await authRepository.findById(userId);
  if (!user) throw AppError.notFound('User not found');
  return publicUser(user);
}

export async function changePassword(userId, { oldPassword, newPassword }) {
  const user = await authRepository.findByIdWithHash(userId);
  if (!user || !user.isActive) {
    throw AppError.notFound('User not found');
  }
  const matches = await verifyPassword(oldPassword, user.passwordHash);
  if (!matches) {
    throw AppError.unauthorized('Current password is incorrect');
  }
  const passwordHash = await hashPassword(newPassword);
  await authRepository.updatePassword(userId, passwordHash);
}
