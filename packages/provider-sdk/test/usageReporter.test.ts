import { UsageReporter, PostUsageParams } from '../src/usageReporter';
import { EscrowClient } from '../src/clients/EscrowClient';
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';

// Mock the EscrowClient
jest.mock('../src/clients/EscrowClient', () => {
  return {
    EscrowClient: jest.fn().mockImplementation(() => {
      return {
        getContractAddress: jest.fn().mockReturnValue('neutron1mockescrowcontract'),
        getClient: jest.fn().mockReturnValue({
          execute: jest.fn(), // Signing client has execute method
        }),
        releaseFunds: jest.fn(),
      };
    }),
  };
});

describe('UsageReporter', () => {
  let escrowClient: jest.Mocked<EscrowClient>;
  let reporter: UsageReporter;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a mock EscrowClient with signing capabilities
    const mockClient = { execute: jest.fn() } as unknown as SigningCosmWasmClient;
    escrowClient = new EscrowClient(
      mockClient,
      'neutron1mockescrowcontract',
    ) as jest.Mocked<EscrowClient>;

    // Create the reporter with the mock client
    reporter = new UsageReporter(escrowClient);
  });

  it('should post usage successfully', async () => {
    // Arrange
    const mockTxResult = {
      transactionHash: 'mock_tx_hash',
      gasUsed: 123456,
    };

    (escrowClient.releaseFunds as jest.Mock).mockResolvedValue(mockTxResult);

    const params: PostUsageParams = {
      escrowId: 123,
      usageFee: '500000',
      options: {
        memo: 'Test usage report',
      },
    };

    // Act
    const result = await reporter.postUsage('neutron1provider', params);

    // Assert
    expect(result.txHash).toBe('mock_tx_hash');
    expect(result.gasUsed).toBe(123456);
    expect(escrowClient.releaseFunds).toHaveBeenCalledWith('neutron1provider', 123, '500000');
  });

  it('should handle string escrowId by converting to number', async () => {
    // Arrange
    const mockTxResult = {
      transactionHash: 'mock_tx_hash',
      gasUsed: 123456,
    };

    (escrowClient.releaseFunds as jest.Mock).mockResolvedValue(mockTxResult);

    const params: PostUsageParams = {
      escrowId: '456', // String escrowId
      usageFee: '750000',
    };

    // Act
    const result = await reporter.postUsage('neutron1provider', params);

    // Assert
    expect(result.txHash).toBe('mock_tx_hash');
    expect(escrowClient.releaseFunds).toHaveBeenCalledWith(
      'neutron1provider',
      456, // Should be converted to number
      '750000',
    );
  });

  it('should throw an error if releaseFunds fails', async () => {
    // Arrange
    (escrowClient.releaseFunds as jest.Mock).mockRejectedValue(
      new Error('Simulated contract error'),
    );

    const params: PostUsageParams = {
      escrowId: 789,
      usageFee: '250000',
    };

    // Act & Assert
    await expect(reporter.postUsage('neutron1provider', params)).rejects.toThrow(
      'Failed to post usage: Simulated contract error',
    );

    expect(escrowClient.releaseFunds).toHaveBeenCalledWith('neutron1provider', 789, '250000');
  });

  it('should handle non-number escrowId gracefully', async () => {
    // Arrange
    const mockTxResult = {
      transactionHash: 'mock_tx_hash',
      gasUsed: 123456,
    };

    (escrowClient.releaseFunds as jest.Mock).mockResolvedValue(mockTxResult);

    const params: PostUsageParams = {
      escrowId: 'not-a-number' as any, // This should result in NaN
      usageFee: '100000',
    };

    // Act
    await reporter.postUsage('neutron1provider', params);

    // Assert
    // Even invalid inputs should be passed to the client and fail there
    // for consistent error handling
    expect(escrowClient.releaseFunds).toHaveBeenCalledWith(
      'neutron1provider',
      NaN, // Should be NaN due to parseInt
      '100000',
    );
  });
});
