# ⚡ QUICK REFERENCE - 2 Day Command Sheet

## 📋 SETUP (First Time Only - 15 mins)

```bash
# Navigate to project
cd c:\Users\NIDHI\Desktop\projects\blockchain project

# Install dependencies
npm install
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install ethers express cors body-parser

# Compile smart contracts
npx hardhat compile
```

**Expected Output:**
```
Compiled 2 contracts successfully
```

---

## 🎯 DAY 1 - BACKEND (6-8 hours)

### Terminal 1: Blockchain Network
```bash
# Start local Hardhat blockchain
npx hardhat node
```

**Keep this running!** Output should show:
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
Block number: 0
```

---

### Terminal 2: Deploy Smart Contracts
```bash
# Deploy contracts to blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**Expected Output:**
```
✅ PropertyRegistry deployed to: 0x5FbE...
✅ TransactionManager deployed to: 0x9B3e...
✅ Contract addresses saved to: contractAddresses.json
```

---

### Terminal 3: Smart Contract Testing
```bash
# Run all tests
npx hardhat test
```

**Expected:** All tests should pass ✅

---

### Terminal 4: Backend API Server
```bash
# Start backend server
node backend/server.js
```

**Expected Output:**
```
✅ Backend server running on http://localhost:3001
```

**Test it works:**
```bash
# In new terminal or browser
curl http://localhost:3001/api/health
```

Should return:
```json
{"status": "connected", "blockNumber": 5}
```

---

## 🌐 DAY 2 - FRONTEND (6-8 hours)

### Terminal 5: Setup React App
```bash
# Navigate to frontend
cd c:\Users\NIDHI\Desktop\projects\blockchain project\frontend

# Create React app (first time only)
npx create-react-app .

# Install dependencies
npm install web3 ethers
npm install --save-dev @web3-react/core @web3-react/injected-connector
```

---

### Terminal 5: Start React Development Server
```bash
# Make sure you're in frontend folder
cd c:\Users\NIDHI\Desktop\projects\blockchain project\frontend

# Start development server
npm start
```

**Browser opens automatically at:**
```
http://localhost:3000
```

---

## ✅ VERIFICATION CHECKLIST

### Terminal 1 (Blockchain) ✅
- [ ] Shows "Started HTTP and WebSocket JSON-RPC server"
- [ ] No errors

### Terminal 2 (Deployment) ✅
- [ ] Shows 2 contract addresses
- [ ] File created: contractAddresses.json

### Terminal 3 (Tests) ✅
- [ ] All tests pass (should see many ✓)
- [ ] No test failures

### Terminal 4 (Backend) ✅
- [ ] Shows "backend server running on http://localhost:3001"
- [ ] curl command returns JSON

### Terminal 5 (Frontend) ✅
- [ ] Shows "Compiled successfully!"
- [ ] React app loads at http://localhost:3000
- [ ] Can connect MetaMask

---

## 🧪 TESTING WORKFLOW

### Test 1: Register Property
```bash
# In frontend app:
1. Click "📝 Register Property" tab
2. Fill form:
   Property ID: 1
   Address: 123 Main Street, NY
   Title: DEED-2024-001
   Value: 500
3. Click "📝 Register Property"
4. Confirm in MetaMask
5. Wait for success message
```

✅ Expected: Property appears on dashboard

---

### Test 2: Create Transaction (Normal)
```bash
# In frontend app:
1. Click "💼 Create Transaction" tab
2. Select Property ID: 1
3. Fill in:
   Buyer: 0x70997970C51812e339D9B73b0245be3C2C6e002d
   Seller Agent: 0x70997970C51812e339D9B73b0245be3C2C6e002d
   Buyer Agent: 0x3C44CdDdB6a900756B2362b3434ac0b7cDef50fF
   Sale Price: 500
4. Leave disclosures UNCHECKED (different agents)
5. Click "💼 Create Transaction"
```

✅ Expected: Transaction created successfully

---

### Test 3: Fraud Prevention - Undisclosed Dual Representation
```bash
# In frontend app:
1. Register another property (ID: 2)
2. Try to create transaction with:
   Seller Agent: 0x70997970C51812e339D9B73b0245be3C2C6e002d
   Buyer Agent: 0x70997970C51812e339D9B73b0245be3C2C6e002d (SAME!)
   Leave disclosures UNCHECKED
3. Click "💼 Create Transaction"
```

❌ Expected: Transaction REJECTED with fraud alert:
```
"Dual representation MUST be disclosed to both parties"
```

✅ Fraud Protection Works!

---

### Test 4: Fraud Prevention - Disclosed Dual Representation
```bash
# In frontend app:
1. Try same transaction but:
   CHECK "Seller acknowledges dual representation"
   CHECK "Buyer acknowledges dual representation"
2. Click "💼 Create Transaction"
```

✅ Expected: Transaction ACCEPTED (Properly disclosed)

---

### Test 5: View Fraud Detection Dashboard
```bash
# In frontend app:
1. Click "🔍 Fraud Detection" tab
2. Review all flagged properties
3. Check which have fraud alerts
```

---

## 🔧 TROUBLESHOOTING COMMANDS

### Issue: "Port 8545 already in use"
```bash
# Kill process using port 8545
lsof -ti:8545 | xargs kill -9
```

### Issue: "Port 3001 already in use"
```bash
# Kill process using port 3001
lsof -ti:3001 | xargs kill -9

# Or use different port
PORT=3002 npm start
```

### Issue: "React won't compile"
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue: "Contracts not found after deployment"
```bash
# Redeploy contracts
npx hardhat run scripts/deploy.js --network localhost

# Copy contractAddresses.json to backend
cp contractAddresses.json backend/
```

### Issue: "MetaMask shows wrong network"
```
1. Click MetaMask
2. Select "Hardhat Local" network
3. If not there, add:
   - Name: Hardhat Local
   - RPC: http://127.0.0.1:8545
   - Chain ID: 31337
```

---

## 📊 STATUS MONITORING

### Check Blockchain
```bash
# Get current block number
curl http://localhost:3001/api/health

# Response:
# {"status":"connected","blockNumber":42,"network":"localhost"}
```

### Check Backend
```bash
# Get all properties
curl http://localhost:3001/api/properties

# Response should show property list
```

### Check Frontend
```
Visit http://localhost:3000 in browser
Should show connected wallet address
```

---

## 📝 IMPORTANT FILES

| File | Purpose | Location |
|------|---------|----------|
| `PropertyRegistry.sol` | Main smart contract | `contracts/` |
| `TransactionManager.sol` | Escrow management | `contracts/` |
| `deploy.js` | Deploy script | `scripts/` |
| `test.js` | Smart contract tests | `test/` |
| `server.js` | Backend API | `backend/` |
| `App.js` | React main component | `frontend/src/` |
| `contractAddresses.json` | Contract addresses | Root & `backend/` |

---

## 🚀 QUICK LAUNCH (After Setup Complete)

```bash
# Terminal 1
npx hardhat node

# Terminal 2 (wait 5 seconds)
npx hardhat run scripts/deploy.js --network localhost

# Terminal 3 (wait 5 seconds)
node backend/server.js

# Terminal 4 (in frontend folder)
npm start
```

**Wait for all 4 to start, then:**
- Frontend: http://localhost:3000
- Backend: http://localhost:3001/api/health

---

## 💡 PRO TIPS

1. **Keep all 4-5 terminals open** during development
2. **Don't close Hardhat node** - it stops everything
3. **Always confirm MetaMask transactions**
4. **Check browser console (F12)** if something goes wrong
5. **If confused, reread README.md** - it has answers!

---

## ⏱️ EXPECTED TIMELINE

| Time | Task | Status |
|------|------|--------|
| Day 1 - Hours 1-2 | Setup & install | ⏳ First time |
| Day 1 - Hours 2-3 | Contract testing | 🧪 npx hardhat test |
| Day 1 - Hours 3-5 | Deploy & backend | 🚀 Running 2 terminals |
| Day 1 - Hours 5-8 | API testing | ✅ Endpoints working |
| Day 2 - Hours 1-3 | Frontend setup | 🎨 React components |
| Day 2 - Hours 3-5 | Integration | 🔗 Frontend ↔ Backend |
| Day 2 - Hours 5-8 | Testing & demo | ✅ Everything works |

---

## 📞 EMERGENCY TROUBLESHOOTING

### Everything Broken?
```bash
# Full reset
rm -rf node_modules
rm contractAddresses.json
npm install
npx hardhat compile
# Try again from beginning of "DAY 1"
```

### Still broken?
1. Check all 4 terminals are running
2. Port 8545, 3000, 3001 are free
3. MetaMask on "Hardhat Local"
4. Close and reopen all terminals
5. Read COMPLETE_GUIDE.md section by section

---

**🎯 GOAL: By end of Day 2, you have a working blockchain fraud prevention system!**

Good luck! 🚀
