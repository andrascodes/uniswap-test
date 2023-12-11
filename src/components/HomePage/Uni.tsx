import { AMOUNTS, QUOTERS } from "@/lib/quote/config";
import { getBestSplitQuote } from "@/lib/quote/getBestSplitQuote";
import { getQuotesTable } from "@/lib/quote/getQuotesTable";
import {
  getERC20Metadata,
  printCurrency,
  printPercent,
  toBN,
} from "@/lib/utils";
import { USDC_ADDR, WETH_ADDR } from "@/lib/wagmi/erc20Addresses";
import Big from "big.js";

export const revalidate = 10;

const LAST_AMOUNT = AMOUNTS[AMOUNTS.length - 1];

type BestSplitQuote = Awaited<ReturnType<typeof getBestSplitQuote>>;

function BestSplitQuoteHeader({
  bestSplitQuote,
}: {
  bestSplitQuote: BestSplitQuote;
}) {
  if (!bestSplitQuote) return null;
  const { minorQuoter, majorQuoter, majorPercent, minorPercent } =
    bestSplitQuote;

  const majorQuoterName = QUOTERS.find((q) => q.quoter == majorQuoter)?.name;
  const minorQuoterName = QUOTERS.find((q) => q.quoter == minorQuoter)?.name;

  if (!majorQuoterName || !minorQuoterName) return null;

  const name = `${majorQuoterName} (${printPercent(
    majorPercent
  )}) + ${minorQuoterName} (${printPercent(minorPercent)})`;

  return <th>{name}</th>;
}

function BestSplitQuoteCell({
  bestSplitQuote,
}: {
  bestSplitQuote: BestSplitQuote;
}) {
  if (!bestSplitQuote) return null;
  const { quote } = bestSplitQuote;

  return <td>{printCurrency(quote.quoteGasAdjusted, "USD")}</td>;
}

export default async function Uni() {
  const [wethMetadata, usdcMetadata] = await Promise.all([
    getERC20Metadata(WETH_ADDR),
    getERC20Metadata(USDC_ADDR),
  ]);

  const quotesTable = await getQuotesTable(wethMetadata, usdcMetadata);
  const bestSplitQuote = await getBestSplitQuote(
    wethMetadata,
    usdcMetadata,
    toBN(LAST_AMOUNT)
  );

  return (
    <div>
      <h1>
        Swap {wethMetadata.name} to {usdcMetadata.name} (How much do you receive
        in USD?)
      </h1>
      <table>
        <thead>
          <tr>
            <th>Trade sizes</th>
            {QUOTERS.map(({ name, quoter }) => (
              <th key={quoter}>{name}</th>
            ))}
            <BestSplitQuoteHeader bestSplitQuote={bestSplitQuote} />
          </tr>
        </thead>
        <tbody>
          {Object.entries(quotesTable).map(([amount, quotes]) => (
            <tr key={amount}>
              <td>{amount}</td>
              {QUOTERS.map(({ quoter }) => {
                const quoteIndex = quotes.findIndex((q) => q.quoter == quoter);
                const value = quotes[quoteIndex]?.quote?.quoteGasAdjusted;
                return (
                  <td key={`quote-${quoter}-${quoteIndex}`}>
                    {value ? printCurrency(value, "USD") : "N/A"}
                  </td>
                );
              })}
              {new Big(amount).eq(LAST_AMOUNT) ? (
                <BestSplitQuoteCell bestSplitQuote={bestSplitQuote} />
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
