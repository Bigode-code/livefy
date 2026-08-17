import { mkdir,readFile } from 'node:fs/promises';
import { URL,fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const svg=await readFile(new URL('../public/brand/livefy-black.svg',import.meta.url),'utf8');
const iconSvg=svg.replace('viewBox="0 0 210 60"','viewBox="15 0 145 60"');
const output=new URL('../extension/icons/',import.meta.url);
await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true});
try{
  for(const size of [16,32,48,128]){
    const page=await browser.newPage({viewport:{width:size,height:size},deviceScaleFactor:1});
    await page.setContent(`<style>*{box-sizing:border-box}html,body{width:100%;height:100%;margin:0;background:transparent}body{display:grid;place-items:center;padding:${Math.max(1,Math.round(size*.08))}px}svg{width:100%;height:auto;display:block}</style>${iconSvg}`);
    await page.screenshot({path:fileURLToPath(new URL(`icon${size}.png`,output)),omitBackground:true});
    await page.close();
  }
}finally{await browser.close()}
