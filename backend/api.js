/**
 * API.JS - Backend API Client
 * 
 * WHAT THIS DOES:
 * - Provides helper functions to call backend API
 * - Handles HTTP requests (GET, POST)
 * - Formats responses
 * - Error handling
 * - Authentication (wallet address)
 * 
 * USAGE:
 * import { getProperties, registerProperty, detectFraud } from './api';
 * 
 * const properties = await getProperties();
 * const result = await registerProperty({ ... });
 */

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// ==================== HEALTH CHECK ====================

/**
 * Check if backend server is connected
 * @returns {Promise} Server health status
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'disconnected', error: error.message };
  }
}

// ==================== PROPERTY FUNCTIONS ====================

/**
 * Get all registered properties
 * @returns {Promise<Array>} Array of property objects
 * 
 * Example response:
 * [
 *   {
 *     propertyId: "1",
 *     address: "123 Main Street",
 *     currentOwner: "0x...",
 *     isActive: false,
 *     estimatedValue: "500"
 *   }
 * ]
 */
export async function getProperties() {
  try {
    const response = await fetch(`${API_URL}/properties`);
    if (!response.ok) throw new Error('Failed to fetch properties');
    return await response.json();
  } catch (error) {
    console.error('Error fetching properties:', error);
    throw error;
  }
}

/**
 * Get details for a single property
 * @param {number} propertyId - Property ID
 * @returns {Promise<Object>} Property details
 * 
 * Example response:
 * {
 *   propertyId: "1",
 *   address: "123 Main Street, NY",
 *   currentOwner: "0x...",
 *   isActive: false,
 *   estimatedValue: "500",
 *   registrationDate: "2024-03-30T..."
 * }
 */
export async function getProperty(propertyId) {
  try {
    const response = await fetch(`${API_URL}/property/${propertyId}`);
    if (!response.ok) throw new Error('Property not found');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching property ${propertyId}:`, error);
    throw error;
  }
}

/**
 * Register a new property on blockchain
 * @param {Object} data - Property data
 * @param {number} data.propertyId - Unique property ID
 * @param {string} data.address - Physical address
 * @param {string} data.title - Property deed/title number
 * @param {number} data.estimatedValue - Value in ETH
 * @param {string} data.ownerAddress - Owner wallet address
 * @param {string} data.privateKey - Owner private key (for signing)
 * @returns {Promise<Object>} Transaction details
 * 
 * Example call:
 * const result = await registerProperty({
 *   propertyId: 1,
 *   address: "123 Main Street, NY",
 *   title: "DEED-2024-001",
 *   estimatedValue: 500,
 *   ownerAddress: "0x...",
 *   privateKey: "0x..."
 * });
 * 
 * Example response:
 * {
 *   success: true,
 *   message: "Property registered successfully",
 *   transactionHash: "0x...",
 *   blockNumber: 123,
 *   propertyId: 1
 * }
 */
export async function registerProperty(data) {
  try {
    const response = await fetch(`${API_URL}/register-property`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to register property');
    }

    return await response.json();
  } catch (error) {
    console.error('Error registering property:', error);
    throw error;
  }
}

// ==================== TRANSACTION FUNCTIONS ====================

/**
 * Get all transactions for a property
 * @param {number} propertyId - Property ID
 * @returns {Promise<Array>} Array of transaction objects
 * 
 * Example response:
 * [
 *   {
 *     transactionId: "0x...",
 *     seller: "0x...",
 *     buyer: "0x...",
 *     salePrice: "500",
 *     status: "pending",
 *     isDualRepresentation: false,
 *     date: "2024-03-30T..."
 *   }
 * ]
 */
export async function getTransactions(propertyId) {
  try {
    const response = await fetch(`${API_URL}/transactions/${propertyId}`);
    if (!response.ok) throw new Error('Failed to fetch transactions');
    return await response.json();
  } catch (error) {
    console.error(`Error fetching transactions for property ${propertyId}:`, error);
    throw error;
  }
}

/**
 * Create a property transaction (sale)
 * @param {Object} data - Transaction data
 * @param {number} data.propertyId - Property being sold
 * @param {string} data.buyer - Buyer wallet address
 * @param {string} data.sellerAgent - Seller's agent address
 * @param {string} data.buyerAgent - Buyer's agent address
 * @param {number} data.salePrice - Sale price in ETH
 * @param {boolean} data.sellerDisclosed - Seller disclosed dual representation?
 * @param {boolean} data.buyerDisclosed - Buyer disclosed dual representation?
 * @param {string} data.sellerPrivateKey - Seller's private key
 * @returns {Promise<Object>} Transaction details
 * 
 * Example call:
 * const result = await createTransaction({
 *   propertyId: 1,
 *   buyer: "0x70997970C51812e339D9B73b0245be3C2C6e002d",
 *   sellerAgent: "0x70997970C51812e339D9B73b0245be3C2C6e002d",
 *   buyerAgent: "0x3C44CdDdB6a900756B2362b3434ac0b7cDef50fF",
 *   salePrice: 500,
 *   sellerDisclosed: false,
 *   buyerDisclosed: false,
 *   sellerPrivateKey: "0x..."
 * });
 * 
 * Example response:
 * {
 *   success: true,
 *   message: "Transaction created successfully",
 *   transactionHash: "0x...",
 *   transactionId: "0x...",
 *   isDualRepresentation: false
 * }
 */
export async function createTransaction(data) {
  try {
    // Validate dual representation disclosure
    if (data.sellerAgent.toLowerCase() === data.buyerAgent.toLowerCase()) {
      if (!data.sellerDisclosed || !data.buyerDisclosed) {
        throw new Error('Dual representation MUST be disclosed to both parties!');
      }
    }

    const response = await fetch(`${API_URL}/create-transaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create transaction');
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating transaction:', error);
    throw error;
  }
}

// ==================== FRAUD DETECTION ====================

/**
 * Detect fraud for a property
 * @param {number} propertyId - Property ID
 * @returns {Promise<Object>} Fraud detection results
 * 
 * Example response:
 * {
 *   propertyId: "1",
 *   hasFraud: false,
 *   fraudAlert: "No fraud detected",
 *   severity: "NONE"
 * }
 * 
 * or if fraud:
 * {
 *   propertyId: "2",
 *   hasFraud: true,
 *   fraudAlert: "POTENTIAL FRAUD: Multiple simultaneous transactions",
 *   severity: "HIGH"
 * }
 */
export async function detectFraud(propertyId) {
  try {
    const response = await fetch(`${API_URL}/detect-fraud/${propertyId}`);
    if (!response.ok) throw new Error('Failed to detect fraud');
    return await response.json();
  } catch (error) {
    console.error(`Error detecting fraud for property ${propertyId}:`, error);
    throw error;
  }
}

// ==================== AGENT FUNCTIONS ====================

/**
 * Verify if an agent is registered and verified
 * @param {string} agentAddress - Agent wallet address
 * @returns {Promise<Object>} Agent verification status
 * 
 * Example response:
 * {
 *   agentAddress: "0x70997970C51812e339D9B73b0245be3C2C6e002d",
 *   isVerified: true,
 *   status: "VERIFIED"
 * }
 */
export async function verifyAgent(agentAddress) {
  try {
    const response = await fetch(`${API_URL}/verify-agent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ agentAddress })
    });

    if (!response.ok) throw new Error('Failed to verify agent');
    return await response.json();
  } catch (error) {
    console.error('Error verifying agent:', error);
    throw error;
  }
}

// ==================== SUSPICIOUS ACTIVITY ====================

/**
 * Get suspicion score for an address
 * @param {string} address - Wallet address
 * @returns {Promise<Object>} Suspicion score and risk level
 * 
 * Example response:
 * {
 *   address: "0x70997970C51812e339D9B73b0245be3C2C6e002d",
 *   suspiciousActivityScore: "0",
 *   risk: "LOW"
 * }
 */
export async function getSuspiciousScore(address) {
  try {
    const response = await fetch(`${API_URL}/suspicious-score/${address}`);
    if (!response.ok) throw new Error('Failed to get suspicious score');
    return await response.json();
  } catch (error) {
    console.error('Error getting suspicious score:', error);
    throw error;
  }
}

// ==================== ESCROW FUNCTIONS ====================

/**
 * Get escrow transaction details
 * @param {string} transactionId - Transaction ID
 * @returns {Promise<Object>} Escrow details
 * 
 * Example response:
 * {
 *   transactionId: "0x...",
 *   seller: "0x...",
 *   buyer: "0x...",
 *   saleAmount: "500",
 *   buyerDeposit: "50",
 *   state: "PENDING",
 *   buyerFundedEscrow: false,
 *   sellerSignedOff: false,
 *   buyerSignedOff: false,
 *   createdDate: "2024-03-30T..."
 * }
 */
export async function getEscrowDetails(transactionId) {
  try {
    const response = await fetch(`${API_URL}/escrow/${transactionId}`);
    if (!response.ok) throw new Error('Failed to get escrow details');
    return await response.json();
  } catch (error) {
    console.error('Error getting escrow details:', error);
    throw error;
  }
}

/**
 * Deposit funds to escrow
 * @param {Object} data - Deposit data
 * @param {string} data.transactionId - Transaction ID
 * @param {number} data.amount - Amount to deposit (in ETH)
 * @param {string} data.buyerPrivateKey - Buyer's private key
 * @returns {Promise<Object>} Deposit confirmation
 * 
 * Example call:
 * const result = await depositToEscrow({
 *   transactionId: "0x...",
 *   amount: 50,
 *   buyerPrivateKey: "0x..."
 * });
 * 
 * Example response:
 * {
 *   success: true,
 *   message: "Funds deposited to escrow",
 *   transactionHash: "0x...",
 *   amount: 50,
 *   blockNumber: 456
 * }
 */
export async function depositToEscrow(data) {
  try {
    const response = await fetch(`${API_URL}/escrow/deposit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to deposit to escrow');
    }

    return await response.json();
  } catch (error) {
    console.error('Error depositing to escrow:', error);
    throw error;
  }
}

// ==================== ERROR HANDLING ====================

/**
 * Parse error message from API response
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  if (error.message) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Check if error is due to network connectivity
 * @param {Error} error - Error object
 * @returns {boolean} Is network error?
 */
export function isNetworkError(error) {
  return error.message.includes('Failed to fetch') ||
         error.message.includes('disconnected') ||
         error.message.includes('connection');
}

// ==================== UTILITY FUNCTIONS ====================

/**
 * Format ETH amount for display
 * @param {string|number} ethAmount - Amount in ETH
 * @returns {string} Formatted amount
 */
export function formatEth(ethAmount) {
  const num = parseFloat(ethAmount);
  return num.toFixed(2) + ' ETH';
}

/**
 * Shorten wallet address for display
 * @param {string} address - Full wallet address
 * @returns {string} Shortened address
 */
export function shortenAddress(address) {
  if (!address) return '';
  return address.substring(0, 6) + '...' + address.substring(38);
}

/**
 * Convert Unix timestamp to readable date
 * @param {number} timestamp - Unix timestamp
 * @returns {string} Formatted date
 */
export function formatDate(timestamp) {
  return new Date(timestamp * 1000).toLocaleDateString();
}

/**
 * Format transaction status for display
 * @param {string} status - Transaction status
 * @returns {string} Formatted status with emoji
 */
export function formatStatus(status) {
  const statusMap = {
    'pending': '⏳ Pending',
    'completed': '✅ Completed',
    'fraud_detected': '🚨 Fraud Detected',
    'disputed': '⚖️ Disputed'
  };
  return statusMap[status] || status;
}

// ==================== EXPORT SUMMARY ====================

/**
 * AVAILABLE FUNCTIONS IN THIS MODULE:
 * 
 * Health & Status:
 * - checkHealth()
 * 
 * Properties:
 * - getProperties()
 * - getProperty(propertyId)
 * - registerProperty(data)
 * 
 * Transactions:
 * - getTransactions(propertyId)
 * - createTransaction(data)
 * 
 * Fraud Detection:
 * - detectFraud(propertyId)
 * 
 * Agents:
 * - verifyAgent(agentAddress)
 * 
 * Suspicious Activity:
 * - getSuspiciousScore(address)
 * 
 * Escrow:
 * - getEscrowDetails(transactionId)
 * - depositToEscrow(data)
 * 
 * Utilities:
 * - getErrorMessage(error)
 * - isNetworkError(error)
 * - formatEth(amount)
 * - shortenAddress(address)
 * - formatDate(timestamp)
 * - formatStatus(status)
 */
