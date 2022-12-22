import { ethers } from "hardhat";
import { Contract } from "ethers";
import { FacetCutAction, getSelectors } from "../utilities/diamond";

async function main() {
  const Diamond = await ethers.getContractFactory("Diamond");
  const DiamondCutFacet = await ethers.getContractFactory("DiamondCutFacet");
  const DiamondLoupeFacet = await ethers.getContractFactory("DiamondLoupeFacet");
  const OwnershipFacet = await ethers.getContractFactory("OwnershipFacet");
  const CharacterFacet = await ethers.getContractFactory("CharacterFacet");
  const CharacterInit = await ethers.getContractFactory("CharacterInit");
  const UnsplicedMintFacet = await ethers.getContractFactory("UnsplicedMintFacet");

  const diamondCut = await DiamondCutFacet.deploy();
  await diamondCut.deployed();
  console.log("Deployed diamondCut:", diamondCut.address);
  const diamond = await Diamond.deploy(process.env.DEV_ADDRESS as string, diamondCut.address);
  await diamond.deployed();
  console.log("Deployed diamond:", diamond.address);
  const diamondLoupeFacet = await DiamondLoupeFacet.deploy();
  await diamondLoupeFacet.deployed();
  console.log("Deployed diamondLoupeFacet", diamondLoupeFacet.address);
  const characterFacet = await CharacterFacet.deploy();
  await characterFacet.deployed();
  console.log("Deployed characterFacet", characterFacet.address);
  const ownershipFacet = await OwnershipFacet.deploy();
  await ownershipFacet.deployed();
  console.log("Deployed ownershipFacet", ownershipFacet.address);
  const unsplicedMintFacet = await UnsplicedMintFacet.deploy();
  await unsplicedMintFacet.deployed();
  console.log("Deployed unsplicedMintFacet", unsplicedMintFacet.address);
  const characterInit = await CharacterInit.deploy();
  await characterInit.deployed();
  console.log("Deployed characterInit", characterInit.address);

  const cut = [diamondLoupeFacet, characterFacet, ownershipFacet, unsplicedMintFacet].map((facet: Contract) => ({
    facetAddress: facet.address,
    action: FacetCutAction.Add,
    functionSelectors: getSelectors(facet),
  }));

  const functionCall = characterInit.interface.encodeFunctionData("init", ["https://raid.city"]);
  await (
    await ethers.getContractAt("IDiamondCut", diamond.address)
  ).diamondCut(cut, characterInit.address, functionCall);
  console.log("Diamond cut executed");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
