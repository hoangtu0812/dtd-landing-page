const apps = [
  {id:'workplace',name:'Không gian làm việc số',category:'office',label:'QUẢN TRỊ & ĐIỀU HÀNH',icon:'▦',phase:'Thí điểm · 2027',description:'Một điểm chạm cho công việc, phê duyệt và phối hợp giữa các đơn vị.',features:['Quản lý và theo dõi công việc theo nhóm','Luồng phê duyệt nghiệp vụ trực tuyến','Không gian phối hợp và trao đổi nội bộ']},
  {id:'dashboard',name:'Báo cáo điều hành thông minh',category:'data',label:'DỮ LIỆU & PHÂN TÍCH',icon:'▥',phase:'Thí điểm · 2027',description:'Trực quan hoá chỉ số, kết nối dữ liệu và hỗ trợ quyết định điều hành.',features:['Tổng hợp các chỉ số theo nhu cầu quản trị','Dashboard trực quan theo vai trò','Theo dõi xu hướng và cảnh báo theo ngưỡng']},
  {id:'assistant',name:'Trợ lý tri thức AI',category:'data',label:'TRÍ TUỆ NHÂN TẠO',icon:'✦',phase:'Nghiên cứu · 2027',description:'Tra cứu tri thức nội bộ và hỗ trợ tìm kiếm thông tin bằng ngôn ngữ tự nhiên.',features:['Tìm kiếm trong nguồn tài liệu được phê duyệt','Trả lời kèm tham chiếu đến tài liệu nguồn','Phân quyền truy cập theo nguồn tri thức']},
  {id:'assets',name:'Quản lý tài sản & bảo trì',category:'operations',label:'VẬN HÀNH SỐ',icon:'⚙',phase:'Đề xuất · 2028',description:'Số hoá hồ sơ thiết bị, lịch bảo trì và lịch sử xử lý trên một nền tảng.',features:['Hồ sơ và danh mục thiết bị tập trung','Kế hoạch bảo trì và lệnh công việc','Lịch sử kiểm tra, sửa chữa và thay thế']},
  {id:'automation',name:'Tự động hoá quy trình',category:'office',label:'TỐI ƯU NGHIỆP VỤ',icon:'⌘',phase:'Thí điểm · 2027',description:'Giảm thao tác lặp lại, kết nối luồng công việc và chuẩn hoá dữ liệu đầu vào.',features:['Khảo sát và lựa chọn quy trình phù hợp','Tự động tổng hợp, đối soát và chuyển dữ liệu','Theo dõi nhật ký, ngoại lệ và hiệu quả xử lý']},
  {id:'datahub',name:'Nền tảng dữ liệu dùng chung',category:'data',label:'KẾT NỐI & TÍCH HỢP',icon:'◈',phase:'Đề xuất · 2028',description:'Tổ chức, chuẩn hoá và chia sẻ dữ liệu để tạo nền tảng cho các dịch vụ số.',features:['Danh mục nguồn và chuẩn dữ liệu dùng chung','Kết nối dữ liệu qua các giao diện tích hợp','Theo dõi chất lượng và kiểm soát truy cập dữ liệu']}
];
const roadmaps = {
  digital:[
    {year:'2026',label:'GIAI ĐOẠN 01',title:'Xây dựng nền tảng',items:['Khảo sát hiện trạng và nhu cầu','Đề xuất kiến trúc, chuẩn dữ liệu','Ưu tiên danh mục sáng kiến'],output:'Đầu ra: Kế hoạch tổng thể'},
    {year:'2027',label:'GIAI ĐOẠN 02',title:'Thí điểm & kết nối',items:['Thí điểm quy trình trọng tâm','Kết nối dữ liệu phục vụ báo cáo','Đào tạo kỹ năng, hình thành đội ngũ'],output:'Đầu ra: Mô hình thí điểm'},
    {year:'2028',label:'GIAI ĐOẠN 03',title:'Mở rộng & tích hợp',items:['Nhân rộng giải pháp hiệu quả','Phát triển nền tảng dữ liệu chung','Tích hợp ứng dụng theo kiến trúc'],output:'Đầu ra: Hệ sinh thái kết nối'},
    {year:'2029–30',label:'GIAI ĐOẠN 04',title:'Tối ưu & đổi mới',items:['Ứng dụng phân tích và AI phù hợp','Đo lường giá trị chuyển đổi','Cải tiến liên tục theo thực tiễn'],output:'Đầu ra: Vận hành dựa trên dữ liệu'}
  ],
  apps:[
    {year:'2026',label:'KHẢO SÁT & THIẾT KẾ',title:'Chuẩn bị triển khai',items:['Thu thập yêu cầu các đơn vị','Thiết kế không gian làm việc số','Xác định nguồn dữ liệu báo cáo'],output:'Mốc: Phạm vi & thiết kế'},
    {year:'2027',label:'THÍ ĐIỂM CÓ KIỂM SOÁT',title:'Đưa vào thử nghiệm',items:['Không gian làm việc số, dashboard','Thí điểm tự động hoá quy trình','Nghiên cứu trợ lý tri thức AI'],output:'Mốc: Đánh giá thử nghiệm'},
    {year:'2028',label:'TÍCH HỢP & NHÂN RỘNG',title:'Kết nối hệ sinh thái',items:['Triển khai nền tảng dữ liệu chung','Thí điểm quản lý tài sản & bảo trì','Mở rộng ứng dụng đã được đánh giá'],output:'Mốc: Nghiệm thu theo phạm vi'},
    {year:'2029–30',label:'VẬN HÀNH & CẢI TIẾN',title:'Nâng cao trải nghiệm',items:['Tối ưu hiệu năng và trải nghiệm','Mở rộng AI theo kết quả thí điểm','Đánh giá hiệu quả, cập nhật sản phẩm'],output:'Mốc: Cải tiến theo chu kỳ'}
  ]
};
const grid=document.querySelector('#apps-grid');
grid.innerHTML=apps.map(app=>`<article class="app-card" data-category="${app.category}"><div class="app-art" data-kind="${app.category}" aria-hidden="true"><div class="mini-window"><div class="mini-top"><i></i><i></i><i></i></div><div class="mini-body"><div class="mini-side"></div><div class="mini-content"><i style="--bar:35%;--opacity:.35"></i><i style="--bar:57%;--opacity:.5"></i><i style="--bar:45%;--opacity:.65"></i><i style="--bar:76%"></i><i style="--bar:95%;--opacity:1"></i></div></div></div><span class="art-orbit">${app.icon}</span></div><div class="app-content"><span class="app-category">${app.label}</span><h3>${app.name}</h3><p>${app.description}</p><div class="app-footer"><span class="status-badge">${app.phase}</span><button class="app-detail" data-app="${app.id}" aria-label="Xem chi tiết ${app.name}">Tìm hiểu thêm <span>↗</span></button></div></div></article>`).join('');
document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('.filter').forEach(item=>{item.classList.toggle('active',item===button);item.setAttribute('aria-pressed',String(item===button));});
  let count=0;document.querySelectorAll('.app-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter;if(!card.hidden)count++;});
  document.querySelector('#filter-status').textContent=`Đang hiển thị ${count} ứng dụng đề xuất.`;
}));
const dialog=document.querySelector('#app-dialog');
grid.addEventListener('click',event=>{
  const button=event.target.closest('[data-app]');if(!button)return;const app=apps.find(item=>item.id===button.dataset.app);
  document.querySelector('#dialog-content').innerHTML=`<h2 id="dialog-title">${app.name}</h2><p>${app.description}</p><h3>Phạm vi chức năng gợi ý</h3><ul>${app.features.map(feature=>`<li>${feature}</li>`).join('')}</ul><p class="dialog-note">Nội dung minh hoạ · ${app.phase}. Chức năng và thời gian sẽ được xác định sau khi thống nhất nhu cầu, nguồn lực và kế hoạch thực tế.</p>`;
  dialog.setAttribute('aria-labelledby','dialog-title');dialog.showModal();
});
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
document.querySelector('.dialog-done').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
const tabs=[...document.querySelectorAll('[data-roadmap]')];
function showRoadmap(kind){
  tabs.forEach(tab=>{const active=tab.dataset.roadmap===kind;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;});
  const panel=document.querySelector('#roadmap-panel');panel.setAttribute('aria-labelledby',`tab-${kind}`);
  panel.innerHTML=`<div class="timeline">${roadmaps[kind].map(phase=>`<article class="phase"><div class="phase-year">${phase.year}</div><div class="phase-line"></div><span class="phase-label">${phase.label}</span><h3>${phase.title}</h3><ul>${phase.items.map(item=>`<li>${item}</li>`).join('')}</ul><div class="phase-deliverable">${phase.output}</div></article>`).join('')}</div>`;
}
tabs.forEach((tab,index)=>{tab.addEventListener('click',()=>showRoadmap(tab.dataset.roadmap));tab.addEventListener('keydown',event=>{let next;if(event.key==='ArrowRight'||event.key==='ArrowLeft')next=tabs[1-index];else if(event.key==='Home')next=tabs[0];else if(event.key==='End')next=tabs[tabs.length-1];if(next){event.preventDefault();next.focus();showRoadmap(next.dataset.roadmap);}});});showRoadmap('digital');
const menuButton=document.querySelector('.menu-toggle'),nav=document.querySelector('#navigation');
function closeMenu(){nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','Mở menu');}
menuButton.addEventListener('click',()=>{const open=nav.classList.toggle('open');menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'Đóng menu':'Mở menu');});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){closeMenu();menuButton.focus();}});
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){nav.querySelectorAll('a').forEach(link=>{const active=link.hash===`#${entry.target.id}`;link.classList.toggle('current',active);if(active)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});}});},{rootMargin:'-20% 0px -60% 0px'});document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section));}
const avatarInput=document.querySelector('#leader-avatar'),avatarImage=document.querySelector('#avatar-preview'),avatarPlaceholder=document.querySelector('#avatar-placeholder'),avatarStatus=document.querySelector('#avatar-status'),avatarRemove=document.querySelector('#avatar-remove');
function displayAvatar(value){avatarImage.src=value;avatarImage.hidden=false;avatarPlaceholder.hidden=true;avatarRemove.hidden=false;document.querySelector('#avatar-trigger').textContent='Thay ảnh đại diện ↗';}
try{const saved=localStorage.getItem('bsr-leader-avatar');if(saved&&/^data:image\/(jpeg|png|webp);base64,/.test(saved))displayAvatar(saved);}catch{/* Local storage may be restricted by the browser. */}
document.querySelector('#avatar-trigger').addEventListener('click',()=>avatarInput.click());
avatarInput.addEventListener('change',()=>{
  const file=avatarInput.files[0];if(!file)return;
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){avatarStatus.textContent='Vui lòng chọn ảnh JPG, PNG hoặc WebP không quá 5 MB.';avatarInput.value='';return;}
  const reader=new FileReader();reader.onload=()=>{const image=new Image();image.onload=()=>{const canvas=document.createElement('canvas');canvas.width=320;canvas.height=360;const ctx=canvas.getContext('2d');const ratio=Math.max(320/image.width,360/image.height);ctx.drawImage(image,(320-image.width*ratio)/2,(360-image.height*ratio)/2,image.width*ratio,image.height*ratio);const data=canvas.toDataURL('image/jpeg',.86);displayAvatar(data);try{localStorage.setItem('bsr-leader-avatar',data);avatarStatus.textContent='Đã lưu ảnh trên trình duyệt này. Ảnh chưa được đăng lên máy chủ.';}catch{avatarStatus.textContent='Ảnh chỉ hiển thị trong phiên này vì trình duyệt không cho phép lưu.';}avatarInput.value='';};image.onerror=()=>{avatarStatus.textContent='Không đọc được ảnh. Vui lòng thử một tệp khác.';};image.src=reader.result;};reader.onerror=()=>{avatarStatus.textContent='Không đọc được tệp. Vui lòng thử lại.';};reader.readAsDataURL(file);
});
avatarRemove.addEventListener('click',()=>{try{localStorage.removeItem('bsr-leader-avatar');}catch{}avatarImage.removeAttribute('src');avatarImage.hidden=true;avatarPlaceholder.hidden=false;avatarRemove.hidden=true;document.querySelector('#avatar-trigger').textContent='Thêm ảnh đại diện ↗';avatarStatus.textContent='Đã xoá ảnh xem thử. Bạn có thể thêm avatar mới.';});
