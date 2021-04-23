import { createStore, AnyAction } from 'redux';
import { PAGE_SIZE } from 'src/utils/const';
import { getPublicPoolList } from 'src/api/pool';
import { getEthPrice } from 'src/api/coin';
import { error, log } from 'src/utils/_';
import {
  CHANGE_ADDRESS,
  createAddressAction,
  createChainIdAction,
  SET_PUBLIC_POOLS,
  SET_PRIVATE_POOLS,
  SET_SELECTED_CARD,
  SET_MIME_POOLS,
  createPubPoolAction,
  SET_REWARD,
  createSetRewardAction,
  SET_SEARCH,
  SET_ETH_RPICE,
  createSetEthAction,
  SET_BALANCE,
  createSetBalanceAction,
  SET_LIST_LOADING,
  SET_LIST_LOADED,
  createLoadingAction,
  createLoadedAction,
  SET_MIME_JOIN,
  CLOSE_POOL,
  WITHDRAW_JOIN,
  STAKE_REWARD,
  createStakeReward,
  OFFICIAL_ADDRESS,
  createOfficialAddress,
  SET_NAV,
  SET_POOL_UPDATE,
  CHANGE_CHAINID
} from './actions';
import state, { State } from './state';
import { getOfficialAddress } from '../api/official';

function reducer(prevState = state, action: AnyAction): State {
  const { type, payload } = action;
  switch (type) {
    case CHANGE_CHAINID:
      return {
        ...prevState,
        chainID: payload,
      };
    case CHANGE_ADDRESS:
      log('change_address', payload);
      return {
        ...prevState,
        address: payload,
      };
    case SET_PUBLIC_POOLS:
      return {
        ...prevState,
        publicPoolsTotal: payload.total,
        publicPools: payload.data,
      };
    case SET_PRIVATE_POOLS:
      return {
        ...prevState,
        privatePoolsTotal: payload.total,
        privatePools: payload.data,
      };
    case SET_SELECTED_CARD:
      return {
        ...prevState,
        selectedCard: payload
      }
    case SET_MIME_POOLS:
      return {
        ...prevState,
        mimePoolsTotal: payload.total,
        mimePools: payload.data,
      };
    case SET_MIME_JOIN:
      return {
        ...prevState,
        mimeJoinTotal: payload.total,
        mimeJoinPools: payload.data,
      };
    // case SET_COIN_INFO:
    //   return {
    //     ...prevState,
    //     coinsInfo: {
    //       ...prevState.coinsInfo,
    //       [payload.address]: payload,
    //     },
    //   };
    case SET_REWARD:
      return {
        ...prevState,
        myReward: payload,
      };
    case SET_NAV:
      return {
        ...prevState,
        nav: payload
      }
    case SET_SEARCH:
      return {
        ...prevState,
        filterPools: payload.data,
        filterTotal: payload.total,
        filterType:  payload.type,
        filterValue: payload.value
      };
    case SET_POOL_UPDATE:
      return {
        ...prevState,
        poolupdate: payload
      }
    case SET_ETH_RPICE:
      return {
        ...prevState,
        ethPrice: payload,
      };
    case SET_BALANCE:
      return {
        ...prevState,
        balance: payload,
      };
    case SET_LIST_LOADING:
      return {
        ...prevState,
        loading: true,
      };
    case SET_LIST_LOADED:
      return {
        ...prevState,
        loading: false,
      };
    case CLOSE_POOL:
      const { id, isFloat } = payload;
      const idx = prevState.mimePools.findIndex(pool => pool.isFloat === isFloat && pool.poolId === id);
      if (idx > -1) {
        const mimePools = prevState.mimePools.slice();
        const pool = prevState.mimePools[idx];
        mimePools[idx] = isFloat ? {
          ...pool,
        } : {
          ...pool,
          closed: true,
        };
        return {
          ...prevState,
          mimePools,
        };
      }
      return prevState;
    case WITHDRAW_JOIN:
      const id2 = payload;
      const idx2 = prevState.mimeJoinPools.findIndex(pool => pool.isFloat && pool.poolId === id2);
      if (idx2 > -1) {
        const mimeJoinPools = prevState.mimeJoinPools.slice();
        const pool3 = prevState.mimeJoinPools[idx2];
        mimeJoinPools[idx2] = {
          ...pool3,
          closed: true,
        };
        return {
          ...prevState,
          mimeJoinPools,
        };
      }
      return prevState;
    case STAKE_REWARD:
      return {
        ...prevState,
        myStakingReward: payload,
      };
    case OFFICIAL_ADDRESS:
      return {
        ...prevState,
        officialAddress: payload.reduce((m: Record<string, boolean>, ad: string) => { m[ad] = true; return m; }, {}),
      };
    default:
      return prevState;
  }
}

const store = createStore(reducer);

export const changeAddress = (address: string) => {
  store.dispatch(createAddressAction(address));
};

export const setReward = (reward: string) => {
  store.dispatch(createSetRewardAction(reward));
};

export const setStakeReward = (reward: string) => {
  store.dispatch(createStakeReward(reward));
};

export const changeChainID = (chainId: number) => {
  store.dispatch(createChainIdAction(chainId));
}

export const setBalance = (balance: string) => {
  store.dispatch(createSetBalanceAction(balance));
};

export function getAddress(): string {
  return store.getState().address;
}

(async function loop() {
  try {
    const ethPrice = await getEthPrice();
    store.dispatch(createSetEthAction(ethPrice));

  } catch (e) {
    error(e);
  }

  try {
    const ads = await getOfficialAddress();
    store.dispatch(createOfficialAddress(ads));
  } catch (e) {
    error(e);
  }

  setTimeout(loop, 60 * 1000);
})();
/*
(async function loop() {
  const address = store.getState().address;
  if (address) {
    // mining reward
    try {
      let reward = await getReward(address);
      log(`mining reward`, reward.toString());
      if (reward) {
        reward = toEth(reward, 4);
      } else {
        reward = "0.0";
      }

      setReward(reward);
    } catch (e) {
      error(e);
    }

    // stake reward
    try {
      let reward = await getStakeReward(address);
      log(`stake reward`, reward.toString());
      if (reward) {
        reward = toEth(reward, 4);
      } else {
        reward = "0.0";
      }

      setStakeReward(reward);
    } catch (e) {
      error(e);
    }
  }

  setTimeout(loop, 5 * 1000);
})();
*/
function getPubPools() {
  store.dispatch(createLoadingAction());
  getPublicPoolList(0, PAGE_SIZE)
    .then(res => {
      store.dispatch(createPubPoolAction(res));
    })
    .finally(() => {
      store.dispatch(createLoadedAction());
    });
}

setTimeout(getPubPools, 0);

export default store;
