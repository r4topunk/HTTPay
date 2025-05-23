/**
 * Tests for fee collection functionality in the Escrow contract
 */
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { EscrowClient } from '../src/clients/EscrowClient';
import { CollectedFeesResponse } from '../src/types/escrow';

// Mock implementations to allow testing without actual blockchain
jest.mock('@cosmjs/cosmwasm-stargate');
jest.mock('@cosmjs/proto-signing');

describe('Fee Collection', () => {
  // Common test variables
  const escrowAddress = 'neutron1nc5tatafv6eyq7llkr2gv50ff9e22mnf70qgjlv737ktmt4eswrqhnc3f9';
  const ownerAddress = 'neutron1owner';
  const providerAddress = 'neutron1provider';
  const userAddress = 'neutron1user';
  const unauthorizedAddress = 'neutron1unauthorized';
  
  // Constants for test scenarios
  const DENOM = 'untrn';
  const IBC_DENOM = 'ibc/ABCDEF0123456789';
  const FEE_PERCENTAGE = 5; // 5% fee
  const MAX_FEE = '1000000'; // 1 NTRN
  const USAGE_FEE = '500000'; // 0.5 NTRN
  const ESCROW_ID = 123;
  
  let mockSigningClient: jest.Mocked<SigningCosmWasmClient>;
  let escrowClient: EscrowClient;
  
  beforeEach(() => {
    // Reset and setup mocks
    jest.clearAllMocks();
    
    // Create mock signing client
    mockSigningClient = {
      execute: jest.fn().mockResolvedValue({
        transactionHash: 'mock_tx_hash',
        events: [],
      }),
      queryContractSmart: jest.fn(),
    } as unknown as jest.Mocked<SigningCosmWasmClient>;
    
    // Create escrow client
    escrowClient = new EscrowClient(mockSigningClient, escrowAddress);
  });

  describe('Fee Querying', () => {
    test('getCollectedFees returns correct structure and values', async () => {
      // Mock the response for getCollectedFees
      const mockFeesResponse: CollectedFeesResponse = {
        owner: ownerAddress,
        fee_percentage: FEE_PERCENTAGE,
        collected_fees: [
          { denom: DENOM, amount: '50000' },
          { denom: IBC_DENOM, amount: '75000' }
        ]
      };
      
      mockSigningClient.queryContractSmart.mockResolvedValueOnce(mockFeesResponse);
      
      // Call the method
      const result = await escrowClient.getCollectedFees();
      
      // Verify the query was made correctly
      expect(mockSigningClient.queryContractSmart).toHaveBeenCalledWith(
        escrowAddress,
        { get_collected_fees: {} }
      );
      
      // Verify the returned data
      expect(result).toEqual(mockFeesResponse);
      expect(result.owner).toBe(ownerAddress);
      expect(result.fee_percentage).toBe(FEE_PERCENTAGE);
      expect(result.collected_fees).toHaveLength(2);
      expect(result.collected_fees[0].denom).toBe(DENOM);
      expect(result.collected_fees[0].amount).toBe('50000');
      expect(result.collected_fees[1].denom).toBe(IBC_DENOM);
      expect(result.collected_fees[1].amount).toBe('75000');
    });

    test('getCollectedFees returns empty array when no fees collected', async () => {
      // Mock the response for getCollectedFees with no fees
      const mockFeesResponse: CollectedFeesResponse = {
        owner: ownerAddress,
        fee_percentage: FEE_PERCENTAGE,
        collected_fees: []
      };
      
      mockSigningClient.queryContractSmart.mockResolvedValueOnce(mockFeesResponse);
      
      // Call the method
      const result = await escrowClient.getCollectedFees();
      
      // Verify the query
      expect(mockSigningClient.queryContractSmart).toHaveBeenCalledWith(
        escrowAddress,
        { get_collected_fees: {} }
      );
      
      // Verify empty fees array
      expect(result.collected_fees).toEqual([]);
      expect(result.collected_fees).toHaveLength(0);
    });
  });

  describe('Fee Claiming', () => {
    test('claimFees succeeds for contract owner', async () => {
      // Prepare and call the method
      const result = await escrowClient.claimFees(ownerAddress);
      
      // Verify the message was sent correctly
      expect(mockSigningClient.execute).toHaveBeenCalledWith(
        ownerAddress,
        escrowAddress,
        { claim_fees: {} },
        'auto',
        undefined,
        []
      );
      
      // Verify result
      expect(result).toBe('mock_tx_hash');
    });

    test('claimFees with specific denom claims only that denomination', async () => {
      // Prepare and call the method with specific denom
      const result = await escrowClient.claimFees(ownerAddress, DENOM);
      
      // Verify the message was sent correctly with denom specified
      expect(mockSigningClient.execute).toHaveBeenCalledWith(
        ownerAddress,
        escrowAddress,
        { claim_fees: { denom: DENOM } },
        'auto',
        undefined,
        []
      );
      
      // Verify result
      expect(result).toBe('mock_tx_hash');
    });

    test('claimFees fails when no fees to claim', async () => {
      // Mock execution failure for no fees scenario
      const errorMessage = 'No fees to claim for denom untrn';
      mockSigningClient.execute.mockRejectedValueOnce(new Error(errorMessage));
      
      // Call the method and expect it to fail
      await expect(escrowClient.claimFees(ownerAddress, DENOM)).rejects.toThrow(errorMessage);
      
      // Verify the message was attempted
      expect(mockSigningClient.execute).toHaveBeenCalledWith(
        ownerAddress,
        escrowAddress,
        { claim_fees: { denom: DENOM } },
        'auto',
        undefined,
        []
      );
    });
    
    test('claimFees fails for unauthorized sender', async () => {
      // Mock execution failure for unauthorized access
      const errorMessage = 'Unauthorized';
      mockSigningClient.execute.mockRejectedValueOnce(new Error(errorMessage));
      
      // Call the method with unauthorized address and expect it to fail
      await expect(escrowClient.claimFees(unauthorizedAddress)).rejects.toThrow(errorMessage);
      
      // Verify the message was attempted
      expect(mockSigningClient.execute).toHaveBeenCalledWith(
        unauthorizedAddress,
        escrowAddress,
        { claim_fees: {} },
        'auto',
        undefined,
        []
      );
    });
  });

  describe('Release Flow with Fee Collection', () => {
    test('releaseFunds with fee percentage correctly calculates platform fees', async () => {
      // For this test, we'd typically verify the calculation on the contract side
      // Since we're using mocks, we'll just verify the correct message is sent
      
      // Prepare and call the method
      const result = await escrowClient.releaseFunds(
        providerAddress,
        ESCROW_ID,
        USAGE_FEE
      );
      
      // Verify the message was sent correctly
      expect(mockSigningClient.execute).toHaveBeenCalledWith(
        providerAddress,
        escrowAddress,
        {
          release: {
            escrow_id: ESCROW_ID,
            usage_fee: USAGE_FEE
          }
        },
        'auto',
        undefined,
        []
      );
      
      // Verify result
      expect(result).toBe('mock_tx_hash');
      
      // In a real scenario, we'd verify:
      // 1. Provider received USAGE_FEE - platform_fee
      // 2. Contract accumulated platform_fee in collected_fees
      // 3. User was refunded MAX_FEE - USAGE_FEE
      // But this requires integration tests or more complex mocking
    });
  });
});