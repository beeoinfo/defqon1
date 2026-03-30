import { useEffect, useMemo, useState } from 'react';
import { LogOut, Pencil, Plus, QrCode, Share2, Users, X } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import { resolveProfileAvatarUrl } from '../lib/presetAvatars';
import { normalizeTribeCode } from '../lib/supabase';

function getInviteUrl(code) {
  if (!code || typeof window === 'undefined') {
    return '';
  }
  const url = new URL(window.location.href);
  url.searchParams.set('tribe', code);
  return url.toString();
}

function getTribeDisplayName(tribe) {
  const nextName = String(tribe?.name ?? '').trim();
  if (nextName) {
    return nextName;
  }
  return `Tribe ${tribe?.code ?? ''}`.trim();
}

export default function TribeView({
  user,
  tribe,
  isBusy,
  isHydrating = false,
  pendingInviteCode = '',
  inviteConflictMessage = '',
  onCreateTribe,
  onJoinTribe,
  onLeaveTribe,
  onRenameTribe,
}) {
  const [joinCode, setJoinCode] = useState(() => pendingInviteCode || '');
  const [tribeName, setTribeName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [leaveErrorMessage, setLeaveErrorMessage] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveConfirmInput, setLeaveConfirmInput] = useState('');

  useEffect(() => {
    setJoinCode(pendingInviteCode || '');
  }, [pendingInviteCode]);

  useEffect(() => {
    setTribeName(tribe ? getTribeDisplayName(tribe) : '');
    setIsEditingName(false);
    setShowQr(false);
    setIsLeaveModalOpen(false);
    setLeaveConfirmInput('');
    setLeaveErrorMessage('');
  }, [tribe]);

  const inviteUrl = useMemo(() => getInviteUrl(tribe?.code), [tribe?.code]);
  const qrCodeUrl = useMemo(() => {
    if (!inviteUrl) {
      return '';
    }
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&data=${encodeURIComponent(inviteUrl)}`;
  }, [inviteUrl]);
  const sortedMembers = useMemo(() => {
    if (!tribe?.members?.length) {
      return [];
    }
    return [...tribe.members].sort((left, right) => {
      if (left.userId === user?.id) {
        return -1;
      }
      if (right.userId === user?.id) {
        return 1;
      }
      if (left.role === 'owner' && right.role !== 'owner') {
        return -1;
      }
      if (right.role === 'owner' && left.role !== 'owner') {
        return 1;
      }
      const leftName = `${left.profile?.first_name ?? ''} ${left.profile?.last_name ?? ''}`.trim();
      const rightName = `${right.profile?.first_name ?? ''} ${right.profile?.last_name ?? ''}`.trim();
      return leftName.localeCompare(rightName);
    });
  }, [tribe?.members, user?.id]);

  const handleCreate = async () => {
    setErrorMessage('');
    setShareFeedback('');
    try {
      await onCreateTribe(tribeName);
    } catch (error) {
      setErrorMessage(error.message || 'Could not create the tribe.');
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setShareFeedback('');
    try {
      await onJoinTribe(joinCode);
      setJoinCode('');
    } catch (error) {
      setErrorMessage(error.message || 'Could not join the tribe.');
    }
  };

  const handleLeave = async () => {
    const expectedUsername = String(user?.user_metadata?.username ?? user?.username ?? '').trim().toLowerCase();
    const enteredUsername = String(leaveConfirmInput ?? '').trim().toLowerCase();
    if (!expectedUsername || enteredUsername !== expectedUsername) {
      setLeaveErrorMessage('Enter your username to confirm leaving the tribe.');
      return;
    }
    setLeaveErrorMessage('');
    setShareFeedback('');
    try {
      await onLeaveTribe();
      setIsLeaveModalOpen(false);
      setLeaveConfirmInput('');
    } catch (error) {
      setLeaveErrorMessage(error.message || 'Could not leave the tribe.');
    }
  };

  const handleRename = async () => {
    const nextName = String(tribeName ?? '').trim();
    if (!nextName) {
      setErrorMessage('Please enter a tribe name.');
      return;
    }
    setErrorMessage('');
    setShareFeedback('');
    try {
      await onRenameTribe(nextName);
      setIsEditingName(false);
    } catch (error) {
      const nextMessage = String(error?.message ?? '');
      setErrorMessage(
        nextMessage.toLowerCase().includes('owner')
          ? 'Could not rename the tribe.'
          : nextMessage || 'Could not rename the tribe.'
      );
    }
  };

  const handleCancelRename = () => {
    setTribeName(getTribeDisplayName(tribe));
    setErrorMessage('');
    setIsEditingName(false);
  };

  const handleShare = async () => {
    if (!inviteUrl) {
      return;
    }
    setErrorMessage('');
    try {
      if (navigator.share) {
        await navigator.share({
          title: getTribeDisplayName(tribe),
          text: 'Join my tribe on the Defqon.1 companion app.',
          url: inviteUrl,
        });
        return;
      }
      await navigator.clipboard.writeText(inviteUrl);
      setShareFeedback('Invite link copied.');
    } catch {
      setShareFeedback('Could not share the invite link.');
    }
  };

  if (!tribe && isHydrating) {
    return (
      <section className="tribe-view">
        <h1 className="sr-only">Tribe</h1>
        <div className="tribe-empty-state">
          <EmptyState text="Loading tribe..." />
        </div>
      </section>
    );
  }

  if (!tribe) {
    return (
      <section className="tribe-view">
        <h1 className="sr-only">Tribe</h1>
        <div className="tribe-grid tribe-grid--setup">
          <article className="tribe-card tribe-card--setup">
            <div className="tribe-card__header">
              <Plus size={18} />
              <h2>Create your tribe</h2>
            </div>
            <p className="muted">
              Pick a name, create a private invite link, then share it with your people.
            </p>
            <label className="field tribe-field">
              <span>Tribe name</span>
              <input
                value={tribeName}
                onChange={(event) => setTribeName(event.target.value.slice(0, 48))}
                placeholder="Weekend crew"
                maxLength={48}
              />
            </label>
            <button
              type="button"
              className="button-primary"
              onClick={handleCreate}
              disabled={isBusy}
            >
              {isBusy ? 'Creating...' : 'Create tribe'}
            </button>
          </article>
          <article className="tribe-card tribe-card--setup">
            <div className="tribe-card__header">
              <Users size={18} />
              <h2>Join with a code</h2>
            </div>
            <p className="muted">
              Enter a code or open a tribe link. Invite links are kept in this tab until you sign in.
            </p>
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
            {pendingInviteCode && (
              <div className="tribe-pending-invite">
                <span className="tribe-pending-invite__label">Invite waiting in this tab</span>
                <strong>{pendingInviteCode}</strong>
              </div>
            )}
          </article>
        </div>
        {errorMessage && <div className="form-error">{errorMessage}</div>}
      </section>
    );
  }

  return (
    <section className="tribe-view">
      <h1 className="sr-only">Tribe</h1>
      {inviteConflictMessage ? (
        <div className="alert-banner alert-banner--danger tribe-alert-banner" role="alert">
          <div className="alert-banner__icon">⚠️</div>
          <div className="alert-banner__content">
            <strong>Join blocked</strong>
            <p>{inviteConflictMessage}</p>
          </div>
        </div>
      ) : null}
      <div className="tribe-grid tribe-grid--active">
        <article className="tribe-card tribe-card--hero tribe-card--active">
          <div className="tribe-card__header">
            <Users size={18} />
            <h2>Your tribe</h2>
          </div>

          <div className="tribe-name-row">
            {isEditingName ? (
              <>
                <input
                  className="tribe-name-input"
                  value={tribeName}
                  onChange={(event) => setTribeName(event.target.value.slice(0, 48))}
                  placeholder="Tribe name"
                  maxLength={48}
                />
                <div className="tribe-name-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleRename}
                    disabled={isBusy}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={handleCancelRename}
                    disabled={isBusy}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="tribe-name-copy">
                  <span className="tribe-code-block__label">Tribe name</span>
                  <strong className="tribe-name">{getTribeDisplayName(tribe)}</strong>
                </div>
                <button
                  type="button"
                  className="icon-button tribe-name-edit"
                  onClick={() => setIsEditingName(true)}
                  aria-label="Rename tribe"
                >
                  <Pencil size={16} />
                </button>
              </>
            )}
          </div>

          <div className="tribe-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => setShowQr(true)}
            >
              <QrCode size={16} />
              <span>Show QR code</span>
            </button>
            <button type="button" className="button-secondary" onClick={handleShare}>
              <Share2 size={16} />
              <span>Share invite</span>
            </button>
            <button
              type="button"
              className="button-danger tribe-leave-button"
              onClick={() => {
                setLeaveErrorMessage('');
                setIsLeaveModalOpen(true);
              }}
              disabled={isBusy}
            >
              <LogOut size={16} />
              <span>Leave tribe</span>
            </button>
          </div>
          {shareFeedback && <div className="form-success">{shareFeedback}</div>}
          {errorMessage && <div className="form-error">{errorMessage}</div>}
        </article>

        <article className="tribe-card tribe-card--members">
          <div className="tribe-card__header">
            <Users size={18} />
            <h2>{tribe.memberCount} member{tribe.memberCount === 1 ? '' : 's'}</h2>
          </div>
          <div className="tribe-member-list">
            {sortedMembers.map((member) => {
              const profile = member.profile ?? {};
              const username = String(profile.username ?? '').trim();
              const firstName =
                String(profile.first_name ?? '').trim() ||
                username ||
                `Member ${String(member.userId ?? '').slice(0, 6)}`;
              const lastName = String(profile.last_name ?? '').trim();
              const fullName = [firstName, lastName].filter(Boolean).join(' ');
              const ownerLabel = member.role === 'owner' ? 'Owner' : '';
              return (
                <div key={member.userId} className="tribe-member-card">
                  <img
                    src={resolveProfileAvatarUrl(profile)}
                    alt={fullName}
                    className="tribe-member-card__avatar"
                  />
                  <div className="tribe-member-card__copy">
                    <strong>{fullName}</strong>
                    <span>{username ? `@${username}` : 'Profile unavailable'}</span>
                  </div>
                  <div className="tribe-member-card__meta">
                    {ownerLabel ? <span className="tribe-member-card__role">{ownerLabel}</span> : null}
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </div>
      {isLeaveModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsLeaveModalOpen(false)}>
          <div className="modal-panel tribe-leave-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-panel__header">
              <div>
                <h2>Leave tribe</h2>
                <p className="muted">
                  Type "<strong>{user?.user_metadata?.username ?? user?.username ?? ''}</strong>" to confirm.
                </p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setIsLeaveModalOpen(false)}
                aria-label="Close leave tribe confirmation"
              >
                <X size={18} />
              </button>
            </div>
            <div className="tribe-leave-modal__body">
              <input
                className="tribe-name-input"
                value={leaveConfirmInput}
                onChange={(event) => setLeaveConfirmInput(event.target.value)}
                placeholder="Type your handle to confirm"
                name="leave-confirmation"
                autoComplete="new-password"
                autoCapitalize="off"
                autoCorrect="off"
                spellCheck={false}
              />
              {leaveErrorMessage && <div className="form-error">{leaveErrorMessage}</div>}
              <div className="tribe-name-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={() => {
                    setIsLeaveModalOpen(false);
                    setLeaveErrorMessage('');
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="button-danger"
                  onClick={handleLeave}
                  disabled={isBusy}
                >
                  Confirm leave
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {showQr && qrCodeUrl && (
        <div className="modal-backdrop" onClick={() => setShowQr(false)}>
          <div className="modal-panel tribe-qr-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-panel__header">
              <div>
                <h2>Join this tribe</h2>
                <p className="muted">{getTribeDisplayName(tribe)}</p>
              </div>
              <button
                type="button"
                className="icon-button"
                onClick={() => setShowQr(false)}
                aria-label="Close QR code"
              >
                <X size={18} />
              </button>
            </div>
            <div className="tribe-qr-frame tribe-qr-frame--modal">
              <img src={qrCodeUrl} alt={`QR code to join ${getTribeDisplayName(tribe)}`} />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
