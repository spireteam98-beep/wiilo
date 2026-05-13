"use client";

import React, { useState, useEffect } from 'react';
import { FaBitcoin, FaPlus, FaDownload, FaWallet, FaExchangeAlt, FaHistory, FaCopy, FaQrcode, FaExternalLinkAlt } from 'react-icons/fa';
import { ethers } from 'ethers';
import { doc, setDoc, updateDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { QRCodeSVG } from 'qrcode.react';
import { JsonRpcProvider, parseUnits, formatEther } from 'ethers';

interface CryptoWalletOptions {
  type: 'create' | 'import';
  walletType: 'BTC' | 'ETH' | 'BNB';
}

interface WalletBalance {
  formatted: string;
  wei: string;
}

interface WalletInfo {
  address: string;
  encryptedPrivateKey: string;
  createdAt: string;
  email: string | null;
  network: string;
  balance?: WalletBalance;
}

interface UserWallets {
  [key: string]: WalletInfo; // BTC, ETH, BNB
}

// Add network configurations
const NETWORK_CONFIGS = {
  BTC: {
    name: 'Bitcoin',
    symbol: 'BTC',
    explorer: 'https://www.blockchain.com/btc/address/',
    // Using Blockstream API for BTC
    apiUrl: 'https://blockstream.info/api/'
  },
  ETH: {
    name: 'Ethereum',
    symbol: 'ETH',
    explorer: 'https://etherscan.io/address/',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key'
  }
};

// Add these interfaces
interface CryptoPrice {
  id: string;
  symbol: string;
  name: string;
  current_price: number;
  price_change_percentage_24h: number;
  image: string;
}

interface TradeModal {
  type: 'buy' | 'sell';
  crypto: CryptoPrice;
}

export default function CryptoWalletPage() {
  const [showCryptoModal, setShowCryptoModal] = useState(false);
  const [cryptoWalletOptions, setCryptoWalletOptions] = useState<CryptoWalletOptions | null>(null);
  const [activeTab, setActiveTab] = useState('wallets');
  const [walletStep, setWalletStep] = useState<'options' | 'create' | 'import'>('options');
  const [selectedCrypto, setSelectedCrypto] = useState<'BTC' | 'ETH' | 'BNB'>('BTC');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [userWallets, setUserWallets] = useState<UserWallets>({});
  const [loading, setLoading] = useState(true);
  const [showQR, setShowQR] = useState<string | null>(null);
  const [balances, setBalances] = useState<{[key: string]: WalletBalance}>({});
  const [copying, setCopying] = useState<string | null>(null);
  const [topCryptos, setTopCryptos] = useState<CryptoPrice[]>([]);
  const [selectedCryptoToBuy, setSelectedCryptoToBuy] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [tradeModal, setTradeModal] = useState<TradeModal | null>(null);
  const [tradeAmount, setTradeAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const generateWallet = async () => {
    if (!auth.currentUser?.email) {
      alert('Please sign in first');
      return;
    }

    setLoading(true);
    try {
      let wallet;
      let address;
      let privateKey;

      if (selectedCrypto === 'BTC') {
        // Generate BTC wallet using bitcoinjs-lib
        // For demo, using ETH wallet format
        wallet = ethers.Wallet.createRandom();
        address = wallet.address;
        privateKey = wallet.privateKey;
      } else if (selectedCrypto === 'ETH') {
        wallet = ethers.Wallet.createRandom();
        address = wallet.address;
        privateKey = wallet.privateKey;
      }

      // Add type check before creating walletInfo
      if (!address || !privateKey || !auth.currentUser?.email) {
        throw new Error('Missing required wallet information');
      }

      // Create wallet info object
      const walletInfo: WalletInfo = {
        address: address,
        encryptedPrivateKey: btoa(privateKey),
        createdAt: new Date().toISOString(),
        email: auth.currentUser.email,
        network: selectedCrypto
      };

      // Save to Firebase
      await setDoc(doc(db, 'wallets', auth.currentUser.uid), {
        [selectedCrypto]: walletInfo,
        userId: auth.currentUser.uid,
        email: auth.currentUser.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });

      // Update local state
      setUserWallets(prev => ({
        ...prev,
        [selectedCrypto]: walletInfo
      }));

      // Show success message
      alert(`
        ${selectedCrypto} Wallet created successfully!
        
        Your ${selectedCrypto} Address:
        ${address}
        
        IMPORTANT: This is a custodial wallet managed by our service.
        You can deposit ${selectedCrypto} to this address.
      `);
      
    } catch (error) {
      console.error('Error generating wallet:', error);
      alert('Failed to generate wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const importWallet = async () => {
    try {
      let wallet;
      
      // Check if input is seed phrase or private key
      if (privateKey.includes(' ')) {
        // Input is seed phrase
        wallet = ethers.Wallet.fromPhrase(privateKey);
      } else {
        // Input is private key
        wallet = new ethers.Wallet(privateKey);
      }
      
      // Save wallet info to Firebase
      if (auth.currentUser) {
        await setDoc(doc(db, 'wallets', auth.currentUser.uid), {
          [selectedCrypto]: {
            address: wallet.address,
            encryptedPrivateKey: await encryptPrivateKey(wallet.privateKey),
            createdAt: new Date().toISOString()
          }
        }, { merge: true });
      }

      // Show success message
      alert('Wallet imported successfully!');
      setShowCryptoModal(false);
      
    } catch (error) {
      console.error('Error importing wallet:', error);
      alert('Failed to import wallet. Please check your credentials.');
    }
  };

  const encryptPrivateKey = async (privateKey: string) => {
    // In production, use a proper encryption method
    // This is a simple example
    return btoa(privateKey);
  };

  const copyAddress = async (address: string) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopying(address);
      setTimeout(() => setCopying(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const getProvider = (network: string) => {
    switch (network) {
      case 'ETH':
        return new JsonRpcProvider(process.env.NEXT_PUBLIC_ETH_RPC_URL);
      case 'BNB':
        return new JsonRpcProvider(process.env.NEXT_PUBLIC_BSC_RPC_URL);
      default:
        return null;
    }
  };

  const checkWalletBalance = async (address: string, network: string) => {
    try {
      if (network === 'BTC') {
        // For BTC, use a public API (you might want to use a different API in production)
        const response = await fetch(`https://blockchain.info/q/addressbalance/${address}`);
        const satoshis = await response.text();
        return (parseInt(satoshis) / 100000000).toFixed(8); // Convert satoshis to BTC
      } else if (network === 'ETH') {
        // For ETH, use public node or your own node
        const provider = new JsonRpcProvider('https://eth-mainnet.public.blastapi.io');
        const balance = formatEther(await provider.getBalance(address));
        return balance;
      }
      return '0.00';
    } catch (error) {
      console.error('Error checking balance:', error);
      return '0.00';
    }
  };

  const fetchTopCryptos = async () => {
    try {
      const response = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false'
      );
      const data = await response.json();
      setTopCryptos(data);
    } catch (error) {
      console.error('Error fetching crypto prices:', error);
    }
  };

  const handleTrade = (type: 'buy' | 'sell', crypto: CryptoPrice) => {
    console.log('Opening trade modal:', type, crypto); // Debug log
    if (!auth.currentUser) {
      alert('Please sign in to trade');
      return;
    }
    setTradeModal({ type, crypto });
    setTradeAmount('');
  };

  const executeTrade = async () => {
    if (!tradeModal?.crypto || !tradeAmount || !auth.currentUser) {
      alert('Please enter an amount');
      return;
    }

    setProcessing(true);
    try {
      const amount = parseFloat(tradeAmount);
      const totalUSD = amount * tradeModal.crypto.current_price;

      // Record the transaction
      await addDoc(collection(db, 'transactions'), {
        userId: auth.currentUser.uid,
        type: tradeModal.type,
        cryptoId: tradeModal.crypto.id,
        cryptoSymbol: tradeModal.crypto.symbol.toUpperCase(),
        amount: amount,
        priceUSD: tradeModal.crypto.current_price,
        totalUSD: totalUSD,
        timestamp: new Date().toISOString()
      });

      alert(`${tradeModal.type === 'buy' ? 'Bought' : 'Sold'} ${amount} ${tradeModal.crypto.symbol.toUpperCase()} for $${totalUSD.toFixed(2)}`);
      setTradeModal(null);
      setTradeAmount('');
    } catch (error) {
      console.error('Trade error:', error);
      alert('Failed to process trade. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          // Handle not authenticated
          return;
        }
        
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          // Handle user data
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    const fetchUserWallets = async () => {
      if (!auth.currentUser?.email) return;
      
      try {
        const walletDoc = await getDoc(doc(db, 'wallets', auth.currentUser.uid));
        if (walletDoc.exists()) {
          const data = walletDoc.data();
          setUserWallets(data);
          // If user has wallets, update the UI
          if (Object.keys(data).length > 0) {
            setShowCryptoModal(false);
          }
        }
      } catch (error) {
        console.error('Error fetching wallets:', error);
      }
    };

    fetchUserWallets();
  }, [auth.currentUser]);

  useEffect(() => {
    const updateBalances = async () => {
      if (!userWallets || Object.keys(userWallets).length === 0) return;

      try {
        const updatedWallets = { ...userWallets };
        
        for (const [crypto, wallet] of Object.entries(userWallets)) {
          if (wallet.address) {
            const balance = await checkWalletBalance(wallet.address, wallet.network);
            updatedWallets[crypto] = {
              ...wallet,
              balance: {
                formatted: balance,
                wei: parseUnits(balance, 18).toString()
              }
            };
          }
        }
        
        setUserWallets(updatedWallets);
      } catch (error) {
        console.error('Error updating balances:', error);
      }
    };

    // Initial balance check
    updateBalances();

    // Set up interval for periodic updates
    const interval = setInterval(updateBalances, 30000);
    return () => clearInterval(interval);
  }, [userWallets]);

  useEffect(() => {
    if (activeTab === 'exchange') {
      fetchTopCryptos();
      const interval = setInterval(fetchTopCryptos, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchCryptoPrices = async () => {
      try {
        const response = await fetch(
          'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10&page=1&sparkline=false'
        );
        const data = await response.json();
        console.log('Fetched crypto data:', data); // Debug log
        setTopCryptos(data);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    if (activeTab === 'exchange') {
      fetchCryptoPrices();
      const interval = setInterval(fetchCryptoPrices, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="cryptoWalletPage">
      {/* Sidebar Navigation */}
      <div className="sidebar">
        <div className="logo">
          <FaBitcoin size={24} />
          <span>ZOL5 Crypto</span>
        </div>
        
        <nav className="nav">
          <button 
            className={`${activeTab === 'wallets' ? 'active' : ''}`}
            onClick={() => setActiveTab('wallets')}
          >
            <FaWallet size={20} />
            <span>Wallets</span>
          </button>
          <button 
            className={`${activeTab === 'exchange' ? 'active' : ''}`}
            onClick={() => setActiveTab('exchange')}
          >
            <FaExchangeAlt size={20} />
            <span>Exchange</span>
          </button>
          <button 
            className={`${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <FaHistory size={20} />
            <span>History</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="mainContent">
        <div className="header">
          <h1>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          <button 
            onClick={() => setShowCryptoModal(true)}
            className="addWalletButton"
          >
            <FaPlus /> Add New Wallet
          </button>
        </div>

        <div className="contentArea">
          {activeTab === 'wallets' && (
            <div className="walletsGrid">
              {Object.entries(userWallets).length > 0 ? (
                Object.entries(userWallets).map(([crypto, wallet]) => (
                  <div key={crypto} className="walletCard">
                    <div className="walletHeader">
                      <h3>{NETWORK_CONFIGS[crypto as keyof typeof NETWORK_CONFIGS].name}</h3>
                      <span className="network">{wallet.network}</span>
                    </div>
                    
                    <div className="walletBalance">
                      <p>Balance:</p>
                      <span>
                        {wallet.balance?.formatted || '0.00'} 
                        {NETWORK_CONFIGS[crypto as keyof typeof NETWORK_CONFIGS].symbol}
                      </span>
                    </div>

                    <div className="walletAddress">
                      <p>Deposit Address:</p>
                      <code>{wallet.address}</code>
                    </div>

                    <div className="walletActions">
                      <button 
                        className="actionButton"
                        onClick={() => copyAddress(wallet.address)}
                      >
                        <FaCopy /> Copy Address
                      </button>
                      <button 
                        className="actionButton"
                        onClick={() => setShowQR(wallet.address)}
                      >
                        <FaQrcode /> QR Code
                      </button>
                      <a 
                        href={NETWORK_CONFIGS[crypto as keyof typeof NETWORK_CONFIGS].explorer + wallet.address}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="actionButton"
                      >
                        <FaExternalLinkAlt /> Explorer
                      </a>
                    </div>
                  </div>
                ))
              ) : (
                <div className="emptyState">
                  <FaWallet size={48} />
                  <h3>No Crypto Wallet Yet</h3>
                  <p>Create your first crypto wallet to start using crypto</p>
                  <button 
                    onClick={() => setShowCryptoModal(true)}
                    className="createWalletButton"
                  >
                    Create Wallet
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'exchange' && (
            <div className="exchangeContainer">
              <div className="marketPrices">
                <h2>Cryptocurrency Market</h2>
                <div className="cryptoGrid">
                  {topCryptos.map((crypto) => (
                    <div key={crypto.id} className="cryptoCard">
                      <div className="cryptoInfo">
                        <img src={crypto.image} alt={crypto.name} className="cryptoIcon" />
                        <div className="cryptoDetails">
                          <h3>{crypto.name}</h3>
                          <span className="cryptoSymbol">{crypto.symbol.toUpperCase()}</span>
                        </div>
                      </div>
                      
                      <div className="priceInfo">
                        <div className="currentPrice">
                          ${crypto.current_price.toLocaleString()}
                        </div>
                        <div className={`${crypto.price_change_percentage_24h > 0 ? 'positive' : 'negative'}`}>
                          {crypto.price_change_percentage_24h.toFixed(2)}%
                        </div>
                      </div>

                      <div className="tradeButtons">
                        <button 
                          type="button"
                          className={`${'tradeButton buyButton'}`}
                          onClick={() => handleTrade('buy', crypto)}
                        >
                          Buy {crypto.symbol.toUpperCase()}
                        </button>
                        <button 
                          type="button"
                          className={`${'tradeButton sellButton'}`}
                          onClick={() => handleTrade('sell', crypto)}
                        >
                          Sell {crypto.symbol.toUpperCase()}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="comingSoon">
              <FaHistory size={48} />
              <h3>Transaction History</h3>
              <p>View all your crypto transactions here</p>
            </div>
          )}
        </div>
      </div>

      {showCryptoModal && (
        <div className="modalOverlay">
          <div className="modalContent">
            <h3>
              {walletStep === 'options' && 'Add Crypto Wallet'}
              {walletStep === 'create' && 'Create New Wallet'}
              {walletStep === 'import' && 'Import Existing Wallet'}
            </h3>

            {walletStep === 'options' ? (
              <div className="walletOptions">
                <button 
                  className="walletOptionButton"
                  onClick={() => setWalletStep('create')}
                >
                  <div className="optionIcon">
                    <FaPlus />
                  </div>
                  <div className="optionText">
                    <h4>Create New Wallet</h4>
                    <p>Generate a new crypto wallet</p>
                  </div>
                </button>

                <button 
                  className="walletOptionButton"
                  onClick={() => setWalletStep('import')}
                >
                  <div className="optionIcon">
                    <FaDownload />
                  </div>
                  <div className="optionText">
                    <h4>Access Existing Wallet</h4>
                    <p>Import your wallet using seed phrase or private key</p>
                  </div>
                </button>
              </div>
            ) : (
              <>
                <div className="cryptoSelector">
                  {['BTC', 'ETH', 'BNB'].map((crypto) => (
                    <button
                      key={crypto}
                      onClick={() => setSelectedCrypto(crypto as any)}
                      className={`${selectedCrypto === crypto ? 'active' : ''}`}
                    >
                      {crypto}
                    </button>
                  ))}
                </div>

                {walletStep === 'create' ? (
                  <div className="createWalletForm">
                    <p>Your new wallet seed phrase:</p>
                    <div className="seedPhraseBox">
                      {seedPhrase || 'Click generate to create your wallet'}
                    </div>
                    <button 
                      className="generateButton"
                      onClick={generateWallet}
                    >
                      Generate Wallet
                    </button>
                  </div>
                ) : (
                  <div className="importWalletForm">
                    <div className="inputGroup">
                      <label>Enter Private Key or Seed Phrase</label>
                      <textarea
                        value={privateKey}
                        onChange={(e) => setPrivateKey(e.target.value)}
                        placeholder="Enter your private key or seed phrase"
                        className="importInput"
                      />
                    </div>
                    <button 
                      className="importButton"
                      onClick={importWallet}
                    >
                      Import Wallet
                    </button>
                  </div>
                )}
              </>
            )}

            <button 
              className="closeButton"
              onClick={() => {
                setShowCryptoModal(false);
                setWalletStep('options');
                setSeedPhrase('');
                setPrivateKey('');
              }}
            >
              ×
            </button>

            {walletStep !== 'options' && (
              <button 
                className="backButton"
                onClick={() => setWalletStep('options')}
              >
                Back
              </button>
            )}
          </div>
        </div>
      )}

      {showQR && (
        <div className="modalOverlay" onClick={() => setShowQR(null)}>
          <div className="qrModal" onClick={e => e.stopPropagation()}>
            <h3>Wallet Address QR Code</h3>
            <QRCodeSVG 
              value={showQR}
              size={200}
              level="H"
              includeMargin
              className="qrCode"
            />
            <p className="qrAddress">{showQR}</p>
            <button 
              className="closeButton"
              onClick={() => setShowQR(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Trade Modal */}
      {tradeModal && (
        <div className="modalOverlay" onClick={() => setTradeModal(null)}>
          <div className="tradeModal" onClick={(e) => e.stopPropagation()}>
            <h3>{tradeModal.type === 'buy' ? 'Buy' : 'Sell'} {tradeModal.crypto.name}</h3>
            
            <div className="tradeInfo">
              <p>Current Price: ${tradeModal.crypto.current_price.toLocaleString()}</p>
              <div className="inputGroup">
                <label>Amount ({tradeModal.crypto.symbol.toUpperCase()})</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="0.000001"
                  className="tradeInput"
                />
              </div>
              
              {tradeAmount && (
                <div className="tradeSummary">
                  <p>Total USD: ${(parseFloat(tradeAmount) * tradeModal.crypto.current_price).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="tradeActions">
              <button 
                className="cancelButton"
                onClick={() => setTradeModal(null)}
                disabled={processing}
              >
                Cancel
              </button>
              <button 
                className={`${'confirmButton'} ${tradeModal.type === 'buy' ? 'buyButton' : 'sellButton'}`}
                onClick={executeTrade}
                disabled={!tradeAmount || processing}
              >
                {processing ? 'Processing...' : `Confirm ${tradeModal.type === 'buy' ? 'Purchase' : 'Sale'}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}