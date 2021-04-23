import React, { createRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { Table, Button, Modal, message } from "antd";
import { ColumnsType } from "antd/lib/table";
import { ethers } from "ethers";
import {
  createPubPoolAction,
  createPrivPoolAction,
  createMimePoolAction,
  createLoadedAction,
  createLoadingAction,
  createMyJoinResult,
  createCloseAction,
  createWithdrawJoinAction,
  setPoolUpdate
} from "src/store/actions";
import type { Pool, Pools } from "src/typings/type";
import {
  getPublicPoolList,
  getPrivatePoolList,
  getMimePoolList,
  getMimeJoinPoolList,
} from "src/api/pool";
import { PAGE_SIZE } from "src/utils/const";
import { alertInitWallet } from "src/utils/modal";
import Coin from "src/components/coin";
import {
  error,
  isPoolClosed,
  isPoolExpired,
  isPoolFilled,
  canotJoinPool,
} from "src/utils/_";
import {
  closeFixedPool,
  closePrivateFixedPool,
} from "src/contracts/fixed-pool";
import {
  withdraw,
  withdrawMime,
  getNativePool,
  NativeFloatPool,
} from "src/contracts/float-pool";
import Pair from "src/components/pair";
import PoolName from "src/components/pool-name";
import { loading, hideLoading } from "src/components/loading";
import InfiniteScroll from "react-infinite-scroller";
import { shortHash } from "src/utils/_";
import { getRatio } from "src/utils/currency";
import BigNumber from 'bignumber.js';
import Axios from "axios";

import Img_Eth from "src/style/assets/eth.png";

import "./index.less";

const connector = connect((state: State) => state, {
  setPublicPools: (pools: Pools) => createPubPoolAction(pools),
  setPrivatePools: (pools: Pools) => createPrivPoolAction(pools),
  setMimePools: (pools: Pools) => createMimePoolAction(pools),
  setMimeJoins: (pools: Pools) => createMyJoinResult(pools),
  closePool: (pool: Pool) => createCloseAction(pool.poolId, pool.isFloat),
  withdrawJoin: (pool: Pool) => createWithdrawJoinAction(pool.poolId),
  setLoading: () => createLoadingAction(),
  setLoaded: () => createLoadedAction(),
  setPoolUpdate: (payload: boolean) => setPoolUpdate(payload)
});

const COINGECKO_URL = "https://tokens.coingecko.com/uniswap/all.json";

type PropsFromRedux = ConnectedProps<typeof connector>;

interface PLProps extends PropsFromRedux {
  poolType: number;
  history: any;
  setJoinPool: any;
  viewType: number;
}

function getPoolFields(mime: boolean): ColumnsType<Pool> {
  return [
    {
      title: "Pool ID",
      dataIndex: "poolId",
      width: 50,
      align: "center",
      render: (id: number, pool: Pool) => {
        if (pool.priv) {
          return <span>P{id}</span>;
        }
        if (pool.isFloat) {
          return <span>F{id}</span>;
        }
        return <span>{id}</span>;
      },
    },
    {
      title: "Status",
      key: "id",
      width: 90,
      align: "center",
      filters: [
        { text: "All", value: "All" },
        { text: "Live", value: "Live" },
        { text: "Filled", value: "Filled" },
        { text: "Closed", value: "Closed" },
      ],
      onFilter: (value: string | number | boolean, pool: Pool) => {
        switch (value) {
          case "All":
            return true;
          case "Live":
            return !isPoolClosed(pool) && !isPoolFilled(pool);
          case "Filled":
            return isPoolFilled(pool);
          case "Closed":
            return isPoolClosed(pool);
          default:
            return true;
        }
      },
      render: (endTime: number, pool: Pool) => {
        if (isPoolClosed(pool)) {
          return (
            <div className="status">
              <div className="circle closed"/>
              <div className="text closed">Closed</div>
            </div>
          );
        }

        if (isPoolFilled(pool)) {
          return (
            <div className="status">
              <div className="circle filled"/>
              <div className="text filled">Filled</div>
            </div>
          );
        }
        return (
          <div className="status">
            <div className="circle"/>
            <div className="text">Live</div>
          </div>
        );
      },
    },
    {
      title: "Pool Name",
      dataIndex: "name",
      width: 120,
      align: "center",
      render(name: string, pool: Pool) {
        return <PoolName pool={pool} compact />;
      },
    },
    {
      title: "Pool Pair",
      dataIndex: "tracker",
      key: "id",
      width: 80,
      align: "center",
      render: (erc20: string, pool: Pool) => {
        return (
          <span>
            {(pool.trackerSymbol || "") + "-ETH"}
          </span>
        );
      },
    },
    {
      title: "Token Contract",
      key: "id",
      dataIndex: "tracker",
      width: 110,
      align: "center",
      render(tracker: string, pool: Pool) {
        return <Coin address={tracker} short/>;
      },
    },
    {
      title: "Swap Ratio",
      key: "id",
      width: 120,
      align: "center",
      render: (_: void, pool: Pool) => {
        if (pool.priv && !mime) {
          return null;
        }

        if (pool.isFloat) {
          return <span>Floating</span>;
        }

        return <Pair pool={pool} />;
      },
    },
    {
      title: "Fired Status",
      key: "id",
      width: 160,
      align: "center",
      render:(_:void, pool: Pool) => {
        if (pool.isFloat) {
          return (null);
        }
        const amount = ethers.FixedNumber.from(pool.amount);
        const left = ethers.FixedNumber.from(pool.leftAmount);
        const p = left.divUnsafe(amount).toString();
        const p100 = ((1 - parseFloat(p)) * 100).toFixed(1);
        return (
          <div className="remaining">
            <div className="back">
              <div className="fill" style={{width: p100 + '%'}}/>
            </div>
            <div className="progress">{p100}%</div>
          </div>
        )
      }
    },
    {
      title: "Market Price",
      key: "id",
      width: 80,
      align: "center",
      render: (_: void, pool: Pool) => {
        let marketPrice;
        if (!pool.marketPrice || pool.marketPrice === '...') {
          marketPrice = '...'
        } else {
          marketPrice = "$" + new BigNumber(parseInt(pool.marketPrice)).dividedBy(new BigNumber(10).pow(8)).toFixed(4).toString();
        }
        return (
          <div>{marketPrice}</div>
        )
      },
    },
    {
      title: "Price",
      key: "id",
      width: 80,
      align: "center",
      render: (_: void, pool: Pool) => {
        if (pool.priv && !mime) {
          return null;
        }

        if (pool.isFloat) {
          return <span>N/A</span>;
        }

        return <Pair pool={pool} showPrice showPair={false} />;
      },
    },
  ];
}


interface PLState {
  activePool: Pool | null;
  activeNativeFloatPool: NativeFloatPool | null;
  closeModalVisible: boolean;
  showAlert: boolean;
  scrollY: number;
  showButNotJoin: boolean;
  openDetailModal: boolean;
  listType: number;
  selectedPoolHash: string;
  poolCards: Pool [];
  curPage: number;
  loading: boolean;
  rTokens: any [];
}

interface Page {
  current?: number;
  pageSize?: number;
}

class PoolList extends React.Component<PLProps, PLState> {
  actionRef = createRef<HTMLDivElement>();
  state: PLState = {
    activePool: null,
    activeNativeFloatPool: null,
    closeModalVisible: false,
    showAlert: false,
    scrollY: 0,
    showButNotJoin: false,
    openDetailModal: false,
    listType: this.props.poolType,
    selectedPoolHash: "",
    poolCards: [],
    curPage: 0,
    loading: true,
    rTokens: []
  };

  componentDidMount() {
    this.upateHeight();
    window.addEventListener("resize", this.upateHeight, false);
    document.addEventListener("mousedown", this.hideActionDropDown);
    this.initialCards();
    Axios.get(COINGECKO_URL).then(res => {
        this.setState({
            rTokens: res.data.tokens,
        })
    });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.upateHeight, false);
    document.removeEventListener("mousedown", this.hideActionDropDown);
    if (this.timer) {
      window.clearTimeout(this.timer);
    }
  }

  hideActionDropDown = (event: any) => {
    if (this.actionRef && !this.actionRef.current?.contains(event.target)) {
      this.setState({
        selectedPoolHash: "",
      });
    }
  }

  timer = 0;
  upateHeight = () => {
    this.timer = window.setTimeout(() => {
      clearTimeout(this.timer);
      const pageBody = document.querySelector(".page__body");
      const pageBodyRect = pageBody?.getBoundingClientRect();
      const tabHead = document.querySelector(".ant-table-header");
      const tabHeadReact = tabHead?.getBoundingClientRect();
      if (pageBodyRect && tabHeadReact) {
        const h =
          pageBodyRect.y +
          pageBodyRect.height -
          (tabHeadReact.y + tabHeadReact.height);
        this.setState({
          scrollY: h - 70, // 70px is pagination
        });
        return;
      }

      this.upateHeight();
    }, 300);
  };

  componentDidUpdate() {
    if (this.props.poolupdate || this.state.listType !== this.props.poolType) {
      if (this.props.poolType === 0) {
        this.getPublicPools({});
      }
      else if(this.props.poolType === 1) {
        this.getPrivatePools({});
      }
      else if(this.props.poolType === 2) {
        this.getMimeJoinPools({});
      }
      else if(this.props.poolType === 3) {
        this.getMimePools({});
      }
      this.initialCards();
      this.setState({
        listType: this.props.poolType
      });
      if (this.props.poolupdate) {
        this.props.setPoolUpdate(false);
      }
    }
  }

  prepareJoinPool = async (pool: Pool) => {
    this.setState({
      activePool: pool,
      openDetailModal: true,
      selectedPoolHash: "",
    });
  };

  prepareClosePool = async (pool: Pool) => {
    let nativePool: NativeFloatPool | null = null;
    if (pool.isFloat) {
      nativePool = await getNativePool(pool);
    }
    this.setState({
      activePool: pool,
      activeNativeFloatPool: nativePool,
      closeModalVisible: true,
    });
  };

  private closeCloseModal = () => {
    this.setState({
      activePool: null,
      closeModalVisible: false,
    });
  };

  private viewPool = async (pool: Pool) => {
    this.setState({
      activePool: pool,
      openDetailModal: true,
      selectedPoolHash: "",
    });
  };

  private closeDetailModal = () => {
    this.setState({
      activePool: null,
      openDetailModal: false,
    });
  };

  confirmClosePool = async () => {
    const pool = this.state.activePool;
    if (pool) {
      const text = pool.isFloat
        ? "Close Pool And Withdraw..."
        : "Close Pool ...";
      loading({ text });
      try {
        if (pool.isFloat) {
          await withdrawMime(pool);
        } else if (pool.priv) {
          await closePrivateFixedPool(pool);
        } else {
          await closeFixedPool(pool);
        }
        if (!pool.isFloat) {
          this.props.closePool(pool);
        }
        message.info("Action is successed");
      } catch(e){
        message.info("Action is failed");
      }
      finally {
        hideLoading();
        this.closeCloseModal();
      }
    }
  };

  private getPublicPools = (page: Page) => {
    const { current = 1, pageSize = PAGE_SIZE } = page;
    this.props.setLoading();
    try {
      getPublicPoolList((current - 1) * pageSize, pageSize).then((res) => {
        this.props.setPublicPools(res);
      });
    } catch (e) {
      error(e);
    } finally {
      this.props.setLoaded();
    }
  };

  private getPrivatePools = (page: Page) => {
    const { current = 1, pageSize = PAGE_SIZE } = page;
    this.props.setLoading();
    try {
      getPrivatePoolList((current - 1) * pageSize, pageSize).then((res) => {
        this.props.setPrivatePools(res);
      });
    } catch (e) {
      error(e);
    } finally {
      this.props.setLoaded();
    }
  };

  private getMimePools = (page: Page) => {
    const { current = 1, pageSize = PAGE_SIZE } = page;
    this.props.setLoading();
    try {
      getMimePoolList(
        this.props.address,
        (current - 1) * pageSize,
        pageSize
      ).then((res) => {
        this.props.setMimePools(res);
      });
    } catch (e) {
      error(e);
    } finally {
      this.props.setLoaded();
    }
  };

  private getMimeJoinPools = (page: Page) => {
    const { current = 1, pageSize = PAGE_SIZE } = page;
    this.props.setLoading();
    try {
      getMimeJoinPoolList(
        this.props.address,
        (current - 1) * pageSize,
        pageSize
      ).then((res) => {
        this.props.setMimeJoins(res);
      });
    } catch (e) {
      error(e);
    } finally {
      this.props.setLoaded();
    }
  };

  private withdrawMyjoin = async (pool: Pool) => {
    loading({ text: `Withdraw ...` });
    await withdraw(pool);
    hideLoading();
    this.props.withdrawJoin(pool);
  };

  shareLink = (pool: Pool) => {
    this.props.history.push('/share/' + pool.txHash);
  }

  renderActionButton(disabled: boolean, text: string, onClick: any, pool: Pool) {
    if (disabled) {
      return(
        <div className="action__button disabled">
          <div className="text">{text}</div>
          {text === "Options" && <i className="fa fa-angle-down"/>}
        </div>
      )

    }
    return (
      <div className="action__button" onClick={onClick}>
        <div className="text">{text}</div>
        {text === "Options" && <i className="fa fa-angle-down"/>}
        {this.state.selectedPoolHash === pool.txHash && text === "Options"?
          <div className={this.props.viewType?"action__dropdown":"action__dropdown cardmenu"} ref={this.actionRef}>
            <div className="drop__item" onClick={() => this.prepareJoinPool(pool)}>Join Pool</div>
            <div className="drop__item" onClick={() => this.shareLink(pool)}>Share Link to Pool</div>
          </div>:(null)
        }
      </div>
    )
  }

  selectPool(pool: any) {
    this.setState({
      selectedPoolHash: pool.txHash
    })
  }

  poolFields: ColumnsType<Pool> = [
    ...getPoolFields(false),
    {
      title: "Action",
      key: "id",
      width: 100,
      align: "center",
      render: (_: void, pool: Pool) => {
        // closed or no permissions
        const myAddress = this.props.address;
        if (!myAddress) {
          return (
            this.renderActionButton(isPoolClosed(pool) || pool.priv, 'Options', alertInitWallet, pool)
          )
        }
        const disabled = canotJoinPool(pool, myAddress);

        return (
          this.renderActionButton(disabled, 'Options', () => this.selectPool(pool), pool)
        );
      },
    },
  ];

  mimePoolFields: ColumnsType<Pool> = [
    ...getPoolFields(true),
    {
      title: "Action",
      key: "action",
      width: 100,
      align: "center",
      render: (_: void, pool: Pool) => {
        let opt = "View";
        let handler = () => this.viewPool(pool);

        if (pool.isFloat) {
          //if (!pool.closed) {
            opt = "Withdraw";
            handler = () => this.prepareClosePool(pool);
          //}
          /*if (isPoolExpired(pool) && !pool.closed) {
            opt = "Withdraw";
            handler = () => this.prepareClosePool(pool);
          }*/
        } else {
          if (!pool.closed) {
            opt = isPoolExpired(pool) ? "Claim" : "Close";
            handler = () => this.prepareClosePool(pool);
          }
        }

        return (
          this.renderActionButton(false, opt, handler, pool)
        );
      },
    },
  ];

  mimeJoinPoolFields: ColumnsType<Pool> = [
    ...getPoolFields(false),
    {
      title: "Action",
      key: "action",
      width: 100,
      align: "center",
      render: (_: void, pool: Pool) => {
        const disabled = pool.closed;

        let opt: string = "View";
        let handler = () => this.viewPool(pool);

        if (!disabled) {
          if (isPoolExpired(pool)) {
            if (pool.isFloat) {
              opt = "Withdraw";
              handler = () => this.withdrawMyjoin(pool);
            }
          } else {
            opt = "Join";
            handler = () => this.prepareJoinPool(pool);
          }
        }

        return (
          this.renderActionButton(disabled, opt, handler, pool)
        );
      },
    },
  ];

  openTokenLink = (address: any) => {
    window.open("https://etherscan.io/token/" + address);
  }

  refersh = () => {
    if (this.state.listType === 0) 
        this.getPublicPools({});
    else if(this.state.listType === 1) 
      this.getPrivatePools({});
    else if(this.state.listType === 2) 
      this.getMimeJoinPools({});
    else if(this.state.listType === 3) 
      this.getMimePools({});
  }

  renderCardStatus = (pool: Pool) => {
    let id = "";
    if (pool.priv) id = "P" + pool.poolId;
    else if(pool.isFloat) id = "F" + pool.poolId;
    else id = "" + pool.poolId;
    if (isPoolClosed(pool)) {
      return (
        <div className="card__status">
          <div className="circle closed"/>
          <div className="text closed">Closed</div>
          <div className="id__text">{id}</div>
        </div>
      );
    }

    if (isPoolFilled(pool)) {
      return (
        <div className="card__status">
          <div className="circle filled"/>
          <div className="text filled">Filled</div>
          <div className="id__text">{id}</div>
        </div>
      );
    }
    return (
      <div className="card__status">
        <div className="circle"/>
        <div className="text">Live</div>
          <div className="id__text">{id}</div>
      </div>
    );
  }

  getReceiveAmount(pool: any) {
      const ratio = getRatio(pool.rate, pool.units, pool.trackerDecimals!);
      return parseFloat(ratio).toFixed(2);
  }
  
  initialCards = () => {
    this.setState({
      loading: true
    });
    try {
      this.setState({
        curPage: 0
      })
      if (this.props.poolType === 0)
        getPublicPoolList(0, PAGE_SIZE).then((res) => {
          this.setState({
            poolCards: res.data
          })
        });
      else if (this.props.poolType === 1)
        getPrivatePoolList(0, PAGE_SIZE).then((res) => {
          this.setState({
            poolCards: res.data
          })
        });
      else if (this.props.poolType === 2)
        getMimeJoinPoolList(this.props.address, 0, PAGE_SIZE).then((res) => {
          this.setState({
            poolCards: res.data
          })
        });
      else if (this.props.poolType === 3)
        getMimePoolList(this.props.address, 0, PAGE_SIZE).then((res) => {
          this.setState({
            poolCards: res.data
          })
        });
    } catch (e) {
      error(e);
    } finally {
      this.props.setLoaded();
      this.setState({
        loading: false
      });
    }
  }

  loadMoreCards = () => {
    let page = this.state.curPage + 1;
    this.setState({
      loading: true
    });
    try {
      if (this.props.poolType === 0)
        getPublicPoolList(page * PAGE_SIZE, PAGE_SIZE).then((res) => {
          this.setState({
            poolCards: [...this.state.poolCards, ...res.data]
          });
        });
      else if (this.props.poolType === 1)
        getPrivatePoolList(page * PAGE_SIZE, PAGE_SIZE).then((res) => {
          this.setState({
            poolCards: [...this.state.poolCards, ...res.data]
          });
        });
      else if (this.props.poolType === 2)
        getMimeJoinPoolList(this.props.address, page * PAGE_SIZE, PAGE_SIZE).then((res) => {
          this.setState({
            poolCards: [...this.state.poolCards, ...res.data]
          });
        });
      else if (this.props.poolType === 3)
        getMimePoolList(this.props.address, page * PAGE_SIZE, PAGE_SIZE).then((res) => {
          this.setState({
            poolCards: [...this.state.poolCards, ...res.data]
          });
        });
      this.setState({
        curPage: page
      })
    } catch (e) {
      error(e);
    } finally {
      this.props.setLoaded();
      this.setState({
        loading: false
      });
    }
  }

  render() {
    const {
      closeModalVisible,
      activePool,
      activeNativeFloatPool,
      scrollY,
      openDetailModal,
    } = this.state;

    let { poolCards } = this.state;
  
    let {
      address,
      loading,
      publicPoolsTotal,
      privatePoolsTotal,
      mimePoolsTotal,
      publicPools,
      privatePools,
      mimePools,
      mimeJoinTotal,
      mimeJoinPools,
      filterPools,
      filterTotal,
    } = this.props;

    const page = {
      pageSize: PAGE_SIZE,
    };

    if (filterTotal >= 0) {
      publicPools = [...filterPools];
      publicPoolsTotal = filterTotal;
      poolCards = [...filterPools];
    }

    const modal1 = (
      <Modal
        title="Token Imported"
        visible={openDetailModal}
        footer={false}
        onCancel={this.closeDetailModal}
      >
        <div className="detailed__modal">
            <div className="warning">Anyone can create and name any ERC20 token on Ethereum, including creating fake versions of existing tokens and tokens that claim to represent projects that do not have a token. Similar to Etherscan, this site automatically tracks analytics for all ERC20 tokens independent of token integrity. Please do your own research before interacting with any ERC20 token.</div>
            <div className="tracker__name">{activePool?.trackerSymbol}</div> 
            <div className="token__address" onClick={() => this.openTokenLink(activePool?.tracker)}>
              <div className="address">{activePool?.tracker}</div>
              <i className="fa fa-external-link" aria-hidden="true"></i>
            </div>
            <div className="gray__text">Please click the contract address above to view on Etherscan</div>
            <div className="confirm__button" onClick={() => this.props.setJoinPool(activePool)}>Confirm</div>
        </div>
      </Modal>
    );
    const modal2 = (
      <Modal
        title={`${
          activePool?.isFloat
            ? "Withdraw"
            : isPoolExpired(activePool)
            ? "Claim"
            : "Close"
        } Pool ${activePool?.poolId || ""}`}
        visible={closeModalVisible}
        onCancel={this.closeCloseModal}
        footer={false}
      >
        <div className="detailed__modal">
          {activePool && !activePool.isFloat ? (
            <div className="warning">
              {isPoolExpired(activePool)
                ? "Pool is expired and maximum amount is not reached.Please claim your unswapped tokens."
                : "Submitting this attempt does not guarantee your pool will be closed. Close time depends on the amount of Ethereum network activity and transaction fees. Before closing, other users still have the opportunity to participate in the exchange."}
            </div>
          ) : null}
          {activeNativeFloatPool ? (
            <div className="warning">
              You swapped {activeNativeFloatPool.tokenAmount} for{" "}
              {activeNativeFloatPool.makerReceiveTotal}
            </div>
          ) : null}
          <div className="confirm__button" onClick={this.confirmClosePool}>Confirm</div>
        </div>
      </Modal>
    );
    if (this.props.viewType)
      return (
        <div className="m-pools">
          {this.props.poolType === 0? //Public Pool
            <Table
                columns={this.poolFields}
                dataSource={publicPools.map((pool) => ({
                  key: pool.id,
                  ...pool,
                }))}
                loading={loading}
                pagination={{
                  ...page,
                  total: publicPoolsTotal,
                }}
                onChange={this.getPublicPools}
                scroll={{ y: scrollY }}
              />:(null)}
            {this.props.poolType === 1? //Private Pool
              <Table
                columns={this.poolFields}
                dataSource={privatePools.map((pool) => ({
                  key: pool.id,
                  ...pool,
                }))}
                loading={loading}
                pagination={{
                  ...page,
                  total: privatePoolsTotal,
                }}
                onChange={this.getPrivatePools}
                scroll={{ y: scrollY }}
              />:(null)}
            {this.props.poolType === 2 && address? //Joined Pool
              <Table
                columns={this.mimeJoinPoolFields}
                dataSource={mimeJoinPools.map((pool) => ({
                  key: pool.id,
                  ...pool,
                }))}
                loading={loading}
                pagination={{
                  ...page,
                  total: mimeJoinTotal,
                }}
                onChange={this.getMimeJoinPools}
                scroll={{ y: scrollY }}
              />:(null)}
            {this.props.poolType === 3 && address? //Mine Pool
              <Table
                columns={this.mimePoolFields}
                dataSource={mimePools.map((pool) => ({
                  key: pool.id,
                  ...pool,
                }))}
                loading={loading}
                pagination={{
                  ...page,
                  total: mimePoolsTotal,
                }}
                onChange={this.getMimePools}
                scroll={{ y: scrollY }}
              />:(null)}
          <div className="reload" onClick={this.refersh}>
            <i className="fa fa-refresh" aria-hidden="true"></i>
            <div className="reload__text">Refresh</div>
          </div>
          {modal1}
          {modal2}
        </div>
      );
    return (
      <div className="card__view">
        <InfiniteScroll
          hasMore={true}
          loadMore={this.loadMoreCards}
          pageStart={1}
          initialLoad={false}
        >
          <div className="card__view__container">
            {poolCards.map((pool, index) => {
              let amount;
              let left;
              let p;
              let p100 = "N/A";
              if (!pool.isFloat) {
                amount = ethers.FixedNumber.from(pool.amount);
                left = ethers.FixedNumber.from(pool.leftAmount);
                p = left.divUnsafe(amount).toString();
                p100 = ((1 - parseFloat(p)) * 100).toFixed(1);
              }
              let actionbutton;
              const myAddress = this.props.address;
              if (this.props.poolType < 2) {
                if (!myAddress) {
                  actionbutton = this.renderActionButton(isPoolClosed(pool) || pool.priv, 'Options', alertInitWallet, pool);
                } else {
                  const disabled = canotJoinPool(pool, myAddress);
                  actionbutton = this.renderActionButton(disabled, 'Options', () => this.selectPool(pool), pool);
                }
              } else if (this.props.poolType === 2) {
                const disabled = pool.closed;
                let opt: string = "View";
                let handler = () => this.viewPool(pool);
                if (!disabled) {
                  if (isPoolExpired(pool)) {
                    if (pool.isFloat && pool.canWithDrawJoin) {
                      opt = "Withdraw";
                      handler = () => this.withdrawMyjoin(pool);
                    }
                  } else {
                    opt = "Join";
                    handler = () => this.prepareJoinPool(pool);
                  }
                }
                actionbutton = this.renderActionButton(disabled, opt, handler, pool);
              } else if (this.props.poolType === 3) {
                let opt = "View";
                let handler = () => this.viewPool(pool);
                if (pool.isFloat) {
                  //if (isPoolExpired(pool)) {
                    opt = "Withdraw";
                    handler = () => this.prepareClosePool(pool);
                  //}
                } else {
                  if (!pool.closed) {
                    opt = isPoolExpired(pool) ? "Claim" : "Close";
                    handler = () => this.prepareClosePool(pool);
                  }
                }
                actionbutton = this.renderActionButton(false, opt, handler, pool);
              }
              let marketPrice;
              if (!pool.marketPrice || pool.marketPrice === '...') {
                marketPrice = '...'
              } else {
                marketPrice = "$" + new BigNumber(parseInt(pool.marketPrice)).dividedBy(new BigNumber(10).pow(8)).toFixed(4).toString();
              }
              let priceStr;
              if (pool.isFloat) {
                priceStr = "N/A";
              } else {
                const ratio = getRatio(pool.rate, pool.units, pool.trackerDecimals!);
                const ethPrice = this.props.ethPrice;
              
                const price = ethPrice ? parseFloat(ethPrice) / parseFloat(ratio) : 0;
                priceStr = price < 0.0001 ? `< $0.0001` : `$${price.toFixed(4)}`;
              }

              let logoURI;
              const bToken = this.state.rTokens.find((token: any) => token.symbol === pool.trackerSymbol);
              if (bToken && bToken.logoURI) logoURI = bToken.logoURI;
              else logoURI = require(`src/style/assets/infinite.svg`);
              return (
                <div className="card" key={index}>
                  {this.renderCardStatus(pool)}
                  <div className="card__header">
                    <img src={logoURI} alt=""/>
                    <img className="token__logo" src={Img_Eth} alt=""/>
                    <div className="sale__text">{pool.name}</div>
                  </div>
                  <div className="sale__text">{pool.name}</div>
                  <div className="detail__info">
                    <div className="dname">Contract</div>
                    <div className="dvalue link" onClick={() => this.openTokenLink(pool.tracker)}>{shortHash(pool.tracker)}</div>
                  </div>
                  <div className="detail__info">
                    <div className="dname">Pool Pair</div>
                    <div className="dvalue gray">{(pool.trackerSymbol || "") + "/ETH"}</div>
                  </div>
                  <div className="detail__info">
                    <div className="dname">Swap Ratio</div>
                    {!pool.isFloat?
                      <div className="dvalue gray">{this.getReceiveAmount(pool)}:1</div>:
                      <div className="dvalue gray">Floating</div>}
                  </div>
                  {pool.isFloat?
                    <div className="card__remaining">
                      <div className="back">
                        <div className="fill"/>
                      </div>
                      <div className="progress">N/A</div>
                    </div>:
                    <div className="card__remaining">
                      <div className="back">
                        <div className="fill" style={{width: p100 + '%'}}/>
                      </div>
                      <div className="progress">{p100}%</div>
                    </div>}
                  <div className="detail__info">
                    <div className="dname">Market Price</div>
                    <div className="dvalue gray">{marketPrice}</div>
                  </div>
                  <div className="detail__info">
                    <div className="dname">Price</div>
                    <div className="dvalue gray">{priceStr}</div>
                  </div>
                  {actionbutton}
                </div>
              )
            })}
          </div>
          {poolCards && poolCards.length ?(null):<div className="nodata">No Data</div>}
          {this.state.loading && <div className="loader"/>}
        </InfiniteScroll>
        {modal1}
        {modal2}
      </div>
    )
  }
}

export default connector(PoolList);