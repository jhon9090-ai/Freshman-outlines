
import React from 'react';

const MagnetIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"/>
        <path d="M20.2 20.2c2.04-2.03.02-5.91-4.04-9.94-4.06-4.03-7.9-6.06-9.94-4.04-2.04 2.03-.02 5.91 4.04 9.94 4.06 4.03 7.9 6.06 9.94 4.04Z"/>
        <path d="M3.8 3.8c-2.04 2.03-.02 5.91 4.04 9.94 4.06 4.03 7.9 6.06 9.94 4.04 2.04-2.03.02-5.91-4.04-9.94-4.06-4.03-7.9-6.06-9.94-4.04Z"/>
    </svg>
);

export default MagnetIcon;
