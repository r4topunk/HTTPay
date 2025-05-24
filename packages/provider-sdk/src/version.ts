/**
 * SDK Version Information
 * 
 * This file contains version information for the HTTPay Provider SDK.
 * It's separated to avoid circular dependency issues.
 */

export const SDK_VERSION = '0.1.0';

export function getSDKInfo(): string {
  return `HTTPay Provider SDK v${SDK_VERSION}`;
}
