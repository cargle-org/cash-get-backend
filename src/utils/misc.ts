import { UserEnum } from './constants';
import * as otpGenerator from 'otp-generator';

export function generateKey(size = 10, role: UserEnum) {
  const suff = otpGenerator.generate(size, {
    digits: true,
    lowerCaseAlphabets: false,
    specialChars: false,
    upperCaseAlphabets: false,
  });
  return role == UserEnum.AGENT ? `A-${suff}` : `S-${suff}`;
}
