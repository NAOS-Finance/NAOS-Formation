const { ethers } = require("hardhat");

async function main() {
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const daiToken = await ERC20Mock.deploy("Mock DAI", "DAI", 18);

  const NToken = await ethers.getContractFactory("NToken");
  const nUSD = await NToken.deploy();

  const [deployer] = await ethers.getSigners();
  const governance = deployer.address;
  const sentinel = deployer.address;

  const Formation = await ethers.getContractFactory("Formation");
  const formation = await Formation.deploy(
    daiToken.address,
    nUSD.address,
    governance,
    sentinel
  );

  const NAOSToken = await ethers.getContractFactory("NAOSToken");
  const xToken = await NAOSToken.deploy();

  const StakingPools = await ethers.getContractFactory("StakingPools");
  const pools = await StakingPools.deploy(xToken.address, governance);

  const Transmuter = await ethers.getContractFactory("Transmuter");
  const transmuter = await Transmuter.deploy(
    daiToken.address,
    nUSD.address,
    governance
  );

  console.log(
    `DAI Token: ${daiToken.address}\nNToken: ${nUSD.address}\nFormation: ${formation.address}\n` +
      `NAOSToken: ${xToken.address}\nStakingPools: ${pools.address}\nTransmuter: ${transmuter.address}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
