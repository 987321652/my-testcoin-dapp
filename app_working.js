// TestCoin DApp - 工作版本JavaScript
// 专门解决CSP问题和合约初始化问题

// 配置常量
const CONTRACT_ADDRESS = "0xB0eeD26aE6F65aBa165BCBF0229568959f968A7B";
const CONTRACT_ABI = [
    // ERC20基础方法
    {"inputs": [], "name": "name", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "symbol", "outputs": [{"internalType": "string", "name": "", "type": "string"}], "stateMutability": "view", "type": "function"},
    {"inputs": [], "name": "decimals", "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "account", "type": "address"}], "name": "balanceOf", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}], "name": "transfer", "outputs": [{"internalType": "bool", "name": "", "type": "bool"}], "stateMutability": "nonpayable", "type": "function"},
    
    // 质押方法
    {"inputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "uint256", "name": "lockPeriodSeconds", "type": "uint256"}], "name": "stake", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [], "name": "unstake", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [], "name": "claimRewards", "outputs": [], "stateMutability": "nonpayable", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "calculateRewards", "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    {"inputs": [{"internalType": "address", "name": "user", "type": "address"}], "name": "getUserStakingInfo", "outputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "uint256", "name": "startTime", "type": "uint256"}, {"internalType": "uint256", "name": "lockPeriod", "type": "uint256"}, {"internalType": "bool", "name": "isActive", "type": "bool"}, {"internalType": "uint256", "name": "rewards", "type": "uint256"}], "stateMutability": "view", "type": "function"},
    
    // 质押状态查询
    {"inputs": [{"internalType": "address", "name": "", "type": "address"}], "name": "stakingInfo", "outputs": [{"internalType": "uint256", "name": "amount", "type": "uint256"}, {"internalType": "uint256", "name": "startTime", "type": "uint256"}, {"internalType": "uint256", "name": "lockPeriod", "type": "uint256"}, {"internalType": "bool", "name": "isActive", "type": "bool"}], "stateMutability": "view", "type": "function"}
];

// 全局变量
let web3 = null;
let contract = null;
let userAddress = null;
let isConnected = false;

// 工具函数
function showStatus(message, type = 'info') {
    const statusElement = document.getElementById('transferStatus');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status status-${type}`;
    }
    console.log(`[${type.toUpperCase()}] ${message}`);
}

function formatWeiToTokens(weiAmount) {
    if (!web3 || !weiAmount) return '0';
    try {
        return web3.utils.fromWei(weiAmount, 'ether');
    } catch (error) {
        console.error('Wei转换失败:', error);
        return '0';
    }
}

function formatTokensToWei(tokenAmount) {
    if (!web3 || !tokenAmount) return '0';
    try {
        return web3.utils.toWei(tokenAmount.toString(), 'ether');
    } catch (error) {
        console.error('Token转换失败:', error);
        return '0';
    }
}

// 更新余额显示
function updateBalanceDisplay(tokenBalance, bnbBalance) {
    const tokenElement = document.getElementById('tokenBalance');
    const bnbElement = document.getElementById('bnbBalance');
    
    if (tokenElement) {
        tokenElement.textContent = tokenBalance + ' TST';
    }
    if (bnbElement) {
        bnbElement.textContent = bnbBalance + ' BNB';
    }
}

// 连接钱包函数
async function connectWallet() {
    console.log('开始连接钱包...');
    
    try {
        // 检查MetaMask
        if (typeof window.ethereum === 'undefined') {
            throw new Error('请安装MetaMask钱包');
        }

        // 初始化web3
        web3 = new Web3(window.ethereum);
        
        // 请求账户访问
        showStatus('正在请求钱包访问权限...', 'info');
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        // 获取账户
        const accounts = await web3.eth.getAccounts();
        if (accounts.length === 0) {
            throw new Error('没有可用的钱包账户');
        }
        
        userAddress = accounts[0];
        console.log('用户地址:', userAddress);
        
        // 检查网络
        const networkId = await web3.eth.net.getId();
        console.log('当前网络ID:', networkId);
        
        if (networkId !== 97) {
            showStatus(`请切换到BNB Smart Chain Testnet！当前网络: ${networkId}`, 'error');
            return;
        }
        
        // 初始化合约
        console.log('初始化合约...', CONTRACT_ADDRESS);
        contract = new web3.eth.Contract(CONTRACT_ABI, CONTRACT_ADDRESS);
        
        // 测试合约连接
        const name = await contract.methods.name().call();
        const symbol = await contract.methods.symbol().call();
        
        console.log('合约信息:', { name, symbol });
        
        isConnected = true;
        
        // 更新UI
        document.getElementById('walletStatus').textContent = '✅ 已连接';
        document.getElementById('walletAddress').textContent = userAddress;
        
        showStatus(`成功连接到 ${name} (${symbol})`, 'success');
        
        // 自动加载余额
        await loadBalances();
        await loadStakingInfo();
        
    } catch (error) {
        console.error('连接钱包失败:', error);
        showStatus('连接失败: ' + error.message, 'error');
        
        // 如果是账户被拒绝错误，给出特殊提示
        if (error.message.includes('User rejected') || error.message.includes('denied')) {
            showStatus('请允许网站访问您的MetaMask钱包', 'error');
        }
    }
}

// 加载余额
async function loadBalances() {
    console.log('开始加载余额...');
    
    if (!contract || !userAddress) {
        showStatus('请先连接钱包', 'error');
        return;
    }

    try {
        showStatus('正在加载余额...', 'info');
        
        // 并行获取余额
        const [bnbWei, tokenWei] = await Promise.all([
            web3.eth.getBalance(userAddress),
            contract.methods.balanceOf(userAddress).call()
        ]);
        
        const bnbBalance = parseFloat(formatWeiToTokens(bnbWei)).toFixed(4);
        const tokenBalance = parseFloat(formatWeiToTokens(tokenWei)).toFixed(2);
        
        console.log('余额加载完成:', { bnbBalance, tokenBalance });
        
        // 更新显示
        updateBalanceDisplay(tokenBalance, bnbBalance);
        
        showStatus(`余额更新: ${tokenBalance} TST, ${bnbBalance} BNB`, 'success');
        
    } catch (error) {
        console.error('加载余额失败:', error);
        showStatus('加载余额失败: ' + error.message, 'error');
    }
}

// 加载质押信息
async function loadStakingInfo() {
    console.log('开始加载质押信息...');
    
    if (!contract || !userAddress) return;

    try {
        const stakingInfo = await contract.methods.getUserStakingInfo(userAddress).call();
        console.log('质押信息:', stakingInfo);
        
        const stakingInfoElement = document.getElementById('stakingInfo');
        
        if (stakingInfo.isActive) {
            const stakingAmount = parseFloat(formatWeiToTokens(stakingInfo.amount)).toFixed(2);
            const rewards = parseFloat(formatWeiToTokens(stakingInfo.rewards)).toFixed(4);
            
            // 计算剩余天数
            const lockEndTime = parseInt(stakingInfo.startTime) + parseInt(stakingInfo.lockPeriod);
            const remainingSeconds = Math.max(0, lockEndTime - Math.floor(Date.now() / 1000));
            const remainingDays = Math.floor(remainingSeconds / (24 * 60 * 60));
            
            // 更新质押信息显示
            document.getElementById('stakingAmount').textContent = stakingAmount;
                document.getElementById('stakingDays').textContent = remainingDays;
            document.getElementById('stakingRewards').textContent = rewards;
            
            // 显示质押信息卡片
            stakingInfoElement.style.display = 'block';
            
            // 显示相关按钮
            document.querySelector('[onclick="claimRewards()"]').style.display = 'inline-block';
            document.querySelector('[onclick="unstakeTokens()"]').style.display = 'inline-block';
            
            showStatus(`质押信息加载成功: ${stakingAmount} TST 质押中`, 'success');
            
        } else {
            // 隐藏质押信息
            stakingInfoElement.style.display = 'none';
            document.querySelector('[onclick="claimRewards()"]').style.display = 'none';
            document.querySelector('[onclick="unstakeTokens()"]').style.display = 'none';
            
            console.log('用户暂无质押');
        }
        
    } catch (error) {
        console.error('加载质押信息失败:', error);
        // 不显示错误，因为可能用户没有质押
    }
}

// 转账功能
async function transferTokens() {
    console.log('开始转账...');
    
    if (!contract || !userAddress) {
        showStatus('请先连接钱包', 'error');
        return;
    }

    const recipient = document.getElementById('recipientAddress').value.trim();
    const amount = document.getElementById('transferAmount').value.trim();

    if (!recipient || !amount || parseFloat(amount) <= 0) {
        showStatus('请输入有效的转账信息', 'error');
        return;
    }

    if (!web3.utils.isAddress(recipient)) {
        showStatus('请输入有效的钱包地址', 'error');
        return;
    }

    try {
        showStatus(`正在转账 ${amount} TST 到 ${recipient.substring(0, 10)}...`, 'info');
        
        const weiAmount = formatTokensToWei(amount);
        
        const tx = await contract.methods.transfer(recipient, weiAmount).send({
            from: userAddress,
            gas: 100000  // 设置较低的Gas限制
        });
        
        console.log('转账成功:', tx);
        
        showStatus(`转账成功！交易哈希: ${tx.transactionHash.substring(0, 10)}...`, 'success');
        
        // 延迟刷新余额
        setTimeout(() => {
            loadBalances();
        }, 3000);
        
    } catch (error) {
        console.error('转账失败:', error);
        
        let errorMessage = '转账失败';
        if (error.message.includes('insufficient funds')) {
            errorMessage = '余额不足';
        } else if (error.message.includes('User rejected')) {
            errorMessage = '用户取消了交易';
        } else {
            errorMessage = error.message;
        }
        
        showStatus(errorMessage, 'error');
    }
}

// 质押功能
async function stakeTokens() {
    console.log('开始质押...');
    
    if (!contract || !userAddress) {
        showStatus('请先连接钱包', 'error');
        return;
    }

    const amount = document.getElementById('stakeAmount').value.trim();
    const lockDays = document.getElementById('lockDays').value.trim();

    if (!amount || !lockDays || parseFloat(amount) <= 0 || parseInt(lockDays) <= 0) {
        showStatus('请输入有效的质押信息', 'error');
        return;
    }

    const lockSeconds = parseInt(lockDays) * 24 * 60 * 60;

    try {
        showStatus(`正在质押 ${amount} TST，锁定期 ${lockDays} 天...`, 'info');
        
        const weiAmount = formatTokensToWei(amount);
        
        const tx = await contract.methods.stake(weiAmount, lockSeconds).send({
            from: userAddress,
            gas: 200000
        });
        
        console.log('质押成功:', tx);
        
        showStatus(`质押成功！交易哈希: ${tx.transactionHash.substring(0, 10)}...`, 'success');
        
        // 清空输入框
        document.getElementById('stakeAmount').value = '';
        
        // 延迟刷新信息
        setTimeout(() => {
            loadBalances();
            loadStakingInfo();
        }, 3000);
        
    } catch (error) {
        console.error('质押失败:', error);
        
        let errorMessage = '质押失败';
        if (error.message.includes('insufficient funds')) {
            errorMessage = 'TestCoin余额不足';
        } else if (error.message.includes('User rejected')) {
            errorMessage = '用户取消了交易';
        } else {
            errorMessage = error.message;
        }
        
        showStatus(errorMessage, 'error');
    }
}

// 领取奖励
async function claimRewards() {
    console.log('开始领取奖励...');
    
    if (!contract || !userAddress) {
        showStatus('请先连接钱包', 'error');
        return;
    }

    try {
        showStatus('正在领取奖励...', 'info');
        
        const tx = await contract.methods.claimRewards().send({
            from: userAddress,
            gas: 100000
        });
        
        console.log('领取奖励成功:', tx);
        
        showStatus(`奖励领取成功！交易哈希: ${tx.transactionHash.substring(0, 10)}...`, 'success');
        
        // 延迟刷新信息
        setTimeout(() => {
            loadBalances();
            loadStakingInfo();
        }, 3000);
        
    } catch (error) {
        console.error('领取奖励失败:', error);
        
        let errorMessage = '领取奖励失败';
        if (error.message.includes('No rewards to claim')) {
            errorMessage = '暂无奖励可领取';
        } else if (error.message.includes('User rejected')) {
            errorMessage = '用户取消了交易';
        } else {
            errorMessage = error.message;
        }
        
        showStatus(errorMessage, 'error');
    }
}

// 解除质押
async function unstakeTokens() {
    console.log('开始解除质押...');
    
    if (!contract || !userAddress) {
        showStatus('请先连接钱包', 'error');
        return;
    }

    try {
        showStatus('正在解除质押...', 'info');
        
        const tx = await contract.methods.unstake().send({
            from: userAddress,
            gas: 200000
        });
        
        console.log('解除质押成功:', tx);
        
        showStatus(`解除质押成功！交易哈希: ${tx.transactionHash.substring(0, 10)}...`, 'success');
        
        // 延迟刷新信息
        setTimeout(() => {
            loadBalances();
            loadStakingInfo();
        }, 3000);
        
    } catch (error) {
        console.error('解除质押失败:', error);
        
        let errorMessage = '解除质押失败';
        if (error.message.includes('Lock period not ended')) {
            errorMessage = '锁定期还未结束，无法解除质押';
        } else if (error.message.includes('User rejected')) {
            errorMessage = '用户取消了交易';
        } else {
            errorMessage = error.message;
        }
        
        showStatus(errorMessage, 'error');
    }
}

// MetaMask事件监听
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', async (accounts) => {
        console.log('账户变化:', accounts);
        if (accounts.length === 0) {
            showStatus('钱包已断开连接', 'error');
            location.reload();
        } else {
            userAddress = accounts[0];
            document.getElementById('walletAddress').textContent = userAddress;
            await loadBalances();
            await loadStakingInfo();
        }
    });
    
    window.ethereum.on('chainChanged', () => {
        console.log('网络变化');
        location.reload();
    });
}

// 页面加载完成后初始化
window.addEventListener('load', function() {
    console.log('页面加载完成，初始化DApp...');
    
    // 检查MetaMask是否可用
    if (typeof window.ethereum !== 'undefined') {
        showStatus('MetaMask已检测到，可以开始使用', 'info');
    } else {
        showStatus('请先安装MetaMask钱包扩展', 'error');
    }
});

// 导出函数供全局调用
window.connectWallet = connectWallet;
window.loadBalances = loadBalances;
window.transferTokens = transferTokens;
window.stakeTokens = stakeTokens;
window.claimRewards = claimRewards;
window.unstakeTokens = unstakeTokens;
