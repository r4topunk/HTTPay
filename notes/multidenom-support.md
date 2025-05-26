# Multi-Denomination Token Support Implementation

This file documents the implementation of multi-denomination token support in the HTTPay contracts and SDK.

## Overview

The HTTPay system was extended to support any valid IBC token as payment, in addition to the native `untrn` token. This involved changes to both the Registry and Escrow contracts, as well as the TypeScript SDK.

## Registry Contract Changes

1. **ToolMeta Struct**: Added a `denom: String` field to track the token denomination for each tool.
2. **RegisterTool Message**: Updated to accept an optional `denom` parameter, defaulting to "untrn" if not provided.
3. **UpdateDenom Message**: Added a new message type to allow tool providers to update the denomination of their tools.
4. **Query Responses**: Updated to include the denom field in tool responses.

## Escrow Contract Changes

1. **Escrow Struct**: Added a `denom: String` field to track the token denomination for each escrow.
2. **LockFunds**:
   - Now queries the tool's required denom from the registry
   - Validates that the attached funds include the correct denom
   - Stores the denom in the escrow record
3. **Release/Refund**:
   - Now uses the stored denom for all BankMsg transfers
   - Events and responses include denom
4. **Error Handling**:
   - Added `NoDenomFunds` error
   - Added `WrongDenom` error
5. **Events**:
   - Added denom attribute to relevant events
6. **Responses**:
   - Updated LockFundsResponse to include denom

## TypeScript SDK Changes

1. **Registry Client**:
   - Updated to support denom in RegisterTool method
   - Added new UpdateDenom method
   - Expanded ToolResponse interface to include denom
2. **Escrow Client**:
   - Updated LockFundsResult to include denom field
   - Enhanced lockFunds to extract denom from response
   - EscrowResponse interface updated to include denom

## Migration Considerations

For existing tools that don't have a denom field, we defaulted to "untrn" for backward compatibility.

## Testing

Tests should include:
1. Registering tools with different denoms
2. Locking funds with various IBC tokens
3. Validating error handling for wrong denoms
4. Ensuring the correct denom flows through the entire system

## Conclusion

The HTTPay system now supports any valid IBC token, expanding its utility across the Cosmos ecosystem while maintaining backward compatibility with the native token.
