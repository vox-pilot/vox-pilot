#!/usr/bin/env node

import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const SKILL_CONTENT = `---
name: vox-pilot
description: Voice/text-driven desktop control — see the screen, click, type, scroll, open files
---

You have access to desktop control tools via MCP. When the user asks you to interact with their PC:

1. Use \`screenshot\` to see what's on screen
2. Use \`list_windows\` to find open applications
3. Use \`mouse_click\`, \`mouse_scroll\`, \`type_text\`, \`press_key\`, \`hotkey\` to interact
4. Use \`open_path\` to open files/folders in Explorer
5. Use \`focus_window\` to switch between applications

Always take a screenshot first to understand the current state before acting.
Confirm destructive actions (closing apps, deleting files) before executing.
Respond in the user's language.
`;

function detectPlatform(): "claude-code" | "codex" | "unknown" {
  try {
    execSync("claude --version", { stdio: "ignore" });
    return "claude-code";
  } catch {}
  try {
    execSync("codex --version", { stdio: "ignore" });
    return "codex";
  } catch {}
  return "unknown";
}

function setupClaudeCode(): void {
  console.log("Setting up Vox Pilot for Claude Code...");

  // Register MCP servers
  execSync(
    'claude mcp add vox-pilot-screen -- npx @vox-pilot/screen',
    { stdio: "inherit" }
  );
  execSync(
    'claude mcp add vox-pilot-hands -- npx @vox-pilot/hands',
    { stdio: "inherit" }
  );

  // Install skill
  const skillDir = join(homedir(), ".claude", "skills", "vox-pilot");
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), SKILL_CONTENT);

  console.log("✓ MCP servers registered");
  console.log("✓ Skill installed");
  console.log("");
  console.log("Ready! Open Claude Code and try:");
  console.log('  "Take a screenshot and tell me what you see"');
  console.log('  "Open my Documents folder"');
}

function setupCodex(): void {
  console.log("Setting up Vox Pilot for Codex...");

  // Register MCP servers via codex CLI
  execSync(
    'codex mcp add vox-pilot-screen -- npx @vox-pilot/screen',
    { stdio: "inherit" }
  );
  execSync(
    'codex mcp add vox-pilot-hands -- npx @vox-pilot/hands',
    { stdio: "inherit" }
  );

  console.log("✓ MCP servers registered");
  console.log("");
  console.log("Ready! Open Codex and try:");
  console.log('  "Take a screenshot and tell me what you see"');
  console.log('  "Open my Documents folder"');
}

async function main(): Promise<void> {
  console.log("🛫 Vox Pilot — Your voice flies your desktop.");
  console.log("");

  const platform = detectPlatform();

  if (platform === "claude-code") {
    setupClaudeCode();
  } else if (platform === "codex") {
    setupCodex();
  } else {
    console.log("Neither Claude Code nor Codex CLI detected.");
    console.log("Please install one of them first:");
    console.log("  Claude Code: npm install -g @anthropic-ai/claude-code");
    console.log("  Codex:       npm install -g @openai/codex");
    process.exit(1);
  }
}

main().catch(console.error);
