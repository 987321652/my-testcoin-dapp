# TestCoin DApp - 代币质押平台

这是一个基于BNB Smart Chain测试网的DApp项目，实现了TestCoin (TST)代币的发行、转账和质押功能。

## 功能特性

- 🏦 **钱包连接**: 支持MetaMask钱包连接
- 💳 **代币余额**: 显示TestCoin和BNB余额
- 💸 **代币转账**: 支持TST代币转账
- 🔒 **质押功能**: 支持TST代币质押，年化收益率10%
- ⏰ **锁定期**: 可设置质押锁定时间
- 💰 **奖励领取**: 支持随时领取质押奖励

## 准备工作

### 1. 安装必要的工具
- [MetaMask钱包](https://metamask.io/)
- [VS Code](https://code.visualstudio.com/)
- [Node.js](https://nodejs.org/) (用于后续版本)

### 2. 配置BNB测试网
在MetaMask中添加BNB Smart Chain Testnet：
- **网络名称**: BNB Smart Chain Testnet
- **RPC URL**: https://data-seed-prebsc-1-s1.binance.org:8545
- **链ID**: 97
- **货币符号**: BNB
- **区块浏览器**: https://testnet.bscscan.com

### 3. 获取测试BNB
访问 [测试网水龙头](https://testnet.binance.org/faucet-smart) 获取免费测试BNB。

## 部署和测试

### Phase 1: 智能合约部署
1. 访问 [Remix IDE](https://remix.ethereum.org/)
2. 创建新文件 `TestCoin.sol`
3. 复制项目中的合约代码
4. 编译合约（选择Solidity 0.8.x版本）
5. 连接MetaMask钱包
6. 切换到BNB测试网
7. 部署合约并记录合约地址

### Phase 2: 前端集成
1. 用VS Code打开 `my-test-dapp` 文件夹
2. 修改 `app.js` 中的 `contractAddress` 变量为您部署的合约地址
3. 双击 `index.html` 在浏览器中打开
4. 连接钱包并测试功能

### Phase 3: 线上部署（可选）
可以使用Netlify或其他平台部署前端：
1. 将项目推送到GitHub
2. 连接Netlify账号
3. 选择GitHub仓库进行自动部署

## 合约信息

```
代币名称: TestCoin
代币符号: TST
总发行量: 10,000,000 TST
小数位: 18
年化奖励率: 10%
```

## 安全警告

⚠️ **重要提醒**: 
- 这是用于学习和测试的项目
- 只在测试网上使用，不要涉及真实资金
- 智能合约未经审计，不应用于生产环境
- 助记词和私钥绝对不要泄露给他人

## 故障排除

### 常见问题
1. **连接钱包失败**: 确保MetaMask已安装并解锁
2. **交易失败**: 检查BNB余额是否足够支付Gas费
3. **网络错误**: 确保MetaMask已切换到正确的测试网
4. **合约功能异常**: 检查是否使用了正确的合约地址

### 获取帮助
- 检查浏览器控制台的错误信息
- 确认BNB测试币余额（需要至少0.01 BNB）
- 验证合约是否在BNB测试网上正确部署

## 开发团队

这个项目是AI辅助开发的示例项目，用于演示如何快速构建一个完整的DApp。

## 许可证

MIT License
