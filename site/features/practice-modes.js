/** Delegated navigation survives replacement of the bank's innerHTML. */
const ALLOWED_MODES = new Set(['generator','bank']);

/**
 * @param {HTMLElement} root Stable page content container.
 * @param {(mode: 'generator'|'bank') => void} onChange Navigation callback.
 * @returns {() => void} Unsubscribe function.
 */
export function bindPracticeModes(root, onChange) {
  if (!root?.addEventListener || typeof onChange !== 'function') throw new TypeError('Expected a container and callback');
  const onClick = (event) => {
    const button = event.target?.closest?.('[data-practice-mode]');
    if (!button || !root.contains(button)) return;
    const mode = button.dataset.practiceMode;
    if (ALLOWED_MODES.has(mode)) onChange(mode);
  };
  root.addEventListener('click', onClick);
  return () => root.removeEventListener('click', onClick);
}