import { ethers } from "hardhat";
import { Erc20 } from "../../types/Erc20";
import { Formation } from "../../types/Formation";
import { Transmuter } from "../../types/Transmuter";
import { VaultAdapterMock } from "../../types/VaultAdapterMock";
import { YearnVaultAdapter } from "../../types/YearnVaultAdapter";
import { YearnVaultMock } from "../../types/YearnVaultMock";
import { YearnControllerMock } from "../../types/YearnControllerMock";

async function main() {
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const daiToken = await ERC20Mock.attach(
    "0x93c7508ddc15A78363039D8505DC3fD37e43c37e"
  );
  const nUSD = await ERC20Mock.attach(
    "0x39Bd59452770651Cf5707622C8c154Ab42D1405F"
  );
  const naosToken = await ERC20Mock.attach(
    "0x4D3F093C37e945DF00630F853B780e0C57eBaE6C"
  );

  const YearnVaultMock = await ethers.getContractFactory("YearnVaultMock");
  const yearnVaultMock = await YearnVaultMock.attach(
    "0xeb0E8de04C6ca002aea810FFd8B12e8AA2aA2b23"
  );
  //
  // What we actaully interact with
  //
  const [deployer] = await ethers.getSigners();
  const governance = deployer.address;
  const sentinel = deployer.address;

  const FormationFactory = await ethers.getContractFactory("Formation");
  const formation = (await FormationFactory.deploy(
    daiToken.address,
    nUSD.address,
    governance,
    sentinel
  )) as Formation;
  console.log(`[Deployed] Formation \n Address: ${formation.address}`);

  const YearnVaultAdapterFactory = await ethers.getContractFactory(
    "YearnVaultAdapter"
  );
  const yearnVaultAdapter = await YearnVaultAdapterFactory.deploy(
    yearnVaultMock.address,
    formation.address
  );
  console.log(
    `[Deployed] Yearn mock contracts: Adapter \n Address: ${yearnVaultAdapter.address}`
  );

  const StakingPools = await ethers.getContractFactory("StakingPools");
  const pools = await StakingPools.deploy(naosToken.address, governance);
  console.log(`[Deployed] StakingPool \n Address: ${pools.address}`);

  const Transmuter = await ethers.getContractFactory("Transmuter");
  const transmuter = (await Transmuter.deploy(
    daiToken.address,
    nUSD.address,
    governance
  )) as Transmuter;
  console.log(`[Deployed] Transmuter \n Address: ${transmuter.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
