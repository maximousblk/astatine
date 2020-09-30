# astatine

A configurable Profit Sharing Token Distributor GitHub Action to automatically emit Arweave Profit Sharing Tokens.

### Configuration

**CONFIG.JS**

You need to modify [`config.js`](config.js) according to your requirements. Below are explanations for each of the configuration variables.

- `token_contract_id: String` - The contract ID of the token being emitted
- `emit_amount: Integer` - Total number of tokens to emit
- `emission_period: Integer` - Emission time period in seconds.
- `emission_curve.name: "linear" || "exponential"`: The type of emission curve. [`linear`](./math/linear.pdf) or `exponential`

For linear curves, you must also choose **one** of the two following variables to fill in. If you fill in both, the emission curve will be inaccurate.

- `emission_curve.distribution_slope: Number`: The slope of the emission curve
- `emission_curve.initial_emit_amount: Integer`: The initial amount of tokens to emit

**.GITHUB/WORKFLOWS/DECAY.YML**

You need to modify the decay schedule in [`.github/workflows/decay.yml`](.github/workflows/decay.yml) according to your requirements. You can refer to [crontab.guru](https://crontab.guru/) for more info on cron syntax

```yml
on:
  workflow_dispatch:
  schedule:
    - cron: "0 * * * *" # update this according to your requirements
```

#