# Fetch Escrows Feature Implementation Plan

## Current Status: 🔄 NOT STARTED

**Progress**: 0/8 sections completed

**Last Updated**: May 25, 2025

### ⏳ Planned Sections:
- **15.1**: Escrow Contract GetEscrows Query Implementation (Core contract updates)
- **15.2**: Escrow Contract Tests Review and Updates
- **15.3**: New Escrow Contract Tests for GetEscrows Functionality 
- **15.4**: TypeScript SDK GetEscrows Support
- **15.5**: SDK Tests for GetEscrows
- **15.6**: SDK Version Management and Documentation
- **15.7**: Frontend EscrowsList Component Updates
- **15.8**: Testing and Quality Assurance

---

## Overview

This document contains the comprehensive implementation plan for adding a feature to fetch multiple escrows with filtering and pagination options to the Pay-Per-Tool MVP. This will enable users to efficiently search, filter, and display lists of escrows based on various criteria.

## Query Specifications

- **Query Name**: `GetEscrows`
- **Parameters**: 
  - `caller` (optional): Filter by caller address
  - `provider` (optional): Filter by provider address
  - `start_after` (optional): Pagination cursor (escrow ID)
  - `limit` (optional): Maximum number of items to return (default: 30)
- **Response**: List of escrow details

## Validation & Filtering Rules

1. **Pagination**: Support cursor-based pagination with `start_after` and `limit` parameters
2. **Filtering**: Support filtering by caller and/or provider addresses
3. **Ordering**: Return results in ascending order by escrow ID
4. **Limit**: Maximum of 30 escrows per query (default if not specified)

## Expected Behavior

1. Return all escrows if no filters provided (up to the limit)
2. Return only escrows that match all provided filters
3. Return empty list if no escrows match the criteria
4. For pagination, results start after the provided escrow ID

## Implementation Plan

### 15.1 Escrow Contract GetEscrows Query Implementation

#### Update QueryMsg enum in msg.rs
- [ ] Add `GetEscrows` variant to `QueryMsg` enum with filter and pagination parameters
- [ ] Create new `EscrowsResponse` struct for returning multiple escrow details
- [ ] Add proper documentation for the new query type and response

#### Implement query_escrows function in contract.rs
- [ ] Create `query_escrows` function to handle the new query
- [ ] Implement filtering logic for caller and provider addresses
- [ ] Add pagination support with start_after and limit parameters
- [ ] Implement proper error handling for invalid inputs
- [ ] Return properly formatted `EscrowsResponse` with matching escrows

#### Update query entry point to handle the new query
- [ ] Add a new match arm in the query function for `GetEscrows`
- [ ] Ensure proper routing to the new query handler
- [ ] Maintain backward compatibility for existing queries

### 15.2 Escrow Contract Tests Review and Updates

#### Review and update existing tests
- [ ] Ensure all existing tests continue to pass with the new query
- [ ] Update any tests that might be affected by the changes
- [ ] Check for any edge cases that need to be covered

### 15.3 New Escrow Contract Tests for GetEscrows Functionality

#### Create getEscrows_test.rs with comprehensive test coverage
- [ ] Test fetching all escrows (no filters) 
- [ ] Test pagination functionality (start_after and limit)
- [ ] Test filtering by caller address
- [ ] Test filtering by provider address
- [ ] Test combined filtering (caller + provider)
- [ ] Test empty results scenario
- [ ] Test with invalid parameters
- [ ] Test with edge cases (limit = 0, very large limit)

### 15.4 TypeScript SDK GetEscrows Support

#### Update Escrow types in types/escrow.ts
- [ ] Add new query type to `EscrowQueryMsg` union type
- [ ] Create `EscrowsResponse` interface for the query response
- [ ] Add proper JSDoc documentation for new types

#### Extend EscrowClient class in clients/EscrowClient.ts
- [ ] Implement `getEscrows` method with appropriate parameters
- [ ] Support optional filtering and pagination
- [ ] Add comprehensive error handling
- [ ] Maintain backward compatibility
- [ ] Add proper JSDoc documentation

#### Update HTTPaySDK class
- [ ] Add a helper method for the new query functionality
- [ ] Ensure proper error handling and parameter validation
- [ ] Add proper documentation

### 15.5 SDK Tests for GetEscrows

#### Create comprehensive tests for new functionality
- [ ] Test getEscrows with no parameters
- [ ] Test getEscrows with various filter combinations
- [ ] Test pagination functionality
- [ ] Test error handling for invalid parameters
- [ ] Test edge cases

### 15.6 SDK Version Management and Documentation

#### Update documentation
- [ ] Add documentation for the new feature in README files
- [ ] Update API documentation with examples
- [ ] Document any breaking changes or updates

#### Version management
- [ ] Determine appropriate version bump based on changes
- [ ] Update package.json version
- [ ] Update CHANGELOG.md with new feature details

### 15.7 Frontend EscrowsList Component Updates

#### Enhance EscrowsList component in httpay-website
- [ ] Update component to use the new getEscrows functionality
- [ ] Add filter controls for caller/provider addresses
- [ ] Implement pagination UI with "Load More" functionality
- [ ] Add filter reset functionality
- [ ] Add "My Escrows" shortcut for the connected wallet
- [ ] Update escrow display to show more details
- [ ] Handle loading states and error conditions

#### Update SDK context
- [ ] Add methods to support filtering and pagination
- [ ] Add state for filter parameters
- [ ] Preserve filter state between operations

### 15.8 Testing and Quality Assurance

#### Comprehensive testing
- [ ] Test contract functionality using LocalTerra
- [ ] Test SDK functionality with both real and mock data
- [ ] Verify frontend component works with all filter combinations
- [ ] Test pagination with various page sizes and data volumes
- [ ] Performance testing with large numbers of escrows

#### Quality check
- [ ] Verify all tests pass
- [ ] Check for any regressions in existing functionality
- [ ] Review error handling across all layers
- [ ] Ensure proper documentation is in place

## Code Samples

### Escrow Contract Query Implementation

```rust
fn query_escrows(
    deps: Deps,
    caller: Option<String>,
    provider: Option<String>,
    start_after: Option<u64>,
    limit: Option<u32>,
) -> StdResult<EscrowsResponse> {
    // Default limit if not provided, max 30
    let limit = limit.unwrap_or(30).min(30) as usize;
    
    // Convert address strings to Addr if provided
    let caller_addr = caller.map(|a| deps.api.addr_validate(&a))
        .transpose()?;
    let provider_addr = provider.map(|a| deps.api.addr_validate(&a))
        .transpose()?;
    
    // Start pagination after the given id if provided
    let start = start_after.map(|id| Bound::exclusive(id));
    
    // Query escrows from the Map
    let escrows: Vec<EscrowResponse> = ESCROWS
        .range(deps.storage, start, None, Order::Ascending)
        .take(limit)
        .filter_map(|item| {
            let (id, escrow) = item.ok()?;
            
            // Apply caller filter if provided
            if let Some(ref c) = caller_addr {
                if &escrow.caller != c {
                    return None;
                }
            }
            
            // Apply provider filter if provided
            if let Some(ref p) = provider_addr {
                if &escrow.provider != p {
                    return None;
                }
            }
            
            // Convert to response format
            Some(EscrowResponse {
                escrow_id: id,
                caller: escrow.caller,
                provider: escrow.provider,
                max_fee: escrow.max_fee,
                denom: escrow.denom,
                expires: escrow.expires,
                auth_token: escrow.auth_token,
            })
        })
        .collect();
    
    Ok(EscrowsResponse { escrows })
}
```

### TypeScript SDK Implementation

```typescript
/**
 * Query multiple escrows with optional filtering and pagination
 *
 * @param options - Optional query parameters
 * @param options.caller - Filter escrows where the user is the caller
 * @param options.provider - Filter escrows where the user is the provider
 * @param options.startAfter - Pagination: start after this escrow ID
 * @param options.limit - Maximum number of escrows to return (max 30)
 * @returns List of escrows matching the criteria
 */
async getEscrows(
  options?: {
    caller?: string;
    provider?: string;
    startAfter?: number;
    limit?: number;
  }
): Promise<EscrowsResponse> {
  const { caller, provider, startAfter, limit } = options || {};
  
  // Clean up undefined values
  const query: Record<string, any> = {
    get_escrows: {},
  };
  
  if (caller) query.get_escrows.caller = caller;
  if (provider) query.get_escrows.provider = provider;
  if (startAfter !== undefined) query.get_escrows.start_after = startAfter;
  if (limit !== undefined) query.get_escrows.limit = limit;
  
  return await this.client.queryContractSmart(this.contractAddress, query);
}
```

### Frontend Component Updates

```tsx
const EscrowsList = () => {
  const { escrows, loadEscrowsByFilter, walletAddress, loading } = useSDK();
  const [providerFilter, setProviderFilter] = useState<string>("");
  const [callerFilter, setCallerFilter] = useState<string>("");
  const [lastId, setLastId] = useState<number | undefined>(undefined);
  const [pageSize, setPageSize] = useState<number>(10);

  const applyFilters = () => {
    loadEscrowsByFilter({
      caller: callerFilter || undefined,
      provider: providerFilter || undefined,
      limit: pageSize,
    });
    setLastId(undefined); // Reset pagination when applying new filters
  };

  const loadNextPage = () => {
    if (escrows.length > 0) {
      const lastEscrowId = escrows[escrows.length - 1].escrow_id;
      setLastId(lastEscrowId);
      loadEscrowsByFilter({
        caller: callerFilter || undefined,
        provider: providerFilter || undefined,
        startAfter: lastEscrowId,
        limit: pageSize,
      });
    }
  };

  // Rest of the component implementation...
}
```

## Considerations and Best Practices

1. **Performance**: Be mindful of performance when querying large datasets; always use pagination
2. **Security**: Validate all inputs at contract level to prevent exploits
3. **User Experience**: Provide clear feedback during loading and error states
4. **Compatibility**: Ensure backward compatibility with existing clients
5. **Testing**: Thoroughly test with varying data volumes and filter combinations

This plan provides a comprehensive roadmap for implementing the GetEscrows feature across the contract, SDK, and frontend layers of the Pay-Per-Tool MVP.
