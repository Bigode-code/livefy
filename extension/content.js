/* global chrome, LivefyBridge, MutationObserver, location, document, window */
(()=>{
  const COMMENT_CONTAINERS=['[data-e2e="comment-item"]','[class*="DivCommentItemContainer"]','[class*="CommentItem"]'];
  const PRODUCT_CONTAINERS=['[data-e2e="live-product-card"]','[class*="ProductCard"]','[class*="ProductListItem"]'];
  const VIEWER_SELECTORS=['[data-e2e="live-viewer-count"]','[class*="ViewerCount"]','[class*="AudienceCount"]'];
  const seen=new Set();let enabled=false;let scheduled=0;let lastUrl='';let lastViewers=-1;
  const text=(root,selectors)=>{for(const selector of selectors){const node=root.querySelector(selector);const value=node?.textContent?.trim();if(value)return value}return''};
  const idFor=(type,...parts)=>`${type}-${LivefyBridge.fnv1a(parts.join('|'))}`;
  const base=()=>({page_host:location.host,page_type:LivefyBridge.pageType(location.href),captured_at:new Date().toISOString()});
  const send=events=>{if(enabled&&events.length)chrome.runtime.sendMessage({type:'BRIDGE_EVENTS',events}).catch(()=>{})};
  function scanComments(events){for(const selector of COMMENT_CONTAINERS){for(const node of document.querySelectorAll(selector)){const body=text(node,['[data-e2e="comment-level-1"]','[class*="CommentText"]','p','span:last-child']);if(!body||body.length>2000)continue;const author=text(node,['[data-e2e="comment-username-1"]','[class*="UserName"]','a','strong'])||'TikTok viewer';const id=idFor('comment',author,body);if(seen.has(id))continue;seen.add(id);events.push({id,type:'comment',author:author.slice(0,120),body:body.slice(0,2000),...base()})}}}
  function scanProducts(events){for(const selector of PRODUCT_CONTAINERS){for(const node of document.querySelectorAll(selector)){const name=text(node,['[data-e2e="product-title"]','[class*="ProductTitle"]','h3','h4']);if(!name)continue;const priceText=text(node,['[data-e2e="product-price"]','[class*="Price"]']);const productId=node.getAttribute('data-product-id')||node.querySelector('a')?.getAttribute('href')||name;const id=idFor('product',productId,name,priceText);if(seen.has(id))continue;seen.add(id);events.push({id,type:'product',product_id:LivefyBridge.fnv1a(productId),name:name.slice(0,240),price:LivefyBridge.parsePrice(priceText),currency:/\$/.test(priceText)?'USD':'BRL',...base()})}}}
  function scanMetrics(events){for(const selector of VIEWER_SELECTORS){const value=document.querySelector(selector)?.textContent;if(!value)continue;const viewers=LivefyBridge.parseCount(value);if(viewers!==lastViewers){lastViewers=viewers;events.push({id:idFor('viewers',viewers,Math.floor(Date.now()/15000)),type:'live_metrics',viewers,...base()})}break}}
  function scan(){scheduled=0;if(!enabled)return;const events=[];scanComments(events);scanProducts(events);scanMetrics(events);if(seen.size>1500){const recent=[...seen].slice(-900);seen.clear();recent.forEach(value=>seen.add(value))}send(events)}
  function schedule(){if(!enabled||scheduled)return;scheduled=window.setTimeout(scan,800)}
  function pageStatus(){const current=location.href;if(current===lastUrl)return;lastUrl=current;send([{id:idFor('page',current,Date.now()),type:'page_status',message:`TikTok ${LivefyBridge.pageType(current)} detected`,...base()}]);schedule()}
  async function start(){const result=await chrome.runtime.sendMessage({type:'GET_STATE'}).catch(()=>null);enabled=Boolean(result?.ok&&result.data.captureEnabled&&result.data.deviceId);pageStatus();if(enabled)schedule()}
  const observer=new MutationObserver(schedule);observer.observe(document.documentElement,{childList:true,subtree:true});window.setInterval(pageStatus,2000);
  chrome.storage.onChanged.addListener(changes=>{if(changes.captureEnabled){enabled=Boolean(changes.captureEnabled.newValue);if(enabled){pageStatus();schedule()}}});
  void start();
})();
