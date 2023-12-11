import { createQuoteFns, QUOTERS } from "@/lib/quote/config";
import { ERC20Metadata } from "@/lib/utils";
import { BigNumber } from "ethers";

export async function getQuotes<T extends { amount: BigNumber }>(
  source: ERC20Metadata,
  destination: ERC20Metadata,
  values: T[]
) {
  const quotePromises = values
    .map(({ amount, ...props }) => {
      return createQuoteFns(QUOTERS).map(({ getQuote }) =>
        getQuote({ source, destination, amount, ...props })
      );
    })
    .flat();

  const quotes = await Promise.all(quotePromises);
  return quotes;
}
