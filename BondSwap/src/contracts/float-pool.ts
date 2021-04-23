import { CONTRACT_FLOAT_POOL, CONTRACT_FLOAT_POOL_V2 } from 'src/utils/const';
import { FloatPool, FloatPoolDTO } from 'src/typings/type';
import { ethers } from 'ethers';
import { log, error, maxWait, wait, isTransactionMined } from 'src/utils/_';
import { getPoolByTx } from 'src/api/pool';
import { waitJoin } from 'src/api/pool';
import abi from './float-pool-abi.json';
import { addPoolTrackerDetail, requestErc20Approve, isErc20Approved } from './erc20';
import { connectCallback } from './base';
import { toEth, getStandardUnit } from 'src/utils/currency';
import store from 'src/store';
import { alertInitWallet } from 'src/utils/modal';

let poolContract: ethers.Contract | null = null;

let poolContract2: ethers.Contract | null = null;

connectCallback(signer => {
  poolContract = new ethers.Contract(CONTRACT_FLOAT_POOL, abi, signer);
  poolContract2 = new ethers.Contract(CONTRACT_FLOAT_POOL_V2, abi, signer);
});

function getPoolContract(pool: FloatPoolDTO) {
  return pool.contract === CONTRACT_FLOAT_POOL_V2 ? poolContract2 : poolContract;
}

export interface CreateFloatPoolParams {
  name?: string;
  // erc20 地址
  address: string;
  // erc20 数量，最小单位
  amount: string;
  // 结束时间，单位是秒
  endTime: number;
}

export async function approveFloatPool(
  params: any
) {
  const { address, amount } = params;

  const approved = await requestErc20Approve(address, CONTRACT_FLOAT_POOL_V2, amount);
  if (!approved) {
    log('user not approved');
    return false;
  }
  return true;
}

export async function isFloatApproved(
  params: any
) {
  const { address, amount } = params;

  const approved = await isErc20Approved(address, CONTRACT_FLOAT_POOL_V2, amount);
  if (!approved) {
    return false;
  }
  return true;
}

export async function createFloatPool(
  params: CreateFloatPoolParams
): Promise<string> {
  const { name = '', address, amount, endTime } = params;

  const _amount = ethers.BigNumber.from(amount);

  log('create_float_pool', address, _amount, endTime);

  const { hash } = await poolContract2!.createBidPool(
    name,
    address,
    _amount,
    endTime,
    false // todo onlyHolders
  );

  try {
    while(true) {
      let mined = await isTransactionMined(hash);
      if (mined) break;
    }
  } catch (e) {
    console.error(e);
    return "";
  }
  return hash;
}

// eth 最小单位
export async function joinFloatPool(pool: FloatPool, amount: string) {
  const contract = getPoolContract(pool);
  if (!contract) {
    alertInitWallet();
    return;
  }

  const id = pool.poolId;
  const poolNative = await contract!.bidPools(id);
  if (!poolNative) {
    error(`no pool: ${id}`);
    return;
  }

  const _amount = ethers.BigNumber.from(amount);

  const { hash } = await contract!.bidPoolJoin(id, _amount, {
    value: amount.toString(),
  });
  try {
    while(true) {
      let mined = await isTransactionMined(hash);
      if (mined) break;
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function withdrawMime(pool: FloatPool) {
  const contract = getPoolContract(pool);
  if (!contract) {
    alertInitWallet();
    return;
  }

  const id = pool.poolId;
  const { hash } = await contract!.bidPoolMakerWithdraw(id);
  try {
    while(true) {
      let mined = await isTransactionMined(hash);
      if (mined) break;
    }
  } catch (e) {
    console.error(e);
    return "";
  }
}

export async function withdraw(pool: FloatPool) {
  const contract = getPoolContract(pool);
  if (!contract) {
    alertInitWallet();
    return;
  }

  const id = pool.poolId;
  await contract!.bidPoolTakerWithdraw(id);

  const myAddress = store.getState().address;
  await wait(async () => {
    const canWithdraw = await canWithDrawJoin(pool, myAddress);
    return !canWithdraw;
  });
}

export async function canWithDrawJoin(pool: FloatPool, address: string): Promise<boolean> {
  const contract = getPoolContract(pool);
  if (!contract) {
    return false;
  }

  const id = pool.poolId;
  const amount = await contract.bidTakerAmount(id, address);
  return amount && parseFloat(amount) > 0;
}

export async function getFloatPoolDetail(pool: FloatPoolDTO): Promise<FloatPool> {
  pool = await addPoolTrackerDetail(pool);

  const contract = getPoolContract(pool);
  if (!contract) {
    return pool;
  }

  return maxWait(async () => {
    const poolNative: NativeFloatPool = await contract!.bidPools(pool.poolId);

    let canWithDrawJoin = false;
    const myAddress = store.getState().address;
    if (myAddress && myAddress !== poolNative.maker) {
        const amount = await contract!.bidTakerAmount(pool.poolId, myAddress);
        canWithDrawJoin = amount && parseFloat(amount) > 0;
    }

    return {
      ...pool,
      closed: poolNative.enabled,
      canWithDrawJoin,
    };
  }, pool, 1000);
}

export interface NativeFloatPool {
  tokenAmount: string;
  makerReceiveTotal: string;
  ratio: number;
  enabled: boolean;
  maker: string;
}

export async function getNativePool(pool: FloatPool): Promise<NativeFloatPool | null> {
  const contract = getPoolContract(pool);
  if (!contract) {
    return null;
  }

  const nativePool = await contract!.bidPools(pool.poolId);

  const tokenAmount = getStandardUnit(nativePool.tokenAmount.toString(), pool.trackerDecimals!);
  const eth = toEth(nativePool.makerReceiveTotal.toString());

  return {
    tokenAmount: `${tokenAmount} ${pool.trackerSymbol}`,
    makerReceiveTotal: `${eth} ETH`,
    ratio: parseFloat(eth) / parseFloat(tokenAmount),
    maker: nativePool.maker,
    enabled: nativePool.enabled,
  };
}
// getJoinByTx('0xde0c10811e1b421fec26876fc4c6258bba0b1ef6fcab36ae32a1b1f503faa06a').then(res => console.log(res));

// poolContract!.bidPools(16).then(res => console.log('ffff', res.tokenAmount.toString()));

// poolContract!.bidPools(15).then(res => console.log('ffff', JSON.stringify(res)));
