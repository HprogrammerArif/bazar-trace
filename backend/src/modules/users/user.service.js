import { AppError } from '../../utils/app-error.js';
import * as userRepository from './user.repository.js';

export const list = () => userRepository.listAll();

export async function get(id) {
  const user = await userRepository.findById(id);
  if (!user) throw AppError.notFound('User not found');
  return user;
}

export async function update(id, patch) {
  await get(id);
  return userRepository.update(id, patch);
}
