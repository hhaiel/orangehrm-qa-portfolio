import type { Locator, Page } from '@playwright/test';

/** The left main menu and the module's top menu (e.g. Apply / My Leave / Entitlements …). */
export class Navigation {
  constructor(private readonly page: Page) {}

  mainMenuItems(): Locator {
    return this.page.locator('.oxd-main-menu-item');
  }

  topMenuItems(): Locator {
    return this.page.locator('.oxd-topbar-body-nav-tab');
  }

  /** The "Credential Required" message OrangeHRM shows when a role can't open a page. */
  accessDenied(): Locator {
    return this.page.getByText('Credential Required');
  }
}
