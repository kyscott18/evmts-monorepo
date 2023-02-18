import { Block } from "@ethereumjs/block";
import { Chain, Common, Hardfork } from "@ethereumjs/common";
import type {
	AccessListEIP2930TxData,
	FeeMarketEIP1559TxData,
	TxData,
} from "@ethereumjs/tx";
import { Transaction } from "@ethereumjs/tx";
import { Account, Address } from "@ethereumjs/util";
import { VM } from "@ethereumjs/vm";
import type { JsonFragment } from "@ethersproject/abi";
import { defaultAbiCoder as AbiCoder, Interface } from "@ethersproject/abi";

export const keyPair = {
	secretKey:
		"0x3cd7232cd6f3fc66a57a6bedc1a8ed6c228fff0a327e169c2bcc5e869ed49511",
	publicKey:
		"0x0406cc661590d48ee972944b35ad13ff03c7876eae3fd191e8a2f77311b0a3c6613407b5005e63d7d8d76b89d5f900cde691497688bb281e07a5052ff61edebdc0",
};

const common = new Common({
	chain: Chain.Rinkeby,
	hardfork: Hardfork.Istanbul,
});
const block = Block.fromBlockData(
	{ header: { extraData: Buffer.alloc(97) } },
	{ common },
);

export const insertAccount = async (vm: VM, address: Address) => {
	const acctData = {
		nonce: 0,
		balance: BigInt(10) ** BigInt(18), // 1 eth
	};
	const account = Account.fromAccountData(acctData);

	await vm.stateManager.putAccount(address, account);
};

export const getAccountNonce = async (vm: VM, accountPrivateKey: Buffer) => {
	const address = Address.fromPrivateKey(accountPrivateKey);
	const account = await vm.stateManager.getAccount(address);
	return account.nonce;
};

type TransactionsData =
	| TxData
	| AccessListEIP2930TxData
	| FeeMarketEIP1559TxData;

export const encodeFunction = (
	method: string,
	params?: {
		types: any[];
		values: unknown[];
	},
): string => {
	const parameters = params?.types ?? [];
	const methodWithParameters = `function ${method}(${parameters.join(",")})`;
	const signatureHash = new Interface([methodWithParameters]).getSighash(
		method,
	);
	const encodedArgs = AbiCoder.encode(parameters, params?.values ?? []);

	return signatureHash + encodedArgs.slice(2);
};

export const encodeDeployment = (
	bytecode: string,
	params?: {
		types: any[];
		values: unknown[];
	},
) => {
	const deploymentData = `0x${bytecode}`;
	if (params) {
		const argumentsEncoded = AbiCoder.encode(params.types, params.values);
		return deploymentData + argumentsEncoded.slice(2);
	}
	return deploymentData;
};

export const buildTransaction = (
	data: Partial<TransactionsData>,
): TransactionsData => {
	const defaultData: Partial<TransactionsData> = {
		nonce: BigInt(0),
		gasLimit: 2_000_000, // We assume that 2M is enough,
		gasPrice: 1,
		value: 0,
		data: "0x",
	};

	return {
		...defaultData,
		...data,
	};
};

export const evmts = (strings: TemplateStringsArray, ...literals: string[]) => {
	console.log({ literals });
	return strings.join("");
};

async function deployContract(
	vm: VM,
	senderPrivateKey: Buffer,
	deploymentBytecode: Buffer,
): Promise<Address> {
	// Contracts are deployed by sending their deployment bytecode to the address 0
	// The contract params should be abi-encoded and appended to the deployment bytecode.
	const data = encodeDeployment(deploymentBytecode.toString("hex"));
	const txData = {
		data,
		nonce: await getAccountNonce(vm, senderPrivateKey),
	};

	const tx = Transaction.fromTxData(buildTransaction(txData), { common }).sign(
		senderPrivateKey,
	);

	const deploymentResult = await vm.runTx({ tx, block });

	if (deploymentResult.execResult.exceptionError) {
		throw deploymentResult.execResult.exceptionError;
	}

	return deploymentResult.createdAddress!;
}

type TODOInfer = any;

export const run = async (
	script: {
		abi: JsonFragment[];
		bytecode: { object: string };
	},
	args: TODOInfer,
) => {
	console.log("parsing the abi and byptecode", script, args);
	const { abi, bytecode } = script;
	/**
	 * VM.create is an async factory function
	 *
	 */
	const vm = await VM.create({
		/**
		 * Use a {@link Common} instance
		 * if you want to change the chain setup.
		 *
		 * ### Possible Values
		 *
		 * - `chain`: all chains supported by `Common` or a custom chain
		 * - `hardfork`: `mainnet` hardforks up to the `Merge` hardfork
		 * - `eips`: `2537` (usage e.g. `eips: [ 2537, ]`)
		 *
		 * Note: check the associated `@ethereumjs/evm` instance options
		 * documentation for supported EIPs.
		 *
		 * ### Default Setup
		 *
		 * Default setup if no `Common` instance is provided:
		 *
		 * - `chain`: `mainnet`
		 * - `hardfork`: `merge`
		 * - `eips`: `[]`
		 */
		// common?: Common
		/**
		 * A {@link StateManager} instance to use as the state store
		 */
		// stateManager?: StateManager
		/**
		 * A {@link Blockchain} object for storing/retrieving blocks
		 */
		// blockchain?: BlockchainInterface
		/**
		 * If true, create entries in the state tree for the precompiled contracts, saving some gas the
		 * first time each of them is called.
		 *
		 * If this parameter is false, each call to each of them has to pay an extra 25000 gas
		 * for creating the account. If the account is still empty after this call, it will be deleted,
		 * such that this extra cost has to be paid again.
		 *
		 * Setting this to true has the effect of precompiled contracts' gas costs matching mainnet's from
		 * the very first call, which is intended for testing networks.
		 *
		 * Default: `false`
		 */
		// activatePrecompiles?: boolean
		/**
		 * If true, the state of the VM will add the genesis state given by {@link Blockchain.genesisState} to a newly
		 * created state manager instance. Note that if stateManager option is also passed as argument
		 * this flag won't have any effect.
		 *
		 * Default: `false`
		 */
		// activateGenesisState?: boolean
		/**
		 * Select hardfork based upon block number. This automatically switches to the right hard fork based upon the block number.
		 *
		 * Default: `false`
		 */
		// hardforkByBlockNumber?: boolean
		/**
		 * Select the HF by total difficulty (Merge HF)
		 *
		 * This option is a superset of `hardforkByBlockNumber` (so only use one of both options)
		 * and determines the HF by both the block number and the TD.
		 *
		 * Since the TD is only a threshold the block number will in doubt take precedence (imagine
		 * e.g. both Merge and Shanghai HF blocks set and the block number from the block provided
		 * pointing to a Shanghai block: this will lead to set the HF as Shanghai and not the Merge).
		 */
		// hardforkByTTD?: BigIntLike
		/**
		 * Use a custom EEI for the EVM. If this is not present, use the default EEI.
		 */
		// eei?: EEIInterface
		/**
		 * Use a custom EVM to run Messages on. If this is not present, use the default EVM.
		 */
		// evm?: EVMInterface
	});

	console.log("creating a new account");
	const accountPk = Buffer.from(
		"e331b6d69882b4cb4ea581d88e0b604039a3de5967688d3dcffdd2270c0fd109",
		"hex",
	);
	const accountAddress = Address.fromPrivateKey(accountPk);
	console.log("Account: ", accountAddress.toString());

	console.log("sending account eth...", accountAddress.toString());
	await insertAccount(vm, accountAddress);

	console.log("deploying contract");
	const contractAddress = await deployContract(
		vm,
		accountPk,
		Buffer.from(bytecode.object),
	);

	console.log("Contract address:", contractAddress.toString());

	console.log("Creating sig hash");
	const sigHash = new Interface(abi).getSighash("run");

	const result = await vm.evm.runCall({
		to: contractAddress,
		caller: accountAddress,
		origin: accountAddress,
		data: Buffer.from(sigHash.slice(2), "hex"),
		block,
	});

	// turn it into op codes
	// run it in the evm
	// return the result
	return result.execResult.returnValue.toString();
};
