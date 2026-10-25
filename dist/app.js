import {mountArchitecture} from './architecture.js';
import {loadConfig,safeUrl} from './data-model.mjs';
const $=selector=>document.querySelector(selector);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const empty=(label,anchor)=>'<div class="empty-state"><span class="empty-symbol">◇</span><h3>Chưa cập nhật '+label+'</h3><p>Thông tin sẽ được cập nhật.</p></div>';
let config;
function renderOrganization(){
  const {organization,people}=config;
  const teamIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg>';
  function list(rows,depth=0){
    // Keep wide or nested hierarchies readable without squeezing cards.
    const stacked=depth>1||rows.length>3||rows.some(p=>people.some(c=>c.parentId===p.id))&&rows.length>1;
    return '<ul class="org-list'+(stacked?' org-list--stack':'')+'">'+rows.map((person,index)=>node(person,depth,index)).join('')+'</ul>';
  }
  function node(person,depth,index){
    const children=people.filter(p=>p.parentId===person.id);
    const isTeam=person.type==='team';
    const initials=person.name.trim().split(/\s+/).map(w=>w[0]).slice(-2).join('').toUpperCase();
    const avatar=person.avatar?'<img class="org-portrait" src="'+esc(person.avatar)+'" alt="Ảnh '+esc(person.name)+'" loading="lazy">':'<span class="org-portrait org-placeholder" aria-hidden="true">'+(isTeam?teamIcon:esc(initials))+'</span>';
    return '<li class="org-item"><article class="org-card '+(isTeam?'org-card--team':depth===0?'org-card--lead':'org-card--person')+'">'+avatar+'<div class="org-card-copy"><span class="org-role">'+esc(person.title||(isTeam?'Nhóm / bộ phận':'Nhân sự'))+'</span><h3>'+esc(person.name)+'</h3>'+(person.description?'<p>'+esc(person.description)+'</p>':'')+'</div>'+(isTeam?'<span class="org-index" aria-hidden="true">'+String(index+1).padStart(2,'0')+'</span>':'')+'</article>'+(children.length?list(children,depth+1):'')+'</li>';
  }
  $('#org-chart').innerHTML='<div class="org-context">'+(organization.parent?'<div class="org-governing"><span class="org-kicker">ĐƠN VỊ CHỦ QUẢN</span><strong>'+esc(organization.parent)+'</strong></div>':'')+'<div class="org-unit"><span aria-hidden="true"></span><h3>'+esc(organization.department)+'</h3></div></div>'+(people.length?list(people.filter(p=>!p.parentId)):empty('sơ đồ tổ chức','people'));
}
function renderApplications(){
  const categories=[...new Set(config.applications.map(a=>a.category).filter(Boolean))];
  $('#app-filters').innerHTML=config.applications.length?'<button class="filter active" data-category="" aria-pressed="true">Tất cả <span>'+config.applications.length+'</span></button>'+categories.map(category=>'<button class="filter" data-category="'+esc(category)+'" aria-pressed="false">'+esc(category)+'</button>').join(''):'';
  function cards(category=''){
    const selected=config.applications.map((app,index)=>({...app,index})).filter(app=>!category||app.category===category);
    $('#apps-grid').innerHTML=selected.length?selected.map(app=>'<article class="app-card"><div class="app-content"><div class="app-icon" aria-hidden="true">⌘</div><span class="app-category">'+esc(app.category)+'</span><h3>'+esc(app.title)+'</h3><p>'+esc(app.description)+'</p><div class="app-footer">'+(app.status?'<span class="status-badge">'+esc(app.status)+'</span>':'<span></span>')+'<button class="app-detail" data-app="'+app.index+'" aria-label="Xem chi tiết '+esc(app.title)+'">Tìm hiểu thêm ↗</button></div></div></article>').join(''):empty('ứng dụng','applications');
    $('#filter-status').textContent='Hiển thị '+selected.length+' ứng dụng.';
  }
  cards();$('#app-filters').addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;$('#app-filters').querySelectorAll('button').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});cards(button.dataset.category);});
}
function renderRoadmap(kind){
  const rows=config[kind==='digital'?'digitalRoadmap':'applicationRoadmap'];
  document.querySelectorAll('[data-roadmap]').forEach(tab=>{const active=tab.dataset.roadmap===kind;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  $('#roadmap-panel').setAttribute('aria-labelledby','tab-'+kind);
  $('#roadmap-panel').innerHTML=rows.length?'<div class="timeline">'+rows.map(row=>'<article class="phase"><div class="phase-year">'+esc(row.period)+'</div><div class="phase-line"></div><h3>'+esc(row.title)+'</h3><p class="phase-description">'+esc(row.description)+'</p></article>').join('')+'</div>':empty('lộ trình','roadmaps');
}
function render(){
  const architecture=config.architecture;$('#architecture').hidden=!architecture.enabled;$('#architecture-nav').hidden=!architecture.enabled;if(architecture.enabled)mountArchitecture($('#architecture-root'),architecture);
  const org=config.organization;document.title='BSR Digital · '+org.department;
  $('.hero-intro').textContent=org.department;$('.hero-desc').replaceChildren(document.createTextNode(org.parent),document.createElement('br'),document.createTextNode(org.company));
  $('.footer-main p').replaceChildren(document.createTextNode(org.department),document.createElement('br'),document.createTextNode(org.parent),document.createElement('br'),document.createTextNode(org.company));
  $('#about-content').innerHTML=org.introduction?'<p class="preserve-lines">'+esc(org.introduction)+'</p>':empty('giới thiệu','general');renderOrganization();
  $('#missions-grid').innerHTML=config.missions.length?config.missions.map((row,i)=>'<article class="mission"><span class="mission-icon">◇</span><span class="mission-number">'+String(i+1).padStart(2,'0')+'</span><h3>'+esc(row.title)+'</h3><p class="preserve-lines">'+esc(row.description)+'</p></article>').join(''):empty('chức năng, nhiệm vụ','missions');renderApplications();renderRoadmap('digital');
}
const dialog=$('#app-dialog');$('#apps-grid').addEventListener('click',event=>{const button=event.target.closest('[data-app]');if(!button||!config)return;const app=config.applications[Number(button.dataset.app)];if(!app)return;$('#dialog-content').innerHTML='<h2 id="dialog-title">'+esc(app.title)+'</h2><p class="preserve-lines">'+esc(app.description)+'</p>'+(app.status?'<p class="dialog-note">'+esc(app.status)+'</p>':'')+(safeUrl(app.url)?'<a class="button dark" target="_blank" rel="noopener noreferrer" href="'+esc(safeUrl(app.url))+'">Mở ứng dụng ↗</a>':'');dialog.setAttribute('aria-labelledby','dialog-title');dialog.showModal();});
$('.dialog-close').addEventListener('click',()=>dialog.close());$('.dialog-done').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
const tabs=[...document.querySelectorAll('[data-roadmap]')];tabs.forEach((tab,i)=>{tab.addEventListener('click',()=>{if(config)renderRoadmap(tab.dataset.roadmap);});tab.addEventListener('keydown',e=>{const next=e.key==='Home'?tabs[0]:e.key==='End'?tabs[1]:['ArrowLeft','ArrowRight'].includes(e.key)?tabs[1-i]:null;if(next&&config){e.preventDefault();next.focus();renderRoadmap(next.dataset.roadmap);}});});
const menu=$('.menu-toggle'),nav=$('#navigation');function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','Mở menu');}menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Đóng menu':'Mở menu');});nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus();}});
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting)nav.querySelectorAll('a').forEach(link=>{const active=link.hash==='#'+entry.target.id;link.classList.toggle('current',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});},{rootMargin:'-20% 0px -60% 0px'});document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section));}
try{const loaded=await loadConfig();config=loaded.config;render();}catch(error){const notice=document.createElement('p');notice.className='load-error';notice.setAttribute('role','alert');notice.textContent=error.message;document.querySelector('main').prepend(notice);}
