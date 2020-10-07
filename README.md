<img src="./assets/astatine.jpg" align="right" width="200" height="200">

# Project Astatine

A configurable Profit Sharing Token Distributor GitHub Action to automatically emit Arweave Profit Sharing Tokens.

## Configuration

### CONFIG.JS
You need to modify [`config.js`](config.js) according to your requirements. Below are explanations for each of the configuration variables.

- `token_contract_id: String` - The contract ID of the token being emitted
- `emit_amount: Integer` - Total number of tokens to emit
- `emission_period: Integer` - Emission time period in seconds
- `emission_curve.name: "linear" || "exponential"`: The type of emission curve. [`linear`](./math/linear.pdf) or `exponential` (coming soon)

For **linear** curves, you must also choose **one** of the two following variables to fill in. If you fill in both, the emission curve will be inaccurate.

- `emission_curve.distribution_slope: Number`: The slope of the emission curve
- `emission_curve.initial_emit_amount: Integer`: The initial amount of tokens to emit

#### Token Allocation Function - `taf: () => {}`

The taf is what determines who PSTs are sent to on each run. You must build this function yourself, but the function must return one of two options:

**Format 1:**
```json
[
  "pvPWBZ8A5HLpGSEfhEmK1A3PfMgB_an8vVS6L14Hsls",
  "WNeEQzI24ZKWslZkQT573JZ8bhatwDVx6XVDrrGbUyk"
]
```
Each wallet address would be distributed an equal amount of PSTs at a given run

**Format 2:**
```json
[
  {
    "address": "pvPWBZ8A5HLpGSEfhEmK1A3PfMgB_an8vVS6L14Hsls",
    "weight": 6
  },
  {
    "address": "WNeEQzI24ZKWslZkQT573JZ8bhatwDVx6XVDrrGbUyk",
    "weight": 4
  }
]
```
Each wallet address would be distributed an amount equivalent to its weight out of the total
- In the above example, wallet 1 would receive 60% and wallet 2 would receive 40% of the PSTs being distributed at that time

### .GITHUB/WORKFLOWS/DECAY.YML
You need to modify the decay schedule in [`.github/workflows/decay.yml`](.github/workflows/decay.yml) according to your requirements. You can refer to [crontab.guru](https://crontab.guru/) for more info on cron syntax.

```yml
on:
  workflow_dispatch:
  schedule:
    - cron: "0 * * * *" # update this according to your requirements
```

**Arweave Keyfile**

You also need to store your Arweave keyfile as a GitHub secret named `KEYFILE` and the contents of your arweave keyfile as the value. Visit the [Secrets documentation](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets) for more info.
