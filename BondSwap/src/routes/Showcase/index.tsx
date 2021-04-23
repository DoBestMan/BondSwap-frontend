import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { withRouter } from 'react-router-dom'
import { compose } from 'redux';
import { NFT_CARDS, ETH_NETWORK } from "src/utils/const";
import { getBalance } from "src/contracts/erc1155";

import "./index.less";

const connector = connect(
    (state: State) => state,
    {
    }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface ShowcaseProps extends PropsFromRedux {
    history: any
}

interface ShowcaseState {
    isEmpty: boolean,
    loading: boolean;
    collectibleID: number [],
}

class Showcase extends React.Component<ShowcaseProps, ShowcaseState> {
    state: ShowcaseState = {
        isEmpty: true,
        loading: true,
        collectibleID: [],
    };

    componentDidMount() {
        if (!this.props.address) {
            this.props.history.push("/");
            return;
        }
        this.loadCardsDetail();
    }

    loadCollectibles = async (card: any, index: number) => {
        if (this.state.isEmpty === false) return;
        for(let i = 0; i < card.tokenIDs.length; i ++) {
            const b = await getBalance(card.address, this.props.address, card.tokenIDs[i]);
            if (parseInt(b) > 0) {
                this.setState({
                    isEmpty: false,
                    collectibleID: [index, ...this.state.collectibleID]
                });
                break;
            }
        }
    }

    loadCardsDetail = async () => {
        await Promise.all(NFT_CARDS.map(async (card: any, index) => this.loadCollectibles(card, index)));
        this.setState({
            loading: false
        });
    }

    openTokenLink = (event: any, addr: string) => {
        event.preventDefault();
        event.stopPropagation();
        if (ETH_NETWORK === 'mainnet') 
            window.open("https://etherscan.io/address/" + addr);
        else
            window.open("https://rinkeby.etherscan.io/address/" + addr);
    }

    onGoIndividual = (index: number) => {
        this.props.history.push("/showcaseNFT/" + index);
    }

    renderContent() {
        if (this.state.loading) 
            return (
                <div className="showcase__content">
                    <div className="collectibles">
                        <div className="img__skeleton"/>
                        <div className="text__skeleton"/>
                        <div className="text__skeleton small"/>
                    </div>
                </div>
            )
        if (this.state.isEmpty)
            return (
                <div className="empty__content">
                    You do not have any collectibles yet
                </div>
            )
        return (
            <div className="showcase__content">
                {this.state.collectibleID.map((id, index) => {
                    const nftToken = NFT_CARDS[id];
                    return (
                        <div key={index} className="collectibles" onClick={() => this.onGoIndividual(index)}>
                            <img className="collectibles__img" src={require(`images/${nftToken.image}`)} alt=""/>
                            <div className="collectibles__link" onClick={(event) => this.openTokenLink(event, nftToken.address)}>
                                <div className="collectibles__name">{nftToken.name}</div>
                                <i className="fa fa-external-link" aria-hidden="true"></i>
                            </div>
                            <div className="collectibles__amount">{nftToken.amount} collectibles</div>
                        </div>
                    )
                })}
            </div>
        )
    }

    render() {
        return (
            <div className="showcase__page">
                <div className="showcase__container">
                    <div className="showcase__header">
                        <div className="showcase__title">Showcase</div>
                    </div>
                    {this.renderContent()}
                </div>
            </div>
        );
    }
}

export default compose(withRouter, connector)(Showcase);