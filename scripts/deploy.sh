#!/bin/bash

# Deploy Pay-Per-Tool contracts to Neutron Testnet (pion-1)
# This script builds, optimizes, deploys, and instantiates both Registry and Escrow contracts
# It captures and outputs the code IDs and contract addresses for both contracts

set -e  # Exit on any error

# Configuration
WALLET="devwallet"
LABEL_SUFFIX=$(date +%s)  # Add timestamp to labels for uniqueness
FEE_PERCENTAGE=10  # Default fee percentage for escrow contract

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to wait for transaction confirmation
wait_for_tx() {
    local txhash=$1
    local description=$2
    
    print_status "Waiting for transaction confirmation: $description"
    print_status "Transaction hash: $txhash"
    
    # Wait a few seconds for the transaction to be included in a block
    sleep 5
    
    # Check if transaction was successful
    local result=$(neutrond query tx $txhash --output json 2>/dev/null)
    if [ $? -eq 0 ]; then
        local code=$(echo $result | jq -r '.code // 0')
        if [ "$code" = "0" ]; then
            print_success "Transaction confirmed successfully"
            return 0
        else
            print_error "Transaction failed with code: $code"
            echo $result | jq -r '.raw_log'
            return 1
        fi
    else
        print_error "Failed to query transaction"
        return 1
    fi
}

# Function to extract code ID from store transaction
get_code_id() {
    local txhash=$1
    neutrond query tx $txhash --output json | jq -r '.events[] | select(.type == "store_code") | .attributes[] | select(.key == "code_id") | .value'
}

# Function to extract contract address from instantiate transaction
get_contract_address() {
    local txhash=$1
    neutrond query tx $txhash --output json | jq -r '.events[] | select(.type == "instantiate") | .attributes[] | select(.key == "_contract_address") | .value'
}

print_status "Starting Pay-Per-Tool contract deployment..."

# Check if required tools are available
for tool in cargo wasm-opt neutrond jq; do
    if ! command -v $tool &> /dev/null; then
        print_error "$tool is required but not installed"
        exit 1
    fi
done

# Step 1: Build contracts
print_status "Building contracts..."
cargo build --lib --release --target wasm32-unknown-unknown

if [ ! -f "target/wasm32-unknown-unknown/release/registry.wasm" ]; then
    print_error "Registry WASM file not found after build"
    exit 1
fi

if [ ! -f "target/wasm32-unknown-unknown/release/escrow.wasm" ]; then
    print_error "Escrow WASM file not found after build"
    exit 1
fi

print_success "Contracts built successfully"

# Create artifacts directory if it doesn't exist
mkdir -p artifacts

# Step 2: Optimize registry contract
print_status "Optimizing registry contract..."
wasm-opt \
    target/wasm32-unknown-unknown/release/registry.wasm \
    -Oz \
    --strip-debug \
    --strip-producers \
    --vacuum \
    -o artifacts/registry.wasm

print_success "Registry contract optimized"

# Step 3: Store registry contract
print_status "Storing registry contract..."
REGISTRY_STORE_TXHASH=$(neutrond tx wasm store artifacts/registry.wasm \
    --from $WALLET \
    --gas auto --gas-adjustment 1.3 \
    --fees 30000untrn \
    --broadcast-mode sync \
    --yes \
    --output json | jq -r '.txhash')

if [ "$REGISTRY_STORE_TXHASH" = "null" ] || [ -z "$REGISTRY_STORE_TXHASH" ]; then
    print_error "Failed to get transaction hash for registry store"
    exit 1
fi

wait_for_tx $REGISTRY_STORE_TXHASH "Registry contract store"

# Get registry code ID
REGISTRY_CODE_ID=$(get_code_id $REGISTRY_STORE_TXHASH)
if [ "$REGISTRY_CODE_ID" = "null" ] || [ -z "$REGISTRY_CODE_ID" ]; then
    print_error "Failed to get registry code ID"
    exit 1
fi

print_success "Registry contract stored with Code ID: $REGISTRY_CODE_ID"

# Step 4: Instantiate registry contract
print_status "Instantiating registry contract..."
REGISTRY_INSTANTIATE_TXHASH=$(neutrond tx wasm instantiate $REGISTRY_CODE_ID '{}' \
    --from $WALLET \
    --label "toolpay-registry-$LABEL_SUFFIX" \
    --no-admin \
    --gas auto --gas-adjustment 1.3 \
    --fees 5000untrn \
    --broadcast-mode sync \
    --yes \
    --output json | jq -r '.txhash')

if [ "$REGISTRY_INSTANTIATE_TXHASH" = "null" ] || [ -z "$REGISTRY_INSTANTIATE_TXHASH" ]; then
    print_error "Failed to get transaction hash for registry instantiate"
    exit 1
fi

wait_for_tx $REGISTRY_INSTANTIATE_TXHASH "Registry contract instantiate"

# Get registry contract address
REGISTRY_ADDRESS=$(get_contract_address $REGISTRY_INSTANTIATE_TXHASH)
if [ "$REGISTRY_ADDRESS" = "null" ] || [ -z "$REGISTRY_ADDRESS" ]; then
    print_error "Failed to get registry contract address"
    exit 1
fi

print_success "Registry contract instantiated at address: $REGISTRY_ADDRESS"

# Step 5: Optimize escrow contract
print_status "Optimizing escrow contract..."
wasm-opt \
    target/wasm32-unknown-unknown/release/escrow.wasm \
    -Oz \
    --strip-debug \
    --strip-producers \
    --vacuum \
    -o artifacts/escrow.wasm

print_success "Escrow contract optimized"

# Step 6: Store escrow contract
print_status "Storing escrow contract..."
ESCROW_STORE_TXHASH=$(neutrond tx wasm store artifacts/escrow.wasm \
    --from $WALLET \
    --gas auto --gas-adjustment 1.3 \
    --fees 30000untrn \
    --broadcast-mode sync \
    --yes \
    --output json | jq -r '.txhash')

if [ "$ESCROW_STORE_TXHASH" = "null" ] || [ -z "$ESCROW_STORE_TXHASH" ]; then
    print_error "Failed to get transaction hash for escrow store"
    exit 1
fi

wait_for_tx $ESCROW_STORE_TXHASH "Escrow contract store"

# Get escrow code ID
ESCROW_CODE_ID=$(get_code_id $ESCROW_STORE_TXHASH)
if [ "$ESCROW_CODE_ID" = "null" ] || [ -z "$ESCROW_CODE_ID" ]; then
    print_error "Failed to get escrow code ID"
    exit 1
fi

print_success "Escrow contract stored with Code ID: $ESCROW_CODE_ID"

# Step 7: Instantiate escrow contract
print_status "Instantiating escrow contract..."
ESCROW_INSTANTIATE_MSG=$(cat <<EOF
{
    "registry_addr": "$REGISTRY_ADDRESS",
    "fee_percentage": $FEE_PERCENTAGE
}
EOF
)

ESCROW_INSTANTIATE_TXHASH=$(neutrond tx wasm instantiate $ESCROW_CODE_ID "$ESCROW_INSTANTIATE_MSG" \
    --from $WALLET \
    --label "toolpay-escrow-$LABEL_SUFFIX" \
    --no-admin \
    --gas auto --gas-adjustment 1.3 \
    --fees 5000untrn \
    --broadcast-mode sync \
    --yes \
    --output json | jq -r '.txhash')

if [ "$ESCROW_INSTANTIATE_TXHASH" = "null" ] || [ -z "$ESCROW_INSTANTIATE_TXHASH" ]; then
    print_error "Failed to get transaction hash for escrow instantiate"
    exit 1
fi

wait_for_tx $ESCROW_INSTANTIATE_TXHASH "Escrow contract instantiate"

# Get escrow contract address
ESCROW_ADDRESS=$(get_contract_address $ESCROW_INSTANTIATE_TXHASH)
if [ "$ESCROW_ADDRESS" = "null" ] || [ -z "$ESCROW_ADDRESS" ]; then
    print_error "Failed to get escrow contract address"
    exit 1
fi

print_success "Escrow contract instantiated at address: $ESCROW_ADDRESS"

# Step 8: Verify deployment by testing GetEscrows query
print_status "Verifying escrow contract deployment..."
ESCROWS_QUERY_RESULT=$(neutrond query wasm contract-state smart $ESCROW_ADDRESS '{"get_escrows":{}}' --output json 2>/dev/null)
if [ $? -eq 0 ]; then
    print_success "GetEscrows query test successful"
    echo "Query result: $ESCROWS_QUERY_RESULT"
else
    print_warning "GetEscrows query test failed - contract may not support this query"
fi

# Output summary
echo ""
echo "=================================="
echo "    DEPLOYMENT SUMMARY"
echo "=================================="
echo ""
echo "Registry Contract:"
echo "  Code ID: $REGISTRY_CODE_ID"
echo "  Address: $REGISTRY_ADDRESS"
echo "  Store Tx: $REGISTRY_STORE_TXHASH"
echo "  Instantiate Tx: $REGISTRY_INSTANTIATE_TXHASH"
echo ""
echo "Escrow Contract:"
echo "  Code ID: $ESCROW_CODE_ID"
echo "  Address: $ESCROW_ADDRESS"
echo "  Store Tx: $ESCROW_STORE_TXHASH"
echo "  Instantiate Tx: $ESCROW_INSTANTIATE_TXHASH"
echo "  Fee Percentage: $FEE_PERCENTAGE%"
echo ""
echo "Deployment completed successfully!"
echo ""

# Save deployment info to file
DEPLOYMENT_FILE="deployment-$(date +%Y%m%d-%H%M%S).json"
cat > $DEPLOYMENT_FILE <<EOF
{
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "label_suffix": "$LABEL_SUFFIX",
    "registry": {
        "code_id": "$REGISTRY_CODE_ID",
        "address": "$REGISTRY_ADDRESS",
        "store_txhash": "$REGISTRY_STORE_TXHASH",
        "instantiate_txhash": "$REGISTRY_INSTANTIATE_TXHASH"
    },
    "escrow": {
        "code_id": "$ESCROW_CODE_ID",
        "address": "$ESCROW_ADDRESS",
        "store_txhash": "$ESCROW_STORE_TXHASH",
        "instantiate_txhash": "$ESCROW_INSTANTIATE_TXHASH",
        "fee_percentage": $FEE_PERCENTAGE
    }
}
EOF

print_success "Deployment information saved to: $DEPLOYMENT_FILE"

# Export environment variables for easy access
export REGISTRY_CODE_ID
export REGISTRY_ADDRESS
export ESCROW_CODE_ID
export ESCROW_ADDRESS

echo "Environment variables exported:"
echo "  REGISTRY_CODE_ID=$REGISTRY_CODE_ID"
echo "  REGISTRY_ADDRESS=$REGISTRY_ADDRESS"
echo "  ESCROW_CODE_ID=$ESCROW_CODE_ID"
echo "  ESCROW_ADDRESS=$ESCROW_ADDRESS"
