export const IS_SSR = typeof window === 'undefined';
export const IS_DEV = process.env.NODE_ENV === 'development';
export const IS_ETH = typeof window.ethereum !== 'undefined';
export const APP_NAME = 'Bondly Protocol';
export const PAGE_SIZE = 20;
export const INFURA_ID = 'c189dface8954ef5a1b5a44cec1e4add';
// fixed pool 合约
export const CONTRACT_FIXED_POOL = IS_DEV ? '0xaA55498fe78FecD16ecA8e88f608eedF578a3b6A' : '0x4a0751e203C0B9780025344699d8A8e107612E3f';
export const CONTRACT_FLOAT_POOL = IS_DEV ? '0xd04B4Fde7Ea3aeFdA32a0dAEE4cdAa8ECE11d1Ed' : '0xFb6532445D1931802743aD6FBbbc66c7FB839916';
export const CONTRACT_FIXED_POOL_V2 = IS_DEV ? '0xaA55498fe78FecD16ecA8e88f608eedF578a3b6A' : '0x4a0751e203C0B9780025344699d8A8e107612E3f';
export const CONTRACT_FLOAT_POOL_V2 = IS_DEV ? '0xd04B4Fde7Ea3aeFdA32a0dAEE4cdAa8ECE11d1Ed' : '0xFb6532445D1931802743aD6FBbbc66c7FB839916';
export const BONDLY_ADDRESS = IS_DEV ? '0x86cbBEDCa621Ae78a421A40365081cAafDA24296' : '0xd2dda223b2617cb616c1580db421e4cfae6a8a85';
export const ETH_NETWORK = IS_DEV ? 'rinkeby' : 'mainnet';
export const CHAIN_ID = IS_DEV ? 4 : 1;

// NFT
export const NFT_CARDS = IS_DEV ?
    [
        {
            name: 'BCCG',
            address: '0xC70E9D1d282C02217c944f0230d6eD2D6408Bdbc',
            tokenIDs: [1, 2, 3, 4, 5, 6, 7],
            amount: 7,
            image: 'bccg.jpg'
        }
    ]:
    [

    ];