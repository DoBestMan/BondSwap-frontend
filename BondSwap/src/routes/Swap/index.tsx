import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { Modal, Input, message } from "antd";
import { shortHash, getTime, isValidCoinAddress } from "src/utils/_";
import { getAtom, getRateUnit, toEth } from "src/utils/currency";
import {
    approveFixedPool,
    createFixedPool,
    CreateFixedPoolParams,
    createPrivateFixedPool,
    isApproved,
} from "src/contracts/fixed-pool";
import {
  createFloatPool,
  CreateFloatPoolParams,
  approveFloatPool,
  isFloatApproved,
} from "src/contracts/float-pool";
import { loading, hideLoading } from "src/components/loading";
import { getCoinInfoByAddress, getCoin, getBalance } from "src/contracts/erc20";
import { ethers } from "ethers";
import { withRouter } from 'react-router-dom'
import { compose } from 'redux';
import Axios from "axios";

import {
    BONDLY_ADDRESS
} from "src/utils/const";

import Img_Down from "src/style/assets/down.svg";
import Img_Expire from "src/style/assets/expire.svg";
import Img_SwapType from "src/style/assets/swaptype.svg";
import Img_PoolType from "src/style/assets/pooltype.svg";
import Img_Right from "src/style/assets/right.svg";
import Img_Confirmed from "src/style/assets/confirmed.svg";
import Img_Eth from "src/style/assets/eth.png";

import "./index.less";

const COINGECKO_URL = "https://tokens.coingecko.com/uniswap/all.json";

const connector = connect(
    (state: State) => (state),
    {
    }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface SwapProps extends PropsFromRedux {
    history: any
}

interface SwapState {
    tokenSymbol: string;
    tokenAddress: string;
    openTokenModal: boolean;
    ethBalance: string;
    tokenBalance: string;
    payValue: number;
    getValue: number;
    filteredTokens: never[];
    filterText: string;
    allTokens: [];
    openSwapModal: boolean;
    swapProgress: number;
    balanceInitialized: boolean;
    hash: string;
    day: number;
    hour: number;
    min: number;
    swapType: boolean;
    isPublic: boolean;
    participants: string[];

    validation_gvalue: string;
    validation_pvalue: string;
    validation_expire: string;
    validation_participants: string;

    approving: boolean;
    initiating: boolean;

    swapName: string;

    showtoken: number;
    tokenLogo: string;
}

class Swap extends React.Component<SwapProps, SwapState> {
    state: SwapState = {
        tokenSymbol: 'BONDLY',
        tokenAddress: BONDLY_ADDRESS,
        tokenBalance: '--',
        openTokenModal: false,
        ethBalance: '--',
        payValue: 0,
        getValue: 0,
        filteredTokens: [],
        allTokens: [],
        openSwapModal: false,
        swapProgress: 0,
        balanceInitialized: false,
        hash: "",
        day: 3,
        hour: 0,
        min: 0,
        swapType: true,
        isPublic: true,
        participants: [""],
        validation_gvalue : "",
        validation_pvalue : "",
        validation_expire: "",
        validation_participants: "",
        filterText: "",
        approving: false,
        initiating: false,
        swapName: "BONDLY <> ETH",
        showtoken: 20,
        tokenLogo: "https://assets.coingecko.com/coins/images/13322/thumb/logomark.png?1607474416",
    };
    
    componentDidMount() {
        Axios.get(COINGECKO_URL).then(res => {
            this.setState({
                filteredTokens: res.data.tokens,
                allTokens: res.data.tokens,
            })
        });
    }

    componentDidUpdate() {
        if (this.props.address && !this.state.balanceInitialized) {
            this.updateBalance(this.state.tokenAddress);
            this.setState({
                balanceInitialized: true
            })
        }
    }

    private OpenTokenModal = () => {
        this.setState({
          openTokenModal: true,
        });
    };

    private closeOpenTokenModal = () => {
      this.setState({
        openTokenModal: false,
        showtoken: 10
      });
    };
    
    private onInput = (key: "payValue" | "getValue") => (ev: React.ChangeEvent<HTMLInputElement>) => {
        if (key === "getValue" && !this.state.swapType) return;
        this.setState(
            {
              [key]: ev.target.value,
            } as any,
        );
        if (key === "getValue") this.setState({validation_gvalue: ""});
        else this.setState({validation_pvalue: ""});
    }

    validation = () => {
        let res = false;
        if (this.state.getValue <= 0 && this.state.swapType) {
            res = true;
            this.setState({
                validation_gvalue: "This value must be greater than 0."
            });
        }
        if (parseFloat(this.state.tokenBalance) === 0) {
            res = true;
            this.setState({
                validation_pvalue: "Token balance is 0."
            });
        }
        else if (this.state.payValue <= 0 || this.state.payValue > parseFloat(this.state.tokenBalance)) {
            res = true;
            this.setState({
                validation_pvalue: "This value must be between 0 and " + this.state.tokenBalance
            });
        }
        if (this.state.day === 0 && this.state.hour === 0 && this.state.min === 0) {
            res = true;
            this.setState({
                validation_expire: "Fields cannot be zero",
            })
        }
        if (this.state.swapType && !this.state.isPublic) {
            for (let i = 0; i < this.state.participants.length; i ++) {
                if (!this.state.participants[i]) {
                    res = true;
                    this.setState({
                        validation_participants: "Missing participants"
                    })
                    break;
                }
            }
        }
        return res;
    }
    setToMax = () => {
        this.setState({
            payValue: parseFloat(this.state.tokenBalance)
        })
    }
    initiateSwap = async () => {
        if (!this.props.address) return;
        if (this.validation()) {
            return;
        }
        
        const coin = await getCoin(this.state.tokenAddress);
        const amount = getAtom(this.state.payValue.toString(), coin!.decimals);

        const params = {
          address: this.state.tokenAddress,
          amount,
        };

        let approved = false;
        if (this.state.swapType) approved = await isApproved(params);
        else approved = await isFloatApproved(params);
        if (approved)
            this.setState({
                swapProgress: 1,
                openSwapModal: true,
            });
        else 
            this.setState({
                swapProgress: 0,
                openSwapModal: true,
            });
    }
    
    closeOpenSwapModal = () => {
        this.setState({
            openSwapModal: false,
        });
    }

    gotoTokenAddress = async (e: any, addr: string) => {
        e.preventDefault();
        e.stopPropagation();
        window.open("https://etherscan.io/token/" + addr);
    }

    tokenFilterChange = async (e: any) => {
        const { value } = e.target;
        let filterText = value.toLowerCase();
        let filteredTokens : any = this.state.allTokens.filter((token: any) => {
            return (token.address.toLowerCase().indexOf(filterText) >=0 || 
                token.name.toLowerCase().indexOf(filterText)>=0 || token.symbol.toLowerCase().indexOf(filterText)>=0)
        });
        if (filteredTokens.length === 0 && isValidCoinAddress(e.target.value)) {
            let coin : any = await getCoinInfoByAddress(e.target.value);
            if (coin)
                filteredTokens.push({
                    name: coin.name,
                    address: coin.tracker,
                    logoURI: "",
                });
        }
        this.setState({
            filterText: value,
            filteredTokens,
        })
    }

    selectToken = async (token: any) => {
        this.setState({
            openTokenModal: false,
        });
        let coin : any = await getCoinInfoByAddress(token.address).catch(e => {});
        if (coin) {
            this.setState({
                tokenAddress: coin.tracker,
                tokenSymbol: coin.symbol,
                swapName: coin.symbol + " <> ETH",
                tokenLogo: token.logoURI
            });
            this.updateBalance(coin.tracker);
        }
    }

    createPool = async () => {
        if (!this.props.address) {
            return;
        }
        let hash: string = "";
        loading({ text: "Initiating ..." });
        this.setState({
            initiating: true,
        });
        try {
            const endTime = getTime(this.state.day, this.state.hour, this.state.min);
            const coin = await getCoin(this.state.tokenAddress);
            const amount = getAtom(this.state.payValue.toString(), coin!.decimals);
            if (this.state.swapType) {
                let swapRatio = this.state.payValue / this.state.getValue;
                const { rate, units } = getRateUnit(
                  swapRatio.toString(),
                  coin!.decimals
                );
                const params: CreateFixedPoolParams = {
                name: this.state.swapName?this.state.swapName:this.state.tokenSymbol + " <> ETH",
                address: this.state.tokenAddress,
                amount,
                rate,
                units,
                endTime,
                };
                if (this.state.isPublic)
                    hash = await createFixedPool(params);
                else 
                    hash = await createPrivateFixedPool({
                        ...params,
                        takers: this.state.participants,
                    });
            } else {
                const params: CreateFloatPoolParams = {
                  name: this.state.tokenSymbol + " <> ETH",
                  address: this.state.tokenAddress,
                  amount,
                  endTime,
                };
                hash = await createFloatPool(params);
            }
            if (hash) {
                this.setState({
                    swapProgress: 2,
                });
                message.info(`Swap initiated`);
                this.setState({hash});
            }
        } catch(e) {
            message.info('Initiate is failed');
        } finally {
            hideLoading();
            this.setState({
                initiating: false,
            });
        };
    }

    approveSwap = async () => {
        if (!this.props.address) {
            return;
        }
        let approved = false;
        loading({ text: "Approving ..." });
        this.setState({
            approving: true,
        })
        try {
            const coin = await getCoin(this.state.tokenAddress);
            const amount = getAtom("10000000000000000", coin!.decimals);
           
            const params = {
              address: this.state.tokenAddress,
              amount,
            };
            if (this.state.swapType)
                approved = await approveFixedPool(params);
            else
                approved = await approveFloatPool(params);
            
            if (approved) {
                message.info(`Swap is approved.`);
                this.setState({
                    swapProgress: 1,
                })           
            }
        } catch(e) {
            message.info('Swap is rejected.');
        } finally {
            hideLoading();
            this.setState({
                approving: false,
            })
        };
    }

    renderApprove() {
        if (this.state.swapProgress === 0)
            return (
                <div className="initiate__row">
                    <div className="left">
                        <div className="circle">1</div>
                        <div className="step__text">Approve Swap</div>
                    </div>
                    <div className="right">
                        {this.state.approving?
                            <div className="loader"/>:(null)}
                        <div className="step__button" onClick={() => this.approveSwap()}>
                            {!this.state.approving?"Approve":"Approving ..."}
                        </div>
                    </div>
                </div>
            )
        return (
            <div className="initiate__row">
                <div className="left">
                    <div className="circle confirmed">
                        <img src={Img_Confirmed} alt=""/>
                    </div>
                    <div className="step__text">Approve Swap</div>
                </div>
                <div className="right">
                    <div className="step__button disabled">Approved</div>
                </div>
            </div>
        )
    }

    renderStepStick() {
        if (this.state.swapProgress === 0)
            return (
                <div className="step__stick"/>
            )
        return (
            <div className="step__stick confirmed"/>
        )
    }

    renderInitiate() {
        if (this.state.swapProgress === 0)
            return(
                <div className="initiate__row disabled">
                    <div className="circle">2</div>
                    <div className="step__text">Initiate Swap</div>
                    <div className="step__button">Initiate</div>
                </div>
            );
        else if (this.state.swapProgress === 1)
            return(
                <div className="initiate__row">
                    <div className="left">
                        <div className="circle">2</div>
                        <div className="step__text">Initiate Swap</div>
                    </div>
                    <div className="right">
                        {this.state.initiating?
                            <div className="loader"/>:(null)}
                        <div className="step__button" onClick={() => this.createPool()}>
                            {!this.state.initiating?"Initiate":"Initiating ..."}
                        </div>
                    </div>
                </div>
            );
        return (
            <div className="initiate__row">
                <div className="left">
                    <div className="circle confirmed">
                        <img src={Img_Confirmed} alt=""/>
                    </div>
                    <div className="step__text">Initiate Swap</div>
                </div>
                <div className="right">
                    <div className="step__button disabled">Initiate</div>
                </div>
            </div>
        );
    }

    updateBalance = async (tokenAddr: string) => {
        const { address } = this.props;
        if ( address ) {
            const provider = new ethers.providers.Web3Provider(window.ethereum);
            provider.getBalance(address).then((balance) => {
                let ethString = ethers.utils.formatEther(balance);
                ethString = parseFloat(ethString).toFixed(4);
                if (this.state.ethBalance !== ethString) {
                    this.setState({
                        ethBalance: ethString,
                    })
                }
            });
            getBalance(tokenAddr, address).then(async (balance) => {
                const coin = await getCoin(tokenAddr);
                if (coin) {
                    if (coin.decimals === 18) 
                        balance = toEth(balance, 4);
                    else 
                        balance = (parseFloat(balance) / Math.pow(10, coin.decimals)) + '';
                }
                if (this.state.tokenBalance !== balance) {
                    this.setState({
                        tokenBalance: balance,
                    })
                }
            })
        }
    }

    shareSwap = () => {
        if (this.state.swapProgress < 2) return;
        this.props.history.push("/share/" + this.state.hash);
    }

    onDayChange(e : any) {
        let n = e.target.value?parseInt(e.target.value + ''):0;
        if (n < 0) n = 0;
        if (n > 14) n = 14;
        this.setState({
            day: n,
            validation_expire: ""
        });
    }
    onHourChange(e : any) {
        let n = e.target.value?parseInt(e.target.value + ''):0;
        if (n < 0) n = 0;
        if (n > 23) n = 23;
        this.setState({
            hour: n,
            validation_expire: ""
        });
    }
    onMinuteChange(e : any) {
        let n = e.target.value?parseInt(e.target.value + ''):0;
        if (n < 0) n = 0;
        if (n > 59) n = 59;
        this.setState({
            min: n,
            validation_expire: ""
        });
    }

    onChangeSwapType(type: boolean) {
        this.setState({
            swapType: type,
            validation_gvalue: "",
        });
    }

    setPublic(pub: boolean) {
        this.setState({
            isPublic: pub
        })
    }

    addParticipant() {
        let t = [...this.state.participants];
        t.push("");
        this.setState({
            participants: t,
            validation_participants: "",
        });
    }

    removeParticipant(pos: number) {
        if (pos === 0) return;
        let t = [...this.state.participants];
        t.splice(pos, 1);
        this.setState({
            participants: t,
            validation_participants: "",
        });
    }

    onAddrChange(pos: number, e: any) {
        let t = [...this.state.participants];
        t[pos] = e.target.value;
        this.setState({
            participants: t,
            validation_participants: "",
        });
    }

    renderWhitelist() {
        if (this.state.swapType === false) return (null);
        if (this.state.isPublic) return (null);
        return (
            <div className="whitelist">
                <div className="whitelist__text">Participants<span>*</span></div>
                {this.state.participants.map((addr: string, index: number) => {
                    return (
                        <div className="whitelist__row" key={index}>
                            <div className="index__text">{index + 1}:</div>
                            <input 
                                type="text" 
                                className="participant" 
                                placeholder="Fill in the whitelist ERC-20 wallet address"
                                value={addr}
                                onChange={(e) => this.onAddrChange(index, e)}
                            />
                            <div className={index === 0?"remove__item disabled":"remove__item"}
                                onClick={() => this.removeParticipant(index)}
                            >
                                <i className="fas fa-minus"></i>
                            </div>
                        </div>
                    )
                })}
                {this.state.validation_participants?<div className="item__error">{this.state.validation_participants}</div>:(null)}
                <div className="add__item" onClick={() => this.addParticipant()}>
                    <i className="fas fa-plus"></i>
                </div>
            </div>
        )
    }

    renderDetails() {
        return (
            <div className="swap__details">
                <div className="swap__expire">
                    <div className="row__block left">
                        <img src={Img_Expire} alt=""/>
                        <div className="expire__text gray">Expires in</div>
                    </div>
                    <div className="row__block center">
                        <div className="expire__part">
                            <input 
                                className={this.state.validation_expire?"expire__input item__error":"expire__input"} 
                                // type="number" 
                                onChange={(e) => this.onDayChange(e)}
                                value={this.state.day}
                            />
                            <div className="expire__text">Days</div>
                        </div>
                        <div className="expire__part">
                            <input 
                                className={this.state.validation_expire?"expire__input item__error":"expire__input"} 
                                // type="number" 
                                onChange={(e) => this.onHourChange(e)}
                                value={this.state.hour}
                            />
                            <div className="expire__text">Hours</div>
                        </div>
                        <div className="expire__part">
                            <input 
                                className={this.state.validation_expire?"expire__input item__error":"expire__input"} 
                                // type="number" 
                                onChange={(e) => this.onMinuteChange(e)}
                                value={this.state.min}
                            />
                            <div className="expire__text">Minutes</div>
                        </div>
                    </div>
                </div>
                <div className="swap__type">
                    <div className="row__block left">
                        <img src={Img_SwapType} alt=""/>
                        <div className="swap__text">Swap Ratio Type</div>
                    </div>
                    <div className="row__block center">
                        <div className="swap__type__radio" onClick={() => this.onChangeSwapType(true)}>
                            <div className="radio__circle">
                                {this.state.swapType?<div className="swap__checked"/>:(null)}
                            </div>
                            <div className="radio__text">Fixed</div>
                        </div>
                        <div className="swap__type__radio" onClick={() => this.onChangeSwapType(false)}>
                            <div className="radio__circle">
                                {!this.state.swapType?<div className="swap__checked"/>:(null)}
                            </div>
                            <div className="radio__text">Floating</div>
                        </div>
                    </div>
                </div>
                {this.state.swapType?
                    <div className="swap__type">
                        <div className="row__block left">
                            <img src={Img_PoolType} alt=""/>
                            <div className="swap__text">Who can join the pool</div>
                        </div>
                        <div className="row__block center">
                            <div className="swap__type__radio" onClick={() => this.setPublic(true)}>
                                <div className="radio__circle">
                                    {this.state.isPublic?<div className="swap__checked"/>:(null)}
                                </div>
                                <div className="radio__text">Public</div>
                            </div>
                            <div className="swap__type__radio" onClick={() => this.setPublic(false)}>
                                <div className="radio__circle">
                                    {!this.state.isPublic?<div className="swap__checked"/>:(null)}
                                </div>
                                <div className="radio__text">Private</div>
                            </div>
                        </div>
                    </div>:(null)}
                {this.renderWhitelist()}
            </div>
        )
    }

    onNameChange = (e:any) => {
        this.setState({
            swapName: e.target.value
        });
    }

    loadMore = () => {
        this.setState({
            showtoken: this.state.showtoken + 10
        })
    }

    getSwapRatio() {
        if (this.state.payValue === 0) return 0;
        return parseFloat(this.props.ethPrice) * this.state.getValue / this.state.payValue;
    }

    render() {
        const { address } = this.props;
        return (
            <div className="swap-page">
                <div className="swap-inner-page">
                    <div className="swap-status">
                        Initiate A Swap
                    </div>
                    <div className="swap-container">
                        {!address?
                            <div className="warning">
                                <i className="fa fa-exclamation-triangle"/>
                                <div className="warning__text">You must connect your wallet to continue</div>
                            </div>:(null)}
                        <div className="name__row">
                            <div className="name__text">Swap Name</div>
                            <Input 
                                type="text"
                                value={this.state.swapName}
                                min={0}
                                onChange={this.onNameChange}
                                placeholder={this.state.tokenSymbol + " <> ETH"}
                            />
                        </div>
                        <div className="swap-container__blocks">
                            <div className="block">
                                <div className="block__text">You Pay</div>
                                <div className="token__detail">
                                    <Input 
                                        type="number"
                                        value={this.state.payValue}
                                        min={0}
                                        onChange={this.onInput("payValue")}
                                        placeholder="0"
                                    />
                                    <div className="max__text" onClick={this.setToMax}>MAX</div>
                                    <img className="logo__img" src={this.state.tokenLogo?this.state.tokenLogo:require(`src/style/assets/infinite.svg`)} alt =""/>
                                    <div className="token__symbol selectable" onClick={() => this.OpenTokenModal()}>{this.state.tokenSymbol}</div>
                                    <img className="down__img" src={Img_Down} onClick={() => this.OpenTokenModal()} />
                                </div>
                            </div>
                            {this.state.validation_pvalue?
                                <div className="item__error">{this.state.validation_pvalue}</div>:(null)}
                            <div className="balance__text">
                                Balance: {this.state.tokenBalance} {this.state.tokenSymbol}
                            </div>
                            {this.state.swapType?
                                <div className="block">
                                    <div className="block__text">You Get</div>
                                    <div className="token__detail">
                                        <Input 
                                            type="number"
                                            value={!this.state.swapType?"":this.state.getValue}
                                            min={0}
                                            onChange={this.onInput("getValue")}
                                            placeholder="0"
                                        />
                                        <img className="logo__img" src={Img_Eth} />
                                        <div className="token__symbol">ETH</div>
                                    </div>
                                </div>:(null)}
                            {this.state.validation_gvalue?
                                <div className="item__error">{this.state.validation_gvalue}</div>:(null)}
                            {this.state.swapType?
                                <div className="balance__text">
                                    Balance: {this.state.ethBalance} ETH
                                </div>:(null)}
                            {this.state.swapType?<div className="swap__ratio">
                                Swap Ratio: 1 {this.state.tokenSymbol} = {this.getSwapRatio()} USD
                            </div>:(null)}
                        </div>
                        {this.renderDetails()}
                        <div 
                            className={address?"swapbutton":"swapbutton disabled"}
                            onClick={() => this.initiateSwap()}
                        >
                            <div className="text">Initiate Swap</div>
                            <img src={Img_Right} alt=""/>
                        </div>
                        <Modal
                            title="Initiate A Swap"
                            visible={this.state.openSwapModal}
                            footer={null}
                            onCancel={this.closeOpenSwapModal}
                        >
						    <div className="initiate_modal">
                                {this.renderApprove()}
                                {this.renderStepStick()}
                                {this.renderInitiate()}
                                <div className={this.state.swapProgress === 2?"share__button":"share__button disabled"}
                                    onClick={() => this.shareSwap()}
                                >
                                    <div className="text">Share Swap</div>
                                    <img src={Img_Right} alt=""/>
                                </div>
						    </div>
                        </Modal>
                        <Modal
                            title="Select A token"
                            visible={this.state.openTokenModal}
                            footer={null}
                            onCancel={this.closeOpenTokenModal}
                        >
                            <input 
                                type="text" 
                                className="token__input" 
                                placeholder="Search name or paste address"
                                onChange={(e) => this.tokenFilterChange(e)}
                                value={this.state.filterText}
                            />
                            <div className="token__name">Token Name</div>
                            <div className="token__list">
                                {this.state.filteredTokens.slice(0, this.state.showtoken).map((token : any) => {
                                    let tokenAddr = token.address;
                                    return (
                                        <div className="token__row" key={token.address} onClick={() => this.selectToken(token)}>
                                            <img src={token.logoURI?token.logoURI:require(`src/style/assets/infinite.svg`)} alt=""></img>
                                            <div className="token__details">
                                                <div className="symbol">{token.name}</div>
                                                <div className="address" onClick={(e) => this.gotoTokenAddress(e, tokenAddr)}>{shortHash(token.address)}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            {this.state.showtoken < this.state.filteredTokens.length && <div className="loadmore" onClick={this.loadMore}>LOAD MORE</div>}
                        </Modal>
                    </div>
                </div>
            </div>
        )
    }
}

export default compose(withRouter, connector)(Swap);