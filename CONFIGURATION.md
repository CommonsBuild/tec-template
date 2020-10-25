


const DAO_ID = "testtec" + Math.random() // Note this must be unique for each deployment, change it for subsequent deployments
const NETWORK_ARG = "--network"
const DAO_ID_ARG = "--daoid"
const NON_MINIME_COLLATERAL = "--nonminime"
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const TOKEN_OWNER = "0xDc2aDfA800a1ffA16078Ef8C1F251D50DcDa1065"

The following are ecosystem constants
const HOURS = 60 * 60
const DAYS = 24 * HOURS
const ONE_HUNDRED_PERCENT = 1e18
const ONE_TOKEN = 1e18
const FUNDRAISING_ONE_HUNDRED_PERCENT = 1e6
const FUNDRAISING_ONE_TOKEN = 1e6

The following are your token constants
const COLLATERAL_TOKEN_NAME = "Test DAI"
const COLLATERAL_TOKEN_SYMBOL = "tDAI"
const COLLATERAL_TOKEN_DECIMALS = 18
const COLLATERAL_TOKEN_TRANSFERS_ENABLED = true
const COLLATERAL_BALANCE = 10e23

// Create dao transaction one config
const ORG_TOKEN_NAME = "Token Engineering Commons TEST Token"
const ORG_TOKEN_SYMBOL = "TESTTEC"
const SUPPORT_REQUIRED = 0.6 * ONE_HUNDRED_PERCENT
const MIN_ACCEPTANCE_QUORUM = 0.02 * ONE_HUNDRED_PERCENT
const VOTE_DURATION_BLOCKS = 3 * DAYS / 5 // 3 days
const VOTE_BUFFER_BLOCKS = 8 * HOURS / 5 // 8 hours
const VOTE_EXECUTION_DELAY_BLOCKS = 24 * HOURS / 5 // 24 hours
const VOTING_SETTINGS = [SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION_BLOCKS, VOTE_BUFFER_BLOCKS, VOTE_EXECUTION_DELAY_BLOCKS]
const USE_AGENT_AS_VAULT = false

// Create dao transaction two config
const TOLLGATE_FEE = 3 * ONE_TOKEN

// Create dao transaction three config

const PRESALE_GOAL = 300 * ONE_TOKEN
const PRESALE_PERIOD = 7 * DAYS
const PRESALE_EXCHANGE_RATE = 0.0003 * FUNDRAISING_ONE_TOKEN
const VESTING_CLIFF_PERIOD = PRESALE_PERIOD + 3 * DAYS // 3 days after presale
const VESTING_COMPLETE_PERIOD = VESTING_CLIFF_PERIOD + 3 * 7 * DAYS // 3 weeks after cliff
const PRESALE_PERCENT_SUPPLY_OFFERED = FUNDRAISING_ONE_HUNDRED_PERCENT


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
    ... is bad for teeth?
 - `MAX_RATIO` default(`25%`)
    The maximum ratio...
 - `WEIGHT`
    determine weight based on MAX_RATIO and MIN_THRESHOLD
