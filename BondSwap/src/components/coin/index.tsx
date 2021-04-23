import React from "react";
import classnames from "classnames";
import { isValidCoinAddress, shortHash } from "src/utils/_";

import "./index.less";

interface Props {
  symbol?: string;
  address?: string;
  short?: boolean;
  inline?: boolean;
  decimals?: number;
  style?: React.CSSProperties;
}

export default function Coin(props: Props) {
  const {
    symbol = "",
    address = "",
    short = false,
    inline = false,
    decimals,
    style,
  } = props;

  if (!isValidCoinAddress(address)) {
    return null;
  }

  return (
    <div
      className={classnames("m-coin", {
        "m-coin--inline": inline,
      })}
      style={style}
    >
      {symbol && <h4 className="m-coin__name">{symbol}</h4>}
      {address && (
        <a
          className="m-coin__link"
          href={`https://etherscan.io/address/${address}`}
          title={address}
          target="_blank"
        >
          {short ? shortHash(address) : address}
        </a>
      )}
      {typeof decimals === "number" ? (
        <p>
          <b>Decimals: </b>
          {decimals}
        </p>
      ) : null}
    </div>
  );
}
