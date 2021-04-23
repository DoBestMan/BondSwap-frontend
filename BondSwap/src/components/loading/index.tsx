import React from 'react';
import ReactDOM from 'react-dom';
import { Spin } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';

import './index.less';

interface Props {
  text: string;
}

function Loading(props: Props) {
  return (
    <div className="m-loading">
      <div className="m-loading__body">
        <Spin
          indicator={
            <LoadingOutlined style={{ fontSize: 100, color: '#fff' }} spin />
          }
        />
        <p className="m-loading__text">{props.text}</p>
      </div>
    </div>
  );
}

const div = document.createElement('div');
document.body.appendChild(div);

export function loading(props: Props) {
  ReactDOM.render(<Loading {...props} />, div);
}

export function hideLoading() {
  ReactDOM.unmountComponentAtNode(div);
}
