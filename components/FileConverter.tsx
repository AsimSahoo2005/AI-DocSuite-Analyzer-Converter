import React, { useState, useCallback } from 'react';
import FileUpload from './FileUpload';
import { CONVERTER_FILE_TYPES, CONVERSION_MAP } from '../constants';
import * as fileService from '../services/fileService';
import Loader from './Loader';

const FileConverter: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversionMessage, setConversionMessage] = useState<string | null>(null);

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setConversionMessage(null);
  };
  
  const getFileExtension = (fileName: string) => {
    return fileName.slice(((fileName.lastIndexOf(".") - 1) >>> 0) + 2);
  }

  const getExtensionFromMime = (mime: string): string => {
    if (mime === 'text/plain') return 'txt';
    if (mime === 'application/pdf') return 'pdf';
    if (mime === 'text/html') return 'html';
    if (mime.includes('wordprocessingml')) return 'docx';
    return 'txt'; // fallback
  };

  const handleConversion = useCallback(async (targetMime: string) => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setConversionMessage(`Converting ${file.name}...`);
    
    const originalExtension = getFileExtension(file.name);
    const newExtension = getExtensionFromMime(targetMime);
    const newFileName = `${file.name.substring(0, file.name.lastIndexOf('.'))}.${newExtension}`;


    try {
      if (file.type === 'application/pdf' && targetMime === 'text/plain') {
        const text = await fileService.extractTextFromPdf(file);
        fileService.createDownload(text, newFileName, 'text/plain');
      } else if (file.type.includes('wordprocessingml') && targetMime === 'text/plain') {
        const text = await fileService.extractTextFromDocx(file);
        fileService.createDownload(text, newFileName, 'text/plain');
      } else if (file.type.includes('wordprocessingml') && targetMime === 'application/pdf') {
        await fileService.convertDocxToPdf(file, newFileName);
      } else if (originalExtension === 'ipynb' && targetMime === 'text/html') {
          const html = await fileService.convertIpynbToHtml(file);
          fileService.createDownload(html, newFileName, 'text/html');
      } else if (originalExtension === 'ipynb' && targetMime.includes('wordprocessingml')) {
          await fileService.convertIpynbToDocx(file, newFileName);
      } else {
        throw new Error('This conversion type is not supported yet.');
      }
      setConversionMessage(`${file.name} was successfully converted and download has started.`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred during conversion.';
      setError(errorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }

  }, [file]);
  
  const getConversionOptions = () => {
    if (!file) return [];
    if(getFileExtension(file.name) === 'ipynb') return CONVERSION_MAP['ipynb'];
    return CONVERSION_MAP[file.type] || [];
  }

  return (
    <div className="space-y-6">
      <FileUpload
        onFileSelect={handleFileSelect}
        acceptedFileTypes={CONVERTER_FILE_TYPES}
        label="Upload PDF, DOCX, or IPYNB to convert"
      />

      {file && !loading && (
        <div className="bg-gray-700/50 p-4 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm font-medium text-gray-300">Convert: <span className="text-teal-400">{file.name}</span></p>
            <div className="flex space-x-2">
                {getConversionOptions().map(opt => (
                     <button 
                        key={opt.label} 
                        onClick={() => handleConversion(opt.targetMime)}
                        disabled={opt.disabled}
                        title={opt.disabledReason}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2 px-4 rounded-md transition duration-200 text-sm disabled:bg-gray-500 disabled:cursor-not-allowed disabled:opacity-60"
                     >
                         {opt.label}
                     </button>
                ))}
                {getConversionOptions().length === 0 && <p className="text-sm text-yellow-400">No conversion options available for this file type.</p>}
            </div>
        </div>
      )}
      
      {loading && <Loader message={conversionMessage || 'Processing file...'} />}

      {!loading && conversionMessage && !error && <div className="bg-green-500/20 border border-green-500 text-green-300 p-4 rounded-lg text-center">{conversionMessage}</div>}

      {error && <div className="bg-red-500/20 border border-red-500 text-red-300 p-4 rounded-lg text-center">{error}</div>}
    </div>
  );
};

export default FileConverter;