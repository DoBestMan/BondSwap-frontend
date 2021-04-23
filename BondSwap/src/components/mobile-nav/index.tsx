import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import logo from './images/bound.svg';
import { setNav } from "src/store/actions";

import "./index.less";

const connector = connect(
  (state: State) => (state),
  {
    setNav: (show: boolean) => setNav(show),
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface MobileNavProps extends PropsFromRedux {
}

interface MobileNavState {
}

class MobileNav extends React.Component<MobileNavProps, MobileNavState> {
  state: MobileNavState = {
  };
  render() {
    return (
      <div className="mobile__nav">
          <i className="fa fa-bars" onClick={() => this.props.setNav(true)}/>
          <img src={logo} alt=""/>
      </div>
    );
  }
}

export default connector(MobileNav);
