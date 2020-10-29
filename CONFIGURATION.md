All configuration settings can be found in `scripts/new-dao.js`

### Global Configuration

Configurable, change these to suit your needs.
 - `DAO_ID`
  The id for the DAO. To redploy reuse the same id
 - `TOKEN_OWNER` The address for the token owner (`0xDc2aDfA800a1ffA16078Ef8C1F251D50DcDa1065`)

These should never need to be changed.
 - `ZERO_ADDRESS` The public key to use for default addresses. (`0x0`)
 - `HOURS` The definition of an hour in seconds (`3600`)
 - `DAYS` The definition of a day in seconds (`86400`)
 - `ONE_HUNDRED_PERCENT` The definition of 100% of a token (`1e18`)
 - `ONE_TOKEN` The definition of 1 token (`1e18`)
 - `FUNDRAISING_ONE_HUNDRED_PERCENT` The PPM for fundraising (`1e6`)

### CLI arguments

 - `--network`
  The network to deploy to (eg rinkeby, mainnet etc) (`local`)
 - `--daoid`
  The daoid to use. Overwrites `DAO_ID` set in new-dao.js (`testtec$random_number`)
 - `--nonminime`
  Wether to use a MiniMe token or not. Overwrites `NON_MINIME_COLLATERAL` set in new-dao.js (`false`)

### Colateral - MiniMe New Token Configuration

We created tDAI to act as the collateral for this DAO... it was all given to Sem and then passed to people for testing this deployment

 - `COLLATERAL_BALANCE`. The initial balance created for Sem (`1000000000000000000000000`)
 - `COLLATERAL_TOKEN_DECIMALS`. The number of decimal places for the token. (`18`)
 - `COLLATERAL_TOKEN_SYMBOL`. The symbody for the token. (`tDAI`)
 - `COLLATERAL_TOKEN_NAME`. The name for the token (`Test DAI`)

### DAO Deploy part1 - Deploy the organisation with Dandilion voting

 - `ORG_TOKEN_NAME`. The name for the token used by share holders in the organization. (`Token Engineering Commons TEST Token`)
 - `ORG_TOKEN_SYMBOL`. The symbol for the token used by share holders in the organization (`TESTTEC`)
 - `VOTING_SETTINGS`. Array of voting settings:
  - `SUPPORT_REQUIRED`. (`60%`)
  - `MIN_ACCEPTANCE_QUORUM`. (`2%`)
  - `VOTE_DURATION_BLOCKS`. The number of blocks a vote can last. (`8 hrs`)
  - `VOTE_BUFFER_BLOCKS`. (`8 hrs`)
  - `VOTE_EXECUTION_DELAY_BLOCKS`. (`24 hrs`)
 - `USE_AGENT_AS_VAULT` Whether to use an Agent app or Vault app. (`false`)

### DAO Deploy part2 - Tollgate & Conviction Voting

 - `collateralToken.address`. The token used to pay the tollgate fee. (`0x0`)
 - `TOLLGATE_FEE` The tollgate fee amount. (`3 tokens`)
 - `[collateralToken.address]`. An array of initially redeemable tokens. (`[0x0]`)
 - `CONVICTION_SETTINGS` An array of configurations:
  - `DECAY`
     The rate at which conviction is accrued or lost from a proposal
  - `MAX_RATIO` (`0.25`)
  - `WEIGHT` Determine weight based on `MAX_RATIO` and `MIN_THRESHOLD`. (`0.03125`)(`MAX_RATIO`^2 * `MIN_THRESHOLD`)
 - `collateralToken.address`. Token distributed by conviction voting and used as collateral in fundraising. (`0x0`)

### DAO Deploy part3 - Presale (Hatch) and TestTEC Token manager

 - `PRESALE_GOAL` The Hatch goal in token units (eg wei). (`300000000`)
 - `PRESALE_PERIOD` Hatch duration in seconds. Set to `0` for no Hatch. (`7 days`)
 - `PRESALE_EXCHANGE_RATE` Presale exchange rate in PPM (`300`)
 - `BUY_FEE_PCT`
    Percentage of fee to charge for buys (`20%`)
 - `SELL_FEE_PCT`
    Percentage of fee to charge for buys (`20%`)
 - `VESTING_CLIFF_PERIOD` Vesting cliff length for presale bought tokens in seconds (`3 days after hatch`)
 - `PRESALE_PERCENT_SUPPLY_OFFERED` Percent of total supply offered in presale in PPM (`100% of fundraising supply`)(`1e16`)
 - `VESTING_COMPLETE_PERIOD` Vesting complete length for presale bought tokens in seconds (`3 weeks after Cliff`)
 - `PRESALE_PERCENT_FUNDING_FOR_BENEFICIARY`
    The funding pool / reserve ratio (`0.35 * FUNDRAISING_ONE_HUNDRED_PERCENT`)
 - `OPEN_DATE`
    How many days until the Hatch finishes, set to '0' for no Hatch

### DAO Four - Marketplace App

 - `VIRTUAL_SUPPLY`
    Collateral token virtual supply in wei (`2`)
 - `VIRTUAL_BALANCE`
    Collateral token virtual balance in wei (`1`)
 - `RESERVE_RATIO`
    The reserve ratio to be used for the collateral token in PPM (`100000`)
