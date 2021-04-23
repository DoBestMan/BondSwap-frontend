import React, { createRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import Logo from 'src/components/pc-logo';
import NavTools from 'src/components/pc-nav-tools';
import { setNav } from "src/store/actions";

import './index.less';


const connector = connect(
  (state: State) => (state),
  {
    setNav: (show: boolean) => setNav(show),
  }
);
interface Props {}

type PropsFromRedux = ConnectedProps<typeof connector>;

interface NavProps extends PropsFromRedux {
}

interface NavState {
  isMobile: boolean;
}

class Nav extends React.Component<NavProps, NavState> {
  state: NavState = {
    isMobile: window.innerWidth < 1000
  };
  navRef = createRef<HTMLDivElement>();
  componentDidMount() {
    window.addEventListener('resize', this.setMobile);
    document.addEventListener("mousedown", this.hideNav);
  }
  setMobile = () => {
    if (window.innerWidth < 1000) {
      if (!this.state.isMobile) this.setState({isMobile: true});
    } else {
      if (this.state.isMobile) this.setState({isMobile: false});
    }
  }
  hideNav = (event: any) => {
    if (this.navRef && !this.navRef.current?.contains(event.target)) {
      this.props.setNav(false);      
    }
  }
  render() {
    const { nav } = this.props;
    if (this.state.isMobile && !nav) return (null);
    return (
      <div className="m-nav" ref={this.navRef}>
        <div className="m-nav__container">
          <Logo />
          <NavTools />
          <div className="social">
            <a className="social__link" href="https://twitter.com/bondlyfinance" target="_blank">
              <i className="fa fa-twitter"/>
            </a>
            <a className="social__link" href="https://t.me/bondlyfinance" target="_blank">
              <i className="fa fa-telegram"/>
            </a>
          </div>
        </div>
      </div>
    );
  }
}
export default connector(Nav);