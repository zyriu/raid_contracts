// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@solidstate/contracts/access/SafeOwnable.sol";
import "@solidstate/contracts/token/ERC20/metadata/ERC20MetadataStorage.sol";
import "@solidstate/contracts/token/ERC20/ERC20.sol";
import "@solidstate/contracts/token/ERC20/IERC20.sol";

contract xRaid is ERC20, SafeOwnable {
  using ERC20MetadataStorage for ERC20MetadataStorage.Layout;
  using OwnableStorage for OwnableStorage.Layout;

  IERC20 public immutable Raid;

  constructor(address _Raid) {
    require(_Raid != address(0), "xRaid::constructor: invalid address");

    OwnableStorage.Layout storage os = OwnableStorage.layout();
    os.setOwner(msg.sender);

    ERC20MetadataStorage.Layout storage ls = ERC20MetadataStorage.layout();
    ls.setName("Staked Raid");
    ls.setSymbol("xRAID");
    ls.setDecimals(18);

    Raid = IERC20(_Raid);
  }

  function enter(uint256 _amount) external {
    uint256 stakedRaid = Raid.balanceOf(address(this));
    uint256 totalShares = totalSupply();

    if (totalShares == 0 || stakedRaid == 0) {
      _mint(msg.sender, _amount);
    } else {
      _mint(msg.sender, _amount * totalShares / stakedRaid);
    }

    Raid.transferFrom(msg.sender, address(this), _amount);
  }

  function leave(uint256 _share) external {
    uint256 totalShares = totalSupply();
    uint256 amount = _share * Raid.balanceOf(address(this)) / totalShares;
    _burn(msg.sender, _share);
    Raid.transfer(msg.sender, amount);
  }

  function recover(address token) external {
    IERC20(token).transfer(owner(), IERC20(token).balanceOf(address(this)));
  }
}
