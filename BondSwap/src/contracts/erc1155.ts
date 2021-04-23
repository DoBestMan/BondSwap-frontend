import { ethers } from 'ethers';
import abi from './erc1155.abi.json';
import { getSigner } from './base';
import { alertInitWallet } from 'src/utils/modal';

export async function getBalance(contractAddr: string, userAddr: string, id: number) {
    const signer = getSigner();
    if (!signer) {
      alertInitWallet();
      return;
    }
  
    const erc1155  = new ethers.Contract(contractAddr, abi, signer);
    const balance = await erc1155.balanceOf(userAddr, id);
    return balance.toString(); 
}