const Arweave = require("arweave");
const fs = require('fs');
const config = require("./config");
const keyfile = JSON.parse(process.env.KEYFILE);

// math Σ function
const sigma = (start, end, exp) => {
  let result = 0;
  for (let n = start; n <= end; ++n) result += exp(n);
  return result;
};

// round to the nearest interval
const roundTo = (num, int) => (Math.floor((num / int) / 1000) * int);

// set of distribution curves
const dist = {
  linear: (x) => Math.floor(config.emission_curve.initial_emit_amount - (x * config.time_interval * config.initial_emit_amount / config.emission_period)),
  exponential: (x) => Math.floor(config.initial_emit_amount * (Math.E ** (-config.decay_const * x * config.time_interval)))
}

const dist_curve = isNaN(config.decay_const) ? 'linear' : 'exponential'
const dist_total = sigma(0, config.emission_period / config.time_interval, dist[dist_curve]);

console.log({
  config: {
    ...config,
    dist_curve,
    dist_total,
  }
});

// save init time & balance on first run
if (!fs.existsSync("status.json")) {
  fs.writeFileSync("status.json", JSON.stringify({
    time_init: Date.now(),
    balance: dist_total
  }))
};

let status = JSON.parse(fs.readFileSync("status.json"))

// initialise arweave
const arweave = Arweave.init({
  host: "arweave.net",
  port: 443,
  protocol: "https",
});

/**
 * Get the current time in relation to when the cannon was started.
 */
const getTime = () => {
  const init = status.time_init;
  return roundTo(Date.now() - init, config.time_interval);
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
      Function: dist_curve,
      Completion: (time / config.emission_period) * 100,
      Contract: config.token_contract_id,
      "App-Name": "SmartWeaveAction",
      "App-Version": "0.3.0",
      Input: JSON.stringify({
        function: "transfer",
        target: addresses[i].address ?? addresses[i],
        qty: addresses[i].weight ? Math.floor(amount * addresses[i].weight / weightTotal) : Math.floor(amount / addresses.length),
      }),
    };
    const tx = await arweave.createTransaction({
        target: addresses[i].address ?? addresses[i],
        data: Math.random().toString().slice(-4)
      },
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
  let txIDs = [];
  for (let i = 0; i < transactions.length; i++) {
    let id = await arweave.transactions.post(transactions[i]);
    txIDs.push(id);
  }
  return txIDs;
}

/**
 * Log the distribution
 */
async function logDistribution(totalAmountAtTime, currentTime, transactions) {
  let addition = {
    time: currentTime,
    amount: totalAmountAtTime,
    transactions
  };
  let allTXs;
  fs.readFileSync("./distributions.json", (err, jsonString) => {
    if (err) {
      console.error(`Failed to read log file: ${err}`);
      return;
    }
    allTXs = jsonString;
  });
  try {
    JSON.parse(allTXs);
  } catch (err) {
    console.error(`Failed to parse log file: ${err}`);
    return;
  }
  allTXs.push(addition);
  fs.writeFileSync("./distributions.json", JSON.stringify(allTXs, null, 2), err => {
    if (err) {
      console.error(err);
    }
  });
}

async function runDistribution() {
  const time = getTime();
  console.log("STATUS BEFORE");
  console.log(status);

  // get the number of token to distribute
  const expend = dist[dist_curve](time);
  
  // create a transaction if conditions meet
  if (expend > 0) {
    console.log("Going to expend: " + expend);
    // create transactions to send
    let transactions = await primeCannon(expend, config.taf, time);
    // send the transactions
    let sentTransactions = await emit(transactions);
    console.log(sentTransactions);
    // log the transactions
    await logDistribution(expend, time, sentTransactions);
    status.balance -= expend
    console.log("STATUS AFTER");
    console.log(status);
    fs.writeFileSync("status.json", JSON.stringify(status));
  }
}

runDistribution();