#!/usr/bin/env node
/**
 * kooboo-cli-coding Preflight scanner
 *
 * 本地文件扫描，不依赖 Kooboo AI Chat 运行时。
 * 用法见 preflight/index.md
 *
 * TODO: 完善 YAML 规则加载、artifact 类型过滤、更丰富的输出格式
 */

const fs = require("fs");
const path = require("path");

const SKILL_ROOT = path.resolve(__dirname, "..");
const RULES_DIR = path.join(SKILL_ROOT, "preflight", "rules");

function parseArgs(argv) {
  const args = { root: process.cwd(), artifacts: [] };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === "--root" && argv[i + 1]) {
      args.root = path.resolve(argv[++i]);
    } else if (argv[i] === "--artifacts" && argv[i + 1]) {
      try {
        args.artifacts = JSON.parse(argv[++i]);
      } catch (e) {
        console.error("Invalid --artifacts JSON:", e.message);
        process.exit(2);
      }
    } else if (argv[i] === "--help" || argv[i] === "-h") {
      printHelp();
      process.exit(0);
    }
  }
  return args;
}

function printHelp() {
  console.log(`Usage: node preflight-scan.js [options]

Options:
  --root <path>       Site project root (default: cwd)
  --artifacts <json>  JSON array of { path, type, layoutId? }
  -h, --help          Show help

Example:
  node preflight-scan.js --root . --artifacts '[{"path":"src/page/home.html","type":"Page"}]'
`);
}

function loadRules() {
  const rules = [];
  if (!fs.existsSync(RULES_DIR)) return rules;

  for (const file of fs.readdirSync(RULES_DIR)) {
    if (!file.endsWith(".yaml") && !file.endsWith(".yml")) continue;
    const content = fs.readFileSync(path.join(RULES_DIR, file), "utf8");
    rules.push(...parseSimpleYamlRules(content, file));
  }
  return rules;
}

/**
 * 轻量 YAML 解析 — 仅支持本 repo 的 rules 格式，后续可换 yaml 库
 */
function parseSimpleYamlRules(content, sourceFile) {
  const rules = [];
  let current = null;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("- id:")) {
      if (current) rules.push(current);
      current = { sourceFile, id: trimmed.slice("- id:".length).trim() };
    } else if (current && trimmed.startsWith("severity:")) {
      current.severity = trimmed.slice("severity:".length).trim();
    } else if (current && trimmed.startsWith("message:")) {
      current.message = trimmed.slice("message:".length).trim().replace(/^"|"$/g, "");
    } else if (current && trimmed.startsWith("pattern:")) {
      const raw = trimmed.slice("pattern:".length).trim().replace(/^'|'$/g, "").replace(/^"|"$/g, "");
      current.pattern = new RegExp(raw);
    } else if (current && trimmed.startsWith("appliesTo:")) {
      const val = trimmed.slice("appliesTo:".length).trim();
      if (val.startsWith("[")) {
        current.appliesTo = val
          .replace(/[\[\]]/g, "")
          .split(",")
          .map((s) => s.trim());
      } else {
        current.appliesTo = [val];
      }
    } else if (current && trimmed.startsWith("matchType:")) {
      current.matchType = trimmed.slice("matchType:".length).trim();
    }
  }
  if (current) rules.push(current);
  return rules;
}

function scanArtifact(root, artifact, rules) {
  const filePath = path.join(root, artifact.path);
  const findings = [];

  if (!fs.existsSync(filePath)) {
    findings.push({
      severity: "BLOCKER",
      ruleId: "file-not-found",
      message: `文件不存在: ${artifact.path}`,
      path: artifact.path,
    });
    return findings;
  }

  const content = fs.readFileSync(filePath, "utf8");

  for (const rule of rules) {
    if (!rule.pattern) continue;
    if (rule.appliesTo && !rule.appliesTo.includes(artifact.type)) continue;

    const matched = rule.pattern.test(content);
    const failed =
      rule.matchType === "absent" ? !matched : matched;

    if (failed) {
      findings.push({
        severity: rule.severity || "WARN",
        ruleId: rule.id,
        message: rule.message,
        path: artifact.path,
        sourceFile: rule.sourceFile,
      });
    }
  }

  return findings;
}

function main() {
  const args = parseArgs(process.argv);

  if (args.artifacts.length === 0) {
    console.error("No artifacts provided. Use --artifacts '[...]'");
    printHelp();
    process.exit(2);
  }

  const rules = loadRules();
  const allFindings = [];

  for (const artifact of args.artifacts) {
    if (!artifact.path || !artifact.type) {
      console.error("Each artifact requires path and type:", artifact);
      process.exit(2);
    }
    allFindings.push(...scanArtifact(args.root, artifact, rules));
  }

  const blockers = allFindings.filter((f) => f.severity === "BLOCKER");
  const warns = allFindings.filter((f) => f.severity === "WARN");

  console.log(JSON.stringify({ blockers, warns, ok: blockers.length === 0 }, null, 2));

  if (blockers.length > 0) {
    process.exit(1);
  }
}

main();
