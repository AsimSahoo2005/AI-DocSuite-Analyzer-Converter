
import React, { useCallback } from 'react';
import { AnalysisType, Quiz, QuizQuestion } from '../types';
import * as fileService from '../services/fileService';
import { DownloadIcon } from './icons/DownloadIcon';

interface ResultDisplayProps {
  result: string | Quiz;
  analysisType: AnalysisType;
  sourceFileName: string;
}

const QuizView: React.FC<{ quiz: Quiz }> = ({ quiz }) => (
    <div className="space-y-6">
        <h3 className="text-2xl font-bold text-teal-300">{quiz.title}</h3>
        {quiz.questions.map((q: QuizQuestion, index: number) => (
            <div key={index} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="font-semibold text-gray-200">
                    {index + 1}. {q.question}
                </p>
                <ul className="mt-3 space-y-2 list-inside list-alpha pl-2">
                    {q.options.map((option, i) => (
                        <li key={i} className={`text-gray-400 ${option === q.correctAnswer ? 'text-green-400 font-bold' : ''}`}>
                            {option}
                        </li>
                    ))}
                </ul>
                <p className="mt-3 text-sm text-gray-500">
                    Correct Answer: <span className="font-medium text-green-400">{q.correctAnswer}</span>
                </p>
            </div>
        ))}
    </div>
);

// Renders markdown content into styled HTML
const markdownToHtml = (markdown: string): string => {
    const lines = markdown.split('\n');
    let html = '';
    let inList: 'ul' | 'ol' | null = null;

    const closeList = () => {
        if (inList) {
            html += inList === 'ul' ? '</ul>' : '</ol>';
            inList = null;
        }
    };

    const processInline = (text: string) => text
        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-100">$1</strong>')
        .replace(/__(.*?)__/g, '<strong class="font-semibold text-gray-100">$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-sm rounded px-1 py-0.5">$1</code>')
        .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-teal-400 hover:underline">$1</a>');

    lines.forEach(line => {
        if (line.startsWith('# ')) {
            closeList();
            html += `<h1 class="text-2xl font-bold mb-4 text-teal-300">${processInline(line.substring(2))}</h1>`;
            return;
        }
        if (line.startsWith('## ')) {
            closeList();
            html += `<h2 class="text-xl font-bold mt-6 mb-3 text-teal-400 border-b border-gray-700 pb-2">${processInline(line.substring(3))}</h2>`;
            return;
        }
        if (line.startsWith('### ')) {
            closeList();
            html += `<h3 class="text-lg font-bold mt-4 mb-2 text-gray-200">${processInline(line.substring(4))}</h3>`;
            return;
        }
        if (line.match(/^(\s*)[-*] (.*)/)) {
            if (inList !== 'ul') {
                closeList();
                inList = 'ul';
                html += '<ul class="list-disc list-inside pl-4 my-4 space-y-2 text-gray-300">';
            }
            html += `<li>${processInline(line.replace(/^(\s*)[-*] /, ''))}</li>`;
            return;
        }
        if (line.match(/^(\s*)\d+\. (.*)/)) {
            if (inList !== 'ol') {
                closeList();
                inList = 'ol';
                html += '<ol class="list-decimal list-inside pl-4 my-4 space-y-2 text-gray-300">';
            }
            html += `<li>${processInline(line.replace(/^(\s*)\d+\. /, ''))}</li>`;
            return;
        }
        closeList();
        if (line.trim()) {
            html += `<p class="mb-4 leading-relaxed">${processInline(line)}</p>`;
        }
    });

    closeList();
    return html;
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const html = markdownToHtml(content);
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};


const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, analysisType, sourceFileName }) => {
  
  const getTitle = () => {
    switch (analysisType) {
      case AnalysisType.Summarize: return 'Summary';
      case AnalysisType.Strategy: return '4-Week Strategy';
      case AnalysisType.Quiz: return 'Generated Quiz';
      default: return 'Result';
    }
  };

  const formatContentForDownload = useCallback(() => {
    if (typeof result === 'string') {
      return result;
    }
    // Format quiz object into a readable string for TXT download
    let content = `${result.title}\n\n`;
    result.questions.forEach((q, index) => {
      content += `${index + 1}. ${q.question}\n`;
      q.options.forEach(opt => content += `   - ${opt}\n`);
      content += `Correct Answer: ${q.correctAnswer}\n\n`;
    });
    return content;
  }, [result]);

  const handleDownloadTxt = () => {
    const content = formatContentForDownload();
    const fileName = `${sourceFileName.split('.')[0]}_${analysisType.toLowerCase()}.txt`;
    fileService.createDownload(content, fileName, 'text/plain');
  };
  
  const handleDownloadPdf = () => {
    const content = formatContentForDownload();
    const fileName = `${sourceFileName.split('.')[0]}_${analysisType.toLowerCase()}.pdf`;
    fileService.createTextPdf(content, fileName);
  };

  return (
    <div className="mt-6 bg-gray-900/50 border border-gray-700 rounded-lg shadow-inner">
      <div className="p-4 flex justify-between items-center border-b border-gray-700">
        <h2 className="text-xl font-semibold text-gray-200">{getTitle()}</h2>
        <div className="flex space-x-2">
            <button onClick={handleDownloadTxt} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-3 rounded-md transition duration-200 text-xs">
                <DownloadIcon className="h-4 w-4" />
                <span>TXT</span>
            </button>
            <button onClick={handleDownloadPdf} className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 text-gray-300 font-semibold py-2 px-3 rounded-md transition duration-200 text-xs">
                <DownloadIcon className="h-4 w-4" />
                <span>PDF</span>
            </button>
        </div>
      </div>
      <div className="p-6 max-h-96 overflow-y-auto">
        {analysisType === AnalysisType.Quiz && typeof result !== 'string' ? (
          <QuizView quiz={result as Quiz} />
        ) : (
          <MarkdownRenderer content={typeof result === 'string' ? result : ''} />
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;