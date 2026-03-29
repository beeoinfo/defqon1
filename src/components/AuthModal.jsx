import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import {
  isSupabaseConfigured,
  signInWithUsername,
  signUpWithUsername,
  validateEmail,
  validatePassword,
  validateUsername,
} from '../lib/supabase';

/**
 * Authentication modal supporting login and signup flows. When open
 * the user can enter their credentials, create an account or log in.
 * Validation is performed client‑side and any errors are displayed.
 * On success the onSuccess callback is invoked with the authenticated user.
 *
 * Props:
 *   open (boolean): Whether the modal is visible.
 *   defaultTab (string): Either 'login' or 'signup' to control the initial tab.
 *   onClose (function): Handler invoked when the close button is clicked.
 *   onSuccess (function): Called with the user object after a successful login or signup.
 */
export default function AuthModal({ open, defaultTab = 'login', onClose, onSuccess }) {
  const [tab, setTab] = useState(defaultTab);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (open) {
      setTab(defaultTab);
      setErrorMessage('');
      setSuccessMessage('');
      setUsername('');
      setPassword('');
    }
  }, [open, defaultTab]);

  if (!open) {
    return null;
  }

  const isSignup = tab === 'signup';

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!isSupabaseConfigured()) {
      setErrorMessage('Supabase is not configured.');
      return;
    }

    const isValidLoginIdentifier = validateUsername(username) || validateEmail(username);

    if (isSignup && !validateUsername(username)) {
      setErrorMessage(
        'Username must contain 3 to 30 characters: lowercase letters, numbers, dot, underscore or dash.'
      );
      return;
    }

    if (!isSignup && !isValidLoginIdentifier) {
      setErrorMessage('Enter a valid username or email address.');
      return;
    }

    if (!password) {
      setErrorMessage('Password is required.');
      return;
    }

    if (isSignup && !validatePassword(password)) {
      setErrorMessage(
        'Password must contain at least 8 characters, including uppercase, lowercase, number and symbol.'
      );
      return;
    }

    if (isSignup && (!firstName.trim() || !lastName.trim())) {
      setErrorMessage('First name and last name are required.');
      return;
    }

    setIsBusy(true);

    try {
      if (isSignup) {
        const result = await signUpWithUsername({
          firstName,
          lastName,
          username,
          password,
        });
        if (result.user) {
          onSuccess?.(result.user);
          return;
        }
        setSuccessMessage('Account created. You can now log in with your username and password.');
        setTab('login');
        setUsername('');
        setPassword('');
        return;
      }
      const user = await signInWithUsername({ username, password });
      onSuccess?.(user);
    } catch (error) {
      setErrorMessage(error.message || 'Something went wrong.');
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-panel modal-panel--auth" onClick={(event) => event.stopPropagation()}>
        <div className="modal-panel__header">
          <div>
            <h2>{isSignup ? 'Create your account' : 'Welcome back'}</h2>
            <p className="muted">
              Save your favorites and sync them across devices.
            </p>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="modal-tabs modal-tabs--auth">
          <button
            type="button"
            className={tab === 'login' ? 'modal-tab modal-tab--active' : 'modal-tab'}
            onClick={() => {
              setTab('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={tab === 'signup' ? 'modal-tab modal-tab--active' : 'modal-tab'}
            onClick={() => {
              setTab('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
          >
            Sign up
          </button>
        </div>
        <form className="form-grid form-grid--auth" onSubmit={handleSubmit}>
          {isSignup && (
            <>
              <label className="field">
                <span>First name</span>
                <input
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  autoComplete="given-name"
                />
              </label>
              <label className="field">
                <span>Last name</span>
                <input
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  autoComplete="family-name"
                />
              </label>
            </>
          )}
          <label className="field">
            <span>Username</span>
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
          </label>
          {isSignup && (
            <p className="form-help">
              Minimum 8 characters with uppercase, lowercase, number and symbol.
            </p>
          )}
          {successMessage && <div className="form-success">{successMessage}</div>}
          {errorMessage && <div className="form-error">{errorMessage}</div>}
          <div className="modal-actions">
            <button type="submit" className="button-primary" disabled={isBusy}>
              {isBusy ? 'Please wait...' : isSignup ? 'Create account' : 'Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
