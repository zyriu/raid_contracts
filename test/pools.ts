import { expect } from "chai";
import { ethers } from "hardhat";
import { advanceBlock, advanceBlockTo, deploy, prepare } from "../utilities";

describe("Pools", function () {
  before(async function () {
    await prepare(this, ["ERC20Mock", "Pools", "Raid"]);
  });

  beforeEach(async function () {
    await deploy(this, [["raid", this.Raid]]);
    await deploy(this, [
      ["pools", this.Pools, [this.raid.address, ethers.utils.parseUnits("100")]],
      ["lp", this.ERC20Mock, ["LP", "LP", ethers.utils.parseUnits("10")]],
    ]);
    await this.raid.transfer(this.pools.address, ethers.utils.parseUnits("500000000"));
  });

  describe("add", function () {
    it("Should add pool with reward token multiplier", async function () {
      await expect(this.pools.add(10, this.lp.address))
        .to.emit(this.pools, "PoolAddition")
        .withArgs(0, 10, this.lp.address);
    });
  });

  describe("deposit", function () {
    it("Should deposit 0 amount", async function () {
      await this.pools.add(10, this.lp.address);
      await expect(this.pools.connect(this.alice).deposit(0, 0, this.alice.address))
        .to.emit(this.pools, "Deposit")
        .withArgs(this.alice.address, 0, 0, this.alice.address);
    });

    it("Should fail if attempting to deposit into a non-existent pool", async function () {
      await expect(this.pools.deposit(42, 0, this.owner.address)).to.be.reverted;
    });
  });

  describe("emergencyWithdraw", function () {
    it("should emit event EmergencyWithdraw", async function () {
      await this.pools.add(10, this.lp.address);
      await this.lp.transfer(this.bob.address, ethers.utils.parseUnits("1"));
      await this.lp.connect(this.bob).approve(this.pools.address, ethers.constants.MaxUint256);
      await this.pools.connect(this.bob).deposit(0, ethers.utils.parseUnits("1"), this.bob.address);
      await expect(this.pools.connect(this.bob).emergencyWithdraw(0, this.bob.address))
        .to.emit(this.pools, "EmergencyWithdraw")
        .withArgs(this.bob.address, 0, ethers.utils.parseUnits("1"), this.bob.address);
    });
  });

  describe("harvest", function () {
    it("Should harvest properly", async function () {
      await this.pools.add(10, this.lp.address);
      await this.lp.connect(this.alice).approve(this.pools.address, ethers.constants.MaxUint256);
      await this.lp.transfer(this.alice.address, ethers.utils.parseUnits("1"));
      expect(await this.pools.lpTokens(0)).to.be.equal(this.lp.address);
      const logsDeposit = await this.pools
        .connect(this.alice)
        .deposit(0, ethers.utils.parseUnits("1"), this.alice.address);
      await advanceBlockTo(450);
      const logsWithdraw = await this.pools
        .connect(this.alice)
        .withdraw(0, ethers.utils.parseUnits("1"), this.alice.address);
      const expectedRaid = ethers.utils.parseUnits("100").mul(logsWithdraw.blockNumber - logsDeposit.blockNumber);
      expect((await this.pools.usersInfo(0, this.alice.address)).rewardDebt).to.be.equal("-" + expectedRaid);
      await this.pools.connect(this.alice).harvest(0, this.alice.address);
      expect(await this.raid.balanceOf(this.alice.address)).to.be.equal(expectedRaid);
    });

    it("Should work with an empty user balance", async function () {
      await this.pools.add(10, this.lp.address);
      await this.pools.harvest(0, this.owner.address);
    });
  });

  describe("massUpdatePools", function () {
    it("Should execute", async function () {
      await this.pools.add(10, this.lp.address);
      await advanceBlockTo(1);
      await this.pools.massUpdatePools([0]);
    });

    it("Updating invalid pools should fail", async function () {
      await expect(this.pools.massUpdatePools([0, 10000, 100000])).to.be.reverted;
    });
  });

  describe("raidPerBlock", function () {
    it("Should execute", async function () {
      await this.pools.add(10, this.lp.address);
      expect(Number(ethers.utils.formatUnits(await this.pools.raidPerBlock(0)))).to.be.equal(100);
      await this.pools.add(90, this.lp.address);
      expect(Number(ethers.utils.formatUnits(await this.pools.raidPerBlock(0)))).to.be.equal(10);
      expect(Number(ethers.utils.formatUnits(await this.pools.raidPerBlock(1)))).to.be.equal(90);
    });
  });

  describe("pendingReward", function () {
    it("should compute properly", async function () {
      await this.pools.add(10, this.lp.address);
      await this.lp.connect(this.alice).approve(this.pools.address, ethers.constants.MaxUint256);
      await this.lp.transfer(this.alice.address, ethers.utils.parseUnits("1"));
      expect(await this.pools.lpTokens(0)).to.be.equal(this.lp.address);
      const logsDeposit = await this.pools
        .connect(this.alice)
        .deposit(0, ethers.utils.parseUnits("1"), this.alice.address);
      await advanceBlock();
      const logsUpdate = await this.pools.updatePool(0);
      await advanceBlock();
      const expectedRaid = ethers.utils.parseUnits("100").mul(logsUpdate.blockNumber + 1 - logsDeposit.blockNumber);
      expect(await this.pools.pendingReward(0, this.alice.address)).to.equal(expectedRaid);
    });

    it("should compute properly when block is lastRewardBlock", async function () {
      await this.pools.add(10, this.lp.address);
      await this.lp.connect(this.alice).approve(this.pools.address, ethers.constants.MaxUint256);
      await this.lp.transfer(this.alice.address, ethers.utils.parseUnits("1"));
      expect(await this.pools.lpTokens(0)).to.be.equal(this.lp.address);
      const logsDeposit = await this.pools
        .connect(this.alice)
        .deposit(0, ethers.utils.parseUnits("1"), this.alice.address);
      await advanceBlockTo(42);
      const logsUpdate = await this.pools.updatePool(0);
      const expectedRaid = ethers.utils.parseUnits("100").mul(logsUpdate.blockNumber - logsDeposit.blockNumber);
      expect(await this.pools.pendingReward(0, this.alice.address)).to.equal(expectedRaid);
    });
  });

  describe("poolLength", function () {
    it("Should execute", async function () {
      await this.pools.add(10, this.lp.address);
      expect(await this.pools.poolLength()).to.be.equal(1);
    });
  });

  describe("setPoolInfo", function () {
    it("Should emit event SetPoolInfo", async function () {
      await this.pools.add(10, this.lp.address);
      await expect(this.pools.setPoolInfo(0, 10)).to.emit(this.pools, "SetPoolInfo").withArgs(0, 10);
    });
  });

  describe("setTotalRaidPerBlock", function () {
    it("Should emit event UpdateRaidPerBlock", async function () {
      await expect(this.pools.setTotalRaidPerBlock(42))
        .to.emit(this.pools, "UpdateRaidPerBlock")
        .withArgs((await ethers.provider.getBlockNumber()) + 1, 42);
    });
  });

  describe("totalRaidPerBlock", function () {
    it("Should execute", async function () {
      expect(Number(ethers.utils.formatUnits(await this.pools.totalRaidPerBlock()))).to.be.equal(100);
    });
  });

  describe("updatePool", function () {
    it("Should emit event UpdatePool", async function () {
      await this.pools.add(10, this.lp.address);
      await advanceBlockTo(1);
      await expect(this.pools.updatePool(0))
        .to.emit(this.pools, "UpdatePool")
        .withArgs(
          0,
          (
            await this.pools.poolsInfo(0)
          ).lastRewardBlock,
          await this.lp.balanceOf(this.pools.address),
          (
            await this.pools.poolsInfo(0)
          ).rewardPerShare,
        );
    });
  });

  describe("withdraw", function () {
    it("Should withdraw 0 amount", async function () {
      await this.pools.add(10, this.lp.address);
      await expect(this.pools.connect(this.alice).withdraw(0, 0, this.alice.address))
        .to.emit(this.pools, "Withdraw")
        .withArgs(this.alice.address, 0, 0, this.alice.address);
    });
  });

  describe("withdrawAndHarvest", function () {
    it("Should withdraw and harvest properly", async function () {
      await this.pools.add(10, this.lp.address);
      await this.lp.connect(this.alice).approve(this.pools.address, ethers.constants.MaxUint256);
      await this.lp.transfer(this.alice.address, ethers.utils.parseUnits("1"));
      expect(await this.pools.lpTokens(0)).to.be.equal(this.lp.address);
      const logsDeposit = await this.pools
        .connect(this.alice)
        .deposit(0, ethers.utils.parseUnits("1"), this.alice.address);
      await advanceBlockTo(450);
      const logsWithdraw = await this.pools
        .connect(this.alice)
        .withdrawAndHarvest(0, ethers.utils.parseUnits("1"), this.alice.address);
      const expectedRaid = ethers.utils.parseUnits("100").mul(logsWithdraw.blockNumber - logsDeposit.blockNumber);
      expect((await this.pools.usersInfo(0, this.alice.address)).rewardDebt).to.be.equal("-" + expectedRaid);
      expect(await this.raid.balanceOf(this.alice.address)).to.be.equal(expectedRaid);
    });

    it("Should work with an empty user balance", async function () {
      await this.pools.add(10, this.lp.address);
      await this.pools.withdrawAndHarvest(0, 0, this.owner.address);
    });
  });
});
