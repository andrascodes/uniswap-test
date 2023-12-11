import { erc20ABI } from "@/lib/wagmi/generated";
import { Address, readContracts } from "@wagmi/core";

export type ERC20Metadata = {
  address: Address;
  name: string;
  symbol: string;
  decimals: number;
};

export const getERC20Metadata = async (
  address: Address
): Promise<ERC20Metadata> => {
  const data = await readContracts({
    contracts: [
      { abi: erc20ABI, address, functionName: "name" },
      { abi: erc20ABI, address, functionName: "symbol" },
      { abi: erc20ABI, address, functionName: "decimals" },
    ],
  });

  const [name, symbol, decimals] = data;
  return { address, name, symbol, decimals };
};
