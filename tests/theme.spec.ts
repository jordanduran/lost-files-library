import {test,expect} from '@playwright/test';
for(const width of [390,1440]) test('file system theme across pages '+width,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 for(const path of ['/','/beats','/packs','/cart','/login','/producers']){
  await page.goto(path);await expect(page.locator('.file-system-theme')).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  await page.screenshot({path:'test-results/theme-'+width+'-'+(path.slice(1)||'home')+'.png',fullPage:true});
 }
 expect(errors).toEqual([]);
});
