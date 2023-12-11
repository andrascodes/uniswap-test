import Big from "big.js";
import { BigNumberish, utils } from "ethers";

export const toBN = (decimalNumber: number | string | Big, decimals = 18) => {
  const bigValue = new Big(decimalNumber).toFixed(decimals, Big.roundDown);
  return utils.parseUnits(bigValue.toString(), decimals);
};

export const fromBN = (bigNumber: BigNumberish, decimals = 18) => {
  return new Big(utils.formatUnits(bigNumber, decimals));
};

export const printNumber = (
  x: Big | number | string,
  options?: Intl.NumberFormatOptions
) => {
  // @ts-expect-error: format takes a string as well not just a number, so we need to disable TS
  // Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/format#syntax
  return new Intl.NumberFormat("en-US", options).format(x.toString());
};

export const printPercent = (
  x: Big | number | string,
  options?: Intl.NumberFormatOptions
) => {
  return printNumber(x, {
    ...options,
    style: "percent",
    maximumFractionDigits: 2,
  });
};

export const printCurrency = (
  x: Big | number | string,
  currency: string,
  options?: Intl.NumberFormatOptions
) => {
  return `${printNumber(x, {
    ...options,
    style: "decimal",
    maximumSignificantDigits: 6,
  })} ${currency}`;
};
