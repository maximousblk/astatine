const config = {
  token_contract_id: "blah-blah", // token id
  emit_amount: "100000", // amount of tokens to emit
  emit_total_time: "31536000", // time period in seconds
  emit_curve: {
    name: "linear",
    distribution_slope: "",   // Pick one or the other
    initial_emit_amount: "",  // Pick one or the other to fill in
  }
};

module.exports = config;