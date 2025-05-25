# Endpoint Field Implementation Plan

## Overview

This document contains the comprehensive implementation plan for adding endpoint field support to the Pay-Per-Tool MVP. The endpoint field will store the API endpoint URL that users will fetch to interact with each registered tool.

## Field Specifications

- **Field Name**: `endpoint`
- **Type**: `String`
- **Max Length**: 512 characters
- **Validation**: Basic URL format validation (starts with https://)
- **Required**: Yes (when registering tools)
- **Usage**: Stores the API endpoint URL that users will fetch to interact with the tool

## Validation Rules

1. **Length**: Must be ≤ 512 characters
2. **Format**: Must start with `https://`
3. **Required**: Cannot be empty when registering a tool
4. **Update Authorization**: Only the tool provider can update the endpoint

## Error Types

- `EndpointTooLong`: When endpoint exceeds 512 characters
- `InvalidEndpointFormat`: When endpoint doesn't match URL format requirements
- `Unauthorized`: When non-provider attempts to update endpoint

## Implementation Plan

### 14.1 Registry Contract Endpoint Field Implementation

#### Update ToolMeta struct in state.rs
- [ ] Add `endpoint: String` field to `ToolMeta` struct
- [ ] Add comprehensive validation for endpoint URLs (max 512 characters, basic URL format validation)
- [ ] Ensure backward compatibility with existing data

#### Update RegisterTool message and handler
- [ ] Add `endpoint: String` parameter to `RegisterTool` message in `msg.rs`
- [ ] Update `execute_register_tool` handler to validate and store endpoint
- [ ] Add endpoint validation logic (URL format, length constraints)
- [ ] Update response attributes to include endpoint information

#### Add UpdateEndpoint message and handler
- [ ] Create `UpdateEndpoint` message type in `msg.rs`
- [ ] Implement `execute_update_endpoint` handler function in `contract.rs`
- [ ] Add proper authorization checks (only tool provider can update)
- [ ] Include endpoint validation logic
- [ ] Add response attributes for update confirmation

#### Update query responses
- [ ] Add `endpoint` field to `ToolResponse` struct in `msg.rs`
- [ ] Update `query_tool` function to include endpoint in responses
- [ ] Update `query_all_tools` function to include endpoint for all tools
- [ ] Ensure all query responses include the new field

#### Add validation and error handling
- [ ] Create `EndpointTooLong` error type in `error.rs`
- [ ] Create `InvalidEndpointFormat` error type in `error.rs`
- [ ] Implement URL format validation helper function
- [ ] Add proper error handling in all endpoint-related operations

#### Update contract execute message matching
- [ ] Add `UpdateEndpoint` case to execute function pattern matching
- [ ] Ensure proper message routing to handler function

### 14.2 Registry Contract Tests Review and Updates

#### Update existing tests for endpoint field
- [ ] Update `register_tool_success.rs` test to include endpoint field
- [ ] Update `query_tool_functionality.rs` test to verify endpoint in responses
- [ ] Update `query_all_tools.rs` test to verify endpoint in all tool responses
- [ ] Update `update_price_success.rs` test assertions for new field presence
- [ ] Update `pause_resume_tool.rs` test to handle endpoint field
- [ ] Update `update_denom_test.rs` test to include endpoint verification
- [ ] Update all integration tests in escrow contract that use Registry

#### Review and update test helper functions
- [ ] Update `register_tool` helper function in `setup_contract.rs` to accept endpoint parameter
- [ ] Update mock data and test constants to include sample endpoints
- [ ] Ensure all test registrations include valid endpoint data

### 14.3 New Registry Contract Tests for Endpoint Functionality

#### Create endpoint-specific test files
- [ ] Create `update_endpoint_test.rs` with comprehensive endpoint update tests:
  - [ ] Test successful endpoint update by authorized provider
  - [ ] Test unauthorized endpoint update attempts
  - [ ] Test endpoint update with invalid URL format
  - [ ] Test endpoint update with excessively long URL
  - [ ] Test endpoint update for non-existent tool

#### Create endpoint validation test files
- [ ] Create `register_tool_invalid_endpoint.rs` with endpoint validation tests:
  - [ ] Test tool registration with endpoint exceeding 512 characters
  - [ ] Test tool registration with malformed URL endpoint
  - [ ] Test tool registration with empty endpoint string
  - [ ] Verify proper error types are returned

#### Create endpoint query test files
- [ ] Create `query_endpoint_functionality.rs` with endpoint query tests:
  - [ ] Test endpoint field presence in single tool queries
  - [ ] Test endpoint field presence in all tools queries
  - [ ] Test endpoint persistence after tool updates
  - [ ] Verify endpoint data integrity across operations

### 14.4 TypeScript SDK Endpoint Support

#### Update Registry contract types
- [ ] Add `endpoint: string` field to `ToolResponse` interface in `registry.ts`
- [ ] Add `endpoint: string` parameter to `register_tool` message type
- [ ] Create `update_endpoint` message type in `RegistryExecuteMsg` union
- [ ] Add comprehensive JSDoc documentation for endpoint field

#### Update RegistryClient class
- [ ] Add `endpoint` parameter to `registerTool` method in `RegistryClient.ts`
- [ ] Create new `updateEndpoint` method in `RegistryClient.ts`
- [ ] Update method signatures and parameter validation
- [ ] Add endpoint-specific error handling and validation
- [ ] Update existing method documentation

#### Update Escrow contract interfaces (if needed)
- [ ] Review if escrow contract needs to access endpoint data
- [ ] Update `registry_interface.rs` in escrow contract if needed
- [ ] Ensure compatibility between contracts

### 14.5 SDK Tests Review and Updates

#### Update existing SDK tests
- [ ] Update registry client tests to include endpoint parameters
- [ ] Update tool registration tests to verify endpoint handling
- [ ] Update query tests to check endpoint field presence
- [ ] Update integration tests for endpoint data flow

#### Create new endpoint-specific SDK tests
- [ ] Test endpoint validation in client methods
- [ ] Test updateEndpoint method functionality
- [ ] Test endpoint data persistence through SDK operations
- [ ] Test error handling for invalid endpoints

### 14.6 SDK Version Management and NPM Publishing

#### Prepare SDK for release
- [ ] Update version number in `package.json` (minor version bump)
- [ ] Update `CHANGELOG.md` with endpoint feature details
- [ ] Update README.md with endpoint usage examples
- [ ] Review and update TypeScript type exports

#### NPM Publishing process
- [ ] Run comprehensive test suite to ensure no regressions
- [ ] Build and verify package integrity
- [ ] Publish new version to NPM registry
- [ ] Update version tags in git repository
- [ ] Verify package installation and functionality

### 14.7 Frontend Debug Page Updates

#### Update tool registration interface
- [ ] Add endpoint input field to ToolRegistration component
- [ ] Add endpoint validation on frontend
- [ ] Update form submission to include endpoint data
- [ ] Add helpful placeholder text and validation messages

#### Update tools display interface
- [ ] Add endpoint display to ToolsList component
- [ ] Make endpoint clickable/copyable for easy access
- [ ] Add endpoint editing capability in tool management
- [ ] Update tool details view to prominently show endpoint

#### Update tool management interface
- [ ] Add endpoint update functionality to existing tool management
- [ ] Create endpoint update form with validation
- [ ] Add confirmation dialogs for endpoint changes
- [ ] Update error handling and user feedback

#### Enhance user experience
- [ ] Add endpoint format validation hints
- [ ] Add copy-to-clipboard functionality for endpoints
- [ ] Add visual indicators for endpoint validity
- [ ] Update help text and documentation links

### 14.8 Documentation and Integration

#### Update contract documentation
- [ ] Update `project.md` specification with endpoint field details
- [ ] Add endpoint field to architecture diagrams
- [ ] Update API documentation with endpoint examples
- [ ] Document endpoint validation rules and constraints

#### Update SDK documentation
- [ ] Add endpoint examples to README.md
- [ ] Update API reference documentation
- [ ] Add endpoint-specific usage patterns
- [ ] Update troubleshooting guide for endpoint issues

#### Create migration guide
- [ ] Document how existing users should handle the new endpoint field
- [ ] Provide migration examples for different use cases
- [ ] Update integration tutorials
- [ ] Add backward compatibility notes

### 14.9 Testing and Quality Assurance

#### Comprehensive testing strategy
- [ ] Run full contract test suite with endpoint functionality
- [ ] Execute integration tests between contracts
- [ ] Verify SDK functionality with real blockchain interaction
- [ ] Test frontend integration end-to-end

#### Performance and validation testing
- [ ] Test endpoint validation performance with various URL formats
- [ ] Verify gas consumption impact of additional field
- [ ] Test edge cases and boundary conditions
- [ ] Validate error handling across all components

#### User acceptance testing
- [ ] Test endpoint registration workflow from start to finish
- [ ] Verify endpoint update functionality
- [ ] Test endpoint data retrieval and usage
- [ ] Validate user interface usability

### 14.10 Deployment and Release

#### Contract deployment
- [ ] Deploy updated Registry contract to testnet
- [ ] Verify contract functionality in live environment
- [ ] Update contract addresses in configuration
- [ ] Test contract interaction through SDK

#### Release coordination
- [ ] Coordinate contract deployment with SDK release
- [ ] Update frontend to use new contract addresses
- [ ] Notify users of new endpoint functionality
- [ ] Monitor for any issues post-deployment

## Summary of Changes

### SDK Changes Summary
- New `endpoint` parameter in `registerTool()` method
- New `updateEndpoint()` method for endpoint updates
- Updated `ToolResponse` interface to include endpoint field
- Enhanced validation and error handling

### Frontend Changes Summary
- Endpoint input field in tool registration form
- Endpoint display and management in tools list
- Endpoint update functionality with validation
- Enhanced user experience with copy/paste and validation helpers

## Implementation Notes

This implementation adds comprehensive endpoint field support across all components of the Pay-Per-Tool MVP system. The endpoint field enables users to discover and interact with tool APIs while maintaining proper validation and security measures.

The implementation follows the existing patterns and conventions established in the codebase, ensuring consistency and maintainability. All changes are backward compatible and include comprehensive testing to ensure system reliability.
