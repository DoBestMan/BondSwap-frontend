import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { withRouter } from 'react-router-dom'
import { compose } from 'redux';
import { ethers } from "ethers";
import { create as createOpensea } from "src/utils/opensea";
import { NFT_CARDS, ETH_NETWORK } from "src/utils/const";
import { getBalance } from "src/contracts/erc1155";
import { loading, hideLoading } from "src/components/loading";
import {
    setNFTCard,
} from "src/store/actions";

import "./index.less";

const connector = connect(
    (state: State) => (state),
    {
        setNFTCard: (cardInfo: any) => setNFTCard(cardInfo),
    }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface ShowcaseNftProps extends PropsFromRedux {
    history: any,
}

interface ShowcaseNftState {
    tIndex: number;
    collectibles:  any [],
}

class ShowcaseNft extends React.Component<ShowcaseNftProps, ShowcaseNftState> {
    state: ShowcaseNftState = {
        tIndex: -1,
        collectibles: [],
    };
    
    componentDidMount() {
        let iString = this.props.history.location.pathname.slice(13);
        if (!this.props.address || isNaN(iString)) {
            this.props.history.push("/");
            return;
        }
        const index = parseInt(iString);
        if (index >= NFT_CARDS.length) {
            this.props.history.push("/");
            return;
        }
        this.setState({
            tIndex: index
        });
        this.loadCollectibles(NFT_CARDS[index]);
    }

    loadCollectibles = async (card: any) => {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const opensea = createOpensea(provider, ETH_NETWORK);
        loading({ text: "Fetching Data ..." });
        for(let i = 0; i < card.tokenIDs.length; i ++) {
            const b = await getBalance(card.address, this.props.address, card.tokenIDs[i]);
            const count = parseInt(b);
            if (count > 0) {
                await opensea.getAsset(card.address, card.tokenIDs[i] + '')
                .then(res => {
                    this.setState({
                        collectibles: [
                            ...this.state.collectibles,
                            {
                                count,
                                info: res
                            }
                        ]
                    })
                })
                .catch(e => {
                    console.log(e)
                });
            }
        }
        hideLoading();
    }

    openTokenLink = (addr: string) => {
        if (ETH_NETWORK === 'mainnet') 
            window.open("https://etherscan.io/address/" + addr);
        else
            window.open("https://rinkeby.etherscan.io/address/" + addr);
    }

    onBack = () => {
        this.props.history.push("/showcase");
    }

    onTrade = (info: any, count: number) => {
        this.props.setNFTCard({
            id: this.state.tIndex,
            info,
            count
        });
        this.props.history.push("/showcaseDetail")
    }

    render() {
        if (this.state.tIndex === -1) return (<div/>)
        let collectibles = NFT_CARDS[this.state.tIndex];
        return (
            <div className="showcaseNFT__page">
                <div className="showcaseNFT__container">
                    <div className="showcaseNFT__header">
                        <div className="showcase__title">Showcase</div>
                        <div className="back__button" onClick={this.onBack}>Back</div>
                    </div>
                    <div className="showcaseNFT__detail">
                        <div className="link" onClick={() => this.openTokenLink(collectibles.address)}>
                            <div className="showcaseNFT__name">{collectibles.name}</div>
                            <i className="fa fa-external-link" aria-hidden="true"></i>
                        </div>
                        <div className="grey__circle"/>
                        <div className="showcaseNFT__amount">{collectibles.amount} Collectibles</div>
                    </div>
                    <div className="showcaseNFT__content">
                        {this.state.collectibles.map((collectible, index) => {
                            return (
                                <div className="nft__card" key={index}>
                                    <div className="img__content">
                                        <img src={collectible.info.imageUrl} alt=""/>
                                    </div>
                                    <div className="nft__card__name">{collectible.info.name}</div>
                                    <div className="trade__button" onClick={() => this.onTrade(collectible.info, collectible.count)}>Trade</div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        );
    }
}

export default compose(withRouter, connector)(ShowcaseNft);