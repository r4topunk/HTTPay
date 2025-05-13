import { Pay-Per-ToolSDK, Pay-Per-ToolSDKConfig } from '../src/toolPaySDK';
import { EscrowClient } from '../src/clients/EscrowClient';
import { RegistryClient } from '../src/clients/RegistryClient';
import { EscrowVerifier } from '../src/escrowVerifier';
import { UsageReporter } from '../src/usageReporter';
import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';

// Mock the dependencies
jest.mock('../src/clients/EscrowClient');
jest.mock('../src/clients/RegistryClient');
jest.mock('../src/escrowVerifier');
jest.mock('../src/usageReporter');
jest.mock('@cosmjs/cosmwasm-stargate', () => {
  return {
    CosmWasmClient: {
      connect: jest.fn(),
    },
    SigningCosmWasmClient: jest.fn(),
  };
});

// Mock the wallet utilities
jest.mock('../src/utils/wallet', () => {
  return {
    createWalletFromMnemonic: jest.fn().mockResolvedValue({}),
    createSigningClientFromWallet: jest.fn(),
  };
});

// Import utility functions after mocking
import { createWalletFromMnemonic, createSigningClientFromWallet } from '../src/utils/wallet';

describe('Pay-Per-ToolSDK', () => {
  let mockConfig: Pay-Per-ToolSDKConfig;
  let mockCosmWasmClient: jest.Mocked<CosmWasmClient>;
  let mockSigningClient: jest.Mocked<SigningCosmWasmClient>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock configuration
    mockConfig = {
      rpcEndpoint: 'https://mock-rpc.neutron.org',
      chainId: 'mock-chain-1',
      registryAddress: 'neutron1registryaddress',
      escrowAddress: 'neutron1escrowaddress',
    };

    // Set up mock clients
    mockCosmWasmClient = {
      queryContractSmart: jest.fn(),
      getHeight: jest.fn().mockResolvedValue(100),
    } as unknown as jest.Mocked<CosmWasmClient>;

    mockSigningClient = {
      ...mockCosmWasmClient,
      execute: jest.fn(),
    } as unknown as jest.Mocked<SigningCosmWasmClient>;

    // Mock the connect method
    (CosmWasmClient.connect as jest.Mock).mockResolvedValue(mockCosmWasmClient);
    (createSigningClientFromWallet as jest.Mock).mockResolvedValue(mockSigningClient);
  });

  it('should initialize with valid configuration', () => {
    // Act
    const sdk = new Pay-Per-ToolSDK(mockConfig);

    // Assert
    expect(sdk).toBeInstanceOf(Pay-Per-ToolSDK);
    expect(sdk.version).toBeDefined();
  });

  it('should connect with a read-only client', async () => {
    // Arrange
    const sdk = new Pay-Per-ToolSDK(mockConfig);

    // Act
    await sdk.connect();

    // Assert
    expect(CosmWasmClient.connect).toHaveBeenCalledWith(mockConfig.rpcEndpoint);
    expect(EscrowClient).toHaveBeenCalled();
    expect(RegistryClient).toHaveBeenCalled();
    expect(EscrowVerifier).toHaveBeenCalled();
    // UsageReporter should not be created with read-only client
    expect(UsageReporter).not.toHaveBeenCalled();
  });

  it('should connect with a signing client using mnemonic', async () => {
    // Arrange
    const sdk = new Pay-Per-ToolSDK(mockConfig);
    const testMnemonic = 'test mnemonic words here';

    // Act
    await sdk.connectWithMnemonic(testMnemonic);

    // Assert
    expect(createWalletFromMnemonic).toHaveBeenCalledWith(testMnemonic, { prefix: 'neutron' });
    expect(createSigningClientFromWallet).toHaveBeenCalled();
    expect(EscrowClient).toHaveBeenCalled();
    expect(RegistryClient).toHaveBeenCalled();
    expect(EscrowVerifier).toHaveBeenCalled();
    expect(UsageReporter).toHaveBeenCalled();
  });

  it('should connect with an existing signing client', () => {
    // Arrange
    const sdk = new Pay-Per-ToolSDK(mockConfig);

    // Act
    sdk.connectWithSigningClient(mockSigningClient);

    // Assert
    expect(EscrowClient).toHaveBeenCalledWith(mockSigningClient, mockConfig.escrowAddress);
    expect(RegistryClient).toHaveBeenCalledWith(mockSigningClient, mockConfig.registryAddress);
    expect(EscrowVerifier).toHaveBeenCalled();
    expect(UsageReporter).toHaveBeenCalled();
  });

  it('should throw an error for invalid configuration', () => {
    // Arrange
    const invalidConfig = {
      rpcEndpoint: '', // Missing required field
      chainId: 'mock-chain-1',
      registryAddress: 'neutron1registryaddress',
      escrowAddress: 'neutron1escrowaddress',
    };

    // Act & Assert
    expect(() => new Pay-Per-ToolSDK(invalidConfig as Pay-Per-ToolSDKConfig)).toThrow(
      'Failed to initialize Pay-Per-ToolSDK',
    );
  });

  it('should delegate verifyEscrow to EscrowVerifier', async () => {
    // Arrange
    const sdk = new Pay-Per-ToolSDK(mockConfig);
    await sdk.connect();

    const mockVerifier = EscrowVerifier.prototype as jest.Mocked<EscrowVerifier>;
    mockVerifier.verifyEscrow = jest.fn().mockResolvedValue({ isValid: true });

    const params = {
      escrowId: '123',
      authToken: 'test-token',
      providerAddr: 'neutron1provider',
    };

    // Act
    await sdk.verifyEscrow(params);

    // Assert
    expect(mockVerifier.verifyEscrow).toHaveBeenCalledWith(params);
  });

  it('should delegate postUsage to UsageReporter', async () => {
    // Arrange
    const sdk = new Pay-Per-ToolSDK(mockConfig);
    await sdk.connectWithMnemonic('test mnemonic');

    const mockReporter = UsageReporter.prototype as jest.Mocked<UsageReporter>;
    mockReporter.postUsage = jest.fn().mockResolvedValue({ txHash: 'hash' });

    const params = {
      escrowId: '123',
      usageFee: '500000',
    };

    // Act
    await sdk.postUsage('neutron1provider', params);

    // Assert
    expect(mockReporter.postUsage).toHaveBeenCalledWith('neutron1provider', params);
  });

  it('should provide access to clients through getter methods', async () => {
    // Arrange
    const sdk = new Pay-Per-ToolSDK(mockConfig);
    await sdk.connect();

    // Act & Assert - these should not throw errors
    expect(() => sdk.registry).not.toThrow();
    expect(() => sdk.escrow).not.toThrow();
    expect(() => sdk.escrowVerifier).not.toThrow();

    // UsageReporter requires signing client
    expect(() => sdk.usageReporter).toThrow();
  });

  it('should detect signing capability correctly', async () => {
    // Arrange
    const sdk = new Pay-Per-ToolSDK(mockConfig);

    // Act & Assert - without connection
    expect(sdk.hasSigningCapability()).toBe(false);

    // After read-only connection
    await sdk.connect();
    expect(sdk.hasSigningCapability()).toBe(false);

    // After signing connection
    await sdk.connectWithMnemonic('test mnemonic');
    expect(sdk.hasSigningCapability()).toBe(true);
  });
});
