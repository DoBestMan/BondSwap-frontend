import type { Pools } from 'src/typings/type';

export const CHANGE_ADDRESS = 'CHANGE_ADDRESS';

export function createAddressAction(address: string) {
  return {
    type: CHANGE_ADDRESS,
    payload: address,
  };
}

export const CHANGE_CHAINID = 'CHANGE_CHAINID';
export function createChainIdAction(chainId: number) {
  return {
    type: CHANGE_CHAINID,
    payload: chainId,
  };
}

// export const CHANGE_STINFO = 'CHANGE_STINFO';

// export function createSTAction(st: StatisInfo) {
//   return {
//     type: CHANGE_STINFO,
//     payload: st,
//   };
// }

// public
export const SET_PUBLIC_POOLS = 'SET_PUBLIC_POOLS';

export function createPubPoolAction(res: Pools) {
  return {
    type: SET_PUBLIC_POOLS,
    payload: res,
  };
}

// export const SET_PUBLIC_LOADING = 'SET_PUBLIC_LOADING';

// export function createPublicLoading() {
//   return {
//     type: SET_PUBLIC_LOADING,
//   };
// }

// export const SET_PUBLIC_LOADED = 'SET_PUBLIC_LOADED';

// export function createPublicLoaded() {
//   return {
//     type: SET_PUBLIC_LOADED,
//   };
// }

// private

export const SET_PRIVATE_POOLS = 'SET_PRIVATE_POOLS';

export function createPrivPoolAction(res: Pools) {
  return {
    type: SET_PRIVATE_POOLS,
    payload: res,
  };
}

export const SET_SELECTED_CARD = 'SET_SELECTED_CARD';

export function setNFTCard(payload: any) {
  return {
    type: SET_SELECTED_CARD,
    payload,
  };
}
// export const SET_PRIVATE_LOADING = 'SET_PRIVATE_LOADING';

// export function createPrivateLoading() {
//   return {
//     type: SET_PRIVATE_LOADING,
//   };
// }

// export const SET_PRIVATE_LOADED = 'SET_PRIVATE_LOADED';

// export function createPrivateLoaded() {
//   return {
//     type: SET_PRIVATE_LOADED,
//   };
// }

// mime
export const SET_MIME_POOLS = 'SET_MIME_POOLS';

export function createMimePoolAction(res: Pools) {
  return {
    type: SET_MIME_POOLS,
    payload: res,
  };
}

// export const SET_MIME_LOADING = 'SET_MIME_LOADING';

// export function createMimeLoading() {
//   return {
//     type: SET_MIME_LOADING,
//   };
// }

// export const SET_MIME_LOADED = 'SET_MIME_LOADED';

// export function createMimeLoaded() {
//   return {
//     type: SET_MIME_LOADED,
//   };
// }

// coin info

// export const SET_COIN_INFO = 'SET_COIN_INFO';

// export function createSetCoinInfoAction(coin: Coin) {
//   return {
//     type: SET_COIN_INFO,
//     payload: coin,
//   };
// }

// reward
export const SET_REWARD = 'SET_REWARD';

export function createSetRewardAction(reward: string) {
  return {
    type: SET_REWARD,
    payload: reward,
  };
}

// search
export const SET_SEARCH = 'SET_SEARCH';

export function createSearchResult(res: any) {
  return {
    type: SET_SEARCH,
    payload: res,
  };
}

// show nav
export const SET_NAV = 'SET_NAV';

export function setNav(show: boolean) {
  return {
    type: SET_NAV,
    payload: show,
  };
}

// pool refresh
export const SET_POOL_UPDATE = 'SET_POOL_UPDATE';

export function setPoolUpdate(update: boolean) {
  return {
    type: SET_POOL_UPDATE,
    payload: update,
  };
}

// eth price
export const SET_ETH_RPICE = 'SET_ETH_RPICE';

export function createSetEthAction(price: string) {
  return {
    type: SET_ETH_RPICE,
    payload: price,
  };
}


// balance
export const SET_BALANCE = 'SET_BALANCE';

export function createSetBalanceAction(balance: string) {
  return {
    type: SET_BALANCE,
    payload: balance,
  };
}


// loading
export const SET_LIST_LOADING = 'SET_LIST_LOADING';

export function createLoadingAction() {
  return {
    type: SET_LIST_LOADING,
  };
}

export const SET_LIST_LOADED = 'SET_LIST_LOADED';

export function createLoadedAction() {
  return {
    type: SET_LIST_LOADED,
  };
}

// float
// export const SET_FLOAT_POOLS = 'SET_FLOAT_POOLS';

// export function createFloatPoolsAction(res: FloatPools) {
//   return {
//     type: SET_FLOAT_POOLS,
//     payload: res,
//   };
// }

// mime float
// export const SET_MIME_FLOAT_POOLS = 'SET_MIME_FLOAT_POOLS';

// export function createMimeFloatPoolsAction(res: FloatPools) {
//   return {
//     type: SET_MIME_FLOAT_POOLS,
//     payload: res,
//   };
// }

// mime join
export const SET_MIME_JOIN = 'SET_MIME_JOIN';

export function createMyJoinResult(res: Pools) {
  return {
    type: SET_MIME_JOIN,
    payload: res,
  };
}

// close a pool
export const CLOSE_POOL = 'CLOSE_POOL';
export function createCloseAction(id: number, isFloat: boolean) {
  return {
    type: CLOSE_POOL,
    payload: {
      id,
      isFloat,
    },
  }
}

// withdraw a join
export const WITHDRAW_JOIN = 'WITHDRAW_JOIN';
export function createWithdrawJoinAction(id: number) {
  return {
    type: WITHDRAW_JOIN,
    payload: id,
  }
}

// staking reward
export const STAKE_REWARD = 'STAKE_REWARD';
export function createStakeReward(reward: string) {
  return {
    type: STAKE_REWARD,
    payload: reward,
  };
}

// official address
export const OFFICIAL_ADDRESS = 'OFFICIAL_ADDRESS';
export function createOfficialAddress(ads: string[]) {
  return {
    type: OFFICIAL_ADDRESS,
    payload: ads,
  };
}
