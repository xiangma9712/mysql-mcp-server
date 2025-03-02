# MySQL MCP Server

MySQLデータベースを操作するためのMCPサーバーです。

read onlyなクエリの実行（query）と、最終的にロールバックされるwrite queryの実行（test_execute）をサポートしています。

## セットアップ

### 環境変数

以下の環境変数を`~/.mcp/.env`に追加してください：

```
MYSQL_HOST=host.docker.internal  # Dockerコンテナからホストのサービスにアクセスするためのホスト名
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=your_password
```

> **注意**: `host.docker.internal`はDockerコンテナからホストマシンのサービスにアクセスするための特別なDNS名です。
> ホストマシン上で動作しているMySQLサーバーに接続する場合は、この設定を使用してください。
> 別のMySQLサーバーに接続する場合は、適切なホスト名に変更してください。

### mcp.jsonの設定

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

## 使用方法

### サーバーの起動

```sh
docker run -i --rm --add-host=host.docker.internal:host-gateway --env-file ~/.mcp/.env my-mcp/mysql
```

> **注意**: OrbStackを使用している場合、`host.docker.internal`は自動的にサポートされているため、`--add-host`オプションは省略可能です。
> Docker Desktopでも多くの場合自動的にサポートされていますが、確実性を高めるために`--add-host`オプションを追加することを推奨します。

### 利用可能なコマンド

#### 1. 読み取り専用のクエリの実行

```json
{
  "type": "query",
  "payload": {
    "sql": "SELECT * FROM your_table"
  }
}
```

レスポンス：
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

#### 2. クエリの実行確認

```json
{
  "type": "test_execute",
  "payload": {
    "sql": "UPDATE your_table SET name = 'updated' WHERE id = 1"
  }
}
```

レスポンス：
```json
{
  "success": true,
  "data": "更新SQLクエリが実行可能です。"
}
```

#### 3. テーブル一覧

```json
{
  "type": "list_tables"
}
```

レスポンス：
```json
{
  "success": true,
  "data": ["table1", "table2", "table3"]
}
```

#### 4. テーブルの詳細確認

```json
{
  "type": "describe_table",
  "payload": {
    "table": "your_table"
  }
}
```

レスポンス：
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

## 実装の詳細

- TypeScriptで実装
- mysql2パッケージを使用
- Dockerコンテナとして実行
- 標準入力を通じてJSONコマンドを受け付け
- 標準出力を通じてJSONレスポンスを返す
- `host.docker.internal`を使用してホストのMySQLに接続（OrbStackとDocker Desktop両対応）

## セキュリティ上の注意

- 環境変数を使用して機密情報を管理
- SQLインジェクション対策は実装者の責任
- 本番環境での使用時は適切なネットワーク設定が必要
- ホストマシンのサービスに接続する場合、適切なファイアウォール設定が必要
