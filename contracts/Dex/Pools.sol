// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Pools is Ownable {
  using SafeERC20 for IERC20;

  IERC20 public immutable Raid;
  IERC20[] public lpTokens;

  struct PoolInfo {
    uint256 allocation;
    uint256 lastRewardBlock;
    uint256 rewardPerShare;
  }

  PoolInfo[] public poolsInfo;

  struct UserInfo {
    uint256 amount;
    int256 rewardDebt;
  }

  mapping(uint256 => mapping(address => UserInfo)) public usersInfo;

  uint256 private _totalRaidPerBlock;
  uint256 private _totalAllocation;

  event Deposit (address indexed user, uint256 indexed pid, uint256 amount, address indexed to);
  event EmergencyWithdraw (address indexed user, uint256 indexed pid, uint256 amount, address indexed to);
  event Harvest (address indexed user, uint256 indexed pid, uint256 amount);
  event PoolAddition (uint256 indexed pid, uint256 allocation, IERC20 indexed lpToken);
  event SetPoolInfo (uint256 indexed pid, uint256 allocation);
  event UpdateRaidPerBlock (uint256 blockNumber, uint256 totalRaidPerBlock);
  event UpdatePool (uint256 indexed pid, uint256 lastRewardBlock, uint256 lpSupply, uint256 rewardPerShare);
  event Withdraw (address indexed user, uint256 indexed pid, uint256 amount, address indexed to);

  constructor(address _Raid, uint256 totalRaidPerBlock_) {
    require(_Raid != address(0), "Pools::constructor: invalid _Raid address");
    Raid = ERC20(_Raid);
    _totalRaidPerBlock = totalRaidPerBlock_;
  }

  function add(uint256 _allocation, IERC20 _lpToken) external onlyOwner {
    require(address(_lpToken) != address(0), "Pools::add: invalid _lpToken address");
    _totalAllocation = _totalAllocation + _allocation;
    lpTokens.push(_lpToken);

    poolsInfo.push(PoolInfo({
    allocation : _allocation,
    lastRewardBlock : block.number,
    rewardPerShare : 0
    }));
    emit PoolAddition(lpTokens.length - 1, _allocation, _lpToken);
  }

  function deposit(uint256 _pid, uint256 _amount, address _to) external {
    PoolInfo memory pool = updatePool(_pid);
    UserInfo memory user = usersInfo[_pid][_to];

    user.amount += _amount;
    user.rewardDebt = user.rewardDebt + int256(_amount * pool.rewardPerShare);
    usersInfo[_pid][_to] = user;

    lpTokens[_pid].safeTransferFrom(msg.sender, address(this), _amount);
    emit Deposit(msg.sender, _pid, _amount, _to);
  }

  function emergencyWithdraw(uint256 _pid, address _to) external {
    uint256 amount = usersInfo[_pid][msg.sender].amount;
    usersInfo[_pid][msg.sender] = UserInfo({
    amount : 0,
    rewardDebt : 0
    });

    lpTokens[_pid].safeTransfer(_to, amount);
    emit EmergencyWithdraw(msg.sender, _pid, amount, _to);
  }

  function harvest(uint256 _pid, address _to) external {
    PoolInfo memory pool = updatePool(_pid);
    UserInfo storage user = usersInfo[_pid][msg.sender];
    int256 accumulatedRaid = int256(user.amount * pool.rewardPerShare);
    uint256 pendingRaid = uint256(accumulatedRaid - user.rewardDebt);

    user.rewardDebt = accumulatedRaid;
    if (pendingRaid != 0) {
      Raid.safeTransfer(_to, pendingRaid);
    }

    emit Harvest(msg.sender, _pid, pendingRaid);
  }

  function massUpdatePools(uint256[] calldata _pids) external {
    for (uint256 k = 0; k < _pids.length; k++) {
      updatePool(_pids[k]);
    }
  }

  function retrieveToken(address _token) external onlyOwner {
    IERC20(_token).safeTransfer(msg.sender, IERC20(_token).balanceOf(address(this)));
  }

  function setPoolInfo(uint256 _pid, uint256 _allocation) external onlyOwner {
    _totalAllocation = _totalAllocation - poolsInfo[_pid].allocation + _allocation;
    poolsInfo[_pid].allocation = _allocation;
    emit SetPoolInfo(_pid, _allocation);
  }

  function setTotalRaidPerBlock(uint256 totalRaidPerBlock_) external onlyOwner {
    _totalRaidPerBlock = totalRaidPerBlock_;
    emit UpdateRaidPerBlock(block.number, _totalRaidPerBlock);
  }

  function updatePool(uint256 _pid) public returns (PoolInfo memory pool) {
    pool = poolsInfo[_pid];
    if (block.number > pool.lastRewardBlock) {
      uint256 lpSupply = lpTokens[_pid].balanceOf(address(this));

      if (lpSupply > 0) {
        uint256 blocks = block.number - pool.lastRewardBlock;
        uint256 raidReward = blocks * raidPerBlock(_pid);
        pool.rewardPerShare += raidReward / lpSupply;
      }

      pool.lastRewardBlock = block.number;
      poolsInfo[_pid] = pool;
      emit UpdatePool(_pid, pool.lastRewardBlock, lpSupply, pool.rewardPerShare);
    }
  }

  function withdraw(uint256 _pid, uint256 _amount, address _to) external {
    PoolInfo memory pool = updatePool(_pid);
    UserInfo memory user = usersInfo[_pid][msg.sender];

    user.rewardDebt = user.rewardDebt - int256(_amount * pool.rewardPerShare);
    user.amount -= _amount;
    usersInfo[_pid][msg.sender] = user;

    lpTokens[_pid].safeTransfer(_to, _amount);
    emit Withdraw(msg.sender, _pid, _amount, _to);
  }

  function withdrawAndHarvest(uint256 _pid, uint256 _amount, address _to) external {
    PoolInfo memory pool = updatePool(_pid);
    UserInfo memory user = usersInfo[_pid][msg.sender];

    int256 accumulatedRaid = int256(user.amount * pool.rewardPerShare);
    uint256 pendingRaid = uint256(accumulatedRaid - user.rewardDebt);

    user.rewardDebt = user.rewardDebt - int256(_amount * pool.rewardPerShare);
    user.amount -= _amount;
    usersInfo[_pid][msg.sender] = user;

    Raid.safeTransfer(_to, pendingRaid);
    lpTokens[_pid].safeTransfer(_to, _amount);

    emit Withdraw(msg.sender, _pid, _amount, _to);
    emit Harvest(msg.sender, _pid, pendingRaid);
  }

  /* ---------------------- VIEW ---------------------- */
  function raidPerBlock(uint256 _pid) public view returns (uint256) {
    return _totalRaidPerBlock * poolsInfo[_pid].allocation / _totalAllocation;
  }

  function pendingReward(uint256 _pid, address _user) external view returns (uint256) {
    PoolInfo memory pool = poolsInfo[_pid];
    UserInfo memory user = usersInfo[_pid][_user];
    uint256 rewardPerShare = pool.rewardPerShare;
    uint256 lpSupply = lpTokens[_pid].balanceOf(address(this));

    if (block.number > pool.lastRewardBlock && lpSupply != 0) {
      uint256 blocks = block.number - pool.lastRewardBlock;
      uint256 raidReward = blocks * raidPerBlock(_pid);
      rewardPerShare += raidReward / lpSupply;
    }

    return uint256(int256(user.amount * rewardPerShare) - user.rewardDebt);
  }

  function poolLength() external view returns (uint256) {
    return poolsInfo.length;
  }

  function totalRaidPerBlock() external view returns (uint256) {
    return _totalRaidPerBlock;
  }
}
