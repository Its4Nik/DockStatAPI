# Deprecation Warning!
# V2 is abondend, since there where to many issues in the codebase!
# Please see v3 (next commit from this one onwards, all other branches which are not based on bun will be deleted!)

# DockStatAPI v2

![Dockstat Logo](.github/DockStat.png)

<div align="center">

# Pipelines

[![Docker Image CI](https://img.shields.io/github/actions/workflow/status/Its4Nik/dockstatapi/build-image.yml?branch=main&label=Docker%20Image%20CI&style=for-the-badge&logo=docker)](https://github.com/Its4Nik/dockstatapi/actions/workflows/build-image.yml)
[![Validation](https://img.shields.io/github/actions/workflow/status/Its4Nik/dockstatapi/validation.yml?branch=dev&label=Validation&style=for-the-badge&logo=checkmarx)](https://github.com/Its4Nik/dockstatapi/actions/workflows/validation.yml)

</div>

This specific branch contains the currently WIP **DockStatAPI-v2**, this update will bring major breaking changes so please be careful.
With this new release a couple of extra features (compared to v1) are going to be available.

### Feature List:

- Swagger API Documentation
- Database (Keeps data for 24 hours max)
- Advanced authentication using hashes and salt
- Custom TypeScript/JavaScript notification modules! (Easy to add and configure!)
- `http` API to configure the backend
- Multi-arch docker builds (using buildx github action)
- Advanced security through middlewares: rate-limiting and authentication
- Multi Arch Docker builds through docker buildx
- High Availability using single master and unlimited worker nodes!
- Dynamically created Graphs

# 🔗 DockStatAPI v2 Documentation

_⚠️ = Deprecation warning_

- [Introduction](https://outline.itsnik.de/s/dockstat)

  - [DockstatAPI v2](https://outline.itsnik.de/s/dockstat/doc/dockstatapi-v2-XRMDKRqMIg)

    - [API reference](https://outline.itsnik.de/s/dockstat/doc/api-reference-1PTxqx1MQ6)
    - [How dependency graphs are made](https://outline.itsnik.de/s/dockstat/doc/how-the-dependecy-graphs-are-made-svuZbEHH9g)

  - [DockStat v1](https://outline.itsnik.de/s/dockstat/doc/dockstat-v1-zVaFS4zROI)

    - [⚠️ Customisation](https://outline.itsnik.de/s/dockstat/doc/customization-PiBz4OpQIZ)
      - [⚠️ Themes](https://outline.itsnik.de/s/dockstat/doc/themes-BFhN6ZBbYx)
    - [⚠️ Installation](https://outline.itsnik.de/s/dockstat/doc/installation-DaO99bB86q)

  - [⚠️ DockStatAPI v1](https://outline.itsnik.de/s/dockstat/doc/dockstatapi-v1-jLcVCfPNmS)
    - [⚠️ Integrations](https://outline.itsnik.de/s/dockstat/doc/integrations-Agq1oL6HxF)
    - [⚠️ Backend API reference](https://outline.itsnik.de/s/dockstat/doc/backend-api-reference-YzcBbDvY33)

# Dependencies

Please see [CREDITS.md](./CREDITS.md).

To create the credits file use: `npm run license`

Or if you want it as a pre-commit hook create this file:

```bash
#!/bin/bash
# .git/hooks/pre-commit

npm run license
```

# DockStat(APIs) goals

DockStack tries to be a lightweigh and more "dashboard" like then [portainer](https://github.com/portainer/portainer), [cAdvisor](https://github.com/google/cadvisor), [dockge](https://github.com/louislam/dockge), ...
I also try to add some "extensions", like in V1 with [🥤cup](https://github.com/sergi0g/cup).
Everything is configured through a backend with Swagger documentation, so that you can follow the code and understand the new v2 frontend better!
DockStat is mainly used for teaching [myself](https://github.com/Its4Nik) more about TypeScript, APIs and backend development!
