neutrond tx wasm instantiate 11725 '{"registry_addr": "neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv"}' \
neutrond tx wasm instantiate 11725 '{"registry_addr": "neutron1mxaqqnh237vu0phcfh6ut8gx3att2dza49r5x9h52fey9gspy5nq54cjhv"}' \
neutrond tx wasm store artifacts/escrow.wasm \
neutrond tx wasm instantiate 11724 "{}" \
neutrond query tx 7A12F2B57C69BAB5C6D6610E0796800DD4B03791BCDCD764D964AECA92A68FBC
neutrond tx wasm store artifacts/registry.wasm \
neutrond tx wasm instantiate 11716 "{}" \
neutrond tx wasm instantiate 11715 "{}" \
neutrond tx wasm instantiate 11714 "{}" \
neutrond tx wasm instantiate 11714 "{}" \
neutrond query tx 17A4E9C517784CDD563827C96B0C3E0373D76E1C36B8AD6D98BC612780E58373
neutrond tx wasm instantiate 11713 "{}" \
neutrond query tx B309DD113D77C85E75223E34E6D29CF9AB79CE68893AFAC94CD31CCC99E978B8
cd /Users/r4to/Script/cosmos/toolpay && neutrond tx wasm store artifacts/registry.wasm \
neutrond tx wasm instantiate 11712 '{}' \
neutrond query tx 8BA25EE1F98C1B68DB77B4E524A1F3753B611615C9CA74C7939C3B02888C1A33
neutrond tx wasm instantiate 11699 '{"registry_addr": "neutron1qtysj94dxxaetzq8tuzl25389suk249rwt4cu3"}' \
neutrond keys list
history | grep neutrond
neutrond query wasm code-info 11699
neutrond query wasm --help
neutrond query wasm list-code --output json > code_list.json
neutrond query wasm list-code
neutrond tx wasm store artifacts/escrow.wasm \
neutrond tx wasm store artifacts/escrow.wasm \
neutrond tx wasm store target/wasm32-unknown-unknown/release/escrow.wasm \
neutrond tx wasm store artifacts/escrow.wasm
neutrond query bank total
neutrond query bank balances neutron1qtysj94dxxaetzq8tuzl25389suk249rwt4cu3
neutrond --help
neutrond show config
neutrond keys add devwallet
neutrond keys delete devwallet
neutrond keys --help
neutrond config node https://rpc-falcron.pion-1.ntrn.tech:443
history | neutrond
neutrond tx wasm store artifacts/escrow.wasm \
neutrond config chain-id pion-1
neutrond config node https://rpc-palvus.pion-1.ntrn.tech:443
neutrond config keyring-backend test
neutrond config output json
neutrond version
ls $(go env GOPATH)/bin/neutrond
neutrond
cmd/neutrond
cmd/neutrond/
