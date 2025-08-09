
import React from 'react';

const CardViewIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
    <path d="M6 3h12a2 2 0 0 1 2 2v2H4V5a2 2 0 0 1 2-2z"></path>
  </svg>
);

export default CardViewIcon;
