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

yarn verify 0x00c854b5bFA8e2C65bA7632Dfb9D2852e163343D --network truffle

yarn whitelist-open --network truffle

