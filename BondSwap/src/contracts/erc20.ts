import { ethers } from 'ethers';
import { Coin, CorePoolDTO } from 'src/typings/type';
import { getCoinInfoFromNet } from 'src/api/coin';
import { isValidCoinAddress, error, log, sleep } from 'src/utils/_';
import { getAddress } from 'src/store';
import abi from './erc20.abi.json';
import { getSigner } from './base';
import { alertInitWallet } from 'src/utils/modal';

const getCoinInfoPending: Record<string, Promise<Coin | null>> = {};
const coinAddressMap: Record<string, Coin> = {};

export async function getCoinInfoByAddress(
  coinAddress: string
): Promise<Coin | null> {
  if (!isValidCoinAddress(coinAddress)) {
    error(`invalid coinAddress`, coinAddress);
    return null;
  }

  if (coinAddressMap[coinAddress]) {
    return coinAddressMap[coinAddress];
  }

  const coin = await getCoin(coinAddress);

  if (coin) {
    coinAddressMap[coinAddress] = coin;
  }

  return coin;
}

export async function getCoin(coinAddress: string): Promise<Coin | null> {
  if (getCoinInfoPending[coinAddress]) {
    return getCoinInfoPending[coinAddress];
  }

  async function query() {
    try {
      const coin = await getCoinInfoFromNet(coinAddress);
      if (coin) return coin;
      return getCoinInfoFromETH(coinAddress);
    } finally {
      delete getCoinInfoPending[coinAddress];
    }
  }

  getCoinInfoPending[coinAddress] = query();

  return getCoinInfoPending[coinAddress];
}

async function getCoinInfoFromETH(coinAddress: string): Promise<Coin | null> {
  const erc20 = getContract(coinAddress);
  if (!erc20) {
    return null;
  }

  const symbol = await erc20.symbol();
  const decimals = await erc20.decimals();

  return {
    symbol,
    address: coinAddress,
    decimals,
  };
}

export function getContract(coinAddress: string): ethers.Contract | undefined {
  const signer = getSigner();
  if (!signer) {
    alertInitWallet();
    return;
  }

  if (!erc20s[coinAddress]) {
    erc20s[coinAddress] = new ethers.Contract(coinAddress, abi, signer);
  }

  return erc20s[coinAddress];
}

const erc20s: Record<string, ethers.Contract> = {};
/**
 *
 * @param coinAddress 授权的合约地址
 * @param amount erc20 的最小单位
 */
export async function isErc20Approved(coinAddress: string, contract: string, amount: string) {
  const erc20 = getContract(coinAddress);
  if (!erc20) {
    return;
  }

  const owner = await getAddress();
  const allowance = (await erc20.allowance(owner, contract)) || 0;
  const need = ethers.BigNumber.from(amount);
  if (ethers.BigNumber.from(allowance).gte(need)) {
    return true;
  }
  return false;
}

export async function requestErc20Approve(coinAddress: string, contract: string, amount: string) {
  const erc20 = getContract(coinAddress);
  if (!erc20) {
    return;
  }

  const owner = await getAddress();
  const allowance = (await erc20.allowance(owner, contract)) || 0;
  log(`allowance for ${contract}`, allowance.toString());
  const need = ethers.BigNumber.from(amount);
  if (ethers.BigNumber.from(allowance).gte(need)) {
    return true;
  }

  log(`before approve for ${contract}`);
  await erc20.approve(contract, need.toString());
  log(`after approve for ${contract}`);

  try {
    while (true) {
      const allowance = (await erc20.allowance(owner, contract)) || 0;
      log(`loop check allowance for ${contract}`, allowance.toString());
      if (ethers.BigNumber.from(allowance).gte(need)) {
        log('enough allowance');
        return true;
      }
      await sleep(10);
    }
  } catch (e) {
    error(`failed to request approve`, e);
    return false;
  }
}

export async function addPoolTrackerDetail<T extends CorePoolDTO>(pool: T): Promise<T> {
  if (!pool.trackerSymbol) {
    const coinInfo = await getCoinInfoByAddress(pool.tracker);
    if (coinInfo) {
      return {
        ...pool,
        trackerSymbol: coinInfo.symbol,
        trackerDecimals: coinInfo.decimals,
      };
    }
  }

  return pool;
}

export async function getBalance(coinAddress: string, address: string): Promise<string> {
  const erc20 = getContract(coinAddress);
  if (!erc20) {
    return '';
  }

  const balance = await erc20.balanceOf(address);
  return balance.toString();
}
