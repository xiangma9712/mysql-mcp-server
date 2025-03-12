# MySQL MCP Server

An MCP server for interacting with MySQL databases.

This server supports executing read-only queries (query) and write queries that are ultimately rolled back (test_execute).

<a href="https://glama.ai/mcp/servers/kucglstegf">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/kucglstegf/badge" alt="MySQL Server MCP server" />
</a>

## Setup

### Environment Variables

Add the following environment variables to `~/.mcp/.env`:

```
MYSQL_HOST=host.docker.internal  # Hostname to access host services from Docker container
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
```

> **Note**: `host.docker.internal` is a special DNS name for accessing host machine services from Docker containers.
> Use this setting when connecting to a MySQL server running on your host machine.
> If connecting to a different MySQL server, change to the appropriate hostname.

### mcp.json Configuration

```json
{
  "mcpServers": {
    "mysql": {
      "command": "docker",
      "args": [
        "run",
        "-i",
        "--rm",
        "--add-host=host.docker.internal:host-gateway",
        "--env-file",
        "/Users/username/.mcp/.env",
        "my-mcp/mysql"
      ]
    }
  }
}
```

## Usage

### Starting the Server

```sh
docker run -i --rm --add-host=host.docker.internal:host-gateway --env-file ~/.mcp/.env my-mcp/mysql
```

> **Note**: If you're using OrbStack, `host.docker.internal` is automatically supported, so the `--add-host` option can be omitted.
> While Docker Desktop also typically supports this automatically, adding the `--add-host` option is recommended for better reliability.

### Available Commands

#### 1. Execute Read-only Query

```json
{
  "type": "query",
  "payload": {
    "sql": "SELECT * FROM your_table"
  }
}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "example"
    }
  ]
}
```

#### 2. Test Query Execution

```json
{
  "type": "test_execute",
  "payload": {
    "sql": "UPDATE your_table SET name = 'updated' WHERE id = 1"
  }
}
```

Response:
```json
{
  "success": true,
  "data": "The UPDATE SQL query can be executed."
}
```

#### 3. List Tables

```json
{
  "type": "list_tables"
}
```

Response:
```json
{
  "success": true,
  "data": ["table1", "table2", "table3"]
}
```

#### 4. Describe Table

```json
{
  "type": "describe_table",
  "payload": {
    "table": "your_table"
  }
}
```

Response:
```json
{
  "success": true,
  "data": [
    {
      "Field": "id",
      "Type": "int(11)",
      "Null": "NO",
      "Key": "PRI",
      "Default": null,
      "Extra": ""
    },
    {
      "Field": "name",
      "Type": "varchar(255)",
      "Null": "YES",
      "Key": "",
      "Default": null,
      "Extra": ""
    }
  ]
}
```

## Implementation Details

- Implemented in TypeScript
- Uses mysql2 package
- Runs as a Docker container
- Accepts JSON commands through standard input
- Returns JSON responses through standard output
- Uses `host.docker.internal` to connect to host MySQL (compatible with both OrbStack and Docker Desktop)

## Security Considerations

- Uses environment variables for sensitive information management
- SQL injection prevention is the implementer's responsibility
- Proper network configuration required for production use
- Appropriate firewall settings needed when connecting to host machine services