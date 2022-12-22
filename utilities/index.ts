import { ethers } from "hardhat";
import { Context } from "mocha";

export async function advanceBlock() {
  return ethers.provider.send("evm_mine", []);
}

export async function advanceBlockTo(blockNumber: number) {
  await ethers.provider.send("evm_increaseTime", [blockNumber - (await ethers.provider.getBlockNumber())]);
  return ethers.provider.send("evm_mine", []);
}

export async function prepare(thisObject: Context, contracts: string[]) {
  for (const contract of contracts) {
    thisObject[contract] = await ethers.getContractFactory(contract);
  }

  thisObject.signers = await ethers.getSigners();
  thisObject.owner = thisObject.signers[0];
  thisObject.alice = thisObject.signers[1];
  thisObject.bob = thisObject.signers[2];
  thisObject.carol = thisObject.signers[3];
}

export async function deploy(thisObject: Context, contracts: any[][]) {
  for (const contract of contracts) {
    thisObject[contract[0]] = await contract[1].deploy(...(contract[2] || []));
    await thisObject[contract[0]].deployed();
  }
}

export async function loadFacets(thisObject: Context, contracts: string[][]) {
  for (const contract of contracts) {
    thisObject[contract[0]] = await ethers.getContractAt(contract[1], thisObject.diamond.address);
  }
}
