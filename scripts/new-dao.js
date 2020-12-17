const path = require('path')
const csv = require('csvtojson')

const GardensTemplate = artifacts.require("GardensTemplate")

const DAO_ID = "testtec" + Math.random() // Note this must be unique for each deployment, change it for subsequent deployments
const NETWORK_ARG = "--network"
const DAO_ID_ARG = "--daoid"
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const argValue = (arg, defaultValue) => process.argv.includes(arg) ? process.argv[process.argv.indexOf(arg) + 1] : defaultValue

const network = () => argValue(NETWORK_ARG, "local")
const daoId = () => argValue(DAO_ID_ARG, DAO_ID)

const gardensTemplateAddress = () => {
  if (network() === "rinkeby") {
    const Arapp = require("../arapp")
    return Arapp.environments.rinkeby.address
  } else if (network() === "mainnet") {
    const Arapp = require("../arapp")
    return Arapp.environments.mainnet.address
  } else if (network() === "xdai") {
    const Arapp = require("../arapp")
    return Arapp.environments.xdai.address
  } else {
    const Arapp = require("../arapp_local")
    return Arapp.environments.devnet.address
  }
}

// Helpers, no need to change
const HOURS = 60 * 60
const DAYS = 24 * HOURS
const WEEKS = 7 * DAYS
const ONE_HUNDRED_PERCENT = 1e18
const ONE_TOKEN = 1e18
const FUNDRAISING_ONE_HUNDRED_PERCENT = 1e6
const FUNDRAISING_ONE_TOKEN = 1e18
const HOLDERS_PER_TRANSACTION = 10
const PPM = 1000000

const BLOCKTIME = network() === "rinkeby" ? 15 : network() === "mainnet" ? 13 : 5 // 15 rinkeby, 13 mainnet, 5 xdai
console.log(`Every ${BLOCKTIME}s a new block is mined in ${network()}.`)

// CONFIGURATION

// Collateral Token is used to pay contributors and held in the bonding curve reserve
const COLLATERAL_TOKEN = '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d' // wxDAI

// Org Token represents membership in the community and influence in proposals
const ORG_TOKEN_NAME = "Token Engineering Commons TEST Hatch Token"
const ORG_TOKEN_SYMBOL = "TESTTECH"

// # Hatch Oracle Settings

// Score membership token is used to check how much members can contribute to the hatch
const SCORE_TOKEN = '0xc4fbe68522ba81a28879763c3ee33e08b13c499e' // CSTK Token on xDai
const SCORE_ONE_TOKEN = 1e0
// Ratio contribution tokens allowed per score membership token
const HATCH_ORACLE_RATIO = 0.005 * PPM * FUNDRAISING_ONE_TOKEN / SCORE_ONE_TOKEN


// # Dandelion Voting Settings

// Used for administrative or binary choice decisions with ragequit-like functionality
const SUPPORT_REQUIRED = 0.6 * ONE_HUNDRED_PERCENT
const MIN_ACCEPTANCE_QUORUM = 0.02 * ONE_HUNDRED_PERCENT
const VOTE_DURATION_BLOCKS = 3 * DAYS / BLOCKTIME
const VOTE_BUFFER_BLOCKS = 8 * HOURS / BLOCKTIME
const VOTE_EXECUTION_DELAY_BLOCKS = 24 * HOURS / BLOCKTIME
const VOTING_SETTINGS = [SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION_BLOCKS, VOTE_BUFFER_BLOCKS, VOTE_EXECUTION_DELAY_BLOCKS]
// Set the fee paid to the org to create an administrative vote
const TOLLGATE_FEE = 3 * ONE_TOKEN
// If you want to use the Agent instead of the vault allowing the community to interact with external contracts
const USE_AGENT_AS_VAULT = false


// # Conviction Voting settings
const HALFLIFE = 0.5 * DAYS // 12 hours
const MAX_RATIO = 0.4 // 40%
const MIN_THRESHOLD = 0.005 // 0.5%
const MIN_EFFECTIVE_SUPPLY = 0.0025 * ONE_HUNDRED_PERCENT // 0.25% minimum effective supply


// # Hatch settings

// How many tokens required to initialize the bonding curve
const PRESALE_GOAL = 100 * ONE_TOKEN
// How long should the presale period last for
const PRESALE_PERIOD = 7 * DAYS
// How many organization tokens per collateral token should be minted
const PRESALE_EXCHANGE_RATE = 0.00000001 * FUNDRAISING_ONE_TOKEN
// When is the cliff for vesting restrictions
const VESTING_CLIFF_PERIOD = PRESALE_PERIOD + 3 * DAYS // 3 days after presale
// When will pre-sale contributors be fully vested
const VESTING_COMPLETE_PERIOD = VESTING_CLIFF_PERIOD + 3 * WEEKS // 3 weeks after cliff
const PRESALE_PERCENT_SUPPLY_OFFERED = FUNDRAISING_ONE_HUNDRED_PERCENT
// What percentage of pre-sale contributions should go to the common pool (versus the reserve)
const PRESALE_PERCENT_FUNDING_FOR_BENEFICIARY = 0.35 * FUNDRAISING_ONE_HUNDRED_PERCENT
// when should the pre-sale be open, setting 0 will allow anyone to open the pre-sale anytime after deployment
const OPEN_DATE = 0

// ## Impact hours conversion config

// CSV with two columns: "hatcher address" and "impact hours"
const IMPACT_HOURS_CSV = path.resolve('./ih.csv'); 
// Ratio received organization tokens / impact hours
const IMPACT_HOURS_RATE = 100 * FUNDRAISING_ONE_TOKEN

// # Marketplace Bonding Curve Parameterization

// ## Entry and Exit fee settings

// percent of each "buy" that goes to the common pool
const BUY_FEE_PCT = 0 * ONE_HUNDRED_PERCENT
// percent of each "sell" that goes to the common pool
const SELL_FEE_PCT = 0.2 * ONE_HUNDRED_PERCENT

// Bonding Curve reserve settings
const RESERVE_RATIO = 0.1 * FUNDRAISING_ONE_HUNDRED_PERCENT // Determines reserve ratio of the bonding curve, 100 percent is a 1:1 peg with collateral asset.

// Virtual Supply and Virtual balance can be used to adjust granularity of the curve, behavior will be most intuitive if you do not change these values.
const VIRTUAL_SUPPLY = 2
const VIRTUAL_BALANCE = 1

module.exports = async (callback) => {
  try {
    const gardensTemplate = await GardensTemplate.at(gardensTemplateAddress())

    const createDaoTxOneReceipt = await gardensTemplate.createDaoTxOne(
      ORG_TOKEN_NAME,
      ORG_TOKEN_SYMBOL,
      VOTING_SETTINGS,
      USE_AGENT_AS_VAULT,
      ZERO_ADDRESS
    )
    console.log(`Tx One Complete. DAO address: ${createDaoTxOneReceipt.logs.find(x => x.event === "DeployDao").args.dao} Gas used: ${createDaoTxOneReceipt.receipt.gasUsed} `)
    
    const scale = n => parseInt(n * 10 ** 7)
    const CONVERTED_TIME = HALFLIFE / BLOCKTIME
    const DECAY = 1/2 ** (1 / CONVERTED_TIME) // alpha
    const WEIGHT = MAX_RATIO ** 2 * MIN_THRESHOLD // determine weight based on MAX_RATIO and MIN_THRESHOLD
    const CONVICTION_SETTINGS = [scale(DECAY), scale(MAX_RATIO), scale(WEIGHT), MIN_EFFECTIVE_SUPPLY]

    const createDaoTxTwoReceipt = await gardensTemplate.createDaoTxTwo(
      COLLATERAL_TOKEN,
      TOLLGATE_FEE,
      [COLLATERAL_TOKEN],
      CONVICTION_SETTINGS,
      COLLATERAL_TOKEN
    )
    console.log(`Tx Two Complete. Gas used: ${createDaoTxTwoReceipt.receipt.gasUsed}`)

    const data = await csv({ output: 'csv' }).fromFile(IMPACT_HOURS_CSV)
    const holders = data.map(value => value[0])
    const stakes = data.map(value => (value[1] * IMPACT_HOURS_RATE).toString())
    const total = Math.ceil(holders.length / HOLDERS_PER_TRANSACTION)
    let counter = 1
    for (let i = 0; i < holders.length; i += HOLDERS_PER_TRANSACTION) {
      const txReceipt = await gardensTemplate.createTxTokenHolders(
        holders.slice(i, i + HOLDERS_PER_TRANSACTION),
        stakes.slice(i, i + HOLDERS_PER_TRANSACTION),
        OPEN_DATE,
        VESTING_CLIFF_PERIOD,
        VESTING_COMPLETE_PERIOD
      )
      console.log(`Token Holders Txs: ${counter++} of ${total}. Token holders ${i + 1} to ${Math.min(i + HOLDERS_PER_TRANSACTION, holders.length)} created. Gas fee: ${txReceipt.receipt.gasUsed}`)
    }

    const createDaoTxThreeReceipt = await gardensTemplate.createDaoTxThree(
      PRESALE_GOAL,
      PRESALE_PERIOD,
      PRESALE_EXCHANGE_RATE,
      VESTING_CLIFF_PERIOD,
      VESTING_COMPLETE_PERIOD,
      PRESALE_PERCENT_SUPPLY_OFFERED,
      PRESALE_PERCENT_FUNDING_FOR_BENEFICIARY,
      OPEN_DATE,
      BUY_FEE_PCT,
      SELL_FEE_PCT
    )
    console.log(`Tx Three Complete. Gas used: ${createDaoTxThreeReceipt.receipt.gasUsed}`)

    const createDaoTxFourReceipt = await gardensTemplate.createDaoTxFour(
      daoId(),
      VIRTUAL_SUPPLY,
      VIRTUAL_BALANCE,
      RESERVE_RATIO,
      SCORE_TOKEN,
      HATCH_ORACLE_RATIO
    )
    console.log(`Tx Four Complete. Gas used: ${createDaoTxFourReceipt.receipt.gasUsed}`)

  } catch (error) {
    console.log(error)
  }
  callback()
}
