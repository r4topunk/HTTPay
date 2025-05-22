# Fee Collection Feature Implementation

This document describes the implementation of the fee collection feature in the Pay-Per-Tool escrow contract.

## Overview

The fee collection feature allows the escrow contract to collect a percentage of every tool usage payment. The collected fees can then be claimed by the contract owner. This provides a sustainable business model for the platform.

## Key Components

1. **Contract Owner**: The account that instantiated the escrow contract is set as the owner and has exclusive rights to claim collected fees.

2. **Fee Percentage**: A configurable percentage (0-100) set at contract instantiation that determines how much of each tool usage payment goes to the platform.

3. **Fee Collection**: When a provider releases an escrow, a percentage of the usage fee is automatically withheld as a platform fee.

4. **Fee Claiming**: The contract owner can claim the accumulated fees at any time.

## Implementation Details

### State Changes

The `Config` struct in `state.rs` was extended to include:
- `owner: Addr`: The contract owner's address (set during instantiation)
- `fee_percentage: u64`: The percentage of each payment to collect (0-100)
- `collected_fees: Vec<(String, Uint128)>`: A vector storing collected fees by denomination

### Message Changes

Added new messages:
- `ExecuteMsg::ClaimFees`: Allows the owner to withdraw collected fees
- `QueryMsg::GetCollectedFees`: Returns information about collected fees

Added new response type:
- `CollectedFeesResponse`: Contains owner address, fee percentage, and collected fees

### Error Types

Added new errors:
- `InvalidFeePercentage`: When fee percentage is not between 0 and 100
- `NoFeesToClaim`: When there are no fees to claim for a specific denomination

### Release Function Enhancements

The `release` function was enhanced to:
1. Calculate the platform fee based on the usage fee and fee percentage
2. Deduct the platform fee from the provider payment
3. Update the collected fees in the contract's state

### Claim Fees Function

A new `claim_fees` function was implemented to:
1. Verify the caller is the contract owner
2. Transfer collected fees to the owner
3. Clear the claimed fees from state
4. Optionally support claiming fees for a specific denomination

## Testing

Comprehensive tests were added in `fee_collection_test.rs` to validate:
- Fee calculation and collection during escrow release
- Fee accumulation across multiple escrow releases
- Unauthorized claim attempts
- Invalid fee percentage validation

## Usage

1. **Contract Instantiation**:
   ```rust
   InstantiateMsg {
       registry_addr: "neutron1...",
       fee_percentage: 5, // 5% fee
   }
   ```

2. **Claiming Fees** (owner only):
   ```rust
   ExecuteMsg::ClaimFees {
       denom: Some("untrn"), // Claim for specific denom, or None for all
   }
   ```

3. **Querying Collected Fees**:
   ```rust
   QueryMsg::GetCollectedFees {}
   ```

## Security Considerations

- Only the contract owner can claim fees
- Fee percentage is validated at instantiation time
- Comprehensive error handling prevents unauthorized access
- Fee calculations use checked math to prevent overflows