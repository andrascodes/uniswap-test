import { configureChains, createClient, mainnet } from "@wagmi/core";
import { customJsonRpcProvider } from "./customJSONRPCProvider";

export const RPC_URL = `https://eth-mainnet.g.alchemy.com/v2/C-Y0-rc69GCL-DbjraHWA5wwK5bwjqNz`;

export const { chains, provider } = configureChains(
  [mainnet],
  [
    customJsonRpcProvider({
      rpc: () => ({
        http: RPC_URL,
      }),
    }),
  ]
);

export const client = createClient({
  provider,
});
