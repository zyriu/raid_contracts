import { expect } from "chai";
import { ethers } from "hardhat";
import { deploy, prepare } from "../utilities";

describe("Raid", function () {
  before(async function () {
    await prepare(this, ["Raid"]);
    await deploy(this, [["raid", this.Raid]]);
  });

  it("Should initialise properly", async function () {
    const { raid, owner } = this;
    expect(await raid.name()).to.equal("Raid");
    expect(await raid.symbol()).to.equal("RAID");
    expect(await raid.decimals()).to.equal(18);
    expect(Number(ethers.utils.formatUnits(await raid.balanceOf(owner.address)))).to.equal(1000000000);
  });

  it("Should only allow owner to mint", async function () {
    const { raid, alice } = this;
    await expect(raid.connect(alice).mint(alice.address, 42)).to.be.revertedWith("Ownable: sender must be owner");
    await raid.mint(alice.address, 42);
    expect(await raid.balanceOf(alice.address)).to.equal(42);
  });

  it("Should require allowance to burn", async function () {
    const { raid, alice } = this;
    await raid.mint(alice.address, 42);
    await expect(raid.burnFrom(alice.address, 42)).to.be.revertedWith("ERC20: burn amount exceeds allowance");
  });
});
