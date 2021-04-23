import { CONTRACT_FIXED_POOL, CONTRACT_FIXED_POOL_V2 } from 'src/utils/const';
import { FixedPool, FixedPoolDTO } from 'src/typings/type';
import { ethers } from 'ethers';
import { log, error, isNil, wait, isTransactionMined } from 'src/utils/_';
import { getPoolByTx, waitJoin } from 'src/api/pool';
import abi from './fixed-pool-abi.json';
import { requestErc20Approve, addPoolTrackerDetail , isErc20Approved } from './erc20';
import { connectCallback } from './base';
import { alertInitWallet } from 'src/utils/modal';

let poolContract: ethers.Contract | null = null;
let poolContract2: ethers.Contract | null = null;

function getPoolContract(pool: FixedPool) {
  return pool.contract === CONTRACT_FIXED_POOL_V2 ? poolContract2 : poolContract;
}

connectCallback(signer => {
  poolContract = new ethers.Contract(CONTRACT_FIXED_POOL, abi, signer);
  poolContract2 = new ethers.Contract(CONTRACT_FIXED_POOL_V2, abi, signer);
});

export interface CreateFixedPoolParams {
  name?: string;
  // erc20 地址
  address: string;
  // erc20 数量，最小单位
  amount: string;
  // 兑换比例
  rate: string;
  units: string;
  // 结束时间，单位是秒
  endTime: number;
}

export interface CreateFixedPubPoolParams extends CreateFixedPoolParams {}

export interface CreateFixedPrivPoolParams extends CreateFixedPoolParams {
  // 私有 pool 需要
  takers?: string[];
}

export async function approveFixedPool(
  params: any
) {
  const { address, amount } = params;

  const approved = await requestErc20Approve(address, CONTRACT_FIXED_POOL_V2, amount);
  if (!approved) {
    log('user not approved');
    return false;
  }
  return true;
}

export async function isApproved(
  params: any
) {
  const { address, amount } = params;

  const approved = await isErc20Approved(address, CONTRACT_FIXED_POOL_V2, amount);
  if (!approved) {
    return false;
  }
  return true;
}

export async function createFixedPool(
  params: CreateFixedPubPoolParams
): Promise<string> {
  const { name = '', address, amount, rate, units, endTime } = params;

  /*const approved = await requestErc20Approve(address, CONTRACT_FIXED_POOL_V2, amount);
  if (!approved) {
    log('user not approved');
    return null;
  }*/

  const _amount = ethers.BigNumber.from(amount).toString();
  const _rate = ethers.BigNumber.from(rate).toString();

  log('create_fixed_pool', 'name', name, 'tracker', address, 'amount', _amount, 'rate', _rate, 'units', units, endTime);

  const { hash } = await poolContract2!.createFixedPool(
    name,
    address,
    _amount,
    _rate,
    units,
    endTime,
    false, // todo onlyHolders
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
export async function joinFixedPool(pool: FixedPool, amount: string) {
  const contract = getPoolContract(pool);
  if (!contract) {
    alertInitWallet();
    return;
  }

  const value = ethers.BigNumber.from(amount);
  const { hash } = await contract!.fixedPoolJoin(pool.poolId, value, {
    value: value.toString(),
  });
  await waitJoin(hash);
}

export async function closeFixedPool(pool: FixedPool) {
  const contract = getPoolContract(pool);
  if (!contract) {
    alertInitWallet();
    return;
  }

  const { hash } = await contract!.fixedPoolClose(pool.poolId);
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

export async function createPrivateFixedPool(
  params: CreateFixedPrivPoolParams
): Promise<string> {
  const { name = '', address, amount, rate, units, endTime, takers } = params;

  const _amount = ethers.BigNumber.from(amount);
  const _rate = ethers.BigNumber.from(rate);

  log('create_priv_fixed_pool', address, _amount, _rate, endTime);

  const { hash } = await poolContract2!.createPrivFixedPool(
    name,
    address,
    _amount,
    _rate,
    units,
    params.endTime,
    takers
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
export async function joinPrivateFixedPool(
  pool: FixedPool,
  myAddress: string,
  amount: string
) {
  const takerIndex = pool.takers?.map(addr => addr.toLowerCase()).indexOf(myAddress.toLowerCase());
  // const takerIndex = pool.takers?.indexOf(myAddress);
  if (isNil(takerIndex) || takerIndex! === -1) {
    error(`not in allow list: ${myAddress} to join ${pool.poolId}`);
    return;
  }

  const value = ethers.BigNumber.from(amount);
  const contract = getPoolContract(pool);
  if (!pool) {
    alertInitWallet();
    return;
  }

  const { hash } = await contract!.privFixedPoolJoin(pool.poolId, takerIndex, value, {
    value: value.toString(),
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

export async function closePrivateFixedPool(pool: FixedPool) {
  const contract = getPoolContract(pool);
  const { hash } = await contract!.privFixedPoolClose(pool.poolId);
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

export async function getFixedPoolDetail(pool: FixedPoolDTO): Promise<FixedPool> {
  const res = await addPoolTrackerDetail(pool);
  return {
    ...res,
    takers: (pool.priv && pool.tracker) ? JSON.parse(pool.extra).takers : [],
  };
}
