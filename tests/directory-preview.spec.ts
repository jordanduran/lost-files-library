import {test,expect} from '@playwright/test';
for(const width of [390,1440]) test('file directory preview at '+width,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/preview/file-directory');
 await expect(page.getByRole('heading',{level:1})).toContainText('Sounds that');
 await page.getByRole('button',{name:/CONCRETE_DREAMS/}).click();
 await expect(page.locator('.file-inspector h2')).toHaveText('Concrete Dreams');
 await page.getByRole('button',{name:'PREVIEW',exact:true}).click();
 await expect(page.locator('.inspector-actions button')).toHaveText('PAUSE');
 await page.getByRole('button',{name:'COMPOSITIONS',exact:true}).click();
 await expect(page.locator('.directory-file')).toHaveCount(3);
 await page.getByRole('button',{name:'README.TXT',exact:true}).click();
 await expect(page.getByRole('link',{name:/OPEN MY LIBRARY/})).toBeVisible();
 await page.getByRole('button',{name:'SOUNDS',exact:true}).click();
 await page.getByRole('button',{name:'Minimize directory'}).click();
 await expect(page.locator('.directory-browser')).toHaveCount(0);
 await page.getByRole('button',{name:'Restore directory'}).click();
 await expect(page.locator('.directory-browser')).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
 await page.screenshot({path:'test-results/directory-'+width+'.png',fullPage:true});
 expect(errors).toEqual([]);
});

for(const width of [320,390,1440]) test('directory tab height remains stable at '+width,async({page})=>{
 await page.setViewportSize({width,height:1000});await page.goto('/');await page.evaluate(()=>document.fonts.ready);
 const windowBox=page.locator('.computer-window');
 for(const expanded of [false,true]){
  if(expanded) await page.getByRole('button',{name:'Expand directory',exact:true}).click();
  const height=(await windowBox.boundingBox())!.height;
  for(const name of ['COMPOSITIONS','PACKS','VOTE_TO_HACK','README.TXT','SOUNDS']){
   await page.getByRole('button',{name,exact:true}).click();
   expect(Math.abs((await windowBox.boundingBox())!.height-height)).toBeLessThan(1);
   expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBe(width);
  }
 }
});
