// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TransactionManager {
    
    struct EscrowTransaction {
        bytes32 transactionId;
        uint256 propertyId;
        address seller;
        address buyer;
        uint256 saleAmount;
        bool buyerFunded;
        bool sellerApproved;
        bool buyerApproved;
        string status;
    }
    
    mapping(bytes32 => EscrowTransaction) public escrowTransactions;
    mapping(bytes32 => uint256) public escrowFunds;
    bytes32[] public transactionIds;
    
    event EscrowCreated(bytes32 transactionId);
    event FundsDeposited(bytes32 transactionId, uint256 amount);
    event SellerApproved(bytes32 transactionId);
    event BuyerApproved(bytes32 transactionId);
    event TransactionClosed(bytes32 transactionId);
    
    address public admin;
    
    constructor() {
        admin = msg.sender;
    }
    
    function createEscrow(bytes32 txnId, uint256 propId, address seller, address buyer, uint256 saleAmount) public {
        escrowTransactions[txnId] = EscrowTransaction({
            transactionId: txnId,
            propertyId: propId,
            seller: seller,
            buyer: buyer,
            saleAmount: saleAmount,
            buyerFunded: false,
            sellerApproved: false,
            buyerApproved: false,
            status: "created"
        });
        
        transactionIds.push(txnId);
        emit EscrowCreated(txnId);
    }
    
    function depositToEscrow(bytes32 txnId) public payable {
        require(msg.value > 0, "Deposit > 0");
        escrowFunds[txnId] += msg.value;
        escrowTransactions[txnId].buyerFunded = true;
        emit FundsDeposited(txnId, msg.value);
    }
    
    function sellerApprove(bytes32 txnId) public {
        require(msg.sender == escrowTransactions[txnId].seller, "Only seller");
        escrowTransactions[txnId].sellerApproved = true;
        emit SellerApproved(txnId);
    }
    
    function buyerApprove(bytes32 txnId) public {
        require(msg.sender == escrowTransactions[txnId].buyer, "Only buyer");
        escrowTransactions[txnId].buyerApproved = true;
        emit BuyerApproved(txnId);
    }
    
    function closeTransaction(bytes32 txnId) public {
        require(msg.sender == admin, "Only admin");
        EscrowTransaction storage txn = escrowTransactions[txnId];
        require(txn.sellerApproved && txn.buyerApproved, "Not all approved");
        
        txn.status = "completed";
        emit TransactionClosed(txnId);
    }
    
    function getEscrowDetails(bytes32 txnId) public view returns (EscrowTransaction memory) {
        return escrowTransactions[txnId];
    }
}
