const { ethers } = require("hardhat");

async function main() {
  // Get the deployed contract
  const Splitwise = await ethers.getContractFactory("Splitwise");
  const contract = await Splitwise.attach("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  
  // Get accounts
  const accounts = await ethers.getSigners();
  console.log("Running test with accounts:", accounts.map(a => a.address).slice(0, 3));
  
  // Simple test
  console.log("Testing contract functions...");
  
  // Check initial state
  const initialDebt = await contract.lookup(accounts[0].address, accounts[1].address);
  console.log("Initial debt:", initialDebt.toString());
  
  // Add an IOU
  const tx = await contract.connect(accounts[0]).add_IOU(accounts[1].address, 10);
  await tx.wait();
  console.log("Added IOU");
  
  // Check final state
  const finalDebt = await contract.lookup(accounts[0].address, accounts[1].address);
  console.log("Final debt:", finalDebt.toString());
  
  console.log("Test completed successfully!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });