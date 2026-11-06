import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("home page renders heading, CTAs and search", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: "Record who helped you land work.",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Someone helped me/ }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /I helped someone/ }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("searchbox", { name: /search work memories/i })
    ).toBeVisible();
  });

  test("memories page renders filters and empty state", async ({ page }) => {
    await page.goto("/memories");
    await expect(
      page.getByRole("heading", { name: "Memories" })
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Filter by type" })
    ).toBeVisible();
    await expect(
      page.getByRole("group", { name: "Filter by status" })
    ).toBeVisible();
  });

  test("type filter updates URL and highlights selection", async ({
    page,
  }) => {
    await page.goto("/memories");
    await page.getByRole("link", { name: "Helped me" }).click();
    await expect(page).toHaveURL(/type=someone_helped_me/);
    const active = page.getByRole("link", { name: "Helped me" });
    await expect(active).toHaveClass(/bg-brand/);
    await expect(
      page.getByRole("link", { name: "I helped" })
    ).not.toHaveClass(/bg-brand/);
  });

  test("status filter updates URL", async ({ page }) => {
    await page.goto("/memories");
    await page.getByRole("link", { name: "Confirmed", exact: true }).click();
    await expect(page).toHaveURL(/status=confirmed/);
  });

  test("search with no matches shows friendly empty state", async ({
    page,
  }) => {
    await page.goto("/memories?q=zzz-no-such-memory-12345");
    await expect(page.getByText(/No memories match/)).toBeVisible();
  });

  test("privacy page lists privacy points", async ({ page }) => {
    await page.goto("/privacy");
    await expect(
      page.getByRole("heading", { name: "Privacy" })
    ).toBeVisible();
    await expect(page.getByText("Consent first")).toBeVisible();
    await expect(page.getByText("No accounts, no passwords")).toBeVisible();
  });

  test("unknown route shows the not-found page", async ({ page }) => {
    const res = await page.goto("/definitely-not-a-page");
    expect(res?.status()).toBe(404);
  });
});

test.describe("add memory flow", () => {
  test("year is required — empty submit shows an accessible error", async ({
    page,
  }) => {
    await page.goto("/add");
    await page.getByRole("button", { name: "Save memory" }).click();
    await expect(page.getByRole("alert").first()).toBeVisible();
  });

  test("create → manage link → delete cleans up after itself", async ({
    page,
  }) => {
    await page.goto("/add");

    // Only the year is required; "Only me" is the default visibility.
    await page.locator("#year").fill("2019");
    await page.locator("#jobTitle").fill("Electrician (e2e)");
    await page.getByRole("button", { name: "Save memory" }).click();

    // The saved dialog shows the one-time manage link.
    const linkInput = page.locator('input[readonly][class*="font-mono"]');
    await expect(linkInput).toBeVisible({ timeout: 15_000 });
    const manageUrl = await linkInput.inputValue();
    expect(manageUrl).toContain("/manage/");

    // The manage page loads the entry and can delete it.
    await page.goto(manageUrl);
    await expect(page.getByText(/Electrician \(e2e\)/)).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole("button", { name: "Delete entry" }).click();
    await page.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page).toHaveURL(/\/my-entries/);
  });
});
