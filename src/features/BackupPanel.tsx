import { useRef, useState } from 'react';
import type { Confirmation } from '@/components/ConfirmDialog';
import { backupJson, expensesCsv, friendsCsv } from '@/lib/csv';
import { todayIso } from '@/lib/dates';
import { coerceData } from '@/store/storage';
import { useStore } from '@/store/StoreContext';
import { useDownloads } from '@/hooks/useDownloads';

export function BackupPanel({ ask }: { ask: (request: Confirmation) => void }) {
  const { data, dispatch } = useStore();
  const { available, save } = useDownloads();
  const [note, setNote] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);

  async function offer(filename: string, contents: string) {
    setNote('');
    const outcome = await save(filename, contents);
    // Saying no is a normal answer, not a failure worth reporting.
    if (outcome === 'saved') setNote('Saved.');
    if (outcome === 'failed') setNote('That file could not be saved.');
  }

  function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Let the same file be picked again if the restore is cancelled.
    event.target.value = '';
    setNote('');
    if (!file) return;

    const reader = new FileReader();
    reader.onerror = () => setNote('That file could not be read.');
    reader.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        setNote('That is not a backup file.');
        return;
      }

      // Accept both the wrapped export and a bare state object.
      const wrapper = parsed as { data?: unknown } | null;
      const incoming = coerceData(wrapper?.data ?? parsed);
      if (!incoming) {
        setNote('That is not a backup file.');
        return;
      }

      ask({
        title: 'Restore this backup?',
        body: `It replaces everything on this device with ${incoming.expenses.length} expenses and ${incoming.loans.length} friend entries.`,
        confirmLabel: 'Restore',
        cancelLabel: 'Cancel',
        onConfirm: () => {
          dispatch({ type: 'data/replaced', data: incoming });
          setNote('Restored.');
        },
      });
    };
    reader.readAsText(file);
  }

  return (
    <details>
      <summary>Backup and restore</summary>

      {available && (
        <>
          <div className="field">
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => offer(`money-backup-${todayIso()}.json`, backupJson(data))}
            >
              Download backup (.json)
            </button>
          </div>
          <div className="field">
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => offer(`expenses-${todayIso()}.csv`, expensesCsv(data))}
            >
              Download expenses (.csv)
            </button>
          </div>
          <div className="field">
            <button
              type="button"
              className="btn btn--quiet"
              onClick={() => offer(`friends-${todayIso()}.csv`, friendsCsv(data))}
            >
              Download friends (.csv)
            </button>
          </div>
        </>
      )}

      <div className="field">
        <label className="field__label" htmlFor="restore-file">
          Restore from a backup file
        </label>
        <input
          id="restore-file"
          ref={fileInput}
          className="input"
          type="file"
          accept=".json,application/json"
          onChange={onFileChosen}
        />
      </div>

      {note && <p className="empty">{note}</p>}
      <p className="empty">
        The .json file is the real backup — it restores everything. The .csv files are for reading
        in Excel, and cannot be restored from.
      </p>
    </details>
  );
}
