
import React, { useState, useCallback } from 'react';
import { AppFeature } from './types';
import AiAnalyzer from './components/AiAnalyzer';
import FileConverter from './components/FileConverter';
import Header from './components/Header';
import { DocumentIcon } from './components/icons/DocumentIcon';

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<AppFeature>(AppFeature.AiAnalyzer);

  const renderFeature = useCallback(() => {
    switch (activeFeature) {
      case AppFeature.AiAnalyzer:
        return <AiAnalyzer />;
      case AppFeature.FileConverter:
        return <FileConverter />;
      default:
        return <AiAnalyzer />;
    }
  }, [activeFeature]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans antialiased">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10 h-full w-full bg-gray-900 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
        <div className="absolute top-0 left-0 -z-10 h-64 w-64 bg-teal-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 -z-10 h-64 w-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
        
        <main className="container mx-auto px-4 py-8 md:py-16">
          <div className="text-center mb-12">
            <div className="inline-block bg-teal-400/10 p-4 rounded-full mb-4">
              <DocumentIcon className="h-10 w-10 text-teal-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-gradient-to-r from-teal-300 to-indigo-400 text-transparent bg-clip-text">
              AI DocSuite
            </h1>
            <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
              Analyze documents with AI and convert files seamlessly. Your all-in-one productivity hub.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl shadow-2xl shadow-black/20 overflow-hidden">
            <Header activeFeature={activeFeature} setActiveFeature={setActiveFeature} />
            <div className="p-6 md:p-8">
              {renderFeature()}
            </div>
          </div>
          
          <footer className="text-center mt-12 text-gray-500 text-sm">
            <p>&copy; {new Date().getFullYear()} AI DocSuite. Powered by Gemini & React.</p>
          </footer>
        </main>
      </div>
    </div>
  );
};

export default App;
