import { CONTRACT_STAKE, CONTRACT_STAKE_REWARD, BONDLY_ADDRESS } from 'src/utils/const';
import { ethers } from 'ethers';
import { isTransactionMined } from 'src/utils/_';
import stakeAbi from './stake-abi.json';
import stakeRewardAbi from './stake-reward-abi.json';
import { requestErc20Approve } from './erc20';
import { connectCallback } from './base';
import { alertInitWallet } from 'src/utils/modal';

let stakeContract: ethers.Contract | null = null;
let rewardContract: ethers.Contract | null = null;

connectCallback(signer => {
  stakeContract = new ethers.Contract(CONTRACT_STAKE, stakeAbi, signer);
  rewardContract = new ethers.Contract(CONTRACT_STAKE_REWARD, stakeRewardAbi, signer);
});

/**
 *
 * @param amount 最小单位
 */
export async function approvStake(amount: string) {
  const approved = await requestErc20Approve(BONDLY_ADDRESS, CONTRACT_STAKE, amount);
  if (!approved) {
    return false;
  }
  return true;
}

export async function stake(myAddress: string, amount: string): Promise<void> {
  if (!amount) {
    return;
  }

  if (!stakeContract) {
    alertInitWallet();
    return;
  }

  const { hash } = await stakeContract!.staking(amount);
  try {
    while(true) {
      let mined = await isTransactionMined(hash);
      if (mined) break;
    }
  } catch (e) {
    console.error(e);
  }
}

export async function getMimeStake(address: string): Promise<string> {
  if (!stakeContract) {
    alertInitWallet();
    return '';
  }

  const st = await stakeContract.userInfo(address);

  if (st) {
    return st.amount.toString();
  }

  return '';
}

export async function unstake(address: string, amount: string): Promise<void> {
  if (!stakeContract) {
    alertInitWallet();
    return;
  }

  if (amount) {
    const { hash} = await stakeContract.unStaking(amount);
    try {
      while(true) {
        let mined = await isTransactionMined(hash);
        if (mined) break;
      }
    } catch (e) {
      console.error(e);
    }
  }
}

export async function unstakeAll(address: string): Promise<void> {
  const amount = await getMimeStake(address);

  if (amount) {
    const { hash } = await stakeContract!.unStaking(amount);
    try {
      while(true) {
        let mined = await isTransactionMined(hash);
        if (mined) break;
      }
    } catch (e) {
      console.error(e);
    }
  }
}

export async function getReward(address: string): Promise<string> {
  if (!stakeContract) {
    alertInitWallet();
    return '';
  }

  return await stakeContract.pendingReward(address);
}

export async function withdrawReward(myAddress: string): Promise<void> {
  if (!stakeContract) {
    alertInitWallet();
    return;
  }
  const reward1 = await getReward(myAddress);
  const _reward1 = reward1 ? parseFloat(reward1) : 0;

  if (_reward1) {
    const { hash } = await stakeContract.withdrawReward();
    try {
      while(true) {
        let mined = await isTransactionMined(hash);
        if (mined) break;
      }
    } catch (e) {
      console.error(e);
    }
  }
}

export async function withdrawStaking(address: string) {
  if (!rewardContract) {
    alertInitWallet();
    return;
  }
  const { hash } = await rewardContract.withdrawStaking();
  try {
    while(true) {
      let mined = await isTransactionMined(hash);
      if (mined) break;
    }
  } catch (e) {
    console.error(e);
  }
}

export async function pendingUnsakingAmount(myAddress: string): Promise<string> {
  if (!rewardContract) {
    alertInitWallet();
    return '0';
  }

  const st = await rewardContract.userInfo(myAddress);
  if (st) {
    const s = st.pendingStaking.toString();
    const t = parseInt(st.stakingReleaseTime.toString(), 10) || 0;
    const now = Math.floor(Date.now() / 1000);
    if (now > t) {
      return s;
    }
  }

  return '0';
}
