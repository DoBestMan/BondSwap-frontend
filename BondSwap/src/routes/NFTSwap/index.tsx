import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { withRouter } from 'react-router-dom'
import { compose } from 'redux';
import { ethers } from "ethers";

import { Modal } from "antd";

import { NFT_CARDS, ETH_NETWORK } from "src/utils/const";
import { getBalance } from "src/contracts/erc1155";
import { create as createOpensea } from "src/utils/opensea";
import { loading, hideLoading } from "src/components/loading";

import Img_Exchange from "src/style/assets/exchange.png";
import Img_Right from "src/style/assets/right.svg";
import "./index.less";

const connector = connect(
    (state: State) => (state),
    {
        
    }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface NFTSwapProps extends PropsFromRedux {
    history: any
}

interface NFTSwapState {
    selectedCard: any;
    selectNFTModal: boolean;
    isEmpty: boolean;
    loaded: boolean;
    loading: boolean;
    collectibleID: number [];
    selectedCollectibleID: number;
    collectibles: any [],
}

class NFTSwap extends React.Component<NFTSwapProps, NFTSwapState> {
    state: NFTSwapState = {
        selectedCard: this.props.selectedCard,
        selectNFTModal: false,
        isEmpty: true,
        loaded: false,
        loading: false,
        collectibleID: [],
        selectedCollectibleID: -1,
        collectibles: [],
    };

    componentDidMount() {

    }

    componentDidUpdate() {
        if (this.state.loading === false && this.state.selectedCard.id === -1 && this.props.address && this.state.loaded === false) {
            this.setState({
                loading: true
            });
            this.loadCardsDetail();
        }
    }

    renderSwapWithCard() {
        if (this.state.selectedCard.id === -1) {
            return (
                <div className="empty__card">
                    <div className="add__button" onClick={this.openSelectModal}>+</div>
                    <div className="description">Select the NFT you<br/> want the trade</div>
                </div>
            )
        } else {
            console.log(this.state.selectedCard);
            return (
                <div className="selected__nft__card">
                    <div className="card__image">
                    </div>
                </div>
            )
        }
    }

    closeSelectModal = () => {
        this.setState({
            selectNFTModal: false
        });
    }

    openSelectModal = () => {
        this.setState({
            selectNFTModal: true,
            selectedCollectibleID: -1,
        });
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
            loaded: true,
            loading: false,
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

    selectCollectible = (id: number) => {
        this.loadNFTCards(NFT_CARDS[id], id);
    }

    loadNFTCards = async (card: any, id: number) => {
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
        this.setState({
            selectedCollectibleID: id
        });
        hideLoading();
    }

    selectNFTCard = (card: any) => {
        this.setState({
            selectedCard: {
                id: this.state.selectedCollectibleID,
                info: card.info,
                count: card.count,
            },
            selectNFTModal: false,
        });
    }

    rednerSelectNFTModal() {
        if (this.state.loaded && this.state.isEmpty) {
            return (
                <div className="nft__select__modal">
                    <div className="empty__content">
                        You do not have any collectibles yet
                    </div>
                </div>
            )
        }
        if (this.state.selectedCollectibleID === -1) {
            return (
                <div className="nft__select__modal">
                    {this.state.collectibleID.map((id, index) => {
                        const nftToken = NFT_CARDS[id];
                        return (
                            <div key={index} className="collectibles" onClick={() => this.selectCollectible(id)}>
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
        } else {
            return (
                <div className="nft__select__modal">
                    {this.state.collectibles.map((collectible, index) => {
                        return (
                            <div className="nft__card" key={index}>
                                <div className="img__content">
                                    <img src={collectible.info.imageUrl} alt=""/>
                                </div>
                                <div className="nft__card__name">{collectible.info.name}</div>
                                <div className="trade__button" onClick={() => this.selectNFTCard(collectible)}>Select</div>
                            </div>
                        )
                    })}
                </div>
            )
        }
    }

    render() {
        const { address } = this.props;
        return (
            <div className="nftswap__page">
                <div className="nftswap__page__container">
                    <div className="nftswap__page__header">
                        <div className="nftswap__title">Creating NFT Swap</div>
                        <div className="back__button">Back</div>
                        <div 
                            className={address?"initiate__button":"initiate__button disabled"}
                        >
                            <div className="text">Initiate Swap</div>
                            <img src={Img_Right} alt=""/>
                        </div>
                    </div>
                    <div className="step__text">Step 1 of 2</div>
                    {address?(null):<div className="warning__text">You must connect wallet to continue</div>}
                    <div className="swap__container">
                        <div className="card__block">
                            <div className="card__block__text">Swap With</div>
                            {this.renderSwapWithCard()}
                        </div>
                        <img src={Img_Exchange} className="img__exchange" alt=""/>
                        <div className="card__block">
                            <div className="card__block__text">You Want</div>
                            <div className="empty__card">
                                <div className="add__button">+</div>
                                <div className="description">Add a NFT or token<br/> you want in exchange</div>
                            </div>
                        </div>
                    </div>
                </div>
                <Modal
                    title="Select a NFT"
                    visible={this.state.selectNFTModal}
                    footer={null}
                    onCancel={this.closeSelectModal}
                >
                    {this.rednerSelectNFTModal()}
                </Modal>
            </div>
        )
    }
}

export default compose(withRouter, connector)(NFTSwap);