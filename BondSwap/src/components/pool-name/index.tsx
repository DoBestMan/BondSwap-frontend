import React from "react";
import classnames from "classnames";
import type { Pool } from "src/typings/type";

import "./index.less";

export interface Props {
  pool: Pool;
  compact: boolean;
  style?: React.CSSProperties;
}

export default function PoolName(props: Props) {
  return (
    <div
      className={classnames("m-pool-name", {
        "m-pool-name--compact": props.compact,
        "m-pool-name--official": props.pool.official,
      })}
      title={props.pool.name}
      style={props.style}
    >
      <p className="name" style={{margin: "auto 0", textAlign: 'left'}}>{props.pool.name}</p>
      {
        props.pool.official && <p className="exclusive" style={{
          fontSize: '0.8em',
        }}>Exclusive Sale!</p>
      }
    </div>
  );
}
