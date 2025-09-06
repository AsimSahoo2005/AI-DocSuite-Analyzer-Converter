
import React from 'react';
import { AppFeature } from '../types';

interface HeaderProps {
  activeFeature: AppFeature;
  setActiveFeature: (feature: AppFeature) => void;
}

const Header: React.FC<HeaderProps> = ({ activeFeature, setActiveFeature }) => {
  const navItems = [
    { id: AppFeature.AiAnalyzer, label: 'AI Document Analyzer' },
    { id: AppFeature.FileConverter, label: 'File Converter' },
  ];

  return (
    <div className="border-b border-gray-700 bg-gray-900/30">
      <nav className="flex space-x-1 p-2" aria-label="Tabs">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveFeature(item.id)}
            className={`
              ${activeFeature === item.id 
                ? 'bg-teal-500 text-white shadow-md' 
                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'}
              px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900 flex-1 text-center
            `}
            aria-current={activeFeature === item.id ? 'page' : undefined}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Header;
