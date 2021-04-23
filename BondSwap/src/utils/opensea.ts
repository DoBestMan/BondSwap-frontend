import { Network, OpenSeaPort } from "opensea-js";

export const create = (provider: any, network: string) => {
  const seaport = new OpenSeaPort(provider, {
    networkName: network === "rinkeby" ? Network.Rinkeby : Network.Main,
  });

  const getAsset = (tokenAddress: string, tokenId: string) =>
    seaport.api.getAsset({ tokenAddress, tokenId });

  return {
    getAsset,
  };
};
