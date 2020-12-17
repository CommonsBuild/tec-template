const homedir = require('homedir')
const path = require('path')

const HDWalletProvider = require('truffle-hdwallet-provider')
const HDWalletProviderPrivkey = require('truffle-hdwallet-provider-privkey')

const DEFAULT_MNEMONIC = 'stumble story behind hurt patient ball whisper art swift tongue ice alien'

const configFilePath = (filename) =>
  path.join(homedir(), `.aragon/${filename}`)

const INFURA_API_KEY = require(configFilePath('infura.json')).api_key

const defaultRPC = (network) =>
  `https://${network}.infura.io/v3/${INFURA_API_KEY}`
const mnemonic = () => {
  try {
    return require(configFilePath('mnemonic.json')).mnemonic
  } catch (e) {
    return DEFAULT_MNEMONIC
  }
}

const settingsForNetwork = (network) => {
  try {
    return require(configFilePath(`${network}_key.json`))
  } catch (e) {
    return { }
  }
}

// Lazily loaded provider
const providerForNetwork = (network) => (
  () => {
    let { rpc, keys } = settingsForNetwork(network)

    rpc = rpc || defaultRPC(network)

    if (!keys || keys.length == 0) {
      return new HDWalletProvider(mnemonic(), rpc)
    }

    return new HDWalletProviderPrivkey(keys, rpc)
  }
)

module.exports = {
  networks: {
    rpc: {
      network_id: 15,
      host: 'localhost',
      port: 8545,
      gas: 8.9e6,
      gasPrice: 20000000001
    },
    devnet: {
      network_id: 16,
      host: 'localhost',
      port: 8555,
      gas: 8.9e6,
      gasPrice: 15000000001
    },
    mainnet: {
      network_id: 1,
      provider: providerForNetwork('mainnet'),
      gas: 7.9e6,
      gasPrice: 8000000001
    },
    ropsten: {
      network_id: 3,
      provider: providerForNetwork('ropsten'),
      gas: 4.712e6
    },
    rinkeby: {
      network_id: 4,
      provider: providerForNetwork('rinkeby'),
      gas: 7.9e6,
      gasPrice: 15000000001
    },
    xdai: {
      network_id: 100,
      provider: providerForNetwork('xdai'),
      gas: 124e5,
      gasPrice: 1100000000
    },
    kovan: {
      network_id: 42,
      provider: providerForNetwork('kovan'),
      gas: 6.9e6
    },
    coverage: {
      host: "localhost",
      network_id: "*",
      port: 8555,
      gas: 0xffffffffff,
      gasPrice: 0x01
    },
  },
  build: {},
  compilers: {
    solc: {
      version: "0.4.24",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1
        }
      }
    }
  }
}
