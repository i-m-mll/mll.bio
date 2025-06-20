import React from 'react';

interface NoteScopeProps {
  children: React.ReactNode;
  className?: string;
}

// Simplified positioning container for MarginNotes with target or top props
// No client-side positioning logic - all positioning handled by remark plugin + CSS
export const NoteScope = ({ children, className = '' }: NoteScopeProps) => {
  return (
    <div 
      className={`note-scope ${className}`}
      style={{ position: 'relative' }}
    >
      {children}
    </div>
  );
}; 