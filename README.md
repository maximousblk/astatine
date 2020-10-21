<img src="./.github/assets/logo.png" align="left" width="140">

# Project Astatine

A configurable Profit Sharing Token Distributor GitHub Action to automatically emit Arweave Profit Sharing Tokens.

<br />

## Configuration

You must use the [linear](https://www.desmos.com/calculator/05ofbspddf) (for a linear curve) or [exponential decay](https://www.desmos.com/calculator/mvcfqcvtwp) (for an exponential curve) calculators to determine the variables below.

### CONFIG.JS

You need to modify [`config.js`](config.js) according to your requirements. Below are explanations for each of the configuration variables.

- `token_contract_id: String` - The contract ID of the token being emitted
- `emission_period: Integer` - **(E)** Emission time period in seconds
- `time_interval: Integer` - **(I)** Number of seconds in between each distribution cycle
- `initial_emit_amount: Integer` - **(A)** The initial amount of tokens to emit
- `decay_const` - **(k)** The decay constant for an exponential decay curve

> Note: Leave `decay_const` as an empty string if you're using a linear curve!

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

> Note: The cron interval **must** be equivalent to the `time_interval` variable in the configuration and **can not** be less than 1 minute.

**Arweave Keyfile**

You also need to store your Arweave keyfile as a GitHub secret named `KEYFILE` and the contents of your arweave keyfile as the value. Visit the [Secrets documentation](https://docs.github.com/en/free-pro-team@latest/actions/reference/encrypted-secrets) for more info.
