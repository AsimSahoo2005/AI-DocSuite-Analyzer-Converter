
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './icons/UploadIcon';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFileTypes: string[];
  label: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, acceptedFileTypes, label }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback((file: File | undefined | null) => {
    if (file) {
      const fileExtension = '.' + file.name.split('.').pop();
      const isIpynb = fileExtension === '.ipynb';
      if (acceptedFileTypes.includes(file.type) || isIpynb) {
        onFileSelect(file);
        setFileName(file.name);
        setError(null);
      } else {
        setError(`Invalid file type. Please upload one of: ${acceptedFileTypes.join(', ')}, .ipynb`);
        setFileName(null);
      }
    }
  }, [onFileSelect, acceptedFileTypes]);

  const onDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };
  
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  return (
    <div>
      <label htmlFor="file-upload" className="sr-only">{label}</label>
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        className={`flex justify-center items-center w-full px-6 py-10 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
          ${isDragging ? 'border-teal-400 bg-teal-500/10' : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'}`}
      >
        <div className="text-center">
          <UploadIcon className="mx-auto h-12 w-12 text-gray-400" />
          <div className="mt-4 flex text-sm leading-6 text-gray-400">
            <label
              htmlFor="file-upload"
              className="relative cursor-pointer rounded-md font-semibold text-teal-400 focus-within:outline-none focus-within:ring-2 focus-within:ring-teal-500 focus-within:ring-offset-2 focus-within:ring-offset-gray-900 hover:text-teal-300"
            >
              <span>Upload a file</span>
              <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={onFileChange} accept={[...acceptedFileTypes, ".ipynb"].join(",")} />
            </label>
            <p className="pl-1">or drag and drop</p>
          </div>
          <p className="text-xs leading-5 text-gray-500">{label}</p>
          {fileName && <p className="mt-2 text-sm text-green-400">Selected: {fileName}</p>}
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
};

export default FileUpload;
