// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@solidstate/contracts/access/SafeOwnable.sol";
import "@solidstate/contracts/token/ERC20/metadata/ERC20MetadataStorage.sol";
import "@solidstate/contracts/token/ERC20/ERC20.sol";

contract Raid is ERC20, SafeOwnable {
  using ERC20MetadataStorage for ERC20MetadataStorage.Layout;
  using OwnableStorage for OwnableStorage.Layout;

  constructor() {
    OwnableStorage.Layout storage os = OwnableStorage.layout();
    os.setOwner(msg.sender);

    ERC20MetadataStorage.Layout storage ls = ERC20MetadataStorage.layout();
    ls.setName("Raid");
    ls.setSymbol("RAID");
    ls.setDecimals(18);

    _mint(msg.sender, 1e9 * 1e18);
  }

  function burn(uint256 amount) external {
    _burn(msg.sender, amount);
  }

  function burnFrom(address account, uint256 amount) external {
    uint256 currentAllowance = allowance(account, msg.sender);
    require(currentAllowance >= amount, "ERC20: burn amount exceeds allowance");
  unchecked {
    _approve(account, msg.sender, currentAllowance - amount);
  }
    _burn(account, amount);
  }

  function mint(address account, uint256 amount) external onlyOwner {
    _mint(account, amount);
  }
}
