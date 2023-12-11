import {
  usdcTestMetadata,
  wethTestMetadata,
} from "@/lib/wagmi/erc20Addresses.js";
import { parseEther } from "ethers/lib/utils.js";
import { describe, expect, test, vi } from "vitest";
import { Quote } from "./config";
import { getQuotes } from "./getQuotes";

const RESULT = "2323.22";
const TEST_QUERY = {
  values: [
    { amount: parseEther("1"), a: 1 },
    { amount: parseEther("2"), a: 2 },
    { amount: parseEther("3"), a: 3 },
  ],
  source: wethTestMetadata,
  destination: usdcTestMetadata,
};

const mocks = vi.hoisted(() => {
  return {
    QUOTERS: [
      { quoteFn: vi.fn(), quoter: "uniV2", name: "Uniswap V2" },
      { quoteFn: vi.fn(), quoter: "uniV3", name: "Uniswap V3" },
    ] as const,
  };
});

vi.mock("./config", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./config")>();
  return {
    ...mod,
    // replace some exports
    QUOTERS: mocks.QUOTERS,
  };
});

function isEveryQuoteCorrect(
  quotes: Awaited<
    ReturnType<typeof getQuotes<(typeof TEST_QUERY.values)[number]>>
  >,
  testError: Error | undefined,
  testQuote: Quote | undefined
) {
  let correct = true;

  const chunkSize = mocks.QUOTERS.length;
  for (let i = 0; i <= quotes.length / chunkSize; i += chunkSize) {
    const chunk = quotes.slice(i, i + chunkSize);
    const valuesInd = i / chunkSize;
    correct = chunk.every(
      ({ a, amount, destination, error, quote, quoter, source }, ind) =>
        a == TEST_QUERY.values[valuesInd].a &&
        amount.eq(TEST_QUERY.values[valuesInd].amount) &&
        destination == TEST_QUERY.destination &&
        error == testError &&
        quote == testQuote &&
        quoter == mocks.QUOTERS[ind].quoter &&
        source == TEST_QUERY.source
    );
  }

  return correct;
}

describe("getQuotes", () => {
  test("should return error in results object if it happened in one of the quoteFns", async () => {
    const TEST_ERROR = new Error("Error fetching route");
    mocks.QUOTERS.forEach(({ quoteFn }) =>
      quoteFn.mockRejectedValue(TEST_ERROR)
    );

    const quotes = await getQuotes(
      TEST_QUERY.source,
      TEST_QUERY.destination,
      TEST_QUERY.values
    );
    expect(quotes).toHaveLength(
      TEST_QUERY.values.length * mocks.QUOTERS.length
    );
    expect(isEveryQuoteCorrect(quotes, TEST_ERROR, undefined)).toBe(true);
  });

  test("should return undefined for quote.quoteGasAdjusted if quote was not found", async () => {
    mocks.QUOTERS.forEach(({ quoteFn }) =>
      quoteFn.mockResolvedValue(undefined)
    );

    const quotes = await getQuotes(
      TEST_QUERY.source,
      TEST_QUERY.destination,
      TEST_QUERY.values
    );
    expect(quotes).toHaveLength(
      TEST_QUERY.values.length * mocks.QUOTERS.length
    );
    expect(isEveryQuoteCorrect(quotes, undefined, undefined)).toBe(true);
  });

  test("should return quote.quoteGasAdjusted if quote was found", async () => {
    const TEST_QUOTE = { quoteGasAdjusted: RESULT };
    mocks.QUOTERS.forEach(({ quoteFn }) =>
      quoteFn.mockResolvedValue(TEST_QUOTE)
    );

    const quotes = await getQuotes(
      TEST_QUERY.source,
      TEST_QUERY.destination,
      TEST_QUERY.values
    );
    expect(quotes).toHaveLength(
      TEST_QUERY.values.length * mocks.QUOTERS.length
    );
    expect(isEveryQuoteCorrect(quotes, undefined, TEST_QUOTE)).toBe(true);
  });
});
