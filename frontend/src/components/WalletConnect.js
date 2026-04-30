/**
 * WalletConnect Component
 * 
 * WHAT THIS DOES:
 * - Connects to MetaMask wallet
 * - Shows connected account
 * - Handles wallet connection/disconnection
 */
import React, { useEffect, useState } from 'react';

function WalletConnect({ onConnect }) {
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const getEthereumProvider = () => {
    if (typeof window === 'undefined') return null;
    return window.ethereum || window.web3?.currentProvider || null;
  };

  useEffect(() => {
    checkIfWalletIsConnected();
    updateChainId();

    const provider = getEthereumProvider();

    if (provider && provider.on) {
      provider.on('accountsChanged', handleAccountsChanged);
      provider.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (provider && provider.removeListener) {
        provider.removeListener('accountsChanged', handleAccountsChanged);
        provider.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  const updateChainId = async () => {
    try {
      const provider = getEthereumProvider();
      if (!provider) return;
      const id = await provider.request({ method: 'eth_chainId' });
      setChainId(id);
      return id;
    } catch (error) {
      console.error('Error reading chain id:', error);
    }
  };

  const checkIfWalletIsConnected = async () => {
    try {
      const provider = getEthereumProvider();
      if (!provider) return;

      const accounts = await provider.request({
        method: 'eth_accounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        onConnect(true, accounts[0]);
      }
    } catch (error) {
      console.error('Error checking wallet:', error);
    }
  };

  // 🔥 Handle account change
  const handleAccountsChanged = (accounts) => {
    if (accounts.length > 0) {
      setAccount(accounts[0]);
      onConnect(true, accounts[0]);
    } else {
      setAccount(null);
      onConnect(false, null);
    }
  };

  // 🔥 Handle network change
  const handleChainChanged = async (chainId) => {
    setChainId(chainId);
    window.location.reload();
  };

  const switchToSepolia = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }],
      });
      setChainId('0xaa36a7');
    } catch (switchError) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Test Network',
              rpcUrls: ['https://rpc.sepolia.org'],
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'SEP',
                decimals: 18,
              },
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          });
          setChainId('0xaa36a7');
        } catch (addError) {
          console.error('Unable to add Sepolia network:', addError);
        }
      } else {
        console.error('Unable to switch network:', switchError);
      }
    }
  };

  const connectWallet = async () => {
    try {
      setIsConnecting(true);

      let provider = getEthereumProvider();
      if (!provider) {
        provider = await new Promise((resolve) => {
          let attempts = 0;
          const interval = setInterval(() => {
            const found = getEthereumProvider();
            if (found || attempts > 20) {
              clearInterval(interval);
              resolve(found);
            }
            attempts += 1;
          }, 100);
        });
      }

      if (!provider) {
        alert('Please install MetaMask to use DecentraEstate.');
        return;
      }

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        onConnect(true, accounts[0]);
      }

      const currentChainId = await updateChainId();
      if (currentChainId && currentChainId !== '0xaa36a7') {
        const userWantsSwitch = window.confirm(
          'MetaMask is not on Sepolia. Would you like to switch to Sepolia now?'
        );
        if (userWantsSwitch) {
          await switchToSepolia();
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.code === 4001) {
        alert('Connection request rejected. Please allow MetaMask access to connect.');
      } else {
        alert('Failed to connect wallet. Please try again.');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    onConnect(false, null);
  };

  const getChainLabel = () => {
    if (!chainId) return 'Unknown network';
    if (chainId === '0xaa36a7') return 'Sepolia';
    if (chainId === '0x1') return 'Ethereum Mainnet';
    if (chainId === '0x7a69' || chainId === '0x539') return 'Hardhat Localhost';
    return `Chain ${chainId}`;
  };

  if (account) {
    return (
      <div className="wallet-connected">
        <div>
          <span className="wallet-account">
            {account.substring(0, 6)}...{account.substring(account.length - 4)}
          </span>
          <div className="wallet-network">{getChainLabel()}</div>
        </div>
        <button className="btn-disconnect" onClick={disconnectWallet}>
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      className="btn-connect"
      onClick={connectWallet}
      disabled={isConnecting}
    >
      {isConnecting ? '⏳ Connecting...' : '🦊 Connect Wallet'}
    </button>
  );
}

export default WalletConnect;
