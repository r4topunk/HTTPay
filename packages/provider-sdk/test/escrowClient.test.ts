import { EscrowClient } from '../src/clients/EscrowClient';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import type { EscrowsResponse } from '../src/types/escrow';

// Mock the CosmWasmClient
jest.mock('@cosmjs/cosmwasm-stargate');

describe('EscrowClient - GetEscrows', () => {
  let escrowClient: EscrowClient;
  let mockCosmWasmClient: jest.Mocked<CosmWasmClient>;
  const contractAddress = 'neutron1escrowaddress';

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up mock client
    mockCosmWasmClient = {
      queryContractSmart: jest.fn(),
      getHeight: jest.fn().mockResolvedValue(100),
    } as unknown as jest.Mocked<CosmWasmClient>;

    escrowClient = new EscrowClient(mockCosmWasmClient, contractAddress);
  });

  describe('getEscrows', () => {
    const mockEscrowsResponse: EscrowsResponse = {
      escrows: [
        {
          id: 1,
          caller: 'neutron1caller1',
          provider: 'neutron1provider1',
          tool_id: 'test-tool-1',
          max_fee: '1000000',
          usage_fee: '500000',
          auth_token: 'auth-token-1',
          expires: 1000,
          denom: 'untrn',
        },
        {
          id: 2,
          caller: 'neutron1caller2',
          provider: 'neutron1provider2',
          tool_id: 'test-tool-2',
          max_fee: '2000000',
          usage_fee: '1000000',
          auth_token: 'auth-token-2',
          expires: 2000,
          denom: 'ibc/ABC123',
        },
      ],
    };

    it('should call getEscrows with no parameters', async () => {
      // Arrange
      mockCosmWasmClient.queryContractSmart.mockResolvedValue(mockEscrowsResponse);

      // Act
      const result = await escrowClient.getEscrows();

      // Assert
      expect(mockCosmWasmClient.queryContractSmart).toHaveBeenCalledWith(contractAddress, {
        get_escrows: {
          caller: undefined,
          provider: undefined,
          start_after: undefined,
          limit: undefined,
        },
      });
      expect(result).toEqual(mockEscrowsResponse);
    });

    it('should call getEscrows with caller filter', async () => {
      // Arrange
      mockCosmWasmClient.queryContractSmart.mockResolvedValue(mockEscrowsResponse);
      const options = { caller: 'neutron1caller1' };

      // Act
      const result = await escrowClient.getEscrows(options);

      // Assert
      expect(mockCosmWasmClient.queryContractSmart).toHaveBeenCalledWith(contractAddress, {
        get_escrows: {
          caller: 'neutron1caller1',
          provider: undefined,
          start_after: undefined,
          limit: undefined,
        },
      });
      expect(result).toEqual(mockEscrowsResponse);
    });

    it('should call getEscrows with provider filter', async () => {
      // Arrange
      mockCosmWasmClient.queryContractSmart.mockResolvedValue(mockEscrowsResponse);
      const options = { provider: 'neutron1provider1' };

      // Act
      const result = await escrowClient.getEscrows(options);

      // Assert
      expect(mockCosmWasmClient.queryContractSmart).toHaveBeenCalledWith(contractAddress, {
        get_escrows: {
          caller: undefined,
          provider: 'neutron1provider1',
          start_after: undefined,
          limit: undefined,
        },
      });
      expect(result).toEqual(mockEscrowsResponse);
    });

    it('should call getEscrows with pagination parameters', async () => {
      // Arrange
      mockCosmWasmClient.queryContractSmart.mockResolvedValue(mockEscrowsResponse);
      const options = { startAfter: 5, limit: 10 };

      // Act
      const result = await escrowClient.getEscrows(options);

      // Assert
      expect(mockCosmWasmClient.queryContractSmart).toHaveBeenCalledWith(contractAddress, {
        get_escrows: {
          caller: undefined,
          provider: undefined,
          start_after: 5,
          limit: 10,
        },
      });
      expect(result).toEqual(mockEscrowsResponse);
    });

    it('should call getEscrows with all parameters', async () => {
      // Arrange
      mockCosmWasmClient.queryContractSmart.mockResolvedValue(mockEscrowsResponse);
      const options = {
        caller: 'neutron1caller1',
        provider: 'neutron1provider1',
        startAfter: 10,
        limit: 20,
      };

      // Act
      const result = await escrowClient.getEscrows(options);

      // Assert
      expect(mockCosmWasmClient.queryContractSmart).toHaveBeenCalledWith(contractAddress, {
        get_escrows: {
          caller: 'neutron1caller1',
          provider: 'neutron1provider1',
          start_after: 10,
          limit: 20,
        },
      });
      expect(result).toEqual(mockEscrowsResponse);
    });

    it('should handle empty results', async () => {
      // Arrange
      const emptyResponse: EscrowsResponse = { escrows: [] };
      mockCosmWasmClient.queryContractSmart.mockResolvedValue(emptyResponse);

      // Act
      const result = await escrowClient.getEscrows();

      // Assert
      expect(result).toEqual(emptyResponse);
      expect(result.escrows).toHaveLength(0);
    });

    it('should propagate contract query errors', async () => {
      // Arrange
      const errorMessage = 'Contract query failed';
      mockCosmWasmClient.queryContractSmart.mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(escrowClient.getEscrows()).rejects.toThrow(errorMessage);
    });

    it('should handle different escrow data types correctly', async () => {
      // Arrange
      const complexResponse: EscrowsResponse = {
        escrows: [
          {
            id: 999999,
            caller: 'neutron1verylongaddresswithdifferentprefix123456789',
            provider: 'neutron1anotherlongprovideraddress987654321',
            tool_id: 'complex-tool-id-with-hyphens',
            max_fee: '999999999999999999',
            usage_fee: '0',
            auth_token: 'very-long-auth-token-with-special-chars-!@#$%',
            expires: 999999999,
            denom: 'ibc/VERYLONGIBC12345HASH6789ABCDEF',
          },
        ],
      };
      mockCosmWasmClient.queryContractSmart.mockResolvedValue(complexResponse);

      // Act
      const result = await escrowClient.getEscrows();

      // Assert
      expect(result).toEqual(complexResponse);
      expect(result.escrows[0].id).toBe(999999);
      expect(result.escrows[0].max_fee).toBe('999999999999999999');
      expect(result.escrows[0].usage_fee).toBe('0');
    });
  });
});
