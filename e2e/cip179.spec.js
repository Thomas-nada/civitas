const { test, expect } = require("@playwright/test");

const TX_ID = "ab".repeat(32);

// The survey page renders from /api/surveys/<tx>/<index>, the shape
// lib/surveys.js produces from a Tessera bundle: the survey summary, its
// responses and the informational tally.
test("renders a CIP-179 survey by transaction and survey index", async ({ page }) => {
  await page.route(`**/api/surveys/${TX_ID}/3`, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        network: "mainnet",
        currentEpoch: 700,
        tip: { epoch: 700, slot: 1, time: 1_700_000_000, epochSlot: 1, govActionLifetime: 6 },
        fetchedAt: 1_700_000_000,
        survey: {
          key: `${TX_ID}:3`,
          txHash: TX_ID,
          index: 3,
          slot: 1,
          epochNo: 690,
          submittedAt: 1_700_000_000,
          title: "CIP-179 fixture",
          description: "A public survey rendered from a Tessera bundle.",
          eligibleRoles: ["DRep", "Stakeholder", "Keyholder"],
          endEpoch: 9999,
          sealed: false,
          sealedUnsupported: false,
          external: false,
          talliable: true,
          cancelled: false,
          lifecycle: "open",
          lifecycleLabel: "Open",
          finalState: null,
          countedByRole: { DRep: 1 },
          responseCount: 1,
          govLinks: [],
          questions: [
            { index: 0, prompt: "Choose one", required: true, kind: "singleChoice", kindLabel: "Single choice", options: ["A", "B"], externalOptions: false },
            { index: 1, prompt: "Rate all", required: false, kind: "rating", kindLabel: "Rate every option", options: ["A", "B"], externalOptions: false, requireAll: true, scaleMin: "1", scaleMax: "5" },
          ],
          owner: { type: "key", hash: "11".repeat(28) },
          sealedRound: null,
          contentAnchor: null,
          tesseraUrl: null,
          record: null,
        },
        responses: [],
        tally: {
          weightedSource: "live",
          headcountSource: "audit",
          powerEpoch: 699,
          questions: {
            headcount: [
              { kind: "options", unit: "singleChoice", options: [{ index: 0, weight: "1", count: 1 }, { index: 1, weight: "0", count: 0 }], answeredCount: 1, answeredWeight: "1" },
              { kind: "perOption", unit: "rating", perOption: [{ index: 0, weightedSum: "5", answeredWeight: "1", count: 1 }, { index: 1, weightedSum: "4", answeredWeight: "1", count: 1 }], answeredCount: 1, answeredWeight: "1" },
            ],
            weighted: [
              { kind: "options", unit: "singleChoice", options: [{ index: 0, weight: "1000000", count: 1 }, { index: 1, weight: "0", count: 0 }], answeredCount: 1, answeredWeight: "1000000" },
              { kind: "perOption", unit: "rating", perOption: [{ index: 0, weightedSum: "5000000", answeredWeight: "1000000", count: 1 }, { index: 1, weightedSum: "4000000", answeredWeight: "1000000", count: 1 }], answeredCount: 1, answeredWeight: "1000000" },
            ],
          },
          counted: 1,
          matchedCount: 1,
          answeredPower: "1000000",
          totalPower: "10000000",
          excluded: 0,
          excludedBy: {},
          roleCounts: { DRep: 1 },
        },
        tallyRefusal: null,
        artifact: null,
      }),
    });
  });

  await page.goto(`/surveys/${TX_ID}/3`);
  await expect(page.getByRole("heading", { name: "CIP-179 fixture" })).toBeVisible();
  await expect(page.getByText("Keyholder", { exact: true })).toBeVisible();
  await expect(page.getByText("Choose one", { exact: true })).toBeVisible();
  await expect(page.getByText("Rate all", { exact: true })).toBeVisible();
  await expect(page.getByText("Informational tally")).toBeVisible();
  await expect(page.getByText("1 DRep response counted", { exact: true })).toBeVisible();
});
