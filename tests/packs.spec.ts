import { test, expect } from "@playwright/test";

test("one vote reveals purchase actions and persists the unlocked pack", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: "Packs", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Hack a pack." }),
  ).toBeVisible();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await expect(page.getByRole("button", { name: "Purchase pack" })).toHaveCount(
    0,
  );
  await page.getByRole("button", { name: "Vote to unlock" }).click();
  await expect(
    page.getByRole("button", { name: "Unlocking…", exact: true }),
  ).toBeDisabled();
  await expect(page.getByRole("status")).toContainText("You unlocked it");
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "1",
  );
  await page.getByRole("button", { name: "Purchase pack" }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "no charge will be made",
  );
  await page.getByRole("button", { name: "Got it" }).click();
  await page.getByRole("button", { name: "Download", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "does not grant ownership",
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Purchase pack" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Vote to unlock" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Unvote & lock again" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
  await expect(page.getByRole("button", { name: "Purchase pack" })).toHaveCount(
    0,
  );
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Vote to unlock" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Vote to unlock" }).click();
  await expect(page.getByRole("status")).toContainText("You unlocked it");
});

test("mobile packs navigation and reduced motion unlock", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 850 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("navigation", { name: "Mobile navigation" })
    .getByRole("link", { name: "Packs", exact: true })
    .click();
  await expect(
    page.getByRole("navigation", { name: "Mobile navigation" }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "Vote to unlock" }).click();
  await expect(
    page.getByRole("button", { name: "Purchase pack" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
