import { randomUUID } from 'node:crypto';
import { test, expect, type Page } from '@playwright/test';

const password = 'browser-test-member-password';
async function register(page: Page) {
  const email = `member-${randomUUID()}@example.com`;
  await page.goto('/register');
  await page.getByLabel('Full name').fill('Browser Test Member');
  await page.getByLabel('Email address').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(password);
  await page
    .getByRole('button', { name: 'Create account', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back, Browser.' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
  return email;
}
async function loginAdmin(page: Page) {
  await page.goto('/login');
  await page.getByLabel('Email address').fill('admin.e2e@example.com');
  await page
    .getByLabel('Password', { exact: true })
    .fill('browser-test-admin-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Welcome back, Browser.' }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
}
async function create(page: Page, title: string) {
  await page.goto('/requests/new');
  await page.getByLabel(/Request title/).fill(title);
  await page
    .getByLabel(/^Description/)
    .fill('The network connection drops every time I open the billing page.');
  await page.getByLabel(/^Category/).selectOption('TECHNICAL');
  await page.getByLabel(/^Priority/).selectOption('HIGH');
  await page
    .getByRole('button', { name: 'Submit request', exact: true })
    .click();
  await expect(page).toHaveURL(/\/requests\/[a-f0-9-]{36}$/);
  await expect(
    page.getByRole('heading', { name: title, exact: true }),
  ).toBeVisible();
  return new URL(page.url()).pathname;
}

test('public home presents the product and supports mobile navigation', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: /Every request/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Three steps. A clearer path.' }),
  ).toBeVisible();
  await page.screenshot({
    path: 'test-results/home-desktop.png',
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page
    .getByRole('button', { name: 'Open main navigation', exact: true })
    .click();
  await page
    .getByRole('navigation', { name: 'Main navigation', exact: true })
    .getByRole('link', { name: 'About', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: /Less back-and-forth/ }),
  ).toBeInViewport();
  await expect(
    page.getByRole('button', { name: 'Open main navigation', exact: true }),
  ).toHaveAttribute('aria-expanded', 'false');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.goto('/');
  await page.screenshot({
    path: 'test-results/home-mobile.png',
    fullPage: true,
  });
  await page
    .getByRole('link', { name: 'Get started', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/register$/);
});

test('member creates and edits; admin progresses and resolves the same stored request', async ({
  page,
  browser,
  baseURL,
}) => {
  await register(page);
  const title = `Network access ${randomUUID().slice(0, 8)}`;
  const path = await create(page, title);
  await page.getByRole('link', { name: 'Edit request', exact: true }).click();
  await page.getByLabel(/Request title/).fill(`${title} updated`);
  await page.getByRole('button', { name: 'Save changes', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: `${title} updated`, exact: true }),
  ).toBeVisible();

  const context = await browser.newContext({ baseURL });
  const admin = await context.newPage();
  try {
    await loginAdmin(admin);
    await admin.goto(path);
    await admin
      .getByRole('button', { name: 'Mark as In Progress', exact: true })
      .click();
    await admin.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(
      admin.getByRole('button', { name: 'Mark as Resolved', exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: `${title} updated`, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: 'Edit request', exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Cancel request', exact: true }),
    ).toHaveCount(0);
    await admin
      .getByRole('button', { name: 'Mark as Resolved', exact: true })
      .click();
    await admin.getByRole('button', { name: 'Confirm', exact: true }).click();
    await expect(
      admin.getByText(
        'This request is resolved and no longer accepts changes.',
      ),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText('This request is resolved and no longer accepts changes.'),
    ).toBeVisible();
    await page.goto('/dashboard');
    await expect(
      page.getByRole('link', { name: `${title} updated`, exact: true }),
    ).toBeVisible();
    await page.screenshot({
      path: 'test-results/dashboard.png',
      fullPage: true,
    });
  } finally {
    await context.close();
  }
});

test('member cancellation, filtering, profile and logout work end to end', async ({
  page,
}) => {
  const email = await register(page);
  const title = `Cancel request ${randomUUID().slice(0, 8)}`;
  await create(page, title);
  await page
    .getByRole('button', { name: 'Cancel request', exact: true })
    .click();
  await page.getByRole('button', { name: 'Confirm', exact: true }).click();
  await expect(
    page.getByText('This request is cancelled and no longer accepts changes.'),
  ).toBeVisible();
  await page.goto('/requests');
  await page.getByRole('textbox', { name: 'Search requests' }).fill(title);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  await page
    .getByRole('combobox', { name: 'status', exact: true })
    .selectOption('CANCELLED');
  await expect(
    page.getByRole('link', { name: title, exact: true }),
  ).toBeVisible();
  await page.goto('/profile');
  await expect(
    page.getByRole('heading', { name: 'My profile', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(email, { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: /Browser Test Member/ }).click();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/requests');
  await expect(page).toHaveURL(/\/login$/);
});

test('admin searches members and updates a display name', async ({
  page,
  browser,
  baseURL,
}) => {
  const email = await register(page);
  const context = await browser.newContext({ baseURL });
  const admin = await context.newPage();
  try {
    await loginAdmin(admin);
    await admin.goto('/users');
    await admin.getByRole('textbox', { name: 'Search users' }).fill(email);
    const filteredUsers = admin.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/users' &&
        new URL(response.url()).searchParams.get('search') === email &&
        response.status() === 200,
    );
    await admin.getByRole('button', { name: 'Search', exact: true }).click();
    await filteredUsers;
    await expect(admin.getByRole('row')).toHaveCount(2);
    await admin
      .getByRole('link', { name: 'Browser Test Member', exact: true })
      .click();
    await admin.getByLabel('Display name').fill('Updated Browser Member');
    await admin
      .getByRole('button', { name: 'Save changes', exact: true })
      .click();
    await expect(
      admin.getByRole('heading', {
        name: 'Updated Browser Member',
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByRole('heading', { name: 'Welcome back, Updated.' }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});

test('mobile navigation stays usable without page overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await register(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page
    .getByRole('button', { name: 'Open navigation', exact: true })
    .click();
  await page.getByRole('link', { name: 'My requests', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'My requests', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Close navigation', exact: true }),
  ).not.toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: 'test-results/mobile-requests.png',
    fullPage: true,
  });
});
