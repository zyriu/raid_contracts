import { expect } from "chai";
import { ethers } from "hardhat";
import { deploy, loadFacets, prepare } from "../utilities";
import { FacetCutAction, getSelectors } from "../utilities/diamond";
import { Contract } from "ethers";

describe("Character", function () {
  before(async function () {
    await prepare(this, [
      "Diamond",
      "DiamondCutFacet",
      "CharacterFacet",
      "CharacterInit",
      "OwnershipFacet",
      "UnsplicedMintFacet",
    ]);
  });

  beforeEach(async function () {
    await deploy(this, [["diamondCutFacet", this.DiamondCutFacet]]);
    await deploy(this, [
      ["diamond", this.Diamond, [this.owner.address, this.diamondCutFacet.address]],
      ["characterFacet", this.CharacterFacet],
      ["characterInit", this.CharacterInit],
      ["ownershipFacet", this.OwnershipFacet],
      ["unsplicedMintFacet", this.UnsplicedMintFacet],
    ]);

    const cut = [this.ownershipFacet, this.characterFacet, this.unsplicedMintFacet].map((facet: Contract) => ({
      facetAddress: facet.address,
      action: FacetCutAction.Add,
      functionSelectors: getSelectors(facet),
    }));

    const diamondCut = await ethers.getContractAt("IDiamondCut", this.diamond.address);
    const functionCall = this.characterInit.interface.encodeFunctionData("init", ["https://raid.city"]);
    await diamondCut.diamondCut(cut, this.characterInit.address, functionCall);

    await loadFacets(this, [
      ["characterFacet", "CharacterFacet"],
      ["unsplicedMintFacet", "UnsplicedMintFacet"],
    ]);
  });

  it("Should initialise properly", async function () {
    expect(await this.characterFacet.name()).to.equal("Character");
    expect(await this.characterFacet.symbol()).to.equal("CHARA");
    expect(await this.characterFacet.baseURI()).to.equal("https://raid.city");
  });

  describe("UnsplicedMintFacet", async function () {
    it("Should mint properly", async function () {
      expect(await this.characterFacet.totalSupply()).to.equal(0);
      await this.unsplicedMintFacet.unsplicedMint();
      expect(await this.characterFacet.totalSupply()).to.equal(1);
      await this.unsplicedMintFacet.unsplicedMint();
    });

    it("Should generate a character with the correct information", async function () {
      await this.unsplicedMintFacet.connect(this.alice).unsplicedMint();
      const [
        [
          id,
          level,
          rarity,
          mutation,
          actionPoints,
          movementsPoints,
          healthPoints,
          speed,
          expertise,
          scavenging,
          potential,
          statistics,
          profession,
          experiencePoints,
        ],
      ] = await this.characterFacet.characters([0]);
      expect(id).to.equal(0);
      expect(level).to.equal(1);
      expect(rarity).to.equal(5);
      expect(mutation).to.equal(1);
      expect(actionPoints).to.equal(6);
      expect(movementsPoints).to.equal(3);
      expect(healthPoints).to.equal(100);
      expect(speed).to.equal(0);
      expect(expertise).to.equal(0);
      expect(scavenging).to.equal(0);
      expect(potential).to.eql([6, 0, 0, 0, 0, 0]);
      expect(statistics).to.eql([6, 6, 6, 6, 6, 6]);
      expect(profession).to.equal(0);
      expect(experiencePoints).to.equal(0);
    });
  });

  describe("CharacterFacet", async function () {
    describe("mint", async function () {
      it("Should fail if called by any account beside the diamond contract", async function () {
        await expect(this.characterFacet.mint(this.owner.address, 0)).to.be.reverted;
      });
    });
  });
});
