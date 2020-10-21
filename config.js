const config = {
  token_contract_id: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // token id
  emission_period: 31536000, // E
  time_interval: 1,          // I
  initial_emit_amount: 0,    // A
  decay_const: 0.1,          // k
  taf: () => {
    return [];
  },
};

module.exports = config;
