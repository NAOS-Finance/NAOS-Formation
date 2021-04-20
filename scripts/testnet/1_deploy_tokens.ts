import { ethers } from "hardhat";
import { Erc20 } from "../../types/Erc20";
import { Formation } from "../../types/Formation";
import { Transmuter } from "../../types/Transmuter";
import { VaultAdapterMock } from "../../types/VaultAdapterMock";
import { YearnVaultAdapter } from "../../types/YearnVaultAdapter";
import { YearnVaultMock } from "../../types/YearnVaultMock";
import { YearnControllerMock } from "../../types/YearnControllerMock";

async function main() {
  //
  // Tokens
  //
  const ERC20Mock = await ethers.getContractFactory("ERC20Mock");
  const daiToken = (await ERC20Mock.deploy("Mock DAI", "DAI", 18)) as Erc20;
  console.log(`[Deployed] Dai \n Address: ${daiToken.address}`);

  const NToken = await ethers.getContractFactory("NToken");
  const nUSD = await NToken.deploy();
  console.log(`[Deployed] NUSD \n Address: ${nUSD.address}`);

  const NAOSToken = await ethers.getContractFactory("NAOSToken");
  const naosToken = await NAOSToken.deploy();
  console.log(`[Deployed] NAOS \n Address: ${naosToken.address}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
