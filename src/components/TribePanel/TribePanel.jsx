import { useEffect, useMemo, useState } from 'react';
import {
  PencilSimpleIcon,
  QrCodeIcon,
  ShareNetworkIcon,
  UsersIcon,
} from '@phosphor-icons/react';
import Alert from '@/components/Alert';
import EmptyState from '@/components/EmptyState';
import Box from '@/components/layout/Box';
import Modal from '@/components/layout/Modal';
import PeopleCard from '@/components/PeopleCard';
import Button from '@/components/primitives/Button';
import { TextInput } from '@/components/primitives/forms';
import { resolveProfileAvatarUrl } from '@/lib/presetAvatars';
import { normalizeTribeCode } from '@/lib/supabase';
import './TribePanel.css';

const getInviteUrl = (code) => {
  if (!code || typeof window === 'undefined') {
    return '';
  }

  const url = new URL(window.location.href);
  url.searchParams.set('tribe', code);
  return url.toString();
};

const getTribeDisplayName = (tribe) => {
  const nextName = String(tribe?.name ?? '').trim();

  if (nextName) {
    return nextName;
  }

  return `Tribe ${tribe?.code ?? ''}`.trim();
};

const TribePanel = ({
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
}) => {
  const [joinCode, setJoinCode] = useState(() => pendingInviteCode || '');
  const [tribeName, setTribeName] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [leaveErrorMessage, setLeaveErrorMessage] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [copyFeedback, setCopyFeedback] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveConfirmInput, setLeaveConfirmInput] = useState('');

  useEffect(() => {
    setJoinCode(pendingInviteCode || '');
  }, [pendingInviteCode]);

  useEffect(() => {
    setTribeName(tribe ? getTribeDisplayName(tribe) : '');
    setIsEditingName(false);
    setIsQrModalOpen(false);
    setIsLeaveModalOpen(false);
    setLeaveConfirmInput('');
    setLeaveErrorMessage('');
    setShareFeedback('');
    setCopyFeedback('');
  }, [tribe]);

  const inviteUrl = useMemo(() => getInviteUrl(tribe?.code), [tribe?.code]);
  const savedTribeName = tribe ? getTribeDisplayName(tribe) : '';
  const hasTribeNameChange = String(tribeName ?? '').trim() !== savedTribeName;
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

    return [...tribe.members].sort((leftMember, rightMember) => {
      if (leftMember.userId === user?.id) {
        return -1;
      }

      if (rightMember.userId === user?.id) {
        return 1;
      }

      if (leftMember.role === 'owner' && rightMember.role !== 'owner') {
        return -1;
      }

      if (rightMember.role === 'owner' && leftMember.role !== 'owner') {
        return 1;
      }

      const leftName = `${leftMember.profile?.first_name ?? ''} ${leftMember.profile?.last_name ?? ''}`.trim();
      const rightName = `${rightMember.profile?.first_name ?? ''} ${rightMember.profile?.last_name ?? ''}`.trim();
      return leftName.localeCompare(rightName);
    });
  }, [tribe?.members, user?.id]);

  const handleCreate = async () => {
    setErrorMessage('');
    setShareFeedback('');

    try {
      await onCreateTribe?.(tribeName);
    } catch (error) {
      setErrorMessage(error.message || 'Could not create the tribe.');
    }
  };

  const handleJoin = async (event) => {
    event.preventDefault();
    setErrorMessage('');
    setShareFeedback('');

    try {
      await onJoinTribe?.(joinCode);
      setJoinCode('');
    } catch (error) {
      setErrorMessage(error.message || 'Could not join the tribe.');
    }
  };

  const handleLeave = async () => {
    const expectedUsername = String(user?.user_metadata?.username ?? user?.username ?? '')
      .trim()
      .toLowerCase();
    const enteredUsername = String(leaveConfirmInput ?? '').trim().toLowerCase();

    if (!expectedUsername || enteredUsername !== expectedUsername) {
      setLeaveErrorMessage('Enter your username to confirm leaving the tribe.');
      return;
    }

    setLeaveErrorMessage('');
    setShareFeedback('');

    try {
      await onLeaveTribe?.();
      setIsLeaveModalOpen(false);
      setLeaveConfirmInput('');
    } catch (error) {
      setLeaveErrorMessage(error.message || 'Could not leave the tribe.');
    }
  };

  const handleRename = async () => {
    const nextName = String(tribeName ?? '').trim();

    if (!nextName) {
      setErrorMessage('Please enter a name.');
      return;
    }

    setErrorMessage('');
    setShareFeedback('');

    try {
      await onRenameTribe?.(nextName);
      setIsEditingName(false);
    } catch (error) {
      setErrorMessage(error.message || 'Could not rename the tribe.');
    }
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

  const handleCopyInviteCode = async () => {
    if (!tribe?.code) {
      return;
    }

    try {
      await navigator.clipboard.writeText(tribe.code);
      setCopyFeedback('Invite code copied.');
    } catch {
      setCopyFeedback('Could not copy the invite code.');
    }
  };

  if (!tribe && isHydrating) {
    return <EmptyState title="Loading tribe" text="Fetching the latest tribe membership and member activity." />;
  }

  return (
    <Box gap="var(--dq-ui-space-xl)">
      {inviteConflictMessage ? (
        <Alert variant="error" title="Join blocked">
          {inviteConflictMessage}
        </Alert>
      ) : null}

      {!tribe ? (
        <>
          <Box background="surface">
            <Box direction="row" wrap="wrap" maxColumns={2}>
              <Box gap="var(--dq-ui-space-lg)">
                <strong className="dq-tribe-view__section-label">Create your tribe</strong>
                <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
                  Pick a name, generate a private invite link, then share it with your people.
                </p>
                <TextInput
                  label="Name"
                  value={tribeName}
                  onChange={(event) => setTribeName(event.target.value.slice(0, 48))}
                  placeholder="Weekend crew"
                  maxLength={48}
                  autoComplete="off"
                />
                <Button onClick={handleCreate} disabled={isBusy}>
                  {isBusy ? 'Creating...' : 'Create tribe'}
                </Button>
              </Box>

              <Box gap="var(--dq-ui-space-lg)">
                <strong className="dq-tribe-view__section-label">Join with a code</strong>
                <p style={{ margin: 0, color: 'var(--dq-ui-text-soft)' }}>
                  Enter a code or open a tribe link. Invite links stay attached to this tab until you sign in.
                </p>
                <Box component="form" gap="var(--dq-ui-space-lg)" onSubmit={handleJoin}>
                  <TextInput
                    label="Invite code"
                    value={joinCode}
                    onChange={(event) => setJoinCode(normalizeTribeCode(event.target.value))}
                    placeholder="Enter code"
                    maxLength={8}
                    autoComplete="off"
                  />
                  <Button type="submit" disabled={isBusy || !joinCode}>
                    {isBusy ? 'Joining...' : 'Join tribe'}
                  </Button>
                </Box>

                {pendingInviteCode ? (
                  <Alert variant="info" title="Invite waiting in this tab">
                    {pendingInviteCode}
                  </Alert>
                ) : null}
              </Box>
            </Box>
          </Box>

          {errorMessage ? (
            <Alert variant="error" title="Tribe unavailable">
              {errorMessage}
            </Alert>
          ) : null}
        </>
      ) : (
        <>
          <Box background="surface" title="Your tribe" titleIcon={UsersIcon}>
            <Box direction="row" wrap="wrap" maxColumns={2} align="flex-start">
              <Box gap="var(--dq-ui-space-lg)">
                {isEditingName ? (
                  <Box
                    component="form"
                    background="surface"
                    className="dq-tribe-view__name-editor"
                    gap="var(--dq-ui-space-lg)"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleRename();
                    }}
                  >
                    <TextInput
                      label="Name"
                      value={tribeName}
                      onChange={(event) => setTribeName(event.target.value.slice(0, 48))}
                      placeholder="Name"
                      maxLength={48}
                      autoComplete="off"
                    />
                    <Box direction="row" justify="flex-end" wrap="wrap" gap="var(--dq-ui-space-sm)">
                      <Button
                        onClick={() => {
                          setTribeName(getTribeDisplayName(tribe));
                          setErrorMessage('');
                          setIsEditingName(false);
                        }}
                        disabled={isBusy}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isBusy || !hasTribeNameChange}>
                        {isBusy ? 'Saving...' : 'Save'}
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  <Box gap="var(--dq-ui-space-lg)" className="dq-tribe-view__summary-actions">
                    <Box direction="row" align="center" wrap="wrap">
                      <Box gap="var(--dq-ui-space-xs)">
                        <strong className="dq-tribe-view__name">{getTribeDisplayName(tribe)}</strong>
                      </Box>
                      <Button
                        icon={PencilSimpleIcon}
                        ariaLabel="Rename tribe"
                        onClick={() => setIsEditingName(true)}
                      />
                    </Box>

                    <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-sm)">
                      <Button icon={QrCodeIcon} onClick={() => setIsQrModalOpen(true)}>
                        Show QR code
                      </Button>
                      <Button icon={ShareNetworkIcon} onClick={handleShare}>
                        Share invite
                      </Button>
                      <Button variant="danger" onClick={() => setIsLeaveModalOpen(true)} disabled={isBusy}>
                        Leave tribe
                      </Button>
                    </Box>
                  </Box>
                )}

              {shareFeedback ? (
                <Alert variant="success" title="Sharing">
                  {shareFeedback}
                </Alert>
              ) : null}

              {errorMessage ? (
                <Alert variant="error" title="Tribe action failed">
                  {errorMessage}
                </Alert>
              ) : null}
              </Box>

              <Box gap="var(--dq-ui-space-md)">
                <strong className="dq-tribe-view__section-label">
                  {tribe.memberCount} member{tribe.memberCount === 1 ? '' : 's'}
                </strong>
                <Box gap="var(--dq-ui-space-sm)">
                  {sortedMembers.map((member) => {
                    const profile = member.profile ?? {};
                    const username = String(profile.username ?? '').trim();
                    const firstName =
                      String(profile.first_name ?? '').trim() ||
                      username ||
                      `Member ${String(member.userId ?? '').slice(0, 6)}`;
                    const lastName = String(profile.last_name ?? '').trim();
                    const fullName = [firstName, lastName].filter(Boolean).join(' ');

                    return (
                      <PeopleCard
                        key={member.userId}
                        avatarSrc={resolveProfileAvatarUrl(profile)}
                        avatarAlt={fullName}
                        name={fullName}
                        handle={username ? `@${username}` : 'Profile unavailable'}
                        owner={member.role === 'owner'}
                      />
                    );
                  })}
                </Box>
              </Box>
            </Box>
          </Box>

          <Modal
            open={isLeaveModalOpen}
            onClose={() => {
              setIsLeaveModalOpen(false);
              setLeaveErrorMessage('');
            }}
            title="Leave tribe"
            subtitle={`Type "${user?.user_metadata?.username ?? user?.username ?? ''}" to confirm.`}
            maxWidth="520px"
          >
            <Box gap="var(--dq-ui-space-lg)">
              <TextInput
                label="Confirmation"
                value={leaveConfirmInput}
                onChange={(event) => setLeaveConfirmInput(event.target.value)}
                placeholder="Type your handle to confirm"
                autoComplete="off"
                autoCapitalize="off"
                spellCheck={false}
              />

              {leaveErrorMessage ? (
                <Alert variant="error" title="Confirmation failed">
                  {leaveErrorMessage}
                </Alert>
              ) : null}

              <Box direction="row" justify="flex-end" wrap="wrap" gap="var(--dq-ui-space-sm)">
                <Button
                  onClick={() => {
                    setIsLeaveModalOpen(false);
                    setLeaveErrorMessage('');
                  }}
                >
                  Cancel
                </Button>
                <Button variant="danger" onClick={handleLeave} disabled={isBusy}>
                  Confirm leave
                </Button>
              </Box>
            </Box>
          </Modal>

          <Modal
            open={isQrModalOpen}
            onClose={() => {
              setIsQrModalOpen(false);
              setCopyFeedback('');
            }}
            title="Join this tribe"
            subtitle={getTribeDisplayName(tribe)}
            maxWidth="420px"
          >
            <Box align="center" justify="center" gap="var(--dq-ui-space-xl)" className="dq-tribe-view__qr-modal-content">
              {qrCodeUrl ? (
                <img
                  src={qrCodeUrl}
                  alt={`QR code to join ${getTribeDisplayName(tribe)}`}
                  className="dq-tribe-view__qr-code"
                />
              ) : null}

              {tribe.code ? (
                <Box
                  background="surface"
                  className="dq-tribe-view__invite-link"
                  gap="var(--dq-ui-space-sm)"
                >
                  <Box direction="row" align="center" justify="space-between" gap="var(--dq-ui-space-lg)">
                    <Box gap="var(--dq-ui-space-xs)">
                      <p className="dq-tribe-view__meta-label">Invite code</p>
                      <strong className="dq-tribe-view__invite-code-value">{tribe.code}</strong>
                    </Box>
                    <Button onClick={handleCopyInviteCode}>
                      Copy
                    </Button>
                  </Box>
                  {copyFeedback ? (
                    <p className="dq-tribe-view__copy-feedback">{copyFeedback}</p>
                  ) : null}
                </Box>
              ) : null}
            </Box>
          </Modal>
        </>
      )}
    </Box>
  );
};

export default TribePanel;
