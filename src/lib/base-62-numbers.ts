import base from 'base-x';

export const base62 = base(
  '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
);

export function numberToUint8Array(number: bigint) {
  const negative = number < 0n;
  if (negative) {
    number = -number;
  }

  const byteArray = [];
  number = (number << 1n) | BigInt(negative);
  while (number > 0n) {
    byteArray.push(Number(number & 0xffn));
    number >>= 8n;
  }

  return new Uint8Array(byteArray);
}

export function uint8ArrayToNumber(byteArray: Uint8Array): bigint {
  let number = 0n;

  for (let i = byteArray.length - 1; i >= 0; i--) {
    number = (number << 8n) | BigInt(byteArray[i]);
  }

  const negative = number & 1n;
  number >>= 1n;

  return negative ? -number : number;
}

export function base62EncodeNumber(param: bigint) {
  const buffer = numberToUint8Array(param);
  return base62.encode(buffer);
}

export function base62DecodeNumber(param: string) {
  const buffer = base62.decode(param);
  return uint8ArrayToNumber(buffer);
}
