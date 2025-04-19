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
// Import individual test modules below as they're implemented
// mod release_tests;
// mod refund_expired_tests;
// mod query_tests;
// mod sudo_tests;
