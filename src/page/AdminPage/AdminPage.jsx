import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckIcon,
  DownloadSimpleIcon,
  TrashIcon,
} from '@phosphor-icons/react';
import Alert from '@/components/Alert';
import Box from '@/components/layout/Box';
import Modal from '@/components/layout/Modal';
import Badge from '@/components/primitives/Badge';
import Button from '@/components/primitives/Button';
import { FileInput } from '@/components/primitives/forms';
import {
  activateLineupVersion,
  deleteLineupVersion,
  getStablePayloadHash,
  isSupabaseConfigured,
  loadAdminLineupVersions,
  loadLineupVersion,
} from '@/lib/supabase';
import { activeSite } from '@/sites/siteDefinitions';
import './AdminPage.css';

const readJsonFile = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();

  reader.onload = () => {
    try {
      resolve(JSON.parse(String(reader.result ?? '')));
    } catch {
      reject(new Error('The selected file is not valid JSON.'));
    }
  };
  reader.onerror = () => reject(new Error('Could not read the selected file.'));
  reader.readAsText(file);
});

const formatDateTime = (value) => {
  if (!value) {
    return 'Never';
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
};

const formatLineupStatus = (status) => {
  if (status === 'active') {
    return 'Active';
  }

  if (status === 'pending') {
    return 'Pending';
  }

  return 'Archived';
};

const getLineupTitle = (lineup) => (
  lineup.payload?.updatedAt ||
  lineup.sourceUpdatedAt ||
  lineup.activatedAt ||
  lineup.importedAt ||
  lineup.createdAt
);

const getLineupHashLabel = (lineup) => lineup.payloadHash.slice(0, 12);

const downloadJson = ({ fileName, payload }) => {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
};

const AdminPage = ({ isAdmin = false, onLineupsChanged = null }) => {
  const [lineups, setLineups] = useState([]);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [pendingLineup, setPendingLineup] = useState(null);
  const [lineupToDelete, setLineupToDelete] = useState(null);

  const lineupsByHash = useMemo(
    () => new Map(lineups.map((lineup) => [lineup.payloadHash, lineup])),
    [lineups]
  );

  const refreshAdminData = useCallback(async () => {
    if (!isSupabaseConfigured() || !isAdmin) {
      return;
    }

    const nextLineups = await loadAdminLineupVersions(activeSite.slug);
    setLineups(nextLineups);
  }, [isAdmin]);

  useEffect(() => {
    refreshAdminData().catch((error) => {
      setErrorMessage(error.message || 'Could not load admin data.');
    });
  }, [refreshAdminData]);

  const handleManualFilesChange = async (files) => {
    const file = files?.[0];

    if (!file) {
      return;
    }

    setIsBusy(true);
    setErrorMessage('');

    try {
      const payload = await readJsonFile(file);
      const payloadHash = await getStablePayloadHash(payload);
      const existingLineup = lineupsByHash.get(payloadHash);

      if (existingLineup) {
        setErrorMessage(
          `This JSON is already loaded as ${formatLineupStatus(existingLineup.status).toLowerCase()} lineup "${getLineupTitle(existingLineup)}".`
        );
        return;
      }

      setPendingLineup({
        payload,
        payloadHash,
        sourceKind: 'manual',
        versionLabel: payload?.eventEditionName ?? activeSite.name ?? null,
        detectedChanges: {
          mode: 'manual',
          fileName: file.name,
        },
      });
    } catch (error) {
      setErrorMessage(error.message || 'Could not prepare this lineup.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleLoadPendingLineup = async () => {
    if (!pendingLineup) {
      return;
    }

    setIsBusy(true);
    setErrorMessage('');

    try {
      await loadLineupVersion({
        siteSlug: activeSite.slug,
        ...pendingLineup,
      });
      setPendingLineup(null);
      await refreshAdminData();
      await onLineupsChanged?.();
    } catch (error) {
      setErrorMessage(error.message || 'Could not load this lineup.');
    } finally {
      setIsBusy(false);
    }
  };

  const handlePublishLineup = async (lineupId) => {
    setIsBusy(true);
    setErrorMessage('');

    try {
      await activateLineupVersion(lineupId);
      await refreshAdminData();
      await onLineupsChanged?.();
    } catch (error) {
      setErrorMessage(error.message || 'Could not publish this lineup.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteLineup = async () => {
    if (!lineupToDelete) {
      return;
    }

    setIsBusy(true);
    setErrorMessage('');

    try {
      await deleteLineupVersion(lineupToDelete.id);
      setLineupToDelete(null);
      await refreshAdminData();
      await onLineupsChanged?.();
    } catch (error) {
      setErrorMessage(error.message || 'Could not delete this lineup.');
    } finally {
      setIsBusy(false);
    }
  };

  if (!isAdmin) {
    return (
      <Alert variant="warning" title="Admin access required">
        This area is reserved for project admins.
      </Alert>
    );
  }

  return (
    <Box className="dq-admin-page" gap="var(--dq-ui-space-xl)">
      {errorMessage ? (
        <Alert variant="error" title="Admin action failed">
          {errorMessage}
        </Alert>
      ) : null}

      <Box background="surface" title="Available lineups">
        <Box gap="var(--dq-ui-space-sm)">
          {lineups.length === 0 ? (
            <p className="dq-admin-page__muted">No Supabase lineup has been loaded yet.</p>
          ) : lineups.map((lineup) => (
            <Box
              key={lineup.id}
              className="dq-admin-page__lineup-row"
              direction="row"
              align="center"
              justify="space-between"
              wrap="wrap"
              gap="var(--dq-ui-space-sm)"
            >
              <Box gap="var(--dq-ui-space-xs)">
                <Box direction="row" align="center" wrap="wrap" gap="var(--dq-ui-space-sm)">
                  <strong className="dq-admin-page__lineup-title">
                    {formatDateTime(getLineupTitle(lineup))}
                  </strong>
                  <Badge
                    size="sm"
                    variant="plain"
                    textColor={
                      lineup.status === 'active'
                        ? 'var(--dq-ui-color-black)'
                        : lineup.status === 'pending'
                          ? 'var(--dq-ui-color-black)'
                          : undefined
                    }
                    backgroundColor={
                      lineup.status === 'active'
                        ? 'var(--dq-ui-success)'
                        : lineup.status === 'pending'
                          ? 'var(--dq-ui-warning)'
                          : undefined
                    }
                  >
                    {formatLineupStatus(lineup.status)}
                  </Badge>
                </Box>
                <span className="dq-admin-page__lineup-hash">
                  {getLineupHashLabel(lineup)}
                </span>
              </Box>
              <Box direction="row" wrap="wrap" gap="var(--dq-ui-space-sm)">
                {lineup.status === 'pending' ? (
                  <Button
                    icon={CheckIcon}
                    variant="ghost"
                    onClick={() => handlePublishLineup(lineup.id)}
                    disabled={isBusy}
                  >
                    Publish
                  </Button>
                ) : null}
                <Button
                  icon={DownloadSimpleIcon}
                  variant="ghost"
                  onClick={() => downloadJson({
                  fileName: `${activeSite.slug}-${getLineupHashLabel(lineup)}.json`,
                    payload: lineup.payload,
                  })}
                  disabled={isBusy}
                >
                  Export
                </Button>
                <Button
                  icon={TrashIcon}
                  variant="danger"
                  onClick={() => setLineupToDelete(lineup)}
                  disabled={isBusy}
                >
                  Delete
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Box background="surface" title="Manual JSON import">
        <FileInput
          label="Lineup JSON"
          description="Fallback path when the server worker is unavailable. The imported lineup is added as pending."
          buttonLabel="Choose lineup JSON"
          accept="application/json,.json"
          disabled={isBusy}
          onFilesChange={handleManualFilesChange}
        />
      </Box>

      <Modal
        open={Boolean(pendingLineup)}
        onClose={() => setPendingLineup(null)}
        title="Load new lineup?"
        subtitle={pendingLineup ? `Hash ${pendingLineup.payloadHash.slice(0, 12)}` : ''}
        controls={(
          <>
            <Button variant="ghost" onClick={() => setPendingLineup(null)} disabled={isBusy}>
              Cancel
            </Button>
            <Button onClick={handleLoadPendingLineup} disabled={isBusy}>
              Add pending lineup
            </Button>
          </>
        )}
      >
        <Box gap="var(--dq-ui-space-sm)">
          <p className="dq-admin-page__muted">
            This will load the JSON as a pending lineup. It stays admin-only until you publish it.
          </p>
          <pre className="dq-admin-page__changes-preview">
            {JSON.stringify(pendingLineup?.detectedChanges ?? {}, null, 2)}
          </pre>
        </Box>
      </Modal>

      <Modal
        open={Boolean(lineupToDelete)}
        onClose={() => setLineupToDelete(null)}
        title="Delete lineup?"
        subtitle={lineupToDelete ? `${formatDateTime(getLineupTitle(lineupToDelete))} - ${getLineupHashLabel(lineupToDelete)}` : ''}
        controls={(
          <>
            <Button variant="ghost" onClick={() => setLineupToDelete(null)} disabled={isBusy}>
              Cancel
            </Button>
            <Button variant="danger" icon={TrashIcon} onClick={handleDeleteLineup} disabled={isBusy}>
              Delete lineup
            </Button>
          </>
        )}
      >
        <p className="dq-admin-page__muted">
          {lineupToDelete?.status === 'active'
            ? 'This removes the currently published lineup from Supabase.'
            : 'This removes the selected lineup from Supabase.'}
        </p>
      </Modal>
    </Box>
  );
};

export default AdminPage;
