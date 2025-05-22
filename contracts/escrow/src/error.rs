use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Contract is frozen")]
    Frozen {},
    
    #[error("Tool not found or inactive")]
    ToolNotActive {},
    
    #[error("Insufficient funds: required {required}, but only {available} was sent")]
    InsufficientFunds { required: String, available: String },
    
    #[error("Wrong token denomination: expected {expected}, got {received}")]
    WrongDenom { expected: String, received: String },
    
    #[error("No funds provided with the required denomination")]
    NoDenomFunds { denom: String },
    
    #[error("Escrow expiration too far in future: max {max_blocks} blocks, got {got_blocks} blocks")]
    ExpirationTooLong { max_blocks: u64, got_blocks: u64 },
    
    #[error("Escrow not found")]
    EscrowNotFound {},
    
    #[error("Escrow already expired")]
    EscrowExpired {},
    
    #[error("Escrow not yet expired")]
    EscrowNotExpired {},
    
    #[error("Usage fee exceeds max fee: max {max_fee}, requested {requested_fee}")]
    FeeTooHigh { max_fee: String, requested_fee: String },
    
    #[error("Invalid fee percentage: must be between 0 and 100, got {0}")]
    InvalidFeePercentage(u64),
    
    #[error("No fees to claim for denom {0}")]
    NoFeesToClaim(String),
}
