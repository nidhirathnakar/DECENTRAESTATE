/**
 * REACT APP - Main Component
 * 
 * WHAT THIS DOES:
 * - Main application entry point
 * - Connects MetaMask wallet
 * - Shows dashboard with blockchain data
 * - Routes between different features
 */
const API_URL = process.env.REACT_APP_API_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : '/api');
import React, { useState, useEffect } from 'react';
import './App.css';
import WalletConnect from './components/WalletConnect';
import PropertyForm from './components/PropertyForm';
import PropertyView from './components/PropertyView';
import TransactionForm from './components/TransactionForm';
import FraudDetector from './components/FraudDetector';

function App() {
  const [account, setAccount] = useState(null);
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [transactionPropertyId, setTransactionPropertyId] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [networkConnected, setNetworkConnected] = useState(false);
  const [providerReady, setProviderReady] = useState(false);
  const [loadingProperties, setLoadingProperties] = useState(false);
  const [propertyLoadError, setPropertyLoadError] = useState('');

  //const API_URL = 'http://localhost:3001/api';

  // Check network connection
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const response = await fetch(`${API_URL}/health`);
        if (response.ok) {
          setNetworkConnected(true);
        } else {
          setNetworkConnected(false);
        }
      } catch (error) {
        setNetworkConnected(false);
      }
    };

    const checkProvider = async () => {
      if (!window.ethereum) {
        setProviderReady(false);
        return;
      }

      try {
        await window.ethereum.request({ method: 'eth_chainId' });
        setProviderReady(true);
      } catch (error) {
        setProviderReady(false);
      }
    };

    checkConnection();
    checkProvider();

    const interval = setInterval(checkConnection, 5000);
    if (window.ethereum) {
      window.ethereum.on('connect', checkProvider);
      window.ethereum.on('disconnect', checkProvider);
      window.ethereum.on('chainChanged', checkProvider);
    }

    return () => {
      clearInterval(interval);
      if (window.ethereum) {
        window.ethereum.removeListener('connect', checkProvider);
        window.ethereum.removeListener('disconnect', checkProvider);
        window.ethereum.removeListener('chainChanged', checkProvider);
      }
    };
  }, [API_URL]);

  // Load properties from backend API
  const loadProperties = async () => {
    try {
      setPropertyLoadError('');
      setLoadingProperties(true);

      const response = await fetch(`${API_URL}/properties`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to load properties from backend');
      }

      const props = await response.json();
      setProperties(props.map((property) => ({
        ...property,
        registrationDate: property.registrationDate ? new Date(property.registrationDate) : null
      })));
    } catch (error) {
      console.error("Error loading properties:", error);
      setPropertyLoadError(error.message);
    } finally {
      setLoadingProperties(false);
    }
  };
  useEffect(() => {
    if (networkConnected) {
      loadProperties();
    }
  }, [networkConnected]);

  useEffect(() => {
    if (account) {
      loadProperties();
    }
  }, [account]);

  const handleWalletConnect = (connected, address) => {
    if (connected) {
      setAccount(address);
      loadProperties(); // 🔥 IMPORTANT
    } else {
      setAccount(null);
    }
  };

  const handlePropertyRegistered = () => {
    loadProperties();
    setActiveTab('dashboard');
  };

  const handleBuyProperty = (propertyId) => {
    setTransactionPropertyId(propertyId);
    setActiveTab('transaction');
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="brand">
            <div className="brand-badge">DecentraEstate</div>
            <h1>Secure Property, Verified on Blockchain</h1>
            <p className="tagline">Premium property registry with built-in fraud detection and trustless transactions.</p>
          </div>
        </div>
          <div className="header-status">
          <div className={`connectivity ${providerReady ? 'connected' : 'disconnected'}`}>
            <span className="status-dot"></span>
            {providerReady ? 'Wallet Ready' : 'Offline'}
          </div>
          <WalletConnect onConnect={handleWalletConnect} />
        </div>
      </header>

      {!networkConnected && (
        <div className="alert alert-error">
          ⚠️ Blockchain network not connected. Make sure Hardhat node is running on http://127.0.0.1:8545
        </div>
      )}

      {!account && providerReady && (
        <div className="alert alert-warning">
          📱 Please connect your MetaMask wallet to continue
        </div>
      )}

      {account && providerReady && (
        <div className="app-container">
          <nav className="app-nav">
            <button
              className={`nav-button ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Dashboard
            </button>
            <button
              className={`nav-button ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              📝 Register Property
            </button>
            <button
              className={`nav-button ${activeTab === 'transaction' ? 'active' : ''}`}
              onClick={() => setActiveTab('transaction')}
            >
              💼 Create Transaction
            </button>
            <button
              className={`nav-button ${activeTab === 'fraud' ? 'active' : ''}`}
              onClick={() => setActiveTab('fraud')}
            >
              🔍 Fraud Detection
            </button>
          </nav>

          <main className="app-main">
            {/* Dashboard Tab */}
            {activeTab === 'dashboard' && (
              <section className="tab-content">
                <h2>Dashboard</h2>
                <div className="account-info">
                  <strong>Connected Account:</strong> {account.substring(0, 10)}...{account.substring(34)}
                </div>

                {propertyLoadError && (
                  <div className="alert alert-error">
                    ⚠️ Unable to load properties: {propertyLoadError}
                  </div>
                )}

                <div className="properties-grid">
                  <h3>Registered Properties ({properties.length})</h3>
                  {loadingProperties ? (
                    <p className="empty-state">Loading properties...</p>
                  ) : properties.length === 0 ? (
                    <p className="empty-state">No properties registered yet</p>
                  ) : (
                    properties.map((prop) => {
                      const ownerAddress = prop.owner || prop.ownerAddress || '';
                      const isOwner = ownerAddress.toLowerCase() === account.toLowerCase();
                      return (
                        <div key={prop.propertyId} className="property-card">
                          <div className="property-card-header">
                            <span className="property-id">#{prop.propertyId}</span>
                            <span className={`property-status ${prop.isActive ? 'active' : 'available'}`}>
                              {prop.isActive ? 'Active' : 'Available'}
                            </span>
                          </div>

                          <div className="property-card-body">
                            <p className="property-address">{prop.address}</p>
                            <p className="property-detail"><strong>Owner:</strong> {prop.owner || prop.ownerAddress || 'Unknown'}</p>
                            <p className="property-detail"><strong>Listed:</strong> {prop.registrationDate ? prop.registrationDate.toLocaleDateString() : '—'}</p>

                            {prop.isFraud && (
                              <div className="fraud-warning">
                                ⚠️ <strong>Warning:</strong> {prop.fraudMessage}
                              </div>
                            )}
                          </div>

                          <div className="property-card-footer">
                            {isOwner ? (
                              <span className="property-owner-tag">Your property</span>
                            ) : !prop.isActive ? (
                              <button className="btn-primary btn-card-action" onClick={() => handleBuyProperty(prop.propertyId)}>
                                Buy Now
                              </button>
                            ) : (
                              <span className="property-owner-tag">In transaction</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}

            {/* Register Property Tab */}
            {activeTab === 'register' && (
              <section className="tab-content">
                <PropertyForm
                  account={account}
                  API_URL={API_URL}
                  onPropertyRegistered={handlePropertyRegistered}
                />
              </section>
            )}

            {/* Create Transaction Tab */}
            {activeTab === 'transaction' && (
              <section className="tab-content">
                <TransactionForm
                  account={account}
                  properties={properties}
                  API_URL={API_URL}
                  initialPropertyId={transactionPropertyId}
                  onTransactionCreated={() => {
                    loadProperties();
                    setActiveTab('dashboard');
                  }}
                />
              </section>
            )}

            {/* Fraud Detection Tab */}
            {activeTab === 'fraud' && (
              <section className="tab-content">
                <FraudDetector
                  properties={properties}
                  API_URL={API_URL}
                />
              </section>
            )}

            {/* Property View Tab */}
            {activeTab === 'view' && selectedProperty && (
              <section className="tab-content">
                <PropertyView
                  property={selectedProperty}
                  API_URL={API_URL}
                  onBack={() => setActiveTab('dashboard')}
                />
              </section>
            )}
          </main>
        </div>
      )}

      <footer className="app-footer">
        <p>🔒 Powered by DecentraEstate | © 2026 DecentraEstate</p>
      </footer>
    </div>
  );
}

export default App;
