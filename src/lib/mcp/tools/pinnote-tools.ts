// MCP tools for PinNote
// PinNote is a session-only app (no database persistence), so MCP tools
// expose app information and OCR capabilities rather than stored data.

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

export function registerGetAppInfo(server: McpServer, _userId: string) {
  server.registerTool(
    "get_app_info",
    {
      description:
        "Get information about the PinNote app — its purpose, supported features, and usage instructions.",
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                name: "PinNote",
                description:
                  "A browser-based workspace for pinning borderless floating reference cards over any window. Users can upload images, paste screenshots, or type text to create floating cards that stay visible while they work.",
                features: [
                  "Upload images and extract text via OCR (Gemini Vision)",
                  "Paste screenshots from clipboard (Ctrl+V)",
                  "Type text to create floating text cards",
                  "Drag cards anywhere on the canvas",
                  "Double-click to hide a card back to the box",
                  "Right-click for context menu (delete, drawing tools)",
                  "Card box with edge-snap hide behavior",
                  "Drawing tools: pen, highlighter, eraser",
                  "Bulk delete selected cards",
                ],
                usage:
                  "Open the app, type text in the bottom drawer and click 'Pin to screen', or upload/paste an image. Cards appear in the card box. Click the eye icon to eject them onto the canvas.",
              },
              null,
              2
            ),
          },
        ],
      };
    }
  );
}

export function registerExtractTextFromImage(server: McpServer, _userId: string) {
  server.registerTool(
    "extract_text_from_image",
    {
      description:
        "Extract all text from an image using OCR. Provide the image as a base64-encoded string. Returns the extracted plain text.",
      inputSchema: {
        imageBase64: z.string().describe("Base64-encoded image data (no data URL prefix)"),
        mimeType: z
          .enum(["image/png", "image/jpeg", "image/webp", "image/gif"])
          .optional()
          .describe("Image MIME type (default: image/png)"),
      },
    },
    async ({ imageBase64, mimeType = "image/png" }) => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return {
          isError: true,
          content: [{ type: "text", text: "AI service not configured (GEMINI_API_KEY missing)" }],
        };
      }

      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: [
            {
              role: "user",
              parts: [
                { inlineData: { mimeType, data: imageBase64 } },
                {
                  text: "Extract ALL text from this image exactly as it appears. Preserve line breaks. Return ONLY the extracted text, no commentary.",
                },
              ],
            },
          ],
        });
        const text = response.text?.trim() ?? "";
        return { content: [{ type: "text", text: text || "(no text found in image)" }] };
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "OCR failed";
        return { isError: true, content: [{ type: "text", text: msg }] };
      }
    }
  );
}

export function registerListSupportedTools(server: McpServer, _userId: string) {
  server.registerTool(
    "list_supported_tools",
    {
      description: "List all available MCP tools in this PinNote server with descriptions.",
    },
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              [
                {
                  name: "get_app_info",
                  description: "Get app purpose, features, and usage instructions",
                },
                {
                  name: "extract_text_from_image",
                  description: "Run OCR on a base64 image using Gemini Vision",
                },
                {
                  name: "list_supported_tools",
                  description: "List all tools in this server",
                },
              ],
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
