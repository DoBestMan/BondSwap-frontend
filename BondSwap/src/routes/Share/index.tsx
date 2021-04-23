import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { withRouter } from 'react-router-dom'
import { compose } from 'redux';
import { message, Modal } from "antd";
import { getPoolByTx, getPoolById } from 'src/api/pool';
import { alertInitWallet } from "src/utils/modal";
import { loading, hideLoading } from "src/components/loading";
import {
  closeFixedPool,
  closePrivateFixedPool,
} from "src/contracts/fixed-pool";
import {
    createCloseAction,
} from "src/store/actions";
import type { Pool } from "src/typings/type";

import "./index.less";

import Img_Expire from "src/style/assets/expire.svg";
import Img_SwapType from "src/style/assets/swaptype.svg";
import Img_PoolType from "src/style/assets/pooltype.svg";
import {
    setPoolUpdate
} from "src/store/actions";
import { getCurrentTime } from '../../api/official';

const connector = connect(
    (state: State) => ({
        address: state.address,
    }),
    {
        closePool: (pool: Pool) => createCloseAction(pool.poolId, pool.isFloat),
        setPoolUpdate: (payload: boolean) => setPoolUpdate(payload)
    }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface ShareProps extends PropsFromRedux {
    history: any;
}

interface ShareState {
    shareLink: string,
    activePool: any,
    openCancelModal: boolean,
    swapCanceled: boolean,
    showDetail: boolean,
    endTime: string,
    remainingTime: any,
    loaded: boolean,
    currentTime: number,
}

class Share extends React.Component<ShareProps, ShareState> {
    state: ShareState = {
        shareLink: "",
        activePool: null,
        openCancelModal: false,
        swapCanceled: true,
        showDetail: true,
        endTime: "",
        remainingTime: 0,
        loaded: false,
        currentTime: 0,
    };
    
    timer = 0;

    componentDidMount() {
        this.isValidateHash();
        this.timer = window.setInterval(this.isValidateHash, 1000);
    }

    componentWillUnmount() {
      window.clearInterval(this.timer);
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

    isValidateHash = async () => {
        if (this.state.loaded) {
            window.clearInterval(this.timer);
        }
        let hash = this.props.history.location.pathname.slice(7);
        let pool: any;
        if (hash.length > 10) pool = await getPoolByTx(hash);
        else pool = await getPoolById(hash);
        if (pool === null || !pool.txHash) {
            return;
        }

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
      
        this.setState({
            activePool: pool,
            swapCanceled: pool.status !== "Live"
        });
        let poolId = pool.poolId;
        if (pool.isFloat) {
            poolId = 'F' + pool.poolId;
        } else if (pool.priv) {
            poolId = 'P' + pool.poolId;
        }
        this.setState({
            shareLink: "https://bswap.app/pool/" + poolId,
            loaded: true
        });
        this.props.setPoolUpdate(true);
    }
    
    copyLink = () => {
        message.info("Copied link");
        var link : any = document.getElementById("sharelink");
        link.select();
        link.setSelectionRange(0, 1000);
        document.execCommand('copy');
    }

    openLink = () => {
        window.open(this.state.shareLink);
    }

    cancelSwap = async () => {
        let pool = this.state.activePool;
        if (pool && !pool.isFloat) {
            const text = pool.isFloat
                ? "Cancel Swap And Withdraw..."
                : "Cancel Swap ...";
            loading({ text });
            try {
                let canceledPool = null;
                if (pool.priv) {
                    canceledPool = await closePrivateFixedPool(pool);
                } else {
                    canceledPool = await closeFixedPool(pool);
                }
                if (canceledPool) {
                    message.info("Swap is canceled.");
                    this.props.closePool(pool);
                    this.setState({
                        openCancelModal: false,
                        swapCanceled: true,
                        activePool: canceledPool
                    });
                }
            } catch( e ) {
                message.info("Cancel Swap is rejected.")
            } finally {
                hideLoading();
            }
        }
    }

    onCancelSwap = () => {
        if (this.props.address)
            this.setState({
                openCancelModal: true,
            })
        else {
            alertInitWallet();
        }
    }

    closeCancelModal = () => {
        this.setState({
            openCancelModal: false,
        })
    }

    renderCancelSwap() {
        if (this.state.activePool === null) return (null);
        if (this.state.activePool.isFloat) return (null);
        if (this.props.address.toLowerCase() !== this.state.activePool.maker.toLowerCase()) return (null);
        if (!this.state.swapCanceled)
            return (
                <div className="cancel-text" onClick={() => this.onCancelSwap()}>
                    Cancel Swap
                </div>
            )
        else {
            return (
                <div className="cancel-text">
                    Swap is canceled
                </div>
            )
        }
    }

    onShowDetails = () => {
        this.setState({
            showDetail: !this.state.showDetail
        })
    }

    renderParticipants() {
        if (this.state.activePool.isFloat) return (null);
        if (!this.state.activePool.priv) return (null);
        return (
            <div className="participants">
                <div className="participants__text">Participants</div>
                {this.state.activePool.takers.map((taker:string, index: number) => {
                    return (
                        <div className="taker" key={index}>{taker}</div>
                    )
                })}
            </div>
        )
    }

    renderDetails() {
        if (!this.state.showDetail) return (null);
        if (!this.state.activePool) return (
            <div className="loader"/>
        );
        return (
            <div className="detail__container">
                <div className="detail__row">
                    <div className="block__row">
                        <img src={Img_Expire} alt=""/>
                        <div className="detail__description">
                            {this.state.activePool.endTime * 1000 > this.state.currentTime ? "Expires in" : "Expired at"}
                        </div>
                    </div>
                    <div className="detail__text">
                        {this.state.activePool.endTime * 1000 > this.state.currentTime ? (
                            this.state.endTime
                        ) : (
                            new Date(this.state.activePool.endTime * 1000).toLocaleString()
                        )}
                    </div>
                </div>
                {this.state.activePool.isFloat?(null):<div className="detail__row">
                    <div className="block__row">
                        <img src={Img_PoolType} alt=""/>
                        <div className="detail__description">Who can join the pool</div>
                    </div>
                    <div className="detail__text">{this.state.activePool.priv?"Private":"Public"}</div>
                </div>}
                <div className="detail__row">
                    <div className="block__row">
                        <img src={Img_SwapType} alt=""/>
                        <div className="detail__description">Swap Ratio Type</div>
                    </div>
                    <div className="detail__text">{this.state.activePool.isFloat?"Float Swap":"Fixed Swap"}</div>
                </div>
                {this.renderParticipants()}
            </div>
        )
    }

    render() {
        return (
            <div className="share-page">
                <div className="share-inner-page">
                    <div className="share-title">
                        Swap Initiated
                    </div>
                    <div className="share-container">
                        <div className="text">Share this swap</div>
                        <div className="share-link">
                            <div className="link">
                                <input
                                    id="sharelink"
                                    className="link-text"
                                    value={this.state.shareLink}
                                    onChange={() => {}}
                                />
                                <div className="copy-link" onClick={() => this.copyLink()}>Copy</div>
                            </div>
                            <div className="open-text" onClick={() => this.openLink()}>
                                Open In New Tab
                            </div>
                        </div>
                        <div className="detail-text" onClick={() => this.onShowDetails()}>
                            {this.state.showDetail?"Hide details":"Show details"}
                            <i className={this.state.showDetail?"fas fa-chevron-up":"fas fa-chevron-down"}></i>
                        </div>
                        {this.renderDetails()}
                    </div>
                    {this.renderCancelSwap()}
                    <Modal
                        title={"Cancel Swap"}
                        visible={this.state.openCancelModal}
                        onCancel={this.closeCancelModal}
                        footer={false}
                    >
                        <div className="confirm__text">Please click confirm button to cancel this swap.</div>
                        <div className="confirm__button" onClick={() => this.cancelSwap()}>Confirm</div>
                    </Modal>
                </div>
            </div>
        )
    }
}

export default compose(withRouter, connector)(Share);