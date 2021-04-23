import { ethers } from 'ethers';
import { FixedPool } from 'src/typings/type';

// 去除末尾的 .0
export function strip(amount: string): string {
  return amount.endsWith('.0') ? amount.slice(0, -2) : amount;
}

// 标准单位转换到最小单位
export function getAtom(amount: string, decimals: number): string {
  return ethers.utils.parseUnits(amount, decimals).toString();
}

export function getStandardUnit(atom: string, decimals: number): string {
  const f = ethers.utils.formatUnits(atom, decimals);
  return strip(f);
}

// console.log('---', getStandardUnit('1000', 0));

export function toWei(eth: string): string {
  return ethers.utils.parseEther(eth).toString();
}

export function toEth(wei: string, fixed?: number): string {
  const et = ethers.utils.formatEther(wei);
  if (typeof fixed === 'number') {
    const pointIdx = et.indexOf('.');
    if (pointIdx > -1) {
      if (fixed) {
        return et.slice(0, pointIdx + fixed + 1);
      }
      return et.slice(0, pointIdx);
    }
  }
  return et;
}

export function toZOM(atom: string): string {
  return getStandardUnit(atom, 18);
}

/**
 * ethRatio 1 ETH => xxx ABC
rate 转换为整数
_uints = 10的这么多次方 ((18 - erc20 decimail)  + rate 转换为整数需要的10倍数)
 */
export function getRateUnit(
  ethRatio: string,
  erc20Decimals: number
): { rate: string; units: string } {
  let units = 18 - erc20Decimals;

  const pointIdex = ethRatio.indexOf('.');
  // ratio 转换为整数需要移动的位数
  const moveToInt = pointIdex > -1 ? ethRatio.length - pointIdex - 1 : 0;
  if (moveToInt > 0) {
    ethRatio = ethRatio.slice(0, pointIdex) + ethRatio.slice(pointIdex + 1);
    units += moveToInt;

    // 删掉后面的整数位的 0
    let i = ethRatio.length - 1;
    while (ethRatio[i] === '0') {
      i--;
      units--;
    }
    ethRatio = ethRatio.slice(0, i + 1);

    if (units < 0) {
      ethRatio += '0'.repeat(-units);
      units = 0;
    }
  } else if (pointIdex > -1) {
    ethRatio = ethRatio.slice(0, pointIdex);
  }

  return {
    rate: ethers.BigNumber.from(ethRatio).toString(),
    units: ethers.BigNumber.from('1' + '0'.repeat(units)).toString(),
  };
}

// 1ETH 能换多少山寨币
export function getRatio(
  rate: string,
  units: string,
  erc20Decimals: number
): string {
  const dev = erc20Decimals - 18;

  let num = ethers.FixedNumber.from(units);
  if (dev > 0) {
    num = num.mulUnsafe(ethers.FixedNumber.from('1' + '0'.repeat(dev)));
  } else if (dev < 0) {
    num = num.divUnsafe(ethers.FixedNumber.from('1' + '0'.repeat(-dev)));
  }

  const ratio = ethers.FixedNumber.from(rate).divUnsafe(num).toString();
  return strip(ratio);
}

// 标准单位
export function getMaxEth(pool: FixedPool): string {
  const amount = getStandardUnit(pool.leftAmount, pool.trackerDecimals!);
  const ratio = getRatio(pool.rate, pool.units, pool.trackerDecimals!);
  const eth = ethers.FixedNumber.from(amount).divUnsafe(ethers.FixedNumber.from(ratio)).toString();

  if (eth.endsWith('.0')) {
    return eth.slice(0, -2);
  }

  // 只保留 2 位小数
  const pointIndex = eth.indexOf('.');
  if (pointIndex > -1) {
    return eth.slice(0, pointIndex + 5);
  }

  return eth;
}

// console.log(getMaxEth({
//   amount: "8574",
//   closed: false,
//   endTime: 1601627662,
//   extra: "",
//   id: 39,
//   isFloat: false,
//   leftAmount: "8564",
//   maker: "0x98EB74F5172a2EF87563D1c71BdC60895A3653c9",
//   name: "SLPToDaMoon",
//   poolId: 43,
//   priv: false,
//   rate: "100",
//   tracker: "0x37236CD05b34Cc79d3715AF2383E96dd7443dCF1",
//   txHash: "0xd1a0eb667f0b0c3a82409efc8e68e7d9e11d0b5728eefd00dc82751a1c35edc6",
//   units: "1000000000000000000",
// }));
