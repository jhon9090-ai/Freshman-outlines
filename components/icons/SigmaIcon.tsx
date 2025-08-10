
import React from 'react';

const SigmaIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 7V4h16v3"/>
    <path d="M4 17v3h16v-3"/>
    <path d="M4 17l8-5-8-5"/>
    <path d="M20 17l-8-5 8-5"/>
  </svg>
);

export default SigmaIcon;
