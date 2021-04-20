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
  console.log(daiToken.address);
  //
  // A Mock YFI for testing
  //
  // const VaultAdapterMockFactory = await ethers.getContractFactory(
  //   "VaultAdapterMock"
  // );
  // const vaultAdapterMock = await VaultAdapterMockFactory.deploy(
  //   daiToken.address
  // );
  const YearnControllerMockFactory = await ethers.getContractFactory(
    "YearnControllerMock"
  );
  const yearnControllerMock = await YearnControllerMockFactory.deploy();
  console.log(
    `[Deployed] Yearn mock contracts: Controller \n Address: ${yearnControllerMock.address}`
  );

  const YearnVaultMock = await ethers.getContractFactory("YearnVaultMock");
  const yearnVaultMock = await YearnVaultMock.deploy(
    daiToken.address,
    yearnControllerMock.address
  );
  console.log(
    `[Deployed] Yearn mock contracts: Vault \n Address: ${yearnVaultMock.address}`
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
