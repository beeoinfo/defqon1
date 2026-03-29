import { useState } from 'react';
import { Copy, LogOut, Plus, Users } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { normalizeTribeCode } from '../lib/supabase';

/**
 * View for managing tribes (groups of friends). Users can create a
 * tribe, join by code or leave an existing tribe. This component
 * mirrors the original logic and UI so that functionality remains
 * unchanged while the surrounding layout has been refactored.
 *
 * Props:
 *   tribe (object|null): The current tribe bundle or null if none.
 *   isBusy (boolean): Whether an async tribe operation is in flight.
 *   isHydrating (boolean): Whether the initial tribe bundle is still loading.
 *   onCreateTribe (function): Handler to create a new tribe.
 *   onJoinTribe (function): Handler to join a tribe by code.
 *   onLeaveTribe (function): Handler to leave the current tribe.
 */
export default function TribeView({
  tribe,
  isBusy,
  isHydrating = false,
  onCreateTribe,
  onJoinTribe,
  onLeaveTribe,
}) {
  const [joinCode, setJoinCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [leaveArmed, setLeaveArmed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  const handleCreate = async () => {
    setErrorMessage('');
    setCopyFeedback('');
    try {
      await onCreateTribe();
    } catch (error) {
      setErrorMessage(error.message || 'Could not create the tribe.');
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setCopyFeedback('');
    try {
      await onJoinTribe(joinCode);
      setJoinCode('');
    } catch (error) {
      setErrorMessage(error.message || 'Could not join the tribe.');
    }
  };

  const handleLeave = async () => {
    if (!leaveArmed) {
      setLeaveArmed(true);
      return;
    }
    setErrorMessage('');
    setCopyFeedback('');
    try {
      await onLeaveTribe();
      setLeaveArmed(false);
    } catch (error) {
      setErrorMessage(error.message || 'Could not leave the tribe.');
    }
  };

  const handleCopyCode = async () => {
    if (!tribe?.code) {
      return;
    }
    try {
      await navigator.clipboard.writeText(tribe.code);
      setCopyFeedback('Code copied.');
    } catch {
      setCopyFeedback('Could not copy the code.');
    }
  };

  if (!tribe && isHydrating) {
    return (
      <section className="tribe-view">
        <h1 className="sr-only">Tribe</h1>
        <div className="tribe-coming-soon">
          <EmptyState text="Loading tribe..." />
        </div>
      </section>
    );
  }

  if (!tribe) {
    return (
      <section className="tribe-view">
        <h1 className="sr-only">Tribe</h1>
        <div className="tribe-grid">
          <article className="tribe-card">
            <div className="tribe-card__header">
              <Plus size={18} />
              <h2>Create a tribe</h2>
            </div>
            <p className="muted">
              Start a new tribe, get a unique code, then share it with your friends.
            </p>
            <button
              type="button"
              className="button-primary"
              onClick={handleCreate}
              disabled={isBusy}
            >
              {isBusy ? 'Creating...' : 'Create tribe'}
            </button>
          </article>
          <article className="tribe-card">
            <div className="tribe-card__header">
              <Users size={18} />
              <h2>Join a tribe</h2>
            </div>
            <p className="muted">Enter a code shared by another member.</p>
            <form className="tribe-join-form" onSubmit={handleJoin}>
              <input
                className="search-input"
                value={joinCode}
                onChange={(event) => setJoinCode(normalizeTribeCode(event.target.value))}
                placeholder="Enter code"
                maxLength={8}
              />
              <button
                type="submit"
                className="button-secondary"
                disabled={isBusy || !joinCode}
              >
                {isBusy ? 'Joining...' : 'Join tribe'}
              </button>
            </form>
          </article>
        </div>
        {errorMessage && <div className="form-error">{errorMessage}</div>}
        <div className="tribe-coming-soon">
          <EmptyState text="Tribe space created. The shared lineup content comes next." />
        </div>
      </section>
    );
  }
  return (
    <section className="tribe-view">
      <h1 className="sr-only">Tribe</h1>
      <article className="tribe-card tribe-card--active">
        <div className="tribe-card__header">
          <Users size={18} />
          <h2>Your tribe</h2>
        </div>
        <div className="tribe-code-block">
          <span className="tribe-code-block__label">Invite code</span>
          <strong className="tribe-code">{tribe.code}</strong>
        </div>
        <div className="tribe-stats">
          <span className="tribe-stat">
            Role: <strong>{tribe.isOwner ? 'Owner' : 'Member'}</strong>
          </span>
          <span className="tribe-stat">
            Members: <strong>{tribe.memberCount}</strong>
          </span>
        </div>
        <div className="tribe-actions">
          <button type="button" className="button-secondary" onClick={handleCopyCode}>
            <Copy size={16} />
            <span>Copy code</span>
          </button>
          <button
            type="button"
            className={leaveArmed ? 'button-danger' : 'button-secondary'}
            onClick={handleLeave}
            disabled={isBusy}
          >
            <LogOut size={16} />
            <span>{leaveArmed ? 'Confirm leave' : 'Leave tribe'}</span>
          </button>
        </div>
        {leaveArmed && (
          <p className="tribe-warning">
            This action is protected to avoid mistakes. Click again to confirm.
          </p>
        )}
        {copyFeedback && <div className="form-success">{copyFeedback}</div>}
        {errorMessage && <div className="form-error">{errorMessage}</div>}
      </article>
      <div className="tribe-coming-soon">
        <EmptyState text="Tribe space ready. Shared favorites and tribe lineup views come next." />
      </div>
    </section>
  );
}
