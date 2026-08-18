/* global chrome, LivefyBridge, MutationObserver, location, document, window */
(()=>{
  const COMMENT_CONTAINERS=['[data-e2e="comment-item"]','[class*="DivCommentItemContainer"]','[class*="CommentItem"]'];
  const PRODUCT_CONTAINERS=['[data-e2e="live-product-card"]','[class*="ProductCard"]','[class*="ProductListItem"]'];
  const VIEWER_SELECTORS=['[data-e2e="live-viewer-count"]','[class*="ViewerCount"]','[class*="AudienceCount"]'];
  const seen=new Set();let enabled=false;let scheduled=0;let lastUrl='';let lastViewers=-1;let lastContext='';
  const text=(root,selectors)=>{for(const selector of selectors){const node=root.querySelector(selector);const value=node?.textContent?.trim();if(value)return value}return''};
  const idFor=(type,...parts)=>`${type}-${LivefyBridge.fnv1a(parts.join('|'))}`;
  const base=()=>({page_host:location.host,page_type:LivefyBridge.pageType(location.href),captured_at:new Date().toISOString()});
  function accountContext(){
    const sellerHost=/^(seller[^.]*|shop[^.]*)\.tiktok\.com$/i.test(location.host);
    const loginPage=/\/(login|signin|passport|auth)(\/|\?|$)/i.test(location.pathname)||Boolean(document.querySelector('input[type="password"],form[action*="login" i]'));
    const loginButton=document.querySelector('[data-e2e="top-login-button"],button[data-e2e="login-button"],[data-e2e="login-button"]');
    const profileNode=document.querySelector('a[data-e2e="profile-icon"],[data-e2e="profile-icon"] a,header a[href^="/@"],nav a[href^="/@"]');
    const href=profileNode?.getAttribute('href')||profileNode?.closest?.('a')?.getAttribute('href')||'';
    const profileMatch=href.match(/^\/@([^/?#]+)/);
    const identityNode=document.querySelector('[data-e2e*="account" i],[data-e2e*="profile" i],[class*="AccountName"],[class*="account-name"],[class*="UserName"],[class*="user-name"],header img[alt]:not([alt=""]),header [title]:not([title=""])');
    const identity=(profileMatch?decodeURIComponent(profileMatch[1]):identityNode?.textContent?.trim()||identityNode?.getAttribute?.('alt')||identityNode?.getAttribute?.('title')||'').replace(/\s+/g,' ').slice(0,120);
    const appShell=Boolean(document.querySelector('aside,nav,[class*="Sidebar"],[class*="Layout"]'))&&Boolean(document.querySelector('main,[class*="Content"],[class*="content"]'));
    const loggedIn=!loginPage&&!loginButton&&(Boolean(identity)||sellerHost&&appShell);
    const liveManager=/livecenter|live_center|creator-live|live-manager|livemanager|console[^/]*live/i.test(location.href)||Boolean(document.querySelector('a[href*="livecenter"],a[href*="live_center"],[data-e2e*="live-center"]'));
    const shopEligible=loggedIn&&(sellerHost||/affiliate/i.test(location.pathname)||Boolean(document.querySelector('a[href*="seller.tiktok"],a[href*="shop.tiktok"],[data-e2e*="shop-center"],[data-e2e="live-product-card"]')));
    const liveEligible=loggedIn&&(liveManager||shopEligible);
    const accountIdentity=identity||`${location.host}:authenticated`;
    return{page_host:location.host,page_type:liveManager?'live-center':LivefyBridge.pageType(location.href),logged_in:loggedIn,account_key:loggedIn?`tiktok:${LivefyBridge.fnv1a(accountIdentity.toLowerCase())}`:'',username:identity,shop_eligible:shopEligible,live_eligible:liveEligible,detection_reason:loginPage?'login-page':loginButton?'login-button':identity?'account-identity':sellerHost&&appShell?'seller-app-shell':'no-account-signal'}
  }
  function syncContext(){const context=accountContext();const serialized=JSON.stringify(context);if(serialized===lastContext)return;lastContext=serialized;chrome.runtime.sendMessage({type:'BRIDGE_CONTEXT',context}).catch(()=>{})}
  const send=events=>{if(enabled&&events.length)chrome.runtime.sendMessage({type:'BRIDGE_EVENTS',events}).catch(()=>{})};
  function scanComments(events){for(const selector of COMMENT_CONTAINERS){for(const node of document.querySelectorAll(selector)){const body=text(node,['[data-e2e="comment-level-1"]','[class*="CommentText"]','p','span:last-child']);if(!body||body.length>2000)continue;const author=text(node,['[data-e2e="comment-username-1"]','[class*="UserName"]','a','strong'])||'TikTok viewer';const id=idFor('comment',author,body);if(seen.has(id))continue;seen.add(id);events.push({id,type:'comment',author:author.slice(0,120),body:body.slice(0,2000),...base()})}}}
  function scanProducts(events){for(const selector of PRODUCT_CONTAINERS){for(const node of document.querySelectorAll(selector)){const name=text(node,['[data-e2e="product-title"]','[class*="ProductTitle"]','h3','h4']);if(!name)continue;const priceText=text(node,['[data-e2e="product-price"]','[class*="Price"]']);const productId=node.getAttribute('data-product-id')||node.querySelector('a')?.getAttribute('href')||name;const id=idFor('product',productId,name,priceText);if(seen.has(id))continue;seen.add(id);events.push({id,type:'product',product_id:LivefyBridge.fnv1a(productId),name:name.slice(0,240),price:LivefyBridge.parsePrice(priceText),currency:/\$/.test(priceText)?'USD':'BRL',...base()})}}}
  function scanMetrics(events){for(const selector of VIEWER_SELECTORS){const value=document.querySelector(selector)?.textContent;if(!value)continue;const viewers=LivefyBridge.parseCount(value);if(viewers!==lastViewers){lastViewers=viewers;events.push({id:idFor('viewers',viewers,Math.floor(Date.now()/15000)),type:'live_metrics',viewers,...base()})}break}}
  function scan(){scheduled=0;if(!enabled)return;const events=[];scanComments(events);scanProducts(events);scanMetrics(events);if(seen.size>1500){const recent=[...seen].slice(-900);seen.clear();recent.forEach(value=>seen.add(value))}send(events)}
  function schedule(){syncContext();if(!enabled||scheduled)return;scheduled=window.setTimeout(scan,800)}
  function pageStatus(){const current=location.href;if(current===lastUrl)return;lastUrl=current;send([{id:idFor('page',current,Date.now()),type:'page_status',message:`TikTok ${LivefyBridge.pageType(current)} detected`,...base()}]);schedule()}
  async function start(){const result=await chrome.runtime.sendMessage({type:'GET_STATE'}).catch(()=>null);enabled=Boolean(result?.ok&&result.data.captureEnabled&&result.data.controllerEnabled&&result.data.deviceId);syncContext();pageStatus();if(enabled)schedule()}
  const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.setInterval(()=>{syncContext();pageStatus()},2000);
  chrome.storage.onChanged.addListener(changes=>{if(changes.captureEnabled){enabled=Boolean(changes.captureEnabled.newValue);if(enabled){pageStatus();schedule()}}});
  void start();
})();
