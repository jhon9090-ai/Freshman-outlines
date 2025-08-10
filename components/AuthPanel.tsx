import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import Modal from './ui/Modal';
import { registerUser, loginUser, logoutUser, getCurrentUser, onAuthStateChange } from '../services/firebaseService';

interface AuthPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthStateChanged: (user: User | null) => void;
}

const AuthPanel: React.FC<AuthPanelProps> = ({ isOpen, onClose, onAuthStateChanged }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const currentUser = getCurrentUser();
    setUser(currentUser);
    onAuthStateChanged(currentUser);

    // Set up auth state listener
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
      onAuthStateChanged(authUser);
    });

    return () => unsubscribe();
  }, [onAuthStateChanged]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        // Registration logic
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters');
        }

        await registerUser(email, password);
      } else {
        // Login logic
        await loginUser(email, password);
      }

      // Clear form
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      onClose();
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logoutUser();
    } catch (err) {
      console.error('Logout error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    setError(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={user ? 'Account' : (isRegistering ? 'Register' : 'Login')}>
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-800 rounded-md text-red-200 text-sm">
            {error}
          </div>
        )}

        {user ? (
          // User is logged in - show account info
          <div className="space-y-4">
            <div className="p-4 bg-slate-800 rounded-md">
              <p className="text-slate-300 mb-1">Signed in as:</p>
              <p className="font-medium">{user.email}</p>
            </div>
            
            <button
              onClick={handleLogout}
              disabled={isLoading}
              className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing Out...' : 'Sign Out'}
            </button>
          </div>
        ) : (
          // User is not logged in - show login/register form
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"
              />
            </div>
            
            {isRegistering && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-2 bg-slate-800 border border-slate-600 rounded-md focus:ring-[rgba(var(--primary-rgb),1)] focus:border-[rgba(var(--primary-rgb),1)]"
                />
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2 px-4 bg-[rgba(var(--primary-rgb),1)] hover:bg-[rgba(var(--primary-rgb),0.8)] rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : (isRegistering ? 'Register' : 'Login')}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={toggleAuthMode}
                className="text-sm text-[rgba(var(--primary-rgb),1)] hover:underline"
              >
                {isRegistering ? 'Already have an account? Login' : 'Need an account? Register'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default AuthPanel;