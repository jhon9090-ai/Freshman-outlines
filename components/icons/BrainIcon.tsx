
import React from 'react';

const BrainIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 3.805c1.268.32 2.32.93 3.125 1.697C11.32 7.693 12 10.062 12 12s-.68 4.307-2.875 5.5c-.805.766-1.857 1.376-3.125 1.697"/>
    <path d="M18 20.195c-1.268-.32-2.32-.93-3.125-1.697C12.68 16.307 12 13.938 12 12s.68-4.307 2.875-5.5c.805-.766 1.857-1.376 3.125-1.697"/>
    <line x1="9" y1="9" x2="15" y2="9"/>
    <line x1="9" y1="15" x2="15" y2="15"/>
  </svg>
);

export default BrainIcon;
