#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as z from "zod";
import {
  mouseClick,
  mouseDoubleClick,
  mouseRightClick,
  mouseScroll,
  mouseMove,
} from "./mouse.js";
import { typeText, pressKey, hotkey } from "./keyboard.js";
import { openPath, focusWindow } from "./explorer.js";
import { performActions } from "./actions.js";

const server = new McpServer({
  name: "vox-pilot-hands",
  version: "0.2.0",
});

// === Compound action tool (recommended for multi-step GUI operations) ===

const ActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("focus"), window: z.string().describe("Window title or partial match") }),
  z.object({ action: z.literal("click"), x: z.number(), y: z.number() }),
  z.object({ action: z.literal("double_click"), x: z.number(), y: z.number() }),
  z.object({ action: z.literal("right_click"), x: z.number(), y: z.number() }),
  z.object({
    action: z.literal("scroll"),
    direction: z.enum(["up", "down", "left", "right"]),
    amount: z.number().default(3),
  }),
  z.object({ action: z.literal("type"), text: z.string().describe("Text to type (supports Unicode/Japanese)") }),
  z.object({ action: z.literal("key"), key: z.string().describe("Special key: Enter, Tab, Escape, Up, Down, F1-F12, etc.") }),
  z.object({ action: z.literal("hotkey"), keys: z.array(z.string()).describe('e.g. ["ctrl", "c"]') }),
  z.object({ action: z.literal("wait"), ms: z.number().default(300) }),
]);

server.tool(
  "perform_actions",
  {
    actions: z
      .array(ActionSchema)
      .describe(
        "Sequential actions to perform in a single process. Use this instead of individual tools when you need multiple steps (e.g., focus window + click + type). All actions run in one process so window focus is preserved between steps."
      ),
    delay_between_ms: z
      .number()
      .default(200)
      .describe("Delay between each action in milliseconds"),
  },
  async ({ actions, delay_between_ms }) => {
    const result = await performActions(actions, delay_between_ms);
    if (result.error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${result.error}\nCompleted before error: ${result.completed.join(", ") || "none"}`,
          },
        ],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: "text",
          text: `All ${actions.length} actions completed:\n${result.completed.join("\n")}`,
        },
      ],
    };
  }
);

// === Individual tools (for simple single-step operations) ===

// Mouse operations
server.tool(
  "mouse_click",
  {
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate"),
  },
  async ({ x, y }) => {
    await mouseClick(x, y);
    return { content: [{ type: "text", text: `Clicked at (${x}, ${y})` }] };
  }
);

server.tool(
  "mouse_double_click",
  {
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate"),
  },
  async ({ x, y }) => {
    await mouseDoubleClick(x, y);
    return {
      content: [{ type: "text", text: `Double-clicked at (${x}, ${y})` }],
    };
  }
);

server.tool(
  "mouse_right_click",
  {
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate"),
  },
  async ({ x, y }) => {
    await mouseRightClick(x, y);
    return {
      content: [{ type: "text", text: `Right-clicked at (${x}, ${y})` }],
    };
  }
);

server.tool(
  "mouse_scroll",
  {
    direction: z
      .enum(["up", "down", "left", "right"])
      .describe("Scroll direction"),
    amount: z.number().default(3).describe("Scroll amount (lines)"),
  },
  async ({ direction, amount }) => {
    await mouseScroll(direction, amount);
    return {
      content: [
        { type: "text", text: `Scrolled ${direction} by ${amount}` },
      ],
    };
  }
);

server.tool(
  "mouse_move",
  {
    x: z.number().describe("X coordinate"),
    y: z.number().describe("Y coordinate"),
  },
  async ({ x, y }) => {
    await mouseMove(x, y);
    return {
      content: [{ type: "text", text: `Moved mouse to (${x}, ${y})` }],
    };
  }
);

// Keyboard operations
server.tool(
  "type_text",
  {
    text: z.string().describe("Text to type (supports Unicode/Japanese)"),
  },
  async ({ text }) => {
    await typeText(text);
    return { content: [{ type: "text", text: `Typed: ${text}` }] };
  }
);

server.tool(
  "press_key",
  {
    key: z
      .string()
      .describe(
        "Key to press (e.g., Enter, Tab, Escape, Backspace, Delete, Up, Down, Left, Right, F1-F12)"
      ),
  },
  async ({ key }) => {
    await pressKey(key);
    return { content: [{ type: "text", text: `Pressed: ${key}` }] };
  }
);

server.tool(
  "hotkey",
  {
    keys: z
      .array(z.string())
      .describe(
        'Keys to press simultaneously (e.g., ["ctrl", "c"] for Ctrl+C)'
      ),
  },
  async ({ keys }) => {
    await hotkey(keys);
    return {
      content: [{ type: "text", text: `Hotkey: ${keys.join("+")}` }],
    };
  }
);

// Window and file operations
server.tool(
  "open_path",
  {
    path: z
      .string()
      .describe("File or folder path to open in Explorer or default app"),
  },
  async ({ path }) => {
    await openPath(path);
    return { content: [{ type: "text", text: `Opened: ${path}` }] };
  }
);

server.tool(
  "focus_window",
  {
    name: z.string().describe("Window title or partial match to focus"),
  },
  async ({ name }) => {
    const result = await focusWindow(name);
    return { content: [{ type: "text", text: result }] };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
