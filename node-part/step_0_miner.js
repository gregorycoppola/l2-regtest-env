import { readFileSync } from 'fs';

import {
  AnchorMode,
  makeContractDeploy,
  broadcastTransaction,
} from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

import { default as axios } from 'axios';
function sleep(reason, ms) {
  return new Promise((resolve) => {
      setTimeout(resolve, ms);
  });
}

const L1_URL = "http://stacks-node:20443"
const PK_MINER = '6e14c883fb38097e0eecdcad9d498c1086d5c038a138f56ad512811512b604df01'

async function publishContract(senderKey, contractName, contractFilename, networkUrl, nonce) {
  const codeBody = readFileSync(contractFilename, { encoding: 'utf-8' });
  const transaction = await makeContractDeploy({
    codeBody, contractName, senderKey, network: new StacksTestnet({url: networkUrl}),
    anchorMode: AnchorMode.Any, fee: 50000, nonce
  });
  const network = new StacksTestnet({url: networkUrl});
  const txid = await broadcastTransaction(
    transaction, network
  )
  return '0x' + txid.txid
}

/// Wait for the stacks height to be positive.
async function waitForStacksHeight(network_url, stacks_height) {
  console.log(`waiting for: ${network_url} to make a first block`)
  const query = `${network_url}/v2/info`
  while (true) {
    try {

      const result = await axios.get(query)
      const stacks_tip_height = result.data.stacks_tip_height
    
      console.log(`current stacks height is ${stacks_tip_height}`)
      if (stacks_tip_height > stacks_height) {
        console.log(`found: the ${network_url} to make a first block`)
        return
      }

    } catch (error) {
      console.log(`still waiting for first ${network_url} block`)
    }

    await sleep(`wait for stacks height`, 5000)

  }
}

async function main() {
  await waitForStacksHeight(L1_URL, 110)
  const minerPublish0id = await publishContract(PK_MINER, 'trait-standards', 'trait-standards.clar', L1_URL, 0)
  const minerPublish1id = await publishContract(PK_MINER, 'hc-alpha', 'hyperchains.clar', L1_URL, 1)
  console.log({minerPublish0id, minerPublish1id})
}

main()