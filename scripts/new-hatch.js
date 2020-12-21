const path = require('path')
const csv = require('csvtojson')

const HatchTemplate = artifacts.require("HatchTemplate")

const DAO_ID = "testtec" + Math.random() // Note this must be unique for each deployment, change it for subsequent deployments
const NETWORK_ARG = "--network"
const DAO_ID_ARG = "--daoid"
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

const argValue = (arg, defaultValue) => process.argv.includes(arg) ? process.argv[process.argv.indexOf(arg) + 1] : defaultValue

const network = () => argValue(NETWORK_ARG, "local")
const daoId = () => argValue(DAO_ID_ARG, DAO_ID)

const hatchTemplateAddress = () => {
  return "0xeE7Fb6a47192E3Db29b2b849E77be32987dCBe1D"
}

// Helpers, no need to change
const HOURS = 60 * 60
const DAYS = 24 * HOURS
const WEEKS = 7 * DAYS
const ONE_HUNDRED_PERCENT = 1e18
const ONE_TOKEN = 1e18
const FUNDRAISING_ONE_HUNDRED_PERCENT = 1e6
const FUNDRAISING_ONE_TOKEN = 1e18
const PPM = 1000000

const BLOCKTIME = network() === "rinkeby" ? 15 : network() === "mainnet" ? 13 : 5 // 15 rinkeby, 13 mainnet, 5 xdai
console.log(`Every ${BLOCKTIME}s a new block is mined in ${network()}.`)

// CONFIGURATION

// Collateral Token is used to pay contributors and held in the bonding curve reserve
const COLLATERAL_TOKEN = '0xe91d153e0b41518a2ce8dd3d7944fa863463a97d' // wxDAI

// Org Token represents membership in the community and influence in proposals
const ORG_TOKEN_NAME = "Token Engineering Commons TEST Token"
const ORG_TOKEN_SYMBOL = "TESTTEC"

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
const USE_AGENT_AS_VAULT = true

// # Hatch settings

// How many tokens required to initialize the bonding curve
const PRESALE_MIN_GOAL = 0.5 * ONE_TOKEN
const PRESALE_MAX_GOAL = 1 * ONE_TOKEN
// How long should the presale period last for
const PRESALE_PERIOD = 7 * DAYS
// How many organization tokens per collateral token should be minted
const PRESALE_EXCHANGE_RATE = 0.00000001 * FUNDRAISING_ONE_TOKEN
// When is the cliff for vesting restrictions
const VESTING_CLIFF_PERIOD = PRESALE_PERIOD + 1 * HOURS // 1 hour after presale
// When will pre-sale contributors be fully vested
const VESTING_COMPLETE_PERIOD = VESTING_CLIFF_PERIOD + 1 * HOURS // 2 hours after presale
const PRESALE_PERCENT_SUPPLY_OFFERED = FUNDRAISING_ONE_HUNDRED_PERCENT
// What percentage of pre-sale contributions should go to the common pool (versus the reserve)
const PRESALE_PERCENT_FUNDING_FOR_BENEFICIARY = 0.35 * FUNDRAISING_ONE_HUNDRED_PERCENT
// when should the pre-sale be open, setting 0 will allow anyone to open the pre-sale anytime after deployment
const OPEN_DATE = 0

module.exports = async (callback) => {
  try {
    const hatchTemplate = await HatchTemplate.at(hatchTemplateAddress())

    const createDaoTxOneReceipt = await hatchTemplate.createDaoTxOne(
      ORG_TOKEN_NAME,
      ORG_TOKEN_SYMBOL,
      VOTING_SETTINGS,
      USE_AGENT_AS_VAULT,
      ZERO_ADDRESS
    )
    console.log(`Tx One Complete. DAO address: ${createDaoTxOneReceipt.logs.find(x => x.event === "DeployDao").args.dao} Gas used: ${createDaoTxOneReceipt.receipt.gasUsed} `)
    
    const createDaoTxTwoReceipt = await hatchTemplate.createDaoTxTwo(
      COLLATERAL_TOKEN,
      TOLLGATE_FEE,
      [COLLATERAL_TOKEN],
      COLLATERAL_TOKEN
    )
    console.log(`Tx Two Complete. Gas used: ${createDaoTxTwoReceipt.receipt.gasUsed}`)

    const createDaoTxThreeReceipt = await hatchTemplate.createDaoTxThree(
      PRESALE_MIN_GOAL,
      PRESALE_MAX_GOAL,
      PRESALE_PERIOD,
      PRESALE_EXCHANGE_RATE,
      VESTING_CLIFF_PERIOD,
      VESTING_COMPLETE_PERIOD,
      PRESALE_PERCENT_SUPPLY_OFFERED,
      PRESALE_PERCENT_FUNDING_FOR_BENEFICIARY,
      OPEN_DATE,
      SCORE_TOKEN,
      HATCH_ORACLE_RATIO
    )
    console.log(`Tx Three Complete. Gas used: ${createDaoTxThreeReceipt.receipt.gasUsed}`)

    const createDaoTxFourReceipt = await hatchTemplate.createDaoTxFour(
      daoId()
    )
    console.log(`Tx Four Complete. Gas used: ${createDaoTxFourReceipt.receipt.gasUsed}`)

  } catch (error) {
    console.log(error)
  }
  callback()
}
