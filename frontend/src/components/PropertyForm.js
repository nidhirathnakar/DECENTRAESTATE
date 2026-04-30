/**
 * PropertyForm Component
 * 
 * WHAT THIS DOES:
 * - Form to register new property on blockchain
 * - Validates inputs
 * - Uses MetaMask signer for on-chain registration
 * - Saves metadata to backend database
 */

import React, { useState } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contract';

function PropertyForm({ account, API_URL, onPropertyRegistered }) {
  const [formData, setFormData] = useState({
    propertyId: '',
    address: '',
    title: '',
    estimatedValue: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      if (!formData.propertyId || !formData.address || !formData.title || !formData.estimatedValue) {
        setError('Please fill all fields');
        return;
      }

      if (!account) {
        setError('Please connect your wallet');
        return;
      }

      if (!window.ethereum) {
        setError('MetaMask is required to register a property');
        return;
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const signerAddress = await signer.getAddress();

      if (signerAddress.toLowerCase() !== account.toLowerCase()) {
        setError('Connected wallet address does not match the selected account');
        return;
      }

      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      const tx = await contract.registerProperty(
        parseInt(formData.propertyId, 10),
        formData.address
      );

      const receipt = await tx.wait();

      const saveResponse = await fetch(`${API_URL}/save-property`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          propertyId: parseInt(formData.propertyId, 10),
          address: formData.address,
          title: formData.title,
          estimatedValue: parseFloat(formData.estimatedValue),
          ownerAddress: account,
          txHash: tx.hash,
          blockNumber: receipt.blockNumber,
          isActive: false
        })
      });

      const saveData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save property metadata');
      }

      setMessage(`✅ Property registered! TX: ${tx.hash.substring(0, 20)}...`);

      setFormData({
        propertyId: '',
        address: '',
        title: '',
        estimatedValue: ''
      });

      setTimeout(() => {
        onPropertyRegistered();
      }, 1500);
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setError('❌ Transaction rejected by user');
      } else {
        setError(`❌ Failed to register property: ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Register New Property</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <form onSubmit={handleSubmit} className="property-form">
        <div className="form-group">
          <label>Property ID *</label>
          <input
            type="number"
            name="propertyId"
            value={formData.propertyId}
            onChange={handleChange}
            placeholder="e.g., 1"
            required
          />
        </div>

        <div className="form-group">
          <label>Property Address *</label>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g., Bangalore, India"
            required
          />
        </div>

        <div className="form-group">
          <label>Property Title/Deed *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g., DEED-2026-001"
            required
          />
        </div>

        <div className="form-group">
          <label>Estimated Value (ETH) *</label>
          <input
            type="number"
            name="estimatedValue"
            value={formData.estimatedValue}
            onChange={handleChange}
            step="0.01"
            placeholder="e.g., 2.5"
            required
          />
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? '⏳ Registering...' : '📝 Register Property'}
        </button>
      </form>

      <div className="info-box">
        <h4>ℹ️ How it works:</h4>
        <ul>
          <li>Property ID must be unique</li>
          <li>Stored securely on blockchain</li>
          <li>You become the owner</li>
          <li>Cannot be duplicated</li>
        </ul>
      </div>
    </div>
  );
}

export default PropertyForm;

