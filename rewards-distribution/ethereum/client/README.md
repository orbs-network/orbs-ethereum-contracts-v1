# Rewards Distribution using OrbsRewardsDistribution contract

* Prerequisute - address of a deployed `OrbsRewardsDistribution` contract
* In a terminal, navigate to the root of truffle project under `rewards-distribution/ethereum`
* execute the batch generation script:
```$bash
truffle exec client/getBatchHahses.js  [csv filename] [number of payments per batch]
```
The CSV filename should have two columns: 
The result will be output of this kind:
```
➜  ethereum git:(rewards-distribution) ✗ truffle exec client/getBatchHahses.js  ~/Downloads/distribution-1-27.csv 50
Using network 'development'.

usage: truffle exec getBatchHashes.js [rewards csv file] [batchSize]
parsing file /Users/ron/Downloads/distribution-1-27.csv into batches of up to 50 payments each
total rewards amount: 18018788000000000000000000
# rewards: 1513
# batches: 31
---------------------------
batch hashes:
 [ '0xa27552b2423eef777e5a6e7866f9027de544f73d3596d813ef2b11da324c05eb',
  '0xf1d3ba9d19d093f096408741651573bb400e37b101ab407b9daf398e4de80bf7',
  '0x91c58ead6a55ddfa997642ef82820837b3eb0acc97b9385a9ded46a691620e20',
  '0xfc6ad5359227457a00c2a7b8f21c11ba066437513b853f53c304c478f0443e69',
  '0x170c938d080dd99a0efd84b941e3258c1e9a567375462baffa1bd6abac662503',
  '0xa7add50b6ce1f3b723c6db0860985b81e91dade1536bc243ff9c5d3896b88e6a',
  '0x6a13ca0a8c103070deda5aee39af9ab5596e37cba91f73bd1997e16ba5065cb4',
  '0x0851e330db994958d6865adeb9d1c7bca72f106ad58361bb20cc93a1273ad17e',
  '0xceced4f687cec7c76ebaa7366453e19ec7be15764fa4f147c754cd6291e487d6',
  '0xaa1027df7c07e814b69370b87150faa9d08b0fe14281af59a1ea80495c2c8608',
  '0x074adae3c891bc0eff0854528b771ad911c86e2faab7601bb41a1aa68d2d05fb',
  '0x799cdb08b9686e1ae3239f1b227d0faa0b6164d70a016ccb75496b6972b893ad',
  '0xcc72fb71ca717852e7a6bf2f4e8bca2eea1ee534e7b83c4c7d374d12d1d1a2fa',
  '0x790ef96237a9fc3d821b3f9bbfd5f175402eae55133fe5690635195e09d06644',
  '0xad83818405fc26aff7c38f96a7676b403f040296917541d3a94961806f936136',
  '0xa55a09190941794d21a9d2b1b897ec8cf8d1f8b40fb4f2e6722c2ee744044dc4',
  '0xd11dc2f2ea1d577ba7efd84492fc4ff7f0f664acda1a208c83a845aa60a91ad9',
  '0x92097cfa762291a89e43563a8352a9a7af209d3e10a2775e540007ae99272fc8',
  '0x4ad64d0dc87aafa43ad16d995e53bf187f4966ebc9f787abb00ec60b577b73bc',
  '0x1f4acdc3141161b966366ac8a3fd0f33fd9ead7e03df085fbf3c6a6042c3c208',
  '0xca3a8cb21813eaffd32d886b67e7d823afcb42ef588c287edd6d3b3fe4d578fa',
  '0x72a0acd9bdff528edc9e2f8520c6e18cf21534543deca04cbc54e4f2a6abdbba',
  '0x4a247f567b82dd13b61c9bf35f01f29c685506a607173264164c65c4744f6956',
  '0xa43f617968ad7eaa0c9abf79cf44a811b88040942f078255f2e5ad1ffedbf8f8',
  '0x9cd68feabc75a73889a7d3fed8593b3a792b4efb77353ad5128ca21db80435f8',
  '0xa0850f61e40e81645c32a34a1f82987647372616ee89275b4bd79100c1f12a2e',
  '0xe62a3bb242fa7d43e7171bfe5158a47f02e2ff11ec13367f6db704023585147c',
  '0xdfd29877f9d7a002e8b597d720a01d03cfb01629f5d3e28237734ce4c8cdcae8',
  '0x2ee839335577d8b48cc3d7bc355049ca058017fa42623189e6a087271e00cb05',
  '0xba0045ca8b86ed93881a296a07a5940d51c0a96c807df5e81dbc2a70831767aa',
  '0x223143c3e73d6bf9978d4046bac33fe1214133c037f44444c7e07bb126d39346' ]
---------------------------

samples - last payment in each batch:
---------------------------
row: 51 batchIdx: 0 idx in batch: 49 amount: 32748000000000000000000 recipient 0x7f0e5488a651c08f84df8e4088303c94c58a728b
row: 101 batchIdx: 1 idx in batch: 49 amount: 14244000000000000000000 recipient 0xac80f3649244815859cc05c8839584b3a38eef16
row: 151 batchIdx: 2 idx in batch: 49 amount: 8956000000000000000000 recipient 0xeb1845f8ed97150625ffb344deea4a94e78a4896
row: 201 batchIdx: 3 idx in batch: 49 amount: 5994000000000000000000 recipient 0x0f9bf3af38bb6c90f1739f86314e731e23793825
row: 251 batchIdx: 4 idx in batch: 49 amount: 4578000000000000000000 recipient 0x313695ced3fc0a9fc4241792f387ad886bb79ec9
row: 301 batchIdx: 5 idx in batch: 49 amount: 3714000000000000000000 recipient 0x4e1bdefa1fccd798e7a1136228ab1cb70d4333e6
row: 351 batchIdx: 6 idx in batch: 49 amount: 2958000000000000000000 recipient 0xdb3d000963a51c850654047f9b8fd7b20a280a1d
row: 401 batchIdx: 7 idx in batch: 49 amount: 2568000000000000000000 recipient 0xa6c3a886a8a40c6e8d5402f403fc705a2bf80278
row: 451 batchIdx: 8 idx in batch: 49 amount: 2064000000000000000000 recipient 0x8f73ec6c62dee6ac418524bf267dde717a736e29
row: 501 batchIdx: 9 idx in batch: 49 amount: 1817000000000000000000 recipient 0x72b54ff4be3f80ffec0095af7e2531c0faf5ca74
row: 551 batchIdx: 10 idx in batch: 49 amount: 1601000000000000000000 recipient 0x2b8e624a8ebb0bd4a63c7709cfdbf57bd33fe863
row: 601 batchIdx: 11 idx in batch: 49 amount: 1464000000000000000000 recipient 0x869d86a8fbf4b45b261347d7a61213f8b7dd39f4
row: 651 batchIdx: 12 idx in batch: 49 amount: 1292000000000000000000 recipient 0xeefc27ae5df98493d7a11c37248082fa8ad990b9
row: 701 batchIdx: 13 idx in batch: 49 amount: 1118000000000000000000 recipient 0x9e912ba1ce059ceca9499ec9ec703b12d32cb50c
row: 751 batchIdx: 14 idx in batch: 49 amount: 943000000000000000000 recipient 0x189e69aff130dd5e351baf5e530d4e4bdfd40ba3
row: 801 batchIdx: 15 idx in batch: 49 amount: 822000000000000000000 recipient 0xfe2d0f4bb253e834a68877d9536bde83626f1e84
row: 851 batchIdx: 16 idx in batch: 49 amount: 719000000000000000000 recipient 0x5e8a94d08b79a6eb77a1a8321566ca080fc804b0
row: 901 batchIdx: 17 idx in batch: 49 amount: 622000000000000000000 recipient 0x5c96d2b8951888528cbd7cee66251a0bdac5498f
row: 951 batchIdx: 18 idx in batch: 49 amount: 523000000000000000000 recipient 0x3ad7aeb3b3bcabf9e7690bf36e9f3eeec3294836
row: 1001 batchIdx: 19 idx in batch: 49 amount: 440000000000000000000 recipient 0x9fa56500f7d06b6608ee7c8db707b0fbf07d983d
row: 1051 batchIdx: 20 idx in batch: 49 amount: 376000000000000000000 recipient 0xdbe905b6d2c951728e5e1c5af78e820437997ea4
row: 1101 batchIdx: 21 idx in batch: 49 amount: 325000000000000000000 recipient 0x009d33eee76bf8480955dedfee86e16fefd2a043
row: 1151 batchIdx: 22 idx in batch: 49 amount: 270000000000000000000 recipient 0xf72a7862e13febc885be10efd794ee8da7187602
row: 1201 batchIdx: 23 idx in batch: 49 amount: 216000000000000000000 recipient 0x9b20489d35a1bde6c3e4a77df12beefd409c55bc
row: 1251 batchIdx: 24 idx in batch: 49 amount: 182000000000000000000 recipient 0x5212e1acf1fa5968bb56afab9a39c9a44ec8e860
row: 1301 batchIdx: 25 idx in batch: 49 amount: 144000000000000000000 recipient 0x8e3a1295aae223bdf2f6c05a021680f1f055947c
row: 1351 batchIdx: 26 idx in batch: 49 amount: 100000000000000000000 recipient 0xe40ed8ef746aedf9292e9e944d8e9740f879a8e0
row: 1401 batchIdx: 27 idx in batch: 49 amount: 54000000000000000000 recipient 0x5ecad8cca8e6dfbd47bd7a52d5714662b4936ec8
row: 1451 batchIdx: 28 idx in batch: 49 amount: 0 recipient 0xc9145c3a273c5f73f5f254a1f2e7e26a3872a431
row: 1501 batchIdx: 29 idx in batch: 49 amount: 0 recipient 0xd630913974692ec483ea6a477c98c21822281199
row: 1514 batchIdx: 30 idx in batch: 12 amount: 0 recipient 0xfb390441ff968f7569cd6f3cf01cb7214dfeed31
```
* Review total amounts, number of batches and rewards, and sample rows, the filename parsed, etc. 
* Transfer `total rewards amount` orbitons to the address of `OrbsRewardsDistribution` contract
* Send a transaction to `OrbsRewardsDistribution.announceDistributionEvent` providing the following parameters:
    * distributionName - name to appear in event logs relating to payments in current distribution
    * batchHashes - the array output by `getBatchHashes` under the `batch hashes` section.
* Run batch execution script:
```$bash
truffle exec client/executeBatches.js [rewards contract address] [rewards csv file] [batchSize] [distribution event name]```