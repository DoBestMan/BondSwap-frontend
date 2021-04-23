import React from "react";
import { BrowserRouter as Router, Switch, Route, Redirect } from "react-router-dom";
import Nav from "src/components/pc-nav";
import Swap from "./Swap";
import Pool from "./Pool";
import Share from "./Share";
import Join from "./Join";
import LogIn from "./LogIn";
import MobileNav from "src/components/mobile-nav";
import Showcase from './ComingSoon';
// import ShowcaseDetail from './ShowcaseDetail';
// import ShowcaseNft from './ShowcaseNft';
// import NFTSwap from './NFTSwap';

import "./index.less";

function Routes() {
  return (
    <Router>
      <MobileNav/>
      <div className="page">
        <Nav />
        <Switch>
            <Route exact path="/" component={LogIn}/>
            <Route exact path="/swap" component={Swap}/>
            <Route path="/pools" component={Pool}/>
            <Route path="/share/:id" component={Share} />
            <Route path="/pool/:id" component={Join} />
            <Route path="/showcase" component={Showcase} />
            {/* <Route path="/showcaseNFT/:id" component={ShowcaseNft} />
            <Route path="/showcaseDetail" component={ShowcaseDetail} />
            <Route path="/nftswap" component={NFTSwap} /> */}
            <Route render={() => <Redirect to="/"/>}/>
        </Switch>
      </div>
    </Router>
  );
}

export default Routes;
