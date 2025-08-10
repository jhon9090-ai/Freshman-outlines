import React from 'react';
import UserIcon from './icons/UserIcon'; // Assuming a generic user icon exists or can be created

const LoginPrompt: React.FC<{onOpenSettings: () => void}> = ({ onOpenSettings }) => {
    return (
        <div className="text-center glass-panel rounded-lg py-12 px-6 mt-4 animate-fadeInUp">
            <div className="w-16 h-16 bg-[rgba(var(--primary-rgb),0.2)] text-[rgba(var(--primary-rgb),1)] rounded-full flex items-center justify-center mx-auto mb-4">
                <UserIcon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-semibold text-white">Welcome to Intelligent Outlines</h3>
            <p className="text-slate-400 mt-2 max-w-md mx-auto">To save your outlines to the cloud and sync across devices, please sign in.</p>
            <button 
                onClick={onOpenSettings}
                className="mt-6 bg-gradient-to-r from-[rgba(var(--primary-rgb),0.8)] to-[rgba(var(--primary-rgb),1)] text-white font-bold py-2 px-6 rounded-lg hover:from-[rgba(var(--primary-rgb),1)] hover:to-[rgba(var(--primary-rgb),0.9)] transition-all active:scale-95"
            >
                Sign In / Configure
            </button>
            <p className="text-xs text-slate-500 mt-3">You can configure your Firebase project in the settings.</p>
        </div>
    );
};

// Simple User Icon component
const UserIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
    </svg>
);


export default LoginPrompt;
