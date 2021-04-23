import type {
  PoolDTO,
  PoolDTOs,
  Pool,
  Pools,
  JoinDTO,
} from 'src/typings/type';
import { getFixedPoolDetail } from 'src/contracts/fixed-pool';
import { getFloatPoolDetail } from 'src/contracts/float-pool';
import { log, sleep } from 'src/utils/_';
import { getPrefix } from './base';

export const POOL_PREFIX = '/pool';

const get = getPrefix(POOL_PREFIX);

async function addPoolDetail(pool: PoolDTO): Promise<Pool> {
  const pool2 = pool.isFloat ? await getFloatPoolDetail(pool) : await getFixedPoolDetail(pool);
  return pool2 as Pool;
}

async function addPoolDetails(res: PoolDTOs): Promise<Pools> {
  const { total, data } = res;

  const pools = data.map(async (pool: PoolDTO) => addPoolDetail(pool));

  return {
    total,
    data: await Promise.all(pools),
  };
}

export async function getPublicPoolList(
  offset = 0,
  limit = 20
): Promise<Pools> {
  const res = await get<PoolDTOs>(
    `/public-pools?offset=${offset}&limit=${limit}`
  );
  return addPoolDetails(res);
}

export async function getPrivatePoolList(
  offset = 0,
  limit = 20
): Promise<Pools> {
  const res = await get<PoolDTOs>(
    `/private-pools?offset=${offset}&limit=${limit}`
  );

  return addPoolDetails(res);
}

export async function getMimePoolList(
  address: string,
  offset = 0,
  limit = 20
): Promise<Pools> {
  const res = await get<PoolDTOs>(
    `/mime-pools?address=${address}&offset=${offset}&limit=${limit}`
  );

  return addPoolDetails(res);
}

export async function getMimeJoinPoolList(
  address: string,
  offset = 0,
  limit = 20
): Promise<Pools> {
  return get<Pools>(
    `/join-pools/${address}?offset=${offset}&limit=${limit}`
  );
}

const getPoolByIdCache: Record<string, Promise<PoolDTO>> = {};
export async function getPoolById(id: string): Promise<Pool> {
  if (!getPoolByIdCache[id]) {
    getPoolByIdCache[id] = get<PoolDTO>(`/pool/${id}`);
  }
  const pool = await getPoolByIdCache[id];
  return addPoolDetail(pool);
}

export async function getPoolByTx(txHash: string): Promise<Pool | null> {
  const res = await get<PoolDTO>(`/pool-tx/${txHash}`);
  if (res && res.tracker) {
    return addPoolDetail(res);
  }
  return null;
}

export async function getJoinByTx(txHash: string): Promise<JoinDTO | null> {
  const res = await get<JoinDTO>(`/join-tx/${txHash}`);
  log(`get join by tx: ${txHash}`);
  return res;
}

export async function getPoolsByTracker(erc20: string): Promise<Pools> {
  const res = await get<PoolDTOs>(`/pools-tracker/${erc20}`);
  return addPoolDetails(res);
}

export async function getPoolsBySymbol(symbol: string): Promise<Pools> {
  const res = await get<PoolDTOs>(`/pools-tracker-symbol/${symbol}`);
  return addPoolDetails(res);
}

export async function waitJoin(hash: string) {
  while (true) {
    const join = await getJoinByTx(hash);
    if (join && join.txHash) {
      return join;
    }
    log(`failed to get join by hash: ${hash}`);
    await sleep(20);
  }
}
