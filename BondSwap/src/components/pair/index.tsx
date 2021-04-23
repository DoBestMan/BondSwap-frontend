import React from "react";
import classnames from "classnames";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import type { Pool } from "src/typings/type";
import { getRatio } from "src/utils/currency";
import { isNil } from "src/utils/_";

import "./index.less";

const connector = connect((state: State) => state);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface Props extends PropsFromRedux {
  pool: Pool;
  showPrice?: boolean;
  showPair?: boolean;
  compact?: boolean;
  style?: React.CSSProperties;
}

function Pair(props: Props) {
  const {
    pool,
    ethPrice,
    showPrice,
    showPair = true,
    compact = false,
    style,
  } = props;
  if (isNil(pool.trackerDecimals)) {
    return null;
  }

  const ratio = getRatio(pool.rate, pool.units, pool.trackerDecimals!);

  const price = ethPrice ? parseFloat(ethPrice) / parseFloat(ratio) : 0;
  const priceStr = price < 0.0001 ? `< $0.0001` : `$${price.toFixed(4)}`;
  const pairTitle = `1 ETH = ${ratio} ${pool.trackerSymbol}`;

  return (
    <span
      className={classnames("m-pair", {
        "m-pair--compact": compact,
        "m-pair--spr": showPair,
        "m-pair--spc": showPrice,
      })}
      style={style}
    >
      {showPair ? (
        <i className="m-pair__ex" title={pairTitle}>
          1
          <i className="m-pair__div" />
          ETH
          <i className="m-pair__div" />
          =
          <i className="m-pair__div" />
          {ratio}
          <i className="m-pair__div" />
          {pool.trackerSymbol}
        </i>
      ) : null}
      {ethPrice && showPrice ? (
        <b className="m-pair__price" title={priceStr}>
          {priceStr}
        </b>
      ) : null}
    </span>
  );
}

export default connector(Pair);
