
import React, { useState, useCallback } from 'react';
import { AnalysisType, Quiz } from '../types';
import FileUpload from './FileUpload';
import { extractTextFromPdf } from '../services/fileService';
import { analyzeDocument } from '../services/geminiService';
import Loader from './Loader';
import ResultDisplay from './ResultDisplay';
import { ANALYZER_FILE_TYPES } from '../constants';

const AiAnalyzer: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | Quiz | null>(null);
  const [analysisType, setAnalysisType] = useState<AnalysisType | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setResult(null);
    setError(null);
    setAnalysisType(null);
  };

  const handleAnalysis = useCallback(async (type: AnalysisType) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setAnalysisType(type);

    try {
      const textContent = await extractTextFromPdf(file);
      if (textContent.trim().length === 0) {
        throw new Error("Could not extract text from the PDF. The document might be image-based or empty.");
      }
      const analysisResult = await analyzeDocument(textContent, type);
      setResult(analysisResult);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during analysis.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [file]);

  return (
    <div className="space-y-6">
      <FileUpload
        onFileSelect={handleFileSelect}
        acceptedFileTypes={ANALYZER_FILE_TYPES}
        label="Upload a PDF document to analyze"
      />

      {file && !loading && (
        <div className="bg-gray-700/50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-300">Analysis options for: <span className="text-teal-400">{file.name}</span></p>
            <div className="flex space-x-2">
                <button onClick={() => handleAnalysis(AnalysisType.Summarize)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition duration-200 text-sm">Summarize</button>
                <button onClick={() => handleAnalysis(AnalysisType.Strategy)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition duration-200 text-sm">4-Week Strategy</button>
                <button onClick={() => handleAnalysis(AnalysisType.Quiz)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition duration-200 text-sm">Generate Quiz</button>
            </div>
        </div>
      )}

      {loading && <Loader message={`Analyzing document... This may take a moment.`} />}
      
      {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center">{error}</div>}

      {result && analysisType && <ResultDisplay result={result} analysisType={analysisType} sourceFileName={file?.name || 'document'} />}
    </div>
  );
};

export default AiAnalyzer;
