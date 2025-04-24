// test-splitwise.js - Comprehensive test script for Blockchain Splitwise
const { ethers } = require("hardhat");

async function main() {
  console.log("Starting Blockchain Splitwise tests...");
  
  // Get signers (accounts)
  const accounts = await ethers.getSigners();
  const [alice, bob, carol, dave, eve] = accounts;
  
  console.log("Test accounts:");
  console.log(`Alice: ${alice.address}`);
  console.log(`Bob: ${bob.address}`);
  console.log(`Carol: ${carol.address}`);
  console.log(`Dave: ${dave.address}`);
  console.log(`Eve: ${eve.address}`);
  
  // Deploy the contract
  console.log("\nDeploying Splitwise contract...");
  const Splitwise = await ethers.getContractFactory("Splitwise");
  const splitwise = await Splitwise.deploy();
  await splitwise.deployed();
  
  console.log(`Contract deployed at: ${splitwise.address}`);
  
  // Helper function to log current debts
  async function logDebts() {
    console.log("\nCurrent debts:");
    for (let i = 0; i < accounts.length; i++) {
      for (let j = 0; j < accounts.length; j++) {
        if (i !== j) {
          const debt = await splitwise.lookup(accounts[i].address, accounts[j].address);
          if (debt > 0) {
            console.log(`${await getNameForAccount(accounts[i])} owes ${await getNameForAccount(accounts[j])}: $${debt}`);
          }
        }
      }
    }
  }
  
  // Helper function to get a name for an account
  async function getNameForAccount(account) {
    if (account.address === alice.address) return "Alice";
    if (account.address === bob.address) return "Bob";
    if (account.address === carol.address) return "Carol";
    if (account.address === dave.address) return "Dave";
    if (account.address === eve.address) return "Eve";
    return account.address.substr(0, 8) + "...";
  }
  
  // Helper to check an assertion
  function assert(condition, message) {
    if (!condition) {
      console.log(`❌ FAILED: ${message}`);
      process.exit(1);
    } else {
      console.log(`✅ PASSED: ${message}`);
    }
  }
  
  // Test 1: Simple IOU
  console.log("\n🧪 Test 1: Simple IOU");
  console.log("Alice adds an IOU of $10 to Bob");
  await splitwise.connect(alice).add_IOU(bob.address, 10);
  
  let aliceToBob = await splitwise.lookup(alice.address, bob.address);
  assert(aliceToBob.toNumber() === 10, "Alice should owe Bob $10");
  
  let users = await splitwise.getUsers();
  assert(users.length === 2, "There should be 2 users in the system");
  
  await logDebts();
  
  // Test 2: Adding to an existing IOU
  console.log("\n🧪 Test 2: Adding to an existing IOU");
  console.log("Alice adds another IOU of $5 to Bob");
  await splitwise.connect(alice).add_IOU(bob.address, 5);
  
  aliceToBob = await splitwise.lookup(alice.address, bob.address);
  assert(aliceToBob.toNumber() === 15, "Alice should now owe Bob $15");
  
  await logDebts();
  
  // Test 3: Simple triangle cycle
  console.log("\n🧪 Test 3: Triangle cycle");
  console.log("Bob adds an IOU of $10 to Carol");
  await splitwise.connect(bob).add_IOU(carol.address, 10);
  
  let bobToCarol = await splitwise.lookup(bob.address, carol.address);
  assert(bobToCarol.toNumber() === 10, "Bob should owe Carol $10");
  
  console.log("Carol adds an IOU of $20 to Alice");
  await splitwise.connect(carol).add_IOU(alice.address, 20);
  
  // Check if cycle is resolved
  aliceToBob = await splitwise.lookup(alice.address, bob.address);
  bobToCarol = await splitwise.lookup(bob.address, carol.address);
  let carolToAlice = await splitwise.lookup(carol.address, alice.address);
  
  console.log("\nAfter cycle resolution:");
  await logDebts();
  
  assert(aliceToBob.toNumber() === 5, "Alice should owe Bob $5 after cycle resolution");
  assert(bobToCarol.toNumber() === 0, "Bob should owe Carol $0 after cycle resolution");
  assert(carolToAlice.toNumber() === 10, "Carol should owe Alice $10 after cycle resolution");
  
  // Test 4: Four-person cycle
  console.log("\n🧪 Test 4: Four-person cycle");
  
  // Reset debts for clarity
  console.log("Resetting debts for Test 4...");
  // This is hacky for testing - in reality we'd redeploy the contract
  const Splitwise2 = await ethers.getContractFactory("Splitwise");
  const splitwise2 = await Splitwise2.deploy();
  await splitwise2.deployed();
  
  console.log("Alice adds an IOU of $15 to Bob");
  await splitwise2.connect(alice).add_IOU(bob.address, 15);
  
  console.log("Bob adds an IOU of $10 to Carol");
  await splitwise2.connect(bob).add_IOU(carol.address, 10);
  
  console.log("Carol adds an IOU of $5 to Dave");
  await splitwise2.connect(carol).add_IOU(dave.address, 5);
  
  console.log("\nBefore final IOU:");
  aliceToBob = await splitwise2.lookup(alice.address, bob.address);
  bobToCarol = await splitwise2.lookup(bob.address, carol.address);
  let carolToDave = await splitwise2.lookup(carol.address, dave.address);
  
  console.log(`Alice owes Bob: $${aliceToBob}`);
  console.log(`Bob owes Carol: $${bobToCarol}`);
  console.log(`Carol owes Dave: $${carolToDave}`);
  
  console.log("\nDave adds an IOU of $15 to Alice (creating a cycle)");
  await splitwise2.connect(dave).add_IOU(alice.address, 15);
  
  console.log("\nAfter cycle resolution:");
  aliceToBob = await splitwise2.lookup(alice.address, bob.address);
  bobToCarol = await splitwise2.lookup(bob.address, carol.address);
  carolToDave = await splitwise2.lookup(carol.address, dave.address);
  let daveToAlice = await splitwise2.lookup(dave.address, alice.address);
  
  console.log(`Alice owes Bob: $${aliceToBob}`);
  console.log(`Bob owes Carol: $${bobToCarol}`);
  console.log(`Carol owes Dave: $${carolToDave}`);
  console.log(`Dave owes Alice: $${daveToAlice}`);
  
  assert(aliceToBob.toNumber() === 10, "Alice should owe Bob $10 after cycle resolution");
  assert(bobToCarol.toNumber() === 5, "Bob should owe Carol $5 after cycle resolution");
  assert(carolToDave.toNumber() === 0, "Carol should owe Dave $0 after cycle resolution");
  assert(daveToAlice.toNumber() === 10, "Dave should owe Alice $10 after cycle resolution");
  
  // Test 5: Payback (direct cycle)
  console.log("\n🧪 Test 5: Payback (direct cycle)");
  
  // Deploy new contract for clean test
  const Splitwise3 = await ethers.getContractFactory("Splitwise");
  const splitwise3 = await Splitwise3.deploy();
  await splitwise3.deployed();
  
  console.log("Alice adds an IOU of $10 to Bob");
  await splitwise3.connect(alice).add_IOU(bob.address, 10);
  
  aliceToBob = await splitwise3.lookup(alice.address, bob.address);
  assert(aliceToBob.toNumber() === 10, "Alice should owe Bob $10");
  
  console.log("Bob adds an IOU of $10 to Alice (paying back)");
  await splitwise3.connect(bob).add_IOU(alice.address, 10);
  
  aliceToBob = await splitwise3.lookup(alice.address, bob.address);
  let bobToAlice = await splitwise3.lookup(bob.address, alice.address);
  
  assert(aliceToBob.toNumber() === 0, "Alice should owe Bob $0 after payback");
  assert(bobToAlice.toNumber() === 0, "Bob should owe Alice $0 after payback");
  
  console.log("Payback resolved correctly, both debts are now $0");
  
  // Test 6: Edge cases
  console.log("\n🧪 Test 6: Edge cases");
  
  // Deploy new contract for clean test
  const Splitwise4 = await ethers.getContractFactory("Splitwise");
  const splitwise4 = await Splitwise4.deploy();
  await splitwise4.deployed();
  
  // Test lastActive
  console.log("Testing lastActive functionality...");
  await splitwise4.connect(alice).add_IOU(bob.address, 5);
  
  const aliceLastActive = await splitwise4.getLastActive(alice.address);
  const bobLastActive = await splitwise4.getLastActive(bob.address);
  const carolLastActive = await splitwise4.getLastActive(carol.address);
  
  assert(aliceLastActive.toNumber() > 0, "Alice should have activity timestamp");
  assert(bobLastActive.toNumber() > 0, "Bob should have activity timestamp");
  assert(carolLastActive.toNumber() === 0, "Carol should have no activity timestamp");
  
  console.log(`Alice last active: ${new Date(aliceLastActive.toNumber() * 1000).toLocaleString()}`);
  console.log(`Bob last active: ${new Date(bobLastActive.toNumber() * 1000).toLocaleString()}`);
  
  // Test getUsers
  const userList = await splitwise4.getUsers();
  console.log(`Users in system: ${userList.length}`);
  assert(userList.length === 2, "There should be 2 users in the system");
  
  console.log("\nAll tests completed successfully! 🎉");
}

// Execute the test script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });