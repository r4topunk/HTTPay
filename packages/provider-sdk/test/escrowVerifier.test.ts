import { EscrowVerifier, VerifyEscrowParams } from '../src/escrowVerifier';
import { EscrowClient } from '../src/clients/EscrowClient';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';

// Mock the EscrowClient
jest.mock('../src/clients/EscrowClient', () => {
  return {
    EscrowClient: jest.fn().mockImplementation(() => {
      return {
        getContractAddress: jest.fn().mockReturnValue('neutron1mockescrowcontract'),
        getClient: jest.fn().mockReturnValue({
          getHeight: jest.fn().mockResolvedValue(100)
        }),
        getEscrow: jest.fn()
      };
    })
  };
});

describe('EscrowVerifier', () => {
  let escrowClient: jest.Mocked<EscrowClient>;
  let verifier: EscrowVerifier;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create a mock EscrowClient
    const mockClient = {} as CosmWasmClient;
    escrowClient = new EscrowClient(mockClient, 'neutron1mockescrowcontract') as jest.Mocked<EscrowClient>;
    
    // Create the verifier with the mock client
    verifier = new EscrowVerifier(escrowClient);
  });

  it('should verify a valid escrow successfully', async () => {
    // Arrange
    const mockEscrow = {
      escrow_id: 123,
      caller: 'neutron1caller',
      provider: 'neutron1provider',
      max_fee: '1000000',
      expires: 200,  // Expires at block 200
      auth_token: 'test-token'
    };
    
    (escrowClient.getEscrow as jest.Mock).mockResolvedValue(mockEscrow);
    
    const params: VerifyEscrowParams = {
      escrowId: '123',
      authToken: 'test-token',
      providerAddr: 'neutron1provider',
      currentBlockHeight: 100 // Current block height is 100
    };

    // Act
    const result = await verifier.verifyEscrow(params);

    // Assert
    expect(result.isValid).toBe(true);
    expect(result.escrow).toBe(mockEscrow);
    expect(result.blockHeight).toBe(100);
    expect(escrowClient.getEscrow).toHaveBeenCalledWith(123);
  });

  it('should return invalid if escrow is expired', async () => {
    // Arrange
    const mockEscrow = {
      escrow_id: 456,
      caller: 'neutron1caller',
      provider: 'neutron1provider',
      max_fee: '1000000',
      expires: 90,  // Expired at block 90
      auth_token: 'test-token'
    };
    
    (escrowClient.getEscrow as jest.Mock).mockResolvedValue(mockEscrow);
    
    const params: VerifyEscrowParams = {
      escrowId: '456',
      authToken: 'test-token',
      providerAddr: 'neutron1provider',
      currentBlockHeight: 100 // Current block height is 100
    };

    // Act
    const result = await verifier.verifyEscrow(params);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Escrow expired');
    expect(result.escrow).toBe(mockEscrow);
    expect(result.blockHeight).toBe(100);
  });

  it('should return invalid if provider address does not match', async () => {
    // Arrange
    const mockEscrow = {
      escrow_id: 789,
      caller: 'neutron1caller',
      provider: 'neutron1provider',
      max_fee: '1000000',
      expires: 200,
      auth_token: 'test-token'
    };
    
    (escrowClient.getEscrow as jest.Mock).mockResolvedValue(mockEscrow);
    
    const params: VerifyEscrowParams = {
      escrowId: '789',
      authToken: 'test-token',
      providerAddr: 'neutron1wrong', // Wrong provider address
      currentBlockHeight: 100
    };

    // Act
    const result = await verifier.verifyEscrow(params);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Provider mismatch');
    expect(result.escrow).toBe(mockEscrow);
  });

  it('should return invalid if auth token does not match', async () => {
    // Arrange
    const mockEscrow = {
      escrow_id: 123,
      caller: 'neutron1caller',
      provider: 'neutron1provider',
      max_fee: '1000000',
      expires: 200,
      auth_token: 'test-token'
    };
    
    (escrowClient.getEscrow as jest.Mock).mockResolvedValue(mockEscrow);
    
    const params: VerifyEscrowParams = {
      escrowId: '123',
      authToken: 'wrong-token', // Wrong auth token
      providerAddr: 'neutron1provider',
      currentBlockHeight: 100
    };

    // Act
    const result = await verifier.verifyEscrow(params);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid authentication token');
    expect(result.escrow).toBe(mockEscrow);
  });

  it('should return invalid if escrow does not exist', async () => {
    // Arrange
    (escrowClient.getEscrow as jest.Mock).mockResolvedValue(null);
    
    const params: VerifyEscrowParams = {
      escrowId: '999',
      authToken: 'test-token',
      providerAddr: 'neutron1provider',
      currentBlockHeight: 100
    };

    // Act
    const result = await verifier.verifyEscrow(params);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Escrow not found');
    expect(result.escrow).toBeUndefined();
  });

  it('should return invalid if escrow ID is not a number', async () => {
    // Arrange
    const params: VerifyEscrowParams = {
      escrowId: 'not-a-number',
      authToken: 'test-token',
      providerAddr: 'neutron1provider',
      currentBlockHeight: 100
    };

    // Act
    const result = await verifier.verifyEscrow(params);

    // Assert
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid escrow ID');
    expect(result.escrow).toBeUndefined();
  });
});
