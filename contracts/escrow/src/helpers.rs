use schemars::JsonSchema;
use serde::{Deserialize, Serialize};

use cosmwasm_std::{Addr, CosmosMsg, StdResult};

use crate::msg::ExecuteMsg;

/// CwTemplateContract is a wrapper around Addr that provides a lot of helpers
/// for working with this.
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq, Eq, JsonSchema)]
pub struct CwTemplateContract(pub Addr);

impl CwTemplateContract {
    pub fn addr(&self) -> Addr {
        self.0.clone()
    }

    pub fn call<T: Into<ExecuteMsg>>(&self, _msg: T) -> StdResult<CosmosMsg> {
        // Since ExecuteMsg is uninhabited, this function cannot be meaningfully implemented.
        // Returning an error to indicate this.
        Err(cosmwasm_std::StdError::generic_err("ExecuteMsg is uninhabited and cannot be used."))
    }
}
