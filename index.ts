import Transaction from 'arweave/node/lib/transaction';
import config from './config';

const Arweave = require('arweave');
const fs = require('fs');

export interface config {
  emission_period: number;
  time_interval: number;
  initial_emit_amount: number;
  decay_const: number;
  token_contract_id: string;
  token_allocations: string[] | { address: string; weight: number }[];
}

interface status {
  time_init: number;
  balance: number;
  distributions: { time: number; expend: number; transactions: string[] }[];
}

const keyfile: any = JSON.parse(process.env.KEYFILE);

/**
 * math Σ function
 */
const sigma = (start: number, end: number, exp: (x: number) => number) => {
  let result = 0;
  for (let n = start; n <= end; ++n) result += exp(n);
  return result;
};

/**
 * round to the nearest interval
 */
const floorTo = (num: number, int: number) => Math.floor(num / int / 1000) * int;

/**
 * set of distribution curves
 */
const dist = {
  linear: (x: number) => Math.floor(config.initial_emit_amount - (x * config.time_interval * config.initial_emit_amount) / config.emission_period),
  exponential: (x: number) => Math.floor(config.initial_emit_amount * Math.E ** (-config.decay_const * x * config.time_interval)),
};

const dist_curve: string = isNaN(config.decay_const) ? 'linear' : 'exponential';
const dist_total: number = sigma(0, config.emission_period / config.time_interval, dist[dist_curve]);

console.log({ config: { dist_curve, dist_total, ...config } });

// save init time & balance on first run
if (!fs.existsSync('status.json')) {
  const init_status: status = {
    time_init: Date.now(),
    balance: dist_total,
    distributions: [],
  };

  fs.writeFileSync('status.json', JSON.stringify(init_status, null, 2));
}

let status: status = JSON.parse(fs.readFileSync('status.json').toString());

console.log(1, status);

// initialise arweave
const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https',
});

/**
 * Generate all transactions necessary to emit.
 */
async function primeCannon(amount: number, addresses: any, time: number) {
  let weightTotal = 0;
  if (addresses[0]?.weight) {
    // There is a weight variable added, so calculate total weight
    for (let i = 0; i < addresses.length; i++) {
      weightTotal += addresses[i]?.weight;
    }
  }
  let allTransactions = [];
  for (let i = 0; i < addresses.length; i++) {
    const tags = {
      Cannon: 'PST',
      Function: dist_curve,
      Completion: (time / config.emission_period) * 100,
      Contract: config.token_contract_id,
      'App-Name': 'SmartWeaveAction',
      'App-Version': '0.3.0',
      Input: JSON.stringify({
        function: 'transfer',
        target: addresses[i].address ?? addresses[i],
        qty: addresses[i].weight ? Math.floor((amount * addresses[i].weight) / weightTotal) : Math.floor(amount / addresses.length),
      }),
    };
    const tx: Transaction = await arweave.createTransaction(
      {
        target: addresses[i].address ?? addresses[i],
        data: Math.random().toString().slice(-4),
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
async function emit(transactions: any) {
  let txIDs = [];
  for (let i = 0; i < transactions.length; i++) {
    await arweave.transactions.post(transactions[i]);
    txIDs.push(transactions[i].id);
  }
  return txIDs;
}

async function runDistribution() {
  const time = floorTo(Date.now() - status.time_init, config.time_interval);

  // get the number of token to distribute
  const expend = dist[dist_curve](time);

  // create a transaction if conditions meet
  if (time <= config.emission_period && expend > 0 && status.balance > 0) {
    console.log({ time, expend, balance: status.balance });

    // create transactions to send
    let transactions = await primeCannon(expend, config.token_allocations, time);
    // send the transactions
    let sentTransactions = await emit(transactions);

    status.distributions.push({
      time,
      expend,
      transactions: sentTransactions,
    });

    status.balance -= expend;
    fs.writeFileSync('status.json', JSON.stringify(status, null, 2));

    console.log(2, status);
  } else {
    console.log('unmet conditions', { time, expend, balance: status.balance });
  }
}

runDistribution();
