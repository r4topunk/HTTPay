import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { CosmWasmClient, SigningCosmWasmClient } from '@cosmjs/cosmwasm-stargate';
import { RegistryClient } from '../src/clients/RegistryClient';

// Mock CosmWasmClient
const mockQueryContractSmart = jest.fn();
const mockExecute = jest.fn();
const mockClient = {
  queryContractSmart: mockQueryContractSmart,
} as unknown as CosmWasmClient;

// Mock SigningCosmWasmClient
const mockSigningClient = {
  queryContractSmart: mockQueryContractSmart,
  execute: mockExecute,
} as unknown as SigningCosmWasmClient;

const mockContractAddress = 'neutron12345';

describe('RegistryClient', () => {
  let client: RegistryClient;
  let signingClient: RegistryClient;

  beforeEach(() => {
    // Reset mock before each test
    jest.resetAllMocks();

    // Create new client instances
    client = new RegistryClient(mockClient, mockContractAddress);
    signingClient = new RegistryClient(mockSigningClient, mockContractAddress);
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
        endpoint: 'https://api.example.com/test-tool',
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
      expect(result.endpoint).toBe('https://api.example.com/test-tool');
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
            endpoint: 'https://api.example.com/tool-1',
          },
          {
            tool_id: 'tool-2',
            provider: 'neutron1provider2',
            price: '200',
            denom: 'uatom',
            is_active: true,
            description: 'Tool 2 description',
            endpoint: 'https://api.example.com/tool-2',
          },
          {
            tool_id: 'tool-3',
            provider: 'neutron1provider1',
            price: '300',
            denom: 'untrn',
            is_active: false,
            description: 'Tool 3 description',
            endpoint: 'https://api.example.com/tool-3',
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
      expect(result.tools[0].endpoint).toBe('https://api.example.com/tool-1');
      expect(result.tools[1].endpoint).toBe('https://api.example.com/tool-2');
      expect(result.tools[2].endpoint).toBe('https://api.example.com/tool-3');
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

  describe('registerTool with endpoint', () => {
    it('should register a tool with endpoint parameter', async () => {
      const mockTransactionHash = 'mock-tx-hash';
      mockExecute.mockResolvedValueOnce({ transactionHash: mockTransactionHash });

      const result = await signingClient.registerTool(
        'neutron1sender',
        'test-tool',
        '1000',
        'Test tool description',
        'https://api.example.com/test-tool',
        'untrn'
      );

      expect(mockExecute).toHaveBeenCalledWith(
        'neutron1sender',
        mockContractAddress,
        {
          register_tool: {
            tool_id: 'test-tool',
            price: '1000',
            description: 'Test tool description',
            endpoint: 'https://api.example.com/test-tool',
            denom: 'untrn',
          },
        },
        'auto',
        undefined,
        []
      );

      expect(result).toBe(mockTransactionHash);
    });

    it('should register a tool with endpoint without optional denom', async () => {
      const mockTransactionHash = 'mock-tx-hash';
      mockExecute.mockResolvedValueOnce({ transactionHash: mockTransactionHash });

      const result = await signingClient.registerTool(
        'neutron1sender',
        'test-tool',
        '1000',
        'Test tool description',
        'https://api.example.com/test-tool'
      );

      expect(mockExecute).toHaveBeenCalledWith(
        'neutron1sender',
        mockContractAddress,
        {
          register_tool: {
            tool_id: 'test-tool',
            price: '1000',
            description: 'Test tool description',
            endpoint: 'https://api.example.com/test-tool',
          },
        },
        'auto',
        undefined,
        []
      );

      expect(result).toBe(mockTransactionHash);
    });

    it('should throw error when using non-signing client', async () => {
      await expect(
        client.registerTool(
          'neutron1sender',
          'test-tool',
          '1000',
          'Test tool description',
          'https://api.example.com/test-tool'
        )
      ).rejects.toThrow('This method requires a signing client');
    });
  });

  describe('updateEndpoint', () => {
    it('should update tool endpoint successfully', async () => {
      const mockTransactionHash = 'mock-tx-hash';
      mockExecute.mockResolvedValueOnce({ transactionHash: mockTransactionHash });

      const result = await signingClient.updateEndpoint(
        'neutron1sender',
        'test-tool',
        'https://api.example.com/new-endpoint'
      );

      expect(mockExecute).toHaveBeenCalledWith(
        'neutron1sender',
        mockContractAddress,
        {
          update_endpoint: {
            tool_id: 'test-tool',
            endpoint: 'https://api.example.com/new-endpoint',
          },
        },
        'auto',
        undefined,
        []
      );

      expect(result).toBe(mockTransactionHash);
    });

    it('should update tool endpoint with custom funds', async () => {
      const mockTransactionHash = 'mock-tx-hash';
      const customFunds = [{ denom: 'untrn', amount: '100' }];
      mockExecute.mockResolvedValueOnce({ transactionHash: mockTransactionHash });

      const result = await signingClient.updateEndpoint(
        'neutron1sender',
        'test-tool',
        'https://api.example.com/new-endpoint',
        customFunds
      );

      expect(mockExecute).toHaveBeenCalledWith(
        'neutron1sender',
        mockContractAddress,
        {
          update_endpoint: {
            tool_id: 'test-tool',
            endpoint: 'https://api.example.com/new-endpoint',
          },
        },
        'auto',
        undefined,
        customFunds
      );

      expect(result).toBe(mockTransactionHash);
    });

    it('should throw error when using non-signing client', async () => {
      await expect(
        client.updateEndpoint(
          'neutron1sender',
          'test-tool',
          'https://api.example.com/new-endpoint'
        )
      ).rejects.toThrow('This method requires a signing client');
    });
  });

  describe('endpoint validation in queries', () => {
    it('should verify endpoint field presence in single tool query', async () => {
      const mockToolResponse = {
        tool_id: 'test-tool',
        provider: 'neutron1provider',
        price: '100',
        denom: 'untrn',
        is_active: true,
        description: 'Test tool description',
        endpoint: 'https://api.example.com/test-tool',
      };

      mockQueryContractSmart.mockResolvedValueOnce(mockToolResponse);

      const result = await client.getTool('test-tool');

      expect(result).toHaveProperty('endpoint');
      expect(result.endpoint).toBe('https://api.example.com/test-tool');
      expect(typeof result.endpoint).toBe('string');
    });

    it('should verify endpoint field presence in all tools query', async () => {
      const mockToolsResponse = {
        tools: [
          {
            tool_id: 'tool-1',
            provider: 'neutron1provider1',
            price: '100',
            denom: 'untrn',
            is_active: true,
            description: 'Tool 1 description',
            endpoint: 'https://api.example.com/tool-1',
          },
          {
            tool_id: 'tool-2',
            provider: 'neutron1provider2',
            price: '200',
            denom: 'uatom',
            is_active: false,
            description: 'Tool 2 description',
            endpoint: 'https://api.example.com/tool-2',
          },
        ],
      };

      mockQueryContractSmart.mockResolvedValueOnce(mockToolsResponse);

      const result = await client.getTools();

      expect(result.tools).toHaveLength(2);
      result.tools.forEach((tool, index) => {
        expect(tool).toHaveProperty('endpoint');
        expect(typeof tool.endpoint).toBe('string');
        expect(tool.endpoint).toBe(`https://api.example.com/tool-${index + 1}`);
      });
    });
  });
});
