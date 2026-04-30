# 🚀 STEP-BY-STEP SETUP GUIDE

## ⏱️ Estimated Time: 30 minutes

---

## **STEP 1: Initialize Root Folder & Install Dependencies** ⭐ START HERE
### Time: 5 minutes

### **1.1 - Open Terminal and Navigate to Project**

```powershell
# Open PowerShell as Administrator
cd "c:\Users\NIDHI\Desktop\projects\blockchain project"

# Verify you're in the right folder
ls
```

**Expected output:** You should see all the documentation files, contracts folder, scripts folder, etc.

---

### **1.2 - Create Root package.json**

If you don't have a `package.json` in the root yet, run this:

```bash
npm init -y
```

---

### **1.3 - Install Root Dependencies**

These are needed for smart contract development:

```bash
npm install --save-dev hardhat ethers @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle ethereum-waffle chai
```

**What this installs:**
- `hardhat` - Blockchain development environment
- `ethers` - Library to interact with blockchain
- `@nomiclabs/hardhat-ethers` - Hardhat plugin for ethers
- `ethereum-waffle` - Testing framework
- `chai` - Assertion library

**⏱️ This takes 2-3 minutes**

---

### **1.4 - Verify Installation**

```bash
npx hardhat --version
```

**Expected output:** Something like `hardhat 2.x.x`

✅ **STEP 1 COMPLETE** - You now have Hardhat installed!

---

---

## **STEP 2: Compile Smart Contracts**
### Time: 3 minutes

### **2.1 - Compile Contracts**

```bash
npx hardhat compile
```

**What happens:**
- Reads PropertyRegistry.sol and TransactionManager.sol
- Compiles them to bytecode
- Creates `artifacts/` folder with compiledcode
- Creates `cache/` folder

**⏱️ This takes 20-30 seconds**

**Expected output:**
```
Compiling 2 files with 0.8.0
Compilation successful
```

✅ **STEP 2 COMPLETE** - Smart contracts are compiled!

---

---

## **STEP 3: Start Hardhat Blockchain (Terminal 1)**
### Time: 1 minute

### **3.1 - Open NEW PowerShell Window (Keep original open)**

You now need **4 terminals** running simultaneously. This is Terminal 1.

```powershell
cd "c:\Users\NIDHI\Desktop\projects\blockchain project"

# Start local blockchain
npx hardhat node
```

**What happens:**
- Starts a local Ethereum blockchain on port 8545
- Creates 20 test accounts with 10,000 ETH each
- Shows all account details (you can copy these for testing)

**Expected output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts (the first account and private key is used by default)
======

Account #0: 0x71be521d94... (Keep this terminal RUNNING)
Account #1: 0x71be521d94...
... (19 more accounts)

WARNING: These accounts, and their private keys, are publicly known!
```

**⚠️ DO NOT CLOSE THIS TERMINAL** - Leave it running in the background!

✅ **STEP 3 COMPLETE** - Blockchain is running on port 8545!

---

---

## **STEP 4: Deploy Smart Contracts (Terminal 2)**
### Time: 2 minutes

### **4.1 - Open ANOTHER NEW PowerShell Window**

This is Terminal 2. Go back to your original terminal or open a new one.

```powershell
cd "c:\Users\NIDHI\Desktop\projects\blockchain project"

# Deploy contracts to the local blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**What happens:**
- Deploys PropertyRegistry.sol to blockchain
- Deploys TransactionManager.sol
- Registers 3 sample agents
- Saves contract addresses to `contractAddresses.json`

**Expected output:**
```
Deploying contracts...
PropertyRegistry deployed to: 0x5FbDB2315678afccb333f8a9c604662fb567f5dc
TransactionManager deployed to: 0xcf7ed3acca5a467e9e704c44... 
Sample agents registered!
Contract addresses saved to contractAddresses.json
```

✅ **STEP 4 COMPLETE** - Contracts deployed & addresses saved!

---

---

## **STEP 5: Start Backend Server (Terminal 3)**
### Time: 3 minutes

### **5.1 - Go to Backend Folder**

```powershell
cd "c:\Users\NIDHI\Desktop\projects\blockchain project\backend"

# Install backend dependencies
npm install
```

**What gets installed:**
- `express` - Web server
- `cors` - Enable cross-origin requests
- `body-parser` - Parse JSON requests
- `ethers` - Blockchain interaction

**⏱️ This takes 1-2 minutes**

---

### **5.2 - Start Backend API Server**

```bash
node server.js
```

**Expected output:**
```
API Server running on http://localhost:3001
Connected to PropertyRegistry at: 0x5fbd...
Connected to TransactionManager at: 0xcf7e...
```

**⚠️ DO NOT CLOSE THIS TERMINAL** - Keep it running!

✅ **STEP 5 COMPLETE** - Backend API running on port 3001!

---

---

## **STEP 6: Start Frontend App (Terminal 4)**
### Time: 5 minutes

### **6.1 - Go to Frontend Folder (NEW TERMINAL)**

```powershell
cd "c:\Users\NIDHI\Desktop\projects\blockchain project\frontend"

# Install frontend dependencies
npm install
```

**What gets installed:**
- `react` - UI framework
- `react-dom` - Render React to browser
- `ethers` - Blockchain interaction
- `web3.js` - Alternative blockchain library

**⏱️ This takes 2-3 minutes**

---

### **6.2 - Start React Development Server**

```bash
npm start
```

**What happens:**
- Starts React development server on port 3000
- Opens browser automatically
- Shows React app with MetaMask wallet connect button

**Expected output:**
```
Compiled successfully!

You can now view the app in the browser.

  Local:            http://localhost:3000
  
 Press q to quit.
```

**Your browser opens:**
- Shows blockchain fraud prevention dashboard
- MetaMask connect button ready
- 5 tabs: Dashboard, Register, Transaction, Fraud Detection, View

✅ **STEP 6 COMPLETE** - React frontend running on port 3000!

---

---

## 📊 **VERIFICATION CHECKLIST**

After all 4 steps, you should have:

```
Terminal 1: Hardhat Node (localhost:8545)
  ✅ Running - Blockchain live
  
Terminal 2: Deploy (contracts deployed)
  ✅ Completed - contractAddresses.json created
  
Terminal 3: Backend (http://localhost:3001)
  ✅ Running - API server ready
  
Terminal 4: Frontend (http://localhost:3000)
  ✅ Running - React app in browser
```

---

---

## 🧪 **TEST THE SYSTEM** 

### **6.3 - Connect MetaMask**

In your browser (with React app open):

1. Click **"Connect Wallet"** button
2. MetaMask popup appears
3. Click **"Connect"**
4. Your account appears: `0x71be...`

✅ You're connected to blockchain!

---

### **6.4 - Test Property Registration**

1. Click **"Register Property"** tab
2. Fill in form:
   - **Address:** "123 Main St, New York"
   - **Price:** "500000"
   - **Agent:** "0x71be521d94..." (your account)
3. Click **"Register"**
4. MetaMask popup - click **"Sign"**

**✅ Property registered!** Check the terminal - you should see:
```
POST /register-property
Property registered successfully
```

---

### **6.5 - Test Fraud Detection**

1. Click **"Fraud Detection"** tab
2. Click **"Scan All Properties"**
3. You see your property with "✅ Safe" status

**✅ System working!**

---

---

## 📑 **TERMINAL LAYOUT REFERENCE**

```
Your Screen:

┌─────────────────────────────────────┐
│ Terminal 1: Hardhat Node            │  (Left side, pin to top)
│ localhost:8545 running              │  DO NOT CLOSE
├─────────────────────────────────────┤
│ Terminal 2: Deploy Output           │  (Could close after deploy)
│ contractAddresses.json created      │
├─────────────────────────────────────┤
│ Terminal 3: Backend                 │  (Right side, pin to top)
│ API Server running on port 3001     │  DO NOT CLOSE
├─────────────────────────────────────┤
│ Terminal 4: Frontend                │  (Right side, below backend)
│ Compiled successfully!              │  DO NOT CLOSE
│ http://localhost:3000 ← CLICK THIS  │
└─────────────────────────────────────┘

Browser: http://localhost:3000 (Your React App!)
```

---

---

## ⚡ **QUICK COMMAND SUMMARY**

### **Setup (Run Once)**
```bash
npm install                                    # Root
cd backend && npm install && cd ..             # Backend
cd frontend && npm install && cd ..            # Frontend
npx hardhat compile                            # Compile contracts
```

### **Run Always (4 Terminals)**
```bash
# Terminal 1
npx hardhat node

# Terminal 2
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3
cd backend && node server.js

# Terminal 4
cd frontend && npm start
```

---

---

## 🆘 **TROUBLESHOOTING**

### **Problem: "Port 8545 already in use"**
```bash
# Find process using port 8545
netstat -ano | findstr :8545

# Kill the process (replace PID with the number you see)
taskkill /PID [PID] /F

# Then try hardhat node again
npx hardhat node
```

### **Problem: "Cannot find module 'express'"**
```bash
# You're not in the backend folder
cd backend
npm install
```

### **Problem: MetaMask not connecting**
1. Install MetaMask extension in browser
2. Create an account (or use existing)
3. Click **"Connect Wallet"** button again
4. Accept the connection request

### **Problem: "ERR_MODULE_NOT_FOUND"**
```bash
# Delete node_modules and reinstall
rm -r node_modules package-lock.json
npm install
```

---

---

## ✅ **NEXT STEPS** (Once system is running)

1. Test all 5 tabs in the React app
2. Register multiple properties
3. Create transactions between them
4. Test fraud detection
5. Check backend logs to see API calls
6. Read COMPLETE_GUIDE.md for advanced features

---

**🎉 You're ready! Start with STEP 1 now!**
