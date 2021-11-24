// Import the API
import { ApiPromise, WsProvider, Keyring } from '@polkadot/api';
import { CodePromise, ContractPromise } from '@polkadot/api-contract';
import {readFileSync} from "fs";
import axios from "axios";
const ws_endpoint = "ws://127.0.0.1:9944";
const upload_endpoint = "http://127.0.0.1:8080/query";
const polkasign_abi = "./abi/polkasign.contract";
const polkasign_address = "5Eawr9kcGRks9kN36RGTQhpepLFCjenmsnCsvs27q8f55v3H";

console.log("contract ws: ", ws_endpoint);
const provider = new WsProvider(ws_endpoint);
// Create our API with a default connection to the local node
const api = await ApiPromise.create({
    provider: provider,
    types: {
        "Address": "MultiAddress",
        "LookupSource": "MultiAddress"
    }
});
const polkasignAbi = JSON.parse(readFileSync(polkasign_abi).toString());
const polkasignContract = new ContractPromise(api, polkasignAbi, polkasign_address);
const keyring = new Keyring();
const pair = keyring.addFromUri("model action demand click genius pizza pumpkin develop muffin acquire supreme expand",
    { name: 'know pair' }, 'sr25519');
console.log(keyring.pairs.length, 'pairs available');
console.log(pair.meta.name, 'has address', pair.address);

async function parseNewBlock(header) {
    let blockHash = await api.rpc.chain.getBlockHash(header.number);
    console.log(`Chain is at block hash: ${blockHash}`);
    let block = await api.rpc.chain.getBlock(blockHash);
    const allRecords = await api.query.system.events.at(blockHash);
    // the information for each of the contained extrinsics
    block.block.extrinsics.forEach((ex, index) => {
        // the extrinsics are decoded by the API, human-like view
        console.log("\tex index: ", index, "ex hash: ", ex.hash.toHex());

        const { isSigned, meta, method: { args, method, section } } = ex;
        // explicit display of name, args & documentation
        console.log(`\t${section}.${method}(${args.map((a) => a.toString()).join(', ')})`);

        // signer/nonce info
        if (isSigned) {
            console.log(`\tsigner=${ex.signer.toString()}, nonce=${ex.nonce.toString()}`);
        }

        // filter the specific events based on the phase and then the
        // index of our extrinsic in the block
        console.log(`\twith event: ${section}.${method}`);
        const events = allRecords
            .filter(({ phase }) =>
                phase.isApplyExtrinsic &&
                phase.asApplyExtrinsic.eq(index)
            )
            .map(({ event }) => event);
        if (events.length <= 0) {
            return;
        }
        events.forEach((event) => {
            console.log(`\thandle event: ${event.section}.${event.method}`);
            if("contracts" != event.section || "ContractEmitted" != event.method) {
                return
            }
            // Loop through each of the parameters, displaying the type and data
            // event.data.forEach((data, index) => {
            //     console.log(`\t\t\t${types[index].type}: ${data.toString()}`);
            // });
            let contractAddr = event.data[0].toString();
            console.log(`contract event from`, contractAddr)
            if (polkasign_address != contractAddr) {
                console.log(`skip no listen addr`)
                return;
            }
            let paredEvent = polkasignContract.abi.decodeEvent(event.data[1]);
            console.log("event args: ", paredEvent.args.toString())
            let agreementIndex = paredEvent.args[0].toString();
            if("UpdateAgreementEvent" == paredEvent.event.identifier
                || "CreateAgreementEvent" == paredEvent.event.identifier) {
                console.log("event: " + paredEvent.event.identifier + ", , index:", agreementIndex)
                queryAgreementInfo(agreementIndex, ex.hash.toHex());
            } else {
                console.log("event: not found, skip", agreementIndex)
            }
        });
    });
}

async function main () {
    // We only display a couple, then unsubscribe
    let count = 0;

    // Subscribe to the new headers on-chain. The callback is fired when new headers
    // are found, the call itself returns a promise with a subscription that can be
    // used to unsubscribe from the newHead subscription
    api.rpc.chain.subscribeNewHeads((header) => {
        console.log(`Chain is at block: #${header.number}`);
        parseNewBlock(header);
    });
}

async function queryAgreementInfo(agreementIndex, txHash) {
    {
        console.log("========= begin to query queryAgreementById");
        const {gasConsumed, result, output} = await polkasignContract.query.queryAgreementById(pair.address,
            {value: 0, gasLimit: -1},
            agreementIndex
        )
        console.log("gasConsumed", gasConsumed.toHuman());
        if (result.isOk) {
            // console.log('queryAgreementById Success', output.toHuman());
            uploadAgreementInfo(output.toHuman(), txHash)
        } else {
            console.error('queryAgreementById Error', result.toHuman());
        }
    }
}

function uploadAgreementInfo(info, txHash) {
    let signers = `,` + info.signers.join(",") + `,`
    let body = {
        query: 'mutation {' +
            'createAgreementInfo(input: {' +
            'index: '+ info.index +',' +
        'txId: "'+ txHash +'",' +
        'creator: "'+ info.creator +'",' +
        'name: "'+ info.name +'",' +
        'create_at: "'+ info.createAt +'",' +
        'status: '+ info.status +',' +
        'signers: "'+ signers +'",' +
        'agreement_file: "'+ JSON.stringify(info.agreementFile).replace(/"/g, '\\"') +'",' +
        'sign_infos: "'+ JSON.stringify(info.signInfos).replace(/"/g, '\\"') +'",' +
        'resources: "'+ JSON.stringify(info.resources).replace(/"/g, '\\"') +'"' +
        '}){' +
            'index' +
            '}' +
            '}'
    };
    console.log("construct body: ", body)
    axios.post(upload_endpoint, body)
        .then(function (response) {
            console.log(response.data.data);
        })
        .catch(function (error) {
            console.error("need retry", error);
        });
}

main().catch((error) => {
    console.error(error);
    process.exit(-1);
});