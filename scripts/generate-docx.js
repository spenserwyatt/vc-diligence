#!/usr/bin/env node
/**
 * generate-docx.js — Convert a markdown memo to a professionally formatted .docx
 *
 * Usage: node scripts/generate-docx.js <input.md> <output.docx>
 * Example: node scripts/generate-docx.js deals/acme/07-memo.md output/acme-diligence-memo.docx
 */

const fs = require("fs");
const path = require("path");
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TableRow,
  TableCell,
  Table,
  WidthType,
  BorderStyle,
  convertInchesToTwip,
  PageBreak,
} = require("docx");

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error("Usage: node generate-docx.js <input.md> <output.docx>");
  process.exit(1);
}

if (!fs.existsSync(inputPath)) {
  console.error(`Error: Input file not found: ${inputPath}`);
  process.exit(1);
}

const markdown = fs.readFileSync(inputPath, "utf-8");
const lines = markdown.split("\n");

// Style constants
const FONT = "Calibri";
const COLORS = {
  heading1: "1B2A4A",
  heading2: "2C5F8A",
  heading3: "3A7CA5",
  body: "333333",
  muted: "666666",
  accent: "C0392B",
  tableHeader: "1B2A4A",
  tableBorder: "BDC3C7",
  verified: "27AE60",
  warning: "F39C12",
  red_flag: "E74C3C",
};

/**
 * Parse markdown into structured blocks
 */
function parseMarkdown(lines) {
  const blocks = [];
  let i = 0;
  let inTable = false;
  let tableRows = [];

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") {
      if (inTable && tableRows.length > 0) {
        blocks.push({ type: "table", rows: tableRows });
        tableRows = [];
        inTable = false;
      }
      i++;
      continue;
    }

    // Headings
    const h1Match = line.match(/^# (.+)/);
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);
    const h4Match = line.match(/^#### (.+)/);

    if (h1Match) {
      blocks.push({ type: "h1", text: h1Match[1] });
      i++;
      continue;
    }
    if (h2Match) {
      blocks.push({ type: "h2", text: h2Match[1] });
      i++;
      continue;
    }
    if (h3Match) {
      blocks.push({ type: "h3", text: h3Match[1] });
      i++;
      continue;
    }
    if (h4Match) {
      blocks.push({ type: "h4", text: h4Match[1] });
      i++;
      continue;
    }

    // Horizontal rule / page break
    if (/^---+$/.test(line.trim())) {
      blocks.push({ type: "hr" });
      i++;
      continue;
    }

    // Table row
    if (line.trim().startsWith("|")) {
      const cells = line
        .trim()
        .split("|")
        .filter((c) => c.trim() !== "");

      // Skip separator rows (|---|---|)
      if (cells.every((c) => /^[\s-:]+$/.test(c))) {
        i++;
        continue;
      }

      inTable = true;
      tableRows.push(cells.map((c) => c.trim()));
      i++;
      continue;
    }

    // Flush any pending table
    if (inTable && tableRows.length > 0) {
      blocks.push({ type: "table", rows: tableRows });
      tableRows = [];
      inTable = false;
    }

    // Bullet list
    if (/^\s*[-*]\s/.test(line)) {
      const indent = line.match(/^(\s*)/)[1].length;
      const text = line.replace(/^\s*[-*]\s+/, "");
      blocks.push({ type: "bullet", text, indent: Math.floor(indent / 2) });
      i++;
      continue;
    }

    // Numbered list
    if (/^\s*\d+\.\s/.test(line)) {
      const text = line.replace(/^\s*\d+\.\s+/, "");
      blocks.push({ type: "numbered", text });
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith(">")) {
      const text = line.replace(/^>\s*/, "");
      blocks.push({ type: "quote", text });
      i++;
      continue;
    }

    // Regular paragraph
    blocks.push({ type: "paragraph", text: line });
    i++;
  }

  // Flush trailing table
  if (tableRows.length > 0) {
    blocks.push({ type: "table", rows: tableRows });
  }

  return blocks;
}

/**
 * Convert inline markdown to TextRun array
 */
function parseInline(text) {
  const runs = [];
  // Pattern: **bold**, *italic*, `code`, status emojis
  const pattern = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|([\u2705\u26A0\uFE0F\uD83D\uDEA9]))/g;

  let lastIndex = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    // Text before match
    if (match.index > lastIndex) {
      runs.push(
        new TextRun({
          text: text.slice(lastIndex, match.index),
          font: FONT,
          size: 22,
          color: COLORS.body,
        })
      );
    }

    if (match[2]) {
      // Bold
      runs.push(
        new TextRun({
          text: match[2],
          bold: true,
          font: FONT,
          size: 22,
          color: COLORS.body,
        })
      );
    } else if (match[3]) {
      // Italic
      runs.push(
        new TextRun({
          text: match[3],
          italics: true,
          font: FONT,
          size: 22,
          color: COLORS.muted,
        })
      );
    } else if (match[4]) {
      // Code
      runs.push(
        new TextRun({
          text: match[4],
          font: "Consolas",
          size: 20,
          color: COLORS.heading2,
        })
      );
    } else if (match[5]) {
      // Emoji status indicators
      runs.push(
        new TextRun({
          text: match[5],
          font: FONT,
          size: 22,
        })
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Remaining text
  if (lastIndex < text.length) {
    runs.push(
      new TextRun({
        text: text.slice(lastIndex),
        font: FONT,
        size: 22,
        color: COLORS.body,
      })
    );
  }

  if (runs.length === 0) {
    runs.push(
      new TextRun({
        text: text,
        font: FONT,
        size: 22,
        color: COLORS.body,
      })
    );
  }

  return runs;
}

/**
 * Build a docx Table from parsed rows
 */
function buildTable(rows) {
  if (rows.length === 0) return null;

  const isHeader = (idx) => idx === 0;
  const colCount = rows[0].length;

  const tableRows = rows.map((row, rowIdx) => {
    // Pad row if it has fewer cells than header
    while (row.length < colCount) row.push("");

    return new TableRow({
      tableHeader: isHeader(rowIdx),
      children: row.map(
        (cell) =>
          new TableCell({
            children: [
              new Paragraph({
                children: isHeader(rowIdx)
                  ? [
                      new TextRun({
                        text: cell,
                        bold: true,
                        font: FONT,
                        size: 20,
                        color: "FFFFFF",
                      }),
                    ]
                  : parseInline(cell),
                spacing: { before: 40, after: 40 },
              }),
            ],
            shading: isHeader(rowIdx)
              ? { fill: COLORS.tableHeader, type: "clear" }
              : rowIdx % 2 === 0
                ? { fill: "F8F9FA", type: "clear" }
                : undefined,
            margins: {
              top: convertInchesToTwip(0.04),
              bottom: convertInchesToTwip(0.04),
              left: convertInchesToTwip(0.08),
              right: convertInchesToTwip(0.08),
            },
          })
      ),
    });
  });

  return new Table({
    rows: tableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });
}

/**
 * Convert parsed blocks to docx children
 */
function blocksToDocx(blocks) {
  const children = [];

  for (const block of blocks) {
    switch (block.type) {
      case "h1":
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                font: FONT,
                size: 36,
                color: COLORS.heading1,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 360, after: 200 },
          })
        );
        break;

      case "h2":
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                font: FONT,
                size: 28,
                color: COLORS.heading2,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 300, after: 160 },
          })
        );
        break;

      case "h3":
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                font: FONT,
                size: 24,
                color: COLORS.heading3,
              }),
            ],
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 240, after: 120 },
          })
        );
        break;

      case "h4":
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                bold: true,
                italics: true,
                font: FONT,
                size: 22,
                color: COLORS.heading3,
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );
        break;

      case "hr":
        children.push(
          new Paragraph({
            children: [new PageBreak()],
          })
        );
        break;

      case "table": {
        const table = buildTable(block.rows);
        if (table) {
          children.push(table);
          children.push(new Paragraph({ spacing: { after: 120 } }));
        }
        break;
      }

      case "bullet":
        children.push(
          new Paragraph({
            children: parseInline(block.text),
            bullet: { level: block.indent },
            spacing: { before: 40, after: 40 },
          })
        );
        break;

      case "numbered":
        children.push(
          new Paragraph({
            children: parseInline(block.text),
            numbering: { reference: "default-numbering", level: 0 },
            spacing: { before: 40, after: 40 },
          })
        );
        break;

      case "quote":
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: block.text,
                italics: true,
                font: FONT,
                size: 22,
                color: COLORS.muted,
              }),
            ],
            indent: { left: convertInchesToTwip(0.5) },
            spacing: { before: 80, after: 80 },
            border: {
              left: {
                color: COLORS.heading2,
                space: 8,
                style: BorderStyle.SINGLE,
                size: 6,
              },
            },
          })
        );
        break;

      case "paragraph":
        children.push(
          new Paragraph({
            children: parseInline(block.text),
            spacing: { before: 60, after: 60 },
          })
        );
        break;
    }
  }

  return children;
}

// --- Main ---

const blocks = parseMarkdown(lines);

// Extract title from first H1 if present
const titleBlock = blocks.find((b) => b.type === "h1");
const title = titleBlock ? titleBlock.text : "Investment Memo";

const doc = new Document({
  creator: "VC Diligence Engine",
  title: title,
  description: "Institutional-quality investment analysis",
  numbering: {
    config: [
      {
        reference: "default-numbering",
        levels: [
          {
            level: 0,
            format: "decimal",
            text: "%1.",
            alignment: AlignmentType.LEFT,
          },
        ],
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.25),
            right: convertInchesToTwip(1.25),
          },
        },
      },
      children: blocksToDocx(blocks),
    },
  ],
});

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (outputDir && !fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Generated: ${outputPath}`);
});
