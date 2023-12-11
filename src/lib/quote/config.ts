import { ERC20Metadata } from "@/lib/utils";
import Big from "big.js";
import { BigNumber } from "ethers";
import { getUniswapV2Quote, getUniswapV3Quote } from "./providers";

export const AMOUNTS = [
  new Big("1"),
  new Big("10"),
  new Big("100"),
  new Big("1000"),
  new Big("10000"),
];

export type QuoterConfig = {
  quoteFn: GetQuoteFn;
  quoter: Quoter;
  name: string;
};

// Add new Quoters here
export enum Quoter {
  UNIV2 = "uniV2",
  UNIV3 = "uniV3",
}
// And here:
export const QUOTERS: QuoterConfig[] = [
  { quoteFn: getUniswapV2Quote, quoter: Quoter.UNIV2, name: "Uniswap V2" },
  { quoteFn: getUniswapV3Quote, quoter: Quoter.UNIV3, name: "Uniswap V3" },
];

export type Quote = {
  quoteGasAdjusted: string;
};

export type GetQuoteBaseParams = {
  source: ERC20Metadata;
  destination: ERC20Metadata;
  amount: BigNumber;
};

type GetQuoteGeneric<T> = (params: GetQuoteBaseParams) => Promise<T>;
export type GetQuoteFn = GetQuoteGeneric<Quote | undefined>;

export const createQuoteFns = (quoters: QuoterConfig[]) =>
  quoters.map(({ quoteFn, quoter, name }) => {
    return {
      getQuote: async <T extends GetQuoteBaseParams>(props: T) => {
        return quoteFn(props)
          .then((quote) => ({
            error: undefined,
            quote,
            quoter,
            ...props,
          }))
          .catch((error: Error) => ({
            error,
            quote: undefined,
            quoter,
            ...props,
          }));
      },
      quoter,
      name,
    };
  });
