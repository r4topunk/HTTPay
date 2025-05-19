/**
 * Tests for multi-denomination token support in the provider SDK
 */
import { SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { RegistryClient } from '../src/clients/RegistryClient';
import { EscrowClient } from '../src/clients/EscrowClient';

// Mock implementations to allow testing without actual blockchain
jest.mock('@cosmjs/cosmwasm-stargate');
jest.mock('@cosmjs/proto-signing');

describe('Multi-Denomination Support', () => {
  // Common test variables
  const registryAddress = 'neutron14hj2tavq8fpesdwxxcu44rty3hh90vhujrvcmstl4zr3txmfvw9s0k0pqz';
  const escrowAddress = 'neutron1nc5tatafv6eyq7llkr2gv50ff9e22mnf70qgjlv737ktmt4eswrqhnc3f9';
  const senderAddress = 'neutron1h9gmqs5wh0hd9tfr5dtaet5q9jafym8qzegds7';
  
  // Constants for test scenarios
  const NATIVE_DENOM = 'untrn';
  const IBC_DENOM = 'ibc/ABCDEF0123456789';
  const TOOL_ID = 'multi_denom_tool';
  const PRICE = '100';
  
  let mockSigningClient: jest.Mocked<SigningCosmWasmClient>;
  let registryClient: RegistryClient;
  let escrowClient: EscrowClient;
  
  beforeEach(() => {
    // Reset and setup mocks
    jest.clearAllMocks();
    
    // Create mock signing client
    mockSigningClient = {
      execute: jest.fn().mockResolvedValue({
        transactionHash: 'mock_tx_hash',
        events: [
          {
            type: 'wasm',
            attributes: [
              { key: 'escrow_id', value: '123' },
              { key: 'denom', value: IBC_DENOM }
            ]
          }
        ]
      }),
      queryContractSmart: jest.fn(),
      getChainId: jest.fn().mockResolvedValue('mock-chain-id'),
    } as unknown as jest.Mocked<SigningCosmWasmClient>;
    
    // Create clients
    registryClient = new RegistryClient(mockSigningClient, registryAddress);
    escrowClient = new EscrowClient(mockSigningClient, escrowAddress);
  });
  
  describe('RegistryClient', () => {
    test('registerTool should support custom denomination', async () => {
      const customDenom = IBC_DENOM;
      
      await registryClient.registerTool(
        senderAddress,
        TOOL_ID,
        PRICE,
        "Tool description",  // Description parameter
        customDenom,         // Denom parameter
        [{ amount: '0', denom: NATIVE_DENOM }] // Funds parameter
      );
      
      // Verify the correct message was sent
      expect(mockSigningClient.execute).toHaveBeenCalledWith(
        senderAddress,
        registryAddress,
        {
          register_tool: {
            tool_id: TOOL_ID,
            price: PRICE,
            description: "Tool description",
            denom: customDenom
          }
        },
        'auto',
        undefined,
        [{ amount: '0', denom: NATIVE_DENOM }]
      );
    });
    
    test('updateDenom should send correct message', async () => {
      const customDenom = IBC_DENOM;
      
      await registryClient.updateDenom(
        senderAddress,
        TOOL_ID,
        customDenom
      );
      
      // Verify the correct message was sent
      expect(mockSigningClient.execute).toHaveBeenCalledWith(
        senderAddress,
        registryAddress,
        {
          update_denom: {
            tool_id: TOOL_ID,
            denom: customDenom
          }
        },
        'auto',
        undefined,
        []
      );
    });
    
    test('getTool should return the denom information', async () => {
      // Mock the query response
      mockSigningClient.queryContractSmart.mockResolvedValueOnce({
        tool_id: TOOL_ID,
        provider: senderAddress,
        price: PRICE,
        denom: IBC_DENOM,
        is_active: true
      });
      
      const result = await registryClient.getTool(TOOL_ID);
      
      // Verify the response contains the denom
      expect(result.denom).toBe(IBC_DENOM);
    });
  });
  
  describe('EscrowClient', () => {
    test('lockFunds should return denom information', async () => {
      const result = await escrowClient.lockFunds(
        senderAddress,
        TOOL_ID,
        PRICE,
        'test_auth_token',
        100,
        [{ amount: PRICE, denom: IBC_DENOM }]
      );
      
      // Verify the result includes denom
      expect(result.denom).toBe(IBC_DENOM);
    });
    
    test('getEscrow should return denom information', async () => {
      // Mock the query response
      mockSigningClient.queryContractSmart.mockResolvedValueOnce({
        escrow_id: 123,
        caller: senderAddress,
        provider: 'provider_address',
        max_fee: PRICE,
        auth_token: 'test_auth_token',
        expires: 100,
        denom: IBC_DENOM
      });
      
      const result = await escrowClient.getEscrow(123);
      
      // Verify the response contains the denom
      expect(result.denom).toBe(IBC_DENOM);
    });
  });
});
