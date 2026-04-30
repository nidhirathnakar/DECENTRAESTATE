/**
 * PropertyView Component
 * 
 * WHAT THIS DOES:
 * - Display detailed property information
 * - Show transaction history
 * - Display fraud detection results
 */

import React, { useState, useEffect } from 'react';

function PropertyView({ property, API_URL, onBack }) {
  const [transactions, setTransactions] = useState([]);
  const [fraudStatus, setFraudStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPropertyData();
  }, [property.propertyId]);

  const loadPropertyData = async () => {
    try {
      // Load transactions
      const txResponse = await fetch(`${API_URL}/transactions/${property.propertyId}`);
      const txData = await txResponse.json();
      setTransactions(txData);

      // Load fraud detection
      const fraudResponse = await fetch(`${API_URL}/detect-fraud/${property.propertyId}`);
      const fraudData = await fraudResponse.json();
      setFraudStatus(fraudData);
    } catch (error) {
      console.error('Error loading property data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading property details...</div>;
  }

  return (
    <div className="property-details">
      <button className="btn-back" onClick={onBack}>← Back to Dashboard</button>

      <h2>Property Details</h2>

      <div className="detail-grid">
        <div className="detail-card">
          <h4>Property ID</h4>
          <p>#{property.propertyId}</p>
        </div>
        <div className="detail-card">
          <h4>Address</h4>
          <p>{property.address}</p>
        </div>
        <div className="detail-card">
          <h4>Owner</h4>
          <p className="address-short">
            {property.currentOwner.substring(0, 10)}...{property.currentOwner.substring(34)}
          </p>
        </div>
        <div className="detail-card">
          <h4>Estimated Value</h4>
          <p>💰 {parseFloat(property.estimatedValue).toFixed(2)} ETH</p>
        </div>
        <div className="detail-card">
          <h4>Status</h4>
          <p className={property.isActive ? 'status-active' : 'status-available'}>
            {property.isActive ? '🔴 Active Transaction' : '🟢 Available for Sale'}
          </p>
        </div>
      </div>

      {/* Fraud Status */}
      {fraudStatus && (
        <div className={`fraud-status ${fraudStatus.hasFraud ? 'fraud' : 'safe'}`}>
          <h3>🔍 Fraud Detection Status</h3>
          <div className={`status-box ${fraudStatus.hasFraud ? 'alert-error' : 'alert-success'}`}>
            <p>
              <strong>Status:</strong> {fraudStatus.hasFraud ? '⚠️ FRAUD DETECTED' : '✅ SAFE'}
            </p>
            {fraudStatus.fraudAlert && (
              <p><strong>Alert:</strong> {fraudStatus.fraudAlert}</p>
            )}
            <p><strong>Severity:</strong> {fraudStatus.severity}</p>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="transaction-history">
        <h3>📋 Transaction History ({transactions.length})</h3>
        {transactions.length === 0 ? (
          <p className="empty-state">No transactions for this property</p>
        ) : (
          <div className="transactions-list">
            {transactions.map((txn, index) => (
              <div key={index} className="transaction-item">
                <div className="txn-header">
                  <span className="txn-id">TX #{index + 1}</span>
                  <span className={`txn-status ${txn.status}`}>{txn.status}</span>
                </div>
                <div className="txn-details">
                  <p><strong>Seller:</strong> {txn.seller.substring(0, 10)}...</p>
                  <p><strong>Buyer:</strong> {txn.buyer.substring(0, 10)}...</p>
                  <p><strong>Sale Price:</strong> <strong>{txn.salePrice} ETH</strong></p>
                  <p><strong>Date:</strong> {new Date(txn.date).toLocaleDateString()}</p>
                  
                  {txn.isDualRepresentation && (
                    <div className="dual-rep-alert">
                      <strong>⚠️ Dual Representation:</strong>
                      <p>
                        Seller Agent Disclosed: {txn.sellerAgentDisclosed ? '✅' : '❌'}
                      </p>
                      <p>
                        Buyer Agent Disclosed: {txn.buyerAgentDisclosed ? '✅' : '❌'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default PropertyView;
