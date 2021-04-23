import type { Coin } from 'src/typings/type';
import { getPrefix } from './base';

export const PREFIX = '/erc20';

const get = getPrefix(PREFIX);

export async function getCoinInfoFromNet(coinAddress: string): Promise<Coin | null> {
  const coin = await get<Coin>(`/${coinAddress}`);
  if (coin && coin.symbol) return coin;
  return null;
}

export async function getEthPrice(): Promise<string> {
  const res = await get<string>('/price/eth');
  return res;
}

interface Liquidity {
  price: string;
  totalSupply: number;
  reserveUSD: number;
}
export async function getZomPrice(): Promise<Liquidity> {
  const res = await get<Liquidity>('/liquid/zom');
  return res;
}
