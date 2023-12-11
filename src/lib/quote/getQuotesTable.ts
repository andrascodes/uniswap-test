import { AMOUNTS, Quote, Quoter } from "@/lib/quote/config";
import { ERC20Metadata, toBN } from "@/lib/utils";
import { formatUnits } from "ethers/lib/utils.js";
import { getQuotes } from "./getQuotes";

const createAmounts = (amounts: Big[], decimals: number) => {
  return amounts.map((amount) => {
    return { amount: toBN(amount, decimals) };
  });
};

type QuotesTableRow = {
  quote: Quote | undefined;
  error?: Error;
  quoter: Quoter;
};
type QuotesTable = Record<string, QuotesTableRow[]>;

export const getQuotesTable = async (
  source: ERC20Metadata,
  destination: ERC20Metadata
) => {
  const quotes = await getQuotes(
    source,
    destination,
    createAmounts(AMOUNTS, source.decimals)
  );

  const table: QuotesTable = quotes.reduce<QuotesTable>(
    (acc, { amount, quoter, quote, error }) => {
      const amountNumber = formatUnits(amount, source.decimals);
      if (!acc[amountNumber]) {
        acc[amountNumber] = [];
      }
      acc[amountNumber].push({ quote, error, quoter });
      return acc;
    },
    {}
  );
  return table;
};
