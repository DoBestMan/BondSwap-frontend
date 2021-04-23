import React from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { withRouter } from 'react-router-dom'
import { compose } from 'redux';
import { getPoolById, getPoolByTx } from 'src/api/pool';
import PoolJoin from "src/components/pool-join";

import "./index.less";

const connector = connect(
    (state: State) => ({
        address: state.address,
    }),
    {
    }
);

type PropsFromRedux = ConnectedProps<typeof connector>;

interface JoinProps extends PropsFromRedux {
    history: any;
}

interface JoinState {
    activePool: any;
    txHash: string;
}

class Join extends React.Component<JoinProps, JoinState> {
    state: JoinState = {
        activePool: null,
        txHash: "",
    };
    
    timer1 = 0;

    componentDidMount() {
        this.isValidateHash();
        this.timer1 = window.setInterval(this.isValidateHash, 5000);
    }

    componentWillUnmount() {
      window.clearInterval(this.timer1);
    }

    isValidateHash = async () => {
        let hash = this.props.history.location.pathname.slice(6);
        let pool: any = await getPoolByTx(hash);
        if (pool === null) {
            pool = await getPoolById(hash);
            if (!pool || !pool.txHash) {
                this.props.history.push("/");
                return;
            }
        }
        this.setState({
            activePool: pool,
            txHash: hash,
        });
    }


    updatePool = () => {
        this.setState({
            activePool: null
        });
        this.isValidateHash();
    }

    render() {
        if (this.state.activePool) {
            return (
                <div className="join-page">
                    <PoolJoin
                        activePool={this.state.activePool}
                        history={this.props.history}
                        setJoinPool={this.updatePool}
                        accept={true}
                    />
                </div>
            )
        }
        return (
            <div className="join-page">
            </div>
        )
    }
}

export default compose(withRouter, connector)(Join);