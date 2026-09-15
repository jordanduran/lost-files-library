import { expect, type Page } from "@playwright/test";
import { createRequire } from "node:module";
import type { AxeResults } from "axe-core";

const require = createRequire(`${process.cwd()}/package.json`);
export async function checkAccessibility(page: Page) {
  await expect(page).toHaveTitle(/\S/);
  await page.addScriptTag({ path: require.resolve("axe-core/axe.min.js") });
  const violations = await page.evaluate(async () => {
    const axe = (
      window as unknown as {
        axe: { run: (options: object) => Promise<AxeResults> };
      }
    ).axe;
    const result = await axe.run({
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"],
      },
    });
    return result.violations.map(({ id, nodes }) => ({
      id,
      targets: nodes.map((node) => node.target),
    }));
  });
  expect(violations).toEqual([]);
}
