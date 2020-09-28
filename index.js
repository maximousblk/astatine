const Arweave = require("arweave");
const config = require("./config");
const jwk = "";     // MAX - WE NEED TO PULL THIS FROM THE GITHUB SECRET

/**
 * Get the current time in relation to when the cannon was started.
 */
function getTime() {

  return "position on x axis"
}

/**
 * Generate all transactions necessary to emit.
 */
async function primeCannon(amount, addresses, time) {
  const
    arweave = Arweave.init({
      host: 'arweave.net',
      port: 443,
      protocol: 'https'
    }),
    userGets = Math.floor(amount / addresses.length);
  let allTransactions = [];
  for (let i = 0; i < addresses.length; i++) {
    const tags = {
      Cannon: "PST",
      Function: config.emission_curve.name,
      Completion: time / config.emission_period * 100,
      Contract: config.token_contract_id,
      "App-Name": "SmartWeaveAction",
      "App-Version": "0.3.0",
      Input: JSON.stringify({
        function: "transfer",
        target: addresses[i],
        qty: userGets
      })
    };
    const tx = await arweave.createTransaction({
      target: addresses[i],
      data: Math.random().toString().slice(-4),
    }, jwk);
    for (const [key, value] of Object.entries(tags)) {
      tx.addTag(key, value.toString());
    }
    await arweave.transactions.sign(tx, jwk);
    allTransactions.push(tx);
  }
  return allTransactions;
}

/**
 * Send all of the transactions to the corresponding addresses.
 */
async function emit(transactions) {
  const arweave = Arweave.init({
    host: 'arweave.net',
    port: 443,
    protocol: 'https'
  });
  for (let i = 0; i < transactions.length; i++) {
    await arweave.transactions.post(transactions[i]);
  }
}

/**
 * Distribute tokens on a linear decreasing function.
 */
function linear(time) {
  let
    distributionSlope = config.emission_curve.distribution_slope,
    initialEmitAmount = config.emission_curve.initial_emit_amount;
  
  // Find the unknown variable
  if (distributionSlope === "") {
    distributionSlope = (2 * (config.emit_amount - (initialEmitAmount * time))) / Math.pow(time, 2);
  } else if (initialEmitAmount === "") {
    initialEmitAmount = ((2 * config.emit_amount) - (distributionSlope * Math.pow(time, 2))) / (2 * time);
  }

  // y=mx+b
  // Amount to emit now = distributionSlope * currentTime + initialEmitAmount

  return (distributionSlope * time) + initialEmitAmount;
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