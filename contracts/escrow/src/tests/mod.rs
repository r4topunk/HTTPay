//! # Test Module for Escrow Contract
//! 
//! This module contains all tests for the Escrow contract functionality.
//! It imports and organizes the various test modules that verify different aspects 
//! of the contract's behavior.

mod setup_contract;
mod lock_funds_tests;
mod complete_flow_test;
mod partial_fee_test;
mod query_test;
mod registry_basic_test;
mod exceed_max_ttl_test;
mod excessive_fee_test;
mod unauthorized_release_test;
mod expired_escrow_refund_test;
mod non_expired_refund_test;
mod frozen_contract_test;
mod multi_denom_test;
mod fee_collection_test;
// Import individual test modules below as they're implemented
