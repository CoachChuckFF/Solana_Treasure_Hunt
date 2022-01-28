#! /bin/bash

#TODO set price, count
#https://docs.metaplex.com/create-candy/introduction

touch output.txt

echo "--- Phase 0 (Upload) ---\n" >> output.txt
ts-node ~/Work/Candy/metaplex/js/packages/cli/src/candy-machine-cli.ts upload $(pwd)/assets --env mainnet-beta --keypair ~/Work/Candy/Scripts/coach/coach.json --rpc-url https://ssc-dao.genesysgo.net/ >> output.txt

echo "\n--- Phase 1 (Verify) ---\n" >> output.txt
ts-node ~/Work/Candy/metaplex/js/packages/cli/src/candy-machine-cli.ts verify --keypair ~/Work/Candy/Scripts/coach/coach.json >> output.txt

echo "\n--- Phase 2 (Create Candy Machine) ---\n" >> output.txt
ts-node ~/Work/Candy/metaplex/js/packages/cli/src/candy-machine-cli.ts create_candy_machine --env mainnet-beta --keypair ~/Work/Candy/Scripts/coach/coach.json >> output.txt

echo "\n--- Phase 3 (Update Candy Machine) ---\n" >> output.txt
ts-node ~/Work/Candy/metaplex/js/packages/cli/src/candy-machine-cli.ts update_candy_machine --env mainnet-beta --keypair ~/Work/Candy/Scripts/coach/coach.json -p 0 >> output.txt

echo "\n--- Phase 4 (Mint All) ---\n" >> output.txt
ts-node ~/Work/Candy/metaplex/js/packages/cli/src/candy-machine-cli.ts mint_multiple_tokens --env mainnet-beta --keypair ~/Work/Candy/Scripts/coach/coach.json --number 6 >> output.txt


# CM PK
# 6Ejm9BYKhYcj7xbr4BZjzK6Lkgu7LqmtSrFJZCmnq4fg