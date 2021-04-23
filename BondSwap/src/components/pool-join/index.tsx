import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { Modal, Input, message } from "antd";
import { getRatio } from "src/utils/currency";
import { ethers } from "ethers";
import { loading, hideLoading } from "src/components/loading";
import { getMaxEth, toWei, getStandardUnit } from "src/utils/currency";
import { joinFixedPool, joinPrivateFixedPool } from "src/contracts/fixed-pool";
import { joinFloatPool } from "src/contracts/float-pool";
import Axios from "axios";

import Img_Expire from "src/style/assets/expire.svg";
import Img_Right from "src/style/assets/right.svg";
import Img_Confirmed from "src/style/assets/confirmed.svg";
import Img_Eth from "src/style/assets/eth.png";

import { getCurrentTime } from '../../api/official';

import {
    setPoolUpdate
} from "src/store/actions";

import "./index.less";
const COINGECKO_URL = "https://tokens.coingecko.com/uniswap/all.json";

const connector = connect(
    (state: State) => ({
        address: state.address,
    }),
    {
        setPoolUpdate: (payload: boolean) => setPoolUpdate(payload)
    }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface JoinProps extends PropsFromRedux {
    history: any;
    activePool: any;
    setJoinPool: any;
    accept: boolean;
}

interface JoinState {
    activePool: any;
    payValue: number;
    maxValue: number;
    ethBalance: string;
    balanceInitialized: boolean;
    validation__pString: string;
    txHash: string;
    paidValue: number;
    gotValue: number;
    openCongraModal: boolean;
    noAccess: boolean;
    tokenAddress: string;
    joining: boolean;
    rTokens: any[];
    currentTime: number;
    endTime: string;
    remainingTime: number;
}

class PoolJoin extends React.Component<JoinProps, JoinState> {
    state: JoinState = {
        activePool: this.props.activePool,
        payValue: 0,
        maxValue: 0,
        ethBalance: "--",
        balanceInitialized: false,
        validation__pString: "",
        txHash: "",
        paidValue: 0,
        gotValue: 0,
        openCongraModal: false,
        noAccess: false,
        tokenAddress: "",
        joining: false,
        rTokens: [],
        currentTime: 0,
        endTime: "",
        remainingTime: 0,
    };

    btimer = 0;

    componentDidMount() {
        this.updateBalance();
        this.btimer = window.setInterval(this.updateBalance, 5000);
        Axios.get(COINGECKO_URL).then(res => {
            this.setState({
                rTokens: res.data.tokens,
            })
        });
        this.setCurTime();
    }

    async setCurTime() {
        if (this.state.activePool) {
            const pool = this.state.activePool;
            let curTime = await getCurrentTime();
            let remainingTime = pool.endTime - curTime / 1000;
            this.setState({
                currentTime: curTime
            })
            if (remainingTime < 0) {
                this.setState({
                    endTime: new Date(pool.endTime * 1000).toLocaleString()
                })
            } 
            setInterval(() => {
                if (remainingTime < 0) {
                    this.setState({
                        currentTime: this.state.currentTime + 1000
                    });
                }
                else {
                    remainingTime -= 1;
                    this.setState({
                        remainingTime: remainingTime,
                        endTime: this.getRemainingTime(remainingTime),
                        currentTime: this.state.currentTime + 1000
                    });
                }
            }, 1000);
        }
    }

    getRemainingTime = (diff: number) => {
        const day = Math.floor(diff / (60 * 60 * 24));
        diff %= (60 * 60 * 24);
        const hour = Math.floor(diff / (60 * 60));
        diff %= (60 * 60);
        const minute = Math.floor(diff / 60);
        diff %= 60;
        const second = Math.floor(diff);
        return (day > 0 ? day + ' days ' : '') + 
            (hour > 0 ? hour + ' hours ' : '') + 
            (minute > 0 ? minute + ' mins ' : '') + 
            (second > 0 ? second + ' secs': '');
    }

    componentWillUnmount() {
      window.clearInterval(this.btimer);
    }

    componentDidUpdate() {
        if (this.props.address && this.state.activePool && !this.state.balanceInitialized) {
            this.updateBalance();
            this.setState({
                balanceInitialized: true,
            });
            const pool = this.state.activePool;
            if (!pool.isFloat) {
                this.setState({
                    maxValue: parseFloat(getMaxEth(this.state.activePool))
                });
            }
            if (pool.priv) {
                let i;
                for(i = 0; i < pool.takers.length; i ++) {
                    if (pool.takers[i].toLowerCase() === this.props.address.toLowerCase()) {
                        return;
                    }
                }
                this.setState({
                    noAccess: true,
                });
            }
        }
    }

    getReceiveAmount(pool: any) {
        if (!this.state.activePool) return 0;
        if (this.state.activePool.isFloat) return 0;
        const ratio = getRatio(pool.rate, pool.units, pool.trackerDecimals!);
        return this.state.payValue * parseFloat(ratio);
    }

    getSwapRatio() {
        if (!this.state.activePool) return 0;
        if (this.state.activePool.isFloat) return 0;
        const pool = this.state.activePool;
        const ratio = getRatio(pool.rate, pool.units, pool.trackerDecimals!);
        return parseFloat(ratio).toFixed(4);
    }

    onPayChange = (e:any) => {
        let n = e.target.value;
        if (n < 0) n = 0;
        if (n > this.state.maxValue) n = this.state.maxValue;
        this.setState({
            payValue: n,
            validation__pString: "",
        });
    }

    updateBalance = async () => {
        const { address } = this.props;
        if ( address ) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            provider.getBalance(address).then((balance) => {
                let ethString = ethers.utils.formatEther(balance);
                ethString = parseFloat(ethString).toFixed(4);
                if (this.state.ethBalance !== ethString) {
                    this.setState({
                        ethBalance: ethString,
                    });
                }
                if (this.state.activePool && this.state.activePool.isFloat) {
                    this.setState({
                        maxValue: parseFloat(ethString)
                    })
                }
            });
        }
    }

    setToMax = () => {
        this.setState({
            payValue: parseFloat(getMaxEth(this.state.activePool)),
            validation__pString: "",
        });
    }

    openTokenLink = () => {
        if (this.state.activePool)
            window.open("https://etherscan.io/token/" + this.state.activePool.tracker);
    }

    acceptSwap = async () => {
        if (!this.props.address) return;
        if (!this.state.activePool) return;
        if (this.state.activePool.status !== "Live") return;
        if (this.state.noAccess) return;
        const ethValue = parseFloat(this.state.ethBalance);
        if (ethValue === 0) {
            this.setState({
                validation__pString: "Your balanace is 0."
            });
            return;
        }
        if (this.state.payValue <= 0 || this.state.payValue > ethValue) {
            this.setState({
                validation__pString: "This value must be between 0 and " + this.state.ethBalance
            });
            return;            
        }
        let pool = this.state.activePool;
        loading({ text: `Join Pool ${pool.name} ...` });
        this.setState({
            joining: true
        });
        try {
            const wei = toWei(this.state.payValue + '');
            if (!pool.isFloat)
                this.setState({
                    paidValue: this.state.payValue,
                    gotValue: this.getReceiveAmount(pool),
                })
            if (pool.isFloat) {
                await joinFloatPool(pool, wei);
                this.goBack();
            } else if (pool.priv) {
                await joinPrivateFixedPool(pool, this.props.address, wei);
            } else {
                await joinFixedPool(pool, wei);
            }
            if (!pool.isFloat)
                this.setState({
                    openCongraModal: true,
                });
            this.props.setPoolUpdate(true);
            message.info(`Joined Pool: ${pool.name}`);
        } catch(e:any) {
            message.info("Join Pool is failed");
        } finally {
            hideLoading();
            this.setState({
                joining: false
            });
        }
    }

    renderStatus(pool: any) {
        if (!this.props.address) {
            return (
                <div className="filled__text">
                    You must connect wallet to continue
                </div>
            );
        }
        if (!pool || !pool.txHash) return (null);
        if (pool.status === 'Closed') {
            return (
                <div className="closed__text">
                    Swap is Closed
                </div>
            );
        } else if (pool.status === 'Filled') {
            return (
                <div className="filled__text">
                    Swap is Filled
                </div>
            );
        }
        if (pool.priv && this.props.address) {
            let i;
            for(i = 0; i < pool.takers.length; i ++) {
                if (pool.takers[i].toLowerCase() === this.props.address.toLowerCase()) {
                    return (null);
                }
            }
            return (
                <div className="closed__text">
                    This is a private swap. You don't have access to this swap.
                </div>
            );
        }
    }

    renderDetails() {
        if (!this.state.activePool) return (null);
        const pool = this.state.activePool;
        if (!pool.isFloat) {
            const amount = ethers.FixedNumber.from(pool.amount);
            const left = ethers.FixedNumber.from(pool.leftAmount);
            const p = left.divUnsafe(amount).toString();
            const p100 = ((1 - parseFloat(p)) * 100).toFixed(2);
            return (
                <div className="join__detail">
                    <div className="progress">
                        <div className="animated" style={{width: p100 + '%'}}></div>
                    </div>
                    <div className="progress__text">{p100}%</div>
                    <div className="join__detail__row">
                        <img src={Img_Expire} alt=""/>
                        <div className="expire__text">Expires on (local time)</div>
                        <div className="ethAmount">
                            {pool.endTime * 1000 > this.state.currentTime ?
                                this.state.endTime  
                                : new Date(pool.endTime * 1000).toLocaleString()
                            }
                        </div>
                    </div>
                </div>
            )
        }
    }

    closeCongraModal = () => {
        this.setState({
            openCongraModal: false,
        });
        this.goBack();
    }
    

    renderFloatDetail() {
        const pool = this.state.activePool;
        if (!pool) return (null);
        const tokenAmount = getStandardUnit(pool.amount, pool.trackerDecimals!);
        const ethAmount = getStandardUnit(pool.takerAmount, pool.trackerDecimals!);

        return (
            <div className="join__detail">
                <div className="join__detail__row">
                    <img src={Img_Expire} alt=""/>
                    <div className="expire__text">Expires on (local time)</div>
                    <div className="ethAmount">
                        {pool.endTime * 1000 > this.state.currentTime ?
                            this.state.endTime  
                            : new Date(pool.endTime * 1000).toLocaleString()
                        }
                    </div>
                </div>
                <div className="join__detail__row">
                    <div className="expire__text">ETH in pool </div>
                    <div className="ethAmount">{ethAmount} ETH</div>
                </div>
                <div className="join__detail__row">
                    <div className="expire__text">{pool.trackerSymbol} in pool </div>
                    <div className="ethAmount">{tokenAmount} {pool.trackerSymbol}</div>
                </div>
                {pool.status === 'Live' ?
                    this.state.joining?
                    <div className="action__buttons">
                        <div className="loader"/>
                        <div className="loadig__text">Joining in Progress ...</div>
                    </div>:
                    <div className="action__buttons">
                        <div 
                            className="acceptbutton"
                            onClick={() => this.acceptSwap()}
                        >
                            <div className="text">JOIN</div>
                            <i className="fas fa-arrow-right"></i>
                        </div>
                        <div className="acceptbutton share" onClick={this.shareLink}>
                            <div className="text center">SHARE LINK</div>
                        </div>
                    </div>:(null)}
            </div>
        );
    }

    shareLink = () => {
        this.props.history.push('/share/' + this.state.activePool.txHash);
    }

    goBack = async () => {
        if (this.props.accept) {
            await this.props.setJoinPool();
        } else
            this.props.setJoinPool(null);
    }

    render() {
        const pool = this.state.activePool;
        if (!pool) {return (null)};
        let leftAmount = '', ethAmount = '';
        if (pool && !pool.isFloat) {
            leftAmount = getStandardUnit(pool.leftAmount, pool.trackerDecimals!);
            ethAmount = getMaxEth(pool);
        }
        let logoURI;
        const bToken = this.state.rTokens.find((token: any) => token.symbol === pool.trackerSymbol);
        if (bToken && bToken.logoURI) logoURI = bToken.logoURI;
        else logoURI = require(`src/style/assets/infinite.svg`);
        if (pool && pool.isFloat) {
            return (
                <div className="pool__join">
                    <div className="sub__header">
                        <div className="join-title">
                            Join Pool {pool.name}
                        </div>
                        {!this.props.accept && <div className="back__button" onClick={this.goBack}>Back</div>}
                    </div>
                    <div className="taddress" onClick={this.openTokenLink}>
                        <div className="address">{pool.tracker}</div>
                        <i className="fa fa-external-link" aria-hidden="true"></i>
                    </div>
                     <div className="join-container">
                        {this.renderStatus(pool)}
                        <div className="join-container__blocks">
                            <div className="block">
                                <div className="block__text">You Pay</div>
                                <div className="token__detail">
                                    <Input 
                                        type="number"
                                        value={this.state.payValue}
                                        min={0}
                                        onChange={(e) => this.onPayChange(e)}
                                        placeholder="0"
                                    />
                                    <img className="logo__img" src={Img_Eth} />
                                    <div className="token__symbol">ETH</div>
                                </div>
                            </div>
                            {this.state.validation__pString?
                                <div className="item__error">{this.state.validation__pString}</div>:(null)}
                            <div className="balance__text">
                                Balance: {this.state.ethBalance} ETH
                            </div>
                        </div>
                        {this.renderFloatDetail()}
                    </div>
                </div>
            );
        }
        return (
            <div className="pool__join">                
                <div className="sub__header">
                    <div className="join-title">
                        Join Pool {pool.name}
                    </div>
                    {!this.props.accept && <div className="back__button" onClick={this.goBack}>Back</div>}
                </div>
                <div className="tname">{pool.trackerSymbol}</div>
                <div className="taddress" onClick={this.openTokenLink}>
                    <div className="address">{pool.tracker}</div>
                    <i className="fa fa-external-link" aria-hidden="true"></i>
                </div>
                <div className="join-container">
                    {this.renderStatus(pool)}
                    <div className="pool__join__modal">
                        <div className="pair__ratio">
                            <div className="pair__logo">
                                <img src={Img_Eth} alt=""/>
                                <img className="token__logo" src={logoURI} alt=""/>
                            </div>
                            <div className="swap__text">
                                <div className="swap__ratio">1 ETH = {this.getSwapRatio()} {pool.trackerSymbol}</div>
                                <div className="swap__description">Swap Ratio</div>
                            </div>
                        </div>
                        <div className="detail__blocks">
                            <div className="block">
                                <div className="token__amount">{parseFloat(leftAmount).toFixed(4)} {pool.trackerSymbol}</div>
                                <div className="detail__text">Total Available Amount</div>
                            </div>
                            <div className="block">
                                <div className="token__amount">{ethAmount} ETH</div>
                                <div className="detail__text">Total ETH Amount</div>
                            </div>
                        </div>
                    </div>
                    {this.renderDetails()}
                    <div className="join-container__blocks">
                        <div className="block">
                            <div className="block__text">You Pay</div>
                            <div className="token__detail">
                                <Input 
                                    type="number"
                                    value={this.state.payValue}
                                    min={0}
                                    onChange={(e) => this.onPayChange(e)}
                                    placeholder="0"
                                />
                                <div className="max__text" onClick={() => this.setToMax()}>MAX</div>
                                <img className="logo__img" src={Img_Eth} />
                                <div className="token__symbol">ETH</div>
                            </div>
                        </div>
                        {this.state.validation__pString?
                            <div className="item__error">{this.state.validation__pString}</div>:(null)}
                        <div className="receive__text">You will receive {this.getReceiveAmount(this.state.activePool)} {pool.trackerSymbol}</div>
                        <div className="balance__text">
                            Balance: {this.state.ethBalance} ETH
                        </div>
                    </div>
                    {pool.status === 'Live'?
                        this.state.joining?
                        <div className="action__buttons">
                            <div className="loader"/>
                            <div className="loadig__text">Joining in Progress ...</div>
                        </div>:
                        <div className="action__buttons">
                            <div className="acceptbutton" onClick={this.acceptSwap}>
                                <div className="text">JOIN</div>
                                <img src={Img_Right} alt=""/>
                            </div>
                            <div className="acceptbutton share" onClick={this.shareLink}>
                                <div className="text center">SHARE LINK</div>
                            </div>
                        </div>:(null)}
                </div>
                {pool?
                    <Modal
                        title={"Joined Pool " + pool.name} 
                        visible={this.state.openCongraModal}
                        footer={null}
                        onCancel={this.closeCongraModal}
                    >
                        <div className="pool__join__modal">
                            <div className="congra__circle">
                                <img src={Img_Confirmed} alt = ""/>
                            </div>
                            <div className="congra__token__name">{pool.trackerSymbol}</div>
                            <div className="congra__token__address" onClick={() => this.openTokenLink()}>
                                <div className="congra__token__short">{pool.tracker}</div>
                                <i className="fa fa-external-link" aria-hidden="true"></i>
                            </div>
                            <div className="swap__ratio">1 ETH = {this.getSwapRatio()} {pool.trackerSymbol}</div>
                            <div className="swap__description">Swap Ratio</div>
                            <div className="detail__blocks">
                                <div className="block">
                                    <div className="token__amount">{this.state.paidValue} ETH</div>
                                    <div className="detail__text">You Paid</div>
                                </div>
                                <div className="block">
                                    <div className="token__amount">{this.state.gotValue} {pool.trackerSymbol}</div>
                                    <div className="detail__text">You Received</div>
                                </div>
                            </div>
                        </div>
                    </Modal>:(null)}
            </div>
        )
    }
}

export default connector(PoolJoin);