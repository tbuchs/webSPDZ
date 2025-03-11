
echo "Hey There :D"


apt install -y curl
cd $WORK_DIR

# install Nix stuff
curl --proto '=https' --tlsv1.2 -sSf -L https://install.determinate.systems/nix | sh -s -- install linux --init none --no-confirm
# exec $SHELL # re-login into shell to have the nix command available :D ... but: would need the below command as argument

# install MPyC-Web
$HOME/.nix-profile/bin/nix develop --impure --accept-flake-config -c "bash" -c "yarn install && yarn build" 

# yarn install
# yarn dev & 
# yarn build
# python -m http.server -d dist
