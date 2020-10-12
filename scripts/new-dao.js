const GardensTemplate = artifacts.require("GardensTemplate")

const DAO_ID = "testtec" + Math.random() // Note this must be unique for each deployment, change it for subsequent deployments
const NETWORK_ARG = "--network"
const DAO_ID_ARG = "--daoid"
const collateralTokenAddress = '0x0000000000000000000000000000000000000000'

const HOLDERS = []
const INITIAL_STAKES = []

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
  } else {
    const Arapp = require("../arapp_local")
    return Arapp.environments.devnet.address
  }
}

const HOURS = 60 * 60
const DAYS = 24 * HOURS
const ONE_HUNDRED_PERCENT = 1e18
const ONE_TOKEN = 1e18
const FUNDRAISING_ONE_HUNDRED_PERCENT = 1e6
const FUNDRAISING_ONE_TOKEN = 1e6

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
const USE_CONVICTION_AS_FINANCE = true
const FINANCE_PERIOD = 0 // Irrelevant if using conviction as finance

// Create dao transaction three config
const PRESALE_GOAL = 300 * ONE_TOKEN
const PRESALE_PERIOD = 7 * DAYS
const PRESALE_EXCHANGE_RATE = 0.0003 * FUNDRAISING_ONE_TOKEN
const VESTING_CLIFF_PERIOD = 3 * DAYS
const VESTING_COMPLETE_PERIOD = 3 * 7 * DAYS // 3 weeks
const PRESALE_PERCENT_SUPPLY_OFFERED = FUNDRAISING_ONE_HUNDRED_PERCENT
const PRESALE_PERCENT_FUNDING_FOR_BENEFICIARY = 0.35 * FUNDRAISING_ONE_HUNDRED_PERCENT
const OPEN_DATE = 0
const BUY_FEE_PCT = 0.2 * ONE_HUNDRED_PERCENT
const SELL_FEE_PCT = 0.2 * ONE_HUNDRED_PERCENT

// Create dao transaction four config
const VIRTUAL_SUPPLY = 2 // TODO
const VIRTUAL_BALANCE = 1 // TODO
const RESERVE_RATIO = 0.1 * FUNDRAISING_ONE_HUNDRED_PERCENT

module.exports = async (callback) => {
  try {
    const gardensTemplate = await GardensTemplate.at(gardensTemplateAddress())

    const createDaoTxOneReceipt = await gardensTemplate.createDaoTxOne(
      ORG_TOKEN_NAME,
      ORG_TOKEN_SYMBOL,
      HOLDERS,
      INITIAL_STAKES,
      VOTING_SETTINGS,
      USE_AGENT_AS_VAULT
    );
    console.log(`Tx One Complete. DAO address: ${createDaoTxOneReceipt.logs.find(x => x.event === "DeployDao").args.dao} Gas used: ${createDaoTxOneReceipt.receipt.gasUsed} `)

    const createDaoTxTwoReceipt = await gardensTemplate.createDaoTxTwo(
      collateralTokenAddress,
      TOLLGATE_FEE,
      [collateralTokenAddress],
      USE_CONVICTION_AS_FINANCE,
      FINANCE_PERIOD,
      collateralTokenAddress
    )
    console.log(`Tx Two Complete. Gas used: ${createDaoTxTwoReceipt.receipt.gasUsed}`)

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
      RESERVE_RATIO
    )
    console.log(`Tx Four Complete. Gas used: ${createDaoTxFourReceipt.receipt.gasUsed}`)

  } catch (error) {
    console.log(error)
  }
  callback()
}
