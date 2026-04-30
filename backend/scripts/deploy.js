/**
 * DEPLOYMENT SCRIPT
 * This script deploys both smart contracts to the blockchain
 * and saves their addresses for frontend use
 * 
 * WHAT THIS DOES:
 * 1. Deploys PropertyRegistry contract
 * 2. Deploys TransactionManager contract
 * 3. Registers sample agents
 * 4. Logs contract addresses to console and file
 */
const fs = require('fs');
const path = require('path');
require("dotenv").config();

const hre = require("hardhat");

async function main() {
  const { ethers } = hre;

  console.log("🚀 Starting contract deployment...\n");

  // Get deployer
  const [deployer] = await ethers.getSigners();

  console.log("📝 Deploying with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(balance), "ETH");

  // ==================== DEPLOY PropertyRegistry ====================
  console.log("\n📦 Deploying PropertyRegistry...");

  const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
  const propertyRegistry = await PropertyRegistry.deploy();

  // ✅ ethers v5 syntax
  await propertyRegistry.deployed();

  console.log("✅ PropertyRegistry deployed to:", propertyRegistry.address);

  // ==================== DEPLOY TransactionManager ====================
  console.log("\n📦 Deploying TransactionManager...");

  const TransactionManager = await ethers.getContractFactory("TransactionManager");
  const transactionManager = await TransactionManager.deploy();

  await transactionManager.deployed();

  console.log("✅ TransactionManager deployed to:", transactionManager.address);

  // ==================== REGISTER AGENT ====================
  console.log("\n👤 Registering agent...");

  try {
    const tx = await propertyRegistry.registerAgent(
      deployer.address,
      "Elite Real Estate Agency"
    );
    await tx.wait();
    console.log("✅ Agent registered");
  } catch (err) {
    console.log("⚠️ Agent registration skipped:", err.message);
  }

  // ==================== SAVE ADDRESSES ====================
  console.log("\n💾 Saving contract addresses...");

  const addresses = {
    propertyRegistry: propertyRegistry.address,
    transactionManager: transactionManager.address,
    network: "sepolia",
    chainId: 11155111,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address
  };

  const filePath = path.join(__dirname, '../contractAddresses.json');
  fs.writeFileSync(filePath, JSON.stringify(addresses, null, 2));

  console.log("✅ Saved to:", filePath);

  // ==================== SUMMARY ====================
  console.log("\n==========================================");
  console.log("📋 DEPLOYMENT SUCCESS");
  console.log("==========================================");

  console.log("PropertyRegistry:", propertyRegistry.address);
  console.log("TransactionManager:", transactionManager.address);

  console.log("\nNetwork: Sepolia");
  console.log("Deployer:", deployer.address);

  console.log("==========================================\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
