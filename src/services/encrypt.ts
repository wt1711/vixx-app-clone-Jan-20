import crypto from 'react-native-quick-crypto';
import { Buffer } from 'buffer';
import { ENV } from '../constants/env';

const getKeyAndIv = () => {
  const key = Buffer.from(
    ENV.ENCRYPTION_SECRET ||
      'c8c218b705d616a5a1cc3bef076a878454fd3faf73996f61625f914f2ec06c8d',
    'hex',
  );
  const iv = Buffer.from(
    ENV.ENCRYPTION_IV || 'a7717fab63dab888db877e2ccf0d4aaa',
    'hex',
  );
  if (!key || !iv) {
    throw new Error('Missing ENCRYPTION_SECRET or ENCRYPTION_IV');
  }
  return {
    key,
    iv,
  };
};

export const encrypt = (value: string) => {
  const { key, iv } = getKeyAndIv();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(value, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
};

export const decrypt = (value: string) => {
  const { key, iv } = getKeyAndIv();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(value, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
};
