/**
 * Keyboard Navigation Utilities
 */

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  handler: (event: KeyboardEvent) => void;
  description?: string;
}

/**
 * Check if keyboard event matches shortcut
 */
export function matchesShortcut(event: KeyboardEvent, shortcut: KeyboardShortcut): boolean {
  const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
  const ctrlMatches = !!shortcut.ctrl === (event.ctrlKey || event.metaKey);
  const shiftMatches = !!shortcut.shift === event.shiftKey;
  const altMatches = !!shortcut.alt === event.altKey;

  return keyMatches && ctrlMatches && shiftMatches && altMatches;
}

/**
 * Register keyboard shortcuts
 */
export class KeyboardManager {
  private shortcuts: KeyboardShortcut[] = [];
  private isListening = false;

  /**
   * Add a keyboard shortcut
   */
  add(shortcut: KeyboardShortcut): void {
    this.shortcuts.push(shortcut);
  }

  /**
   * Remove a keyboard shortcut
   */
  remove(shortcut: KeyboardShortcut): void {
    const index = this.shortcuts.indexOf(shortcut);
    if (index > -1) {
      this.shortcuts.splice(index, 1);
    }
  }

  /**
   * Handle keyboard events
   */
  private handleKeydown = (event: KeyboardEvent): void => {
    for (const shortcut of this.shortcuts) {
      if (matchesShortcut(event, shortcut)) {
        event.preventDefault();
        shortcut.handler(event);
        return;
      }
    }
  };

  /**
   * Start listening for keyboard events
   */
  listen(): void {
    if (this.isListening) return;
    document.addEventListener('keydown', this.handleKeydown);
    this.isListening = true;
  }

  /**
   * Stop listening for keyboard events
   */
  stop(): void {
    if (!this.isListening) return;
    document.removeEventListener('keydown', this.handleKeydown);
    this.isListening = false;
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): KeyboardShortcut[] {
    return [...this.shortcuts];
  }
}

/**
 * Format shortcut for display (e.g., "Ctrl+Shift+M")
 */
export function formatShortcut(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  // Use Cmd on Mac, Ctrl elsewhere
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  if (shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.meta && !isMac) {
    parts.push('Meta');
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join('+');
}

/**
 * Check if an element should handle keyboard input
 */
export function isInputElement(element: Element): boolean {
  const tagName = element.tagName.toLowerCase();
  return (
    tagName === 'input' ||
    tagName === 'textarea' ||
    tagName === 'select' ||
    element.hasAttribute('contenteditable')
  );
}
