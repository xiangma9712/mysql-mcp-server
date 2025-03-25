#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { createConnection } from 'mysql2/promise';
import * as dotenv from 'dotenv';

dotenv.config();

const server = new Server(
  {
    name: "mcp-mysql",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

async function initializeConnection() {
  return await createConnection({
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: parseInt(process.env.MYSQL_PORT ?? '3306'),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
  });
}

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "query",
        description: "Executes a read-only SQL query.",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string" },
          },
          required: ["sql"],
        },
      },
      {
        name: "test_execute",
        description: "Checks if an SQL query can be executed and rolls back afterward.",
        inputSchema: {
          type: "object",
          properties: {
            sql: { type: "string" },
          },
          required: ["sql"],
        },
      },
      {
        name: "list_tables",
        description: "Retrieves a list of tables in the database.",
        inputSchema: {
          type: "object",
        },
      },
      {
        name: "describe_table",
        description: "Retrieves column information for a table.",
        inputSchema: {
          type: "object",
          properties: {
            tableName: { type: "string" },
          },
          required: ["tableName"],
        },
      }
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const connection = await initializeConnection();

  try {
    switch (request.params.name) {
      case "query": {
        const sql = request.params.arguments?.sql as string;
        await connection.query('START TRANSACTION READ ONLY');
        const [rows] = await connection.query(sql);
        return {
          content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
          isError: false,
        };
      }

      case "test_execute": {
        const sql = request.params.arguments?.sql as string;
        await connection.query('START TRANSACTION');
        try {
          await connection.query(sql);
        } catch (error) {
          return {
            content: [{ type: "text", text: `Failed to execute SQL. error: ${error}` }],
            isError: true,
          };
        } finally {
          await connection.query('ROLLBACK');
        }
        return {
          content: [{ type: "text", text: "The update SQL query can be executed." }],
          isError: false,
        };
      }

      case "list_tables": {
        const [rows] = await connection.query(
          "SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?",
          [process.env.MYSQL_DATABASE]
        );
        return {
          content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
          isError: false,
        };
      }

      case "describe_table": {
        const tableName = request.params.arguments?.tableName as string;
        const [rows] = await connection.query(
          "SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?",
          [process.env.MYSQL_DATABASE, tableName]
        );
        return {
          content: [{ type: "text", text: JSON.stringify(rows, null, 2) }],
          isError: false,
        };
      }

      default:
        throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: error instanceof Error ? error.message : "An unknown error occurred"
      }],
      isError: true,
    };
  } finally {
    try {
      await connection.end();
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to close connection, error: ${error}`
        }],
        isError: true,
      }
    }
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

process.once("SIGTERM", () => {
  console.log(`SIGTERM received, closing server`);
  server.close().then(() => {
    console.log(`Server closed, exiting`);
    process.exit(0);
  });
});

process.once("SIGINT", () => {
  console.log(`SIGINT received, closing server`);
  server.close().then(() => {
    console.log(`Server closed, exiting`);
    process.exit(0);
  });

});

main().catch(error => {
  console.error(error instanceof Error ? error.message : "An unknown error occurred");
  process.exit(1);
});