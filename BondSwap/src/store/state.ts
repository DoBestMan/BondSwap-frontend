import { Pool } from 'src/typings/type';

export interface State {
  address: string;
  // pool
  publicPoolsTotal: number;
  privatePoolsTotal: number;
  mimePoolsTotal: number;
  publicPools: Pool[];
  privatePools: Pool[];
  mimePools: Pool[];
  mimeJoinPools: Pool[];
  mimeJoinTotal: number;
  myReward: string;
  /**
   * key is erc20 constract address
   */
  searchPoolsTotal: number;
  searchPools: Pool[];
  ethPrice: string;
  balance: string;
  loading: boolean;
  myStakingReward: string;
  officialAddress: Record<string, boolean>;

  filterPools: Pool[];
  filterTotal: number;
  filterType: number;
  filterValue: string;
  nav: boolean;

  poolupdate: boolean;

  chainID: number;

  selectedCard: any;
}

const state: State = {
  address: '',
  publicPoolsTotal: 0,
  privatePoolsTotal: 0,
  mimePoolsTotal: 0,
  publicPools: [],
  privatePools: [],
  mimePools: [],
  mimeJoinPools: [],
  mimeJoinTotal: 0,
  myReward: '0',
  searchPoolsTotal: 0,
  searchPools: [],
  ethPrice: '',
  balance: '',
  loading: false,
  myStakingReward: '0',
  officialAddress: {},
  filterPools: [],
  filterTotal: -1,
  filterType: -1,
  filterValue: "",
  nav: false,
  poolupdate: false,
  chainID: -1,
  selectedCard: {
    id: -1,
    info: null,
    count: 0
  },
};

export default state;
