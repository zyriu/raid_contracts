import { ethers } from "hardhat";
import { Contract } from "ethers";

export const FacetCutAction = { Add: 0, Replace: 1, Remove: 2 };

export function getSelector(func: string) {
  const abiInterface = new ethers.utils.Interface([func]);
  return abiInterface.getSighash(ethers.utils.Fragment.from(func));
}

export function getSelectors(contract: Contract) {
  const signatures = Object.keys(contract.interface.functions);
  return signatures.reduce((acc: any, val: any) => {
    if (val !== "init(bytes)") {
      acc.push(contract.interface.getSighash(val));
    }

    return acc;
  }, []);
}
