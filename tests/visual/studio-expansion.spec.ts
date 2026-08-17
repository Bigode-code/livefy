import { expect, test } from '@playwright/test';

const routes=['overview','games','create','subscription'] as const;

for(const route of routes){
  test(`${route} remains contained on desktop and mobile`,async({page})=>{
    for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
      await page.setViewportSize(viewport);
      await page.goto(`/#${route}`);
      await page.waitForLoadState('networkidle');
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(1);
    }
  });
}

test('creation workflow exposes model connectors and can run',async({page})=>{
  await page.goto('/#create');
  await expect(page.getByRole('region',{name:'Visual creation workflow'})).toBeVisible();
  await expect(page.getByText('Seedance 2.5').first()).toBeVisible();
  await expect(page.getByText('Kling Omni').first()).toBeVisible();
  await expect(page.locator('.react-flow__edge')).toHaveCount(4);
  await page.getByRole('button',{name:'Run workflow'}).click();
  await expect(page.getByText('Checking model connections and credentials…')).toBeVisible();
});
