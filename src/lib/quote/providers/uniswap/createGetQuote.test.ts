import {
  usdcTestMetadata,
  wethTestMetadata,
} from "@/lib/wagmi/erc20Addresses.js";
import { Protocol } from "@uniswap/router-sdk";
import { parseEther } from "ethers/lib/utils.js";
import { describe, expect, test, vi } from "vitest";
import { createGetQuote } from "./createGetQuote.js";

const RESULT = "2323.22";
const TEST_QUERY = {
  amount: parseEther("1"),
  source: wethTestMetadata,
  destination: usdcTestMetadata,
};

const mocks = vi.hoisted(() => {
  return {
    router: {
      route: vi.fn(),
    },
  };
});

vi.mock("./config", async (importOriginal) => {
  const mod = await importOriginal<typeof import("./config")>();
  return {
    ...mod,
    // replace some exports
    router: mocks.router,
  };
});

describe("createGetQuote", () => {
  test("should return undefined if route is not found", async () => {
    mocks.router.route.mockResolvedValue(null);

    const getQuote = createGetQuote({ protocols: [Protocol.V2] });
    const result = await getQuote(TEST_QUERY);
    expect(result).toEqual(undefined);
  });

  test("should return string quoteGasAdjusted if route and quote exists", async () => {
    mocks.router.route.mockResolvedValue({
      quoteGasAdjusted: {
        toSignificant: () => RESULT,
      },
    });

    const getQuote = createGetQuote({ protocols: [Protocol.V2] });
    const promise = await getQuote(TEST_QUERY);
    expect(promise).toEqual({ quoteGasAdjusted: RESULT });
  });
});
