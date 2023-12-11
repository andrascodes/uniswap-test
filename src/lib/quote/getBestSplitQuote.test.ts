import Big from "big.js";
import { parseEther } from "ethers/lib/utils.js";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { usdcTestMetadata, wethTestMetadata } from "../wagmi/erc20Addresses";
import * as config from "./config";
import { Quoter } from "./config";
import { getBestSplitQuote } from "./getBestSplitQuote";
import { getQuotes } from "./getQuotes";

const mocks = vi.hoisted(() => {
  return {
    getQuotes: vi.fn(),
  };
});

vi.mock("./getQuotes", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./getQuotes")>();
  return {
    ...mod,
    // replace some exports
    getQuotes: mocks.getQuotes,
  };
});

describe("getBestSplitQuote", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });
  test("throw an error due to not enough quoters configured for split quoting", async () => {
    vi.spyOn(config, "QUOTERS", "get").mockReturnValue([
      {
        quoter: Quoter.UNIV2,
        quoteFn: () => Promise.resolve(undefined),
        name: "Uniswap V2",
      },
    ]);

    expect(() =>
      getBestSplitQuote(wethTestMetadata, usdcTestMetadata, parseEther("1"))
    ).rejects.toThrowError("Not enough quoters");
  });

  test("should return undefined if there are not enough quotes from multiple providers", async () => {
    vi.spyOn(config, "QUOTERS", "get").mockReturnValue(config.QUOTERS);
    const TEST_QUOTES: Awaited<ReturnType<typeof getQuotes>> = [
      {
        quote: { quoteGasAdjusted: "1" },
        amount: parseEther("1"),
        error: undefined,
        quoter: Quoter.UNIV2,
        source: wethTestMetadata,
        destination: usdcTestMetadata,
      },
      {
        quote: undefined,
        amount: parseEther("1"),
        error: undefined,
        quoter: Quoter.UNIV3,
        source: wethTestMetadata,
        destination: usdcTestMetadata,
      },
      {
        quote: {
          quoteGasAdjusted: "1",
        },
        amount: parseEther("1"),
        error: undefined,
        quoter: Quoter.UNIV2,
        source: wethTestMetadata,
        destination: usdcTestMetadata,
      },
      {
        quote: undefined,
        amount: parseEther("1"),
        error: undefined,
        quoter: Quoter.UNIV2,
        source: wethTestMetadata,
        destination: usdcTestMetadata,
      },
    ];
    mocks.getQuotes.mockResolvedValue(TEST_QUOTES);

    const bestSplitQuotePromise = getBestSplitQuote(
      wethTestMetadata,
      usdcTestMetadata,
      parseEther("1")
    );

    expect(bestSplitQuotePromise).resolves.toBeUndefined();
  });

  test("should return best split quote", async () => {
    vi.spyOn(config, "QUOTERS", "get").mockReturnValue(config.QUOTERS);

    const biggerQuote = "2";

    const TEST_QUOTES: Awaited<ReturnType<typeof getQuotes>> = [
      {
        quote: {
          quoteGasAdjusted: "1",
        },
        amount: parseEther("1"),
        error: undefined,
        quoter: Quoter.UNIV2,
        source: wethTestMetadata,
        destination: usdcTestMetadata,
      },
      {
        quote: {
          quoteGasAdjusted: biggerQuote,
        },
        amount: parseEther("1"),
        error: undefined,
        quoter: Quoter.UNIV3,
        source: wethTestMetadata,
        destination: usdcTestMetadata,
      },
      {
        quote: {
          quoteGasAdjusted: biggerQuote,
        },
        amount: parseEther("1"),
        error: undefined,
        quoter: Quoter.UNIV2,
        source: wethTestMetadata,
        destination: usdcTestMetadata,
      },
      {
        quote: {
          quoteGasAdjusted: "1",
        },
        amount: parseEther("1"),
        error: undefined,
        quoter: Quoter.UNIV3,
        source: wethTestMetadata,
        destination: usdcTestMetadata,
      },
    ];
    mocks.getQuotes.mockResolvedValue(TEST_QUOTES);

    const bestSplitQuotePromise = getBestSplitQuote(
      wethTestMetadata,
      usdcTestMetadata,
      parseEther("1")
    );

    expect(bestSplitQuotePromise).resolves.toBeTruthy();
    const bestSplitQuote = await bestSplitQuotePromise;
    expect(bestSplitQuote?.quote.quoteGasAdjusted).toBe(
      new Big(biggerQuote).add(biggerQuote).toString()
    );
  });
});
