import { ethers } from "hardhat";
import { Erc20 } from "../../types/Erc20";
import { Formation } from "../../types/Formation";
import { Transmuter } from "../../types/Transmuter";
import { VaultAdapterMock } from "../../types/VaultAdapterMock";
import { YearnVaultAdapter } from "../../types/YearnVaultAdapter";
import { YearnVaultMock } from "../../types/YearnVaultMock";
import { YearnControllerMock } from "../../types/YearnControllerMock";

async function main() {
  const [deployer] = await ethers.getSigners();

  const FormationFactory = await ethers.getContractFactory("Formation");
  const formation = FormationFactory.attach(
    "0xAA48a1a06899b168A1ef8da621F570Fc9dC9Edb3"
  );

  const Transmuter = await ethers.getContractFactory("Transmuter");
  const transmuter = await Transmuter.attach(
    "0xD63466221F0bFB75A4E503c66d787f774d7d353b"
  );

  const YearnVaultAdapterFactory = await ethers.getContractFactory(
    "YearnVaultAdapter"
  );
  const yearnVaultAdapter = YearnVaultAdapterFactory.attach(
    "0xCb64B7C8272c1deB0061C71baFDA284C309EEBf3"
  );

  //
  // Formation settings
  //
  await formation.setTransmuter(transmuter.address);
  console.log(`[Settings] Formation: setTransmuter`);

  await formation.setRewards(deployer.address);
  console.log(`[Settings] Formation: setRewards`);

  await formation.setHarvestFee(1000);
  console.log(`[Settings] Formation: setHarvestFee`);

  await formation.initialize(yearnVaultAdapter.address);
  console.log(`[Settings] Formation: initialize`);

  //
  // Transmuter settings
  //
  await transmuter.setWhitelist(formation.address, true);
  console.log(`[Settings] Transmuter: setWhitelist`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
