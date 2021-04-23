import { ethers } from 'ethers';
import { message } from 'antd';
import { IS_ETH, ETH_NETWORK, INFURA_ID, CHAIN_ID } from 'src/utils/const';
import WalletConnectProvider from "@walletconnect/web3-provider";
import { changeAddress, changeChainID } from 'src/store';
import { alertInstallMM } from 'src/utils/modal';
import { log, warn, reload } from 'src/utils/_';

let signer: ethers.providers.JsonRpcSigner | null = null;

export function getSigner(): ethers.providers.JsonRpcSigner | null {
  return signer;
}

type WalletInitCallback = (signer: ethers.providers.JsonRpcSigner) => void;

let callbacks: WalletInitCallback[] = [];

export function connectCallback(callback: WalletInitCallback) {
  callbacks.push(callback);
}

let provider: any | null = null;

export function getProvider() {
  return provider;
}

window.addEventListener('beforeunload', () => {
  if (provider) {
    provider.disconnect();
  }
}, false);

type Wallet = 'MM' | 'WC';

let inited = false;

export async function logoutWallet() {
  changeAddress("");
  signer = null;
  provider = null;
  inited = false; 
  changeChainID(-1);
}

export async function connectWallet(wt: Wallet): Promise<boolean> {
  if (inited) {
    return true;
  }

  switch (wt) {
    case 'MM':
      if (!IS_ETH) {
        alertInstallMM();
        return false;
      }

      provider = window.ethereum;
      signer = new ethers.providers.Web3Provider(provider).getSigner();
      const network = await new ethers.providers.Web3Provider(provider).getNetwork();
      changeChainID(network.chainId);
      window.ethereum.on('accountsChanged', () => {
        const ads = window.ethereum.selectedAddress;
        changeAddress(ads);
        log(`change address [mm]: ${ads}`);
      });

      const ads = await window.ethereum.request<string[]>({
        method: 'eth_requestAccounts',
      });

      changeAddress(ads[0]);
      inited = true;
      window.ethereum.on("chainChanged", (chainId: number) => {
        warn(`ws change chainId ${chainId}`);
        changeChainID(parseInt(chainId + ''));
      });
      break;
    case 'WC':
      log(`wc connect chainId ${CHAIN_ID}`);

      provider = new WalletConnectProvider({
        infuraId: INFURA_ID,
        chainId: CHAIN_ID,
      });

      provider.request({ method: 'eth_chainId' }).then((chainId: number) => {
        log(`wc chainId: ${chainId}`);
        changeChainID(parseInt(chainId + ''));
      });

      provider.on("accountsChanged", (accounts: string[]) => {
        changeAddress(accounts[0]);
        log(`change address [wc]: ${accounts[0]}`);
      });

      provider.on("disconnect", (code: number, reason: string) => {
        warn(`wc disconnect: ${code} ${reason}`);
        inited = false;
        message.info(`WalletConnect disconnected`).then(reload, reload);
      });

      provider.on("chainChanged", (chainId: number) => {
        warn(`ws change chainId ${chainId}`);
        changeChainID(parseInt(chainId + ''));
      });

      await provider.enable();

      signer = new ethers.providers.Web3Provider(
        provider,
        ETH_NETWORK
      ).getSigner();

      inited = true;
  }

  callbacks.forEach(cb => cb(signer!));

  return true;
}
