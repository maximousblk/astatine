const Arweave = require("arweave");
const config = require("./config");

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

function getTime() {

  return "position on x axis"
}

function emit(amount) {
 // Creates txs & sends them
}

// Distribute tokens on a linear graph
function linear(time) {
  let
    distributionSlope = config.emit_curve.distribution_slope,
    initialEmitAmount = config.emit_curve.initial_emit_amount;
  
  // Find the unknown variable
  if (distributionSlope === "") {
    distributionSlope = (2 * (config.emit_amount - (initialEmitAmount * t))) / Math.pow(time, 2);
  } else if (initialEmitAmount === "") {
    initialEmitAmount = ((2 * config.emit_amount) - (distributionSlope * Math.pow(time, 2))) / (2 * time);
  }

  // y=mx+b
  // Amount to emit now = distributionSlope * currentTime + initialEmitAmount

  return (distributionSlope * time) + initialEmitAmount;
}

const time = getTime();

if (config.emit_curve.name === "linear") {
  let tx = linear(time);
  let amount = 0
  emit(amount);
}


