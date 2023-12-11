import { IUniswapV2Pair } from "@/lib/wagmi/abis/IUniswapV2Pair";
import { IUniswapV2Router02 } from "@/lib/wagmi/abis/IUniswapV2Router02";
import { defineConfig, loadEnv } from "@wagmi/cli";
import { actions } from "@wagmi/cli/plugins";
import { erc20ABI } from "wagmi";

export default defineConfig(() => {
  loadEnv({
    mode: process.env.NODE_ENV ?? "development",
    envDir: process.cwd(),
  });

  return {
    out: "src/lib/wagmi/generated.ts",
    contracts: [
      {
        name: "uniV2Pair",
        abi: IUniswapV2Pair.abi,
      },
      {
        name: "uniV2Router02",
        abi: IUniswapV2Router02.abi,
        address: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
      },
      {
        name: "erc20",
        abi: erc20ABI,
      },
    ],
    plugins: [
      actions({
        readContract: true,
      }),
    ],
  };
});
