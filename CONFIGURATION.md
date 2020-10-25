
`scripts/new-dao.js`
```javascript
  const DAO_ID = "testtec" + Math.random() // Note this must be unique for each deployment, change it for subsequent deployments
  const NETWORK_ARG = "--network"
  const DAO_ID_ARG = "--daoid"
  const NON_MINIME_COLLATERAL = "--nonminime"
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  const TOKEN_OWNER = "0xDc2aDfA800a1ffA16078Ef8C1F251D50DcDa1065"

  // The following are ecosystem constants
  const HOURS = 60 * 60
  const DAYS = 24 * HOURS
  const ONE_HUNDRED_PERCENT = 1e18
  const ONE_TOKEN = 1e18
  const FUNDRAISING_ONE_HUNDRED_PERCENT = 1e6
  const FUNDRAISING_ONE_TOKEN = 1e6

```

### Colateral - MiniMe New Token Configuration

Please note that in order to create a new `MiniMe` token to use as collateral for the tollgate, please pass `--nonminime=true` argument.

 - `COLLATERAL_BALANCE`. The initial balance (`1000000000000000000000000`)
 - `COLLATERAL_TOKEN_DECIMALS`. The number of decimal places for the token. (`18`)
 - `COLLATERAL_TOKEN_SYMBOL`. The symbody for the token. (`tDAI`)
 - `COLLATERAL_TOKEN_NAME`. The name for the token (`Test DAI`)

### DAO One - Deploy the organisation

 - `ORG_TOKEN_NAME`. The name for the token used by share holders in the organization. (`Token Engineering Commons TEST Token`)
 - `ORG_TOKEN_SYMBOL`. The symbol for the token used by share holders in the organization (`TESTTEC`)
 - `VOTING_SETTINGS`. Array of voting settings:
  - `SUPPORT_REQUIRED`. (`60%`)
  - `MIN_ACCEPTANCE_QUORUM`. (`2%`)
  - `VOTE_DURATION_BLOCKS`. The number of blocks a vote can last. (`8 hrs`)
  - `VOTE_BUFFER_BLOCKS`. (`8 hrs`)
  - `VOTE_EXECUTION_DELAY_BLOCKS`. (`24 hrs`)
 - `USE_AGENT_AS_VAULT` Whether to use an Agent app or Vault app. (`false`)

### DAO Two - Tollgate

 - `collateralToken.address`. The token used to pay the tollgate fee. (`0x0`)
 - `TOLLGATE_FEE` The tollgate fee amount. (`3 tokens`)
 - `[collateralToken.address]`. An array of initially redeemable tokens. (`[0x0]`)
 - `CONVICTION_SETTINGS` An array of configurations:
  - `DECAY`
     The rate at which conviction is accrued or lost from a proposal
  - `MAX_RATIO` (`0.25`)
  - `WEIGHT` Determine weight based on `MAX_RATIO` and `MIN_THRESHOLD`. (`0.03125`)(`MAX_RATIO`^2 * `MIN_THRESHOLD`)
 - `collateralToken.address`. Token distributed by conviction voting and used as collateral in fundraising. (`0x0`)

### DAO Three - Hatch (fundraising/presale)

 - `PRESALE_GOAL` The Hatch goal in token units (eg wei). (`300000000`)
 - `PRESALE_PERIOD` Hatch duration in seconds. Set to `0` for no Hatch. (`7 days`)
 - `PRESALE_EXCHANGE_RATE` Presale exchange rate in PPM (`300`)
 - `VESTING_CLIFF_PERIOD` Vesting cliff length for presale bought tokens in seconds (`3 days after hatch`)
 - `PRESALE_PERCENT_SUPPLY_OFFERED` Percent of total supply offered in presale in PPM (`100% of fundraising supply`)(`1e16`)
 - `VESTING_COMPLETE_PERIOD` Vesting complete length for presale bought tokens in seconds (`3 weeks after Cliff`)
 - `PRESALE_PERCENT_FUNDING_FOR_BENEFICIARY`
    The funding pool / reserve ratio (`0.35 * FUNDRAISING_ONE_HUNDRED_PERCENT`)
 - `OPEN_DATE`
    How many days until the Hatch finishes, set to '0' for no Hatch

### Automated Market Maker

 - `BUY_FEE_PCT`
    Percentage of fee to charge for buys (`20%`)
 - `SELL_FEE_PCT`
    Percentage of fee to charge for buys (`20%`)

// Create dao transaction four config
const VIRTUAL_SUPPLY = 2 // TODO
const VIRTUAL_BALANCE = 1 // TODO
const RESERVE_RATIO = 0.1 * FUNDRAISING_ONE_HUNDRED_PERCENT

### Funding Pool

### Redemptions

### Conviction Voting

 - `DECAY`
    The rate at which conviction is accrued or lost from a proposal
 - `MAX_RATIO` default(`25%`)
    The maximum ratio...
 - `WEIGHT`
    determine weight based on MAX_RATIO and MIN_THRESHOLD
