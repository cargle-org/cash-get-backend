import * as Crypto from 'crypto';
import { UserEnum } from './constants';

export function generateKey(size = 5, role: UserEnum) {
  const suff = Crypto.randomBytes(size)
    .toString('base64')
    .slice(0, size)
    .toUpperCase();
  return role == UserEnum.AGENT ? `A-${suff}` : `S-${suff}`;
}
