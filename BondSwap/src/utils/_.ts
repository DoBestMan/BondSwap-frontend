import { FixedPool, Pool } from 'src/typings/type';
import { APP_NAME, IS_DEV } from './const';
import { ethers } from 'ethers';

export function noop() {}

export function isNil(value: any): boolean {
  return value === undefined || value === null;
}

export function log(...args: any[]): void {
  if (IS_DEV) {
    console.log(...args);
  }
}

export function warn(...args: any[]): void {
  if (IS_DEV) {
    console.warn(...args);
  }
}

export function error(...args: any[]): void {
  if (IS_DEV) {
    console.error(...args);
  }
}

export function store(key: string, value: any) {
  if (isNil(value)) {
    log('store nil value for key', key);
    return;
  }

  key = `${APP_NAME}-${key}`;

  if (typeof value === 'object') {
    value = JSON.stringify(value);
  }

  localStorage.setItem(key, `${value}`);
}

export function retrieve<T>(key: string): T | null {
  key = `${APP_NAME}-${key}`;

  const value = localStorage.getItem(key);
  if (isNil(value)) {
    return null;
  }

  try {
    return JSON.parse(value!) as T;
  } catch (e) {
    error(e);
  }

  return (value as unknown) as T;
}

const _curformat = new Intl.NumberFormat('en-US');

const _usdFormat = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function usdFormat(amount: number): string {
  return _usdFormat.format(amount);
}

export function currencyFormat(amount: number): string {
  return _curformat.format(amount);
}

// 后缀多少个 0
export function getUnits(decimals: number): string {
  const n = 10 ** decimals;
  const str = _curformat.format(n).slice(1);
  if (str[0] === ',') {
    return str.slice(1);
  }
  return str;
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 4)}...${hash.slice(-4)}`;
}

export function isValidCoinAddress(address?: string): boolean {
  return !!address && address.length === 42;
}

export function getTime(days = 0, hours = 0, minutes = 0): number {
  return days * 24 * 3600 + hours * 3600 + minutes * 60;
}

export function isPoolFilled(pool: Pool): boolean {
  return !pool.isFloat && parseFloat(pool.leftAmount) == 0 && !isPoolClosed(pool);
}

export function isPoolExpired(pool: FixedPool | null): boolean {
  if (!pool) return false;

  const deadline = pool.endTime * 1000;
  const now = Date.now();

  return deadline < now;
}

export function isPoolClosed(pool: FixedPool): boolean {
  if (isPoolExpired(pool)) return true;
  if (pool.status === 'Closed') return true;
  return false;
}

export function inWhiteList(pool: FixedPool, myAddress: string): boolean {
  return pool.takers!.map(adx => adx.toLowerCase()).includes(myAddress.toLowerCase());
}

export function canotJoinPool(pool: Pool, myAddress: string) {
  return !myAddress ||
    isPoolClosed(pool) ||
    isPoolFilled(pool) ||
    (pool.priv && !inWhiteList(pool, myAddress))
}

export async function sleep(seconds: number): Promise<void> {
  return new Promise(res => {
    setTimeout(res, seconds * 1000);
  });
}

export async function maxWait<T>(fn: () => Promise<T>, value: T, timeout: number): Promise<T> {
  return new Promise((res, rej) => {
    setTimeout(() => {
      res(value);
    }, timeout);
    fn().then(res, rej);
  });
}

export async function wait<T>(condition: () => Promise<T>, interval = 20): Promise<T> {
  while (true) {
    const bool = await condition();
    if (bool) {
      return bool;
    }
    await sleep(interval);
  }
}

export function reload() {
  location.reload();
}

export async function isTransactionMined(transactionHash: string) {
  const provider = new ethers.providers.Web3Provider(window.ethereum);
  const txReceipt = await provider.getTransactionReceipt(transactionHash);
  if (txReceipt && txReceipt.blockNumber) {
    return true;
  }
  return false;
}