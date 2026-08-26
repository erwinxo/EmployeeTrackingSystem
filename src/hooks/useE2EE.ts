import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

const DB_NAME = 'thinkcove_e2ee';
const STORE_KEYPAIRS = 'keypairs';
const STORE_GROUPKEYS = 'group_keys';

// IndexedDB Helper Functions
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_KEYPAIRS)) {
        db.createObjectStore(STORE_KEYPAIRS);
      }
      if (!db.objectStoreNames.contains(STORE_GROUPKEYS)) {
        db.createObjectStore(STORE_GROUPKEYS);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const getPersistedKeyPair = async (userId: string): Promise<CryptoKeyPair | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KEYPAIRS, 'readonly');
    const store = tx.objectStore(STORE_KEYPAIRS);
    const request = store.get(userId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

const savePersistedKeyPair = async (userId: string, keyPair: CryptoKeyPair): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_KEYPAIRS, 'readwrite');
    const store = tx.objectStore(STORE_KEYPAIRS);
    store.put(keyPair, userId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

// Base64 Binary conversion helpers
export const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

export const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

export const useE2EE = (userId: string | null | undefined) => {
  const [myKeyPair, setMyKeyPair] = useState<CryptoKeyPair | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Initialize and load user's E2EE keypairs
  const initKeys = useCallback(async (uid: string) => {
    setIsInitializing(true);
    try {
      let keyPair = await getPersistedKeyPair(uid);

      if (!keyPair) {
        // Generate a new ECDH P-256 keypair
        keyPair = await window.crypto.subtle.generateKey(
          {
            name: 'ECDH',
            namedCurve: 'P-256',
          },
          true, // extractable
          ['deriveKey', 'deriveBits']
        );

        // Persist keypair in IndexedDB
        await savePersistedKeyPair(uid, keyPair);

        // Export and upload public key to server
        const jwkPublicKey = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
        await api.post('/users/public-key', { ecdhPublicKey: JSON.stringify(jwkPublicKey) });
      }

      setMyKeyPair(keyPair);
    } catch (error) {
      console.error('Failed to initialize E2EE keys:', error);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      initKeys(userId);
    }
  }, [userId, initKeys]);

  // Import a JWK Public Key from string
  const importPublicKey = async (jwkString: string): Promise<CryptoKey> => {
    const jwk = JSON.parse(jwkString);
    return window.crypto.subtle.importKey(
      'jwk',
      jwk,
      {
        name: 'ECDH',
        namedCurve: 'P-256',
      },
      true,
      []
    );
  };

  // Derive Shared Symmetric Key (AES-GCM-256) between myself and target user
  const deriveSharedKey = async (recipientJwkPublic: string): Promise<CryptoKey> => {
    if (!myKeyPair) {
      throw new Error('Local E2EE private key is not initialized');
    }

    const recipientPublicKey = await importPublicKey(recipientJwkPublic);

    // Derive raw shared secret bits
    const sharedSecretBits = await window.crypto.subtle.deriveBits(
      {
        name: 'ECDH',
        public: recipientPublicKey,
      },
      myKeyPair.privateKey,
      256
    );

    // Hash shared secret bits with SHA-256 to produce a high-entropy key
    const hashedSecret = await window.crypto.subtle.digest('SHA-256', sharedSecretBits);

    // Import as AES-GCM symmetric key
    return window.crypto.subtle.importKey(
      'raw',
      hashedSecret,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false, // not extractable
      ['encrypt', 'decrypt']
    );
  };

  // Encrypt plaintext payload using AES-GCM
  const encryptPayload = async (plaintext: string, aesKey: CryptoKey): Promise<{ ciphertext: string; iv: string }> => {
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plaintext);
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const ciphertextBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      aesKey,
      encodedData
    );

    return {
      ciphertext: arrayBufferToBase64(ciphertextBuffer),
      iv: arrayBufferToBase64(iv.buffer),
    };
  };

  // Decrypt ciphertext payload using AES-GCM
  const decryptPayload = async (ciphertextBase64: string, ivBase64: string, aesKey: CryptoKey): Promise<string> => {
    const ciphertext = base64ToArrayBuffer(ciphertextBase64);
    const iv = base64ToArrayBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
      },
      aesKey,
      ciphertext
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  };

  // Encrypt File Blob using AES-GCM
  const encryptFile = async (file: Blob, aesKey: CryptoKey): Promise<{ encryptedBlob: Blob; iv: string }> => {
    const fileBytes = await file.arrayBuffer();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv,
      },
      aesKey,
      fileBytes
    );

    return {
      encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
      iv: arrayBufferToBase64(iv.buffer),
    };
  };

  // Decrypt File Blob using AES-GCM
  const decryptFile = async (encryptedBlob: Blob, ivBase64: string, aesKey: CryptoKey, originalMimeType: string): Promise<Blob> => {
    const encryptedBytes = await encryptedBlob.arrayBuffer();
    const iv = base64ToArrayBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(iv),
      },
      aesKey,
      encryptedBytes
    );

    return new Blob([decryptedBuffer], { type: originalMimeType });
  };

  // Generate AES group key (returns raw 32-byte key)
  const generateGroupKey = async (): Promise<Uint8Array> => {
    return window.crypto.getRandomValues(new Uint8Array(32));
  };

  // Import raw key buffer as AES-GCM CryptoKey
  const importRawGroupKey = async (rawKey: Uint8Array): Promise<CryptoKey> => {
    return window.crypto.subtle.importKey(
      'raw',
      rawKey.buffer as ArrayBuffer,
      {
        name: 'AES-GCM',
        length: 256,
      },
      false,
      ['encrypt', 'decrypt']
    );
  };

  return {
    myKeyPair,
    isInitializing,
    importPublicKey,
    deriveSharedKey,
    encryptPayload,
    decryptPayload,
    encryptFile,
    decryptFile,
    generateGroupKey,
    importRawGroupKey,
  };
};
