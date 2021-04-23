import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { withRouter } from 'react-router-dom'
import { compose } from 'redux';

import Img_Check from "src/style/assets/check.svg";
import Img_Metamask from "src/style/icons/metamask.svg";
import Img_Wallet from "src/style/icons/wc.png";
import Img_Coinbase from "src/style/icons/coinbase.jpg";
import Img_Fortmatic from "src/style/icons/fortmatic.jpg";
import { connectWallet } from "src/contracts/base";
export const IS_ETH = typeof window.ethereum !== 'undefined';

import "./index.less";

const connector = connect(
    (state: State) => ({
        address: state.address,
    }),
    {
    }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface LogInProps extends PropsFromRedux {
    history: any;
}

interface LogInState {
}

class LogIn extends React.Component<LogInProps, LogInState> {
    state: LogInState = {
    };

    async connectMM() {
        if (IS_ETH) {
          await connectWallet("MM");
          this.props.history.push('/swap')
          return;
        }
        window.open("https://metamask.io/");
    }

    connectWC = async () => {
        connectWallet("WC").then(close)
    }

    render() {
        return (
            <div className="login-page">
                <div className="login-inner-page">
                    <div className="text__block">
                        <div className="text__title">Log In to BondSwap</div>
                        <div className="feature__container">
                            <div className="feature__row">
                                <img src={Img_Check}/>
                                <div className="feature__text">Non-custodial</div>
                            </div>
                            <div className="feature__row">
                                <img src={Img_Check}/>
                                <div className="feature__text">Transparent</div>
                            </div>
                            <div className="feature__row">
                                <img src={Img_Check}/>
                                <div className="feature__text">Inter-operable</div>
                            </div>
                        </div>
                    </div>
                    <div className="button__block">
                        <div className="button__row metamask" onClick={() => this.connectMM()}>
                            <div className="button__text metamask">Login with Metamask</div>
                            <img src={Img_Metamask} className="button__img"/>
                        </div>
                        <div className="button__row" onClick={this.connectWC}>
                            <div className="button__text">Login with Wallet Connect</div>
                            <img src={Img_Wallet} className="button__img"/>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

export default compose(withRouter, connector)(LogIn);