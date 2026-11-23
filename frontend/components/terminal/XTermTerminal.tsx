"use client";

import React, { useEffect, useRef } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { api } from "@/lib/api";

const COMMAND_SUGGESTIONS = [
  "help",
  "clear",
  "agentguard init",
  "agentguard project list",
  "agentguard target add https://api.internal.ai/v1",
  "agentguard firewall status",
  "agentguard firewall enable",
  "agentguard firewall monitor",
  "agentguard scan --type full",
  "agentguard scan --type prompt-injection",
  "agentguard scan --type api-security",
  "agentguard scan --type redteam",
  "agentguard threats --severity critical",
  "agentguard incidents list",
  "agentguard regression run",
  "agentguard report export",
];

export default function XTermTerminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const termInstance = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!terminalRef.current || termInstance.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "ui-monospace, Menlo, Monaco, Consolas, monospace",
      fontSize: 13,
      lineHeight: 1.4,
      theme: {
        background: "#080B10",
        foreground: "#E2E8F0",
        cursor: "#39FF88",
        selectionBackground: "rgba(57, 255, 136, 0.3)",
        black: "#101722",
        red: "#FF4040",
        green: "#39FF88",
        yellow: "#FFB800",
        blue: "#38BDF8",
        magenta: "#A855F7",
        cyan: "#06B6D4",
        white: "#F8FAFC",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    termInstance.current = term;
    fitAddonRef.current = fitAddon;

    // Terminal Initial Banner
    term.writeln("\x1b[1;32m   ___                    __  ______                      __ \x1b[0m");
    term.writeln("\x1b[1;32m  / _ | ___ ____ ___  ___/ /_/ _____/_ _____ _________  / / \x1b[0m");
    term.writeln("\x1b[1;32m / __ |/ _ `/ -_) _ \\/ _  / / _/ _  // // / _ `/ __/ _ \\/ _ \\\x1b[0m");
    term.writeln("\x1b[1;32m/_/ |_|\\_, /\\__/_//_/\\_,_/ /___/\\_,_/ \\_,_/\\_,_/_/  \\___/_//_/\x1b[0m");
    term.writeln("\x1b[1;32m      /___/                                                   \x1b[0m");
    term.writeln("\x1b[38;5;244mAI-Native Cybersecurity & Red Team SOC Terminal v1.0.0\x1b[0m");
    term.writeln("\x1b[38;5;244mConnected to backend security runtime at localhost:8000\x1b[0m");
    term.writeln("\x1b[36mType '\x1b[1;37mhelp\x1b[0;36m' to display available security commands or TAB to autocomplete.\x1b[0m\r\n");

    const promptStr = "\x1b[1;32magentguard\x1b[0m\x1b[38;5;244m:\x1b[0m\x1b[38;5;39m~\x1b[0m$ ";
    term.write(promptStr);

    let currentInput = "";
    const commandHistory: string[] = [];
    let historyIndex = -1;

    const handleResize = () => {
      try {
        fitAddon.fit();
      } catch (e) {}
    };
    window.addEventListener("resize", handleResize);

    const onDataDisposable = term.onData(async (data) => {
      const code = data.charCodeAt(0);

      // Enter key
      if (data === "\r") {
        term.write("\r\n");
        const trimmed = currentInput.trim();
        if (trimmed) {
          commandHistory.push(trimmed);
          historyIndex = commandHistory.length;

          // Process command
          try {
            const res = await api.executeTerminalCommand(trimmed);
            if (res.stdout) {
              term.write(res.stdout);
            }
            if (res.stderr) {
              term.write(res.stderr);
            }
          } catch (err: any) {
            term.write(`\x1b[31mError executing command: ${err.message}\x1b[0m\r\n`);
          }
        }
        currentInput = "";
        term.write(promptStr);
      }
      // Backspace
      else if (code === 127 || data === "\b") {
        if (currentInput.length > 0) {
          currentInput = currentInput.slice(0, -1);
          term.write("\b \b");
        }
      }
      // Tab Autocomplete
      else if (code === 9) {
        const matches = COMMAND_SUGGESTIONS.filter((s) => s.startsWith(currentInput));
        if (matches.length === 1) {
          const completion = matches[0].slice(currentInput.length);
          currentInput = matches[0];
          term.write(completion);
        } else if (matches.length > 1) {
          term.write("\r\n\x1b[38;5;244mSuggestions:\x1b[0m\r\n");
          matches.forEach((m) => term.writeln(`  \x1b[36m${m}\x1b[0m`));
          term.write(promptStr + currentInput);
        }
      }
      // Up Arrow (History Back)
      else if (data === "\x1b[A") {
        if (historyIndex > 0) {
          historyIndex--;
          // clear current line
          while (currentInput.length > 0) {
            term.write("\b \b");
            currentInput = currentInput.slice(0, -1);
          }
          currentInput = commandHistory[historyIndex] || "";
          term.write(currentInput);
        }
      }
      // Down Arrow (History Forward)
      else if (data === "\x1b[B") {
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          while (currentInput.length > 0) {
            term.write("\b \b");
            currentInput = currentInput.slice(0, -1);
          }
          currentInput = commandHistory[historyIndex] || "";
          term.write(currentInput);
        } else if (historyIndex === commandHistory.length - 1) {
          historyIndex = commandHistory.length;
          while (currentInput.length > 0) {
            term.write("\b \b");
            currentInput = currentInput.slice(0, -1);
          }
          currentInput = "";
        }
      }
      // Ctrl+C
      else if (code === 3) {
        term.write("^C\r\n" + promptStr);
        currentInput = "";
      }
      // Standard printable characters
      else if (code >= 32 && code <= 126) {
        currentInput += data;
        term.write(data);
      }
    });

    return () => {
      onDataDisposable.dispose();
      window.removeEventListener("resize", handleResize);
      term.dispose();
      termInstance.current = null;
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#080B10] rounded-xl border border-[#1A2332] overflow-hidden shadow-2xl">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#101722] border-b border-[#1A2332]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-[#FF4040]/80"></div>
          <div className="w-3 h-3 rounded-full bg-[#FFB800]/80"></div>
          <div className="w-3 h-3 rounded-full bg-[#39FF88]/80"></div>
          <span className="ml-2 font-mono text-xs text-slate-400 font-semibold tracking-wide">
            agentguard-cli — zsh (pty/0)
          </span>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#39FF88] animate-pulse"></span>
            CONNECTED
          </span>
          <span className="text-slate-600">|</span>
          <span className="text-slate-500">API: 127.0.0.1:8000</span>
        </div>
      </div>

      {/* Quick Command Pills */}
      <div className="flex items-center gap-2 px-4 py-2 bg-[#0C121A] border-b border-[#1A2332] overflow-x-auto text-xs">
        <span className="text-slate-500 font-mono text-[11px] uppercase tracking-wider shrink-0">Quick Run:</span>
        {[
          "agentguard scan --type full",
          "agentguard firewall status",
          "agentguard regression run",
          "agentguard threats --severity critical",
          "agentguard report export",
        ].map((cmd) => (
          <button
            key={cmd}
            onClick={async () => {
              if (termInstance.current) {
                termInstance.current.writeln(`\r\n\x1b[36m$ ${cmd}\x1b[0m`);
                try {
                  const res = await api.executeTerminalCommand(cmd);
                  if (res.stdout) termInstance.current.write(res.stdout);
                  if (res.stderr) termInstance.current.write(res.stderr);
                } catch (e: any) {
                  termInstance.current.writeln(`\x1b[31mError: ${e.message}\x1b[0m`);
                }
                termInstance.current.write("\x1b[1;32magentguard\x1b[0m\x1b[38;5;244m:\x1b[0m\x1b[38;5;39m~\x1b[0m$ ");
              }
            }}
            className="px-2.5 py-1 rounded bg-[#101722] hover:bg-[#1A2332] text-slate-300 hover:text-[#39FF88] border border-[#1A2332] font-mono text-[11px] whitespace-nowrap transition-colors"
          >
            {cmd}
          </button>
        ))}
      </div>

      {/* xterm canvas container */}
      <div className="flex-1 p-3 overflow-hidden bg-[#080B10]" ref={terminalRef}></div>
    </div>
  );
}
