// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract TestCoin is ERC20, Ownable, Pausable, ReentrancyGuard {
    // 质押结构
    struct StakingInfo {
        uint256 amount;
        uint256 startTime;
        uint256 lockPeriod; // 锁定期（秒）
        bool isActive;
        uint256 lastClaimTime; // 上次领取奖励时间
    }
    
    // 质押相关变量
    mapping(address => StakingInfo) public stakingInfo;
    uint256 public constant DAILY_REWARD_RATE = 274; // 约10%年化/365天 (274/10000 ≈ 0.0274%日)
    uint256 public constant MAX_REWARD_PER_PERIOD = 30 days; // 最大30天奖励
    uint256 public persistentStakedBalance; // 持久化质押余额追踪
    
    // 质押统计
    uint256 public totalStaked;
    uint256 public totalActiveStakers;
    
    // 事件
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 principalAmount, uint256 rewardAmount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event StakeIncreased(address indexed user, uint256 additionalAmount);
    
    constructor() ERC20("TestCoin", "TST") Ownable(msg.sender) {
        // 初始发行1000万个代币给部署者
        _mint(msg.sender, 10000000 * 10 ** decimals());
        totalStaked = 0;
        totalActiveStakers = 0;
    }
    
    // 质押代币
    function stake(uint256 amount, uint256 lockPeriodSeconds) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(lockPeriodSeconds >= 1 days && lockPeriodSeconds <= 365 days, "Invalid lock period: 1-365 days");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // 如果用户之前有质押，先claim奖励并增加质押
        if (stakingInfo[msg.sender].isActive) {
            claimRewards();
            
            // 转移新质押的代币到合约
            _transfer(msg.sender, address(this), amount);
            
            // 更新质押信息（增加质押）
            stakingInfo[msg.sender].amount += amount;
            stakingInfo[msg.sender].lockPeriod = lockPeriodSeconds; // 更新锁定期
            
            totalStaked += amount;
            emit StakeIncreased(msg.sender, amount);
        } else {
            // 转移代币到合约
            _transfer(msg.sender, address(this), amount);
            
            // 新的质押
            stakingInfo[msg.sender] = StakingInfo({
                amount: amount,
                startTime: block.timestamp,
                lockPeriod: lockPeriodSeconds,
                isActive: true,
                lastClaimTime: block.timestamp
            });
            
            totalStaked += amount;
            totalActiveStakers += 1;
            emit Staked(msg.sender, amount, lockPeriodSeconds);
        }
    }
    
    // 解质押 - 修复重入攻击和事件数据问题
    function unstake() external whenNotPaused nonReentrant {
        StakingInfo storage info = stakingInfo[msg.sender];
        require(info.isActive, "No active staking");
        require(block.timestamp >= info.startTime + info.lockPeriod, "Lock period not ended");
        
        // 保存数据避免重入攻击后的状态损坏
        uint256 principalAmount = info.amount;
        uint256 lockEndTime = info.startTime + info.lockPeriod;
        
        // 计算最终奖励（包括锁定期内的奖励）
        uint256 finalRewards = calculateFinalRewards(msg.sender);
        
        // 发放奖励
        if (finalRewards > 0) {
            _mint(msg.sender, finalRewards);
            emit RewardsClaimed(msg.sender, finalRewards);
        }
        
        // 返回质押的代币
        _transfer(address(this), msg.sender, principalAmount);
        
        // 更新统计（在状态重置前）
        totalStaked -= principalAmount;
        totalActiveStakers -= 1;
        
        // 重置质押信息（防止重入）
        info.amount = 0;
        info.startTime = 0;
        info.lockPeriod = 0;
        info.isActive = false;
        info.lastClaimTime = 0;
        
        // 发出事件（使用保存的数据）
        emit Unstaked(msg.sender, principalAmount, finalRewards);
    }
    
    // 领取奖励（不解除质押）
    function claimRewards() public whenNotPaused nonReentrant {
        require(stakingInfo[msg.sender].isActive, "No active staking");
        
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        // 更新最后领取时间
        stakingInfo[msg.sender].lastClaimTime = block.timestamp;
        
        _mint(msg.sender, rewards);
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    // 改进的奖励计算
    function calculateRewards(address user) public view returns (uint256) {
        StakingInfo memory info = stakingInfo[user];
        if (!info.isActive) return 0;
        
        uint256 timeSinceLastClaim = block.timestamp - info.lastClaimTime;
        
        // 限制单次奖励计算的最大时间，防止溢出
        if (timeSinceLastClaim > MAX_REWARD_PER_PERIOD) {
            timeSinceLastClaim = MAX_REWARD_PER_PERIOD;
        }
        
        // 每日奖励 = 质押数量 * 日利率 / 10000
        uint256 dailyReward = (info.amount * DAILY_REWARD_RATE) / 10000;
        uint256 rewards = (dailyReward * timeSinceLastClaim) / 1 days;
        
        return rewards;
    }
    
    // 计算最终奖励（解质押时使用）
    function calculateFinalRewards(address user) public view returns (uint256) {
        StakingInfo memory info = stakingInfo[user];
        if (!info.isActive) return 0;
        
        uint256 lockEndTime = info.startTime + info.lockPeriod;
        uint256 timeSinceLastClaim = lockEndTime - info.lastClaimTime;
        
        uint256 dailyReward = (info.amount * DAILY_REWARD_RATE) / 10000;
        uint256 rewards = (dailyReward * timeSinceLastClaim) / 1 days;
        
        return rewards;
    }
    
    // 查看用户质押信息
    function getUserStakingInfo(address user) external view returns (
        uint256 amount,
        uint256 startTime,
        uint256 lockPeriod,
        bool isActive,
        uint256 rewards,
        uint256 daysRemaining
    ) {
        StakingInfo memory info = stakingInfo[user];
        uint256 rewardsAmount = calculateRewards(user);
        uint256 lockEndTime = info.startTime + info.lockPeriod;
        uint256 remainingSeconds = lockEndTime > block.timestamp ? lockEndTime - block.timestamp : 0;
        uint256 remainingDays = remainingSeconds / 1 days;
        
        return (
            info.amount,
            info.startTime,
            info.lockPeriod,
            info.isActive,
            rewardsAmount,
            remainingDays
        );
    }
    
    // 批量查询功能
    function getStakingStats() external view returns (
        uint256 totalStakedAmount,
        uint256 totalStakers,
        uint256 contractTSTBalance
    ) {
        return (
            totalStaked,
            totalActiveStakers,
            balanceOf(address(this))
        );
    }
    
    // 管理员功能
    function pauseContract() external onlyOwner {
        _pause();
    }
    
    function unpauseContract() external onlyOwner {
        _unpause();
    }
    
    // 铸造代币（仅所有者，有限制）
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= 50_000_000 * 10 ** decimals(), "Maximum supply exceeded");
        _mint(to, amount);
    }
    
    // 销毁代币（仅所有者）
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }
    
    // 紧急提取功能（仅所有者，合约暂停时）
    function emergencyWithdraw() external onlyOwner {
        require(paused(), "Contract must be paused");
        uint256 balance = balanceOf(address(this));
        if (balance > 0) {
            _transfer(address(this), owner(), balance);
        }
    }
    
    // 获取用户的APY历史
    function getUserAPY(address user) external view returns (uint256) {
        StakingInfo memory info = stakingInfo[user];
        if (!info.isActive) return 0;
        
        // 计算实际APY（基于DAILY_REWARD_RATE）
        return (DAILY_REWARD_RATE * 365) / 100; // 返回百分比
    }
}
