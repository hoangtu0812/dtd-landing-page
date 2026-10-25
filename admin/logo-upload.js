export async function prepareArchitectureLogo(file){
  if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>5*1024*1024)throw new Error('Chọn logo PNG, JPG hoặc WebP không quá 5 MB.');
  const url=URL.createObjectURL(file);let timeout;
  try{const img=new Image();img.src=url;await Promise.race([img.decode(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Không đọc được logo. Hãy thử ảnh khác.')),15000);})]);
    if(!img.naturalWidth||!img.naturalHeight)throw new Error('Tệp ảnh không hợp lệ.');
    const ratio=Math.min(1,240/img.naturalWidth,160/img.naturalHeight),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*ratio));canvas.height=Math.max(1,Math.round(img.naturalHeight*ratio));
    const context=canvas.getContext('2d');if(!context)throw new Error('Trình duyệt không xử lý được ảnh.');context.drawImage(img,0,0,canvas.width,canvas.height);
    let logo=canvas.toDataURL('image/png');if(logo.length>190000)logo=canvas.toDataURL('image/webp',.9);if(logo.length>200000)throw new Error('Logo quá lớn sau khi tối ưu. Hãy chọn ảnh đơn giản hơn.');return logo;
  }catch(error){throw new Error(error.message||'Không đọc được tệp logo.');}finally{clearTimeout(timeout);URL.revokeObjectURL(url);}
}
