import React from 'react';

const WandIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m5 3-3 3 3 3"/>
    <path d="m3 5 3-3 3 3"/>
    <path d="M12.5 21.5 16 18l-3.5-3.5L9 18l3.5 3.5Z"/>
    <path d="M18 16l-3.5-3.5"/>
    <path d="m21 12.5-3.5-3.5"/>
    <path d="m14 7-3.5-3.5"/>
    <path d="M6.5 12.5 3 9l3.5-3.5"/>
  </svg>
);

export default WandIcon;
