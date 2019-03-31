/**
 * Copyright 2019 the orbs-ethereum-contracts authors
 * This file is part of the orbs-ethereum-contracts library in the Orbs project.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 * The above notice should be included in all copies or substantial portions of the software.
 */

import utils from 'ethereumjs-util';
import treeify from 'treeify';

class MerkleTree {
  constructor(elements) {
    // Filter empty strings and hash elements.
    this.elements = elements.filter(el => el).map(el => utils.sha256(el));

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
    if (!first) {
      return second;
    }

    if (!second) {
      return first;
    }

    return utils.sha256(Buffer.concat([first, second].sort(Buffer.compare)));
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
      throw new Error('Element does not exist in the Merkle tree!');
    }

    return this.layers.reduce((proof, layer) => {
      const pairElement = MerkleTree.getPairElement(idx, layer);

      if (pairElement) {
        proof.unshift(pairElement);
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

  toHash(format) {
    return MerkleTree.toHashRecurisve(0, 0, this.layers.reverse(), format);
  }

  print() {
    // eslint-disable-next-line no-console
    console.log(treeify.asTree(this.toHash('hex'), true));
  }

  static toHashRecurisve(layerIndex, elementIndex, layers, format) {
    const layer = layers[layerIndex];
    const element = layer[elementIndex];

    // Incomplete tree?
    if (!element) {
      return {};
    }

    const key = format ? element.toString(format) : element;

    const tree = {};
    tree.key = key;

    // Leafs?
    if (layerIndex !== layers.length - 1) {
      tree.left = MerkleTree.toHashRecurisve(layerIndex + 1, 2 * elementIndex, layers, format);
      tree.right = MerkleTree.toHashRecurisve(layerIndex + 1, 2 * elementIndex + 1, layers, format);
    }

    return tree;
  }

  static bufIndexOf(el, arr) {
    let hash;

    // Convert element to 32 byte hash if it is not one already
    if (el.length !== 32 || !Buffer.isBuffer(el)) {
      hash = utils.sha256(el);
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
