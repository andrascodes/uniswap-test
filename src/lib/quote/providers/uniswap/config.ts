import { client } from "@/lib/wagmi/config";
import { ChainId } from "@uniswap/sdk-core";
import { AlphaRouter } from "@uniswap/smart-order-router";

export const chainId = ChainId.MAINNET;

export const router = new AlphaRouter({
  chainId,
  provider: client.getProvider(),
});
