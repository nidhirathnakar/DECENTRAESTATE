/**
 * FraudDetector Component
 * 
 * WHAT THIS DOES:
 * - Displays fraud detection results for all properties
 * - Shows risk levels
 * - Identifies suspicious patterns
 */

import React, { useState, useEffect } from 'react';

function FraudDetector({ properties, API_URL }) {
  const [fraudResults, setFraudResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFraudDetectionResults();
  }, [properties]);

  const loadFraudDetectionResults = async () => {
    try {
      const results = [];
      
      for (let prop of properties) {
        try {
          const response = await fetch(`${API_URL}/detect-fraud/${prop.propertyId}`);
          const data = await response.json();
          results.push({
            ...prop,
            fraudStatus: data.hasFraud,
            fraudAlert: data.fraudAlert,
            severity: data.severity
          });
        } catch (error) {
          console.error(`Error checking fraud for property ${prop.propertyId}:`, error);
        }
      }
      
      setFraudResults(results);
    } catch (error) {
      console.error('Error loading fraud detection:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Scanning for fraud patterns...</div>;
  }

  const fraudulentProperties = fraudResults.filter(p => p.fraudStatus);
  const safeProperties = fraudResults.filter(p => !p.fraudStatus);

  return (
    <div className="fraud-detector">
      <h2>🔍 Fraud Detection System</h2>

      <div className="fraud-summary">
        <div className="summary-card safe">
          <h4>✅ Safe Properties</h4>
          <p className="number">{safeProperties.length}</p>
        </div>
        <div className="summary-card alert">
          <h4>⚠️ Flagged Properties</h4>
          <p className="number">{fraudulentProperties.length}</p>
        </div>
        <div className="summary-card">
          <h4>📊 Total Properties</h4>
          <p className="number">{fraudResults.length}</p>
        </div>
      </div>

      {fraudulentProperties.length > 0 && (
        <section className="fraud-alerts">
          <h3>⚠️ Flagged Properties</h3>
          <div className="alerts-list">
            {fraudulentProperties.map((prop) => (
              <div key={prop.propertyId} className="fraud-alert">
                <div className="alert-header alert">
                  <span className="alert-icon">🚨</span>
                  <span className="alert-title">#{prop.propertyId} - {prop.address}</span>
                  <span className="alert-severity">{prop.severity}</span>
                </div>
                <div className="alert-content">
                  <p><strong>Alert:</strong> {prop.fraudAlert}</p>
                  <p><strong>Status:</strong> Requires investigation</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="safe-properties">
        <h3>✅ Verified Safe Properties</h3>
        <div className="properties-list">
          {safeProperties.length === 0 ? (
            <p className="empty-state">No properties available</p>
          ) : (
            safeProperties.map((prop) => (
              <div key={prop.propertyId} className="safe-property">
                <div className="property-info">
                  <span className="property-badge">#{prop.propertyId}</span>
                  <div>
                    <p className="property-address">{prop.address}</p>
                    <p className="property-meta">
                      Value: {parseFloat(prop.estimatedValue).toFixed(2)} ETH | 
                      Status: {prop.isActive ? 'Active' : 'Available'}
                    </p>
                  </div>
                </div>
                <div className="property-status safe">✅ Verified</div>
              </div>
            ))
          )}
        </div>
      </section>

      <div className="info-box">
        <h4>🔐 Fraud Detection Methods</h4>
        <ul>
          <li>✓ Dual agent representation detection</li>
          <li>✓ Undisclosed dual representation flags</li>
          <li>✓ Multiple simultaneous transactions detection</li>
          <li>✓ Rapid consecutive sales detection</li>
          <li>✓ Property ownership verification</li>
          <li>✓ Transaction history analysis</li>
        </ul>
      </div>
    </div>
  );
}

export default FraudDetector;
