#!/bin/bash
# VC Diligence Engine — Full Setup
# Run this once after unzipping the project

set -e

echo "========================================="
echo "  VC Diligence Engine — Setup"
echo "========================================="
echo ""

# -----------------------------------------------
# 1. Core dependencies
# -----------------------------------------------
echo "[1/5] Installing core dependencies..."

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# docx for Word document generation
if command -v npm &> /dev/null; then
    (cd "$PROJECT_DIR" && npm install docx --save 2>/dev/null) && echo "  ✅ docx (Word doc generation)" || echo "  ⚠️  docx install failed — try manually: npm install docx"
else
    echo "  ⚠️  npm not found — install Node.js first, then run: npm install docx"
fi

# pymupdf for PDF text extraction (speeds up pipeline by pre-extracting text)
if command -v pip3 &> /dev/null; then
    pip3 install pymupdf --quiet 2>/dev/null && echo "  ✅ pymupdf (PDF text extraction)" || pip3 install pymupdf --break-system-packages --quiet 2>/dev/null && echo "  ✅ pymupdf"
elif command -v pip &> /dev/null; then
    pip install pymupdf --quiet 2>/dev/null && echo "  ✅ pymupdf (PDF text extraction)" || echo "  ⚠️  pymupdf install failed — try: pip install pymupdf"
else
    echo "  ⚠️  pip not found — install Python first, then run: pip install pymupdf"
fi

# pyyaml for Deep Research Skills
if command -v pip &> /dev/null; then
    pip install pyyaml --quiet 2>/dev/null && echo "  ✅ pyyaml" || pip install pyyaml --break-system-packages --quiet 2>/dev/null && echo "  ✅ pyyaml"
else
    echo "  ⚠️  pip not found — install Python first, then run: pip install pyyaml"
fi

# Web UI dependencies
if [ -d "$PROJECT_DIR/web" ]; then
    echo "  Installing web UI dependencies..."
    (cd "$PROJECT_DIR/web" && npm install --silent 2>/dev/null) && echo "  ✅ Web UI (Next.js)" || echo "  ⚠️  Web UI install failed — try: cd web && npm install"
fi

echo ""

# -----------------------------------------------
# 2. VoltAgent Subagents (research specialists)
# -----------------------------------------------
echo "[2/5] Installing VoltAgent research subagents..."

VOLTAGENT_REPO="https://raw.githubusercontent.com/VoltAgent/awesome-claude-code-subagents/main"
AGENTS_DIR="$HOME/.claude/agents"
mkdir -p "$AGENTS_DIR"

# Download specific research/analysis agents we need
VOLTAGENT_AGENTS=(
    "categories/10-research-analysis/research-analyst.md"
    "categories/10-research-analysis/competitive-analyst.md"
    "categories/10-research-analysis/trend-analyst.md"
    "categories/10-research-analysis/data-researcher.md"
)

for agent_path in "${VOLTAGENT_AGENTS[@]}"; do
    filename=$(basename "$agent_path")
    # Prefix with voltagent- to avoid conflicts with our custom agents
    target="$AGENTS_DIR/voltagent-$filename"
    if curl -sS "$VOLTAGENT_REPO/$agent_path" -o "$target" 2>/dev/null; then
        echo "  ✅ voltagent-$filename"
    else
        echo "  ⚠️  Failed to download $filename — you can install manually later"
    fi
done

echo ""

# -----------------------------------------------
# 3. Deep Research Skills (web search agent)
# -----------------------------------------------
echo "[3/5] Installing Deep Research Skills..."

SKILLS_DIR="$HOME/.claude/skills"
mkdir -p "$SKILLS_DIR"
mkdir -p "$AGENTS_DIR"

TEMP_DIR=$(mktemp -d)
if git clone --quiet --depth 1 https://github.com/Weizhena/Deep-Research-skills.git "$TEMP_DIR/deep-research" 2>/dev/null; then
    # Install English research skills
    if [ -d "$TEMP_DIR/deep-research/skills/research-en" ]; then
        cp -r "$TEMP_DIR/deep-research/skills/research-en/"* "$SKILLS_DIR/" 2>/dev/null
        echo "  ✅ Deep Research skills (English)"
    fi
    # Install web search agent and modules
    if [ -f "$TEMP_DIR/deep-research/agents/web-search-agent.md" ]; then
        cp "$TEMP_DIR/deep-research/agents/web-search-agent.md" "$AGENTS_DIR/"
        echo "  ✅ Web search agent"
    fi
    if [ -d "$TEMP_DIR/deep-research/agents/web-search-modules" ]; then
        cp -r "$TEMP_DIR/deep-research/agents/web-search-modules" "$AGENTS_DIR/"
        echo "  ✅ Web search modules"
    fi
else
    echo "  ⚠️  Failed to clone Deep Research Skills — install manually:"
    echo "     git clone https://github.com/Weizhena/Deep-Research-skills.git"
    echo "     cp -r skills/research-en/* ~/.claude/skills/"
    echo "     cp agents/web-search-agent.md ~/.claude/agents/"
    echo "     cp -r agents/web-search-modules ~/.claude/agents/"
fi
rm -rf "$TEMP_DIR"

echo ""

# -----------------------------------------------
# 4. Lyndonkl Thinking Frameworks (decision matrix, claim verification)
# -----------------------------------------------
echo "[4/5] Installing Thinking Frameworks (selected skills)..."

TEMP_DIR=$(mktemp -d)
if git clone --quiet --depth 1 https://github.com/lyndonkl/claude.git "$TEMP_DIR/thinking" 2>/dev/null; then
    # Cherry-pick the skills most relevant to diligence work
    THINKING_SKILLS=(
        "decision-matrix"
        "research-claim-map"
        "bayesian-reasoning-calibration"
        "reviews-retros-reflection"
        "meta-prompt-engineering"
    )
    
    for skill in "${THINKING_SKILLS[@]}"; do
        skill_dir="$TEMP_DIR/thinking/skills/$skill"
        if [ -d "$skill_dir" ]; then
            cp -r "$skill_dir" "$SKILLS_DIR/"
            echo "  ✅ $skill"
        elif [ -f "$TEMP_DIR/thinking/skills/$skill.md" ]; then
            cp "$TEMP_DIR/thinking/skills/$skill.md" "$SKILLS_DIR/"
            echo "  ✅ $skill"
        else
            # Try to find it anywhere in the repo
            found=$(find "$TEMP_DIR/thinking" -name "$skill" -o -name "$skill.md" 2>/dev/null | head -1)
            if [ -n "$found" ]; then
                cp -r "$found" "$SKILLS_DIR/"
                echo "  ✅ $skill"
            else
                echo "  ⚠️  $skill not found — may need manual install"
            fi
        fi
    done
else
    echo "  ⚠️  Failed to clone Thinking Frameworks — install manually:"
    echo "     In Claude Code: /plugin marketplace add lyndonkl/claude"
    echo "     Then: /plugin install thinking-frameworks-skills"
fi
rm -rf "$TEMP_DIR"

echo ""

# -----------------------------------------------
# 5. Verify project structure
# -----------------------------------------------
echo "[5/5] Verifying project structure..."

# Check local project agents exist
LOCAL_AGENTS=(
    "deck-analyst.md"
    "market-researcher.md"
    "team-researcher.md"
    "financial-modeler.md"
    "terms-analyst.md"
    "impact-analyst.md"
    "synthesis-agent.md"
    "adversarial-reviewer.md"
)

all_good=true
for agent in "${LOCAL_AGENTS[@]}"; do
    if [ -f "$PROJECT_DIR/.claude/agents/$agent" ]; then
        echo "  ✅ $agent"
    else
        echo "  ❌ MISSING: $agent"
        all_good=false
    fi
done

# Check skills
LOCAL_SKILLS=(
    "full-diligence.md"
    "fund-diligence.md"
)

for skill in "${LOCAL_SKILLS[@]}"; do
    if [ -f "$PROJECT_DIR/.claude/skills/$skill" ]; then
        echo "  ✅ $skill"
    else
        echo "  ❌ MISSING: $skill"
        all_good=false
    fi
done

# Check directories
for dir in deals output templates; do
    if [ -d "$PROJECT_DIR/$dir" ]; then
        echo "  ✅ $dir/"
    else
        mkdir -p "$PROJECT_DIR/$dir"
        echo "  ✅ $dir/ (created)"
    fi
done

echo ""
echo "========================================="
if [ "$all_good" = true ]; then
    echo "  Setup complete! ✅"
else
    echo "  Setup complete with warnings ⚠️"
    echo "  Check messages above for any issues."
fi
echo ""
echo "  To get started with the CLI:"
echo "    claude"
echo "    > Run full diligence on the deck in deals/[company-name]/"
echo ""
echo "  To start the web UI:"
echo "    cd web && npm run dev"
echo "    Open http://localhost:3000"
echo ""
echo "  Prerequisites:"
echo "    - Node.js 18+"
echo "    - Python 3 (for PDF extraction)"
echo "    - Claude Code CLI (claude.ai/download)"
echo "========================================="
