# CMD
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew update

brew doctor

export PATH="/usr/local/bin:$PATH"

brew install node

brew install git

npm install --global yarn

npm i -g truffle

npm i -g corepack

truffle dashboard

yarn install

yarn deploy --network truffle

yarn verify 0xe59045e7ae5974DDC9Bb2889e62400F3eD89795e --network truffle

yarn whitelist-open --network truffle

