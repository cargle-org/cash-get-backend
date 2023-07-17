import * as Crypto from 'crypto';
import { UserEnum } from './constants';

export function generateKey(size = 10, role: UserEnum) {
  const suff = Crypto.randomBytes(size).toString('base64').slice(0, size);
  return role == UserEnum.AGENT ? `A- ${suff}` : ` S- ${suff}`;
}
