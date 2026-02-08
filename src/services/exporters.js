import JSZip from 'jszip';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } from 'docx';
import pptxgen from 'pptxgenjs';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// --- Markdown Parser ---

function parseMarkdownSections(markdown) {
  if (!markdown) return [];
  const lines = markdown.split('\n');
  const sections = [];
  let currentSection = null;
  let tableRows = [];
  let inTable = false;
  let inCodeBlock = false;
  let codeContent = '';
  let codeLang = '';

  function flushTable() {
    if (tableRows.length > 0) {
      sections.push({ type: 'table', rows: tableRows });
      tableRows = [];
    }
    inTable = false;
  }

  function flushCode() {
    if (codeContent) {
      sections.push({ type: 'code', language: codeLang, content: codeContent.trimEnd() });
      codeContent = '';
      codeLang = '';
    }
    inCodeBlock = false;
  }

  for (const line of lines) {
    // Code blocks
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCode();
      } else {
        if (inTable) flushTable();
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent += line + '\n';
      continue;
    }

    // Table rows
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      // Skip separator rows like |---|---|
      if (cells.every(c => /^[-:]+$/.test(c))) continue;
      if (!inTable) inTable = true;
      tableRows.push(cells);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Headings
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      sections.push({ type: 'heading', level: headingMatch[1].length, text: headingMatch[2].trim() });
      continue;
    }

    // Bullet list items
    if (/^\s*[-*+]\s+/.test(line)) {
      sections.push({ type: 'list-item', text: line.replace(/^\s*[-*+]\s+/, '').trim() });
      continue;
    }

    // Numbered list items
    if (/^\s*\d+\.\s+/.test(line)) {
      sections.push({ type: 'list-item', text: line.replace(/^\s*\d+\.\s+/, '').trim(), ordered: true });
      continue;
    }

    // Paragraph text (non-empty)
    if (line.trim()) {
      sections.push({ type: 'paragraph', text: line.trim() });
    }
  }

  if (inTable) flushTable();
  if (inCodeBlock) flushCode();

  return sections;
}

// Strip markdown formatting for plain text contexts
function stripMarkdown(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');
}

// --- DOCX Export ---

export async function exportAsDocx(title, markdownContent) {
  const sections = parseMarkdownSections(markdownContent);
  const children = [];

  children.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 36, color: '4D9BFF' })],
    heading: HeadingLevel.TITLE,
    spacing: { after: 400 },
  }));

  for (const section of sections) {
    switch (section.type) {
      case 'heading': {
        const level = section.level <= 1 ? HeadingLevel.HEADING_1
          : section.level === 2 ? HeadingLevel.HEADING_2
          : HeadingLevel.HEADING_3;
        children.push(new Paragraph({
          children: [new TextRun({ text: stripMarkdown(section.text), bold: true })],
          heading: level,
          spacing: { before: 240, after: 120 },
        }));
        break;
      }
      case 'paragraph':
        children.push(new Paragraph({
          children: [new TextRun({ text: stripMarkdown(section.text) })],
          spacing: { after: 120 },
        }));
        break;
      case 'list-item':
        children.push(new Paragraph({
          children: [new TextRun({ text: stripMarkdown(section.text) })],
          bullet: { level: 0 },
          spacing: { after: 60 },
        }));
        break;
      case 'table': {
        if (section.rows.length === 0) break;
        const tableRows = section.rows.map((row, ri) =>
          new TableRow({
            children: row.map(cell =>
              new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: stripMarkdown(cell), bold: ri === 0 })],
                })],
                width: { size: Math.floor(100 / row.length), type: WidthType.PERCENTAGE },
              })
            ),
          })
        );
        children.push(new Table({
          rows: tableRows,
          width: { size: 100, type: WidthType.PERCENTAGE },
        }));
        children.push(new Paragraph({ spacing: { after: 120 } }));
        break;
      }
      case 'code':
        children.push(new Paragraph({
          children: [new TextRun({ text: section.content, font: 'Courier New', size: 20 })],
          spacing: { before: 120, after: 120 },
        }));
        break;
    }
  }

  const doc = new Document({
    sections: [{
      properties: {},
      children,
    }],
  });

  const blob = await Packer.toBlob(doc);
  downloadBlob(blob, `${slugify(title)}.docx`);
}

// --- PPTX Export ---

export async function exportAsPptx(title, markdownContent) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.defineLayout({ name: 'EGEN', w: 13.33, h: 7.5 });
  pptx.layout = 'EGEN';

  // Title slide
  const titleSlide = pptx.addSlide();
  titleSlide.background = { color: '001433' };
  titleSlide.addText(title, { x: 0.8, y: 2.5, w: 11.7, h: 1.5, fontSize: 36, color: '4D9BFF', bold: true, fontFace: 'Arial' });
  titleSlide.addText('Egen Agent Simulator', { x: 0.8, y: 4.2, w: 11.7, h: 0.5, fontSize: 16, color: 'BFD8FF', fontFace: 'Arial' });

  const sections = parseMarkdownSections(markdownContent);
  let currentSlide = null;
  let currentY = 1.8;
  let slideItems = [];

  function flushSlide() {
    if (currentSlide && slideItems.length > 0) {
      const body = slideItems.map(s => stripMarkdown(s)).join('\n');
      currentSlide.addText(body, {
        x: 0.8, y: currentY, w: 11.7, h: 5.5 - currentY + 0.5,
        fontSize: 14, color: 'FFFFFF', fontFace: 'Arial', valign: 'top',
        lineSpacing: 22,
      });
    }
    slideItems = [];
    currentY = 1.8;
  }

  for (const section of sections) {
    if (section.type === 'heading' && section.level <= 2) {
      flushSlide();
      currentSlide = pptx.addSlide();
      currentSlide.background = { color: '001433' };
      currentSlide.addText(stripMarkdown(section.text), {
        x: 0.8, y: 0.4, w: 11.7, h: 1.0,
        fontSize: 24, color: '4D9BFF', bold: true, fontFace: 'Arial',
      });
      currentY = 1.8;
    } else if (currentSlide) {
      const text = section.type === 'list-item' ? `  - ${section.text}`
        : section.type === 'table' ? section.rows.map(r => r.join(' | ')).join('\n')
        : section.text || '';
      if (text) slideItems.push(text);
    }
  }
  flushSlide();

  const blob = await pptx.write({ outputType: 'blob' });
  downloadBlob(blob, `${slugify(title)}.pptx`);
}

// --- XLSX Export ---

export async function exportAsXlsx(title, markdownContent) {
  const sections = parseMarkdownSections(markdownContent);
  const wb = XLSX.utils.book_new();

  // Extract tables into separate sheets
  let tableIndex = 0;
  let contentRows = [];
  let lastHeading = title;

  for (const section of sections) {
    if (section.type === 'heading') {
      lastHeading = stripMarkdown(section.text);
      contentRows.push([lastHeading]);
    } else if (section.type === 'table' && section.rows.length > 0) {
      tableIndex++;
      const sheetName = (lastHeading || `Table ${tableIndex}`).slice(0, 31);
      const ws = XLSX.utils.aoa_to_sheet(section.rows);
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
    } else if (section.type === 'list-item') {
      contentRows.push([`  - ${stripMarkdown(section.text)}`]);
    } else if (section.type === 'paragraph') {
      contentRows.push([stripMarkdown(section.text)]);
    }
  }

  if (contentRows.length > 0) {
    const ws = XLSX.utils.aoa_to_sheet(contentRows);
    XLSX.utils.book_append_sheet(wb, ws, 'Content');
  }

  if (wb.SheetNames.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([[title], [markdownContent]]);
    XLSX.utils.book_append_sheet(wb, ws, 'Content');
  }

  const blob = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  downloadBlob(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${slugify(title)}.xlsx`);
}

// --- PDF Export ---

export async function exportAsPdf(title, markdownContent) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const sections = parseMarkdownSections(markdownContent);
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  const maxWidth = pageWidth - margin * 2;
  let y = 20;

  function checkPage(needed = 20) {
    if (y + needed > doc.internal.pageSize.getHeight() - 20) {
      doc.addPage();
      y = 20;
    }
  }

  // Title
  doc.setFontSize(22);
  doc.setTextColor(77, 155, 255);
  doc.text(title, margin, y);
  y += 14;
  doc.setDrawColor(0, 77, 179);
  doc.line(margin, y, pageWidth - margin, y);
  y += 10;

  for (const section of sections) {
    switch (section.type) {
      case 'heading': {
        checkPage(16);
        const size = section.level <= 1 ? 18 : section.level === 2 ? 15 : 12;
        doc.setFontSize(size);
        doc.setTextColor(77, 155, 255);
        doc.setFont('helvetica', 'bold');
        const lines = doc.splitTextToSize(stripMarkdown(section.text), maxWidth);
        doc.text(lines, margin, y);
        y += lines.length * (size * 0.5) + 4;
        break;
      }
      case 'paragraph': {
        checkPage(12);
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(stripMarkdown(section.text), maxWidth);
        doc.text(lines, margin, y);
        y += lines.length * 5 + 3;
        break;
      }
      case 'list-item': {
        checkPage(10);
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont('helvetica', 'normal');
        const lines = doc.splitTextToSize(stripMarkdown(section.text), maxWidth - 8);
        doc.text('\u2022', margin, y);
        doc.text(lines, margin + 8, y);
        y += lines.length * 5 + 2;
        break;
      }
      case 'table': {
        if (section.rows.length === 0) break;
        checkPage(30);
        const head = [section.rows[0]];
        const body = section.rows.slice(1).map(r => r.map(c => stripMarkdown(c)));
        doc.autoTable({
          startY: y,
          head,
          body,
          margin: { left: margin, right: margin },
          styles: { fontSize: 9, cellPadding: 3 },
          headStyles: { fillColor: [0, 34, 89], textColor: [255, 255, 255] },
          alternateRowStyles: { fillColor: [245, 247, 250] },
        });
        y = doc.lastAutoTable.finalY + 8;
        break;
      }
      case 'code': {
        checkPage(20);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont('courier', 'normal');
        const lines = doc.splitTextToSize(section.content, maxWidth - 10);
        doc.setFillColor(245, 247, 250);
        doc.rect(margin, y - 3, maxWidth, lines.length * 4 + 6, 'F');
        doc.text(lines, margin + 5, y + 1);
        y += lines.length * 4 + 10;
        doc.setFont('helvetica', 'normal');
        break;
      }
    }
  }

  doc.save(`${slugify(title)}.pdf`);
}

// --- Markdown Export ---

export function exportAsMarkdown(title, markdownContent) {
  const blob = new Blob([markdownContent], { type: 'text/markdown' });
  downloadBlob(blob, `${slugify(title)}.md`);
}

// --- Download All as ZIP ---

export async function downloadAll(deliverables, deliverablesDef, insights, format = 'md') {
  const zip = new JSZip();

  for (const def of deliverablesDef) {
    const state = deliverables[def.id];
    if (!state || state.status !== 'completed' || !state.content) continue;

    const filename = slugify(def.title);
    if (format === 'md') {
      zip.file(`${filename}.md`, state.content);
    } else if (format === 'docx') {
      const doc = await buildDocxBlob(def.title, state.content);
      zip.file(`${filename}.docx`, doc);
    } else {
      // Default to markdown for zip
      zip.file(`${filename}.md`, state.content);
    }
  }

  if (insights) {
    const insightsMd = formatInsightsAsMarkdown(insights);
    zip.file('project-insights.md', insightsMd);
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, 'simulation-deliverables.zip');
}

// Build docx blob without triggering download
async function buildDocxBlob(title, markdownContent) {
  const sections = parseMarkdownSections(markdownContent);
  const children = [];

  children.push(new Paragraph({
    children: [new TextRun({ text: title, bold: true, size: 36 })],
    heading: HeadingLevel.TITLE,
  }));

  for (const section of sections) {
    if (section.type === 'heading') {
      children.push(new Paragraph({
        children: [new TextRun({ text: stripMarkdown(section.text), bold: true })],
        heading: section.level <= 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
      }));
    } else if (section.type === 'paragraph') {
      children.push(new Paragraph({
        children: [new TextRun({ text: stripMarkdown(section.text) })],
      }));
    } else if (section.type === 'list-item') {
      children.push(new Paragraph({
        children: [new TextRun({ text: stripMarkdown(section.text) })],
        bullet: { level: 0 },
      }));
    }
  }

  const doc = new Document({ sections: [{ children }] });
  return await Packer.toBlob(doc);
}

function formatInsightsAsMarkdown(insights) {
  let md = `# Project Insights\n\n`;
  md += `## Executive Summary\n${insights.executiveSummary}\n\n`;

  md += `## Project Risks\n`;
  for (const r of insights.projectRisks || []) {
    md += `- **[${r.severity.toUpperCase()}]** ${r.risk}\n  - Source: ${r.source}\n  - Mitigation: ${r.mitigation}\n`;
  }
  md += '\n';

  md += `## Strengths\n`;
  for (const s of insights.strengths || []) {
    md += `- ${s}\n`;
  }
  md += '\n';

  md += `## Watchpoints\n`;
  for (const w of insights.watchpoints || []) {
    md += `- **${w.item}**: ${w.reason}\n`;
  }
  md += '\n';

  md += `## Staffing Gaps\n`;
  for (const g of insights.staffingGaps || []) {
    md += `- **${g.gap}**\n  - Current Coverage: ${g.currentCoverage}\n  - Impact: ${g.impact}\n  - Recommendation: ${g.recommendation}\n`;
  }
  md += '\n';

  if (insights.scopeAssessment) {
    md += `## Scope Assessment\n`;
    md += `**Verdict: ${insights.scopeAssessment.verdict}**\n\n`;
    md += `${insights.scopeAssessment.analysis}\n\n`;
    md += `Recommendations: ${insights.scopeAssessment.recommendations}\n\n`;
  }

  md += `## Key Recommendations\n`;
  for (const r of insights.keyRecommendations || []) {
    md += `- **[${r.priority}]** ${r.recommendation}\n  - ${r.rationale}\n`;
  }
  md += '\n';

  md += `## Client Dependencies\n`;
  for (const d of insights.clientDependencies || []) {
    md += `- **${d.dependency}**\n  - Assumption: ${d.assumption}\n  - Impact: ${d.impact}\n  - Recommendation: ${d.recommendation}\n`;
  }

  return md;
}

// --- Helpers ---

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
