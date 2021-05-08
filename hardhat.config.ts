require('dotenv').config();
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "hardhat-typechain";
import "solidity-coverage";
import { HardhatUserConfig } from "hardhat/types";


const infuraProjectId = process.env.INFURA_TOKEN ? process.env.INFURA_TOKEN : '';
const privateKey = process.env.PV ? process.env.PV : '';

const config: HardhatUserConfig = {
  // namedAccounts: {
  //   deployer: 0,
  //   governance: 0,
  //   rewards: 0,
  //   sentinel: 1,
  //   newGovernance: 0,
  //   user: 0,
  //   dai: {
  //     1: "0x6B175474E89094C44Da98b954EedeAC495271d0F", //mainnet dai address
  //     1337: "0x6B175474E89094C44Da98b954EedeAC495271d0F", //mainnet dai address
  //     3: "0xad6d458402f60fd3bd25163575031acdce07538d",
  //   },
  //   yearnVault: {
  //     1: "0x19D3364A399d251E894aC732651be8B0E4e85001", // mainnet yearn daivault address
  //     1337: "0x19D3364A399d251E894aC732651be8B0E4e85001", // mainnet yearn daivault address
  //     3: "0xdbfb15bc9beaaacda989ce3a6864af262166ac06",
  //   },
  //   linkOracleAddress: {
  //     1: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
  //     1337: "0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9",
  //   },
  // },
  defaultNetwork: "hardhat",
  networks: {
    localhost: { url: "http://localhost:8545" },
    coverage: {
      url: "http://localhost:8555",
      gas: 20000000,
    },
    hardhat: {
      chainId: 1337,
      allowUnlimitedContractSize: false,
      blockGasLimit: 25000000,
    },
    ropsten: {
      url: `https://ropsten.infura.io/v3/${infuraProjectId}`,
      accounts: [privateKey],
      blockGasLimit: 25000000,
    },
  },
  solidity: {
    version: "0.6.12",
    settings: {
      optimizer: {
        enabled: true,
        runs: 999999,
      },
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v5",
  },
};

export default config;
