# DEPRRECATION WARNING
v1 is EOL, I do not recommend using it. Please take a look at the `rewrite-elysiajs` or `dev` branch!

# DockstatAPI

## This tool relies on the [DockerSocket Proxy](https://docs.linuxserver.io/images/docker-socket-proxy/), please see it's documentation for more information.

This is the DockStatAPI used in [DockStat](https://github.com/its4nik/dockstat).

It features an easy way to configure using a yaml file.

You can specify multiple hosts, using a Docker Socket Proxy like this:

## Installation:

docker-compose.yaml
```yaml
services:
 dockstatapi:
  image: ghcr.io/its4nik/dockstatapi:latest
  container_name: dockstatapi
  environment:
    - SECRET=CHANGEME # This is required in the header 'Authorization': 'CHANGEME'
    - ALLOW_LOCALHOST="False" # Defaults to False
  ports:
    - "7070:7070"
  volumes:
    - ./dockstatapi:/api/config # Place your hosts.yaml file here
  restart: always
```

Example docker-socket onfiguration:

```yaml
socket-proxy:
 image: lscr.io/linuxserver/socket-proxy:latest
 container_name: socket-proxy
 environment:
  - CONTAINERS=1 # Needed for the api to worrk
  - INFO=1       # Needed for the api to work
 volumes:
  - /var/run/docker.sock:/var/run/docker.sock:ro
 restart: unless-stopped
 read_only: true
 tmpfs:
  - /run
 ports:
  - 2375:2375
```

Configuration inside the mounted folder, as hosts.yaml
```yaml
mintimeout: 10000 # The minimum time to wait before querying the same server again, defaults to 5000 Ms

log:
  logsize: 10 # Specify the Size of the log files in MB, default is 1MB
  LogCount: 1 # How many log files should be kept in rotation. Default is 5

hosts:
  YourHost1:
    url: hetzner
    port: 2375

# This is used for DockStat
# Please see the dockstat documentation for more information
tags:
  raspberry: red-200
  private: violet-400

container:
  dozzle: # Container name
    link: https://github.com
```

Please see the documentation for more information on what endpoints will be provieded.

[Documentation](https://outline.itsnik.de/s/dockstat/doc/backend-api-reference-YzcBbDvY33)

---

This Api uses a "queuing" mechanism to communicate to the servers, so that we dont ask the same server multiple times without getting an answer.

Feel free to use this API in any of your projects :D

The `/stats` endpoint server all information that are gethered from the server in a json format.
