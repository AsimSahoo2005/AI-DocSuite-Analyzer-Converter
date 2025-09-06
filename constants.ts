import { ConversionMap } from './types';

export const ANALYZER_FILE_TYPES = ['application/pdf'];
export const CONVERTER_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  // 'application/x-ipynb+json' is not a standard MIME type, so we'll check by extension
];

export const CONVERSION_MAP: ConversionMap = {
  'application/pdf': [
    { label: 'to TXT', targetMime: 'text/plain' },
    { label: 'to DOCX', targetMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', disabled: true, disabledReason: 'Client-side PDF to DOCX is not supported.' },
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    { label: 'to TXT', targetMime: 'text/plain' },
    { label: 'to PDF', targetMime: 'application/pdf' },
  ],
  'ipynb': [ // Special key for .ipynb extension
    { label: 'to HTML', targetMime: 'text/html' },
    { label: 'to DOCX', targetMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  ],
};