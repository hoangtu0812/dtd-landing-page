import {emptyArchitecture,validateArchitecture} from './architecture-model.mjs';
export const defaults = {
  version: 1,
  organization: {department:'Phòng Chuyển đổi số',parent:'Ban Công nghệ thông tin và Chuyển đổi số',company:'Tổng Công ty Lọc hoá dầu Việt Nam BSR',introduction:''},
  people: [{id:'le-xuan-hien',name:'Lê Xuân Hiển',title:'Trưởng phòng',type:'person',parentId:'',description:'',avatar:''}],
  missions: [], applications: [], digitalRoadmap: [], applicationRoadmap: [], architecture: emptyArchitecture()
};
export const clone = value => JSON.parse(JSON.stringify(value));
const fail = message => {throw new Error(message);};
const text = (value,label,max=500) => typeof value==='string'&&value.length<=max ? value : fail(`${label} phải là văn bản, tối đa ${max} ký tự.`);
const image = (value,label,max) => {const data=text(value,label,max);if(data&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(data))fail(`${label} phải là ảnh PNG, JPG hoặc WebP hợp lệ.`);return data;};
export function safeUrl(value){if(!value)return '';try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)?url.href:'';}catch{return '';}}
export function validateConfig(input){
  if(!input||input.version!==1)fail('Tệp cấu hình không đúng định dạng phiên bản 1.');
  const org=input.organization;if(!org||typeof org!=='object')fail('Thiếu thông tin đơn vị.');
  const organization={department:text(org.department,'Tên phòng',200),parent:text(org.parent,'Tên ban',250),company:text(org.company,'Tên tổng công ty',300),introduction:text(org.introduction,'Giới thiệu',3000)};
  if(!organization.department.trim())fail('Vui lòng nhập tên phòng.');
  if(!Array.isArray(input.people)||input.people.length>80)fail('Sơ đồ tổ chức hỗ trợ tối đa 80 mục.');
  const ids=new Set();
  const people=input.people.map(p=>{
    if(!p||typeof p!=='object')fail('Thông tin nhân sự không hợp lệ.');
    const id=text(p.id,'Mã mục',80);if(!/^[a-zA-Z0-9_-]+$/.test(id)||ids.has(id))fail('Mã nhân sự hoặc nhóm bị trùng hoặc không hợp lệ.');ids.add(id);
    const name=text(p.name,'Tên',150);if(!name.trim())fail('Mỗi nhân sự hoặc nhóm cần có tên.');
    if(!['person','team'].includes(p.type))fail('Loại mục phải là nhân sự hoặc nhóm.');
    const avatar=text(p.avatar,'Ảnh',400000);if(avatar&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+=*$/.test(avatar))fail('Ảnh phải là PNG, JPG hoặc WebP hợp lệ.');
    return {id,name,title:text(p.title,'Chức danh',160),type:p.type,parentId:text(p.parentId,'Mục cấp trên',80),description:text(p.description,'Mô tả',1200),avatar};
  });
  const map=new Map(people.map(p=>[p.id,p]));
  for(const p of people){let current=p;const visited=new Set();while(current){if(visited.has(current.id))fail('Quan hệ cấp trên tạo thành vòng lặp. Hãy chọn một cấp trên khác.');visited.add(current.id);if(visited.size>12)fail('Sơ đồ hỗ trợ tối đa 12 cấp.');if(current.parentId&&!map.has(current.parentId))fail('Mục cấp trên không tồn tại.');current=map.get(current.parentId);}}
  function list(key,fields){if(!Array.isArray(input[key])||input[key].length>80)fail('Danh sách nội dung không hợp lệ (tối đa 80 mục).');return input[key].map(row=>{if(!row||typeof row!=='object')fail('Nội dung không hợp lệ.');const result={};for(const [field,limit] of Object.entries(fields))result[field]=text(row[field],field,limit);if(!result.title.trim())fail('Mỗi mục nội dung cần có tiêu đề.');if('url' in result&&result.url&&!safeUrl(result.url))fail('Đường dẫn ứng dụng phải bắt đầu bằng https:// hoặc http://.');return result;});}
  return {version:1,organization,people,architecture:validateArchitecture(input.architecture),missions:list('missions',{title:180,description:2000}),applications:list('applications',{title:180,description:2000,category:100,status:100,url:1500}).map((app,i)=>({...app,logo:image(input.applications[i].logo??'','Logo ứng dụng',200000)})),digitalRoadmap:list('digitalRoadmap',{period:80,title:180,description:2000}),applicationRoadmap:list('applicationRoadmap',{period:80,title:180,description:2000})};
}
export const storageKey='bsr-site-config-v2';
export async function loadConfig(){
  const localHost=['127.0.0.1','localhost','[::1]'].includes(location.hostname);
  if(localHost){try{const r=await fetch('/api/config',{cache:'no-store'});if(r.ok){const data=await r.json();return {config:validateConfig(data.config),revision:data.revision,mode:'file'};}}catch{}}
  const response=await fetch('./site-config.json',{cache:'no-store'});if(!response.ok)throw new Error('Không tải được cấu hình. Hãy chạy trang bằng node preview.mjs hoặc kiểm tra kết nối.');
  return {config:validateConfig(await response.json()),revision:null,mode:'browser'};
}
