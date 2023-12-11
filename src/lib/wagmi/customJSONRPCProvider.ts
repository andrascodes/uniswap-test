/**
 * Copy of jsonRpcProvider.ts from @wagmi/core
 * Added the option of `skipFetchSetup` to initializing the provider
 * This is needed so the provider works with Next.js 14 Server-side
 * Source: https://github.com/ethers-io/ethers.js/issues/1886#issuecomment-1063531514
 */

import { Chain, ChainProviderFn, FallbackProviderConfig } from "@wagmi/core";
import { providers } from "ethers";

export type JsonRpcProviderConfig = FallbackProviderConfig & {
  rpc: (chain: Chain) => { http: string; webSocket?: string } | null;
  static?: boolean;
};

export function customJsonRpcProvider<TChain extends Chain = Chain>({
  priority,
  rpc,
  stallTimeout,
  static: static_ = true,
  weight,
}: JsonRpcProviderConfig): ChainProviderFn<
  TChain,
  providers.JsonRpcProvider,
  providers.WebSocketProvider
> {
  return function (chain) {
    const rpcConfig = rpc(chain);
    if (!rpcConfig || rpcConfig.http === "") return null;
    return {
      chain: {
        ...chain,
        rpcUrls: {
          ...chain.rpcUrls,
          default: { http: [rpcConfig.http] },
        },
      },
      provider: () => {
        const RpcProvider = static_
          ? providers.StaticJsonRpcProvider
          : providers.JsonRpcProvider;
        const provider = new RpcProvider(
          { url: rpcConfig.http, skipFetchSetup: true },
          {
            ensAddress: chain.contracts?.ensRegistry?.address,
            chainId: chain.id,
            name: chain.network,
          }
        );
        return Object.assign(provider, { priority, stallTimeout, weight });
      },
      ...(rpcConfig.webSocket && {
        webSocketProvider: () =>
          new providers.WebSocketProvider(
            rpcConfig.webSocket as string,
            chain.id
          ),
      }),
    };
  };
}
