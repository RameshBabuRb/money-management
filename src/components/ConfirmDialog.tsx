import { useEffect, useRef } from 'react';

export interface Confirmation {
  title: string;
  body: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
}

interface ConfirmDialogProps {
  request: Confirmation | null;
  onClose: () => void;
}

/**
 * One dialog for every yes/no question, so deleting an expense, deleting a
 * friend entry and replacing everything with a backup all behave the same.
 */
export function ConfirmDialog({ request, onClose }: ConfirmDialogProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;

    if (!request) {
      if (dialog?.open) dialog.close();
      return;
    }

    // Safari before 15.4 has no <dialog>. Still ask, just plainly.
    if (!dialog || typeof dialog.showModal !== 'function') {
      const accepted = window.confirm(`${request.title}\n\n${request.body}`);
      onClose();
      if (accepted) request.onConfirm();
      return;
    }

    if (!dialog.open) dialog.showModal();
  }, [request, onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="confirm-title"
      // Covers Escape as well as the buttons.
      onClose={onClose}
      onCancel={onClose}
    >
      <h2 id="confirm-title">{request?.title ?? ''}</h2>
      <p className="dialog__body">{request?.body ?? ''}</p>
      <div className="dialog__actions">
        <button type="button" className="btn btn--quiet" onClick={onClose}>
          {request?.cancelLabel ?? 'Cancel'}
        </button>
        <button
          type="button"
          className="btn btn--danger"
          onClick={() => {
            const act = request?.onConfirm;
            onClose();
            act?.();
          }}
        >
          {request?.confirmLabel ?? 'Confirm'}
        </button>
      </div>
    </dialog>
  );
}
