const config = {
	token_contract_id: "XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // token id
	emit_amount: "100000", // amount of tokens to emit
	emission_period: "31536000", // time period in seconds
	emission_curve: {
		name: "linear",
		distribution_slope: "", // Pick one or the other
		initial_emit_amount: "", // Pick one or the other to fill in
	},
	taf: () => [],
};

module.exports = config;
