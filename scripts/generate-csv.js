// Usage: node generate-csv.js > ih.csv

const path = require('path')
const csv = require('csvtojson')

const ADDR_CSV = path.resolve('./name-addr.csv'); // "hatcher name","hatcher address"
const IH_CSV = path.resolve('./name-ih.csv'); // "hatcher name","impact hours"

async function generate () {
  const addrs = await csv({ output: 'csv' }).fromFile(ADDR_CSV)
  const ih = await csv({ output: 'csv' }).fromFile(IH_CSV)

  const addrsMap = addrs.reduce((map, value) => map.set(value[0], value[1]), new Map())
  console.log(`"hatcher address","impact hours"`)
  ih.forEach(([name, ih]) => {
    let addr = addrsMap.get(name)
    if (addr) {
      console.log(`"${addr}","${ih}"`)
    }
  })
}

generate()