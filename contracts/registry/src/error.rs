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
    
    #[error("Description must be 256 characters or less")]
    DescriptionTooLong {},

    #[error("Endpoint must be 512 characters or less")]
    EndpointTooLong {},

    #[error("Endpoint must start with https://")]
    InvalidEndpointFormat {},
}
