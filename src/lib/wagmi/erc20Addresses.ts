import { ERC20Metadata } from "../utils";

export const WETH_ADDR = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
export const USDC_ADDR = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

export const wethTestMetadata: ERC20Metadata = {
  address: WETH_ADDR,
  decimals: 18,
  symbol: "WETH",
  name: "Wrapped Ether",
};

export const usdcTestMetadata: ERC20Metadata = {
  address: USDC_ADDR,
  decimals: 6,
  symbol: "USDC",
  name: "USD Coin",
};
