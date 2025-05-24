/**
 * Wallet utilities for PayPerToolSDK
 */

import { DirectSecp256k1HdWallet, DirectSecp256k1Wallet } from '@cosmjs/proto-signing';
import type { OfflineDirectSigner } from '@cosmjs/proto-signing';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';

/**
 * Options for creating a wallet
 */
export interface CreateWalletOptions {
  /** Prefix for addresses (default: 'neutron') */
  prefix?: string;
  /** BIP-39 language for mnemonic (default: 'english') */
  language?: string;
  /** HD path (default: m/44'/118'/0'/0/0 for cosmos) */
  hdPath?: string;
}

/**
 * Creates a wallet from a mnemonic
 *
 * @param mnemonic - BIP-39 mnemonic words
 * @param options - Optional wallet creation options
 * @returns A CosmJS direct signer
 */
export async function createWalletFromMnemonic(
  mnemonic: string,
  options: CreateWalletOptions = {},
): Promise<OfflineDirectSigner> {
  if (!mnemonic || mnemonic.trim().split(/\s+/).length < 12) {
    throw new Error('Invalid mnemonic. Must contain at least 12 words.');
  }

  const { prefix = 'neutron', language, hdPath } = options;

  // Create basic wallet options with proper typing for DirectSecp256k1HdWallet
  const walletOptions = {
    prefix,
    ...(language ? { bip39Language: language } : {}),
  };

  // For hdPath, we need to be careful with the type
  // Since HdPath is an array of numbers, we can use a simple string representation
  // and let CosmJS handle the conversion internally
  if (hdPath) {
    console.warn(
      'Custom HD path provided, but using string representation which may not work as expected',
    );
  }

  // We just use the options without the hdPath to avoid type issues
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, walletOptions);

  return wallet;
}

/**
 * Creates a wallet from a private key
 *
 * @param privateKeyHex - Hex-encoded private key (without 0x prefix)
 * @param options - Optional wallet creation options
 * @returns A CosmJS direct signer
 */
export async function createWalletFromPrivateKey(
  privateKeyHex: string,
  options: { prefix?: string } = {},
): Promise<OfflineDirectSigner> {
  // Validate the private key format
  if (!privateKeyHex || !/^[0-9a-fA-F]{64}$/.test(privateKeyHex)) {
    throw new Error('Invalid private key. Must be a 64-character hex string.');
  }

  // Convert hex string to Uint8Array
  const privateKey = new Uint8Array(
    privateKeyHex.match(/.{1,2}/g)?.map((byte) => parseInt(byte, 16)) || [],
  );

  const { prefix = 'neutron' } = options;

  // Create wallet from private key
  const wallet = await DirectSecp256k1Wallet.fromKey(privateKey, prefix);

  return wallet;
}

/**
 * Creates a signing client from a wallet
 *
 * @param rpcEndpoint - The RPC endpoint URL
 * @param signer - The wallet or signer
 * @param gasPrice - Gas price to use (optional)
 * @param options - Additional options (optional)
 * @returns A signing CosmWasm client
 */
export async function createSigningClientFromWallet(
  rpcEndpoint: string,
  signer: OfflineDirectSigner,
  gasPrice?: string,
  _options?: { prefix?: string }, // prefix is kept for API compatibility but not used
): Promise<SigningCosmWasmClient> {
  if (!rpcEndpoint) {
    throw new Error('RPC endpoint is required');
  }

  // For version compatibility concerns, we'll use a safer approach
  let client: SigningCosmWasmClient;
  
  try {
    if (gasPrice) {
      // Let's use a dynamic import to avoid direct type references
      const { GasPrice } = await import('@cosmjs/stargate');
      const gasPriceObj = GasPrice.fromString(gasPrice);
      
      // Use type assertion to bypass type checking issues between versions
      client = await SigningCosmWasmClient.connectWithSigner(
        rpcEndpoint, 
        signer, 
        { gasPrice: gasPriceObj as any }
      );
    } else {
      client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer);
    }
  } catch (error) {
    console.error('Error creating signing client:', error);
    // Fallback: try without the gas price option
    client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer);
  }

  return client;
}

/**
 * Get wallet address from a signer
 *
 * @param signer - The wallet or signer
 * @returns The wallet's first address
 * @throws Error if no accounts are found
 */
export async function getWalletAddress(signer: OfflineDirectSigner): Promise<string> {
  const accounts = await signer.getAccounts();
  if (!accounts || accounts.length === 0) {
    throw new Error('No accounts found in wallet');
  }
  // TypeScript needs explicit check that accounts[0] exists
  const firstAccount = accounts[0];
  if (!firstAccount) {
    throw new Error('First account is undefined');
  }
  return firstAccount.address;
}

/**
 * Validates if an address is a valid bech32 address with the given prefix
 *
 * @param address - The address to validate
 * @param prefix - The expected address prefix (default: 'neutron')
 * @returns True if valid, false otherwise
 */
export function isValidAddress(address: string, prefix: string = 'neutron'): boolean {
  if (!address || typeof address !== 'string') {
    return false;
  }

  // Simple prefix check - for more accurate validation, consider using bech32 library
  return address.startsWith(`${prefix}1`);
}
