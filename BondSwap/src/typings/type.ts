export type PoolStatus = 'Live' | 'Filled' | 'Closed' | 'All';

// public 表示 public fixed pool and float pool
// fixed 表示 public fixed pool
export type PublicPoolType = 'public' | 'fixed' | 'float';

// private 表示 private fixed pool
export type PoolType = PublicPoolType | 'private';

export interface CorePoolDTO {
  id: number;
  poolId: number;
  name: string;
  maker: string;
  priv: boolean;
  isFloat: boolean;
  status: PoolStatus;
  tracker: string;
  closed: boolean;
  endTime: number;
  txHash: string;
  blockHash: string;
  trackerSymbol: string;
  trackerDecimals: number;
  contract: string;
  official?: boolean;
}

export interface FixedPoolDTO extends CorePoolDTO {
  amount: string;
  rate: string;
  units: string;
  // trackers
  extra: string;
  leftAmount: string;
}

interface Collection<T> {
  total: number;
  data: T[];
}

export type FixedPoolsDTO = Collection<FixedPoolDTO>;

export interface FixedPool extends Omit<FixedPoolDTO, 'extra'> {
  takers?: string[];
}

export type FixedPools = Collection<FixedPool>;

export interface Coin {
  symbol: string;
  address: string;
  decimals: number;
}

export interface FloatPoolDTO extends CorePoolDTO {
  // eth 总额
  takerAmount: string;
  // pool 的作者可以取的 eth 总额
  makerAmount: string;
}

export interface FloatPool extends FloatPoolDTO {
  canWithDrawJoin?: boolean;
}

export type FloatPoolDTOs = Collection<FloatPoolDTO>;
export type FloatPools = Collection<FloatPool>;

export type PoolDTO = FloatPoolDTO & FixedPoolDTO;
export type PoolDTOs = Collection<PoolDTO>;

export type Pool = FixedPool & FloatPool & { marketPrice?: string };
export type Pools = Collection<Pool>;

export interface JoinDTO {
  id: number;
  poolId: number;
  taker: string;
  priv?: boolean;
  ethAmount: string;
  tracker: string;
  txHash: string;
  blockHash: string;
  isFloat: boolean;
}

// export type JoinDTOs = Collection<JoinDTO>;
