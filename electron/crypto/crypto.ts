import { p256 } from '@noble/curves/p256';
import { hkdf } from '@noble/hashes/hkdf';
import { sha256 } from '@noble/hashes/sha256';
import * as crypto from 'crypto';

// ECDH P-256 + HKDF + AES-256-GCM (Android Crypto.kt uyumlu)
export class CrisisCrypto {
  private privateKey: Uint8Array;
  private publicKey: Uint8Array;

  constructor() {
    this.privateKey = p256.utils.randomPrivateKey();
    this.publicKey = p256.getPublicKey(this.privateKey, false);
  }

  getPublicKey(): string {
    return Buffer.from(this.publicKey).toString('base64');
  }

  deriveSessionKey(peerPubB64: string): Uint8Array {
    const peerPub = Buffer.from(peerPubB64, 'base64');
    const shared = p256.getSharedSecret(this.privateKey, peerPub, false);
    return hkdf(sha256, shared, undefined, undefined, 32);
  }

  encrypt(key: Uint8Array, data: Uint8Array): {ct: Uint8Array; nonce: Uint8Array} {
    const nonce = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', key, nonce);
    const enc = Buffer.concat([c.update(data), c.final()]);
    return {ct: Buffer.concat([enc, c.getAuthTag()]), nonce};
  }

  decrypt(key: Uint8Array, ct: Uint8Array, nonce: Uint8Array): Uint8Array {
    const tag = ct.slice(-16), d = ct.slice(0,-16);
    const c = crypto.createDecipheriv('aes-256-gcm', key, nonce);
    c.setAuthTag(tag);
    return Buffer.concat([c.update(d), c.final()]);
  }
}
