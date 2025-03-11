# Testing Stacks

## Deployment

### Values

- compose_spec
- name
- version
- automatic_reboot_on_error
- isCustom
- image_updates
- source
- stack_prefix

### JSON
```json
{
    "compose_spec": {
        "name": "Local Test",
        "services": {
            "nginx": {
                "container_name": "Local-test-nginx",
                "image": "dockerbogo/docker-nginx-hello-world",
                "ports": [
                    "8081:80"
                ]
            }
        }
    },
    "name": "Local-Test",
    "version": 1,
    "automatic_reboot_on_error": true,
    "isCustom": true,
    "image_updates": true,
    "source": "Local",
    "stack_prefix": ""
}
```
