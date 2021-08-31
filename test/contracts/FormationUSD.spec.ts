import chai from "chai";
import chaiSubset from "chai-subset";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import { BigNumber, BigNumberish, ContractFactory, Signer, utils } from "ethers";
import { Transmuter } from "../../types/Transmuter";
import { FormationUsd } from "../../types/FormationUsd";
import { StakingPools } from "../../types/StakingPools";
import { NToken } from "../../types/NToken";
import { Erc20MockUsd } from "../../types/Erc20MockUsd";
import { MAXIMUM_U256, ZERO_ADDRESS, DEFAULT_FLUSH_ACTIVATOR } from "../utils/helpers";
import { VaultAdapterMock } from "../../types/VaultAdapterMock";
import { YearnVaultAdapter } from "../../types/YearnVaultAdapter";
import { YearnVaultMockUsd } from "../../types/YearnVaultMockUsd";
import { YearnControllerMock } from "../../types/YearnControllerMock";
import { min } from "moment";
import { YearnVaultMock } from "../../types/YearnVaultMock";
const {parseEther, formatEther,parseUnits} = utils;

chai.use(solidity);
chai.use(chaiSubset);

const { expect } = chai;

let FormationFactory: ContractFactory;
let NUSDFactory: ContractFactory;
let ERC20MockFactory: ContractFactory;
let VaultAdapterMockFactory: ContractFactory;
let TransmuterFactory: ContractFactory;
let YearnVaultAdapterFactory: ContractFactory;
let YearnVaultMockUsdFactory: ContractFactory;
let YearnControllerMockFactory: ContractFactory;

var USDT_CONST = 1000000000000;

describe("Formation", () => {
  let signers: Signer[];

  before(async () => {
    FormationFactory = await ethers.getContractFactory("FormationUSD");
    TransmuterFactory = await ethers.getContractFactory("Transmuter");
    NUSDFactory = await ethers.getContractFactory("NToken");
    ERC20MockFactory = await ethers.getContractFactory("ERC20MockUSD");
    VaultAdapterMockFactory = await ethers.getContractFactory(
      "VaultAdapterMock"
    );
    YearnVaultAdapterFactory = await ethers.getContractFactory("YearnVaultAdapter");
    YearnVaultMockUsdFactory = await ethers.getContractFactory("YearnVaultMockUSD");
    YearnControllerMockFactory = await ethers.getContractFactory("YearnControllerMock");
  });

  beforeEach(async () => {
    signers = await ethers.getSigners();
  });

  describe("constructor", async () => {
    let deployer: Signer;
    let governance: Signer;
    let sentinel: Signer;
    let token: Erc20MockUsd;
    let nUsd: NToken;
    let formation: FormationUsd;

    beforeEach(async () => {
      [deployer, governance, sentinel, ...signers] = signers;

      token = (await ERC20MockFactory.connect(deployer).deploy(
        "Mock USD",
        "USD",
        6
      )) as Erc20MockUsd;

      nUsd = (await NUSDFactory.connect(deployer).deploy()) as NToken;

      // formation = await FormationFactory
      //   .connect(deployer)
      //   .deploy(
      //     token.address, nUsd.address, await governance.getAddress(), await sentinel.getAddress()
      //   ) as Formation;
    });

    context("when token is the zero address", () => {
      it("reverts", async () => {
        expect(
          FormationFactory.connect(deployer).deploy(
            ZERO_ADDRESS,
            nUsd.address,
            await governance.getAddress(),
            await sentinel.getAddress(),
            DEFAULT_FLUSH_ACTIVATOR
          )
        ).revertedWith("Formation: token address cannot be 0x0.");
      });
    });

    context("when xtoken is the zero address", () => {
      it("reverts", async () => {
        expect(
          FormationFactory.connect(deployer).deploy(
            token.address,
            ZERO_ADDRESS,
            await governance.getAddress(),
            await sentinel.getAddress(),
            DEFAULT_FLUSH_ACTIVATOR
          )
        ).revertedWith("Formation: xtoken address cannot be 0x0.");
      });
    });

    context("when governance is the zero address", () => {
      it("reverts", async () => {
        expect(
          FormationFactory.connect(deployer).deploy(
            token.address,
            nUsd.address,
            ZERO_ADDRESS,
            await sentinel.getAddress(),
            DEFAULT_FLUSH_ACTIVATOR
          )
        ).revertedWith("Formation: governance address cannot be 0x0.");
      });
    });

    context("when sentinel is the zero address", () => {
      it("reverts", async () => {
        expect(
          FormationFactory.connect(deployer).deploy(
            token.address,
            nUsd.address,
            await governance.getAddress(),
            ZERO_ADDRESS,
            DEFAULT_FLUSH_ACTIVATOR
          )
        ).revertedWith("Formation: sentinel address cannot be 0x0.");
      });
    });

    context("when flushActivator is set to zero", () => {
      it("reverts", async () => {
        expect(
          FormationFactory.connect(deployer).deploy(
            token.address,
            nUsd.address,
            await governance.getAddress(),
            await sentinel.getAddress(),
            0
          )
        ).revertedWith("Formation: flushActivator should be larger than 0");
      });
    });
   });

  describe("update Formation addys and variables", () => {
    let deployer: Signer;
    let governance: Signer;
    let newGovernance: Signer;
    let rewards: Signer;
    let sentinel: Signer;
    let transmuter: Signer;
    let token: Erc20MockUsd;
    let nUsd: NToken;
    let formation: FormationUsd;


    beforeEach(async () => {
      [
        deployer,
        governance,
        newGovernance,
        rewards,
        sentinel,
        transmuter,
        ...signers
      ] = signers;

      token = (await ERC20MockFactory.connect(deployer).deploy(
        "Mock USD",
        "USD",
        6
      )) as Erc20MockUsd;

      nUsd = (await NUSDFactory.connect(deployer).deploy()) as NToken;

      formation = (await FormationFactory.connect(deployer).deploy(
        token.address,
        nUsd.address,
        await governance.getAddress(),
        await sentinel.getAddress(),
        DEFAULT_FLUSH_ACTIVATOR
      )) as FormationUsd;

    });

    describe("set governance", () => {
      context("when caller is not current governance", () => {
        beforeEach(() => (formation = formation.connect(deployer)));

        it("reverts", async () => {
          expect(
            formation.setPendingGovernance(await newGovernance.getAddress())
          ).revertedWith("Formation: only governance");
        });
      });

      context("when caller is current governance", () => {
        beforeEach(() => (formation = formation.connect(governance)));

        it("reverts when setting governance to zero address", async () => {
          expect(formation.setPendingGovernance(ZERO_ADDRESS)).revertedWith(
            "Formation: governance address cannot be 0x0."
          );
        });

        it("updates rewards", async () => {
          await formation.setRewards(await rewards.getAddress());
          expect(await formation.rewards()).equal(await rewards.getAddress());
        });
      });
    });

    describe("set transmuter", () => {
      context("when caller is not current governance", () => {
        it("reverts", async () => {
          expect(
            formation.setTransmuter(await transmuter.getAddress())
          ).revertedWith("Formation: only governance");
        });
      });

      context("when caller is current governance", () => {
        beforeEach(() => (formation = formation.connect(governance)));

        it("reverts when setting transmuter to zero address", async () => {
          expect(formation.setTransmuter(ZERO_ADDRESS)).revertedWith(
            "Formation: transmuter address cannot be 0x0."
          );
        });

        it("updates transmuter", async () => {
          await formation.setTransmuter(await transmuter.getAddress());
          expect(await formation.transmuter()).equal(
            await transmuter.getAddress()
          );
        });
      });
    });

    describe("set rewards", () => {
      context("when caller is not current governance", () => {
        beforeEach(() => (formation = formation.connect(deployer)));

        it("reverts", async () => {
          expect(formation.setRewards(await rewards.getAddress())).revertedWith(
            "Formation: only governance"
          );
        });
      });

      context("when caller is current governance", () => {
        beforeEach(() => (formation = formation.connect(governance)));

        it("reverts when setting rewards to zero address", async () => {
          expect(formation.setRewards(ZERO_ADDRESS)).revertedWith(
            "Formation: rewards address cannot be 0x0."
          );
        });

        it("updates rewards", async () => {
          await formation.setRewards(await rewards.getAddress());
          expect(await formation.rewards()).equal(await rewards.getAddress());
        });
      });
    });

    describe("set peformance fee", () => {
      context("when caller is not current governance", () => {
        beforeEach(() => (formation = formation.connect(deployer)));

        it("reverts", async () => {
          expect(formation.setHarvestFee(1)).revertedWith(
            "Formation: only governance"
          );
        });
      });

      context("when caller is current governance", () => {
        beforeEach(() => (formation = formation.connect(governance)));

        it("reverts when performance fee greater than maximum", async () => {
          const MAXIMUM_VALUE = await formation.PERCENT_RESOLUTION();
          expect(formation.setHarvestFee(MAXIMUM_VALUE.add(1))).revertedWith(
            "Formation: harvest fee above maximum"
          );
        });

        it("updates performance fee", async () => {
          await formation.setHarvestFee(1);
          expect(await formation.harvestFee()).equal(1);
        });
      });
    });

    describe("set collateralization limit", () => {
      context("when caller is not current governance", () => {
        beforeEach(() => (formation = formation.connect(deployer)));

        it("reverts", async () => {
          const collateralizationLimit = await formation.MINIMUM_COLLATERALIZATION_LIMIT();
          expect(
            formation.setCollateralizationLimit(collateralizationLimit)
          ).revertedWith("Formation: only governance");
        });
      });

      context("when caller is current governance", () => {
        beforeEach(() => (formation = formation.connect(governance)));

        it("reverts when performance fee less than minimum", async () => {
          const MINIMUM_LIMIT = await formation.MINIMUM_COLLATERALIZATION_LIMIT();
          expect(
            formation.setCollateralizationLimit(MINIMUM_LIMIT.sub(1))
          ).revertedWith("Formation: collateralization limit below minimum.");
        });

        it("reverts when performance fee greater than maximum", async () => {
          const MAXIMUM_LIMIT = await formation.MAXIMUM_COLLATERALIZATION_LIMIT();
          expect(
            formation.setCollateralizationLimit(MAXIMUM_LIMIT.add(1))
          ).revertedWith("Formation: collateralization limit above maximum");
        });

        it("updates collateralization limit", async () => {
          const collateralizationLimit = await formation.MINIMUM_COLLATERALIZATION_LIMIT();
          await formation.setCollateralizationLimit(collateralizationLimit);
          expect(await formation.collateralizationLimit()).containSubset([
            collateralizationLimit,
          ]);
        });
      });
    });
  });

  describe("vault actions", () => {
    let deployer: Signer;
    let governance: Signer;
    let sentinel: Signer;
    let rewards: Signer;
    let transmuter: Signer;
    let minter: Signer;
    let user: Signer;
    let token: Erc20MockUsd;
    let nUsd: NToken;
    let formation: FormationUsd;
    let adapter: YearnVaultAdapter;
    let newAdapter: YearnVaultAdapter;
    let controllerMock: YearnControllerMock;
    let vaultMock: YearnVaultMockUsd;
    let activevaultMock:YearnVaultMockUsd;
    let inactivevaultMock:YearnVaultMockUsd;
    let harvestFee = 1000;
    let pctReso = 10000;
    let transmuterContract: Transmuter;

    beforeEach(async () => {
      [
        deployer,
        governance,
        sentinel,
        rewards,
        transmuter,
        minter,
        user,
        ...signers
      ] = signers;

      token = (await ERC20MockFactory.connect(deployer).deploy(
        "Mock USD",
        "USD",
        6
      )) as Erc20MockUsd;

      nUsd = (await NUSDFactory.connect(deployer).deploy()) as NToken;

      formation = (await FormationFactory.connect(deployer).deploy(
        token.address,
        nUsd.address,
        await governance.getAddress(),
        await sentinel.getAddress(),
        DEFAULT_FLUSH_ACTIVATOR
      )) as FormationUsd;

      await formation
        .connect(governance)
        .setTransmuter(await transmuter.getAddress());
      await formation
        .connect(governance)
        .setRewards(await rewards.getAddress());
      await formation.connect(governance).setHarvestFee(harvestFee);
      transmuterContract = (await TransmuterFactory.connect(deployer).deploy(
        nUsd.address,
        token.address,
        await governance.getAddress()
      )) as Transmuter;
      await formation.connect(governance).setTransmuter(transmuterContract.address);
      await transmuterContract.connect(governance).setWhitelist(formation.address, true);
      await token.mint(await minter.getAddress(), parseEther("10000"));
      await token.connect(minter).approve(formation.address, parseEther("10000"));
    });

    describe("migrate", () => {
      beforeEach(async () => {
        controllerMock = await YearnControllerMockFactory
        .connect(deployer)
        .deploy() as YearnControllerMock;
        vaultMock = await YearnVaultMockUsdFactory
        .connect(deployer)
        .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;
        adapter = await YearnVaultAdapterFactory
        .connect(deployer)
        .deploy(vaultMock.address, formation.address) as YearnVaultAdapter;

        await formation.connect(governance).initialize(adapter.address);
      });

      context("when caller is not current governance", () => {
        beforeEach(() => (formation = formation.connect(deployer)));

        it("reverts", async () => {
          expect(formation.migrate(adapter.address)).revertedWith(
            "Formation: only governance"
          );
        });
      });

       context("when caller is current governance", () => {
        beforeEach(() => (formation = formation.connect(governance)));

        context("when adapter is zero address", async () => {
          it("reverts", async () => {
            expect(formation.migrate(ZERO_ADDRESS)).revertedWith(
              "Formation: active vault address cannot be 0x0."
            );
          });
        });

        context("when adapter is same as current active vault", async () => {
          it("reverts", async () => {
            const activeVaultAddress = adapter.address
            expect(formation.migrate(activeVaultAddress)).revertedWith(
              "Formation: new active vault address cannot be the same as current active vault"
            );
          });
        });

        context("when adapter token mismatches", () => {
          const tokenAddress = ethers.utils.getAddress(
            "0xffffffffffffffffffffffffffffffffffffffff"
          );

          let invalidAdapter: YearnVaultMock;

          beforeEach(async () => {
            invalidAdapter = await YearnVaultMockUsdFactory
            .connect(deployer)
            .deploy(tokenAddress, controllerMock.address) as YearnVaultMockUsd;
          });

          it("reverts", async () => {
            expect(formation.migrate(invalidAdapter.address)).revertedWith(
              "Formation: token mismatch"
            );
          });
        });

        context("when conditions are met", () => {
          beforeEach(async () => {
            newAdapter = await YearnVaultAdapterFactory
            .connect(deployer)
            .deploy(vaultMock.address, formation.address) as YearnVaultAdapter;
            await formation.migrate(newAdapter.address);
          });

          it("increments the vault count", async () => {
            expect(await formation.vaultCount()).equal(2);
          });

          it("sets the vaults adapter", async () => {
            expect(await formation.getVaultAdapter(0)).equal(adapter.address);
          });
        });
       });
     });

    describe("recall funds", () => {
      context("from the active vault", () => {
        let adapter: YearnVaultAdapter;
        let controllerMock: YearnControllerMock;
        let vaultMock: YearnVaultMockUsd;
        let depositAmt = parseUnits("5000",6);
        let mintAmt = parseEther("1000");
        let recallAmt = parseUnits("500",6);

        beforeEach(async () => {
          controllerMock = await YearnControllerMockFactory
            .connect(deployer)
            .deploy() as YearnControllerMock;
          vaultMock = await YearnVaultMockUsdFactory
            .connect(deployer)
            .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;
          adapter = await YearnVaultAdapterFactory
            .connect(deployer)
            .deploy(vaultMock.address, formation.address) as YearnVaultAdapter;
          await token.mint(await deployer.getAddress(), parseEther("10000"));
          await token.approve(vaultMock.address, parseEther("10000"));
          await formation.connect(governance).initialize(adapter.address)
          await formation.connect(minter).deposit(depositAmt);
          await formation.flush();
          // need at least one other deposit in the vault to not get underflow errors
          await vaultMock.connect(deployer).deposit(parseUnits("100",6));
        });

        it("reverts when not an emergency, not governance, and user does not have permission to recall funds from active vault", async () => {
          expect(formation.connect(minter).recall(0, 0))
            .revertedWith("Formation: not an emergency, not governance, and user does not have permission to recall funds from active vault")
        });

        it("governance can recall some of the funds", async () => {
          let beforeBal = await token.connect(governance).balanceOf(formation.address);
          await formation.connect(governance).recall(0, recallAmt);
          let afterBal = await token.connect(governance).balanceOf(formation.address);
          expect(beforeBal).equal(0);
          expect(afterBal).equal(recallAmt);
        });


      });

      context("from an inactive vault", () => {
        let inactiveAdapter: YearnVaultAdapter;
        let activeAdapter: YearnVaultAdapter;
        let depositAmt = parseUnits("5000",6);
        let mintAmt = parseEther("1000");
        let recallAmt = parseUnits("500",6);

        beforeEach(async () => {
          controllerMock = await YearnControllerMockFactory
          .connect(deployer)
          .deploy() as YearnControllerMock;
        vaultMock = await YearnVaultMockUsdFactory
          .connect(deployer)
          .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;

          inactiveAdapter = await YearnVaultAdapterFactory
          .connect(deployer)
          .deploy(vaultMock.address, formation.address) as YearnVaultAdapter;

          activeAdapter = await YearnVaultAdapterFactory
          .connect(deployer)
          .deploy(vaultMock.address, formation.address) as YearnVaultAdapter;

          await formation.connect(governance).initialize(inactiveAdapter.address);
          await token.mint(await minter.getAddress(), depositAmt.mul(USDT_CONST));
          await token.mint(await deployer.getAddress(), parseEther("10000"));
          await token.connect(minter).approve(formation.address, depositAmt.mul(USDT_CONST));
          await token.approve(vaultMock.address, parseEther("10000"));
          await formation.connect(minter).deposit(depositAmt);
          await formation.connect(minter).flush();
          await formation.connect(governance).migrate(activeAdapter.address);
          //need at least one other deposit in the vault to not get underflow errors
          await vaultMock.connect(deployer).deposit(parseUnits("100",6));
        });

        it("anyone can recall some of the funds to the contract", async () => {
          await formation.connect(minter).recall(0, recallAmt);
          expect(await token.balanceOf(formation.address)).equal(recallAmt);
        });

      });
     });

    describe("flush funds", () => {
      let adapter: YearnVaultAdapter;

      context("when the Formation is not initialized", () => {
        it("reverts", async () => {
          expect(formation.flush()).revertedWith("Formation: not initialized.");
        });
      });

      context("when there is at least one vault to flush to", () => {
        context("when there is one vault", () => {
          let adapter: YearnVaultAdapter;
          let mintAmount = parseEther("5000");

          beforeEach(async () => {
            controllerMock = await YearnControllerMockFactory
            .connect(deployer)
            .deploy() as YearnControllerMock;
          vaultMock = await YearnVaultMockUsdFactory
            .connect(deployer)
            .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;
            adapter = await YearnVaultAdapterFactory
            .connect(deployer)
            .deploy(vaultMock.address, formation.address) as YearnVaultAdapter;
           

          await formation.connect(governance).initialize(adapter.address);
          await token.mint(formation.address, mintAmount);
          await formation.connect(minter).flush();
          });

          it("flushes funds to the vault", async () => {
            expect(await token.balanceOf(vaultMock.address)).equal(mintAmount);
          });
        });

        context("when there are multiple vaults", () => {
          let inactiveAdapter: YearnVaultAdapter;
          let activeAdapter: YearnVaultAdapter;
          let mintAmount = parseEther("5000");

          beforeEach(async () => {
          controllerMock = await YearnControllerMockFactory
          .connect(deployer)
          .deploy() as YearnControllerMock;

        activevaultMock = await YearnVaultMockUsdFactory
          .connect(deployer)
          .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;

          inactivevaultMock = await YearnVaultMockUsdFactory
          .connect(deployer)
          .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;

          inactiveAdapter = await YearnVaultAdapterFactory
          .connect(deployer)
          .deploy(inactivevaultMock.address, formation.address) as YearnVaultAdapter;

          activeAdapter = await YearnVaultAdapterFactory
          .connect(deployer)
          .deploy(activevaultMock.address, formation.address) as YearnVaultAdapter;


            await formation.connect(governance).initialize(inactiveAdapter.address);
            await formation.connect(governance).migrate(activeAdapter.address);
            await token.mint(formation.address, mintAmount);
            await formation.connect(minter).flush();
          });

          it("flushes funds to the active vault", async () => {
            expect(await token.balanceOf(activevaultMock.address)).equal(
              mintAmount
            );
          });
        });
      });
    });

    describe("deposit and withdraw tokens", () => {
      let depositAmt = parseUnits("5000",6);
      let mintAmt = parseEther("1000");
      let ceilingAmt = parseEther("10000");
      let collateralizationLimit = "2000000000000000000"; // this should be set in the deploy sequence
      let repayAmtUSD = mintAmt.div(USDT_CONST);
      beforeEach(async () => {
      controllerMock = await YearnControllerMockFactory
        .connect(deployer)
        .deploy() as YearnControllerMock;
      vaultMock = await YearnVaultMockUsdFactory
        .connect(deployer)
        .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;
        adapter = await YearnVaultAdapterFactory
        .connect(deployer)
        .deploy(vaultMock.address, formation.address) as YearnVaultAdapter;
        await formation.connect(governance).initialize(adapter.address);
        await formation
          .connect(governance)
          .setCollateralizationLimit(collateralizationLimit);
        await nUsd.connect(deployer).setWhitelist(formation.address, true);
        await nUsd.connect(deployer).setCeiling(formation.address, ceilingAmt);
        await token.mint(await minter.getAddress(), parseEther("5000"));
        await token.connect(minter).approve(formation.address, parseEther("100000000"));
        await nUsd.connect(minter).approve(formation.address, parseEther("100000000"));
      });

      it("deposited amount is accounted for correctly", async () => {
        // let address = await deployer.getAddress();
         await formation.connect(minter).deposit(depositAmt);
        expect(
          await formation
            .connect(minter)
            .getCdpTotalDeposited(await minter.getAddress())
        ).equal(depositAmt);
      });

      it("deposits token and then withdraws all", async () => {
        let balBefore = await token.balanceOf(await minter.getAddress());
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(minter).withdraw(depositAmt);
        let balAfter = await token.balanceOf(await minter.getAddress());
        expect(balBefore).equal(balAfter);
      });

      it("reverts when cdp is undercollateralized", async () => {
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        expect(formation.connect(minter).withdraw(depositAmt)).revertedWith("Action blocked: unhealthy collateralization ratio");
      });

      it("deposits, mints, repays, and withdraws", async () => {
        let balBefore = await token.balanceOf(await minter.getAddress());
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        await formation.connect(minter).repay(0, mintAmt);
        await formation.connect(minter).withdraw(depositAmt);
        let balAfter = await token.balanceOf(await minter.getAddress());
        expect(balBefore).equal(balAfter);
       });

      it("deposits, mints, repays with USDT, and withdraws", async () => {
        let balBefore = await token.balanceOf(await minter.getAddress());
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        await formation.connect(minter).repay(repayAmtUSD,0);
        await formation.connect(minter).withdraw(depositAmt);
        let balAfter = await token.balanceOf(await minter.getAddress());
        expect(balBefore).equal(balAfter.add(repayAmtUSD));
      });

      it("deposits 5000 USDT, mints 1000 nUSD, and withdraws 3000 USDT", async () => {
        let withdrawAmt = depositAmt.sub(mintAmt.div(USDT_CONST).mul(2));
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        await formation.connect(minter).withdraw(withdrawAmt);
        expect(await token.balanceOf(await minter.getAddress())).equal(
          parseEther("10000").add(parseEther("5000")).sub(parseUnits("5000",6)).add(parseUnits("3000",6))
        );
      });

      describe("flushActivator", async () => {
        beforeEach(async () => {
          await token.connect(deployer).approve(formation.address, parseEther("1"));
          await token.mint(await deployer.getAddress(), parseEther("1"));
          await token.mint(await minter.getAddress(), parseEther("100000"));
          await formation.connect(deployer).deposit(parseUnits("1",6));
        });

        it("deposit() flushes funds if amount >= flushActivator", async () => {
          let balBeforeWhale = await token.balanceOf(vaultMock.address);
          await formation.connect(minter).deposit(parseUnits("100000",6));
          let balAfterWhale = await token.balanceOf(vaultMock.address);
          expect(balBeforeWhale).equal(0);
          expect(balAfterWhale).equal(parseUnits("100001",6));
        });

        it("deposit() does not flush funds if amount < flushActivator", async () => {
          let balBeforeWhale = await token.balanceOf(vaultMock.address);
          await formation.connect(minter).deposit(parseUnits("99999",6));
          let balAfterWhale = await token.balanceOf(vaultMock.address);
          expect(balBeforeWhale).equal(0);
          expect(balAfterWhale).equal(0);
        });
      })
    });

    describe("repay and liquidate tokens", () => {
      let depositAmt = parseUnits("5000",6);
      let mintAmt = parseEther("1000");
      let ceilingAmt = parseEther("10000");
      let collateralizationLimit = "2000000000000000000"; // this should be set in the deploy sequence
      let repayAmtUSD = mintAmt.div(USDT_CONST);
      beforeEach(async () => {
      controllerMock = await YearnControllerMockFactory
        .connect(deployer)
        .deploy() as YearnControllerMock;
      vaultMock = await YearnVaultMockUsdFactory
        .connect(deployer)
        .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;
        adapter = await YearnVaultAdapterFactory
        .connect(deployer)
        .deploy(vaultMock.address, formation.address) as YearnVaultAdapter;
        await formation.connect(governance).initialize(adapter.address);
        await formation
          .connect(governance)
          .setCollateralizationLimit(collateralizationLimit);
        await nUsd.connect(deployer).setWhitelist(formation.address, true);
        await nUsd.connect(deployer).setCeiling(formation.address, ceilingAmt);
        await token.mint(await minter.getAddress(), ceilingAmt);
        await token.connect(minter).approve(formation.address, ceilingAmt);
        await nUsd.connect(minter).approve(formation.address, parseEther("100000000"));
        await token.connect(minter).approve(transmuterContract.address, ceilingAmt);
        await nUsd.connect(minter).approve(transmuterContract.address, depositAmt.mul(USDT_CONST));
      });
      it("repay with USDT reverts when nothing is minted and transmuter has no nUsd deposits", async () => {
        await formation.connect(minter).deposit(depositAmt.sub(parseUnits("1000",6)))
        expect(formation.connect(minter).repay(repayAmtUSD, 0)).revertedWith("SafeMath: subtraction overflow")
      })
      it("liquidate max amount possible if trying to liquidate too much", async () => {
        let liqAmt = depositAmt;
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        await transmuterContract.connect(minter).stake(mintAmt);
        await formation.connect(minter).liquidate(liqAmt);
        const transBal = await token.balanceOf(transmuterContract.address);
        expect(transBal).equal(mintAmt.div(USDT_CONST));
      })
      it("liquidates funds from vault if not enough in the buffer", async () => {
        let liqAmt = parseUnits("600",6);
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(governance).flush();
        await formation.connect(minter).deposit(mintAmt.div(USDT_CONST).div(2));
        await formation.connect(minter).mint(mintAmt);
        await transmuterContract.connect(minter).stake(mintAmt);
        const formationTokenBalPre = await token.balanceOf(formation.address);
        await formation.connect(minter).liquidate(liqAmt);
        const formationTokenBalPost = await token.balanceOf(formation.address);
        const transmuterEndingTokenBal = await token.balanceOf(transmuterContract.address);
        expect(formationTokenBalPost).equal(0);
        expect(transmuterEndingTokenBal).equal(liqAmt);
      })
      it("liquidates the minimum necessary from the formation buffer", async () => {
        let dep2Amt = parseUnits("500",6);
        let liqAmt = parseUnits("200",6);
        await formation.connect(minter).deposit(parseUnits("2000",6));
        await formation.connect(governance).flush();
        await formation.connect(minter).deposit(dep2Amt);
        await formation.connect(minter).mint(parseEther("1000"));
        await transmuterContract.connect(minter).stake(parseEther("1000"));
        const formationTokenBalPre = await token.balanceOf(formation.address);
        await formation.connect(minter).liquidate(liqAmt);
        const formationTokenBalPost = await token.balanceOf(formation.address);

        const transmuterEndingTokenBal = await token.balanceOf(transmuterContract.address);
        expect(formationTokenBalPost).equal(dep2Amt.sub(liqAmt));
        expect(transmuterEndingTokenBal).equal(liqAmt);
      })
      it("deposits, mints nUsd, repays, and has no outstanding debt", async () => {
        await formation.connect(minter).deposit(depositAmt.sub(parseUnits("1000",6)));
        await formation.connect(minter).mint(mintAmt);
        await transmuterContract.connect(minter).stake(mintAmt);
        await formation.connect(minter).repay(repayAmtUSD, 0);
        expect(await formation.connect(minter).getCdpTotalDebt(await minter.getAddress())).equal(0)
      })
      it("deposits, mints, repays, and has no outstanding debt", async () => {
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        await formation.connect(minter).repay(0, mintAmt);
        expect(
          await formation
            .connect(minter)
            .getCdpTotalDebt(await minter.getAddress())
        ).equal(0);
      });
      it("deposits, mints nUsd, repays with nUsd and USDT, and has no outstanding debt", async () => {
        await formation.connect(minter).deposit(depositAmt.sub(parseUnits("1000",6)));
        await formation.connect(minter).mint(mintAmt);
        await transmuterContract.connect(minter).stake(parseEther("500"));
        await formation.connect(minter).repay(parseUnits("500",6), parseEther("500"));
        expect(await formation.connect(minter).getCdpTotalDebt(await minter.getAddress())).equal(0)
      })

      it("deposits and liquidates USDT", async () => {
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        await transmuterContract.connect(minter).stake(mintAmt);
        await formation.connect(minter).liquidate(mintAmt.div(USDT_CONST));
        expect( await formation.connect(minter).getCdpTotalDeposited(await minter.getAddress())).equal(depositAmt.sub(mintAmt.div(USDT_CONST)))
      });
    });

    describe("mint", () => {
      let depositAmt = parseUnits("5000",6);
      let mintAmt = parseEther("1000");
      let ceilingAmt = parseEther("1000");

      beforeEach(async () => {
      controllerMock = await YearnControllerMockFactory
        .connect(deployer)
        .deploy() as YearnControllerMock;
      vaultMock = await YearnVaultMockUsdFactory
        .connect(deployer)
        .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;
        adapter = await YearnVaultAdapterFactory
        .connect(deployer)
        .deploy(vaultMock.address, formation.address) as YearnVaultAdapter;

        await formation.connect(governance).initialize(adapter.address);

        await nUsd.connect(deployer).setCeiling(formation.address, ceilingAmt);
        await token.mint(await minter.getAddress(), depositAmt.mul(USDT_CONST));
        await token.connect(minter).approve(formation.address, depositAmt.mul(USDT_CONST));
      });

      it("reverts if the Formation is not whitelisted", async () => {
        await formation.connect(minter).deposit(depositAmt);
        expect(formation.connect(minter).mint(mintAmt)).revertedWith(
          "NUSD: Formation is not whitelisted"
        );
      });

      context("is whiltelisted", () => {
        beforeEach(async () => {
          await nUsd.connect(deployer).setWhitelist(formation.address, true);
        });

        it("reverts if the Formation is blacklisted", async () => {

          await nUsd.connect(deployer).setBlacklist(formation.address);
          await formation.connect(minter).deposit(depositAmt);
          expect(formation.connect(minter).mint(mintAmt)).revertedWith(
            "NUSD: Formation is blacklisted"
          );
        });

        it("reverts when trying to mint too much", async () => {
          expect(formation.connect(minter).mint(parseEther("2000"))).revertedWith(
            "Loan-to-value ratio breached"
          );
        });

        it("reverts if the ceiling was breached", async () => {
          let lowCeilingAmt = parseEther("100");
          await nUsd
            .connect(deployer)
            .setCeiling(formation.address, lowCeilingAmt);
          await formation.connect(minter).deposit(depositAmt);
          expect(formation.connect(minter).mint(mintAmt)).revertedWith(
            "NUSD: Formation's ceiling was breached"
          );
        });

        it("mints successfully to depositor", async () => {
          let balBefore = await token.balanceOf(await minter.getAddress());
          await formation.connect(minter).deposit(depositAmt);
          await formation.connect(minter).mint(mintAmt);
          let balAfter = await token.balanceOf(await minter.getAddress());

          expect(balAfter).equal(balBefore.sub(depositAmt));
          expect(await nUsd.balanceOf(await minter.getAddress())).equal(mintAmt);
        });


      });
    });

    describe("harvest", () => {
      let depositAmt = parseUnits("5000",6);
      let mintAmt = parseEther("1000");
      let stakeAmt = mintAmt.div(2);
      let ceilingAmt = parseEther("10000");
      let yieldAmt = parseUnits("100",6);

      beforeEach(async () => {
      controllerMock = await YearnControllerMockFactory
        .connect(deployer)
        .deploy() as YearnControllerMock;
      vaultMock = await YearnVaultMockUsdFactory
        .connect(deployer)
        .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;
        adapter = await YearnVaultAdapterFactory
        .connect(deployer)
        .deploy(vaultMock.address, formation.address) as YearnVaultAdapter;

        await nUsd.connect(deployer).setWhitelist(formation.address, true);
        await formation.connect(governance).initialize(adapter.address);
        await nUsd.connect(deployer).setCeiling(formation.address, ceilingAmt);
        await token.mint(await user.getAddress(), depositAmt.mul(USDT_CONST));
        await token.connect(user).approve(formation.address, depositAmt.mul(USDT_CONST));
        await nUsd.connect(user).approve(transmuterContract.address, depositAmt.mul(USDT_CONST));
        await formation.connect(user).deposit(depositAmt);
        await formation.connect(user).mint(mintAmt);
        await transmuterContract.connect(user).stake(stakeAmt);
        await formation.flush();
      });

      it("harvests yield from the vault", async () => {
        await token.mint(vaultMock.address, yieldAmt);
        await formation.harvest(0);
        let transmuterBal = await token.balanceOf(transmuterContract.address);
        //expect(transmuterBal).equal(yieldAmt.sub(yieldAmt.div(pctReso/harvestFee)));
        expect(transmuterBal.sub(yieldAmt.sub(yieldAmt.div(pctReso/harvestFee)))).to.be.at.most(1);
        let vaultBal = await token.balanceOf(vaultMock.address);
        //expect(vaultBal).equal(depositAmt.mul(USDT_CONST));
        expect(vaultBal.sub(depositAmt.mul(USDT_CONST))).to.be.at.most(1);
      })

      it("sends the harvest fee to the rewards address", async () => {
        await token.mint(vaultMock.address, yieldAmt);
        await formation.harvest(0);
        let rewardsBal = await token.balanceOf(await rewards.getAddress());
        //expect(rewardsBal).equal(yieldAmt.div(pctReso/harvestFee));
        expect(yieldAmt.div(pctReso/harvestFee).sub(rewardsBal)).to.be.at.most(10000000);
      })

      it("does not update any balances if there is nothing to harvest", async () => {
        let initTransBal = await token.balanceOf(transmuterContract.address);
        let initRewardsBal = await token.balanceOf(await rewards.getAddress());
        await formation.harvest(0);
        let endTransBal = await token.balanceOf(transmuterContract.address);
        let endRewardsBal = await token.balanceOf(await rewards.getAddress());
        expect(initTransBal).equal(endTransBal);
        expect(initRewardsBal).equal(endRewardsBal);
      })
    })
  });
});