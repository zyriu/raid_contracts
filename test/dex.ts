import { ethers } from "hardhat";
import { deploy, prepare } from "../utilities";

describe("Pools", function () {
  before(async function () {
    await prepare(this, ["ERC20Mock", "UniswapV2ERC20", "UniswapV2Factory", "UniswapV2Pair", "UniswapV2Router02"]);
  });

  beforeEach(async function () {
    await deploy(this, [["wONE", this.ERC20Mock, ["Wrapped One", "wONE", ethers.utils.parseUnits("1000000000")]]]);
    await deploy(this, [
      ["tokenA", this.ERC20Mock, ["Token A", "tokenA", ethers.utils.parseUnits("1000000")]],
      ["tokenB", this.ERC20Mock, ["Token B", "tokenB", ethers.utils.parseUnits("1000000")]],
      ["nlp", this.UniswapV2ERC20],
      ["factory", this.UniswapV2Factory, [this.owner.address]],
      ["pair", this.UniswapV2Pair],
    ]);

    await deploy(this, [["router", this.UniswapV2Router02, [this.factory.address, this.wONE.address]]]);
  });

  it("Should swap properly", async function () {
    await this.factory.createPair(this.tokenA.address, this.tokenB.address);
  });
});
