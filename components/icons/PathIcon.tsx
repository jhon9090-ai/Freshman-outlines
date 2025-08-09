import React from 'react';

const PathIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="6" r="3"></circle>
    <circle cx="18" cy="18" r="3"></circle>
    <path d="M6 9v6a3 3 0 0 0 3 3h3"></path>
    <path d="M18 9v-3a3 3 0 0 0-3-3h-3"></path>
  </svg>
);

export default PathIcon;
