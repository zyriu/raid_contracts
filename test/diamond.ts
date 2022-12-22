import { expect } from "chai";
import { ethers } from "hardhat";
import { deploy, prepare } from "../utilities";
import { FacetCutAction, getSelector, getSelectors } from "../utilities/diamond";
import { Contract } from "ethers";

describe("Diamond", function () {
  before(async function () {
    await prepare(this, ["Diamond", "DiamondInit", "DiamondCutFacet", "DiamondLoupeFacet", "OwnershipFacet"]);
  });

  beforeEach(async function () {
    await deploy(this, [["diamondCutFacet", this.DiamondCutFacet]]);
    await deploy(this, [
      ["diamond", this.Diamond, [this.owner.address, this.diamondCutFacet.address]],
      ["diamondInit", this.DiamondInit],
      ["diamondLoupeFacet", this.DiamondLoupeFacet],
      ["ownershipFacet", this.OwnershipFacet],
    ]);

    const cut = [this.diamondLoupeFacet, this.ownershipFacet].map((facet: Contract) => ({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    }));

    const diamondCut = await ethers.getContractAt("IDiamondCut", this.diamond.address);
    const functionCall = this.diamondInit.interface.encodeFunctionData("init");
    await diamondCut.diamondCut(cut, this.diamondInit.address, functionCall);
  });

  it("Should have three facets", async function () {
    const diamondLoupe = await ethers.getContractAt("DiamondLoupeFacet", this.diamond.address);
    expect((await diamondLoupe.facetAddresses()).length).to.equal(3);
  });

  it("Should have the right addresses for facets", async function () {
    const diamondLoupe = await ethers.getContractAt("DiamondLoupeFacet", this.diamond.address);
    expect(await diamondLoupe.facetAddresses()).to.eql([
      this.diamondCutFacet.address,
      this.diamondLoupeFacet.address,
      this.ownershipFacet.address,
    ]);
  });

  it("Should have the right function selectors per facets", async function () {
    const diamondLoupe = await ethers.getContractAt("DiamondLoupeFacet", this.diamond.address);
    for (const facet of [this.diamondCutFacet, this.diamondLoupeFacet, this.ownershipFacet]) {
      expect(await diamondLoupe.facetFunctionSelectors(facet.address)).to.eql(getSelectors(facet));
    }
  });

  it("Should have the right addresses for selectors", async function () {
    const diamondLoupe = await ethers.getContractAt("DiamondLoupeFacet", this.diamond.address);
    const items = [
      {
        address: this.diamondLoupeFacet.address,
        selector: "function facets() external view returns (Facet[] memory facets_)",
      },
      {
        address: this.ownershipFacet.address,
        selector: "function owner() external view returns (address owner_)",
      },
    ];

    for (const { address, selector } of items) {
      expect(await diamondLoupe.facetAddress(getSelector(selector))).to.equal(address);
    }
  });
});
