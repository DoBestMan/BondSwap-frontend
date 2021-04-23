import React, { createRef } from "react";
import { connect, ConnectedProps } from "react-redux";
import type { State } from "src/store/state";
import { createSearchResult } from "src/store/actions";
import { Input } from "antd";
import { getPoolById, getPoolsByTracker, getPoolsBySymbol } from "src/api/pool";
import { error } from "src/utils/_";

import "./index.less";

import Img_Check from "src/style/assets/check.svg";

const connector = connect((state: State) => state, {
  setSearchResult: (payload: any) => createSearchResult(payload),
});

type PropsFromRedux = ConnectedProps<typeof connector>;

interface SearchProps extends PropsFromRedux {}

interface SearchState {
  searchType: string;
  searching: boolean;
  searchText: string;
  showDropdown: boolean;
}

class _Search extends React.Component<SearchProps, SearchState> {
  static defaultSearchType = "token";
  optionRef = createRef<HTMLDivElement>();

  state = {
    searchType: _Search.defaultSearchType,
    searching: false,
    searchText: "",
    showDropdown: false,
  };

  componentDidMount() {
    document.addEventListener("mousedown", this.hideDropDown);
  }

  componentWillUnmount() {
    document.removeEventListener("mousedown", this.hideDropDown);
  }

  hideDropDown = (event: any) => {
    if (this.optionRef && !this.optionRef.current?.contains(event.target)) {
      this.setState({
        showDropdown: false,
      });
    }
  }

  onChangeSearchType = (typ: string) => {
    this.setState({
      searchType: typ,
      showDropdown: false
    });
  };

  onSearchTextChange = (e: any) => {
    this.setState({
      searchText: e.target.value
    })
  }

  onKeyPress = (event: any) => {
    if (event.key === 'Enter') {
      this.onSearch();
    }
  }

  onSearch = async () => {
    let searchValue: string = this.state.searchText;
    if (this.state.searching) {
      return;
    }
    if (!searchValue) {
      this.props.setSearchResult({
        total: -1,
        data: [],
        type: -1,
        value: '',
      });
      return;
    }

    try {
      this.setState({
        searching: true,
      });

      searchValue = searchValue.trim();
      switch (this.state.searchType) {
        case "token":
          const res = await getPoolsBySymbol(searchValue);
          this.props.setSearchResult({
            total: res.total,
            data: res.data,
            type: 1,
            value: searchValue
          });
          break;
        case "address":
          const res2 = await getPoolsByTracker(searchValue);
          this.props.setSearchResult({
            total: res2.total,
            data: res2.data,
            type: 2,
            value: searchValue
          });
          break;
        case "id":
          const pool = await getPoolById(searchValue);
          if (pool && pool.txHash) {
            this.props.setSearchResult({
              total: 1,
              data: [pool],
              type: 0,
              value: searchValue
            });
          } else {
            this.props.setSearchResult({
              total: 0,
              data: [],
              type: 0,
              value: searchValue
            });
          }
      }
    } catch (err) {
      error(`failed to search: ${searchValue} ${err}`);
    } finally {
      this.setState({
        searching: false,
      });
    }
  };

  showOptionDropDown = () => {
    this.setState({
      showDropdown: true
    })
  }

  renderDropText() {
    if (this.state.searchType === "id")
      return (
        <div className="selected__text">Pool ID</div>
      )
    else if (this.state.searchType === "token")
        return (
          <div className="selected__text">Token Ticker</div>
        )
    return (
      <div className="selected__text">Token Contract</div>
    )
  }

  render() {
    return (
      <div className="m-search">
        <div className="drop__part" onClick={this.showOptionDropDown}>
          {this.renderDropText()}
          <i className="fa fa-angle-down"/>
        </div>
        {this.state.showDropdown?
            <div className="option__dropdown" ref={this.optionRef}>
              {this.state.searchType==="id"?
                <div className="option__row">
                  <div className="text selected">Pool ID</div>
                  <img src={Img_Check} alt=""/>
                </div>:
                <div className="option__row" onClick={() => this.onChangeSearchType("id")}>
                  <div className="text">Pool ID</div>
                </div>}
              {this.state.searchType==="token"?
                <div className="option__row">
                  <div className="text selected">Token Ticker</div>
                  <img src={Img_Check} alt=""/>
                </div>:
                <div className="option__row" onClick={() => this.onChangeSearchType("token")}>
                  <div className="text">Token Ticker</div>
                </div>}
              {this.state.searchType==="address"?
                <div className="option__row">
                  <div className="text selected">Token Contract</div>
                  <img src={Img_Check} alt=""/>
                </div>:
                <div className="option__row" onClick={() => this.onChangeSearchType("address")}>
                  <div className="text">Token Contract</div>
                </div>}
            </div>:(null)}
        <div className="input__part">
          <Input
            placeholder="Search a pool ..."
            onChange={this.onSearchTextChange}
            value={this.state.searchText}
            onKeyPress={this.onKeyPress}
          />
          <div className="search__button" onClick={this.onSearch}>Search</div>
        </div>
      </div>
    );
  }
}

export default connector(_Search);
