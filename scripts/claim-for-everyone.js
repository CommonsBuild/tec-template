const IH_TOKEN = "0xdf2c3c8764a92eb43d2eea0a4c2d77c2306b0835"
const IMPACT_HOURS_INSTANCE = "0x5e1c36c37b905575035b4198555f224508c7e6af"
const HATCH_INSTANCE = "0xe28722d5ce448341d158d887baf5d9410550790b"

const CONTRIBUTORS_PROCESSED_PER_TRANSACTION = 10

const IImpactHours = artifacts.require("IImpactHours")
const IHatch = artifacts.require("IHatch")

async function getContributors() {
  return fetch(
    'https://api.thegraph.com/subgraphs/name/aragon/aragon-tokens-xdai',
    {
      method: 'POST',
      body: JSON.stringify({
        query: `
          {
            tokenHolders(first: 1000 where : { tokenAddress: "${IH_TOKEN}"}) {
              address
            }
          }
        `})
    }
  )
  .then(res => res.json())
  .then(res => res.data.tokenHolders.map(({ address }) => address))
}

module.exports = async (callback) => {
  try {
    const impactHours = await IImpactHours.at(IMPACT_HOURS_INSTANCE)
    const hatch = await IHatch.at(HATCH_INSTANCE)

    const contributors = await getContributors()
    const total = Math.ceil(contributors.length / CONTRIBUTORS_PROCESSED_PER_TRANSACTION)
    let counter = 1
    for (let i = 0; i < contributors.length; i += CONTRIBUTORS_PROCESSED_PER_TRANSACTION) {
      const txReceipt = await impactHours.claimReward(
        contributors.slice(i, i + CONTRIBUTORS_PROCESSED_PER_TRANSACTION)
      )
      console.log(`Impact hours Txs: ${counter++} of ${total}. Claimed ${i + 1} to ${Math.min(i + CONTRIBUTORS_PROCESSED_PER_TRANSACTION, contributors.length)} impact hours. Gas fee: ${txReceipt.receipt.gasUsed}`)
    }
    const txReceipt = await hatch.close()
    console.log(`Hatch closed successfully. Gas used: ${txReceipt.receipt.gasUsed}`)
  } catch (error) {
    console.log(error)
  }
  callback()
}