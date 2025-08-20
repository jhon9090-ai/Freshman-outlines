
import React from 'react';

const TuneIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M3 21v-4.5a3.5 3.5 0 0 1 7 0V21"/>
        <path d="M14 21v-1.5a3.5 3.5 0 0 1 7 0V21"/>
        <path d="M3 12V3"/>
        <path d="M14 16.5V3"/>
        <path d="M10 3v13.5"/>
        <path d="M21 3v13.5"/>
        <path d="M1 12h4"/>
        <path d="M8 16.5h4"/>
        <path d="M12 8h4"/>
        <path d="M19 8h4"/>
    </svg>
);

export default TuneIcon;
