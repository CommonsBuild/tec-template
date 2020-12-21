const deployTemplate = require('@aragon/templates-shared/scripts/deploy-template')

const TEMPLATE_NAME = 'hatch-template'
const CONTRACT_NAME = 'HatchTemplate'

module.exports = (callback) => {
  deployTemplate(web3, artifacts, TEMPLATE_NAME, CONTRACT_NAME)
    .then(template => {
      console.log("Hatch Template address: ", template.address)
    })
    .catch(error => console.log(error))
    .finally(callback)
}
