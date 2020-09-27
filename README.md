# Profit Sharing Token Distributor

A configurable GitHub Action to automatically emit Arweave Profit Sharing Tokens.

### Configuration

**CONFIG.JS**

You must modify the `config.js` file to meet the needs of your project. Below are explanations for each of the configuration variables.

- `token_contract_id`: The contract ID of the token being emitted
  - Type: String
- `emit_amount`: Total number of tokens to emit
  - Type: Integer
- `emission_period`: Number of seconds that the emission will take to complete (Ex: An emmission that takes 5 years equals `157784760` seconds)
  - Type: Integer
- `emission_curve.name`: The type of emission curve
  - Type: String
  - Options:
    - [`Linear`](./math/linear.pdf): A decreasing linear emission curve
    - `Exponential`: An exponential decay emission curve

For linear curves, you must also choose **one** of the two following variables to fill in. If you fill in both, the emission curve will be inaccurate.

- `emission_curve.distribution_slope`: The slope of the line
  - Type: Number
- `emission_curve.initial_emit_amount`: The initial amount of tokens to emit
  - Type: Integer

**.GITHUB/MAIN.YML**

```yml
# update the interval in chron syntax (that's it, right?)
```