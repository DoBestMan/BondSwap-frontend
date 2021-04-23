interface EpochInfo {
    id: string;
    n: string;
    k: string;
    t: string;
    nodeList: string[];
    prevEpoch: string;
    nextEpoch: string;
}

interface NodeInfo {
    declaredIp: string;
    position: string;
    pubKx: string;
    pubKy: string;
    tmP2PListenAddress: string;
    p2pListenAddress: string;
}

interface TorusNodePub {
    X: string;
    Y: string;
}

interface NodeDetails {
    currentEpoch: string;
    nodeListAddress: string;
    torusNodeEndpoints: string[];
    torusIndexes: number[];
    torusNodePub: TorusNodePub[];
    updated: boolean;
}

interface NodeDetailManagerCtorArgs {
    network?: string;
    proxyAddress?: string;
}

declare class NodeDetailManager {
    constructor(args: NodeDetailManagerCtorArgs);
    getNodeDetails(skip?: boolean): Promise<NodeDetails>;
    getNodeEndpoint(nodeEthAddress: string): Promise<NodeInfo>;
    getEpochInfo(epoch: number): Promise<EpochInfo>;
    getCurrentEpoch(): Promise<string>;
}

export as namespace FetchNodeDetails;

export = NodeDetailManager;