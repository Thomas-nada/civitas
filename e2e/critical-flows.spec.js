const { test, expect } = require("@playwright/test");

// The server under test is hydrated from the committed seed, so the actions
// list always has rows and the first one opens a real detail page.

test("actions list opens an action detail page", async ({ page }) => {
  await page.goto("/actions");
  await expect(page.getByRole("heading", { name: "Governance actions" })).toBeVisible();

  const firstAction = page.locator(".c-table tbody tr").first().locator("a.p-actions__name");
  await expect(firstAction).toBeVisible();
  const name = (await firstAction.textContent())?.trim();

  await firstAction.click();
  await expect(page).toHaveURL(/\/actions\/gov_action/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(name.slice(0, 24));
  await expect(page.getByRole("tab", { name: /Votes/ })).toBeVisible();
});

test("action filters live in the URL and narrow the table", async ({ page }) => {
  await page.goto("/actions?status=Active");
  const rows = page.locator(".c-table tbody tr");
  await expect(rows.first()).toBeVisible();
  const statuses = await rows.locator("td[data-label='Status']").allTextContents();
  expect(statuses.length).toBeGreaterThan(0);
  for (const s of statuses) expect(s.trim()).toBe("Active");
});

test("DRep dashboard scores and links to a profile", async ({ page }) => {
  await page.goto("/dreps");
  await expect(page.getByRole("heading", { name: "DReps" })).toBeVisible();
  const firstRow = page.locator(".p-dash__table tbody tr").first();
  await expect(firstRow).toBeVisible();
  await expect(firstRow.locator("td[data-label='Score']")).toContainText(/\d/);
  await firstRow.click();
  await expect(page).toHaveURL(/\/dreps\/drep1/);
  await expect(page.getByRole("heading", { name: "Voting record" })).toBeVisible();
});

test("compact API serves the pages and revalidates with ETag", async ({ request }) => {
  const first = await request.get("/api/v1/actions");
  expect(first.status()).toBe(200);
  const etag = first.headers().etag;
  expect(etag).toBeTruthy();
  const body = await first.json();
  expect(body.actions.length).toBeGreaterThan(0);
  const again = await request.get("/api/v1/actions", { headers: { "if-none-match": etag } });
  expect(again.status()).toBe(304);
  const stats = await request.get("/api/v1/stats");
  expect((await stats.json()).stats.counts.proposals).toBe(body.actions.length);
});

test("bug report submit and admin transition API flow", async ({ request }) => {
  const createRes = await request.post("/api/bug-report", {
    data: {
      title: `E2E test bug ${Date.now()}`,
      description: "E2E verification bug report for submit and admin transitions.",
      page: "/actions",
      category: "other"
    }
  });
  expect(createRes.status(), "bug report submit should succeed").toBe(201);
  const created = await createRes.json();
  expect(created.ok).toBeTruthy();
  expect(created.id).toBeTruthy();

  const token = process.env.BUG_REPORTS_TOKEN || "e2e_bug_token";
  const approveRes = await request.post("/api/bug-reports/action", {
    headers: { "x-bug-admin-token": token },
    data: { id: created.id, action: "approve" }
  });
  expect(approveRes.status(), "approve action should succeed").toBe(200);
});

test("actions page remains usable on a phone", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile assertions only.");
  await page.goto("/actions");
  await expect(page.getByRole("heading", { name: "Governance actions" })).toBeVisible();
  // No horizontal overflow: the document is no wider than the viewport.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  const firstAction = page.locator(".c-table tbody tr").first().locator("a.p-actions__name");
  await expect(firstAction).toBeVisible();
  await firstAction.click();
  await expect(page).toHaveURL(/\/actions\/gov_action/);
  // The navigation drawer opens from the menu button.
  await page.goBack();
  await page.getByRole("button", { name: "Open navigation" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("theme toggle persists across reloads", async ({ page, isMobile }) => {
  test.skip(isMobile, "The theme toggle lives in the drawer on phones.");
  await page.goto("/actions");
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  await page.getByRole("button", { name: /switch to (light|dark) mode/i }).click();
  const after = await page.evaluate(() => document.documentElement.dataset.theme);
  expect(after).not.toBe(before);
  await page.reload();
  expect(await page.evaluate(() => document.documentElement.dataset.theme)).toBe(after);
});
