const path = require('path')
const csv = require('csvtojson')

const ImpactHours = artifacts.require("IImpactHours")

const data = await csv({ output: 'csv' }).fromFile(IMPACT_HOURS_CSV)
const contributors = data.map(value => value[0])
const total = Math.ceil(contributors.length / CONTRIBUTORS_PROCESSED_PER_TRANSACTION)
let counter = 1
for (let i = 0; i < contributors.length; i += CONTRIBUTORS_PROCESSED_PER_TRANSACTION) {
  const txReceipt = await ImpactHours.claimReward(
    contributors.slice(i, i + CONTRIBUTORS_PROCESSED_PER_TRANSACTION)
  )
  console.log(`Impact hours Txs: ${counter++} of ${total}. Claimed ${i + 1} to ${Math.min(i + CONTRIBUTORS_PROCESSED_PER_TRANSACTION, contributors.length)} impact hours. Gas fee: ${txReceipt.receipt.gasUsed}`)
}
