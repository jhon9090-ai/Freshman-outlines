import React from 'react';

interface UserIconProps {
  className?: string;
  isLoggedIn?: boolean;
}

const UserIcon: React.FC<UserIconProps> = ({ className = '', isLoggedIn = false }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {isLoggedIn ? (
        // Logged in user icon (user with check)
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <path d="M9 17l2 2 4-4" />
        </>
      ) : (
        // Not logged in user icon (standard user)
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      )}
    </svg>
  );
};

export default UserIcon;