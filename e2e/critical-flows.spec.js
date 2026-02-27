const { test, expect } = require("@playwright/test");

test("actions list rows expand and collapse inline", async ({ page }) => {
  await page.goto("/actions");

  const actionRows = page.locator("table.mobile-cards-table tbody tr[role='button']");
  await expect(actionRows.first()).toBeVisible();

  const firstRow = actionRows.first();
  await firstRow.click();
  await expect(page.locator("tr.action-expanded-row")).toHaveCount(1);

  await page.locator("h1").click();
  await expect(page.locator("tr.action-expanded-row")).toHaveCount(0);
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

test("actions page remains usable on mobile viewport", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Mobile assertions only.");
  await page.goto("/actions");

  await expect(page.getByRole("heading", { name: "Governance Action Explorer" })).toBeVisible();
  const actionRows = page.locator("table.mobile-cards-table tbody tr[role='button']");
  await expect(actionRows.first()).toBeVisible();

  await actionRows.first().click();
  await expect(page.locator("tr.action-expanded-row")).toHaveCount(1);
});
