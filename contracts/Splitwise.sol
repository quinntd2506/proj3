// SPDX-License-Identifier: UNLICENSED

// DO NOT MODIFY BELOW THIS
pragma solidity ^0.8.17;

import "hardhat/console.sol";

contract Splitwise {
// DO NOT MODIFY ABOVE THIS

// ADD YOUR CONTRACT CODE BELOW

    // Mapping to store debts: debtor -> creditor -> amount
    mapping(address => mapping(address => uint32)) private debts;
    
    // Mapping to track the last active timestamp for each user
    mapping(address => uint) private lastActive;
    
    // Array to keep track of all users who have interacted with the contract
    address[] private users;
    
    // Mapping to check if an address is already in the users array
    mapping(address => bool) private isUser;
    
    // Events to make it easier for the client to track debt changes
    event IOU(address indexed debtor, address indexed creditor, uint32 amount);
    event UserAdded(address indexed user);
    
    /**
     * @dev Looks up the debt that debtor owes to creditor
     * @param debtor The address of the debtor
     * @param creditor The address of the creditor
     * @return ret The amount owed
     */
    function lookup(address debtor, address creditor) public view returns (uint32 ret) {
        return debts[debtor][creditor];
    }
    
    /**
     * @dev Adds an IOU from sender to creditor
     * @param creditor The address to whom the debt is owed
     * @param amount The amount of the debt to add
     */
    function add_IOU(address creditor, uint32 amount) public {
        // Check that amount is positive and that creditor is not the sender
        require(amount > 0, "Amount must be positive");
        require(creditor != msg.sender, "Cannot owe yourself");
        
        // Record the activity
        _recordActivity(msg.sender);
        _recordActivity(creditor);
        
        // Add the IOU
        debts[msg.sender][creditor] += amount;
        
        // Emit the event for tracking
        emit IOU(msg.sender, creditor, debts[msg.sender][creditor]);
    }
    
    /**
     * @dev Records activity for a user and adds them to the users list if they are new
     * @param user The address of the user
     */
    function _recordActivity(address user) private {
        // Update the last active timestamp
        lastActive[user] = block.timestamp;
        
        // Add user to the list if they're new
        if (!isUser[user]) {
            users.push(user);
            isUser[user] = true;
            emit UserAdded(user);
        }
    }
    
    /**
     * @dev Gets all users who have interacted with the contract
     * @return The array of user addresses
     */
    function getUsers() public view returns (address[] memory) {
        return users;
    }
    
    /**
     * @dev Gets the last active timestamp for a user
     * @param user The address of the user
     * @return The timestamp of the last activity
     */
    function getLastActive(address user) public view returns (uint) {
        return lastActive[user];
    }
}