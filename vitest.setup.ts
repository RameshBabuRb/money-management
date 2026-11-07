import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Testing Library only auto-cleans with Vitest globals on; they are off here.
afterEach(cleanup);

// jsdom has no <dialog>; stand one in so tests take the same path a real
// browser does rather than the plain-confirm fallback.
const proto = window.HTMLDialogElement?.prototype;
if (proto && typeof proto.showModal !== 'function') {
  proto.showModal = function showModal(this: HTMLDialogElement) {
    this.setAttribute('open', '');
  };
  proto.close = function close(this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  };
}
