const { HOLDERS, STAKES } = require('./data/tokenHolders')
const GardensTemplate = artifacts.require("GardensTemplate")
const MiniMeToken = artifacts.require("MiniMeToken")
const Token = artifacts.require("Token")

const DAO_ID = "testtec" + Math.random() // Note this must be unique for each deployment, change it for subsequent deployments
const NETWORK_ARG = "--network"
const DAO_ID_ARG = "--daoid"
const NON_MINIME_COLLATERAL = "--nonminime"
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
const TOKEN_OWNER = "0xDc2aDfA800a1ffA16078Ef8C1F251D50DcDa1065"

const argValue = (arg, defaultValue) => process.argv.includes(arg) ? process.argv[process.argv.indexOf(arg) + 1] : defaultValue

const network = () => argValue(NETWORK_ARG, "local")
const daoId = () => argValue(DAO_ID_ARG, DAO_ID)
const nonMiniMeCollateral = () => argValue(NON_MINIME_COLLATERAL, false)

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
const FUNDRAISING_ONE_TOKEN = 1e18

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
const VOTE_DURATION_BLOCKS = 3 * DAYS / 5 // 3 days on xDAI, ~1 day on Rinkeby
const VOTE_BUFFER_BLOCKS = 8 * HOURS / 5 // 8 hours on xDAI, ~2 hours & 40 minutes on Rinkeby
const VOTE_EXECUTION_DELAY_BLOCKS = 24 * HOURS / 5 // 24 hours on xDAI, 8 hours on Rinkeby
const VOTING_SETTINGS = [SUPPORT_REQUIRED, MIN_ACCEPTANCE_QUORUM, VOTE_DURATION_BLOCKS, VOTE_BUFFER_BLOCKS, VOTE_EXECUTION_DELAY_BLOCKS]
const USE_AGENT_AS_VAULT = false

// Create dao transaction two config
const TOLLGATE_FEE = 3 * ONE_TOKEN

// Create dao transaction three config
const PRESALE_GOAL = 300 * ONE_TOKEN
const PRESALE_PERIOD = 7 * DAYS
const PRESALE_EXCHANGE_RATE = 0.00000001 * FUNDRAISING_ONE_TOKEN
const VESTING_CLIFF_PERIOD = PRESALE_PERIOD + 3 * DAYS // 3 days after presale
const VESTING_COMPLETE_PERIOD = VESTING_CLIFF_PERIOD + 3 * 7 * DAYS // 3 weeks after cliff
const PRESALE_PERCENT_SUPPLY_OFFERED = FUNDRAISING_ONE_HUNDRED_PERCENT
const PRESALE_PERCENT_FUNDING_FOR_BENEFICIARY = 0.35 * FUNDRAISING_ONE_HUNDRED_PERCENT
const OPEN_DATE = 0
const BUY_FEE_PCT = 0 * ONE_HUNDRED_PERCENT
const SELL_FEE_PCT = 0.2 * ONE_HUNDRED_PERCENT

// Create dao transaction four config
const VIRTUAL_SUPPLY = 2 // TODO
const VIRTUAL_BALANCE = 1 // TODO
const RESERVE_RATIO = 0.1 * FUNDRAISING_ONE_HUNDRED_PERCENT

const scale = n => parseInt(n * 10 ** 7)
const HALFTIME = 0.5 * DAYS //
const BLOCKTIME = 15 // 15 rinkeby, 13 mainnet, 5 xdai
const CONVERTED_TIME = 1/BLOCKTIME * HALFTIME
const DECAY = 1/2 ** (1/CONVERTED_TIME) // alpha
const MAX_RATIO = 0.4 // 40 percent
const MIN_THRESHOLD = 0.005 // 0.5 percent
const WEIGHT = MAX_RATIO ** 2 * MIN_THRESHOLD // determine weight based on MAX_RATIO and MIN_THRESHOLD
// const MIN_EFFECTIVE_SUPPLY = 0.0025 * ONE_HUNDRED_PERCENT // 0.25% minimum effective supply
const CONVICTION_SETTINGS = [scale(DECAY), scale(MAX_RATIO), scale(WEIGHT)]

// Create token holders transaction config
const CHUNK = 15

module.exports = async (callback) => {
  try {
    const gardensTemplate = await GardensTemplate.at(gardensTemplateAddress())
    let collateralToken

    if (nonMiniMeCollateral()) {
      collateralToken = await Token.new(TOKEN_OWNER, COLLATERAL_TOKEN_NAME, COLLATERAL_TOKEN_SYMBOL)
    } else {
      collateralToken = await MiniMeToken.new(
        ZERO_ADDRESS,
        ZERO_ADDRESS,
        0,
        COLLATERAL_TOKEN_NAME,
        COLLATERAL_TOKEN_DECIMALS,
        COLLATERAL_TOKEN_SYMBOL,
        COLLATERAL_TOKEN_TRANSFERS_ENABLED
      )
      await collateralToken.generateTokens(TOKEN_OWNER, COLLATERAL_BALANCE)
    }
    console.log(`Created ${COLLATERAL_TOKEN_SYMBOL} Token: ${collateralToken.address}`)

    const createDaoTxOneReceipt = await gardensTemplate.createDaoTxOne(
      ORG_TOKEN_NAME,
      ORG_TOKEN_SYMBOL,
      VOTING_SETTINGS,
      USE_AGENT_AS_VAULT,
      TOKEN_OWNER
    )
    console.log(`Tx One Complete. DAO address: ${createDaoTxOneReceipt.logs.find(x => x.event === "DeployDao").args.dao} Gas used: ${createDaoTxOneReceipt.receipt.gasUsed} `)
    
    const createDaoTxTwoReceipt = await gardensTemplate.createDaoTxTwo(
      collateralToken.address,
      TOLLGATE_FEE,
      [collateralToken.address],
      CONVICTION_SETTINGS,
      collateralToken.address
    )
    console.log(`Tx Two Complete. Gas used: ${createDaoTxTwoReceipt.receipt.gasUsed}`)

    let counter = 1
    let total = Math.ceil(HOLDERS.length / CHUNK)
    if (HOLDERS.length === STAKES.length) {
      for (let i = 0, j = HOLDERS.length; i < j; i += CHUNK) {
        const txReceipt = await gardensTemplate.createTxTokenHolders(
          HOLDERS.slice(i, i + CHUNK),
          STAKES.slice(i, i + CHUNK),
          OPEN_DATE,
          VESTING_CLIFF_PERIOD,
          VESTING_COMPLETE_PERIOD
        )
        console.log(`Token Holders Txs: ${counter} of ${total}. Token holders ${i + 1} to ${i + CHUNK} created. Gas fee: ${txReceipt.receipt.gasUsed}`)
        counter++
      }
    }
    else {
      console.log('Token Holders Txs skypped: Holders and Stakes length mismatch')
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
      RESERVE_RATIO
    )
    console.log(`Tx Four Complete. Gas used: ${createDaoTxFourReceipt.receipt.gasUsed}`)

  } catch (error) {
    console.log(error)
  }
  callback()
}
