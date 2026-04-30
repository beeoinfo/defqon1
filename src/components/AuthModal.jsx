import { useEffect, useState } from 'react';
import Alert from './Alert';
import Box from './layout/Box';
import Modal from './layout/Modal';
import Button from './primitives/Button';
import Title from './primitives/Title';
import { TextInput } from './primitives/forms';
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
    if (!open) {
      return;
    }

    setTab(defaultTab);
    setErrorMessage('');
    setSuccessMessage('');
    setFirstName('');
    setLastName('');
    setUsername('');
    setPassword('');
  }, [open, defaultTab]);

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
    <Modal
      open={open}
      onClose={onClose}
      title={isSignup ? 'Create your account' : 'Welcome back'}
      subtitle={
        isSignup
          ? 'Create an account to sync favorites, tribe activity and profile settings.'
          : 'Log in to recover your synced profile, tribe and saved favorites.'
      }
      maxWidth="560px"
    >
      <Box gap="var(--dq-ui-space-lg)">
        <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-sm)">
          <Button
            selected={tab === 'login'}
            onClick={() => {
              setTab('login');
              setErrorMessage('');
              setSuccessMessage('');
            }}
          >
            Login
          </Button>
          <Button
            selected={tab === 'signup'}
            onClick={() => {
              setTab('signup');
              setErrorMessage('');
              setSuccessMessage('');
            }}
          >
            Sign up
          </Button>
        </Box>

        <Box component="form" gap="var(--dq-ui-space-lg)" onSubmit={handleSubmit}>
          {isSignup ? (
            <Box direction="row" wrap="wrap" maxColumns={2}>
              <TextInput
                label="First name"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                autoComplete="given-name"
                required
              />
              <TextInput
                label="Last name"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                autoComplete="family-name"
                required
              />
            </Box>
          ) : null}

          <TextInput
            label={isSignup ? 'Username' : 'Username or email'}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            description={
              isSignup
                ? 'Use lowercase letters, numbers, dots, underscores or dashes.'
                : undefined
            }
            required
          />

          <TextInput
            label="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            description={
              isSignup
                ? 'Minimum 8 characters with uppercase, lowercase, number and symbol.'
                : undefined
            }
            required
          />

          {successMessage ? (
            <Alert variant="success" title="Account created">
              {successMessage}
            </Alert>
          ) : null}

          {errorMessage ? (
            <Alert variant="error" title="Authentication failed">
              {errorMessage}
            </Alert>
          ) : null}

          <Box direction="row" justify="space-between" align="center" wrap="wrap">
            <Title component="span" variant="h6">
              {isSignup
                ? 'Your synced profile is ready right after sign-up.'
                : 'Your favorites and tribe stay attached to your account.'}
            </Title>
            <Button type="submit" disabled={isBusy}>
              {isBusy ? 'Please wait...' : isSignup ? 'Create account' : 'Login'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
