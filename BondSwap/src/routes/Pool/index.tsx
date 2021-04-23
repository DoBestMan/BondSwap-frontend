import React, { createRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import Search from "src/components/search";
import PoolList from "src/components/pool-list";
import { withRouter } from 'react-router-dom'
import { compose } from 'redux';
import PoolJoin from "src/components/pool-join";

import Img_Check from "src/style/assets/check.svg";

import "./index.less";

const connector = connect(
    (state: State) => ({
        address: state.address,
    }),
    {
    }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface PoolProps extends PropsFromRedux {
    history: any
}

interface PoolState {
    viewType: number;
    showDropDown: boolean;
    poolType: number,
    poolOptions: string [],
    activePool: any,
}

class Pool extends React.Component<PoolProps, PoolState> {
    state: PoolState = {
        viewType: 0,
        showDropDown: false,
        poolType: 0,
        poolOptions: ["Public Pool", "Private Pool"],
        activePool: null,
    };
    poolRef = createRef<HTMLDivElement>();
    
    componentDidMount() {
        document.addEventListener("mousedown", this.hidePoolDropDown);
        window.addEventListener('resize', this.updateSize);
    }

    updateSize = () => {
        if (window.innerWidth <= 1000) {
            if (this.state.viewType === 1)
                this.setState({
                    viewType: 0
                });
        }
    }

    componentWillUnmount() {
        document.removeEventListener("mousedown", this.hidePoolDropDown);
    }

    componentDidUpdate() {
        if (this.props.address && this.state.poolOptions.length === 2) {
            this.setState({
                poolOptions: ["Public Pool", "Private Pool", "Joined Pool", "My Pool"]
            })
        }
    }

    showPoolDropDown = () => {
        this.setState({
            showDropDown: true
        });
    }

    hidePoolDropDown = (event: any) => {
        if (this.poolRef && !this.poolRef.current?.contains(event.target)) {
          this.setState({
            showDropDown: false,
          });
        }
    }

    updateViewType(type: number) {
        this.setState({
            viewType: type
        });
    }

    onChangePoolType(type: number) {
        this.setState({
            poolType: type,
            showDropDown: false
        });
    }

    renderDropDown() {
        if (!this.state.showDropDown) return (null);
        return (
            <div className="pool__dropdown" ref={this.poolRef}>
                {this.state.poolOptions.map((optionName, index) => {
                    if (this.state.poolType === index)
                        return (
                            <div className="option__row" key={index}>
                                <div className="text selected">{optionName}</div>
                                <img src={Img_Check} alt=""/>
                            </div>
                        )
                    return (
                        <div className="option__row" key={index} onClick={() => this.onChangePoolType(index)}>
                            <div className="text">{optionName}</div>
                        </div>
                    )
                })}
            </div>
      )
    }

    setJoinPool = (pool: any) => {
        this.setState({
            activePool: pool
        });
    }

    render() {
        if (this.state.activePool) {
            return (
                <div className="pool__page">
                    <PoolJoin
                        activePool={this.state.activePool}
                        history={this.props.history}
                        setJoinPool={this.setJoinPool}
                        accept={false}
                    />
                </div>
            )
        }
        return (
            <div className="pool__page">
                <div className="pool__container">
                    <div className="pool__header">
                        <div className="pool__list" onClick={this.showPoolDropDown}>
                            <div className="text">{this.state.poolOptions[this.state.poolType]}</div>
                            <i className="fa fa-angle-down" aria-hidden="true"/>
                        </div>
                        {this.renderDropDown()}
                        <Search />
                        <div className="view__type" onClick={() => this.updateViewType(0)}>
                            {this.state.viewType?
                                <i className="fa fa-th-large" aria-hidden="true"/>:
                                <i className="fa fa-th-large selected" aria-hidden="true"/>}
                        </div>
                        <div className="view__type" onClick={() => this.updateViewType(1)}>
                            {!this.state.viewType?
                                <i className="fa fa-bars" aria-hidden="true"/>:
                                <i className="fa fa-bars selected" aria-hidden="true"/>}
                        </div>
                    </div>
                    <div className="pool__description">Pay ETH to get these tokens below </div>
                    <PoolList 
                        poolType={this.state.poolType} 
                        history={this.props.history}
                        setJoinPool={this.setJoinPool}
                        viewType={this.state.viewType}
                    />
                </div>
            </div>
        )
    }
}

export default compose(withRouter, connector)(Pool);