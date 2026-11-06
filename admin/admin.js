import {createArchitectureEditor} from '/admin/assets/architecture-editor.js';
import {loadConfig,validateConfig,clone} from '/data-model.mjs';
import {prepareArchitectureLogo} from '/admin/assets/logo-upload.js';
const $=selector=>document.querySelector(selector);
const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let draft,mode,revision,dirty=false,pendingDelete=null,avatarJobs=0,architectureJobs=0,architectureEditor;
const labels={people:'Nhân sự / nhóm',missions:'Nhiệm vụ',applications:'Ứng dụng',digitalRoadmap:'Mốc chuyển đổi số',applicationRoadmap:'Mốc ứng dụng'};
const schemas={
  missions:[['title','Tên nhiệm vụ',180],['description','Mô tả nhiệm vụ',2000,'textarea']],
  applications:[['title','Tên ứng dụng',180],['category','Nhóm ứng dụng',100],['status','Trạng thái triển khai',100],['url','Đường dẫn ứng dụng',1500,'url'],['description','Mô tả',2000,'textarea']],
  digitalRoadmap:[['period','Thời gian / giai đoạn',80],['title','Tên mốc',180],['description','Nội dung triển khai',2000,'textarea']],
  applicationRoadmap:[['period','Thời gian / giai đoạn',80],['title','Tên mốc',180],['description','Nội dung triển khai',2000,'textarea']]
};
function message(text,type=''){const el=$('#editor-message');el.textContent=text;el.className=type;}
function markDirty(){dirty=true;$('#save-state').textContent='Có thay đổi chưa lưu';$('#save-state').classList.add('unsaved');message('Bấm Lưu cấu hình để áp dụng thay đổi.');}
function field(name,label,value,max,type='text',required=false){
  const attr=' data-field="'+name+'" maxlength="'+max+'"'+(required?' required':'');
  return '<label'+(type==='textarea'?' class="full-width"':'')+'>'+label+(required?' *':'')+(type==='textarea'?'<textarea rows="3"'+attr+'>'+esc(value)+'</textarea>':'<input type="'+type+'" value="'+esc(value)+'"'+attr+'>')+'</label>';
}
function descendants(id){const found=new Set([id]);let changed=true;while(changed){changed=false;for(const p of draft.people)if(found.has(p.parentId)&&!found.has(p.id)){found.add(p.id);changed=true;}}return found;}
function parentOptions(person){const excluded=descendants(person.id);return '<option value="">Trực thuộc phòng</option>'+draft.people.filter(p=>!excluded.has(p.id)).map(p=>'<option value="'+esc(p.id)+'"'+(person.parentId===p.id?' selected':'')+'>'+esc(p.name||'Chưa nhập tên')+'</option>').join('');}
function header(key,index,row){
  return '<div class="edit-card-head"><h3><span class="row-title">'+esc(row.name||row.title||labels[key]+' mới')+'</span></h3><div class="row-actions"><button type="button" class="icon-button" data-move="-1" aria-label="Di chuyển lên"'+(index===0?' disabled':'')+'>↑</button><button type="button" class="icon-button" data-move="1" aria-label="Di chuyển xuống"'+(index===draft[key].length-1?' disabled':'')+'>↓</button><button type="button" class="icon-button delete-button" data-delete aria-label="Xoá '+esc(row.name||row.title||labels[key])+'">×</button></div></div>';
}
function renderList(key){
  const container=$('#'+key+'-list');
  if(!draft[key].length){container.innerHTML='<p class="empty-editor">Chưa có nội dung. Bấm “Thêm” để bắt đầu.</p>';return;}
  container.innerHTML=draft[key].map((row,index)=>{
    const open='<article class="edit-card" data-list="'+key+'" data-index="'+index+'">'+header(key,index,row);
    const logoEditor=key!=='applications'?'':'<div class="avatar-editor">'+(row.logo?'<img src="'+esc(row.logo)+'" alt="Logo '+esc(row.title)+'" style="object-fit:contain;background:#fff">':'<span class="avatar-fallback" aria-label="Chưa có logo">⌘</span>')+'<div class="avatar-controls"><label class="secondary import-label">'+(row.logo?'Thay logo':'Thêm logo')+'<input type="file" data-app-logo accept="image/jpeg,image/png,image/webp" aria-label="Chọn logo cho '+esc(row.title||'ứng dụng mới')+'"></label>'+(row.logo?'<button type="button" class="text-button" data-remove-logo>Xoá logo</button>':'')+'<small>PNG, JPG, WebP · Tối đa 5 MB · Ảnh được thu nhỏ khi lưu</small></div></div>';
    if(key!=='people')return open+logoEditor+'<div class="fields-grid">'+schemas[key].map(([name,label,max,type])=>field(name,label,row[name],max,type,name==='title')).join('')+'</div></article>';
    return open+'<div class="avatar-editor">'+(row.avatar?'<img src="'+esc(row.avatar)+'" alt="Avatar '+esc(row.name)+'">':'<span class="avatar-fallback" aria-label="Chưa có ảnh">♙</span>')+'<div class="avatar-controls"><label class="secondary import-label">'+(row.avatar?'Thay ảnh':'Thêm avatar')+'<input type="file" data-avatar accept="image/jpeg,image/png,image/webp" aria-label="Chọn avatar cho '+esc(row.name||'mục mới')+'"></label>'+(row.avatar?'<button type="button" class="text-button" data-remove-avatar>Xoá ảnh</button>':'')+'<small>JPG, PNG, WebP · Tối đa 5 MB · Ảnh được thu nhỏ khi lưu</small></div></div><div class="fields-grid"><label>Loại mục<select data-field="type"><option value="person"'+(row.type==='person'?' selected':'')+'>Nhân sự</option><option value="team"'+(row.type==='team'?' selected':'')+'>Nhóm / bộ phận</option></select></label>'+field('name','Họ tên / Tên nhóm',row.name,150,'text',true)+field('title','Chức danh / Vai trò',row.title,160)+'<label>Trực thuộc<select data-field="parentId">'+parentOptions(row)+'</select></label>'+field('description','Mô tả / Phụ trách',row.description,1200,'textarea')+'</div></article>';
  }).join('');
}
function render(){document.querySelectorAll('[data-org]').forEach(input=>{input.value=draft.organization[input.dataset.org];});Object.keys(labels).forEach(renderList);architectureEditor?.destroy();architectureEditor=createArchitectureEditor($('#architecture-editor'),{getValue:()=>draft.architecture,onChange:markDirty,onMessage:message,onBusy:delta=>{architectureJobs+=delta;$('#save-config').disabled=avatarJobs+architectureJobs>0;}});}
function refreshParents(){document.querySelectorAll('[data-list="people"]').forEach(card=>{const person=draft.people[Number(card.dataset.index)];card.querySelector('[data-field="parentId"]').innerHTML=parentOptions(person);});}
$('#config-form').addEventListener('input',event=>{
  const target=event.target;if(target.dataset.org){draft.organization[target.dataset.org]=target.value;markDirty();return;}
  const card=target.closest('[data-list]');if(!card||!target.dataset.field)return;
  const row=draft[card.dataset.list][Number(card.dataset.index)];row[target.dataset.field]=target.value;
  if(['name','title'].includes(target.dataset.field))card.querySelector('.row-title').textContent=row.name||row.title||labels[card.dataset.list]+' mới';
  markDirty();
});
$('#config-form').addEventListener('change',event=>{if(event.target.matches('[data-field="name"],[data-field="parentId"]'))refreshParents();});
document.querySelectorAll('[data-add]').forEach(button=>button.addEventListener('click',()=>{
  const key=button.dataset.add;if(draft[key].length>=80){message('Mỗi danh sách hỗ trợ tối đa 80 mục.','error');return;}
  let row;if(key==='people')row={id:'node-'+crypto.randomUUID(),name:'',title:'',type:'person',parentId:'',description:'',avatar:''};else row=Object.fromEntries(schemas[key].map(([name])=>[name,'']));
  draft[key].push(row);renderList(key);markDirty();$('#'+key+'-list').lastElementChild.querySelector(key==='people'?'[data-field="name"]':'[data-field="title"]').focus();
}));
$('#config-form').addEventListener('click',event=>{
  const card=event.target.closest('[data-list]');if(!card)return;const key=card.dataset.list,index=Number(card.dataset.index),row=draft[key][index];
  if(event.target.closest('[data-delete]')){pendingDelete={key,index};$('#delete-description').textContent='Xoá “'+(row.name||row.title||labels[key])+'”'+(key==='people'&&draft.people.some(p=>p.parentId===row.id)?'. Các mục trực thuộc sẽ được chuyển lên cấp trên của mục này.':'.');$('#delete-dialog').showModal();}
  const move=event.target.closest('[data-move]');if(move){const next=index+Number(move.dataset.move);if(next>=0&&next<draft[key].length){[draft[key][index],draft[key][next]]=[draft[key][next],draft[key][index]];renderList(key);markDirty();$('#'+key+'-list').children[next].querySelector('.icon-button:not(:disabled)').focus();}}
  if(event.target.closest('[data-remove-avatar]')){row.avatar='';renderList('people');markDirty();}
  if(event.target.closest('[data-remove-logo]')){row.logo='';renderList('applications');markDirty();}
});
$('#cancel-delete').addEventListener('click',()=>{$('#delete-dialog').close();pendingDelete=null;});
$('#confirm-delete').addEventListener('click',()=>{if(!pendingDelete)return;const {key,index}=pendingDelete;const row=draft[key][index];if(key==='people')draft.people.forEach(p=>{if(p.parentId===row.id)p.parentId=row.parentId;});draft[key].splice(index,1);renderList(key);markDirty();pendingDelete=null;$('#delete-dialog').close();});
async function resizeAvatar(file){
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Chọn ảnh JPG, PNG hoặc WebP không quá 5 MB.');
  const url=URL.createObjectURL(file);try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=320;canvas.height=360;const context=canvas.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,320,360);const ratio=Math.max(320/image.width,360/image.height);context.drawImage(image,(320-image.width*ratio)/2,(360-image.height*ratio)/2,image.width*ratio,image.height*ratio);return canvas.toDataURL('image/jpeg',.85);}finally{URL.revokeObjectURL(url);}
}
$('#people-list').addEventListener('change',async event=>{
  if(!event.target.matches('[data-avatar]'))return;const file=event.target.files[0];if(!file)return;
  const id=draft.people[Number(event.target.closest('[data-index]').dataset.index)].id;avatarJobs++;$('#save-config').disabled=true;message('Đang xử lý ảnh…');
  try{const avatar=await resizeAvatar(file);const person=draft.people.find(p=>p.id===id);if(person){person.avatar=avatar;renderList('people');markDirty();}}catch(error){message(error.message||'Không đọc được tệp ảnh.','error');}finally{avatarJobs--;$('#save-config').disabled=avatarJobs+architectureJobs>0;}
});
$('#applications-list').addEventListener('change',async event=>{
  if(!event.target.matches('[data-app-logo]'))return;const file=event.target.files[0];if(!file)return;
  const app=draft.applications[Number(event.target.closest('[data-index]').dataset.index)];avatarJobs++;$('#save-config').disabled=true;message('Đang xử lý logo…');
  try{const logo=await prepareArchitectureLogo(file);if(draft.applications.includes(app)){app.logo=logo;renderList('applications');markDirty();}}catch(error){message(error.message||'Không đọc được tệp logo.','error');}finally{avatarJobs--;$('#save-config').disabled=avatarJobs+architectureJobs>0;}
});
$('#config-form').addEventListener('submit',async event=>{
  event.preventDefault();if(avatarJobs+architectureJobs){message('Vui lòng đợi xử lý ảnh hoàn tất.','error');return;}const save=$('#save-config');save.disabled=true;
  try{
    const config=validateConfig(draft);
    if(mode==='file'){const response=await fetch('/api/config',{method:'PUT',headers:{'Content-Type':'application/json','If-Match':revision},body:JSON.stringify(config)});const data=await response.json();if(!response.ok)throw new Error(data.error||'Không lưu được cấu hình.');revision=data.revision;}
    else {throw new Error('Chỉ quản trị viên đã đăng nhập trên máy chủ local mới được lưu.');}
    draft=clone(config);dirty=false;$('#save-state').textContent='Đã lưu';$('#save-state').classList.remove('unsaved');message(mode==='file'?'Đã lưu vào tệp trên máy. Mở trang giới thiệu để xem kết quả.':'Đã lưu trên trình duyệt này. Bản online dùng chung chưa thay đổi.','success');
  }catch(error){message(error.name==='QuotaExceededError'?'Bộ nhớ trình duyệt đã đầy. Hãy xuất cấu hình để giữ lại dữ liệu và giảm số ảnh.':error.message,'error');}finally{save.disabled=false;}
});
function downloadConfig(config){const url=URL.createObjectURL(new Blob([JSON.stringify(config,null,2)+'\n'],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='site-config.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('#export-config').addEventListener('click',()=>{if(!draft)return;if(avatarJobs+architectureJobs){message('Vui lòng đợi xử lý ảnh hoàn tất.','error');return;}try{downloadConfig(validateConfig(draft));message('Đã xuất cấu hình hiện tại. Nếu có chỉnh sửa chưa lưu, hãy bấm Lưu cấu hình.','success');}catch(error){message(error.message,'error');}});
$('#import-config').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;try{if(avatarJobs+architectureJobs)throw new Error('Vui lòng đợi xử lý ảnh hoàn tất.');if(file.size>8*1024*1024)throw new Error('Tệp cấu hình không được vượt quá 8 MB.');const config=validateConfig(JSON.parse(await file.text()));draft=clone(config);render();markDirty();message('Đã nhập vào biểu mẫu. Kiểm tra thông tin rồi bấm Lưu cấu hình để áp dụng.');}catch(error){message('Không nhập được cấu hình: '+error.message,'error');}finally{event.target.value='';}});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
try{const session=await fetch('/api/admin-session',{cache:'no-store'});if(!session.ok)throw new Error('Vui lòng đăng nhập lại tại /admin.');const loaded=await loadConfig();if(loaded.mode!=='file')throw new Error('Máy chủ local chưa sẵn sàng.');draft=clone(loaded.config);mode=loaded.mode;revision=loaded.revision;render();$('#editor-fields').disabled=false;$('#save-config').disabled=false;$('#save-state').textContent='Đã tải cấu hình';$('#storage-note').textContent=mode==='file'?'Lưu trên máy: các thay đổi sẽ được ghi vào tệp site-config.json khi bấm Lưu cấu hình. Dữ liệu được giữ lại sau khi đóng trình duyệt hoặc khởi động lại máy chủ.':'Lưu trên trình duyệt: các thay đổi chỉ áp dụng trên thiết bị và trình duyệt này. Dùng Xuất/Nhập cấu hình để chuyển dữ liệu. Muốn cập nhật bản online cho mọi người, cần xuất cấu hình và triển khai lại website.';}catch(error){message(error.message,'error');$('#storage-note').textContent='Không tải được cấu hình. Hãy tải lại trang hoặc kiểm tra kết nối.';$('#save-state').textContent='Chưa tải được dữ liệu';}

$('#logout').addEventListener('click',async()=>{if(dirty&&!confirm('Có thay đổi chưa lưu. Bạn muốn đăng xuất và bỏ các thay đổi này?'))return;const response=await fetch('/api/logout',{method:'POST'});if(response.ok){dirty=false;location.replace('/admin');}else message('Không đăng xuất được. Vui lòng thử lại.','error');});
