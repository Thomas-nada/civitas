const { test, expect } = require("@playwright/test");

const TX_ID = "ab".repeat(32);

test("renders a v5 survey by explicit transaction and survey index", async ({ page }) => {
  await page.route(`**/api/surveys/${TX_ID}/3`, async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        survey: {
          surveyTxId: TX_ID,
          surveyIndex: 3,
          slot: 1,
          blockTime: 1_700_000_000,
          details: {
            specVersion: 5,
            title: "CIP-179 v5 fixture",
            description: "A public survey rendered from native label-17 metadatum.",
            eligibleRoles: ["DRep", "Stakeholder", "Keyholder"],
            endEpoch: 9999,
            isTimelocked: false,
            questions: [
              { questionId: "q0", question: "Choose one", methodType: "urn:cardano:poll-method:single-choice:v2", options: ["A", "B"], required: true },
              { questionId: "q1", question: "Allocate points", methodType: "urn:cardano:poll-method:points-allocation:v1", options: ["A", "B"], budget: 100 },
              { questionId: "q2", question: "Rate all", methodType: "urn:cardano:poll-method:rating:v1", options: ["A", "B"], ratingScale: [1, 5], requireAll: true },
            ],
          },
        },
        responses: [],
        tally: {
          totalResponses: 1,
          uniqueCredentials: 1,
          totalWeight: 1,
          roleTallies: [],
          questionTallies: [
            { questionId: "q0", question: "Choose one", methodType: "urn:cardano:poll-method:single-choice:v2", responseCount: 1, abstainCount: 0, optionTallies: [{ option: "A", count: 1 }, { option: "B", count: 0 }] },
            { questionId: "q1", question: "Allocate points", methodType: "urn:cardano:poll-method:points-allocation:v1", responseCount: 1, abstainCount: 0, pointsTally: [{ option: "A", points: 100 }, { option: "B", points: 0 }] },
            { questionId: "q2", question: "Rate all", methodType: "urn:cardano:poll-method:rating:v1", responseCount: 1, abstainCount: 0, ratingTally: [{ option: "A", average: 5, count: 1 }, { option: "B", average: 4, count: 1 }] },
          ],
        },
        incomplete: false,
      }),
    });
  });

  await page.goto(`/surveys/${TX_ID}/3`);
  await expect(page.getByRole("heading", { name: "CIP-179 v5 fixture" })).toBeVisible();
  await expect(page.getByText("Keyholder", { exact: true })).toBeVisible();
  await expect(page.getByText("Choose one", { exact: true })).toBeVisible();
  await expect(page.getByText("Rate all", { exact: true })).toBeVisible();
});
