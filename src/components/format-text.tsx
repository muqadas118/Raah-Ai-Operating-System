import React from 'react';

export function FormatText({ text }: { text?: string }) {
  if (!text) return null;
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
        }
        const subParts = part.split(/(\*.*?\*)/g);
        if (subParts.length > 1) {
          return subParts.map((sp, j) => {
            if (sp.startsWith('*') && sp.endsWith('*')) {
              return <strong key={`${i}-${j}`} className="text-white font-bold">{sp.slice(1, -1)}</strong>;
            }
            return sp;
          });
        }
        return part;
      })}
    </>
  );
}
