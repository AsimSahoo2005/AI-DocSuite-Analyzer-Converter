// Custom Type Definitions for 'mammoth'
// This file is necessary because 'mammoth' does not ship its own types
// and no community-provided types exist on the @types npm scope.

declare module 'mammoth' {
  /**
   * Represents the options for extracting raw text.
   */
  interface ExtractRawTextOptions {
    /**
     * The DOCX file content as an ArrayBuffer.
     */
    arrayBuffer: ArrayBuffer;
  }

  /**
   * The result object returned by extractRawText.
   */
  interface ExtractRawTextResult {
    /**
     * The extracted text content from the document.
     */
    value: string;
    /**
     * Any messages generated during the extraction process.
     */
    messages: any[];
  }

  /**
   * Extracts raw text content from a DOCX file provided as an ArrayBuffer.
   * @param options An object containing the arrayBuffer of the DOCX file.
   * @returns A promise that resolves to an object containing the extracted text.
   */
  export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>;
}
