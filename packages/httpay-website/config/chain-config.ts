import { assetLists, chains } from "@chain-registry/v2";


export const defaultChainName = 'neutrontestnet'
export const defaultRpcEndpoint = 'https://rpc-falcron.pion-1.ntrn.tech'

export const defaultChain = chains.find((chain) => chain.chainName === defaultChainName)
