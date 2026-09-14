import { test, expect } from "@playwright/test";

test("globe keeps drawing when theme colors are missing or invalid", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/producers");
  const globe = page.getByRole("img", { name: /Interactive producer globe/ });
  await globe.scrollIntoViewIfNeeded();
  for (const color of ["", "not-a-color"]) {
    await globe.evaluate((element, value) => {
      const canvas = element as HTMLCanvasElement;
      canvas.style.setProperty("--globe-ink", value || "initial");
      canvas.style.setProperty("--accent", value || "initial");
    }, color);
    const snapshot = () => globe.evaluate(element => (element as HTMLCanvasElement).toDataURL());
    const initial = await snapshot();
    await expect.poll(snapshot).not.toBe(initial);
  }
  expect(errors).toEqual([]);
});

test("producer globe rotates without playback controls", async ({
  page,
}) => {
  await page.goto("/producers");
  const globe = page.getByRole("img", { name: /Interactive producer globe/ });
  await globe.scrollIntoViewIfNeeded();
  const snapshot = () =>
    globe.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  const initial = await snapshot();
  await expect.poll(snapshot).not.toBe(initial);
  await expect(
    page.getByRole("heading", { level: 1, name: "Independent sound. Worldwide." }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /globe rotation/ }),
  ).toHaveCount(0);
});

test("mobile globe respects reduced motion and fits the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/producers");
  const globe = page.getByRole("img", { name: /Interactive producer globe/ });
  await globe.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      globe.evaluate((element) => (element as HTMLCanvasElement).width),
    )
    .toBeGreaterThan(300);
  await expect(
    page.getByRole("button", { name: "Pause globe rotation" }),
  ).toHaveCount(0);
  const snapshot = () =>
    globe.evaluate((element) => (element as HTMLCanvasElement).toDataURL());
  const initial = await snapshot();
  await page.waitForTimeout(250);
  expect(await snapshot()).toBe(initial);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    390,
  );
});

test("city targeting, dragging and signed-out voting", async ({page}) => {
  await page.emulateMedia({reducedMotion:"reduce"});
  await page.goto('/producers');
  const globe=page.locator('.producer-globe');
  await globe.scrollIntoViewIfNeeded();
  const snapshot=()=>globe.evaluate(el=>(el as HTMLCanvasElement).toDataURL());
  await page.screenshot({path: 'test-results/producers-desktop.png', fullPage:true});
  const before=await snapshot();
  await page.getByRole('button',{name:/TOKYO/}).focus();
  await expect.poll(snapshot).not.toBe(before);
  const targeted=await snapshot();
  await globe.focus(); await page.keyboard.press('ArrowLeft');
  await expect.poll(snapshot).not.toBe(targeted);
  const rect=(await globe.boundingBox())!;
  const dragged=await snapshot();
  await page.mouse.move(rect.x+rect.width/2,rect.y+rect.height/2);
  await page.mouse.down();await page.mouse.move(rect.x+rect.width/2+60,rect.y+rect.height/2+40,{steps:5});await page.mouse.up();
  expect(await snapshot()).not.toBe(dragged);
  await page.getByRole('button',{name:/TOKYO/}).click();
  await expect(page.getByRole('link',{name:/Sign in to vote/})).toBeVisible();
  await expect(page.getByRole('button',{name:/TOKYO/})).toHaveAttribute('aria-pressed','false');
});

test("globe resumes scanning after city interaction",async({page})=>{
 await page.goto('/producers');
 const canvas=page.locator('.producer-globe');
 const snapshot=()=>canvas.evaluate(el=>(el as HTMLCanvasElement).toDataURL());
 await page.getByRole('button',{name:/TOKYO/}).hover();
 await expect(page.locator('.atlas-readout').first()).toContainText('TOKYO');
 await page.mouse.move(1,1);
 await expect(page.locator('.atlas-readout').first()).toContainText('SCANNING THE ARCHIVE');
 await canvas.scrollIntoViewIfNeeded();
 const initial=await snapshot();await expect.poll(snapshot).not.toBe(initial);
});
