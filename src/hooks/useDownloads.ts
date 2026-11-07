import { useEffect, useState } from 'react';

export interface SaveRequest {
  filename: string;
  data: string | Blob;
}

interface DownloadsApi {
  save(request: SaveRequest): Promise<{ status: string }>;
}

declare global {
  interface Window {
    claude?: { use(name: string): Promise<unknown> };
  }
}

export type SaveOutcome = 'saved' | 'declined' | 'failed';

/** A plain browser download, for when the app runs outside the artifact host. */
function browserSave(filename: string, data: string): SaveOutcome {
  try {
    const type = filename.endsWith('.json') ? 'application/json' : 'text/csv';
    const url = URL.createObjectURL(new Blob([data], { type: `${type};charset=utf-8` }));
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Revoking straight away can cancel the download in some browsers.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return 'saved';
  } catch {
    return 'failed';
  }
}

/**
 * A published page cannot start a download itself; the host asks the viewer
 * and writes the file. Outside that host there is no such API, so the
 * browser's own download takes over.
 */
export function useDownloads() {
  const [api, setApi] = useState<DownloadsApi | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let live = true;

    if (!window.claude?.use) {
      setChecked(true);
      return;
    }

    window.claude
      .use('downloads')
      .then((resolved) => {
        if (!live) return;
        setApi((resolved as DownloadsApi | null) ?? null);
      })
      .catch(() => undefined)
      .finally(() => {
        if (live) setChecked(true);
      });

    return () => {
      live = false;
    };
  }, []);

  async function save(filename: string, data: string): Promise<SaveOutcome> {
    if (!api) return browserSave(filename, data);
    try {
      await api.save({ filename, data });
      return 'saved';
    } catch (error) {
      // Saying no is a normal answer, not a failure worth reporting.
      const code = (error as { code?: string } | null)?.code;
      return code === 'declined' ? 'declined' : 'failed';
    }
  }

  // Wait for the host check, so a quick click never bypasses the host's prompt.
  return { available: checked, save };
}
