import { ERC20Metadata, fromBN, toBN } from "@/lib//utils";
import { GetQuoteBaseParams, QUOTERS, Quote, Quoter } from "@/lib/quote/config";
import Big from "big.js";
import { BigNumber } from "ethers";
import { getQuotes } from "./getQuotes";

/**
 * For calculating the best split quote for a given trade size (amount), we want to get quotes from all of the providers for different split percentages:
 * All percentages: [1,2,3,...,19] * DISTRIBUTION_PERCENT (default: 5) = [5, 10, 15, ..., 50, ...80, 85, 90, 95]
 * We get the quotes for 5%, 10%, ..., 95% of trade sizes from each provider.
 */
const PERCENT_INDEXES = Array.from({ length: 19 }, (_, i) => i + 1);
const DISTRIBUTION_PERCENT = 5;

// Returns the amounts for each percentages for a given trade size
const getDistributedAmountPairs = (tradeSize: BigNumber) => {
  const tradeSizeDec = fromBN(tradeSize);
  return PERCENT_INDEXES.map((percentIndex) => ({
    amount: toBN(
      tradeSizeDec.mul(new Big(percentIndex * DISTRIBUTION_PERCENT).div(100))
    ),
  }));
};

export const getBestSplitQuote = async (
  source: ERC20Metadata,
  destination: ERC20Metadata,
  amount: BigNumber
) => {
  if (QUOTERS.length < 2) {
    throw new Error("Not enough quoters configured to get split quote");
  }

  const splitAmountPairs = getDistributedAmountPairs(amount);

  // A flat array of quotes from all providers for all percentages
  // [uniV2_5%, uniV3_5%, ..., uniV2_95%, uniV3_95%]
  const quotes = await getQuotes(source, destination, splitAmountPairs);

  let bestQuote:
    | ({
        minorQuoter: Quoter;
        minorPercent: string;
        majorQuoter: Quoter;
        majorPercent: string;
        quote: Quote;
      } & GetQuoteBaseParams)
    | undefined = undefined;

  // Iterate array by taking from the beginning and end
  // Beginning: 5%, 10%, 15%, 20%, 25%, 30%, 35%, 40%, 45%, 50%
  // End      : 95%, 90%, 85%, 80%, 75%, 70%, 65%, 60%, 55%, 50%
  const chunkSize = QUOTERS.length;
  for (let i = 0; i <= quotes.length / chunkSize; i += chunkSize) {
    // [uniV2_5%, uniV3_5%]
    const minorQuotes = quotes.slice(i, i + chunkSize);
    // [uniV2_95%, uniV3_95%]
    const majorQuotes = quotes.slice(
      quotes.length - i - chunkSize,
      quotes.length - i
    );

    // take all combinations of minor and major quotes:
    // [uniV2_5%, uniV3_95%], [uniV2_95%, uniV3_5%] - same quoters and undefined quotes are filtered out
    for (let j = 0; j < minorQuotes.length; j++) {
      const minorQuote = minorQuotes[j];

      // ignore if at least one quote is undefined
      if (!minorQuote.quote) continue;

      for (let k = 0; k < majorQuotes.length; k++) {
        const majorQuote = majorQuotes[k];

        // ignore if at least one quote is undefined
        if (!majorQuote.quote) continue;

        // ignore same providers
        if (minorQuote.quoter == majorQuote.quoter) continue;

        // both defined and from different providers - add quotes together = splitQuote
        const {
          quote: { quoteGasAdjusted: minorQuoteGasAdjusted },
          quoter: minorQuoter,
        } = minorQuote;
        const {
          quote: { quoteGasAdjusted: majorQuoteGasAdjusted },
          quoter: majorQuoter,
        } = majorQuote;
        const splitQuote = new Big(minorQuoteGasAdjusted).add(
          majorQuoteGasAdjusted
        );

        const minorPercentIndex = i / chunkSize + 1;
        const minorPercent = new Big(
          minorPercentIndex * DISTRIBUTION_PERCENT
        ).div(100);
        const majorPercentIndex = (quotes.length - i) / chunkSize;
        const majorPercent = new Big(
          majorPercentIndex * DISTRIBUTION_PERCENT
        ).div(100);

        if (!bestQuote || splitQuote.gt(bestQuote.quote.quoteGasAdjusted)) {
          bestQuote = {
            minorQuoter,
            majorQuoter,
            amount,
            source,
            destination,
            quote: {
              quoteGasAdjusted: splitQuote.toString(),
            },
            minorPercent: minorPercent.toString(),
            majorPercent: majorPercent.toString(),
          };
        }
      }
    }
  }
  return bestQuote;
};
