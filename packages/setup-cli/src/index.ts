#!/usr/bin/env node

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const CLAUDE_SKILL_CONTENT = `# Vox Pilot - Claude Code Skill

Vox Pilot gives Claude Code desktop control tools.

## Default Mode

Desktop control starts in \`OFF\` mode for every new chat.

When Vox Pilot is \`OFF\`:

- Do not use desktop control tools.
- Do not take screenshots.
- Do not click, type, scroll, open paths, or switch windows.
- If the user asks for desktop control, first ask them to say \`ボックスパイロット開始\`.

## Start Command

If the user says one of the following, switch Vox Pilot to \`ON\` for the current chat:

- \`ボックスパイロット開始\`
- \`Vox Pilot start\`
- \`desktop control start\`

After switching to \`ON\`, reply briefly that desktop control is now enabled.

## Stop Command

If the user says one of the following, switch Vox Pilot to \`OFF\` for the current chat:

- \`ボックスパイロット終了\`
- \`Vox Pilot stop\`
- \`desktop control stop\`

After switching to \`OFF\`, reply briefly that desktop control is now disabled.

## When ON

Use Vox Pilot MCP tools to help the user operate the PC.

### Safe Workflow

1. Use \`screenshot\` first to understand the current screen.
2. Explain what you are about to do.
3. Use the smallest set of actions needed.
4. Take another screenshot when verification matters.

### Available Tools

Screen tools:

- \`screenshot\`
- \`screenshot_region\`
- \`list_windows\`
- \`get_window_info\`

Hands tools:

- \`mouse_click\`
- \`mouse_double_click\`
- \`mouse_right_click\`
- \`mouse_scroll\`
- \`mouse_move\`
- \`type_text\`
- \`press_key\`
- \`hotkey\`
- \`open_path\`
- \`focus_window\`
- \`perform_actions\`

## Rules

- Respond in the user's language.
- Confirm destructive actions before executing them.
- If a target is small or ambiguous, inspect it first with \`screenshot_region\`.
- Prefer \`perform_actions\` for multi-step flows.
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

  execSync("claude mcp add vox-pilot-screen -- npx @vox-pilot/screen", {
    stdio: "inherit",
  });
  execSync("claude mcp add vox-pilot-hands -- npx @vox-pilot/hands", {
    stdio: "inherit",
  });

  const skillDir = join(homedir(), ".claude", "skills", "vox-pilot");
  mkdirSync(skillDir, { recursive: true });
  writeFileSync(join(skillDir, "SKILL.md"), CLAUDE_SKILL_CONTENT, "utf-8");

  console.log("MCP servers registered.");
  console.log("Claude Code skill installed.");
  console.log("");
  console.log("Daily use:");
  console.log('  1. Open Claude Code');
  console.log('  2. Say "ボックスパイロット開始"');
  console.log('  3. Give desktop commands');
  console.log('  4. Say "ボックスパイロット終了" when done');
}

function setupCodex(): void {
  console.log("Setting up Vox Pilot for Codex...");

  execSync("codex mcp add vox-pilot-screen -- npx @vox-pilot/screen", {
    stdio: "inherit",
  });
  execSync("codex mcp add vox-pilot-hands -- npx @vox-pilot/hands", {
    stdio: "inherit",
  });

  console.log("MCP servers registered.");
  console.log("");
  console.log("Ready. Open Codex and use the registered tools.");
}

async function main(): Promise<void> {
  console.log("Vox Pilot - your voice flies your desktop.");
  console.log("");

  const platform = detectPlatform();

  if (platform === "claude-code") {
    setupClaudeCode();
    return;
  }

  if (platform === "codex") {
    setupCodex();
    return;
  }

  console.log("Neither Claude Code nor Codex CLI was detected.");
  console.log("Please install one of them first:");
  console.log("  Claude Code: npm install -g @anthropic-ai/claude-code");
  console.log("  Codex:       npm install -g @openai/codex");
  process.exit(1);
}

main().catch(console.error);
