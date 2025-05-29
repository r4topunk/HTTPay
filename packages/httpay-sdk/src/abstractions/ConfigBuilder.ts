import type { HTTPayConfig, ToolConfig } from './types';

/**
 * Environment-based configuration utility
 */
export class HTTPayConfigBuilder {
  private config: Partial<HTTPayConfig> = {};
  private tool: Partial<ToolConfig> = {};

  /**
   * Load configuration from environment variables
   */
  static fromEnvironment(): HTTPayConfigBuilder {
    const builder = new HTTPayConfigBuilder();
    
    // Load HTTPay config from environment
    if (process.env.NEXT_PUBLIC_RPC_ENDPOINT) {
      builder.config.rpcEndpoint = process.env.NEXT_PUBLIC_RPC_ENDPOINT;
    }
    if (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS) {
      builder.config.registryAddress = process.env.NEXT_PUBLIC_REGISTRY_ADDRESS;
    }
    if (process.env.NEXT_PUBLIC_ESCROW_ADDRESS) {
      builder.config.escrowAddress = process.env.NEXT_PUBLIC_ESCROW_ADDRESS;
    }
    if (process.env.NEXT_PUBLIC_CHAIN_ID) {
      builder.config.chainId = process.env.NEXT_PUBLIC_CHAIN_ID;
    }
    if (process.env.NEXT_PUBLIC_GAS_PRICE) {
      builder.config.gasPrice = process.env.NEXT_PUBLIC_GAS_PRICE;
    }

    // Load tool config from environment
    if (process.env.CLIENT_PRIVATE_KEY) {
      builder.tool.provider = {
        privateKey: process.env.CLIENT_PRIVATE_KEY
      };
    }

    return builder;
  }

  /**
   * Set RPC endpoint
   */
  rpcEndpoint(endpoint: string): HTTPayConfigBuilder {
    this.config.rpcEndpoint = endpoint;
    return this;
  }

  /**
   * Set contract addresses
   */
  contracts(registryAddress: string, escrowAddress: string): HTTPayConfigBuilder {
    this.config.registryAddress = registryAddress;
    this.config.escrowAddress = escrowAddress;
    return this;
  }

  /**
   * Set chain configuration
   */
  chain(chainId: string, gasPrice?: string, gasAdjustment?: number): HTTPayConfigBuilder {
    this.config.chainId = chainId;
    if (gasPrice) this.config.gasPrice = gasPrice;
    if (gasAdjustment) this.config.gasAdjustment = gasAdjustment;
    return this;
  }

  /**
   * Set tool configuration
   */
  setTool(toolId: string, privateKey: string): HTTPayConfigBuilder {
    this.tool.toolId = toolId;
    this.tool.provider = { privateKey };
    return this;
  }

  /**
   * Build the final configuration objects
   */
  build(): { config: HTTPayConfig; tool: ToolConfig } {
    // Validate required fields
    const requiredConfigFields: (keyof HTTPayConfig)[] = [
      'rpcEndpoint', 'registryAddress', 'escrowAddress'
    ];
    
    for (const field of requiredConfigFields) {
      if (!this.config[field]) {
        throw new Error(`Missing required config field: ${field}`);
      }
    }

    if (!this.tool.toolId) {
      throw new Error('Missing required tool field: toolId');
    }

    if (!this.tool.provider?.privateKey) {
      throw new Error('Missing required tool field: provider.privateKey');
    }

    return {
      config: {
        rpcEndpoint: this.config.rpcEndpoint!,
        registryAddress: this.config.registryAddress!,
        escrowAddress: this.config.escrowAddress!,
        chainId: this.config.chainId || 'pion-1',
        gasPrice: this.config.gasPrice || '0.025untrn',
        gasAdjustment: this.config.gasAdjustment || 1.3
      },
      tool: {
        toolId: this.tool.toolId!,
        provider: this.tool.provider!
      }
    };
  }
}

/**
 * Preset configurations for common networks
 */
export const HTTPayPresets = {
  neutronTestnet: {
    rpcEndpoint: "https://rpc-falcron.pion-1.ntrn.tech",
    chainId: "pion-1",
    gasPrice: "0.0053untrn",
    gasAdjustment: 1.3,
    // Contract addresses would need to be provided
    registryAddress: "",
    escrowAddress: ""
  },
  
  neutronMainnet: {
    rpcEndpoint: "https://neutron-rpc.publicnode.com",
    chainId: "neutron-1",
    gasPrice: "0.0053untrn", 
    gasAdjustment: 1.3,
    // Contract addresses would need to be provided
    registryAddress: "",
    escrowAddress: ""
  }
} as const;

/**
 * Quick configuration helper
 */
export function createHTTPPayConfig(preset: keyof typeof HTTPayPresets, addresses: {
  registryAddress: string;
  escrowAddress: string;
}): HTTPayConfig {
  return {
    ...HTTPayPresets[preset],
    ...addresses
  };
}
