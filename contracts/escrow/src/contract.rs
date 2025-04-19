#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    to_binary, Addr, BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env, Event, MessageInfo, 
    Response, StdResult, Uint128,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg};
use crate::registry_interface::query_tool;
use crate::state::{Config, Escrow, CONFIG, ESCROWS, NEXT_ID};

// version info for migration info
const CONTRACT_NAME: &str = "crates.io:escrow";
const CONTRACT_VERSION: &str = env!("CARGO_PKG_VERSION");

// Maximum number of blocks an escrow can be active
const MAX_ESCROW_BLOCKS: u64 = 50;

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn instantiate(
    deps: DepsMut,
    _env: Env,
    _info: MessageInfo,
    msg: InstantiateMsg,
) -> Result<Response, ContractError> {
    // Set contract version for future migration
    set_contract_version(deps.storage, CONTRACT_NAME, CONTRACT_VERSION)?;
    
    // Validate registry address
    let registry_addr = deps.api.addr_validate(&msg.registry_addr)?;
    
    // Initialize contract configuration
    CONFIG.save(deps.storage, &Config { 
        frozen: false,
        registry_addr,
    })?;
    
    // Initialize the escrow ID counter
    NEXT_ID.save(deps.storage, &1u64)?;

    Ok(Response::new()
        .add_attribute("action", "instantiate")
        .add_attribute("registry_addr", msg.registry_addr))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn execute(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    msg: ExecuteMsg,
) -> Result<Response, ContractError> {
    // Check if contract is frozen
    let config = CONFIG.load(deps.storage)?;
    if config.frozen {
        return Err(ContractError::Frozen {});
    }

    match msg {
        ExecuteMsg::LockFunds {
            tool_id,
            max_fee,
            auth_token,
            expires,
        } => lock_funds(deps, env, info, tool_id, max_fee, auth_token, expires),
        ExecuteMsg::Release {
            escrow_id,
            usage_fee,
        } => unimplemented!(),
        ExecuteMsg::RefundExpired { escrow_id } => unimplemented!(),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(_deps: Deps, _env: Env, _msg: QueryMsg) -> StdResult<Binary> {
    unimplemented!()
}

// Implementation of LockFunds functionality
pub fn lock_funds(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    tool_id: String,
    max_fee: Uint128,
    auth_token: String,
    expires: u64,
) -> Result<Response, ContractError> {
    // Get the registry address from config
    let config = CONFIG.load(deps.storage)?;
    
    // Query registry contract to verify tool exists and is active
    let tool = query_tool(&deps.querier, config.registry_addr, tool_id.clone())
        .map_err(|_| ContractError::ToolNotActive {})?;
    
    // Check that tool is active
    if !tool.is_active {
        return Err(ContractError::ToolNotActive {});
    }

    // Validate that max_fee doesn't exceed attached funds
    let attached_funds = info
        .funds
        .iter()
        .find(|c| c.denom == "uatom")  // Using uatom as an example, adjust based on your chain
        .map(|c| c.amount)
        .unwrap_or(Uint128::zero());

    if attached_funds < max_fee {
        return Err(ContractError::InsufficientFunds {
            required: max_fee.to_string(),
            available: attached_funds.to_string(),
        });
    }

    // Validate expires is within limits (≤ 50 blocks)
    let current_block = env.block.height;
    let blocks_until_expiry = expires.saturating_sub(current_block);
    if blocks_until_expiry > MAX_ESCROW_BLOCKS {
        return Err(ContractError::ExpirationTooLong {
            max_blocks: MAX_ESCROW_BLOCKS,
            got_blocks: blocks_until_expiry,
        });
    }
    
    // Create and store Escrow object
    let escrow = Escrow {
        caller: info.sender.clone(),
        provider: tool.provider,
        max_fee,
        auth_token,
        expires,
    };

    // Get new escrow ID
    let id = NEXT_ID.load(deps.storage)?;
    
    // Save escrow in storage
    ESCROWS.save(deps.storage, id, &escrow)?;
    
    // Increment NEXT_ID
    NEXT_ID.save(deps.storage, &(id + 1))?;

    // Create wasm-toolpay.locked event
    let event = Event::new("wasm-toolpay.locked")
        .add_attribute("escrow_id", id.to_string())
        .add_attribute("tool_id", tool_id)
        .add_attribute("caller", info.sender)
        .add_attribute("max_fee", max_fee.to_string())
        .add_attribute("expires", expires.to_string());

    // Return success response with escrow_id
    Ok(Response::new()
        .add_event(event)
        .add_attribute("action", "lock_funds")
        .add_attribute("escrow_id", id.to_string()))
}

#[cfg(test)]
mod tests {}
