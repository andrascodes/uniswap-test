import {
  usdcTestMetadata,
  wethTestMetadata,
} from "@/lib/wagmi/erc20Addresses.js";
import { formatUnits } from "ethers/lib/utils.js";
import { describe, expect, test, vi } from "vitest";
import { toBN } from "../utils";
import { getQuotesTable } from "./getQuotesTable";

const RESULT = "2323.22";
const TEST_QUERY = {
  source: wethTestMetadata,
  destination: usdcTestMetadata,
};

const mocks = vi.hoisted(async () => {
  const { Big } = await import("big.js");
  return {
    QUOTERS: [
      { quoteFn: vi.fn(), quoter: "uniV2", name: "Uniswap V2" },
      { quoteFn: vi.fn(), quoter: "uniV3", name: "Uniswap V3" },
    ] as const,
    AMOUNTS: [new Big("1"), new Big("2"), new Big("3")],
  };
});

vi.mock("./config", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./config")>();
  const { AMOUNTS, QUOTERS } = await mocks;
  return {
    ...mod,
    // replace some exports
    QUOTERS,
    AMOUNTS,
  };
});

describe("getQuotesTable", () => {
  test("should return record with correct values", async () => {
    const TEST_QUOTE = { quoteGasAdjusted: RESULT };
    const QUOTERS = (await mocks).QUOTERS;
    const AMOUNTS = (await mocks).AMOUNTS;
    QUOTERS.forEach(({ quoteFn }) =>
      quoteFn.mockResolvedValue({ quoteGasAdjusted: RESULT })
    );

    const table = await getQuotesTable(wethTestMetadata, usdcTestMetadata);
    const tableKeys = Object.keys(table);

    const AMOUNTS_KEYS = AMOUNTS.map((a) =>
      formatUnits(
        toBN(a, TEST_QUERY.source.decimals),
        TEST_QUERY.source.decimals
      )
    );
    expect(tableKeys).toHaveLength(AMOUNTS.length);
    expect(
      tableKeys.every((key, ind) => key == AMOUNTS_KEYS[ind].toString())
    ).toBe(true);
    expect(
      Object.values(table).every((quotes) => {
        return quotes.every(({ quote, quoter, error }, ind) => {
          return (
            quote?.quoteGasAdjusted == TEST_QUOTE.quoteGasAdjusted &&
            error == undefined &&
            quoter == QUOTERS[ind].quoter
          );
        });
      })
    ).toBe(true);
  });
});
