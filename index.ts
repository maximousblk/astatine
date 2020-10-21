const Arweave = require("arweave");
const config = require("./config");
const keyfile = JSON.parse(process.env.KEYFILE);
const logFile = require("./distributions.json");

// math Σ function
const sigma = (start: number, end: number, exp: (x: number) => number) => {
  let result = 0;
  for (let n = start; n <= end; ++n) result += exp(n);
  return result;
};

// to simulate cron duration
const sleep = async (sec: number) => new Promise((res) => setTimeout(res, sec * 1000));

// round to the nearest interval
const roundTo = (num: number, int: number) => (Math.round((num / int) / 1000) * int);

// generate an array of run numbers => [1, 2, 3 ... n]
const runs = (n: number) => Array.from(Array(n), (v, k) => k + 1);

// set of distribution curves
const dist = {
  linear: (x: number) => Math.floor(config.emission_curve.initial_emit_amount - (x * config.time_interval * config.initial_emit_amount / config.emission_period)),
  exponential: (x: number) => Math.floor(config.initial_emit_amount * (Math.E ** (- config.decay_const * x * config.time_interval)))
}

const dist_curve = isNaN(config.decay_const) ? 'linear' : 'exponential'
const dist_total = sigma(0, config.emission_period / config.time_interval, dist[dist_curve]);

console.log({
  setup: {
    dist_curve,
    dist_total,
    config.initial_emit_amount,
    config.time_interval,
    config.emission_period,
    config.decay_const
  }
});

// save init time on first run
if (!fs.existsSync("init")) fs.writeFileSync("init", String(Date.now()));
if (!fs.existsSync("bal")) fs.writeFileSync("bal", config.dist_total);

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

function getBalance() {
  return Number(fs.readFileSync("bal"));
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
        target: addresses[i].address ? addresses[i].address : addresses[i],
        qty: addresses[i].weight ? Math.floor(amount * addresses[i].weight / weightTotal) : Math.floor(amount / addresses.length),
      }),
    };
    const tx = await arweave.createTransaction({
        target: addresses[i].address ? addresses[i].address : addresses[i],
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
  fs.readFileSync("./distributions.json", "utf8", (err, jsonString) => {
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
  })
}

const time_init = getTime();
let time = roundTo(Date.now() - time_init, config.time_interval);
let balance = getBalance();

for (const run of runs((config.emission_period / config.time_interval) + 1)) { // this would actually be an infinite loop
  // time passed rounded to nearest interval
  time = roundTo(Date.now() - time_init, config.time_interval);

  // get the number of token to distribute
  const expend = dist[dist_curve](run - 1);

  // create a transaction if conditions meet
  if (expend <= config.initial_emit_amount && expend > 0) {

    // create transactions to send
    let transactions = primeCannon(expend, config.taf, time);

    // send the transactions
    let sentTransactions = await emit(transactions);

    // log the transactions
    await logDistribution(expend, time, sentTransactions);

    // subtract amount distributed from the balance & update the file
    balance -= expend;
    fs.writeFileSync("bal", balance);
  } 

  // end executation and wait for next cron trigger
  await sleep(config.emission_period);
}