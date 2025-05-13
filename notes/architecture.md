# Pay-Per-Tool Architecture Notes

This file summarizes the high-level architecture and design of the Pay-Per-Tool MVP, as described in project.md and blueprint.md.

## Key Components
1. **Registry Contract**: Manages tool registration and metadata
   - Providers register tools with pricing
   - Tools can be paused/resumed
   - Query interface for tool discovery
2. **Escrow Contract**: Handles fund locking and release
   - Users lock funds for tool usage
   - Providers verify usage and claim fees
   - Timeout mechanism for refunds
3. **Provider SDK**: TypeScript library for tool providers
   - Verification of escrows
   - Usage reporting and fee claiming

## Implementation Approach
- Follows a phased, chunked approach as outlined in blueprint.md
- Focuses first on contract development, then SDK, then frontend
- Each phase and chunk is documented in its own notes file
