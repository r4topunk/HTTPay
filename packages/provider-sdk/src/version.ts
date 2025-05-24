/**
 * SDK Version Information
 * 
 * This file contains version information for the PayPerTool Provider SDK.
 * It's separated to avoid circular dependency issues.
 */

export const SDK_VERSION = '0.1.0';

export function getSDKInfo(): string {
  return `PayPerTool Provider SDK v${SDK_VERSION}`;
}
