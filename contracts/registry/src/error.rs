use cosmwasm_std::StdError;
use thiserror::Error;

#[derive(Error, Debug, PartialEq)]
pub enum ContractError {
    #[error("{0}")]
    Std(#[from] StdError),

    #[error("Unauthorized")]
    Unauthorized {},

    #[error("Tool ID must be 16 characters or less")]
    ToolIdTooLong {},

    #[error("Tool not found")]
    ToolNotFound {},
}
