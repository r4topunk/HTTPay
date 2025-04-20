#[cfg(not(feature = "library"))]
use cosmwasm_std::entry_point;
use cosmwasm_std::{
    BankMsg, Binary, Coin, CosmosMsg, Deps, DepsMut, Env, Event, MessageInfo, 
    Response, StdResult, Uint128,
};
use cw2::set_contract_version;

use crate::error::ContractError;
use crate::msg::{ExecuteMsg, InstantiateMsg, QueryMsg, SudoMsg, EscrowResponse};
use cosmwasm_std::{to_json_binary, StdError};
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
        } => release(deps, env, info, escrow_id, usage_fee),
        ExecuteMsg::RefundExpired { escrow_id } => refund_expired(deps, env, info, escrow_id),
    }
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
    match msg {
        QueryMsg::GetEscrow { escrow_id } => to_json_binary(&query_escrow(deps, escrow_id)?),
    }
}

fn query_escrow(deps: Deps, escrow_id: u64) -> StdResult<EscrowResponse> {
    let escrow = ESCROWS.may_load(deps.storage, escrow_id)?
        .ok_or_else(|| StdError::not_found(format!("Escrow {} not found", escrow_id)))?;
    
    // Convert to response format
    Ok(EscrowResponse {
        escrow_id,
        caller: escrow.caller,
        provider: escrow.provider,
        max_fee: escrow.max_fee,
        expires: escrow.expires,
        auth_token: escrow.auth_token,
    })
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

// Implementation of Release functionality
pub fn release(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    escrow_id: u64,
    usage_fee: Uint128,
) -> Result<Response, ContractError> {
    // Load escrow by id
    let escrow = ESCROWS.may_load(deps.storage, escrow_id)?
        .ok_or(ContractError::EscrowNotFound {})?;
    
    // Verify caller is the original provider
    if info.sender != escrow.provider {
        return Err(ContractError::Unauthorized {});
    }
    
    // Verify escrow hasn't expired
    if env.block.height > escrow.expires {
        return Err(ContractError::EscrowExpired {});
    }
    
    // Verify usage_fee ≤ max_fee
    if usage_fee > escrow.max_fee {
        return Err(ContractError::FeeTooHigh {
            max_fee: escrow.max_fee.to_string(),
            requested_fee: usage_fee.to_string(),
        });
    }
    
    // Calculate refund amount (if any)
    let refund_amount = escrow.max_fee.checked_sub(usage_fee)
        .expect("Usage fee is already verified to be <= max_fee");
    
    // Create messages for transferring funds
    let mut messages: Vec<CosmosMsg> = vec![];
    
    // Transfer usage_fee to provider
    if !usage_fee.is_zero() {
        messages.push(CosmosMsg::Bank(BankMsg::Send {
            to_address: escrow.provider.to_string(),
            amount: vec![Coin {
                denom: "uatom".to_string(), // Using uatom as an example; adjust based on your chain
                amount: usage_fee,
            }],
        }));
    }
    
    // Transfer remaining funds (if any) to original caller
    if !refund_amount.is_zero() {
        messages.push(CosmosMsg::Bank(BankMsg::Send {
            to_address: escrow.caller.to_string(),
            amount: vec![Coin {
                denom: "uatom".to_string(), // Using uatom as an example; adjust based on your chain
                amount: refund_amount,
            }],
        }));
    }
    
    // Remove escrow from storage
    ESCROWS.remove(deps.storage, escrow_id);
    
    // Create wasm-toolpay.released event
    let event = Event::new("wasm-toolpay.released")
        .add_attribute("escrow_id", escrow_id.to_string())
        .add_attribute("provider", escrow.provider.to_string())
        .add_attribute("caller", escrow.caller.to_string())
        .add_attribute("usage_fee", usage_fee.to_string())
        .add_attribute("refund_amount", refund_amount.to_string());
    
    // Return success response
    Ok(Response::new()
        .add_messages(messages)
        .add_event(event)
        .add_attribute("action", "release")
        .add_attribute("escrow_id", escrow_id.to_string()))
}

// Implementation of RefundExpired functionality
pub fn refund_expired(
    deps: DepsMut,
    env: Env,
    info: MessageInfo,
    escrow_id: u64,
) -> Result<Response, ContractError> {
    // Load escrow by id
    let escrow = ESCROWS.may_load(deps.storage, escrow_id)?
        .ok_or(ContractError::EscrowNotFound {})?;
    
    // Verify caller is the original caller
    if info.sender != escrow.caller {
        return Err(ContractError::Unauthorized {});
    }
    
    // Verify escrow has expired (current block > expires)
    if env.block.height <= escrow.expires {
        return Err(ContractError::EscrowNotExpired {});
    }
    
    // Prepare message to return all funds to original caller
    let refund_msg = CosmosMsg::Bank(BankMsg::Send {
        to_address: escrow.caller.to_string(),
        amount: vec![Coin {
            denom: "uatom".to_string(), // Using uatom as an example; adjust based on your chain
            amount: escrow.max_fee,
        }],
    });
    
    // Remove escrow from storage
    ESCROWS.remove(deps.storage, escrow_id);
    
    // Create wasm-toolpay.refunded event
    let event = Event::new("wasm-toolpay.refunded")
        .add_attribute("escrow_id", escrow_id.to_string())
        .add_attribute("caller", escrow.caller.to_string())
        .add_attribute("refund_amount", escrow.max_fee.to_string());
    
    // Return success response
    Ok(Response::new()
        .add_message(refund_msg)
        .add_event(event)
        .add_attribute("action", "refund_expired")
        .add_attribute("escrow_id", escrow_id.to_string()))
}

#[cfg_attr(not(feature = "library"), entry_point)]
pub fn sudo(deps: DepsMut, _env: Env, msg: SudoMsg) -> Result<Response, ContractError> {
    match msg {
        SudoMsg::Freeze {} => {
            let mut config = CONFIG.load(deps.storage)?;
            config.frozen = true;
            CONFIG.save(deps.storage, &config)?;
            
            Ok(Response::new()
                .add_attribute("action", "freeze")
                .add_attribute("frozen", "true"))
        }
    }
}

#[cfg(test)]
mod tests {
    // Main tests are in the tests/ directory
    // This module is kept for backward compatibility
}
