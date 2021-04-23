import React from 'react';
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { withRouter } from 'react-router-dom'
import { compose } from 'redux';
import { APP_NAME } from 'src/utils/const';

import logo from './images/bound.svg';

import './index.less';

const connector = connect(
  (state: State) => ({
  }),
  {
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface LogoProps extends PropsFromRedux {
  history: any;
  img: string,
  link: string,
}

interface LogoState {
}

class Logo extends React.Component<LogoProps, LogoState> {
  state: LogoState = {
  };
  render() {
    return (
      <div className="m-logo" onClick={() => {
        this.props.history.push('/')
      }}>
        <img className="m-logo__img" src={this.props.img || logo} alt={APP_NAME} />
        <div className="network__text">Ethereum Network</div>
      </div>
    );
  }
}

export default compose(withRouter, connector)(Logo);
