/**
 * BACKEND SERVER
 * REST API that connects to smart contracts
 * 
 * WHAT THIS DOES:
 * - Provides API endpoints for frontend
 * - Connects to PropertyRegistry and TransactionManager contracts
 * - Handles user requests and interacts with blockchain
 * - Provides fraud detection data
 * - Manages transaction history
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { connectDb } = require('./db');
const Property = require('./models/Property');
const Transaction = require('./models/Transaction');

const app = express();
const reactBuildPath = path.join(__dirname, '..', 'frontend', 'build');
const isReactBuildAvailable = fs.existsSync(reactBuildPath);

// ==================== MIDDLEWARE ====================
app.use(cors());
app.use(bodyParser.json());
app.use(async (req, res, next) => {
  try {
    await ensureInitialized();
    next();
  } catch (error) {
    next(error);
  }
});

// ==================== CONFIGURATION ====================
const RPC_URL = process.env.RPC_URL || process.env.SEPOLIA_RPC_URL || "http://127.0.0.1:8545";
const PROPERTY_REGISTRY_ADDRESS = process.env.PROPERTY_REGISTRY_ADDRESS;
const TRANSACTION_MANAGER_ADDRESS = process.env.TRANSACTION_MANAGER_ADDRESS;
const CONTRACT_ADDRESSES_FILE = process.env.CONTRACT_ADDRESSES_FILE || path.join(__dirname, 'contractAddresses.json');
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || process.env.PRIVATE_KEY;

let provider;
let propertyRegistry;
let transactionManager;
let initialized = false;
let initializationPromise;

async function initializeServices() {
  await connectDb();
  await initialize();
  initialized = true;
}

async function ensureInitialized() {
  if (!initialized) {
    if (!initializationPromise) {
      initializationPromise = initializeServices();
    }
    await initializationPromise;
  }
}

// ==================== CONTRACT ABIs ====================
const PROPERTY_REGISTRY_ABI = [
  "function registerProperty(uint256 propertyId, string memory propertyAddress) public",
  "function getProperty(uint256 propertyId) public view returns (tuple(uint256 propertyId, string propertyAddress, address currentOwner, uint256 registrationDate, bool isActive))",
  "function registerAgent(address agentAddress, string memory agentName) public",
  "function isAgentVerified(address agentAddress) public view returns (bool)",
  "function createTransaction(uint256 propertyId, address buyer, address sellerAgent, address buyerAgent, uint256 salePrice) public returns (bytes32)",
  "function getTransaction(bytes32 transactionId) public view returns (tuple(bytes32 transactionId, uint256 propertyId, address seller, address buyer, address sellerAgent, address buyerAgent, uint256 salePrice, bool isDualRepresentation, string status))",
  "function detectFraud(uint256 propertyId) public view returns (string memory, bool)",
  "function getAllProperties() public view returns (uint256[])",
  "function getAllTransactions() public view returns (bytes32[])",
  "event PropertyRegistered(uint256 indexed propertyId, address indexed owner)",
  "event TransactionCreated(bytes32 indexed transactionId, uint256 propertyId)",
  "event FraudDetected(bytes32 indexed transactionId, string fraudType)"
];

const TRANSACTION_MANAGER_ABI = [
  "function createEscrow(bytes32 transactionId, uint256 propertyId, address seller, address buyer, address escrowAgent, uint256 saleAmount) public",
  "function depositToEscrow(bytes32 transactionId) public payable",
  "function sellerApprove(bytes32 transactionId) public",
  "function buyerApprove(bytes32 transactionId) public",
  "function lenderApprove(bytes32 transactionId) public",
  "function closeTransaction(bytes32 transactionId) public",
  "function getEscrowTransaction(bytes32 transactionId) public view returns (tuple(bytes32 transactionId, uint256 propertyId, address seller, address buyer, address escrowAgent, uint256 saleAmount, uint256 buyerDepositAmount, uint256 sellerAcceptsAmount, bool buyerFundedEscrow, bool sellerSignedOff, bool buyerSignedOff, bool lenderSignedOff, uint256 createdDate, uint256 fundedDate, uint256 completedDate, uint8 state, string failureReason))",
  "function getSuspiciousActivityScore(address user) public view returns (uint256)",
  "function detectTransactionFraud(bytes32 transactionId) public view returns (bool isFraudulent, string memory reason)",
  "function getAllTransactions() public view returns (bytes32[])",
  "event EscrowCreated(bytes32 indexed transactionId, address seller, address buyer, uint256 amount)",
  "event FundsDepositedToEscrow(bytes32 indexed transactionId, address depositor, uint256 amount)"
];

// ==================== INITIALIZATION ====================
async function initialize() {
  try {
    console.log("📡 Connecting to blockchain...");
    provider = new ethers.providers.JsonRpcProvider(RPC_URL);
    const network = await provider.getNetwork();
    console.log(`🌐 Connected to network: ${network.name} (chainId ${network.chainId})`);

    // Read contract addresses from environment variables or the backend contract address file
    let addresses = {};
    if (PROPERTY_REGISTRY_ADDRESS && TRANSACTION_MANAGER_ADDRESS) {
      addresses.propertyRegistry = PROPERTY_REGISTRY_ADDRESS;
      addresses.transactionManager = TRANSACTION_MANAGER_ADDRESS;
      console.log('✅ Contract addresses loaded from environment variables');
    } else {
      if (!fs.existsSync(CONTRACT_ADDRESSES_FILE)) {
        throw new Error("Contract addresses file not found. Set CONTRACT_ADDRESSES_FILE or deploy contracts and create contractAddresses.json.");
      }

      addresses = JSON.parse(fs.readFileSync(CONTRACT_ADDRESSES_FILE, 'utf8'));
      console.log(`✅ Contract addresses loaded from file: ${CONTRACT_ADDRESSES_FILE}`);

      if (addresses.chainId && Number(addresses.chainId) !== network.chainId) {
        throw new Error(`Contract address file chainId ${addresses.chainId} does not match RPC network chainId ${network.chainId}. Update PROPERTY_REGISTRY_ADDRESS/TRANSACTION_MANAGER_ADDRESS or use the matching contractAddresses.json file.`);
      }
    }

    propertyRegistry = new ethers.Contract(
      addresses.propertyRegistry,
      PROPERTY_REGISTRY_ABI,
      provider
    );

    transactionManager = new ethers.Contract(
      addresses.transactionManager,
      TRANSACTION_MANAGER_ABI,
      provider
    );

    const propertyRegistryCode = await provider.getCode(addresses.propertyRegistry);
    const transactionManagerCode = await provider.getCode(addresses.transactionManager);

    if (!propertyRegistryCode || propertyRegistryCode === '0x') {
      throw new Error(`No contract code found at propertyRegistry address ${addresses.propertyRegistry} on network ${network.name}. Verify PROPERTY_REGISTRY_ADDRESS or the selected RPC_URL.`);
    }

    if (!transactionManagerCode || transactionManagerCode === '0x') {
      throw new Error(`No contract code found at transactionManager address ${addresses.transactionManager} on network ${network.name}. Verify TRANSACTION_MANAGER_ADDRESS or the selected RPC_URL.`);
    }

    console.log("✅ Contracts initialized successfully");
  } catch (error) {
    console.error("❌ Initialization error:", error.message);
    throw error;
  }
}

// ==================== API ENDPOINTS ====================

/**
 * @route GET /api/health
 * @desc Check if server and blockchain are connected
 */
app.get('/api/health', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    const network = provider.network || {};

    res.json({
      status: 'connected',
      blockNumber: blockNumber,
      network: network.name || 'unknown',
      chainId: network.chainId || null,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/db-health', async (req, res) => {
  try {
    const state = mongoose.connection.readyState;
    const statusMap = ['disconnected', 'connected', 'connecting', 'disconnecting'];

    res.json({
      status: statusMap[state] || 'unknown',
      state,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/register-property
 * @desc Register a new property on blockchain
 * @body { propertyId, address, title, estimatedValue, ownerAddress, privateKey }
 */
app.post('/api/register-property', async (req, res) => {
  try {
    const { propertyId, address: propertyAddress, title, estimatedValue, ownerAddress, privateKey } = req.body;

    if (!propertyId || !propertyAddress || !title || !estimatedValue || !ownerAddress) {
      return res.status(400).json({ error: 'Missing required fields: propertyId, propertyAddress, title, estimatedValue, and ownerAddress are required' });
    }

    const signerKey = privateKey || DEPLOYER_PRIVATE_KEY;
    if (!signerKey) {
      return res.status(500).json({ error: 'No signer key available for property registration. Set DEPLOYER_PRIVATE_KEY in environment.' });
    }

    const wallet = new ethers.Wallet(signerKey, provider);
    const contractWithSigner = propertyRegistry.connect(wallet);

    const tx = await contractWithSigner.registerProperty(propertyId, propertyAddress);
    const receipt = await tx.wait();

    const propertyData = {
      propertyId: Number(propertyId),
      address: propertyAddress,
      title,
      estimatedValue: Number(estimatedValue),
      ownerAddress,
      registrationDate: new Date(),
      isActive: false,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    };

    await Property.findOneAndUpdate({ propertyId: Number(propertyId) }, propertyData, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });

    res.json({
      success: true,
      message: 'Property registered successfully',
      transactionHash: tx.hash,
      blockNumber: receipt.blockNumber,
      propertyId: propertyId,
      owner: wallet.address
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/save-property
 * @desc Save property metadata after on-chain registration
 */
app.post('/api/save-property', async (req, res) => {
  try {
    const {
      propertyId,
      address: propertyAddress,
      title,
      estimatedValue,
      ownerAddress,
      txHash,
      blockNumber,
      isActive = false
    } = req.body;

    if (!propertyId || !propertyAddress || !title || !estimatedValue || !ownerAddress || !txHash) {
      return res.status(400).json({ error: 'Missing required fields for property metadata' });
    }

    const propertyData = {
      propertyId: Number(propertyId),
      address: propertyAddress,
      title,
      estimatedValue: Number(estimatedValue),
      ownerAddress,
      registrationDate: new Date(),
      isActive,
      txHash,
      blockNumber: blockNumber ? Number(blockNumber) : undefined
    };

    await Property.findOneAndUpdate({ propertyId: Number(propertyId) }, propertyData, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });

    res.json({
      success: true,
      message: 'Property metadata saved successfully',
      propertyId: propertyId,
      txHash: txHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/save-transaction
 * @desc Save transaction metadata after on-chain creation
 */
app.post('/api/save-transaction', async (req, res) => {
  try {
    const {
      transactionId,
      propertyId,
      seller,
      buyer,
      sellerAgent,
      buyerAgent,
      salePrice,
      isDualRepresentation,
      status = 'pending',
      txHash,
      blockNumber
    } = req.body;

    if (!transactionId || !propertyId || !seller || !buyer || !sellerAgent || !buyerAgent || !salePrice || !txHash) {
      return res.status(400).json({ error: 'Missing required fields for transaction metadata' });
    }

    await Transaction.findOneAndUpdate({ transactionId }, {
      transactionId,
      propertyId: Number(propertyId),
      seller,
      buyer,
      sellerAgent,
      buyerAgent,
      salePrice: Number(salePrice),
      isDualRepresentation: Boolean(isDualRepresentation),
      status,
      txHash,
      blockNumber: blockNumber ? Number(blockNumber) : undefined
    }, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    });

    res.json({
      success: true,
      message: 'Transaction metadata saved successfully',
      transactionId,
      txHash
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/property/:propertyId
 * @desc Get property details
 */
app.get('/api/property/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const dbProperty = await Property.findOne({ propertyId: Number(propertyId) }).lean();

    if (dbProperty) {
      return res.json({
        propertyId: dbProperty.propertyId,
        address: dbProperty.address,
        title: dbProperty.title,
        estimatedValue: dbProperty.estimatedValue,
        owner: dbProperty.ownerAddress,
        registrationDate: dbProperty.registrationDate ? dbProperty.registrationDate.toISOString() : null,
        isActive: dbProperty.isActive,
        txHash: dbProperty.txHash,
        blockNumber: dbProperty.blockNumber
      });
    }

    const property = await propertyRegistry.getProperty(propertyId);
    res.json({
      propertyId: property.propertyId.toString(),
      address: property.propertyAddress,
      owner: property.currentOwner,
      registrationDate: new Date(property.registrationDate.toNumber() * 1000).toISOString(),
      isActive: property.isActive
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/properties
 * @desc Get all registered properties
 */
app.get('/api/properties', async (req, res) => {
  try {
    const properties = await Property.find().lean();

    if (properties.length > 0) {
      return res.json(properties.map((property) => ({
        ...property,
        owner: property.ownerAddress || property.owner,
        registrationDate: property.registrationDate ? property.registrationDate.toISOString() : null
      })));
    }

    const propertyIds = await propertyRegistry.getAllProperties();
    const fetchedProperties = [];

    for (let id of propertyIds) {
      const property = await propertyRegistry.getProperty(id);
      fetchedProperties.push({
        propertyId: property.propertyId.toNumber(),
        address: property.propertyAddress,
        owner: property.currentOwner,
        isActive: property.isActive,
        registrationDate: new Date(property.registrationDate.toNumber() * 1000).toISOString()
      });
    }

    res.json(fetchedProperties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/create-transaction
 * @desc Create property transaction
 * @body { propertyId, buyer, sellerAgent, buyerAgent, salePrice, sellerDisclosed, buyerDisclosed, sellerPrivateKey }
 */
app.post('/api/create-transaction', async (req, res) => {
  try {
    const {
      propertyId,
      buyer,
      sellerAgent,
      buyerAgent,
      salePrice,
      sellerDisclosed,
      buyerDisclosed,
      sellerPrivateKey
    } = req.body;

    if (!propertyId || !buyer || !sellerAgent || !buyerAgent || !salePrice) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

    const isDual = sellerAgent.toLowerCase() === buyerAgent.toLowerCase();
    if (isDual && (!sellerDisclosed || !buyerDisclosed)) {
      return res.status(400).json({ error: 'Dual representation must be disclosed by both parties' });
    }

    const chainPropertyId = Number(propertyId);
    const property = await Property.findOne({ propertyId: chainPropertyId });

    if (!property) {
      return res.status(404).json({ error: `Property ${propertyId} not found in the database` });
    }

    const signerKey = sellerPrivateKey || DEPLOYER_PRIVATE_KEY;
    if (!signerKey) {
      return res.status(500).json({ error: 'No signer key available for transaction creation. Set DEPLOYER_PRIVATE_KEY in environment or provide sellerPrivateKey.' });
    }

    const wallet = new ethers.Wallet(signerKey, provider);
    if (wallet.address.toLowerCase() !== property.ownerAddress.toLowerCase()) {
      return res.status(403).json({ error: 'Transaction must be signed by the current property owner.' });
    }

    const contractWithSigner = propertyRegistry.connect(wallet);

    const tx = await contractWithSigner.createTransaction(
      chainPropertyId,
      buyer,
      sellerAgent,
      buyerAgent,
      ethers.utils.parseEther(salePrice.toString())
    );

    const receipt = await tx.wait();
    const event = receipt.events?.find((event) => event.event === 'TransactionCreated');
    const transactionIdHex = event?.args?.transactionId || receipt.logs[0]?.topics[1];

    const savedTransaction = await Transaction.create({
      transactionId: transactionIdHex,
      propertyId: chainPropertyId,
      seller: wallet.address,
      buyer,
      sellerAgent,
      buyerAgent,
      salePrice: Number(salePrice),
      isDualRepresentation: isDual,
      status: 'pending',
      txHash: tx.hash,
      blockNumber: receipt.blockNumber
    });

    await Property.findOneAndUpdate({ propertyId: chainPropertyId }, { isActive: true, updatedAt: new Date() });

    res.json({
      success: true,
      message: 'Transaction created successfully',
      transactionHash: tx.hash,
      transactionId: savedTransaction.transactionId,
      blockNumber: receipt.blockNumber,
      isDualRepresentation: isDual
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/transactions/:propertyId
 * @desc Get all transactions for a property
 */
app.get('/api/transactions/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const transactions = await Transaction.find({ propertyId: Number(propertyId) }).lean();

    if (transactions.length > 0) {
      return res.json(transactions.map((txn) => ({
        ...txn,
        salePrice: txn.salePrice.toString()
      })));
    }

    const transactionIds = await propertyRegistry.getAllTransactions();
    const chainTransactions = [];

    for (let txId of transactionIds) {
      const txn = await propertyRegistry.getTransaction(txId);
      if (txn.propertyId.toString() !== propertyId) continue;

      chainTransactions.push({
        transactionId: txId,
        seller: txn.seller,
        buyer: txn.buyer,
        sellerAgent: txn.sellerAgent,
        buyerAgent: txn.buyerAgent,
        salePrice: ethers.utils.formatEther(txn.salePrice),
        isDualRepresentation: txn.isDualRepresentation,
        status: txn.status
      });
    }

    res.json(chainTransactions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/detect-fraud/:propertyId
 * @desc Detect fraud patterns for a property
 */
app.get('/api/detect-fraud/:propertyId', async (req, res) => {
  try {
    const { propertyId } = req.params;
    const [fraudResult, hasFraud] = await propertyRegistry.detectFraud(propertyId);

    res.json({
      propertyId: propertyId,
      hasFraud: hasFraud,
      fraudAlert: fraudResult,
      severity: hasFraud ? 'HIGH' : 'NONE'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/verify-agent
 * @desc Verify if an agent is registered and verified
 * @body { agentAddress }
 */
app.post('/api/verify-agent', async (req, res) => {
  try {
    const { agentAddress } = req.body;

    const isVerified = await propertyRegistry.isAgentVerified(agentAddress);

    res.json({
      agentAddress: agentAddress,
      isVerified: isVerified,
      status: isVerified ? 'VERIFIED' : 'NOT_VERIFIED'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/suspicion-score/:address
 * @desc Get suspicious activity score for an address
 */
app.get('/api/suspicious-score/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const score = await transactionManager.getSuspiciousActivityScore(address);

    res.json({
      address: address,
      suspiciousActivityScore: score.toString(),
      risk: score > 5 ? 'HIGH' : score > 2 ? 'MEDIUM' : 'LOW'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /api/escrow/:transactionId
 * @desc Get escrow transaction details
 */
app.get('/api/escrow/:transactionId', async (req, res) => {
  try {
    const { transactionId } = req.params;
    const escrow = await transactionManager.getEscrowTransaction(transactionId);

    const states = ['PENDING', 'ESCROW_FUNDED', 'READY_TO_CLOSE', 'COMPLETED', 'DISPUTED'];

    res.json({
      transactionId: transactionId,
      seller: escrow.seller,
      buyer: escrow.buyer,
      saleAmount: ethers.utils.formatEther(escrow.saleAmount),
      buyerDeposit: ethers.utils.formatEther(escrow.buyerDepositAmount),
      state: states[escrow.state],
      buyerFundedEscrow: escrow.buyerFundedEscrow,
      sellerSignedOff: escrow.sellerSignedOff,
      buyerSignedOff: escrow.buyerSignedOff,
      createdDate: new Date(escrow.createdDate.toNumber() * 1000).toISOString(),
      completedDate: escrow.completedDate.toNumber() > 0 ? 
        new Date(escrow.completedDate.toNumber() * 1000).toISOString() : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /api/escrow/deposit
 * @desc Deposit funds to escrow
 * @body { transactionId, amount, buyerPrivateKey }
 */
app.post('/api/escrow/deposit', async (req, res) => {
  try {
    const { transactionId, amount, buyerPrivateKey } = req.body;

    const wallet = new ethers.Wallet(buyerPrivateKey, provider);
    const contractWithSigner = transactionManager.connect(wallet);

    const tx = await contractWithSigner.depositToEscrow(transactionId, {
      value: ethers.utils.parseEther(amount.toString())
    });

    const receipt = await tx.wait();

    res.json({
      success: true,
      message: 'Funds deposited to escrow',
      transactionHash: tx.hash,
      amount: amount,
      blockNumber: receipt.blockNumber
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

if (isReactBuildAvailable) {
  app.use(express.static(reactBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
      return next();
    }
    res.sendFile(path.join(reactBuildPath, 'index.html'));
  });
}

// ==================== ERROR HANDLING ====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ==================== START SERVER ====================
const PORT = process.env.PORT || 3001;

async function startServer() {
  await ensureInitialized();

  app.listen(PORT, () => {
    console.log(`\n✅ Backend server running on http://localhost:${PORT}`);
    console.log("📚 API Endpoints:");
    console.log("   GET  /api/health");
    console.log("   GET  /api/properties");
    console.log("   GET  /api/property/:id");
    console.log("   POST /api/register-property");
    console.log("   POST /api/create-transaction");
    console.log("   GET  /api/transactions/:propertyId");
    console.log("   GET  /api/detect-fraud/:propertyId");
    console.log("   POST /api/verify-agent");
    console.log("   GET  /api/suspicious-score/:address");
    console.log("   GET  /api/escrow/:transactionId");
    console.log("   POST /api/escrow/deposit\n");
  });
}

if (require.main === module) {
  startServer().catch(console.error);
}

module.exports = { app, ensureInitialized };
