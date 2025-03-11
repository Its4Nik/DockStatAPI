# DockStat API

! WIP Documentation !

## Usage

The DockStat API provides the following endpoints:

### Docker Containers
- `GET /docker/containers`: Retrieve statistics for all containers across all configured Docker hosts.

### Docker Hosts
- `GET /docker/hosts/:id`: Retrieve configuration and statistics for a specific Docker host.

### Docker Configuration
- `POST /docker-config/add-host`: Add a new Docker host.
- `POST /docker-config/update-host`: Update an existing Docker host.
- `GET /docker-config/hosts`: Retrieve a list of all configured Docker hosts.

### API Configuration
- `GET /config/get`: Retrieve the current API configuration.
- `POST /config/update`: Update the API configuration.

### Logs
- `GET /logs`: Retrieve all backend logs.
- `GET /logs/:level`: Retrieve logs filtered by log level.
- `DELETE /logs`: Clear all backend logs.
- `DELETE /logs/:level`: Clear logs by log level.

### Websocket
- `WS(S) /docker/stats`: Retrieve the current API configuration.

## API

The DockStat API exposes the following endpoints:

| Endpoint | Method | Description |
| --- | --- | --- |
| `/docker/containers` | `GET` | Retrieve statistics for all containers across all configured Docker hosts. |
| `/docker/hosts/:id` | `GET` | Retrieve configuration and statistics for a specific Docker host. |
| `/docker-config/add-host` | `POST` | Add a new Docker host. |
| `/docker-config/update-host` | `POST` | Update an existing Docker host. |
| `/docker-config/hosts` | `GET` | Retrieve a list of all configured Docker hosts. |
| `/config/get` | `GET` | Retrieve the current API configuration. |
| `/config/update` | `POST` | Update the API configuration. |
| `/logs` | `GET` | Retrieve all backend logs. |
| `/logs/:level` | `GET` | Retrieve logs filtered by log level. |
| `/logs` | `DELETE` | Clear all backend logs. |
| `/logs/:level` | `DELETE` | Clear logs by log level. |

## Contributing

1. Fork the repository.
2. Create a new branch for your feature or bug fix.
3. Make your changes and commit them.
4. Push your branch to your forked repository.
5. Submit a pull request to the main repository.

## License

This project is licensed under the CC BY-NC 4.0 License.
[cc-by-nc-image]: https://licensebuttons.net/l/by-nc/4.0/88x31.png

## Testing

To run the tests, execute the following command:
(Currently no tests configured!)
```
bun test
```

This will run the test suite and report the results.
