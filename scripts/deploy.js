const { ethers } = require('hardhat')

async function main() {
    const ERC20Mock = await ethers.getContractFactory('ERC20Mock')
    const daiToken = await ERC20Mock.deploy('Mock DAI', 'DAI', 18)

    const AlToken = await ethers.getContractFactory('AlToken')
    const alUSD = await AlToken.deploy()

    const [deployer] = await ethers.getSigners()
    const governance = deployer.address
    const sentinel = deployer.address

    const Alchemist = await ethers.getContractFactory('Alchemist')
    const alchemist = await Alchemist.deploy(daiToken.address, alUSD.address, governance, sentinel)

    const AlchemixToken = await ethers.getContractFactory('AlchemixToken')
    const xToken = await AlchemixToken.deploy()

    const StakingPools = await ethers.getContractFactory('StakingPools')
    const pools = await StakingPools.deploy(xToken.address, governance)

    const Transmuter = await ethers.getContractFactory('Transmuter')
    const transmuter = await Transmuter.deploy(daiToken.address, alUSD.address, governance)

    console.log(
        `DAI Token: ${daiToken.address}\nAlToken: ${alUSD.address}\nAlchemist: ${alchemist.address}\n` +
        `AlchemixToken: ${xToken.address}\nStakingPools: ${pools.address}\nTransmuter: ${transmuter.address}`
    )
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error)
        process.exit(1)
    })