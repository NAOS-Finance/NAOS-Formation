import chai from "chai";
import chaiSubset from "chai-subset";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import { ContractFactory, Signer, utils } from "ethers";
import { Transmuter } from "../../types/Transmuter";
import { FormationV2 } from "../../types/FormationV2";
import { NToken } from "../../types/NToken";
import { Erc20Mock } from "../../types/Erc20Mock";
import { Erc20MockUsd } from "../../types/Erc20MockUsd";
import { ZERO_ADDRESS, DEFAULT_FLUSH_ACTIVATOR } from "../utils/helpers";
import { YearnVaultAdapter } from "../../types/YearnVaultAdapter";
import { YearnVaultAdapterV2 } from "../../types/YearnVaultAdapterV2";
import { YearnVaultMockUsd } from "../../types/YearnVaultMockUsd";
import { YearnControllerMock } from "../../types/YearnControllerMock";
import { IbBusdMock } from "../../types/IbBusdMock";
import { UniswapV2Mock } from "../../types/UniswapV2Mock";
import { AlpacaStakingPoolMock } from "../../types/AlpacaStakingPoolMock";
import { AlpacaVaultConfigMock } from "../../types/AlpacaVaultConfigMock";
import { AlpacaVaultAdapter } from "../../types/AlpacaVaultAdapter";
import { YearnVaultMock } from "../../types/YearnVaultMock";
import { EllipsisPoolMock } from "../../types/EllipsisPoolMock";
import { I3EsPoolMock } from "../../types/I3EsPoolMock";
import { EllipsisVaultAdapter } from "../../types/EllipsisVaultAdapter";
const {parseEther, formatEther, parseUnits} = utils;

chai.use(solidity);
chai.use(chaiSubset);

const { expect } = chai;

let FormationFactory: ContractFactory;
let NUSDFactory: ContractFactory;
let ERC20MockFactory: ContractFactory;
let TransmuterFactory: ContractFactory;
let YearnVaultAdapterV2Factory: ContractFactory;
let YearnVaultMockUsdFactory: ContractFactory;
let YearnControllerMockFactory: ContractFactory;
let ibBUSDMockFactory: ContractFactory;
let uniswapV2MockFactory: ContractFactory;
let alpacaStakingPoolMock: ContractFactory;
let alpacaVaultConfigMock: ContractFactory;
let alpacaVaultAdapter: ContractFactory;
let ellipsisPoolMockFactory: ContractFactory;
let threeesPoolMockFactory: ContractFactory;
let ellipsisVaultAdapterFactory: ContractFactory;

var USDT_CONST = 1000000000000;

describe("FormationV2", () => {
  let signers: Signer[];

  before(async () => {
    FormationFactory = await ethers.getContractFactory("FormationV2");
    TransmuterFactory = await ethers.getContractFactory("Transmuter");
    NUSDFactory = await ethers.getContractFactory("NToken");
    ERC20MockFactory = await ethers.getContractFactory("ERC20MockUSD");
    YearnVaultAdapterV2Factory = await ethers.getContractFactory("YearnVaultAdapterV2");
    YearnVaultMockUsdFactory = await ethers.getContractFactory("YearnVaultMockUSD");
    YearnControllerMockFactory = await ethers.getContractFactory("YearnControllerMock");
    ibBUSDMockFactory = await ethers.getContractFactory("IbBUSDMock");
    uniswapV2MockFactory = await ethers.getContractFactory("UniswapV2Mock");
    alpacaStakingPoolMock = await ethers.getContractFactory("AlpacaStakingPoolMock");
    alpacaVaultConfigMock = await ethers.getContractFactory("AlpacaVaultConfigMock");
    alpacaVaultAdapter = await ethers.getContractFactory("AlpacaVaultAdapter");
    ellipsisPoolMockFactory = await ethers.getContractFactory("EllipsisPoolMock");
    threeesPoolMockFactory = await ethers.getContractFactory("I3ESPoolMock");
    ellipsisVaultAdapterFactory = await ethers.getContractFactory("EllipsisVaultAdapter");
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
    let formation: FormationV2;

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
    let formation: FormationV2;


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
      )) as FormationV2;

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
    let formation: FormationV2;
    let adapter: YearnVaultAdapterV2;
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
      )) as FormationV2;

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
        adapter = await YearnVaultAdapterV2Factory
        .connect(deployer)
        .deploy(vaultMock.address, formation.address) as YearnVaultAdapterV2;

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
              "Adapter already in use"
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
            newAdapter = await YearnVaultAdapterV2Factory
            .connect(deployer)
            .deploy(vaultMock.address, formation.address) as YearnVaultAdapterV2;
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
        let mintAmt = parseEther("2500");
        let recallAmt = parseUnits("500",6);

        beforeEach(async () => {
          controllerMock = await YearnControllerMockFactory
            .connect(deployer)
            .deploy() as YearnControllerMock;
          vaultMock = await YearnVaultMockUsdFactory
            .connect(deployer)
            .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;
          adapter = await YearnVaultAdapterV2Factory
            .connect(deployer)
            .deploy(vaultMock.address, formation.address) as YearnVaultAdapterV2;
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
        let mintAmt = parseEther("2500");
        let recallAmt = parseUnits("500",6);

        beforeEach(async () => {
          controllerMock = await YearnControllerMockFactory
          .connect(deployer)
          .deploy() as YearnControllerMock;
          vaultMock = await YearnVaultMockUsdFactory
          .connect(deployer)
          .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;

          inactiveAdapter = await YearnVaultAdapterV2Factory
          .connect(deployer)
          .deploy(vaultMock.address, formation.address) as YearnVaultAdapterV2;

          activeAdapter = await YearnVaultAdapterV2Factory
          .connect(deployer)
          .deploy(vaultMock.address, formation.address) as YearnVaultAdapterV2;

          await formation.connect(governance).initialize(inactiveAdapter.address);
          await token.mint(await minter.getAddress(), depositAmt);
          await token.mint(await deployer.getAddress(), parseEther("10000"));
          await token.connect(minter).approve(formation.address, depositAmt);
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
            adapter = await YearnVaultAdapterV2Factory
            .connect(deployer)
            .deploy(vaultMock.address, formation.address) as YearnVaultAdapterV2;
           

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

          inactiveAdapter = await YearnVaultAdapterV2Factory
          .connect(deployer)
          .deploy(inactivevaultMock.address, formation.address) as YearnVaultAdapterV2;

          activeAdapter = await YearnVaultAdapterV2Factory
          .connect(deployer)
          .deploy(activevaultMock.address, formation.address) as YearnVaultAdapterV2;


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
      let mintAmt = parseEther("2500");
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
        adapter = await YearnVaultAdapterV2Factory
        .connect(deployer)
        .deploy(vaultMock.address, formation.address) as YearnVaultAdapterV2;
        await formation.connect(governance).initialize(adapter.address);
        await formation
          .connect(governance)
          .setCollateralizationLimit(collateralizationLimit);
        await nUsd.connect(deployer).setWhitelist(formation.address, true);
        await nUsd.connect(deployer).setCeiling(formation.address, ceilingAmt);
        await token.mint(await minter.getAddress(), parseUnits("5000", 6));
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

      it("revert with withdraw too much tokens after repay with nUSD", async () => {
        let balBefore = await token.balanceOf(await minter.getAddress());
        await formation.connect(minter).deposit(depositAmt);
        await token.mint(await deployer.getAddress(), depositAmt);
        await token.connect(deployer).approve(formation.address, parseEther("100000000"));
        await formation.connect(deployer).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        await formation.connect(minter).repay(0, mintAmt);
        expect(formation.connect(minter).withdraw(depositAmt.add(parseUnits("1",1)))).revertedWith("Exceeds withdrawable amount");
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

      it("revert with repay too much USDT", async () => {
        let balBefore = await token.balanceOf(await minter.getAddress());
        await formation.connect(minter).deposit(depositAmt);
        await token.mint(await deployer.getAddress(), depositAmt);
        await token.connect(deployer).approve(formation.address, parseEther("100000000"));
        await formation.connect(deployer).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        expect(formation.connect(minter).repay(repayAmtUSD.add(parseUnits("1",1)), 0)).revertedWith("");
      });

      it("revert with withdraw too much tokens after repay with USDT", async () => {
        let balBefore = await token.balanceOf(await minter.getAddress());
        await formation.connect(minter).deposit(depositAmt);
        await token.mint(await deployer.getAddress(), depositAmt);
        await token.connect(deployer).approve(formation.address, parseEther("100000000"));
        await formation.connect(deployer).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        await formation.connect(minter).repay(repayAmtUSD, 0);
        expect(formation.connect(minter).withdraw(depositAmt.add(parseUnits("1",1)))).revertedWith("Exceeds withdrawable amount");
      });

      it("deposits 5000 USDT, mints 1000 nUSD, and withdraws 3000 USDT", async () => {
        mintAmt = parseEther("1000");
        let withdrawAmt = depositAmt.sub(mintAmt.div(USDT_CONST).mul(2));
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        await formation.connect(minter).withdraw(withdrawAmt);
        expect(await token.balanceOf(await minter.getAddress())).equal(
          parseEther("10000").add(parseUnits("3000",6))
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
      let mintAmt = parseEther("2500");
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
        adapter = await YearnVaultAdapterV2Factory
        .connect(deployer)
        .deploy(vaultMock.address, formation.address) as YearnVaultAdapterV2;
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
        let liqAmt = depositAmt.mul(USDT_CONST);
        await formation.connect(minter).deposit(depositAmt);
        await formation.connect(minter).mint(mintAmt);
        await transmuterContract.connect(minter).stake(mintAmt);
        await formation.connect(minter).liquidate(liqAmt);
        const transBal = await token.balanceOf(transmuterContract.address);
        expect(transBal).equal(mintAmt.div(USDT_CONST));
      })
      it("liquidates funds from vault if not enough in the buffer", async () => {
        let liqAmt = parseUnits("600",18);
        mintAmt = parseEther("1000");
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
        expect(transmuterEndingTokenBal).equal(liqAmt.div(USDT_CONST));
      })
      it("liquidates the minimum necessary from the formation buffer", async () => {
        let dep2Amt = parseUnits("500",6);
        let liqAmt = parseUnits("200",18);
        await formation.connect(minter).deposit(parseUnits("2000",6));
        await formation.connect(governance).flush();
        await formation.connect(minter).deposit(dep2Amt);
        await formation.connect(minter).mint(parseEther("1000"));
        await transmuterContract.connect(minter).stake(parseEther("1000"));
        const formationTokenBalPre = await token.balanceOf(formation.address);
        await formation.connect(minter).liquidate(liqAmt);
        const formationTokenBalPost = await token.balanceOf(formation.address);

        const transmuterEndingTokenBal = await token.balanceOf(transmuterContract.address);
        expect(formationTokenBalPost).equal(dep2Amt.sub(liqAmt.div(USDT_CONST)));
        expect(transmuterEndingTokenBal).equal(liqAmt.div(USDT_CONST));
      })
      it("deposits, mints nUsd, repays, and has no outstanding debt", async () => {
        mintAmt = parseEther("1000");
        repayAmtUSD = mintAmt.div(USDT_CONST)
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
        mintAmt = parseEther("1000");
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
        await formation.connect(minter).liquidate(mintAmt);
        expect( await formation.connect(minter).getCdpTotalDeposited(await minter.getAddress())).equal(depositAmt.sub(mintAmt.div(USDT_CONST)))
      });
    });

    describe("mint", () => {
      let depositAmt = parseUnits("5000",6);
      let mintAmt = parseEther("2500");
      let ceilingAmt = parseEther("1000");

      beforeEach(async () => {
      controllerMock = await YearnControllerMockFactory
        .connect(deployer)
        .deploy() as YearnControllerMock;
      vaultMock = await YearnVaultMockUsdFactory
        .connect(deployer)
        .deploy(token.address, controllerMock.address) as YearnVaultMockUsd;
        adapter = await YearnVaultAdapterV2Factory
        .connect(deployer)
        .deploy(vaultMock.address, formation.address) as YearnVaultAdapterV2;

        await formation.connect(governance).initialize(adapter.address);

        await nUsd.connect(deployer).setCeiling(formation.address, ceilingAmt);
        await token.mint(await minter.getAddress(), depositAmt);
        await token.connect(minter).approve(formation.address, depositAmt);
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
          await formation.connect(minter).deposit(depositAmt);
          await nUsd.connect(deployer).setCeiling(formation.address, parseEther("5000"));
          expect(formation.connect(minter).mint(parseEther("2500").add(parseUnits("1",1)))).revertedWith(
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
          await nUsd.connect(deployer).setCeiling(formation.address, mintAmt);
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
      let mintAmt = parseEther("2500");
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
      adapter = await YearnVaultAdapterV2Factory
        .connect(deployer)
        .deploy(vaultMock.address, formation.address) as YearnVaultAdapterV2;

        await nUsd.connect(deployer).setWhitelist(formation.address, true);
        await formation.connect(governance).initialize(adapter.address);
        await nUsd.connect(deployer).setCeiling(formation.address, ceilingAmt);
        await token.mint(await user.getAddress(), depositAmt);
        await token.connect(user).approve(formation.address, depositAmt);
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
        expect(vaultBal.sub(depositAmt)).to.be.at.most(100000000);
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

  describe("Alpaca vault", async () => {
    let deployer: Signer;
    let governance: Signer;
    let sentinel: Signer;
    let transmuter: Signer;
    let rewards: Signer;
    let harvestFee = 1000;
    let user: Signer;
    let nUsd: NToken;
    let bUsd: Erc20Mock;
    let alpaca: Erc20Mock;
    let wBnb: Erc20Mock;
    let ibBusd: IbBusdMock;
    let uniswapV2: UniswapV2Mock;
    let alpacaStaking: AlpacaStakingPoolMock;
    let alpacaVaultConfig: AlpacaVaultConfigMock;
    let adapter: AlpacaVaultAdapter;
    let formation: FormationV2;
    
    beforeEach(async () => {
      [deployer, governance, sentinel, transmuter, rewards, ...signers] = signers;
      user = signers[1];
      nUsd = (await NUSDFactory.connect(deployer).deploy()) as NToken;
      bUsd = (await ERC20MockFactory.connect(deployer).deploy(
        "BUSD",
        "BUSD",
        18
      )) as Erc20Mock;
      alpaca = (await ERC20MockFactory.connect(deployer).deploy(
        "Alpaca",
        "Alpaca",
        18
      )) as Erc20Mock;
      wBnb = (await ERC20MockFactory.connect(deployer).deploy(
        "WBNB",
        "WBNB",
        18
      )) as Erc20Mock;
      ibBusd = (await ibBUSDMockFactory.connect(deployer).deploy(
        bUsd.address
      )) as IbBusdMock;
      uniswapV2 = (await uniswapV2MockFactory.connect(deployer).deploy()) as UniswapV2Mock;
      alpacaStaking = (await alpacaStakingPoolMock.connect(deployer).deploy(
        ibBusd.address,
        alpaca.address,
        parseEther("1")
      )) as AlpacaStakingPoolMock;
      alpacaVaultConfig = (await alpacaVaultConfigMock.connect(deployer).deploy()) as AlpacaVaultConfigMock;
      adapter = (await alpacaVaultAdapter.connect(deployer).deploy(
        ibBusd.address,
        await governance.getAddress(),
        await governance.getAddress(),
        uniswapV2.address,
        alpacaStaking.address,
        alpaca.address,
        wBnb.address,
        alpacaVaultConfig.address,
        0
      )) as AlpacaVaultAdapter;
    });

    context("test deposit/withdraw of ibBusd", async () => {
      it("deposit/withdraw", async () => {
        const userAddr = await user.getAddress();
        const amount = ethers.utils.parseEther("100");
        await bUsd.mint(userAddr, amount);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(amount);
        await bUsd.connect(user).approve(ibBusd.address, amount);
        await ibBusd.connect(user).deposit(amount);
        expect(await ibBusd.balanceOf(userAddr)).to.be.eq(amount);
        expect(await ibBusd.totalSupply()).to.be.eq(amount);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(0);
        expect(await bUsd.balanceOf(ibBusd.address)).to.be.eq(amount);

        await ibBusd.connect(user).withdraw(amount);
        expect(await ibBusd.balanceOf(userAddr)).to.be.eq(0);
        expect(await ibBusd.totalSupply()).to.be.eq(0);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(amount);
      })
    });

    context("test swapExactTokensForTokens of uniswapV2", async () => {
      it("swapExactTokensForTokens 1:1", async () => {
        const userAddr = await user.getAddress();
        const amount = ethers.utils.parseEther("100");
        await bUsd.mint(userAddr, amount);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(amount);

        await wBnb.mint(uniswapV2.address, amount);
        expect(await wBnb.balanceOf(uniswapV2.address)).to.be.eq(amount);

        await bUsd.connect(user).approve(uniswapV2.address, amount);
        await uniswapV2.connect(user).swapExactTokensForTokens(amount, amount, [
          bUsd.address,
          wBnb.address
        ], userAddr,Math.floor((new Date()).getTime() / 1000) + 1000)

        expect(await wBnb.balanceOf(userAddr)).to.be.eq(amount);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(0);
        expect(await wBnb.balanceOf(uniswapV2.address)).to.be.eq(0);
        expect(await bUsd.balanceOf(uniswapV2.address)).to.be.eq(amount);
      })
    });

    context("test deposit/withdraw/harvest of alpacaStakingPool", async () => {
      it("deposit/withdraw/harvest", async () => {
        const userAddr = await user.getAddress();
        const amount = ethers.utils.parseEther("100");
        await bUsd.mint(userAddr, amount);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(amount);
        await bUsd.connect(user).approve(ibBusd.address, amount);
        await ibBusd.connect(user).deposit(amount);
        expect(await ibBusd.balanceOf(userAddr)).to.be.eq(amount);
        expect(await ibBusd.totalSupply()).to.be.eq(amount);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(0);
        expect(await bUsd.balanceOf(ibBusd.address)).to.be.eq(amount);

        await ibBusd.connect(user).approve(alpacaStaking.address, amount);
        await alpacaStaking.connect(user).deposit(userAddr, 0, amount);
        expect(await ibBusd.balanceOf(userAddr)).to.be.eq(0);
        expect(await alpacaStaking.totalDeposited()).to.be.eq(amount);

        await adapter.connect(governance).setMinimumSwapOutAmount(amount);
        expect(await adapter.minimumSwapOutAmount()).to.be.eq(amount);

        await alpacaStaking.connect(user).harvest(0);
        expect(await alpaca.balanceOf(userAddr)).to.be.gt(0);

        await alpacaStaking.connect(user).withdraw(userAddr, 0, amount);
        expect(await ibBusd.balanceOf(userAddr)).to.be.eq(amount);
        expect(await alpacaStaking.totalDeposited()).to.be.eq(0);
      });
    });

    context("from the active vault", () => {
      it("should work", async () => {
        formation = await FormationFactory
          .connect(deployer)
          .deploy(
            bUsd.address,
            nUsd.address,
            await governance.getAddress(),
            await sentinel.getAddress(),
            DEFAULT_FLUSH_ACTIVATOR
          ) as FormationV2;
        await formation
          .connect(governance)
          .setTransmuter(await transmuter.getAddress());
        await formation
          .connect(governance)
          .setRewards(await rewards.getAddress());
        await formation.connect(governance).setHarvestFee(harvestFee);
        const userAddr = await user.getAddress();
        const amount = ethers.utils.parseEther("100");
        await bUsd.mint(userAddr, amount);
        await bUsd.connect(user).approve(formation.address, amount);
        await formation.connect(governance).initialize(adapter.address);
        await formation.connect(user).deposit(amount);
        await formation.flush();
      });
    });
  });

  describe("Ellipsis vault", async () => {
    let deployer: Signer;
    let governance: Signer;
    let sentinel: Signer;
    let transmuter: Signer;
    let rewards: Signer;
    let harvestFee = 1000;
    let user: Signer;
    let nUsd: NToken;
    let bUsd: Erc20Mock;
    let ellipsis: Erc20Mock;
    let wBnb: Erc20Mock;
    let threees: Erc20Mock;
    let threeesPool: I3EsPoolMock;
    let ellipsisStaking: EllipsisPoolMock;
    let uniswapV2: UniswapV2Mock;
    let adapter: EllipsisVaultAdapter;
    let formation: FormationV2;
    
    beforeEach(async () => {
      [deployer, governance, sentinel, transmuter, rewards, ...signers] = signers;
      user = signers[1];
      nUsd = (await NUSDFactory.connect(deployer).deploy()) as NToken;
      bUsd = (await ERC20MockFactory.connect(deployer).deploy(
        "BUSD",
        "BUSD",
        18
      )) as Erc20Mock;
      ellipsis = (await ERC20MockFactory.connect(deployer).deploy(
        "Ellipsis",
        "Ellipsis",
        18
      )) as Erc20Mock;
      threees = (await ERC20MockFactory.connect(deployer).deploy(
        "3ES",
        "3ES",
        18
      )) as Erc20Mock;
      wBnb = (await ERC20MockFactory.connect(deployer).deploy(
        "WBNB",
        "WBNB",
        18
      )) as Erc20Mock;
      threeesPool = (await threeesPoolMockFactory.connect(deployer).deploy(
        threees.address,
        [0, 1, 2],
        [bUsd.address, bUsd.address, bUsd.address]
      )) as I3EsPoolMock;
      uniswapV2 = (await uniswapV2MockFactory.connect(deployer).deploy()) as UniswapV2Mock;
      ellipsisStaking = (await ellipsisPoolMockFactory.connect(deployer).deploy(
        threees.address,
        ellipsis.address,
        parseEther("1")
      )) as EllipsisPoolMock;
      adapter = (await ellipsisVaultAdapterFactory.connect(deployer).deploy(
        threeesPool.address,
        await governance.getAddress(),
        uniswapV2.address,
        ellipsisStaking.address,
        threees.address,
        ellipsis.address,
        wBnb.address,
        1,
        0
      )) as EllipsisVaultAdapter;
    });

    context("test add_liquidity/remove_liquidity of 3es", async () => {
      it("add_liquidity/remove_liquidity", async () => {
        const userAddr = await user.getAddress();
        const amount = ethers.utils.parseEther("100");
        await bUsd.mint(userAddr, amount);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(amount);
        await bUsd.connect(user).approve(threeesPool.address, amount);
        await threeesPool.connect(user).add_liquidity([amount, 0, 0], amount);
        expect(await threees.balanceOf(userAddr)).to.be.eq(amount);
        expect(await threees.totalSupply()).to.be.eq(amount);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(0);
        expect(await bUsd.balanceOf(threeesPool.address)).to.be.eq(amount);

        await threeesPool.connect(user).remove_liquidity_one_coin(amount, 0, amount);
        expect(await threees.balanceOf(userAddr)).to.be.eq(0);
        expect(await threees.totalSupply()).to.be.eq(0);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(amount);
      })
    });

    context("test deposit/withdraw/harvest of ellipsisStakingPool", async () => {
      it("deposit/withdraw/harvest", async () => {
        const userAddr = await user.getAddress();
        const amount = ethers.utils.parseEther("100");
        await bUsd.mint(userAddr, amount);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(amount);
        await bUsd.connect(user).approve(threeesPool.address, amount);
        await threeesPool.connect(user).add_liquidity([amount, 0, 0], amount);
        expect(await threees.balanceOf(userAddr)).to.be.eq(amount);
        expect(await threees.totalSupply()).to.be.eq(amount);
        expect(await bUsd.balanceOf(userAddr)).to.be.eq(0);
        expect(await bUsd.balanceOf(threeesPool.address)).to.be.eq(amount);

        await threees.connect(user).approve(ellipsisStaking.address, amount);
        await ellipsisStaking.connect(user).deposit(0, amount);
        expect(await threees.balanceOf(userAddr)).to.be.eq(0);
        expect(await ellipsisStaking.totalDeposited()).to.be.eq(amount);

        await ellipsisStaking.connect(user).claim(0);
        expect(await ellipsis.balanceOf(userAddr)).to.be.gt(0);

        await ellipsisStaking.connect(user).withdraw(0, amount);
        expect(await threees.balanceOf(userAddr)).to.be.eq(amount);
        expect(await ellipsisStaking.totalDeposited()).to.be.eq(0);
      });
    });

    context("from the active vault", () => {
      it("should work", async () => {
        formation = await FormationFactory
          .connect(deployer)
          .deploy(
            bUsd.address,
            nUsd.address,
            await governance.getAddress(),
            await sentinel.getAddress(),
            DEFAULT_FLUSH_ACTIVATOR
          ) as FormationV2;
        await formation
          .connect(governance)
          .setTransmuter(await transmuter.getAddress());
        await formation
          .connect(governance)
          .setRewards(await rewards.getAddress());
        await formation.connect(governance).setHarvestFee(harvestFee);
        const userAddr = await user.getAddress();
        const amount = ethers.utils.parseEther("100");
        await bUsd.mint(userAddr, amount);
        await bUsd.connect(user).approve(formation.address, amount);
        await formation.connect(governance).initialize(adapter.address);
        await formation.connect(user).deposit(amount);
        await formation.flush();
      });
    });
  });
});
