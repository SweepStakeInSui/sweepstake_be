#usr/bin/bash
source ./.env
git config --global url."https://github.com/".insteadOf ssh://git@github.com/
yarn
