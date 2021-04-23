import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { withRouter } from 'react-router-dom'
import { compose } from 'redux';

import Img_BCCG from 'src/style/assets/bccg.png';

import "./index.less";

const connector = connect(
    (state: State) => ({
    }),
    {
    }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface ShowcaseProps extends PropsFromRedux {
    history: any
}

interface ShowcaseState {
    collectibles: any []
}

class Showcase extends React.Component<ShowcaseProps, ShowcaseState> {
    state: ShowcaseState = {
        collectibles: [
            {
                name: "BCCG",
                img: Img_BCCG
            },
        ]        
    };
    render() {
        return (
            <div className="showcase__page">
                <div className="showcase__container">
                    <div className="showcase__blocks">
                        <div className="block">
                            <div className="btext">Showcase</div>
                            <div className="btext coming">Coming Soon.</div>
                            <div className="description">All your NFTs displayed and traded in one place. </div>
                        </div>
                        <div className="img__block">
                            <img className="bccg__img" src={Img_BCCG} alt=""/>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default compose(withRouter, connector)(Showcase);