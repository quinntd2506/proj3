// =============================================================================
//                                  Config
// =============================================================================
const provider = new ethers.providers.JsonRpcProvider("http://localhost:8545");
var defaultAccount;

// Constant we use later
var GENESIS =
  "0x0000000000000000000000000000000000000000000000000000000000000000";

// This is the ABI for your contract (get it from Remix, in the 'Compile' tab)
// ============================================================
var abi = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "debtor",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "creditor",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint32",
        "name": "amount",
        "type": "uint32"
      }
    ],
    "name": "IOU",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "UserAdded",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "creditor",
        "type": "address"
      },
      {
        "internalType": "uint32",
        "name": "amount",
        "type": "uint32"
      }
    ],
    "name": "add_IOU",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "getLastActive",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getUsers",
    "outputs": [
      {
        "internalType": "address[]",
        "name": "",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "debtor",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "creditor",
        "type": "address"
      }
    ],
    "name": "lookup",
    "outputs": [
      {
        "internalType": "uint32",
        "name": "ret",
        "type": "uint32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]; // FIXME: fill this in with your contract's ABI //Be sure to only have one array, not two
// ============================================================
abiDecoder.addABI(abi);
// call abiDecoder.decodeMethod to use this - see 'getAllFunctionCalls' for more

var contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // FIXME: fill this in with your contract's address/hash

var BlockchainSplitwise = new ethers.Contract(
  contractAddress,
  abi,
  provider.getSigner()
);

// =============================================================================
//                            Functions To Implement
// =============================================================================

// TODO: Add any helper functions here!

// TODO: Return a list of all users (creditors or debtors) in the system
// All users in the system ar'e everyone who has ever sent or received an IOU
async function getUsers() {
  try {
    // Get all users from contract's getUsers function if it's implemented
    if (BlockchainSplitwise.getUsers) {
      const users = await BlockchainSplitwise.getUsers();
      return users.map((user) => user.toLowerCase());
    }

    // Alternative implementation using transaction history
    // Get all add_IOU function calls
    const calls = await getAllFunctionCalls(contractAddress, "add_IOU");

    // Create a set to store unique users
    const userSet = new Set();

    // For each call, add both the sender and the creditor to the set
    for (let i = 0; i < calls.length; i++) {
      const call = calls[i];
      userSet.add(call.from.toLowerCase());
      userSet.add(call.args[0].toLowerCase());
    }

    // Convert the set to an array and return
    return Array.from(userSet);
  } catch (error) {
    console.error("Error in getUsers:", error);
    return [];
  }
}

// Helper function to get neighbors for BFS - returns addresses that a user owes money to
async function getNeighbors(user) {
  const users = await getUsers();
  const neighbors = [];

  for (let i = 0; i < users.length; i++) {
    const debt = await BlockchainSplitwise.lookup(user, users[i]);
    if (parseInt(debt) > 0) {
      neighbors.push(users[i]);
    }
  }

  return neighbors;
}

// Helper function to get neighbors for BFS - returns addresses that a user owes money to
async function getNeighbors(user) {
  const users = await getUsers();
  const neighbors = [];

  for (let i = 0; i < users.length; i++) {
    const debt = await BlockchainSplitwise.lookup(user, users[i]);
    if (parseInt(debt) > 0) {
      neighbors.push(users[i]);
    }
  }

  return neighbors;
}
// TODO: Get the total amount owed by the user specified by 'user'
async function getTotalOwed(user) {
  try {
    // Ensure addresses are lowercase for consistency
    user = user.toLowerCase();

    // Get all users in the system
    const users = await getUsers();

    // Initialize the total amount owed
    let totalOwed = 0;

    // For each potential creditor, check how much the user owes them
    for (let i = 0; i < users.length; i++) {
      const creditor = users[i];

      // Skip if the creditor is the user (can't owe yourself)
      if (creditor === user) continue;

      // Look up the debt
      const debt = await BlockchainSplitwise.lookup(user, creditor);

      // Add to the total
      totalOwed += parseInt(debt);
    }

    return totalOwed;
  } catch (error) {
    console.error("Error in getTotalOwed:", error);
    return 0;
  }
}

// TODO: Get the last time this user has sent or received an IOU, in seconds since Jan. 1, 1970
// Return null if you can't find any activity for the user.
// HINT: Try looking at the way 'getAllFunctionCalls' is written. You can modify it if you'd like.
async function getLastActive(user) {
  try {
    // Ensure address is lowercase for consistency
    user = user.toLowerCase();

    // If the contract has a getLastActive function, use it
    if (BlockchainSplitwise.getLastActive) {
      const timestamp = await BlockchainSplitwise.getLastActive(user);
      return timestamp.toNumber() === 0 ? null : timestamp.toNumber();
    }

    // Alternative implementation using transaction history
    // Get all add_IOU function calls
    const calls = await getAllFunctionCalls(contractAddress, "add_IOU");

    // Filter calls to find those where user is either the sender or the creditor
    const userCalls = calls.filter(
      (call) =>
        call.from.toLowerCase() === user || call.args[0].toLowerCase() === user
    );

    // If no calls found, return null
    if (userCalls.length === 0) {
      return null;
    }

    // Find the most recent call by timestamp
    let mostRecentTimestamp = 0;
    for (let i = 0; i < userCalls.length; i++) {
      if (userCalls[i].t > mostRecentTimestamp) {
        mostRecentTimestamp = userCalls[i].t;
      }
    }

    return mostRecentTimestamp;
  } catch (error) {
    console.error("Error in getLastActive:", error);
    return null;
  }
}

// TODO: add an IOU ('I owe you') to the system
// The person you owe money is passed as 'creditor'
// The amount you owe them is passed as 'amount'
async function add_IOU(creditor, amount) {
  try {
    // Ensure addresses are lowercase for consistency
    creditor = creditor.toLowerCase();
    const debtor = defaultAccount.toLowerCase();

    // Convert amount to a number
    const amountNum = parseInt(amount);

    // Input validation
    if (isNaN(amountNum) || amountNum <= 0) {
      console.error("Amount must be a positive number");
      return;
    }

    if (creditor === debtor) {
      console.error("Cannot owe yourself");
      return;
    }

    // Look for a path from creditor to debtor (a cycle)
    const path = await doBFS(creditor, debtor, getNeighbors);

    // If a cycle is found, resolve it
    if (path) {
      console.log("Cycle found:", path);

      // Add debtor to complete the cycle
      path.push(debtor);

      // Find the minimum debt in the cycle
      let minDebt = Infinity;
      for (let i = 0; i < path.length - 1; i++) {
        const debt = await BlockchainSplitwise.lookup(path[i], path[i + 1]);
        const debtNum = parseInt(debt);
        if (debtNum < minDebt) {
          minDebt = debtNum;
        }
      }

      // Check the existing debt from debtor to creditor
      const existingDebt = await BlockchainSplitwise.lookup(debtor, creditor);
      const existingDebtNum = parseInt(existingDebt);

      // Calculate the actual amount to add after cycle resolution
      const cycleCancellation = Math.min(amountNum, minDebt - existingDebtNum);

      // If the cycle fully resolves the new debt, no need to add an IOU
      if (cycleCancellation >= amountNum) {
        console.log("Debt fully resolved by cycle cancellation");
        return;
      }

      // Otherwise, add an IOU for the remaining amount
      const remainingAmount = amountNum - cycleCancellation;
      console.log("Adding IOU for remaining amount:", remainingAmount);

      // Add the IOU to the contract
      await BlockchainSplitwise.add_IOU(creditor, remainingAmount);
    } else {
      // No cycle found, simply add the IOU
      console.log("No cycle found, adding IOU directly");
      await BlockchainSplitwise.add_IOU(creditor, amountNum);
    }

    return true;
  } catch (error) {
    console.error("Error in add_IOU:", error);
    throw error;
  }
}

// =============================================================================
//                              Provided Functions
// =============================================================================
// Reading and understanding these should help you implement the above

// This searches the block history for all calls to 'functionName' (string) on the 'addressOfContract' (string) contract
// It returns an array of objects, one for each call, containing the sender ('from'), arguments ('args'), and the timestamp ('t')
async function getAllFunctionCalls(addressOfContract, functionName) {
  var curBlock = await provider.getBlockNumber();
  var function_calls = [];

  while (curBlock !== GENESIS) {
    var b = await provider.getBlockWithTransactions(curBlock);
    var txns = b.transactions;
    for (var j = 0; j < txns.length; j++) {
      var txn = txns[j];

      // check that destination of txn is our contract
      if (txn.to == null) {
        continue;
      }
      if (txn.to.toLowerCase() === addressOfContract.toLowerCase()) {
        var func_call = abiDecoder.decodeMethod(txn.data);

        // check that the function getting called in this txn is 'functionName'
        if (func_call && func_call.name === functionName) {
          var timeBlock = await provider.getBlock(curBlock);
          var args = func_call.params.map(function (x) {
            return x.value;
          });
          function_calls.push({
            from: txn.from.toLowerCase(),
            args: args,
            t: timeBlock.timestamp,
          });
        }
      }
    }
    curBlock = b.parentHash;
  }
  return function_calls;
}

// We've provided a breadth-first search implementation for you, if that's useful
// It will find a path from start to end (or return null if none exists)
// You just need to pass in a function ('getNeighbors') that takes a node (string) and returns its neighbors (as an array)
async function doBFS(start, end, getNeighbors) {
  var queue = [[start]];
  while (queue.length > 0) {
    var cur = queue.shift();
    var lastNode = cur[cur.length - 1];
    if (lastNode.toLowerCase() === end.toString().toLowerCase()) {
      return cur;
    } else {
      var neighbors = await getNeighbors(lastNode);
      for (var i = 0; i < neighbors.length; i++) {
        queue.push(cur.concat([neighbors[i]]));
      }
    }
  }
  return null;
}

// =============================================================================
//                                      UI
// =============================================================================

// This sets the default account on load and displays the total owed to that
// account.
provider.listAccounts().then((response) => {
  defaultAccount = response[0];

  getTotalOwed(defaultAccount).then((response) => {
    $("#total_owed").html("$" + response);
  });

  getLastActive(defaultAccount).then((response) => {
    time = timeConverter(response);
    $("#last_active").html(time);
  });
});

// This code updates the 'My Account' UI with the results of your functions
$("#myaccount").change(function () {
  defaultAccount = $(this).val();

  getTotalOwed(defaultAccount).then((response) => {
    $("#total_owed").html("$" + response);
  });

  getLastActive(defaultAccount).then((response) => {
    time = timeConverter(response);
    $("#last_active").html(time);
  });
});

// Allows switching between accounts in 'My Account' and the 'fast-copy' in 'Address of person you owe
provider.listAccounts().then((response) => {
  var opts = response.map(function (a) {
    return (
      '<option value="' + a.toLowerCase() + '">' + a.toLowerCase() + "</option>"
    );
  });
  $(".account").html(opts);
  $(".wallet_addresses").html(
    response.map(function (a) {
      return "<li>" + a.toLowerCase() + "</li>";
    })
  );
});

// This code updates the 'Users' list in the UI with the results of your function
getUsers().then((response) => {
  $("#all_users").html(
    response.map(function (u, i) {
      return "<li>" + u + "</li>";
    })
  );
});

// This runs the 'add_IOU' function when you click the button
// It passes the values from the two inputs above
$("#addiou").click(function () {
  defaultAccount = $("#myaccount").val(); //sets the default account
  add_IOU($("#creditor").val(), $("#amount").val()).then((response) => {
    window.location.reload(false); // refreshes the page after add_IOU returns and the promise is unwrapped
  });
});

// This is a log function, provided if you want to display things to the page instead of the JavaScript console
// Pass in a discription of what you're printing, and then the object to print
function log(description, obj) {
  $("#log").html(
    $("#log").html() +
      description +
      ": " +
      JSON.stringify(obj, null, 2) +
      "\n\n"
  );
}

// Helper function to convert timestamp to readable date
function timeConverter(timestamp) {
  if (timestamp === null) return "Never";
  var a = new Date(timestamp * 1000);
  var months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate();
  var hour = a.getHours();
  var min = a.getMinutes();
  var sec = a.getSeconds();
  var time =
    date + " " + month + " " + year + " " + hour + ":" + min + ":" + sec;
  return time;
}

// =============================================================================
//                                      TESTING
// =============================================================================

// This section contains a sanity check test that you can use to ensure your code
// works. We will be testing your code this way, so make sure you at least pass
// the given test. You are encouraged to write more tests!

// Remember: the tests will assume that each of the four client functions are
// async functions and thus will return a promise. Make sure you understand what this means.

function check(name, condition) {
  if (condition) {
    console.log(name + ": SUCCESS");
    return 3;
  } else {
    console.log(name + ": FAILED");
    return 0;
  }
}

async function sanityCheck() {
  console.log(
    "\nTEST",
    "Simplest possible test: only runs one add_IOU; uses all client functions: lookup, getTotalOwed, getUsers, getLastActive"
  );

  var score = 0;

  var accounts = await provider.listAccounts();
  defaultAccount = accounts[0];

  var users = await getUsers();
  score += check("getUsers() initially", users.length === 2);

  var owed = await getTotalOwed(accounts[1]);
  score += check("getTotalOwed(0) initially empty", owed === 0);

  var lookup_0_1 = await BlockchainSplitwise.lookup(accounts[0], accounts[1]);
  console.log("lookup(0, 1) current value" + lookup_0_1);
  score += check("lookup(0,1) initially 0", parseInt(lookup_0_1, 10) === 0);

  var response = await add_IOU(accounts[1], "10");

  users = await getUsers();
  score += check("getUsers() now length 2", users.length === 2);

  owed = await getTotalOwed(accounts[0]);
  score += check("getTotalOwed(0) now 10", owed === 10);

  lookup_0_1 = await BlockchainSplitwise.lookup(accounts[0], accounts[1]);
  score += check("lookup(0,1) now 10", parseInt(lookup_0_1, 10) === 10);

  var timeLastActive = await getLastActive(accounts[0]);
  var timeNow = Date.now() / 1000;
  var difference = timeNow - timeLastActive;
  score += check(
    "getLastActive(0) works",
    difference <= 60 && difference >= -3
  ); // -3 to 60 seconds

  console.log("Final Score: " + score + "/21");
}

// sanityCheck() //Uncomment this line to run the sanity check when you first open index.html
