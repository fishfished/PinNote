import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerGetAppInfo,
  registerExtractTextFromImage,
  registerListSupportedTools,
} from "./tools/pinnote-tools";

export function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "pinnote",
    version: "1.0.0",
  });

  registerGetAppInfo(server, userId);
  registerExtractTextFromImage(server, userId);
  registerListSupportedTools(server, userId);

  return server;
}
