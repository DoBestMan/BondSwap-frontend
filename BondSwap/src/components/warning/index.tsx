import React from 'react';
import icon from './images/WARNING.png';

import './index.less';

interface Props {
  text: string;
}

export default function Warning(props: Props) {
  return (
    <div className="m-warning">
      <div>
        <img className="m-warning__icon" src={icon} />
        <span>{props.text}</span>
      </div>
    </div>
  );
}
