#! /bin/bash

ts-node ~/Work/Candy/metaplex/js/packages/cli/src/candy-machine-cli.ts upload $(pwd)/assets --env devnet --keypair ~/Work/Candy/Scripts/mechaMumbo/mechaMumbo.json
ts-node ~/Work/Candy/metaplex/js/packages/cli/src/candy-machine-cli.ts verify --keypair ~/Work/Candy/Scripts/mechaMumbo/mechaMumbo.json
ts-node ~/Work/Candy/metaplex/js/packages/cli/src/candy-machine-cli.ts create_candy_machine --env devnet --keypair ~/Work/Candy/Scripts/mechaMumbo/mechaMumbo.json > candy.txt
ts-node ~/Work/Candy/metaplex/js/packages/cli/src/candy-machine-cli.ts update_candy_machine --env devnet --keypair ~/Work/Candy/Scripts/mechaMumbo/mechaMumbo.json -p 0
ts-node ~/Work/Candy/metaplex/js/packages/cli/src/candy-machine-cli.ts mint_multiple_tokens --env devnet --keypair ~/Work/Candy/Scripts/mechaMumbo/mechaMumbo.json --number 6
