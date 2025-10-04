// Web3和合约配置
let web3;
let contract;
let contractAddress = "0xB0eeD26aE6F65aBa165BCBF0229568959f968A7B"; // TestCoin合约地址
let userAddress;

// ABI定义 (TestCoin合约的接口)
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Approval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "RewardsClaimed",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "lockPeriod",
                "type": "uint256"
            }
        ],
        "name": "Staked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "user",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "Unstaked",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            }
        ],
        "name": "allowance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "spender",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "approve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "balanceOf",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "burn",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "claimRewards",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "decimals",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "name",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "mint",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "paused",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "newRate",
                "type": "uint256"
            }
        ],
        "name": "setStakingRewardRate",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "lockPeriodSeconds",
                "type": "uint256"
            }
        ],
        "name": "stake",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "stakingInfo",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "startTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "lockPeriod",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "calculateRewards",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "stakingRewardRate",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "symbol",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalStaked",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transfer",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "from",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "to",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            }
        ],
        "name": "transferFrom",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "unpause",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "unstake",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "user",
                "type": "address"
            }
        ],
        "name": "getUserStakingInfo",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "amount",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "startTime",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "lockPeriod",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "isActive",
                "type": "bool"
            },
            {
                "internalType": "uint256",
                "name": "rewards",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

// 工具函数
function showMessage(message, type = 'info') {
    const statusDiv = document.getElementById('statusMessage');
    statusDiv.innerHTML = `<div class="status-message ${type}">${message}</div>`;
    setTimeout(() => {
        statusDiv.innerHTML = '';
    }, 5000);
}

function formatWeiToTokens(weiAmount) {
    return web3.utils.fromWei(weiAmount, 'ether');
}

function formatTokensToWei(tokenAmount) {
    return web3.utils.toWei(tokenAmount.toString(), 'ether');
}

async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            web3 = new Web3(window.ethereum);
            
            // 请求账户访问权限
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // 获取当前账户
            const accounts = await web3.eth.getAccounts();
            userAddress = accounts[0];
            
            // 更新UI显示
            document.getElementById('walletStatus').textContent = '已连接';
            document.getElementById('walletAddressDisplay').style.display = 'block';
            document.getElementById('connectedAddress').textContent = userAddress;
            document.getElementById('connectWallet').textContent = '切换账户';
            
            showMessage('钱包连接成功！', 'success');
            
            // 加载余额和质押信息
            await loadBalances();
            await loadStakingInfo();
            
        } catch (error) {
            console.error('连接钱包失败:', error);
            showMessage('连接钱包失败: ' + error.message, 'error');
        }
    } else {
        showMessage('请先安装MetaMask钱包！', 'error');
    }
}

async function initializeContract() {
    if (!web3) return;
    
    try {
        // 检测网络
        const networkId = await web3.eth.net.getId();
        if (networkId !== 97) {
            showMessage('请切换到BNB Smart Chain Testnet网络！', 'error');
            return;
        }
        
        // 初始化合约
        contract = new web3.eth.Contract(contractABI, contractAddress);
        
        // 测试合约连接
        await contract.methods.name().call();
        
    } catch (error) {
        console.error('初始化合约失败:', error);
        showMessage('初始化合约失败: ' + error.message, 'error');
    }
}

async function loadBalances() {
    if (!web3 || !userAddress) return;
    
    try {
        // 获取BNB余额
        const bnbWei = await web3.eth.getBalance(userAddress);
        const bnbBalance = formatWeiToTokens(bnbWei);
        document.getElementById('bnbBalance').textContent = parseFloat(bnbBalance).toFixed(4) + ' BNB';
        
        // 获取代币余额
        if (contract) {
            const tokenWei = await contract.methods.balanceOf(userAddress).call();
            const tokenBalance = formatWeiToTokens(tokenWei);
            document.getElementById('tokenBalance').textContent = parseFloat(tokenBalance).toFixed(4) + ' TST';
        } else {
            document.getElementById('tokenBalance').textContent = '合约未初始化';
        }
    } catch (error) {
        console.error('加载余额失败:', error);
        showMessage('加载余额失败: ' + error.message, 'error');
    }
}

async function loadStakingInfo() {
    if (!contract || !userAddress) return;
    
    try {
        const stakingInfo = await contract.methods.getUserStakingInfo(userAddress).call();
        
        if (stakingInfo.isActive) {
            document.getElementById('stakingInfoDisplay').classList.remove('hidden');
            
            const amount = formatWeiToTokens(stakingInfo.amount);
            const rewards = formatWeiToTokens(stakingInfo.rewards);
            const lockEndTime = new Date(parseInt(stakingInfo.startTime) * 1000 + parseInt(stakingInfo.lockPeriod) * 1000);
            const daysRemaining = Math.max(0, Math.ceil((lockEndTime - new Date()) / (1000 * 60 * 60 * 24)));
            
            document.getElementById('stakingDetails').innerHTML = `
                <div><strong>质押数量:</strong> ${parseFloat(amount).toFixed(4)} TST</div>
                <div><strong>可领取奖励:</strong> ${parseFloat(rewards).toFixed(4)} TST</div>
                <div><strong>剩余锁定期:</strong> ${daysRemaining} 天</div>
                <div><strong>质押状态:</strong> ${stakingInfo.isActive ? '已质押' : '未质押'}</div>
            `;
            
            // 设置按钮状态
            document.getElementById('claimRewards').disabled = parseFloat(rewards) <= 0;
            document.getElementById('unstakeTokens').disabled = daysRemaining > 0;
            
        } else {
            document.getElementById('stakingInfoDisplay').classList.add('hidden');
        }
    } catch (error) {
        console.error('加载质押信息失败:', error);
    }
}

async function transferTokens() {
    if (!contract || !userAddress) return;
    
    const recipient = document.getElementById('recipientAddress').value.trim();
    const amount = document.getElementById('transferAmount').value.trim();
    
    if (!recipient || !amount) {
        showMessage('请填写完整的转账信息！', 'error');
        return;
    }
    
    if (web3.utils.isAddress(recipient) === false) {
        showMessage('请输入有效的钱包地址！', 'error');
        return;
    }
    
    try {
        showMessage('正在处理转账交易...', 'info');
        
        const weiAmount = formatTokensToWei(amount);
        
        const tx = await contract.methods.transfer(recipient, weiAmount).send({
            from: userAddress,
            gas: 200000
        });
        
        showMessage('转账成功！交易哈希: ' + tx.transactionHash.substring(0, 10) + '...', 'success');
        
        // 清空输入框
        document.getElementById('recipientAddress').value = '';
        document.getElementById('transferAmount').value = '';
        
        // 刷新余额
        await loadBalances();
        
    } catch (error) {
        console.error('转账失败:', error);
        showMessage('转账失败: ' + error.message, 'error');
    }
}

async function stakeTokens() {
    if (!contract || !userAddress) return;
    
    const amount = document.getElementById('stakeAmount').value.trim();
    const lockDays = document.getElementById('lockPeriod').value.trim();
    
    if (!amount || !lockDays) {
        showMessage('请填写质押信息！', 'error');
        return;
    }
    
    const lockPeriodSeconds = parseInt(lockDays) * 24 * 60 * 60;
    
    try {
        showMessage('正在处理质押交易...', 'info');
        
        const weiAmount = formatTokensToWei(amount);
        
        const tx = await contract.methods.stake(weiAmount, lockPeriodSeconds).send({
            from: userAddress,
            gas: 300000
        });
        
        showMessage('质押成功！交易哈希: ' + tx.transactionHash.substring(0, 10) + '...', 'success');
        
        // 清空输入框
        document.getElementById('stakeAmount').value = '';
        
        // 刷新信息
        await loadBalances();
        await loadStakingInfo();
        
    } catch (error) {
        console.error('质押失败:', error);
        showMessage('质押失败: ' + error.message, 'error');
    }
}

async function claimStakingRewards() {
    if (!contract || !userAddress) return;
    
    try {
        showMessage('正在领取奖励...', 'info');
        
        const tx = await contract.methods.claimRewards().send({
            from: userAddress,
            gas: 200000
        });
        
        showMessage('奖励领取成功！交易哈希: ' + tx.transactionHash.substring(0, 10) + '...', 'success');
        
        // 刷新信息
        await loadBalances();
        await loadStakingInfo();
        
    } catch (error) {
        console.error('领取奖励失败:', error);
        showMessage('领取奖励失败: ' + error.message, 'error');
    }
}

async function unstakeTokens() {
    if (!contract || !userAddress) return;
    
    try {
        showMessage('正在解除质押...', 'info');
        
        const tx = await contract.methods.unstake().send({
            from: userAddress,
            gas: 250000
        });
        
        showMessage('解除质押成功！交易哈希: ' + tx.transactionHash.substring(0, 10) + '...', 'success');
        
        // 刷新信息
        await loadBalances();
        await loadStakingInfo();
        
    } catch (error) {
        console.error('解除质押失败:', error);
        showMessage('解除质押失败: ' + error.message, 'error');
    }
}

// 页面加载完成后初始化
window.addEventListener('load', async () => {
    // 绑定事件监听器
    document.getElementById('connectWallet').addEventListener('click', initWeb3);
    document.getElementById('refreshBalance').addEventListener('click', loadBalances);
    document.getElementById('transferTokens').addEventListener('click', transferTokens);
    document.getElementById('stakeTokens').addEventListener('click', stakeTokens);
    document.getElementById('claimRewards').addEventListener('click', claimStakingRewards);
    document.getElementById('unstakeTokens').addEventListener('click', unstakeTokens);
    
    // 检查MetaMask是否安装
    if (typeof window.ethereum !== 'undefined') {
        await initializeContract();
    } else {
        showMessage('请先安装MetaMask钱包！', 'error');
    }
});

// 监听账户变化
if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
            // 用户断开连接
            location.reload();
        } else {
            // 用户切换账户
            userAddress = accounts[0];
            document.getElementById('connectedAddress').textContent = userAddress;
            loadBalances();
            loadStakingInfo();
        }
    });
    
    window.ethereum.on('chainChanged', () => {
        // 网络切换时重新加载页面
        location.reload();
    });
}
