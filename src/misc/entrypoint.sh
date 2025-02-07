# entrypoint.sh:
#!/bin/bash

VERSION="$(cat ./package.json | grep version | cut -d '"' -f 4)"

if [[ "$1" = "--dev" ]]; then
    node_env="development"
elif [[ "$1" = "--prod" ]]; then
    node_env="production"
fi

echo -e "
\033[1;32mWelcome to\033[0m

\033[1;34m######    ######    #### ###  ###   #### #########   ######   #########\033[0m
\033[1;34m### ###  ###  ###  ###   ### ###  ###       ###     ###  ###     ###\033[0m
\033[1;34m###  ### ###  ### ###    ######   ####      ###    ###    ###    ###\033[0m
\033[1;34m###  ### ###  ### ###    ### ###   ####     ###   ############   ###\033[0m
\033[1;34m### ###  ###  ###  ###   ### ###     ####   ###   ###      ###   ###\033[0m
\033[1;34m######    ######    #### ###  ###  ####     ###   ###      ###   ###     \033[0m(\033[1;33mAPI - v${VERSION}\033[0m)

\033[1;36mUseful links:\033[0m

- Documentation:     \033[1;32mhttps://outline.itsnik.de/s/dockstat\033[0m
- GitHub (Frontend): \033[1;32mhttps://github.com/its4nik/dockstat\033[0m
- GitHub (Backend):  \033[1;32mhttps://github.com/its4nik/dockstatapi\033[0m

\033[1;35mSummary:\033[0m

DockStat and DockStatAPI are 2 fully OpenSource projects, DockStatAPI is a simple but extensible API which allows queries via a REST endpoint.

"

bash ./createEnvFile.sh

NODE_ENV=${node_env} node src/server.js
