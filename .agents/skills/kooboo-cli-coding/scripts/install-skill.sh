#!/usr/bin/env bash
# 将 kooboo-cli-coding skill 链接到常见 AI 工具的 skills 目录
set -euo pipefail

SKILL_NAME="kooboo-cli-coding"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SKILL_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_ROOT/../.." && pwd)"

link_skill() {
  local target_dir="$1"
  local link_path="$target_dir/$SKILL_NAME"

  mkdir -p "$target_dir"

  if [[ -L "$link_path" ]]; then
    echo "已存在 symlink: $link_path -> $(readlink "$link_path")"
    read -r -p "是否替换? [y/N] " ans
    if [[ "${ans,,}" != "y" ]]; then
      echo "跳过 $link_path"
      return
    fi
    rm "$link_path"
  elif [[ -e "$link_path" ]]; then
    echo "目标已存在且非 symlink: $link_path"
    echo "请手动处理后重试"
    return
  fi

  ln -s "$SKILL_ROOT" "$link_path"
  echo "已链接: $link_path -> $SKILL_ROOT"
}

echo "kooboo-cli-coding skill 安装"
echo "Skill 路径: $SKILL_ROOT"
echo "仓库根目录: $REPO_ROOT"
echo ""
echo "推荐（agent-skills 生态）:"
echo "  npx skills add achen-11/kooboo-cli-coding --skill kooboo-cli-coding"
echo ""

# 非交互模式：传入 --yes 自动链接所有 Detected 目录
AUTO_YES=false
if [[ "${1:-}" == "--yes" ]]; then
  AUTO_YES=true
fi

install_to() {
  local dir="$1"
  if [[ -d "$(dirname "$dir")" ]] || [[ "$AUTO_YES" == true ]]; then
    if [[ "$AUTO_YES" == true ]]; then
      mkdir -p "$dir"
      local link_path="$dir/$SKILL_NAME"
      ln -sfn "$SKILL_ROOT" "$link_path"
      echo "已链接: $link_path -> $SKILL_ROOT"
    else
      link_skill "$dir"
    fi
  else
    echo "跳过（目录不存在）: $dir"
  fi
}

install_to "$HOME/.cursor/skills"
install_to "$HOME/.codex/skills"
install_to "$HOME/.claude/skills"

echo ""
echo "完成。各平台 Agent 应能发现 skill: $SKILL_NAME"
echo "站点项目 spec 请复制 skills/kooboo-cli-coding/templates/project-spec/ 到项目根 .kooboo-ai/"
echo "宣传站: https://kooboo_cli_coding.localkooboo.com"
