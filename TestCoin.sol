// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

contract TestCoin is ERC20, Ownable, Pausable {
    // 质押结构
    struct StakingInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod; // 锁定期（秒）
        bool isActive;
    }
    
    // 质押相关变量
    mapping(address => StakingInfo) public stakingInfo;
    uint256 public stakingRewardRate = 1000; // 年化奖励率（基点，1000 = 10%）
    uint256 public totalStaked;
    
    // 事件
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor() ERC20("TestCoin", "TST") Ownable(msg.sender) {
        // 初始发行1000万个代币给部署者
        _mint(msg.sender, 10000000 * 10 ** decimals());
        totalStaked = 0;
    }
    
    // 质押代币
    function stake(uint256 amount, uint256 lockPeriodSeconds) external whenNotPaused {
        require(amount > 0, "Amount must be greater than 0");
        require(lockPeriodSeconds > 0, "Lock period must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // 如果用户之前有质押，先claim奖励
        if (stakingInfo[msg.sender].isActive) {
            claimRewards();
        }
        
        // 转移代币到合约
        _transfer(msg.sender, address(this), amount);
        
        // 更新质押信息
        stakingInfo[msg.sender] = StakingInfo({
            amount: amount,
            startTime: block.timestamp,
            lockPeriod: lockPeriodSeconds,
            isActive: true
        });
        
        totalStaked += amount;
        emit Staked(msg.sender, amount, lockPeriodSeconds);
    }
    
    // 解质押
    function unstake() external {
        StakingInfo storage info = stakingInfo[msg.sender];
        require(info.isActive, "No active staking");
        require(block.timestamp >= info.startTime + info.lockPeriod, "Lock period not ended");
        
        // 计算并发放奖励
        uint256 rewards = calculateRewards(msg.sender);
        if (rewards > 0) {
            _mint(msg.sender, rewards);
            emit RewardsClaimed(msg.sender, rewards);
        }
        
        // 返回质押的代币
        _transfer(address(this), msg.sender, info.amount);
        
        totalStaked -= info.amount;
        
        // 重置质押信息
        info.amount = 0;
        info.startTime = 0;
        info.lockPeriod = 0;
        info.isActive = false;
        
        emit Unstaked(msg.sender, info.amount);
    }
    
    // 领取奖励（不解除质押）
    function claimRewards() public {
        require(stakingInfo[msg.sender].isActive, "No active staking");
        
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        // 更新质押开始时间
        stakingInfo[msg.sender].startTime = block.timestamp;
        
        _mint(msg.sender, rewards);
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    // 计算用户奖励
    function calculateRewards(address user) public view returns (uint256) {
        StakingInfo memory info = stakingInfo[user];
        if (!info.isActive) return 0;
        
        uint256 stakingDuration = block.timestamp - info.startTime;
        uint256 yearlyReward = (info.amount * stakingRewardRate) / 10000;
        uint256 rewards = (yearlyReward * stakingDuration) / 365 days;
        
        return rewards;
    }
    
    // 查看用户质押信息
    function getUserStakingInfo(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lockPeriod,
        bool isActive,
        uint256 rewards
    ) {
        StakingInfo memory info = stakingInfo[user];
        return (
            info.amount,
            info.startTime,
            info.lockPeriod,
            info.isActive,
            calculateRewards(user)
        );
    }
    
    // 管理员功能
    function setStakingRewardRate(uint256 newRate) external onlyOwner {
        require(newRate <= 10000, "Rate cannot exceed 100%");
        stakingRewardRate = newRate;
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // 铸造代币（仅所有者）
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
    }
    
    // 销毁代币（仅所有者）
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }
}
