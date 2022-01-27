#! /bin/bash

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 name_of_wallet" >&2
  exit 1
fi

mkdir $1
cd $1
solana-keygen new --outfile $1.json > $1.txt
echo "" >> $1.txt
echo $1.json >> $1.txt
echo "" >> $1.txt
cat $1.json >> $1.txt