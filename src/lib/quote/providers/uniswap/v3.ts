import { GetQuoteFn } from "@/lib/quote/config";
import { Protocol } from "@uniswap/router-sdk";
import { createGetQuote } from "./createGetQuote";

export const getUniswapV3Quote: GetQuoteFn = createGetQuote({
  protocols: [Protocol.V3],
});
