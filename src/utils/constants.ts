export const BCRYPT_HASH_ROUND = 4;
export const KEY_LENGTH = 5;

export enum UserEnum {
  SHOP = 'SHOP',
  AGENT = 'AGENT',
}

export enum OrderStatusEnum {
  CREATED = 'CREATED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NOT_HANDLED = 'NOT_HANDLED',
}

export enum CollectionProgressStatusEnum {
  STARTED = 'STARTED',
  COMPLETED = 'COMPLETED',
}

export enum CollectionStatusEnum {
  PARTIAL = 'PARTIAL',
  FULL = 'FULL',
}
