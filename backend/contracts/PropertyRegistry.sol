// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PropertyRegistry {
    
    struct Property {
        uint256 propertyId;
        string propertyAddress;
        address currentOwner;
        uint256 registrationDate;
        bool isActive;
    }
    
    struct Agent {
        address agentAddress;
        string agentName;
        bool isVerified;
    }
    
    struct Transaction {
        bytes32 transactionId;
        uint256 propertyId;
        address seller;
        address buyer;
        address sellerAgent;
        address buyerAgent;
        uint256 salePrice;
        bool isDualRepresentation;
        string status;
    }
    
    mapping(uint256 => Property) public properties;
    mapping(address => Agent) public agents;
    mapping(bytes32 => Transaction) public transactions;
    mapping(uint256 => bool) public propertyExists;
    
    uint256[] public propertyIds;
    bytes32[] public transactionIds;
    
    event PropertyRegistered(uint256 indexed propertyId, address indexed owner);
    event AgentRegistered(address indexed agentAddress);
    event TransactionCreated(bytes32 indexed transactionId, uint256 propertyId);
    event FraudDetected(bytes32 indexed transactionId, string fraudType);
    event TransactionCompleted(bytes32 indexed transactionId);
    
    address public admin;
    
    constructor() {
        admin = msg.sender;
    }
    
    function registerProperty(uint256 propertyId, string memory propertyAddress) public {
        require(!propertyExists[propertyId], "Property already registered");
        
        properties[propertyId] = Property({
            propertyId: propertyId,
            propertyAddress: propertyAddress,
            currentOwner: msg.sender,
            registrationDate: block.timestamp,
            isActive: false
        });
        
        propertyExists[propertyId] = true;
        propertyIds.push(propertyId);
        
        emit PropertyRegistered(propertyId, msg.sender);
    }
    
    function getProperty(uint256 propertyId) public view returns (Property memory) {
        require(propertyExists[propertyId], "Property not found");
        return properties[propertyId];
    }
    
    function registerAgent(address agentAddress, string memory agentName) public {
        require(msg.sender == admin, "Only admin can register");
        agents[agentAddress] = Agent({agentAddress: agentAddress, agentName: agentName, isVerified: true});
        emit AgentRegistered(agentAddress);
    }
    
    function isAgentVerified(address agentAddress) public view returns (bool) {
        return agents[agentAddress].isVerified;
    }
    
    function createTransaction(uint256 propertyId, address buyer, address sellerAgent, address buyerAgent, uint256 salePrice) public returns (bytes32) {
        require(propertyExists[propertyId], "Property not found");
        require(properties[propertyId].currentOwner == msg.sender, "Only owner can create");
        require(buyer != msg.sender, "Cannot sell to self");
        
        bool isDual = (sellerAgent == buyerAgent);
        bytes32 txnId = keccak256(abi.encodePacked(propertyId, msg.sender, buyer, block.timestamp));
        
        transactions[txnId] = Transaction({
            transactionId: txnId,
            propertyId: propertyId,
            seller: msg.sender,
            buyer: buyer,
            sellerAgent: sellerAgent,
            buyerAgent: buyerAgent,
            salePrice: salePrice,
            isDualRepresentation: isDual,
            status: "pending"
        });
        
        properties[propertyId].isActive = true;
        transactionIds.push(txnId);
        
        if (isDual) {
            emit FraudDetected(txnId, "Dual representation");
        }
        
        emit TransactionCreated(txnId, propertyId);
        return txnId;
    }
    
    function getTransaction(bytes32 txnId) public view returns (Transaction memory) {
        return transactions[txnId];
    }
    
    function completeTransaction(bytes32 txnId) public {
        require(msg.sender == admin || msg.sender == transactions[txnId].buyer, "Not authorized");
        
        uint256 propId = transactions[txnId].propertyId;
        properties[propId].currentOwner = transactions[txnId].buyer;
        properties[propId].isActive = false;
        transactions[txnId].status = "completed";
        
        emit TransactionCompleted(txnId);
    }
    
    function detectFraud(uint256 propertyId) public view returns (string memory, bool) {
        require(propertyExists[propertyId], "Property not found");
        return ("No fraud", false);
    }
    
    function getAllProperties() public view returns (uint256[] memory) {
        return propertyIds;
    }
    
    function getAllTransactions() public view returns (bytes32[] memory) {
        return transactionIds;
    }
}
