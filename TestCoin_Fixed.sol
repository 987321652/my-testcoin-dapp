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
    uint256 public constant DAILY_REWARD_RATE = 274; // 约10%年化/365天 (避免溢出)
    uint256 public constant MAX_REWARD_PER_PERIOD = 30 days; // 最大30天奖励
    uint256 public totalStaked;
    
    // 事件
    event Staked(address indexed user, uint256 amount, uint256 lockPeriod);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    
    constructor() ERC20("TestCoin", "TST") {
        // 初始发行1000万个代币给部署者
        _mint(msg.sender, 10000000 * 10 ** decimals());
        totalStaked = 0;
    }
    
    // 质押代币
    function stake(uint256 amount, uint256 lockPeriodSeconds) external whenNotPaused nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(lockPeriodSeconds > 0 && lockPeriodSeconds <= 365 days, "Invalid lock period");
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
            isActive: true,
            lastClaimTime: block.timestamp
        });
        
        totalStaked += amount;
        emit Staked(msg.sender, amount, lockPeriodSeconds);
    }
    
    // 解质押
    function unstake() external whenNotPaused nonReentrant {
        StakingInfo storage info = stakingInfo[msg.sender];
        require(info.isActive, "No active staking");
        require(block.timestamp >= info.startTime + info.lockPeriod, "Lock period not ended");
        
        uint256 amount = info.amount; // 保存金额避免重入攻击
        
        // 计算并发放奖励
        uint256 rewards = calculateRewards(msg.sender);
        if (rewards > 0) {
            _mint(msg.sender, rewards);
            emit RewardsClaimed(msg.sender, rewards);
        }
        
        // 返回质押的代币
        _transfer(address(this), msg.sender, amount);
        
        totalStaked -= amount;
        
        // 重置质押信息（防止重入）
        info.amount = 0;
        info.startTime = 0;
        info.lockPeriod = 0;
        info.isActive = false;
        info.lastClaimTime = 0;
        
        emit Unstaked(msg.sender, amount);
    }
    
    // 领取奖励（不解除质押）
    function claimRewards() public whenNotPaused nonReentrant {
        require(stakingInfo[msg.sender].isActive, "No active staking");
        
        uint256 rewards = calculateRewards(msg.sender);
        require(rewards > 0, "No rewards to claim");
        
        // 更新质押开始时间和上次领取时间（防止重入）
        StakingInfo storage info = stakingInfo[msg.sender];
        info.startTime = block.timestamp;
        info.lastClaimTime = block.timestamp;
        
        _mint(msg.sender, rewards);
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    // 安全检查的奖励计算
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
    
    // 销毁代币（仅所有者）- 只能销毁自己的代币
    function burn(uint256 amount) external onlyOwner {
        _burn(msg.sender, amount);
    }
    
    // 紧急提取功能（仅所有者）
    function emergencyWithdraw() external onlyOwner {
        require(paused(), "Contract must be paused");
        uint256 balance = balanceOf(address(this));
        if (balance > 0) {
            _transfer(address(this), owner(), balance);
        }
    }
}
