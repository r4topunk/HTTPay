# @cosmjs/cosmwasm-stargate Package Downgrade Fixes

This file documents the fixes implemented after downgrading the `@cosmjs/cosmwasm-stargate` package from version 0.33.1 to version 0.32.4.

## Overview

The provider-sdk package required a downgrade of the @cosmjs/cosmwasm-stargate dependency from version 0.33.1 to 0.32.4 for better compatibility with certain blockchain networks. This downgrade introduced type compatibility issues that needed to be resolved.

## Issue Details

After running `pnpm i @cosmjs/cosmwasm-stargate@0.32.4`, the build process failed with the following error:

```
src/utils/wallet.ts:122:85 - error TS2379: Argument of type 'SigningClientOptions' is not assignable to parameter of type 'SigningCosmWasmClientOptions' with 'exactOptionalPropertyTypes: true'. Consider adding 'undefined' to the types of the target's properties.
  The types of 'gasPrice.amount' are incompatible between these types.
    Type 'import("/Users/r4to/Script/cosmos/toolpay/packages/provider-sdk/node_modules/.pnpm/@cosmjs+math@0.33.1/node_modules/@cosmjs/math/build/decimal").Decimal' is not assignable to type 'import("/Users/r4to/Script/cosmos/toolpay/packages/provider-sdk/node_modules/.pnpm/@cosmjs+math@0.32.4/node_modules/@cosmjs/math/build/decimal").Decimal'.
      Types have separate declarations of a private property 'data'.
```

The issue was that the `Decimal` type used in `GasPrice` had changed between versions, causing a type mismatch in the `createSigningClientFromWallet` function in `wallet.ts`.

## Solution

The fix involved refactoring how we handle the client options when creating a `SigningCosmWasmClient`. Instead of creating a separate options object and then passing it to the client constructor, we now use a conditional approach:

1. If a gas price is provided, we create the client with the gas price option
2. If no gas price is provided, we create the client without any options

This avoids any type issues with undefined values and ensures proper type compatibility with the v0.32.4 API.

## Code Changes

The following changes were made in `packages/provider-sdk/src/utils/wallet.ts`:

```typescript
// Old code
const gasPriceValue = gasPrice ? GasPrice.fromString(gasPrice) : undefined;
const clientOptions: SigningClientOptions = {};
if (gasPriceValue) {
  clientOptions.gasPrice = gasPriceValue;
}
const client = await SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer, clientOptions);

// New code
const client = await (gasPrice
  ? SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer, { 
      gasPrice: GasPrice.fromString(gasPrice) 
    })
  : SigningCosmWasmClient.connectWithSigner(rpcEndpoint, signer));
```

## Verification

After implementing the fix, the build process completed successfully and all SDK functionality remains intact.

## Additional Notes

The downgrade was necessary for compatibility with certain blockchain networks that still use older versions of the CosmJS libraries. This approach preserves functionality while ensuring type safety.

For future updates, care should be taken when upgrading CosmJS dependencies as there might be breaking changes in the API or type definitions.
