import { expect, test } from "@playwright/test";

test("welcome screen shows on first visit, then never again", async ({
  page,
}) => {
  await page.goto("/");

  const welcome = page.getByRole("dialog", {
    name: "Welcome to Workbrook Memory",
  });
  await expect(welcome).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Welcome to Workbrook Memory" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Get started" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Get started" }).click();
  await expect(welcome).toHaveCount(0);

  // Reload — the flag persists, welcome stays gone.
  await page.reload();
  await expect(
    page.getByRole("dialog", { name: "Welcome to Workbrook Memory" })
  ).toHaveCount(0);
});
