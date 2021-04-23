import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { withRouter } from "react-router-dom";
import { compose } from "redux";
import { NFT_CARDS, ETH_NETWORK } from "src/utils/const";

import "./index.less";

const connector = connect((state: State) => (state), {

});

type PropsFromRedux = ConnectedProps<typeof connector>;

interface ShowcaseDetailProps extends PropsFromRedux {
  history: any;
}

interface ShowcaseDetailState {
  tIndex: number;
  info: any;
}

class ShowcaseDetail extends React.Component<ShowcaseDetailProps, ShowcaseDetailState> {
  state: ShowcaseDetailState = {
    tIndex: this.props.selectedCard.id,
    info: this.props.selectedCard.info,
  };

  componentDidMount() {
    if (!this.props.address) {
      this.props.history.push("/");
      return;
    }
  }

  openTokenLink = (addr: string) => {
      if (ETH_NETWORK === 'mainnet') 
          window.open("https://etherscan.io/address/" + addr);
      else
          window.open("https://rinkeby.etherscan.io/address/" + addr);
  }

  onBack = () => {
      this.props.history.push("/showcaseNFT/" + this.state.tIndex);
  }

  onTrade = () => {
    this.props.history.push("/nftswap");
  }
  
  render() {
    if (this.state.tIndex === -1) return (<div/>)
    let collectibles = NFT_CARDS[this.state.tIndex];
    let cardInfo = this.state.info;
    return (
      <div className="showcase__detail__page">
        <div className="showcase__detail__container">
            <div className="showcase__detail__header">
                <div className="showcase__title">Showcase</div>
                <div className="back__button" onClick={this.onBack}>Back</div>
            </div>
            <div className="showcase__card__detail">
                <div className="link" onClick={() => this.openTokenLink(collectibles.address)}>
                    <div className="showcaseNFT__name">{collectibles.name}</div>
                    <i className="fa fa-external-link" aria-hidden="true"></i>
                </div>
                <div className="gray__circle"/>
                <div className="gray__text">{collectibles.amount} Collectibles</div>
                <div className="gray__circle"/>
                <div className="gray__text">{cardInfo.name}</div>
            </div>
            <div className="showcase__detail__content">
              <div className="card__image">
                <img src={cardInfo.imageUrlOriginal} alt=""/>
              </div>
              <div className="card__detail">
                <div className="price__content">
                  <div className="price__detail">
                    <div className="p__description">Last Price Paid</div>
                    <div className="price">
                      <div className="pvalue">{cardInfo.lastSale?
                        '$' + parseFloat(cardInfo.lastSale.paymentToken.usdPrice).toFixed(2):'No data available'}</div>
                      <div className="question__mark">
                        <i className="fa fa-question-circle" aria-hidden="true"></i>
                        <div className="comment">Price data available from Opensea</div>
                      </div>
                    </div>
                  </div>
                  <div className="trade__button" onClick={this.onTrade}>Trade</div>
                </div>
                <div className="detail__content">
                  <div className="detail__subtitle">{cardInfo.name}</div>
                  <div className="detail__description">{cardInfo.description}</div>
                </div>
                <div className="detail__content whole__border">
                  <div className="detail__properties">
                    <div className="detail__subtitle">Properties</div>
                    {cardInfo.traits.map((trait: any, index: number) => {
                      return (
                        <div className="property" key={index}>
                          <div className="description short">{trait.trait_type}</div>
                          <div className="value">{trait.value}</div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="detail__properties big">
                    <div className="detail__subtitle">More info</div>
                    <div className="property">
                      <div className="description">Contract</div>
                      <div className="value">{cardInfo.tokenAddress}</div>
                    </div>
                    <div className="property">
                      <div className="description">Token Id</div>
                      <div className="value">{cardInfo.tokenId}</div>
                    </div>
                    <div className="property">
                      <div className="description">Blockchain</div>
                      <div className="value">Ethereum</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    );
  }
}

export default compose(withRouter, connector)(ShowcaseDetail);
