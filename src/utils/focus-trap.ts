/**
 * Focus Trap Utility for Modal Accessibility
 * Ensures keyboard focus stays within a modal/overlay when open
 */

export class FocusTrap {
  private container: HTMLElement;
  private previouslyFocused: HTMLElement | null = null;
  private isActive = false;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Get all focusable elements within container
   */
  private getFocusableElements(): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'textarea:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
    ].join(',');

    const elements = Array.from(
      this.container.querySelectorAll<HTMLElement>(focusableSelectors)
    );

    return elements.filter(
      (el) => !el.hasAttribute('disabled') && el.offsetParent !== null
    );
  }

  /**
   * Handle Tab key navigation
   */
  private handleTab = (e: KeyboardEvent): void => {
    if (!this.isActive || e.key !== 'Tab') return;

    const focusableElements = this.getFocusableElements();
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (!firstElement || !lastElement) return;

    // Shift+Tab on first element -> focus last
    if (e.shiftKey && document.activeElement === firstElement) {
      e.preventDefault();
      lastElement.focus();
      return;
    }

    // Tab on last element -> focus first
    if (!e.shiftKey && document.activeElement === lastElement) {
      e.preventDefault();
      firstElement.focus();
    }
  };

  /**
   * Activate focus trap
   */
  activate(): void {
    if (this.isActive) return;

    // Store currently focused element
    this.previouslyFocused = document.activeElement as HTMLElement;

    // Focus first focusable element
    const focusableElements = this.getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Add event listener
    document.addEventListener('keydown', this.handleTab);
    this.isActive = true;
  }

  /**
   * Deactivate focus trap
   */
  deactivate(): void {
    if (!this.isActive) return;

    // Remove event listener
    document.removeEventListener('keydown', this.handleTab);

    // Restore focus to previously focused element
    if (this.previouslyFocused && typeof this.previouslyFocused.focus === 'function') {
      this.previouslyFocused.focus();
    }

    this.isActive = false;
  }

  /**
   * Check if focus trap is active
   */
  isActivated(): boolean {
    return this.isActive;
  }
}

/**
 * Create and manage a focus trap for an element
 */
export function createFocusTrap(element: HTMLElement): FocusTrap {
  return new FocusTrap(element);
}
