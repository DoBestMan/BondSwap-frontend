import { CONTRACT_BONDLY_LP_STAKE, BONDLY_LP, BONDLY_LP_STAKE_PID } from 'src/utils/const';
import { ethers } from 'ethers';
import { isTransactionMined, wait } from 'src/utils/_';
import abi from './mining-abi.json';
import { requestErc20Approve } from './erc20';
import { connectCallback } from './base';
import { alertInitWallet } from 'src/utils/modal';

let contract: ethers.Contract | null = null;
connectCallback(signer => {
  contract = new ethers.Contract(CONTRACT_BONDLY_LP_STAKE, abi, signer);
});

/**
 *
 * @param amount 最小单位
 */

export async function approvStake(amount: string) {
  const approved = await requestErc20Approve(BONDLY_LP, CONTRACT_BONDLY_LP_STAKE, amount);
  if (!approved) {
    return false;
  }
  return true;
}

export async function stake(myAddress: string, amount: string): Promise<void> {
  if (!amount) {
    return;
  }

  if (!contract) {
    alertInitWallet();
    return;
  }

  const { hash } = await contract!.deposit(BONDLY_LP_STAKE_PID, amount);

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
  if (!contract) {
    alertInitWallet();
    return '';
  }

  const st = await contract.userInfo(BONDLY_LP_STAKE_PID, address);

  if (st) {
    return st.amount.toString();
  }

  return '';
}

export async function unstake(address: string): Promise<void> {
  if (!contract) {
    alertInitWallet();
    return;
  }

  const amount = await getMimeStake(address);

  if (amount) {
    const { hash } = await contract.withdraw(BONDLY_LP_STAKE_PID, amount);
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
  if (!contract) {
    alertInitWallet();
    return '';
  }

  const reward = await contract.pendingReward(BONDLY_LP_STAKE_PID, address);
  return reward.toString();
}

export async function withdrawReward(myAddress: string): Promise<void> {
  if (!contract) {
    alertInitWallet();
    return;
  }

  const reward1 = await getReward(myAddress);
  const _reward1 = reward1 ? parseFloat(reward1) : 0;

  if (_reward1) {
    await stake(myAddress, '0');
  }
}
