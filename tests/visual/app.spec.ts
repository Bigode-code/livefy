import { test, expect } from '@playwright/test';
const routes=['overview','live','media','products','automation','rules','comments','notifications','diagnostics','settings'] as const;
for(const route of routes){test(`${route} light`,async({page})=>{const errors:string[]=[];page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await page.addInitScript(()=>localStorage.setItem('theme','light'));await page.goto(`/#${route}`);await expect(page).toHaveScreenshot(`${route}-light.png`,{fullPage:true});expect(errors).toEqual([])});}
for(const route of ['overview','live','settings'] as const){test(`${route} dark`,async({page})=>{await page.addInitScript(()=>localStorage.setItem('theme','dark'));await page.goto(`/#${route}`);await expect(page).toHaveScreenshot(`${route}-dark.png`,{fullPage:true})});}
test('all tested layouts have no accidental document overflow',async({page})=>{for(const width of [1024,1280,1440,1920]){await page.setViewportSize({width,height:width===1024?768:900});for(const route of routes){await page.goto(`/#${route}`);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`${route} at ${width}`).toBe(true)}}});
test('component lab form states remain contained',async({page})=>{await page.goto('/#components');await expect(page).toHaveScreenshot('components-torture.png',{fullPage:true});await page.getByLabel('Empty value').focus();await expect(page.getByLabel('Empty value')).toBeFocused()});
test('mobile layouts remain usable and contained',async({page})=>{
  for(const width of [390,768]){
    await page.setViewportSize({width,height:844});
    for(const route of routes){
      await page.goto(`/#${route}`);
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`${route} at ${width}px`).toBe(true);
    }
  }
});
for(const route of ['overview','live','products','settings'] as const){
  test(`${route} mobile`,async({page})=>{
    await page.setViewportSize({width:390,height:844});
    await page.addInitScript(()=>localStorage.setItem('theme','light'));
    await page.goto(`/#${route}`);
    await expect(page).toHaveScreenshot(`${route}-mobile.png`,{fullPage:true});
  });
}
test('mobile navigation drawer contains its scroll and footer',async({page})=>{
  await page.setViewportSize({width:390,height:600});
  await page.goto('/#overview');
  await page.getByLabel('Toggle navigation').click();
  const drawer=page.locator('.sidebar');
  const nav=drawer.locator('nav');
  await expect(drawer).toBeVisible();
  expect(await page.evaluate(()=>getComputedStyle(document.body).overflow)).toBe('hidden');
  await nav.evaluate(element=>{element.scrollTop=element.scrollHeight});
  await expect(drawer.getByText('Settings',{exact:true})).toBeVisible();
  await expect(drawer.getByText('Runtime healthy',{exact:true})).toBeVisible();
  await expect(page).toHaveScreenshot('navigation-drawer-mobile.png');
});

test('language selector translates immediately and persists the choice',async({page})=>{
  await page.goto('/#overview');
  const cases=[
    [1,'pt-BR','Visão geral da sessão','PT-BR'],
    [2,'es','Resumen de la sesión','ES'],
    [3,'zh-CN','会话概览','中文'],
    [4,'de-DE','Sitzungsübersicht','DE'],
    [5,'ru-RU','Обзор сеанса','RU'],
    [0,'en','Session overview','EN'],
  ] as const;
  for(const [index,locale,heading,compactLabel] of cases){
    await page.locator('.locale-trigger').click();
    await page.locator('.locale-list>button').nth(index).click();
    await expect(page.getByRole('heading',{name:heading,level:1})).toBeVisible();
    await expect(page.locator('.locale-trigger')).toContainText(compactLabel);
    await expect(page.locator('html')).toHaveAttribute('lang',locale);
    await page.reload();
    await expect(page.locator('.locale-trigger')).toContainText(compactLabel);
  }
});

test('localized routes remain translated and contained on mobile',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  const cases=[
    [1,'pt-BR','Configurações'],
    [2,'es','Configuración'],
    [3,'zh-CN','设置'],
    [4,'de-DE','Einstellungen'],
    [5,'ru-RU','Настройки'],
    [0,'en','Settings'],
  ] as const;
  for(const [index,locale,heading] of cases){
    await page.goto('/#overview');
    await page.locator('.locale-trigger').click();
    await page.locator('.locale-list>button').nth(index).click();
    await page.goto('/#settings');
    await expect(page.getByRole('heading',{name:heading,level:1})).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),locale).toBe(true);
  }
});

test('mobile toolbar keeps language visible and badge inside notification control',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.addInitScript(()=>localStorage.setItem('livefy-locale','pt-BR'));
  await page.goto('/#overview');
  await expect(page.locator('.locale-trigger')).toContainText('PT-BR');
  const bell=await page.locator('.notification-button').boundingBox();
  const badge=await page.locator('.notification-button i').boundingBox();
  expect(bell).not.toBeNull();
  expect(badge).not.toBeNull();
  expect(badge!.x).toBeGreaterThanOrEqual(bell!.x);
  expect(badge!.y).toBeGreaterThanOrEqual(bell!.y);
  expect(badge!.x+badge!.width).toBeLessThanOrEqual(bell!.x+bell!.width);
  expect(badge!.y+badge!.height).toBeLessThanOrEqual(bell!.y+bell!.height);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
});

test('region defaults and manual currency selection stay synchronized',async({page})=>{
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'language',{configurable:true,get:()=> 'de-DE'});
    Object.defineProperty(navigator,'languages',{configurable:true,get:()=> ['de-DE','en-US']});
  });
  await page.goto('/#overview');
  await expect(page.locator('html')).toHaveAttribute('lang','de-DE');
  await expect(page.locator('html')).toHaveAttribute('data-currency','EUR');
  await page.locator('.locale-trigger').click();
  await page.locator('.currency-list>button').nth(4).click();
  await expect(page.locator('html')).toHaveAttribute('data-currency','RUB');
  await expect(page.locator('.deck-metrics>div').nth(1).locator('strong')).toContainText('RUB');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-currency','RUB');
});

test('overview dashboard tabs switch complete operational panels',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('livefy-locale','pt-BR'));
  await page.goto('/#overview');
  const tabs=page.getByRole('tab');
  await expect(tabs).toHaveCount(5);
  await expect(page.getByRole('heading',{name:'Velocidade dos pedidos'})).toBeVisible();
  await page.getByLabel('Visualização em barras').click();
  await expect(page.locator('.metric-bar')).toHaveCount(14);
  await page.getByLabel('Período').selectOption('30 min');
  await expect(page.locator('.metric-bar')).toHaveCount(4);
  await page.getByRole('tab',{name:'Produtos'}).click();
  await expect(page.getByRole('heading',{name:'Desempenho dos produtos'})).toBeVisible();
  await page.getByRole('tab',{name:'Diagnósticos'}).click();
  await expect(page.getByRole('heading',{name:'Os sistemas principais estão saudáveis'})).toBeVisible();
  await expect(page.locator('.dashboard-slide.active')).not.toHaveAttribute('aria-hidden','true');
});

test('diagnostic status badges stay inside their health rows',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('livefy-locale','pt-BR'));
  for(const width of [390,768,1440]){
    await page.setViewportSize({width,height:844});
    await page.goto('/#overview');
    await page.getByRole('tab',{name:'Diagnósticos'}).click();
    const containment=await page.locator('.health-grid > div').evaluateAll(rows=>rows.map(row=>{
      const rowBox=row.getBoundingClientRect();
      const statusBox=row.querySelector('.status')!.getBoundingClientRect();
      return statusBox.left>=rowBox.left-.5&&statusBox.right<=rowBox.right+.5;
    }));
    expect(containment,`diagnostic badges at ${width}px`).toEqual([true,true,true,true]);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  }
});

test('analytics metrics and activity share a consistent grid',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('livefy-locale','pt-BR'));
  for(const width of [390,768,1440]){
    await page.setViewportSize({width,height:844});
    await page.goto('/#analytics');
    await expect(page.locator('.page > .section')).toHaveCount(2);
    await expect(page.locator('.section .section')).toHaveCount(0);
    const metricBoxes=await page.locator('.metrics-three > .metric').evaluateAll(items=>items.map(item=>item.getBoundingClientRect()));
    expect(metricBoxes).toHaveLength(3);
    const columns=width<=520?1:3;
    if(columns===3){
      expect(Math.max(...metricBoxes.map(box=>box.width))-Math.min(...metricBoxes.map(box=>box.width))).toBeLessThan(1);
      const firstMetric=page.locator('.metrics-three > .metric').first();
      const firstBox=await firstMetric.boundingBox();
      const labelBox=await firstMetric.locator('span').boundingBox();
      expect(labelBox!.x-firstBox!.x).toBeGreaterThanOrEqual(19);
    }
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);
  }
});

test('authentication routes are responsive and complete their local flows',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('livefy-locale','pt-BR'));
  for(const width of [390,1440]){
    await page.setViewportSize({width,height:900});
    for(const route of ['login','signup','forgot-password']){
      await page.goto(`/#${route}`);
      await expect(page.locator('.auth2-form')).toBeVisible();
      expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth),`${route} at ${width}px`).toBe(true);
    }
  }
  await page.setViewportSize({width:390,height:844});
  await page.goto('/#signup');
  await page.getByLabel('Nome',{exact:true}).fill('Marina');
  await page.getByLabel('Sobrenome',{exact:true}).fill('Tavares');
  await page.getByLabel('E-mail',{exact:true}).fill('marina@studio.com');
  await page.getByRole('button',{name:'Criar conta'}).click();
  await expect(page.getByRole('heading',{name:'Conta criada'})).toBeVisible();
  await page.goto('/#forgot-password');
  await page.getByLabel('E-mail',{exact:true}).fill('marina@studio.com');
  await page.getByRole('button',{name:'Enviar link de recuperação'}).click();
  await expect(page.getByRole('heading',{name:'E-mail de recuperação enviado'})).toBeVisible();
});
