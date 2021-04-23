import React, {createRef} from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { shortHash } from "src/utils/_";
import { withRouter } from 'react-router-dom';
import { compose } from 'redux';
import { getCoinInfoByAddress } from "src/contracts/erc20";
import { alertInitWallet } from "src/utils/modal";
import { logoutWallet } from "src/contracts/base";

import Img_Swap from "src/style/assets/swap.svg";
import Img_Pool from "src/style/assets/pool.svg";
import Img_BondCenter from "src/style/assets/bond_center.svg";
import Img_Showcase from "src/style/assets/showcase.svg";
import Img_Market from 'src/style/assets/market.svg';
import { setNav } from "src/store/actions";

import { CHAIN_ID } from 'src/utils/const';

import "./index.less";

const connector = connect(
  (state: State) => (state),
  {
    setNav: (show: boolean) => setNav(show),
  }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface ToolsProps extends PropsFromRedux {
  history: any;
}

interface ToolsState {
  dropListVisible: boolean;
  centerVisible: boolean;
}

class NavTools extends React.Component<ToolsProps, ToolsState> {
  centerRef = createRef<HTMLDivElement>();
  logRef = createRef<HTMLDivElement>();
  state: ToolsState = {
    dropListVisible: false,
    centerVisible: false,
  };

  private onInput = () => (ev: React.ChangeEvent<HTMLInputElement>) => {

    if (false) {
      setTimeout(() => {
        getCoinInfoByAddress("").then((coin) => {
          
        });
      }, 100);
    }
  };

  componentDidMount() {
    document.addEventListener("mousedown", this.HideCenterDropdown);
    document.addEventListener("mousedown", this.HideWalletInfo);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.HideCenterDropdown);
    document.removeEventListener("mousedown", this.HideWalletInfo);
  }

  onSwap = () => {
    this.props.history.push("/swap");
    this.props.setNav(false);
  }

  onPool = () => {
    this.props.history.push("/pools");
    this.props.setNav(false);
  }

  checkCorrectNetwork = () => {
    
  }

  onShowWalletInfo = () => {
    this.setState({
      dropListVisible: true,
    });
  }

  HideWalletInfo = (event: any) => {
    if (this.logRef && !this.logRef.current?.contains(event.target)) {
      this.setState({
        dropListVisible: false,
      });
    }
  }

  HideCenterDropdown = (event: any) => {
    if (this.centerRef && !this.centerRef.current?.contains(event.target)) {
      this.setState({
        centerVisible: false,
      });
    }
  }

  onEtherscan = () => {
    window.open("https://etherscan.io/address/" + this.props.address);
    this.setState({
      dropListVisible: false,
    });
  }

  onLogout = () => {
    this.setState({
      dropListVisible: false,
    });
    logoutWallet();
    this.props.history.push("/");
    this.props.setNav(false);
  }

  renderLogoutDropdown() {
    if (!this.state.dropListVisible) return (null);
    return (
      <div className="dropdownlist" ref={this.logRef}>
        <div className="dropdown__item" onClick={() => this.onEtherscan()}>View on Etherscan</div>
        <div className="dropdown__item red" onClick={() => this.onLogout()}>Disconnect Wallet</div>
      </div>
    )
  }

  onStaking() {
    this.setState({
      centerVisible: false
    });
   /* if (this.props.address)
      this.props.history.push("/staking");
    else 
      alertInitWallet();*/
    window.open('https://bondlystaking.com/');
    this.props.setNav(false);
  }

  onMining() {
    this.setState({
      centerVisible: false
    });
    window.open('https://bondlystaking.com/');
    this.props.setNav(false);
    /*if (this.props.address)
      this.props.history.push("/mining");
    else 
      alertInitWallet();*/
  }

  onShowcase = () => {
    if (this.props.address)
      this.props.history.push("/showcase");
    else 
      alertInitWallet();
    this.props.setNav(false);
  }

  renderCenterDropdown() {
    if (!this.state.centerVisible) return (null);
    return (
      <div className="dropdownlist center" ref={this.centerRef}>
        <div className="dropdown__item" onClick={() => this.onStaking()}>Staking</div>
        <div className="dropdown__item" onClick={() => this.onMining()}>Mining</div>
      </div>
    )
  }

  showCenterVisible = (event: any) => {
    if (this.centerRef && !this.centerRef.current?.contains(event.target)) {
      this.setState({
        centerVisible: true,
      })
    }
  }

  onTutorial = () => {
    window.open('https://youtu.be/Lbjn4sfHEBs');
    this.props.setNav(false);
  }

  onMarket = () => {
    window.open('https://market.bswap.app');
    this.props.setNav(false);
  };

  render() {
    const { chainID, address, history } = this.props;
    const pathname = history.location.pathname;
    const wrongNetwork = chainID === -1 || chainID === CHAIN_ID ? false : true;
    return (
      <div className="pc-nav-tools">
        {address ?
          <div className="not-connect-button" onClick={() => this.onShowWalletInfo()}>
            <div className="text">{shortHash(address)}</div>
            <i className="fas fa-angle-down"></i>
          </div>:
          <div className="not-connect-button single" onClick={alertInitWallet}>
            <div className="text">Wallet not Connected</div>
          </div>
        }
        {this.renderLogoutDropdown()}
        {wrongNetwork && <div className="wrong__network">Wrong Network! <br/> Please connect to Ethereum Mainnet</div>}
        <div className={pathname==="/swap"?"nav__item first selected":"nav__item first"} onClick={() => this.onSwap()}>
          <img className="nav__image" src={Img_Swap} alt=""/>
          <div className="nav__text">Swap</div>
        </div>
        <div 
          className={pathname==="/pools"?"nav__item selected":"nav__item"} 
          onClick={() => this.onPool()}>
          <img className="nav__image" src={Img_Pool} alt=""/>
          <div className="nav__text">Pool</div>
        </div>
        <div
          className={pathname==="/mining" || pathname==="/staking"?"nav__item selected":"nav__item"} 
          onClick={(e) => this.showCenterVisible(e)}>
          <img className="nav__image" src={Img_BondCenter} alt=""/>
          <div className="nav__text">BONDLY Center</div>
          {this.renderCenterDropdown()}
        </div>
        {/* <div
          className={pathname==="/showcase"?"nav__item selected":"nav__item"} 
          onClick={this.onShowcase}>
          <img className="nav__image" src={Img_Showcase} alt=""/>
          <div className="nav__text">Showcase</div>
        </div> */}
        <div className='nav__item' onClick={this.onMarket}>
          <img className='nav__image' src={Img_Market} alt='' />
          <div className='nav__text'>Market</div>
          <div className='new'>New</div>
        </div>
        <div className="nav__item" onClick={this.onTutorial}>
          <i className="fa fa-book"/>
          <div className="nav__text">Tutorial</div>
        </div>
      </div>
    );
  }
}

export default compose(withRouter, connector)(NavTools);
