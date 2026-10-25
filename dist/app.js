import {loadConfig,safeUrl} from './data-model.mjs';
const $=selector=>document.querySelector(selector);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const empty=(label,anchor)=>'<div class="empty-state"><span class="empty-symbol">◇</span><h3>Chưa cập nhật '+label+'</h3><p>Nội dung sẽ xuất hiện tại đây sau khi được cấu hình.</p><a href="./admin.html#'+anchor+'">Cập nhật nội dung ↗</a></div>';
let config;
function renderOrganization(){
  const {organization,people}=config;
  function node(person){
    const children=people.filter(p=>p.parentId===person.id);
    const initials=person.name.trim().split(/\s+/).map(w=>w[0]).slice(-2).join('').toUpperCase();
    const avatar=person.avatar?'<img class="org-avatar" src="'+esc(person.avatar)+'" alt="Ảnh '+esc(person.name)+'">':'<div class="org-avatar org-initials" aria-hidden="true">'+(person.type==='team'?'▦':esc(initials))+'</div>';
    return '<li><article class="org-node '+(person.type==='team'?'org-team':'')+'">'+avatar+'<div><span class="role-label">'+esc(person.title||(person.type==='team'?'Nhóm / bộ phận':'Nhân sự'))+'</span><h3>'+esc(person.name)+'</h3>'+(person.description?'<p>'+esc(person.description)+'</p>':'')+'</div></article>'+(children.length?'<ul>'+children.map(node).join('')+'</ul>':'')+'</li>';
  }
  $('#org-chart').innerHTML=(organization.parent?'<div class="org-parent"><span>ĐƠN VỊ CHỦ QUẢN</span><strong>'+esc(organization.parent)+'</strong></div><div class="org-stem"></div>':'')+'<div class="org-department">'+esc(organization.department)+'</div>'+(people.length?'<ul class="org-tree">'+people.filter(p=>!p.parentId).map(node).join('')+'</ul>':empty('sơ đồ tổ chức','people'));
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
