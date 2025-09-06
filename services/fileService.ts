// Corrected imports for Node.js build environment
import * as pdfjs from 'pdfjs-dist';
import type { TextItem } from 'pdfjs-dist/types/src/display/api';
import mammoth from 'mammoth';
import { jsPDF } from 'jspdf';
import { marked } from 'marked';
import hljs from 'highlight.js';
import * as docx from 'docx';

// Set to true to enable verbose logging for all export functions.
const DEBUG = false;

// Setup for pdfjs worker
// @ts-ignore
pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.mjs`;

/**
 * Extracts text content from a PDF file.
 */
export const extractTextFromPdf = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument(arrayBuffer).promise;
  const numPages = pdf.numPages;
  let fullText = '';
  for (let i = 1; i <= numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items
      .filter((item): item is TextItem => 'str' in item)
      .map((item: TextItem) => item.str)
      .join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
};

/**
 * Extracts text content from a DOCX file.
 */
export const extractTextFromDocx = async (file: File): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value;
};

/**
 * Creates a downloadable file from a string content.
 */
export const createDownload = (content: string, fileName:string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Creates a PDF from text content, with robust sanitization to prevent errors.
 */
export const createTextPdf = async (content: string, fileName: string): Promise<void> => {
  const doc = new jsPDF();
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;

  let sanitizedContent = String(content || '')
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/\u2013/g, '-')       // En dash
    .replace(/\u2014/g, '--')      // Em dash
    .replace(/\u2026/g, '...')     // Ellipsis
    .replace(/\u00A0/g, ' ')      // Non-breaking space
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, '') // Remove non-printable ASCII chars
    .replace(/\r\n?/g, '\n'); // Normalize newlines

  const textLines = doc.splitTextToSize(sanitizedContent, usableWidth);
  let cursorY = margin;
  const lineHeight = doc.getLineHeight();

  for (const line of textLines) {
    if (cursorY + lineHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
    if (line) {
       doc.text(line, margin, cursorY);
    }
    cursorY += lineHeight;
  }
  doc.save(fileName);
};

/**
 * Converts a DOCX file to a text-based PDF.
 */
export const convertDocxToPdf = async (file: File, newFileName: string): Promise<void> => {
  const text = await extractTextFromDocx(file);
  await createTextPdf(text, newFileName);
};

// Types for IPYNB parsing
interface IpynbCell {
  cell_type: 'markdown' | 'code';
  source: string[] | string;
  outputs?: any[];
}

interface IpynbFile {
  cells: IpynbCell[];
}

/**
 * Converts an IPYNB (Jupyter Notebook) file to a styled HTML string.
 */
export const convertIpynbToHtml = async (file: File): Promise<string> => {
  const content = await file.text();
  const notebook: IpynbFile = JSON.parse(content);
  
  const markedOptions = {
    highlight: function(code: string, lang: string) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext';
      return hljs.highlight(code, { language }).value;
    },
    gfm: true,
  };

  const bodyContent = notebook.cells.map(cell => {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;
    if (cell.cell_type === 'markdown') {
      return `<div class="cell markdown-cell">${marked(source, markedOptions)}</div>`;
    }
    if (cell.cell_type === 'code') {
      let cellHtml = `<div class="cell code-cell"><pre><code>${hljs.highlight(source, { language: 'python' }).value}</code></pre>`;
      if (cell.outputs && cell.outputs.length > 0) {
        cellHtml += '<div class="output">';
        cell.outputs.forEach(output => {
          let outputText = '';
          if (output.output_type === 'stream' || output.output_type === 'execute_result') {
            outputText = output.text ? (Array.isArray(output.text) ? output.text.join('') : String(output.text)) : '';
          } else if (output.data && output.data['text/plain']) {
            outputText = Array.isArray(output.data['text/plain']) ? output.data['text/plain'].join('') : String(output.data['text/plain']);
          }
          if (outputText) {
            cellHtml += `<pre class="output_text">${outputText.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`;
          }
        });
        cellHtml += '</div>';
      }
      cellHtml += `</div>`;
      return cellHtml;
    }
    return '';
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <title>${file.name}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 2em; background: #fff; color: #333; }
          .cell { margin-bottom: 1.5em; padding: 1em; border: 1px solid #e1e1e1; border-radius: 8px; }
          .markdown-cell { background-color: #fff; border-color: transparent; padding: 1em 0; }
          .code-cell { background-color: #f7f7f7; }
          pre { background-color: #f0f0f0; padding: 1em; border-radius: 4px; overflow-x: auto; }
          code { font-family: "SF Mono", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", monospace; }
          .output { margin-top: 1em; padding: 1em; background-color: #fff; border-top: 1px dashed #ccc; }
          .output_text { white-space: pre-wrap; font-size: 0.9em; color: #555; }
          h1, h2, h3 { border-bottom: 1px solid #eaecef; padding-bottom: .3em; }
          blockquote { color: #666; margin: 0; padding-left: 1em; border-left: 0.25em solid #dfe2e5; }
        </style>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css">
      </head>
      <body>
        ${bodyContent}
      </body>
    </html>
  `;
};

/**
 * Converts an IPYNB file to a high-fidelity PDF by rendering its HTML representation.
 * This version is hardened to prevent blank PDFs by ensuring content is fully rendered before capture.
 */
export const convertIpynbToPdf = async (file: File, newFileName: string): Promise<void> => {
    if (DEBUG) console.log(`[PDF Export] Starting conversion for ${file.name}`);
    const htmlString = await convertIpynbToHtml(file);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.top = '0';
    iframe.style.border = 'none';
    iframe.style.width = '880px';
    iframe.style.height = '1px';
    document.body.appendChild(iframe);

    try {
        const doc = iframe.contentWindow?.document;
        if (!doc) {
            throw new Error("Could not access iframe document for PDF conversion.");
        }
        doc.open();
        doc.write(htmlString);
        doc.close();
        if (DEBUG) console.log('[PDF Export] iframe created and content written.');

        await new Promise<void>((resolve, reject) => {
            let checks = 0;
            const interval = setInterval(() => {
                if (doc.readyState === 'complete' && doc.body.scrollHeight > 1) {
                    clearInterval(interval);
                    setTimeout(resolve, 500); // Allow final render paint
                }
                if (++checks > 100) { // 10-second timeout
                    clearInterval(interval);
                    reject(new Error("Timeout waiting for iframe content to render."));
                }
            }, 100);
        });

        if (DEBUG) console.log('[PDF Export] iframe content loaded and rendered.');

        const contentToRender = doc.body;
        if (!contentToRender || !contentToRender.hasChildNodes() || contentToRender.innerText.trim() === '') {
            throw new Error("Rendered IPYNB content is empty. Cannot generate PDF.");
        }
        
        if (DEBUG) console.log(`[PDF Export] Content captured. Body scrollHeight: ${contentToRender.scrollHeight}px`);

        const pdf = new jsPDF({ orientation: 'p', unit: 'pt', format: 'a4', putOnlyUsedFonts: true });

        await pdf.html(contentToRender, {
            margin: [40, 40, 40, 40],
            autoPaging: 'slice',
            html2canvas: { scale: 0.7, useCORS: true, logging: DEBUG },
        });

        if (DEBUG) console.log('[PDF Export] pdf.html() promise resolved.');
        pdf.save(newFileName);
        if (DEBUG) console.log(`[PDF Export] Success. ${newFileName} download triggered.`);

    } catch (error) {
        console.error("Error during IPYNB to PDF conversion:", error);
        throw new Error(`Failed to convert notebook to PDF. ${error instanceof Error ? error.message : 'An unknown error occurred.'}`);
    } finally {
        if (DEBUG) console.log('[PDF Export] Cleaning up iframe.');
        document.body.removeChild(iframe);
    }
};

/**
 * Creates runs of text for docx paragraph with simple markdown for bold and italics.
 */
const createRunsFromMarkdown = (text: string): docx.TextRun[] => {
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g).filter(p => p);
    if (parts.length === 0 && text) {
        return [new docx.TextRun(text)];
    }
    const runs: docx.TextRun[] = [];
    for (const part of parts) {
        if (part.startsWith('**') && part.endsWith('**')) {
            runs.push(new docx.TextRun({ text: part.slice(2, -2), bold: true }));
        } else if (part.startsWith('*') && part.endsWith('*')) {
            runs.push(new docx.TextRun({ text: part.slice(1, -1), italics: true }));
        } else {
            runs.push(new docx.TextRun(part));
        }
    }
    return runs;
};

/**
 * Converts an IPYNB file to a styled DOCX document.
 */
export const convertIpynbToDocx = async (file: File, newFileName: string): Promise<void> => {
  if (DEBUG) console.log(`[DOCX Export] Starting conversion for ${file.name}`);
  const content = await file.text();
  const notebook: IpynbFile = JSON.parse(content);

  const docChildren: docx.Paragraph[] = [];

  for (const cell of notebook.cells) {
    const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source;

    if (cell.cell_type === 'markdown') {
        if (DEBUG) console.log('[DOCX Export] Processing markdown cell');
        source.split('\n').forEach(line => {
            const trimmedLine = line.replace(/\s+$/, '');
            if (trimmedLine.startsWith('# ')) {
                docChildren.push(new docx.Paragraph({ children: createRunsFromMarkdown(trimmedLine.substring(2)), heading: docx.HeadingLevel.HEADING_1 }));
            } else if (trimmedLine.startsWith('## ')) {
                docChildren.push(new docx.Paragraph({ children: createRunsFromMarkdown(trimmedLine.substring(3)), heading: docx.HeadingLevel.HEADING_2 }));
            } else if (trimmedLine.startsWith('### ')) {
                docChildren.push(new docx.Paragraph({ children: createRunsFromMarkdown(trimmedLine.substring(4)), heading: docx.HeadingLevel.HEADING_3 }));
            } else if (trimmedLine.match(/^\s*[-*] /)) {
                docChildren.push(new docx.Paragraph({ children: createRunsFromMarkdown(trimmedLine.replace(/^\s*[-*] /, '')), bullet: { level: 0 } }));
            } else if (trimmedLine.match(/^\s*\d+\. /)) {
                docChildren.push(new docx.Paragraph({ children: createRunsFromMarkdown(trimmedLine.replace(/^\s*\d+\. /, '')), numbering: { reference: "default-numbering", level: 0 } }));
            } else if (trimmedLine) {
                docChildren.push(new docx.Paragraph({ children: createRunsFromMarkdown(trimmedLine) }));
            }
        });
    }

    if (cell.cell_type === 'code') {
        if (DEBUG) console.log('[DOCX Export] Processing code cell');
        source.split('\n').forEach(line => {
             docChildren.push(new docx.Paragraph({
                children: [new docx.TextRun({ text: line, font: { name: 'Courier New' }, size: 20 })],
                shading: { type: docx.ShadingType.CLEAR, fill: "F0F0F0" },
             }));
        });
        
        if (cell.outputs && cell.outputs.length > 0) {
            if (DEBUG) console.log('[DOCX Export] Processing code output');
            cell.outputs.forEach(output => {
                let outputText = '';
                if (output.output_type === 'stream' || output.output_type === 'execute_result') {
                    outputText = output.text ? (Array.isArray(output.text) ? output.text.join('') : String(output.text)) : '';
                } else if (output.data && output.data['text/plain']) {
                    outputText = Array.isArray(output.data['text/plain']) ? output.data['text/plain'].join('') : String(output.data['text/plain']);
                }
                if (outputText) {
                     outputText.split('\n').forEach(line => {
                         docChildren.push(new docx.Paragraph({ children: [new docx.TextRun({ text: line, font: { name: 'Courier New' }, size: 18 })] }));
                     });
                }
            });
        }
    }
    docChildren.push(new docx.Paragraph("")); // Spacer between cells
  }

  const doc = new docx.Document({
    numbering: { config: [{ reference: "default-numbering", levels: [{ level: 0, format: docx.LevelFormat.DECIMAL, text: "%1.", alignment: docx.AlignmentType.START }] }] },
    sections: [{ children: docChildren }],
  });

  const blob = await docx.Packer.toBlob(doc);
  if (DEBUG) console.log(`[DOCX Export] Blob created, size: ${blob.size}`);

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = newFileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  if (DEBUG) console.log(`[DOCX Export] Success. ${newFileName} download triggered.`);
};