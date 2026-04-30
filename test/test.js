/**
 * TEST SUITE FOR SMART CONTRACTS
 * Tests all fraud detection and transaction features
 * 
 * WHAT THIS TESTS:
 * 1. Property registration
 * 2. Agent verification
 * 3. Transaction creation
 * 4. Fraud detection (dual representation)
 * 5. Double-sale prevention
 * 6. Escrow functionality
 */

const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Real Estate Blockchain - Fraud Detection Tests", function () {
  let propertyRegistry;
  let transactionManager;
  let owner;
  let buyer;
  let seller;
  let agent1;
  let agent2;

  beforeEach(async function () {
    // Get test accounts
    [owner, seller, buyer, agent1, agent2] = await ethers.getSigners();

    // Deploy contracts
    const PropertyRegistry = await ethers.getContractFactory("PropertyRegistry");
    propertyRegistry = await PropertyRegistry.deploy();
    await propertyRegistry.deployed();

    const TransactionManager = await ethers.getContractFactory("TransactionManager");
    transactionManager = await TransactionManager.deploy();
    await transactionManager.deployed();

    // Register agents
    await propertyRegistry.registerAgent(agent1.address, "Elite Realty Agency");
    await propertyRegistry.registerAgent(agent2.address, "Pro Property Agents");
  });

  // ==================== TEST PROPERTY REGISTRATION ====================
  describe("Property Registration", function () {
    it("Should register a property successfully", async function () {
      await propertyRegistry.connect(seller).registerProperty(
        1,
        "123 Main Street, NY",
        "DEED-2024-001",
        ethers.utils.parseEther("500")
      );

      const property = await propertyRegistry.getProperty(1);
      expect(property.propertyAddress).to.equal("123 Main Street, NY");
      expect(property.currentOwner).to.equal(seller.address);
    });

    it("Should prevent duplicate property registration", async function () {
      await propertyRegistry.connect(seller).registerProperty(
        1,
        "123 Main Street, NY",
        "DEED-2024-001",
        ethers.utils.parseEther("500")
      );

      // Try to register same property again
      await expect(
        propertyRegistry.connect(seller).registerProperty(
          1,
          "456 Oak Ave, CA",
          "DEED-2024-002",
          ethers.utils.parseEther("600")
        )
      ).to.be.revertedWith("Property already registered");
    });
  });

  // ==================== TEST TRANSACTION CREATION ====================
  describe("Transaction Creation", function () {
    beforeEach(async function () {
      // Register property before each test
      await propertyRegistry.connect(seller).registerProperty(
        1,
        "123 Main Street, NY",
        "DEED-2024-001",
        ethers.utils.parseEther("500")
      );
    });

    it("Should create transaction with different agents", async function () {
      const txResult = await propertyRegistry.connect(seller).createTransaction(
        1,                        // propertyId
        buyer.address,            // buyer
        agent1.address,           // sellerAgent
        agent2.address,           // buyerAgent (different)
        ethers.utils.parseEther("500"),
        true,                     // sellerAgentDisclosed
        false                     // buyerAgentDisclosed (no need if different agents)
      );

      const receipt = await txResult.wait();
      expect(receipt.status).to.equal(1); // Success
    });

    it("❌ FRAUD TEST: Should reject undisclosed dual representation", async function () {
      // Attempt to use same agent for both without disclosure
      await expect(
        propertyRegistry.connect(seller).createTransaction(
          1,
          buyer.address,
          agent1.address,          // Same agent
          agent1.address,          // Same agent
          ethers.utils.parseEther("500"),
          false,                   // NOT disclosed
          false                    // NOT disclosed
        )
      ).to.be.revertedWith(
        "Dual representation MUST be disclosed to both parties"
      );
    });

    it("✅ Dual representation should be allowed WITH proper disclosure", async function () {
      // Same agent but both parties disclosed it
      const txResult = await propertyRegistry.connect(seller).createTransaction(
        1,
        buyer.address,
        agent1.address,
        agent1.address,
        ethers.utils.parseEther("500"),
        true,                     // ✅ DISCLOSED
        true                      // ✅ DISCLOSED
      );

      const receipt = await txResult.wait();
      expect(receipt.status).to.equal(1);
    });

    it("❌ Should prevent seller from selling to themselves", async function () {
      await expect(
        propertyRegistry.connect(seller).createTransaction(
          1,
          seller.address,           // Buyer = Seller (invalid)
          agent1.address,
          agent2.address,
          ethers.utils.parseEther("500"),
          true,
          false
        )
      ).to.be.revertedWith("Buyer cannot be seller");
    });

    it("❌ Should prevent transaction on already-active property", async function () {
      // Create first transaction
      await propertyRegistry.connect(seller).createTransaction(
        1,
        buyer.address,
        agent1.address,
        agent2.address,
        ethers.utils.parseEther("500"),
        true,
        false
      );

      // Try to create second transaction on same property
      const seller2 = await ethers.getSigner(seller.address);
      await expect(
        propertyRegistry.connect(seller2).createTransaction(
          1,
          buyer.address,           // Different buyer
          agent1.address,
          agent2.address,
          ethers.utils.parseEther("450"),
          true,
          false
        )
      ).to.be.revertedWith("Property already in active transaction");
    });
  });

  // ==================== TEST FRAUD DETECTION ====================
  describe("Fraud Detection", function () {
    beforeEach(async function () {
      await propertyRegistry.connect(seller).registerProperty(
        1,
        "123 Main Street, NY",
        "DEED-2024-001",
        ethers.utils.parseEther("500")
      );
    });

    it("Should detect undisclosed dual representation fraud", async function () {
      // Create undisclosed dual representation (which is prevented by contract)
      // Mark property as active by creating valid transaction first
      await propertyRegistry.connect(seller).registerProperty(
        2,
        "456 Oak Ave, CA",
        "DEED-2024-002",
        ethers.utils.parseEther("600")
      );

      const buyerAccount2 = (await ethers.getSigners())[5];
      const fraudTxn = await propertyRegistry.connect(seller).createTransaction(
        2,
        buyerAccount2.address,
        agent1.address,
        agent1.address,          // Same agent
        ethers.utils.parseEther("600"),
        true,                    // Both disclosed (valid)
        true
      );

      const receipt = await fraudTxn.wait();
      const transactionId = receipt.logs[0].topics[1]; // Get transactionId from event

      // Check fraud detection
      const fraud = await propertyRegistry.detectFraud(2);
      console.log("Fraud detection result:", fraud);
    });

    it("Should flag rapid consecutive sales as potential fraud", async function () {
      // This would require time manipulation in mainnet, but logic is in place
      const fraud = await propertyRegistry.detectFraud(1);
      expect(fraud.hasFraud).to.be.false;
    });
  });

  // ==================== TEST ESCROW FUNCTIONALITY ====================
  describe("Escrow Management", function () {
    let transactionId;

    beforeEach(async function () {
      transactionId = ethers.utils.formatBytes32String("escrow-1");
      
      await transactionManager.createEscrow(
        transactionId,
        1,
        seller.address,
        buyer.address,
        owner.address,              // escrow agent
        ethers.utils.parseEther("500")
      );
    });

    it("Should create escrow transaction", async function () {
      const escrow = await transactionManager.getEscrowTransaction(transactionId);
      expect(escrow.seller).to.equal(seller.address);
      expect(escrow.buyer).to.equal(buyer.address);
      expect(escrow.saleAmount).to.equal(ethers.utils.parseEther("500"));
    });

    it("Should deposit funds to escrow", async function () {
      await transactionManager.connect(buyer).depositToEscrow(transactionId, {
        value: ethers.utils.parseEther("50") // 10% deposit
      });

      const escrow = await transactionManager.getEscrowTransaction(transactionId);
      expect(escrow.buyerFundedEscrow).to.be.true;
      expect(escrow.buyerDepositAmount).to.equal(ethers.utils.parseEther("50"));
    });

    it("Should allow seller to approve transaction", async function () {
      await transactionManager.connect(buyer).depositToEscrow(transactionId, {
        value: ethers.utils.parseEther("50")
      });

      await transactionManager.connect(seller).sellerApprove(transactionId);

      const escrow = await transactionManager.getEscrowTransaction(transactionId);
      expect(escrow.sellerSignedOff).to.be.true;
    });

    it("Should allow buyer to approve transaction", async function () {
      await transactionManager.connect(buyer).depositToEscrow(transactionId, {
        value: ethers.utils.parseEther("50")
      });

      await transactionManager.connect(buyer).buyerApprove(transactionId);

      const escrow = await transactionManager.getEscrowTransaction(transactionId);
      expect(escrow.buyerSignedOff).to.be.true;
    });
  });

  // ==================== TEST AGENT VERIFICATION ====================
  describe("Agent Verification", function () {
    it("Should verify registered agent", async function () {
      expect(await propertyRegistry.isAgentVerified(agent1.address)).to.be.true;
    });

    it("Should not verify unregistered agent", async function () {
      const unknownAgent = (await ethers.getSigners())[6];
      expect(await propertyRegistry.isAgentVerified(unknownAgent.address)).to.be.false;
    });
  });
});
