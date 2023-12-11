import { GetQuoteBaseParams } from "@/lib/quote/config";
import { Protocol } from "@uniswap/router-sdk";
import { CurrencyAmount, Token, TradeType } from "@uniswap/sdk-core";
import { AlphaRouterConfig } from "@uniswap/smart-order-router";
import { chainId, router } from "./config";

export const createGetQuote =
  (
    partialRoutingConfig: Partial<AlphaRouterConfig> & { protocols: Protocol[] }
  ) =>
  async ({ source, destination, amount }: GetQuoteBaseParams) => {
    const sourceToken = new Token(
      chainId,
      source.address,
      source.decimals,
      source.symbol,
      source.name
    );

    const destinationToken = new Token(
      chainId,
      destination.address,
      destination.decimals,
      destination.symbol,
      destination.name
    );

    const route = await router.route(
      CurrencyAmount.fromRawAmount(sourceToken, amount.toString()),
      destinationToken,
      TradeType.EXACT_INPUT,
      undefined,
      partialRoutingConfig
    );

    if (!route) return undefined;

    return {
      quoteGasAdjusted: route.quoteGasAdjusted.toSignificant(6),
    };
  };
