const Arweave = require("arweave");
const config = require("./config");
const keyfile = JSON.parse(process.env.KEYFILE);

// save init time on first run
if (!fs.existsSync("init")) fs.writeFileSync("init", String(Date.now()));

// initialise arweave
const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

/**
 * Get the current time in relation to when the cannon was started.
 */
function getTime() {
  const init = Number(fs.readFileSync("init"));
  return Math.floor((Date.now() - init) / 1000);
}

/**
 * Generate all transactions necessary to emit.
 */
async function primeCannon(amount, addresses, time) {
  let weightTotal = 0;
  if (addresses[0].weight) {
    // There is a weight variable added, so calculate total weight
    for (let i = 0; i < addresses.length; i++) {
      weightTotal += addresses[i].weight;
    }
  }
  let allTransactions = [];
  for (let i = 0; i < addresses.length; i++) {
    const tags = {
      Cannon: "PST",
      Function: config.emission_curve.name,
      Completion: (time / config.emission_period) * 100,
      Contract: config.token_contract_id,
      "App-Name": "SmartWeaveAction",
      "App-Version": "0.3.0",
      Input: JSON.stringify({
        function: "transfer",
        target: addresses[i],
        qty: addresses[i].weight ? Math.floor(amount * addresses[i].weight / weightTotal) : Math.floor(amount / addresses.length),
      }),
    };
    const tx = await arweave.createTransaction(
      { target: addresses[i], data: Math.random().toString().slice(-4) },
      keyfile
    );
    for (const [key, value] of Object.entries(tags)) {
      tx.addTag(key, value.toString());
    }
    await arweave.transactions.sign(tx, keyfile);
    allTransactions.push(tx);
  }
  return allTransactions;
}

/**
 * Send all of the transactions to the corresponding addresses.
 */
async function emit(transactions) {
  for (let i = 0; i < transactions.length; i++) {
    await arweave.transactions.post(transactions[i]);
  }
}

/**
 * Distribute tokens on a linear decay function.
 */
function linear(time) {
  let distributionSlope = config.emission_curve.distribution_slope,
    initialEmitAmount = config.emission_curve.initial_emit_amount;

  // Find the unknown variable
  if (distributionSlope === "") {
    distributionSlope =
      (2 * (config.emit_amount - initialEmitAmount * time)) / Math.pow(time, 2);
  } else if (initialEmitAmount === "") {
    initialEmitAmount =
      (2 * config.emit_amount - distributionSlope * Math.pow(time, 2)) /
      (2 * time);
  }

  // y=mx+b
  // Amount to emit now = distributionSlope * currentTime + initialEmitAmount

  return distributionSlope * time + initialEmitAmount;
}

/**
 * Distribute tokens on an exponential decay function
 */
function exponential(time) {
  return 0;
}

const time = getTime();
let amount;

if (config.emission_curve.name === "linear") {
  amount = linear(time);
} else if (config.emission_curve.name === "exponential") {
  amount = exponential(time);
}

if (amount) {
  let transactions = primeCannon(amount, config.taf, time);
  emit(transactions);
}
