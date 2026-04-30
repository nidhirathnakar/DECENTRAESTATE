/**
 * TransactionForm Component
 * 
 * WHAT THIS DOES:
 * - Form to create property transaction
 * - Handles dual representation disclosure
 * - Uses MetaMask signer for on-chain transaction creation
 * - Saves metadata to backend database
 */

import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { contractAddress, contractABI } from '../contract';

function TransactionForm({ account, properties, API_URL, onTransactionCreated, initialPropertyId }) {
  const [formData, setFormData] = useState({
    propertyId: '',
    buyer: '',
    sellerAgent: '',
    buyerAgent: '',
    salePrice: '',
    sellerDisclosed: false,
    buyerDisclosed: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dualRepWarning, setDualRepWarning] = useState(false);

  useEffect(() => {
    if (initialPropertyId) {
      setFormData((prev) => ({ ...prev, propertyId: initialPropertyId }));
    }
  }, [initialPropertyId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newData = {
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    };
    
    setFormData(newData);

    if (newData.sellerAgent && newData.buyerAgent && 
        newData.sellerAgent.toLowerCase() === newData.buyerAgent.toLowerCase()) {
      setDualRepWarning(true);
    } else {
      setDualRepWarning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setMessage('');

    try {
      if (!formData.propertyId || !formData.buyer || !formData.sellerAgent || 
          !formData.buyerAgent || !formData.salePrice) {
        setError('Please fill all fields');
        return;
      }

      const invalidAddress = [formData.buyer, formData.sellerAgent, formData.buyerAgent]
        .find(addr => !ethers.utils.isAddress(addr));
      if (invalidAddress) {
        setError('Please enter valid Ethereum addresses for buyer, seller agent, and buyer agent. Use 0x... format.');
        return;
      }

      const isDual = formData.sellerAgent.toLowerCase() === formData.buyerAgent.toLowerCase();
      if (isDual && (!formData.sellerDisclosed || !formData.buyerDisclosed)) {
        setError('❌ FRAUD PROTECTION: Dual representation MUST be disclosed to both parties!');
        return;
      }

      if (!account) {
        setError('Please connect your wallet to create the transaction');
        return;
      }

      if (!window.ethereum) {
        setError('MetaMask is required to sign this transaction');
        return;
      }

      const selectedProperty = properties.find((prop) => String(prop.propertyId) === String(formData.propertyId));
      if (!selectedProperty) {
        setError('Selected property not found');
        return;
      }

      if (selectedProperty.owner?.toLowerCase() !== account.toLowerCase()) {
        setError('You must be the current property owner (seller) to create a transaction');
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
      const tx = await contract.createTransaction(
        parseInt(formData.propertyId, 10),
        formData.buyer,
        formData.sellerAgent,
        formData.buyerAgent,
        ethers.utils.parseEther(formData.salePrice.toString())
      );

      const receipt = await tx.wait();
      const event = receipt.events?.find((eventItem) => eventItem.event === 'TransactionCreated');
      const transactionIdHex = event?.args?.transactionId || null;

      if (!transactionIdHex) {
        throw new Error('Transaction ID was not emitted by the contract');
      }

      const saveResponse = await fetch(`${API_URL}/save-transaction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          transactionId: transactionIdHex.toString(),
          propertyId: parseInt(formData.propertyId, 10),
          seller: account,
          buyer: formData.buyer,
          sellerAgent: formData.sellerAgent,
          buyerAgent: formData.buyerAgent,
          salePrice: parseFloat(formData.salePrice),
          isDualRepresentation: isDual,
          status: 'pending',
          txHash: tx.hash,
          blockNumber: receipt.blockNumber
        })
      });

      const saveData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save transaction metadata');
      }

      const dualMsg = isDual ? ' (Dual Representation Disclosed)' : '';
      setMessage(`✅ Transaction created!${dualMsg} TX: ${tx.hash.substring(0, 20)}...`);
      setFormData({
        propertyId: '',
        buyer: '',
        sellerAgent: '',
        buyerAgent: '',
        salePrice: '',
        sellerDisclosed: false,
        buyerDisclosed: false
      });

      setTimeout(() => {
        onTransactionCreated();
      }, 2000);
    } catch (err) {
      console.error(err);
      if (err.code === 4001) {
        setError('❌ Transaction rejected by user');
      } else {
        setError(err.message || 'Failed to create transaction');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="form-container">
      <h2>Create Property Transaction</h2>
      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-error">{error}</div>}
      {dualRepWarning && (
        <div className="alert alert-warning">
          ⚠️ DUAL REPRESENTATION DETECTED: Same agent for both parties. Must be disclosed to both parties!
        </div>
      )}

      <form onSubmit={handleSubmit} className="transaction-form">
        <div className="form-group">
          <label htmlFor="propertyId">Property ID *</label>
          <select
            id="propertyId"
            name="propertyId"
            value={formData.propertyId}
            onChange={handleChange}
            required
          >
            <option value="">Select a property...</option>
            {properties.map(prop => (
              <option key={prop.propertyId} value={prop.propertyId}>
                #{prop.propertyId} - {prop.address}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="buyer">Buyer Address *</label>
          <input
            type="text"
            id="buyer"
            name="buyer"
            value={formData.buyer}
            onChange={handleChange}
            placeholder="0x1234... (use a valid Ethereum address)"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="sellerAgent">Seller Agent Address *</label>
          <input
            type="text"
            id="sellerAgent"
            name="sellerAgent"
            value={formData.sellerAgent}
            onChange={handleChange}
            placeholder="0x..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="buyerAgent">Buyer Agent Address *</label>
          <input
            type="text"
            id="buyerAgent"
            name="buyerAgent"
            value={formData.buyerAgent}
            onChange={handleChange}
            placeholder="0x..."
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="salePrice">Sale Price (ETH) *</label>
          <input
            type="number"
            id="salePrice"
            name="salePrice"
            value={formData.salePrice}
            onChange={handleChange}
            placeholder="e.g., 500"
            step="0.01"
            required
          />
        </div>

        <div className="disclosure-section">
          <h4>🔐 Agent Disclosure</h4>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="sellerDisclosed"
              checked={formData.sellerDisclosed}
              onChange={handleChange}
            />
            Seller acknowledges and discloses dual representation (if applicable)
          </label>

          <label className="checkbox-label">
            <input
              type="checkbox"
              name="buyerDisclosed"
              checked={formData.buyerDisclosed}
              onChange={handleChange}
            />
            Buyer acknowledges and discloses dual representation (if applicable)
          </label>
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting}>
          {isSubmitting ? '⏳ Creating...' : '💼 Create Transaction'}
        </button>
      </form>

      <div className="info-box">
        <h4>ℹ️ Fraud Prevention:</h4>
        <ul>
          <li>✅ Dual representation is detected automatically</li>
          <li>✅ Both parties MUST disclose dual representation</li>
          <li>✅ Transaction is rejected if disclosure is missing</li>
          <li>✅ All transactions are recorded immutably</li>
          <li>✅ Property cannot have multiple simultaneous transactions</li>
        </ul>
      </div>
    </div>
  );
}

export default TransactionForm;
