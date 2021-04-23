import React from "react";
import { ethers } from "ethers";
import { Progress } from "antd";
import { FixedPool } from "src/typings/type";

interface Props {
  pool: FixedPool;
}

export default function PoolProgress(props: Props) {
  const { pool } = props;
  const amount = ethers.FixedNumber.from(pool.amount);
  const left = ethers.FixedNumber.from(pool.leftAmount);
  const p = left.divUnsafe(amount).toString();
  const p100 = ((1 - parseFloat(p)) * 100).toFixed(2);

  return <Progress percent={parseFloat(p100)} size="small" status="active" style={{width: 200}} />;
}
