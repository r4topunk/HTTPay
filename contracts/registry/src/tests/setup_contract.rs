use cosmwasm_std::testing::{mock_env, message_info};
use cosmwasm_std::Addr;
use crate::contract::instantiate;
use crate::msg::InstantiateMsg;
use crate::error::ContractError;

pub fn setup_contract(deps: cosmwasm_std::DepsMut) -> Result<cosmwasm_std::Response, ContractError> {
    let info = message_info(&Addr::unchecked("creator"), &[]);
    instantiate(deps, mock_env(), info, InstantiateMsg {})
}
