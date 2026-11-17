let DATA=[], BUILD={version:'',updated:''};
let nums=[], currentLesson=0, currentVersion='', fs=+(localStorage.getItem('acimFS')||21), lh=+(localStorage.getItem('acimLH')||1.85), scan=100, saveTimer=null;
document.documentElement.style.setProperty('--fs',fs+'px'); document.documentElement.style.setProperty('--lh',lh);
const $=id=>document.getElementById(id); const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const byLesson=n=>DATA.filter(x=>x.lesson===n);
const materialIds=()=>[...new Set(DATA.filter(x=>x.kind==='material').map(x=>x.lesson))];
const viewFor=item=>item.view||({'罗伯佩里注解':'perry','复习五导言':'intro','复习六导言':'review6'}[item.version]||'text');
function renderRuns(runs){return (runs||[]).map(r=>{let text=esc(r.text);if(r.sup)text=`<sup>${text}</sup>`;if(r.lang)text=`<span lang="${esc(r.lang)}">${text}</span>`;if(r.italic)text=`<em>${text}</em>`;if(r.bold)text=`<strong>${text}</strong>`;if(r.emphasis)text=`<strong class="journey-emphasis">${text}</strong>`;return text}).join('')}
function renderJourneyBlocks(blocks){return blocks.map(b=>{if(b.type==='title')return '';if(b.type==='figure')return `<figure class="journey-figure"><a href="${esc(b.src)}" target="_blank" rel="noopener"><img src="${esc(b.src)}" alt="${esc(b.alt)}"></a><figcaption>${esc(b.alt)} · <a href="${esc(b.src)}" target="_blank" rel="noopener">查看大图</a></figcaption><details><summary>图中文字</summary>${renderJourneyBlocks(b.textBlocks||[])}</details></figure>`;const tag=b.type==='heading'?'h3':'p';return `<${tag}>${renderRuns(b.runs)}</${tag}>`}).join('')}
function renderJourney(pages){return `<details class="journey-toc"><summary>本资料目录（${pages.length}页）</summary><ol>${pages.map(p=>`<li><a href="#journey-page-${p.number}">${p.number}. ${esc(p.title)}</a></li>`).join('')}</ol></details>${pages.map(p=>`<section class="journey-page" id="journey-page-${p.number}"><div class="journey-page-number">第 ${p.number} 页</div><h2>${esc(p.title)}</h2>${renderJourneyBlocks(p.blocks)}</section>`).join('')}`}
function isHeading(t){return /^第 \d+ 页$/.test(t.trim()) || /^(注[释釋]|练习说明|練習說明|目的[:：]|早晚安静时光|早晚安靜時光|每小时整点忆念|每小時整點憶念|频繁提醒|頻繁提醒|总体评论|總體評論|面对诱惑时的回应|面對誘惑時的回應|备注[:：]|備註[:：]|導言|导言)$/.test(t.trim()) || /^(目的|早晚安静时光|早晚安靜時光|每小时整点忆念|每小時整點憶念|频繁提醒|頻繁提醒|总体评论|總體評論|面对诱惑时的回应|面對誘惑時的回應|备注|備註)[：:]/.test(t.trim())}
function isNote(t){return /^(\d{3}|[〔\[]?\d{3}[〕\]]?)/.test(t.trim()) && !/^1\d?\s/.test(t.trim())}
function renderText(blocks,media=[],rich=[],headingBlocks=[],noteBlocks=[],quoteBlocks=[]){return (blocks||[]).map((t,i)=>{let s=String(t).trim(),cls=''; if(isHeading(s)||headingBlocks.includes(i))cls='heading'; else if(quoteBlocks.includes(i))cls='source-quote'; else if(noteBlocks.includes(i)||isNote(s))cls='note'; else if(/^\d+\s/.test(s))cls='numbered'; return `<p class="${cls}">${/^\*\*[\s\S]+\*\*$/.test(s)?esc(s.slice(2,-2)):rich[i]?renderRuns(rich[i]):esc(s)}</p>`+media.filter(m=>m.afterBlock===i).map(m=>`<figure class="journey-figure"><a href="${esc(m.src)}" target="_blank" rel="noopener"><img src="${esc(m.src)}" alt="${esc(m.alt)}"></a><figcaption>${esc(m.caption||m.alt)} · <a href="${esc(m.src)}" target="_blank" rel="noopener">查看大图</a></figcaption></figure>`).join('')}).join('')}
function currentKey(){return `scroll:${currentLesson}:${currentVersion}`}
function saveScroll(){clearTimeout(saveTimer); saveTimer=setTimeout(()=>localStorage.setItem(currentKey(),String(scrollY)),120)}
function restoreScroll(){const y=+(localStorage.getItem(currentKey())||0); setTimeout(()=>{const anchor=location.hash?document.getElementById(location.hash.slice(1)):null;if(anchor)anchor.scrollIntoView({behavior:'instant'});else scrollTo({top:y,behavior:'instant'})},40)}
function urlView(){const item=byLesson(currentLesson).find(x=>x.version===currentVersion);return item?viewFor(item):'text'}
function updateURL(){const u=new URL(location.href);u.searchParams.set('lesson',currentLesson);u.searchParams.set('view',urlView());history.replaceState(null,'',u)}
function renderNav(filter=''){
  const nav=$('nav'), term=filter.trim().toLowerCase();
  nav.innerHTML='';
  for(const [label,ids] of [['学习资料',materialIds()],['课程',nums]]){
    const matches=ids.filter(n=>[n,...byLesson(n).flatMap(x=>[x.title,x.version,x.source||''])].join(' ').toLowerCase().includes(term));
    if(!matches.length)continue;
    const heading=document.createElement('div');
    heading.className='navheading';
    heading.textContent=label;
    nav.appendChild(heading);
    for(const n of matches){
      const arr=byLesson(n),item=arr.find(x=>x.version!=='罗伯佩里注解')||arr[0];
      const button=document.createElement('button');
      button.className='navitem'+(n===currentLesson?' active':'');
      button.innerHTML=item.kind==='material'?`<b>${esc(item.title)}</b>`:`<b>第 ${n} 课</b><small>${esc(item.title)}</small>`;
      button.onclick=()=>{currentLesson=n;currentVersion='';show(true);closeDrawer()};
      nav.appendChild(button);
    }
  }
}
function renderScans(item){
  const label=item.imageTitles?'原版图文':'原版扫描页';
  const toc=item.imageTitles?`<details class="journey-toc"><summary>本资料目录（${item.images.length}页）</summary><ol>${item.imageTitles.map((title,i)=>`<li><a href="#scan-page-${i+1}">${i+1}. ${esc(title)}</a></li>`).join('')}</ol></details>`:'';
  return `${toc}<div class="scancontrols"><button id="scanMinus">缩小原页</button><button id="scanPlus">放大原页</button><span>${label} · ${item.images.length} 页</span></div><div class="scanwrap" id="scanwrap">${item.images.map((src,i)=>`<a class="scanlink" id="scan-page-${i+1}" href="${esc(src)}" target="_blank" rel="noopener" aria-label="查看第 ${i+1} 页大图"><img class="scanpage" alt="${esc(item.imageTitles?.[i]||item.title+' · 第 '+(i+1)+' 页')}" src="${esc(src)}" ${item.imageSizes?.[i]?`width="${item.imageSizes[i][0]}" height="${item.imageSizes[i][1]}"`:''} ${i?'loading="lazy"':''}></a>`).join('')}</div>`;
}
function show(resetScroll=false){
  const arr=byLesson(currentLesson);
  if(!arr.length)return;
  const item=arr.find(x=>x.version===currentVersion)||arr[0];
  currentVersion=item.version;
  localStorage.setItem('acimLesson',currentLesson);
  localStorage.setItem('acimVersion',currentVersion);
  if(resetScroll&&location.hash){const u=new URL(location.href);u.hash='';history.replaceState(null,'',u)}
  updateURL();
  $('kicker').textContent=`${item.kind==='material'?'学习资料':`第 ${currentLesson} 课`} · ${item.version}`;
  const heading=$('title');
  heading.textContent=item.title;
  if(item.titleNote){const note=document.createElement('sup');note.textContent=' '+item.titleNote;heading.appendChild(note)}
  $('meta').textContent=`来源：${item.source||''} · 资料版本 ${BUILD.version||''}`;
  const vb=$('versionbar');vb.innerHTML='';
  arr.forEach(v=>{
    const b=document.createElement('button');
    b.textContent=v.version;
    b.className=v.version===currentVersion?'active':'';
    b.setAttribute('aria-pressed',String(v.version===currentVersion));
    b.onclick=()=>{localStorage.setItem(currentKey(),String(scrollY));currentVersion=v.version;show(true)};
    vb.appendChild(b);
  });
  const c=$('content'),hasImages=Boolean(item.images?.length);
  c.classList.toggle('text-content',!hasImages);
  c.classList.toggle('scans-content',hasImages);
  c.classList.toggle('material-text',item.kind==='material'&&!item.pages&&!hasImages);
  if(hasImages){
    c.innerHTML=renderScans(item);
    scan=100;
    const w=$('scanwrap');
    const setScan=delta=>{scan=Math.max(100,Math.min(240,scan+delta));w.style.setProperty('--scan',scan+'%')};
    $('scanPlus').onclick=()=>setScan(20);
    $('scanMinus').onclick=()=>setScan(-20);
  }else{
    c.innerHTML=item.pages?renderJourney(item.pages):renderText(item.blocks,item.inlineMedia,item.richBlocks,item.headingBlocks,item.noteBlocks,item.quoteBlocks);
  }
  renderNav($('search').value);
  const i=nums.indexOf(currentLesson),prev=i>0?nums[i-1]:null,next=i>=0&&i<nums.length-1?nums[i+1]:null;
  for(const [id,n] of [['prev',prev],['prevTop',prev],['next',next],['nextTop',next]]){
    $(id).disabled=!n;
    $(id).onclick=()=>{if(n){currentLesson=n;currentVersion='';show(true)}};
  }
  if(resetScroll)scrollTo({top:0,behavior:'instant'});else restoreScroll();
}
function closeDrawer(){$('sidebar').classList.remove('open')}
function setTheme(v){if(v==='light')v='white';if(!['paper','white','dark'].includes(v))v='paper';document.body.classList.remove('paper','white','dark');document.body.classList.add(v);localStorage.setItem('acimTheme',v);const b=$('themeBtn');if(b){b.textContent=v==='paper'?'纸色':v==='white'?'白色':'夜间';b.title='阅读底色：'+b.textContent+'（点击切换）'}}
async function checkUpdate(manual=false){try{if('serviceWorker'in navigator){const r=await navigator.serviceWorker.getRegistration();await r?.update()}const v=await fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(r=>r.json());if(v.version!==BUILD.version){if(confirm(`发现新内容版本 ${v.version}，现在刷新吗？`))location.reload()}else if(manual)alert('当前已经是最新版本：'+BUILD.version)}catch(e){if(manual)alert('暂时无法联网检查更新；离线内容仍可继续阅读。')}}
function touchDistance(t){const dx=t[0].clientX-t[1].clientX,dy=t[0].clientY-t[1].clientY;return Math.hypot(dx,dy)}
function setupPinchResize(){
  const el=$('content');
  let active=false,startDist=0,startFS=fs,lastFS=fs,gestureStartFS=fs;
  const apply=v=>{lastFS=Math.max(14,Math.min(40,+v.toFixed(1)));fs=lastFS;document.documentElement.style.setProperty('--fs',fs+'px')};
  const commit=()=>{if(!active)return;active=false;fs=lastFS;localStorage.setItem('acimFS',fs)};
  el.addEventListener('touchstart',e=>{if(!el.classList.contains('text-content')||e.touches.length!==2)return;e.preventDefault();active=true;startDist=touchDistance(e.touches);startFS=fs;lastFS=fs},{passive:false});
  el.addEventListener('touchmove',e=>{if(!active||e.touches.length!==2||!startDist)return;e.preventDefault();apply(startFS*(touchDistance(e.touches)/startDist))},{passive:false});
  el.addEventListener('touchend',e=>{if(e.touches.length<2)commit()},{passive:true});
  el.addEventListener('touchcancel',commit,{passive:true});
  el.addEventListener('gesturestart',e=>{if(!el.classList.contains('text-content'))return;e.preventDefault();active=true;gestureStartFS=fs;lastFS=fs},{passive:false});
  el.addEventListener('gesturechange',e=>{if(!active)return;e.preventDefault();apply(gestureStartFS*(e.scale||1))},{passive:false});
  el.addEventListener('gestureend',e=>{e.preventDefault();commit()},{passive:false});
}
function setupInstall(){let deferred=null;const btn=$('installBtn');window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;btn.hidden=false});btn.onclick=async()=>{if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;btn.hidden=true}else{$('installHelp').classList.add('show')}};$('installClose').onclick=()=>$('installHelp').classList.remove('show')}
async function init(){try{BUILD=await fetch('version.json',{cache:'no-store'}).then(r=>r.json()).catch(()=>({version:'offline'}));const IDX=await fetch('lessons-index.json?v='+encodeURIComponent(BUILD.version)).then(r=>r.json()); const parts=await Promise.all((IDX.files||[]).map(f=>fetch(f+'?v='+encodeURIComponent(BUILD.version)).then(r=>r.json()))); DATA=parts.flat();nums=[...new Set(DATA.filter(x=>x.kind!=='material').map(x=>x.lesson))].sort((a,b)=>a-b);const q=new URLSearchParams(location.search);const key=q.get('lesson')||localStorage.getItem('acimLesson')||nums[0];currentLesson=DATA.some(x=>x.kind==='material'&&x.lesson===key)?key:+key;if(!byLesson(currentLesson).length)currentLesson=nums[0];const vq=q.get('view');currentVersion=vq?(byLesson(currentLesson).find(x=>viewFor(x)===vq)?.version||''):(localStorage.getItem('acimVersion')||'');$('status').textContent=`资料更新：${BUILD.updated||''} · ${nums.length} 个课程 · ${DATA.filter(x=>x.version==='罗伯佩里注解').length} 篇罗伯·佩里注解${materialIds().length?' · '+materialIds().length+' 份学习资料':''}`;show(false);setupInstall();setupPinchResize();if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').then(r=>r.update()).catch(()=>{});setTimeout(()=>checkUpdate(false),2500)}catch(e){$('content').innerHTML='<div class="loading">内容载入失败。若你直接双击本地文件，请改为部署到 HTTPS 网站后打开；PWA 需要通过网页服务器运行。</div>';console.error(e)}}
$('search').addEventListener('input',e=>renderNav(e.target.value));$('drawerBtn').onclick=()=>$('sidebar').classList.toggle('open');$('fontPlus').onclick=()=>{fs=Math.min(36,fs+1);document.documentElement.style.setProperty('--fs',fs+'px');localStorage.setItem('acimFS',fs)};$('fontMinus').onclick=()=>{fs=Math.max(14,fs-1);document.documentElement.style.setProperty('--fs',fs+'px');localStorage.setItem('acimFS',fs)};$('linePlus').onclick=()=>{lh=Math.min(2.5,+(lh+.08).toFixed(2));document.documentElement.style.setProperty('--lh',lh);localStorage.setItem('acimLH',lh)};$('lineMinus').onclick=()=>{lh=Math.max(1.3,+(lh-.08).toFixed(2));document.documentElement.style.setProperty('--lh',lh);localStorage.setItem('acimLH',lh)};$('themeBtn').onclick=()=>{const cur=document.body.classList.contains('paper')?'paper':document.body.classList.contains('white')?'white':'dark';setTheme(cur==='paper'?'white':cur==='white'?'dark':'paper')};$('updateBtn').onclick=()=>checkUpdate(true);setTheme(localStorage.getItem('acimTheme')||'paper');addEventListener('scroll',saveScroll,{passive:true});addEventListener('popstate',()=>{const q=new URLSearchParams(location.search);if(q.get('lesson')!==String(currentLesson)||q.get('view')!==urlView())location.reload()});init();
