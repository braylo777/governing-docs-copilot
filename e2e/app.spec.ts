import { test, expect } from "@playwright/test";

test("answers with a citation, and RLS hides the other tenant", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("ask")).toHaveText("Ask", { timeout: 60_000 });
  await page.getByPlaceholder("e.g. How tall can my fence be?").fill("How tall can my fence be?");
  await page.getByTestId("ask").click();
  const a = page.getByTestId("answer");
  await expect(a).toContainText("6 feet");
  await expect(a).toContainText("[1] Oak Hollow CC&Rs");
  await page.getByTestId("leak").click();
  await expect(page.getByTestId("leak-result")).toContainText("· 0 other-tenant chunks visible");
  await page.selectOption("#tenant", "lakeside-commons");
  await page.getByPlaceholder("e.g. How tall can my fence be?").fill("How tall can my fence be?");
  await page.getByTestId("ask").click();
  await expect(page.getByTestId("answer")).not.toContainText("Oak Hollow");
});

test("an uploaded document is answerable only inside its tenant", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("ask")).toHaveText("Ask", { timeout: 60_000 });
  await page.setInputFiles('input[type="file"]', { name: "Grill Policy.txt", mimeType: "text/plain", buffer: Buffer.from("Section 1 Grills\nCharcoal grills are prohibited on balconies.") });
  await expect(page.getByText(/Added "Grill Policy.txt"/)).toBeVisible();
  await page.getByPlaceholder("e.g. How tall can my fence be?").fill("Are charcoal grills allowed on balconies?");
  await page.getByTestId("ask").click();
  await expect(page.getByTestId("answer")).toContainText("Charcoal grills are prohibited");
  await page.selectOption("#tenant", "lakeside-commons");
  await page.getByPlaceholder("e.g. How tall can my fence be?").fill("Are charcoal grills allowed on balconies?");
  await page.getByTestId("ask").click();
  await expect(page.getByTestId("answer")).not.toContainText("Charcoal grills are prohibited");
});
