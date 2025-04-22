import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MathTextProps {
  text: string;
}

export const MathText: React.FC<MathTextProps> = ({ text }) => {
  const processText = (input: string): JSX.Element[] => {
    const parts = input.split(/(\$\$[^$]+\$\$|\$[^$]+\$)/g);
    
    return parts.map((part, index) => {
      // Handle block math (wrapped in $$...$$)
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const math = part.slice(2, -2);
        try {
          return <BlockMath key={index} math={math} />;
        } catch (error) {
          console.error('Error rendering block math:', error);
          return <span key={index} className="text-red-500">{part}</span>;
        }
      }
      
      // Handle inline math (wrapped in $...$)
      if (part.startsWith('$') && part.endsWith('$')) {
        const math = part.slice(1, -1);
        try {
          return <InlineMath key={index} math={math} />;
        } catch (error) {
          console.error('Error rendering inline math:', error);
          return <span key={index} className="text-red-500">{part}</span>;
        }
      }
      
      // Handle regular text (non-math)
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="math-text">
      {processText(text)}
    </div>
  );
};

// Utility function to check if text contains math
export const containsMath = (text: string): boolean => {
  // Check for any $ character in the text
  if (!text.includes('$')) return false;
  
  // Check for block math ($$...$$)
  const blockMathRegex = /\$\$[^$]*\$\$/;
  if (blockMathRegex.test(text)) return true;
  
  // Check for inline math ($...$) or partial math expressions
  const inlineMathRegex = /\$[^$]*\$/;
  if (inlineMathRegex.test(text)) return true;
  
  // Check for incomplete math expressions
  const incompleteMathRegex = /\$[^$]*$|^\$[^$]*$/;
  return incompleteMathRegex.test(text);
};