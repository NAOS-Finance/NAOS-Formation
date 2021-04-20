import { ethers } from "hardhat";
import { Erc20 } from "../../types/Erc20";
import { Formation } from "../../types/Formation";
import { Transmuter } from "../../types/Transmuter";
import { VaultAdapterMock } from "../../types/VaultAdapterMock";
import { YearnVaultAdapter } from "../../types/YearnVaultAdapter";
import { YearnVaultMock } from "../../types/YearnVaultMock";
import { YearnControllerMock } from "../../types/YearnControllerMock";

let daiToken;
let nUSD;
let naosToken;

let yearnControllerMock;
let yearnVaultMock;

let formation;
let transmuter;
let yearnVaultAdapter;

async function deployToken() {
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  daiToken = await ERC20Mock.deploy("Mock DAI", "DAI", 18);
  console.log(`[Deployed] Dai \n Address: ${daiToken.address}`);

  const NToken = await ethers.getContractFactory("NToken");
  nUSD = await NToken.deploy();
  console.log(`[Deployed] NUSD \n Address: ${nUSD.address}`);

  const NAOSToken = await ethers.getContractFactory("NAOSToken");
  naosToken = await NAOSToken.deploy();
  console.log(`[Deployed] NAOS \n Address: ${naosToken.address}`);
}

async function deployYfi() {
  // const VaultAdapterMockFactory = await ethers.getContractFactory(
  //   "VaultAdapterMock"
  // );
  // const vaultAdapterMock = await VaultAdapterMockFactory.deploy(
  //   daiToken.address
  // );
  const YearnControllerMockFactory = await ethers.getContractFactory(
    "YearnControllerMock"
  );
  yearnControllerMock = await YearnControllerMockFactory.deploy();
  console.log(
    `[Deployed] Yearn mock contracts: Controller \n Address: ${yearnControllerMock.address}`
  );

  const YearnVaultMock = await ethers.getContractFactory("YearnVaultMock");
  yearnVaultMock = await YearnVaultMock.deploy(
    daiToken.address,
    yearnControllerMock.address
  );
  console.log(
    `[Deployed] Yearn mock contracts: Vault \n Address: ${yearnVaultMock.address}`
  );
}

async function deployFormation() {
  const [deployer] = await ethers.getSigners();
  const governance = deployer.address;
  const sentinel = deployer.address;

  const FormationFactory = await ethers.getContractFactory("Formation");
  formation = (await FormationFactory.deploy(
    daiToken.address,
    nUSD.address,
    governance,
    sentinel
  )) as Formation;
  console.log(`[Deployed] Formation \n Address: ${formation.address}`);

  const YearnVaultAdapterFactory = await ethers.getContractFactory(
    "YearnVaultAdapter"
  );
  yearnVaultAdapter = await YearnVaultAdapterFactory.deploy(
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
  transmuter = (await Transmuter.deploy(
    daiToken.address,
    nUSD.address,
    governance
  )) as Transmuter;
  console.log(`[Deployed] Transmuter \n Address: ${transmuter.address}`);
}

async function configureContract() {
  const [deployer] = await ethers.getSigners();

  // Formation
  await formation.setTransmuter(transmuter.address);
  console.log(`[Settings] Formation: setTransmuter`);

  await formation.setRewards(deployer.address);
  console.log(`[Settings] Formation: setRewards`);

  await formation.setHarvestFee(1000);
  console.log(`[Settings] Formation: setHarvestFee`);

  await formation.initialize(yearnVaultAdapter.address);
  console.log(`[Settings] Formation: initialize`);

  // Transmuter settings
  await transmuter.setWhitelist(formation.address, true);
  console.log(`[Settings] Transmuter: setWhitelist`);
}

(async () => {
  try {
    await deployToken();
    await deployYfi();
    await deployFormation();
    await configureContract();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
