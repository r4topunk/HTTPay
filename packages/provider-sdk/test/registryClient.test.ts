import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { RegistryClient } from '../src/clients/RegistryClient';

// Mock CosmWasmClient
const mockQueryContractSmart = jest.fn();
const mockClient = {
  queryContractSmart: mockQueryContractSmart,
} as unknown as CosmWasmClient;

const mockContractAddress = 'neutron12345';

describe('RegistryClient', () => {
  let client: RegistryClient;

  beforeEach(() => {
    // Reset mock before each test
    jest.resetAllMocks();

    // Create new client instance
    client = new RegistryClient(mockClient, mockContractAddress);
  });

  describe('getTool', () => {
    it('should query a tool by ID and return the response', async () => {
      // Mock response
      const mockToolResponse = {
        tool_id: 'test-tool',
        provider: 'neutron1provider',
        price: '100',
        denom: 'untrn',
        is_active: true,
        description: 'Test tool description',
      };
      
      mockQueryContractSmart.mockResolvedValueOnce(mockToolResponse);
      
      // Call the method
      const result = await client.getTool('test-tool');
      
      // Verify the query was called with correct params
      expect(mockQueryContractSmart).toHaveBeenCalledWith(
        mockContractAddress,
        { get_tool: { tool_id: 'test-tool' } }
      );
      
      // Verify result
      expect(result).toEqual(mockToolResponse);
    });

    it('should throw an error when tool is not found', async () => {
      // Mock error response
      mockQueryContractSmart.mockRejectedValueOnce(new Error('No such tool'));
      
      // Call the method and expect error
      await expect(client.getTool('nonexistent')).rejects.toThrow(
        "Tool 'nonexistent' not found in registry"
      );
    });
  });

  describe('getTools', () => {
    it('should query all tools and return the response', async () => {
      // Mock response with multiple tools
      const mockToolsResponse = {
        tools: [
          {
            tool_id: 'tool-1',
            provider: 'neutron1provider1',
            price: '100',
            denom: 'untrn',
            is_active: true,
            description: 'Tool 1 description',
          },
          {
            tool_id: 'tool-2',
            provider: 'neutron1provider2',
            price: '200',
            denom: 'uatom',
            is_active: true,
            description: 'Tool 2 description',
          },
          {
            tool_id: 'tool-3',
            provider: 'neutron1provider1',
            price: '300',
            denom: 'untrn',
            is_active: false,
            description: 'Tool 3 description',
          },
        ],
      };
      
      mockQueryContractSmart.mockResolvedValueOnce(mockToolsResponse);
      
      // Call the method
      const result = await client.getTools();
      
      // Verify the query was called with correct params
      expect(mockQueryContractSmart).toHaveBeenCalledWith(
        mockContractAddress,
        { get_tools: {} }
      );
      
      // Verify result
      expect(result).toEqual(mockToolsResponse);
      expect(result.tools.length).toBe(3);
    });

    it('should handle an empty tools list', async () => {
      // Mock response with no tools
      const mockEmptyResponse = {
        tools: [],
      };
      
      mockQueryContractSmart.mockResolvedValueOnce(mockEmptyResponse);
      
      // Call the method
      const result = await client.getTools();
      
      // Verify result
      expect(result.tools).toEqual([]);
      expect(result.tools.length).toBe(0);
    });

    it('should throw an error when query fails', async () => {
      // Mock error response
      mockQueryContractSmart.mockRejectedValueOnce(new Error('Network error'));
      
      // Call the method and expect error
      await expect(client.getTools()).rejects.toThrow('Network error');
    });
  });
});
