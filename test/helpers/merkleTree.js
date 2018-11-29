import utils from 'ethereumjs-util';

class MerkleTree {
  constructor(elements) {
    // Filter empty strings and hash elements.
    this.elements = elements.filter(el => el).map(el => utils.keccak256(el));

    // Deduplicate elements.
    this.elements = this.elements.filter((el, idx) => MerkleTree.bufIndexOf(el, this.elements) === idx);

    // Sort elements.
    this.elements.sort(Buffer.compare);

    // Create the layers.
    this.layers = MerkleTree.getLayers(this.elements);
  }

  static getLayers(elements) {
    if (elements.length === 0) {
      return [['']];
    }

    const layers = [];
    layers.push(elements);

    // Get next layer until we reach the root
    while (layers[layers.length - 1].length > 1) {
      layers.push(MerkleTree.getNextLayer(layers[layers.length - 1]));
    }

    return layers;
  }

  static getNextLayer(elements) {
    return elements.reduce((layer, el, idx, arr) => {
      if (idx % 2 === 0) {
        // Hash the current element with its pair element
        layer.push(MerkleTree.combinedHash(el, arr[idx + 1]));
      }

      return layer;
    }, []);
  }

  static combinedHash(first, second) {
    if (!first) { return second; }
    if (!second) { return first; }

    return utils.keccak256(Buffer.concat([first, second].sort(Buffer.compare)));
  }

  getRoot() {
    return this.layers[this.layers.length - 1][0];
  }

  getHexRoot() {
    return utils.bufferToHex(this.getRoot());
  }

  getProof(el) {
    let idx = MerkleTree.bufIndexOf(el, this.elements);

    if (idx === -1) {
      throw new Error('Element does not exist in Merkle tree');
    }

    return this.layers.reduce((proof, layer) => {
      const pairElement = MerkleTree.getPairElement(idx, layer);

      if (pairElement) {
        proof.push(pairElement);
      }

      idx = Math.floor(idx / 2);

      return proof;
    }, []);
  }

  getHexProof(el) {
    const proof = this.getProof(el);

    return MerkleTree.bufArrToHexArr(proof);
  }

  static getPairElement(idx, layer) {
    const pairIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

    if (pairIdx < layer.length) {
      return layer[pairIdx];
    }

    return null;
  }

  static bufIndexOf(el, arr) {
    let hash;

    // Convert element to 32 byte hash if it is not one already
    if (el.length !== 32 || !Buffer.isBuffer(el)) {
      hash = utils.keccak256(el);
    } else {
      hash = el;
    }

    for (let i = 0; i < arr.length; i++) {
      if (hash.equals(Buffer.from(arr[i], 'hex'))) {
        return i;
      }
    }

    return -1;
  }

  static bufArrToHexArr(arr) {
    if (arr.some(el => !Buffer.isBuffer(el))) {
      throw new Error('Array is not an array of buffers');
    }

    return arr.map(el => `0x${el.toString('hex')}`);
  }
}

module.exports = MerkleTree;
