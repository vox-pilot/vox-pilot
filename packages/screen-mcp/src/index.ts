#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import { captureScreenshot, captureRegion } from "./screenshot.js";
import { listWindows, getWindowInfo } from "./windows.js";

const server = new McpServer({
  name: "vox-pilot-screen",
  version: "0.1.0",
});

// Take a full screenshot
server.tool("screenshot", {}, async () => {
  const imageBase64 = await captureScreenshot();
  return {
    content: [
      {
        type: "image",
        data: imageBase64,
        mimeType: "image/png",
      },
    ],
  };
});

// Take a screenshot of a specific region
server.tool(
  "screenshot_region",
  {
    x: z.number().describe("X coordinate of the top-left corner"),
    y: z.number().describe("Y coordinate of the top-left corner"),
    width: z.number().describe("Width of the region"),
    height: z.number().describe("Height of the region"),
  },
  async ({ x, y, width, height }) => {
    const imageBase64 = await captureRegion(x, y, width, height);
    return {
      content: [
        {
          type: "image",
          data: imageBase64,
          mimeType: "image/png",
        },
      ],
    };
  }
);

// List all open windows
server.tool("list_windows", {}, async () => {
  const windows = await listWindows();
  return {
    content: [{ type: "text", text: JSON.stringify(windows, null, 2) }],
  };
});

// Get info about a specific window
server.tool(
  "get_window_info",
  {
    name: z.string().describe("Window title or partial match"),
  },
  async ({ name }) => {
    const info = await getWindowInfo(name);
    return {
      content: [{ type: "text", text: JSON.stringify(info, null, 2) }],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
