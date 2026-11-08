/* Optional authenticated cloud backup. The default app stays entirely local. */
(() => {
  'use strict';
  const config=globalThis.COMPASS_CONFIG||{};
  const SESSION_KEY='surah-compass-cloud-session';
  const store=globalThis.CompanionStore;
  const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ur=()=>store?.settings().uiLanguage==='ur';
  const tr=(en,urdu)=>ur()?urdu:en;
  let session=null,busy=false,message='',pending=null;
  let enabled=false;
  try{const url=new URL(config.supabaseUrl);enabled=url.protocol==='https:'&&/^[a-z0-9-]+\.supabase\.co$/.test(url.hostname)&&!url.username&&!url.password&&typeof config.supabaseAnonKey==='string'&&config.supabaseAnonKey.length>20;}catch{}
  try{const value=JSON.parse(localStorage.getItem(SESSION_KEY));if(value&&typeof value.access_token==='string'&&typeof value.refresh_token==='string')session=value;}catch{}
  async function api(endpoint,{method='GET',body,auth=false,headers={}}={}){
    if(!enabled)throw new Error(tr('Cloud sync has not been enabled by the app owner.','ایپ کے منتظم نے کلاؤڈ سنک فعال نہیں کیا۔'));
    if(auth){if(!session)throw new Error(tr('Sign in first.','پہلے سائن اِن کریں۔'));if(session.expires_at&&session.expires_at<Date.now()/1000+60)await refreshToken();}
    const response=await fetch(config.supabaseUrl.replace(/\/$/,'')+endpoint,{method,headers:{apikey:config.supabaseAnonKey,'Content-Type':'application/json',...(auth?{Authorization:'Bearer '+session.access_token}:{}),...headers},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)});
    let result=null;const text=await response.text();if(text)try{result=JSON.parse(text);}catch{}
    if(!response.ok){if(response.status===401&&auth){session=null;try{localStorage.removeItem(SESSION_KEY);}catch{}}throw new Error(response.status===429?tr('Too many requests. Please wait a little.','بہت زیادہ درخواستیں۔ تھوڑی دیر بعد کوشش کریں۔'):response.status===401?tr('Your sign-in expired. Sign in again.','سائن اِن ختم ہو گیا۔ دوبارہ سائن اِن کریں۔'):tr('Cloud request failed. Check the connection and cloud setup.','کلاؤڈ درخواست ناکام ہوئی۔ انٹرنیٹ اور کلاؤڈ کی ترتیب چیک کریں۔'));}
    return result;
  }
  function saveSession(data){if(!data||typeof data.access_token!=='string'||typeof data.refresh_token!=='string'||!data.user?.id)throw new Error('Invalid sign-in response');session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at||Math.floor(Date.now()/1000)+(data.expires_in||3600),user:{id:data.user.id,email:data.user.email||''}};try{localStorage.setItem(SESSION_KEY,JSON.stringify(session));}catch{message=tr('Signed in for this visit only. Browser storage is unavailable.','صرف اس نشست میں سائن اِن ہوا۔ براؤزر کا ذخیرہ دستیاب نہیں۔');}}
  async function refreshToken(){try{const data=await api('/auth/v1/token?grant_type=refresh_token',{method:'POST',body:{refresh_token:session.refresh_token}});saveSession(data);}catch{session=null;pending=null;try{localStorage.removeItem(SESSION_KEY);}catch{}throw new Error(tr('Your sign-in expired. Sign in again.','سائن اِن ختم ہو گیا۔ دوبارہ سائن اِن کریں۔'));}}
  async function action(fn){if(busy)return;busy=true;message=tr('Working…','انتظار کریں…');mount();try{await fn();}catch(error){message=error.message||tr('The connection failed. Try again.','رابطہ ناکام ہوا۔ دوبارہ کوشش کریں۔');}finally{busy=false;mount();}}
  async function signIn(email){await api('/auth/v1/otp?redirect_to='+encodeURIComponent(location.origin+location.pathname),{method:'POST',body:{email,create_user:true}});message=tr('Check your email for the secure sign-in link. Open it on this device.','اپنی ای میل میں محفوظ سائن اِن لنک دیکھیں۔ اسے اسی ڈیوائس پر کھولیں۔');}
  async function upload(){
    const backup=store.validateBackup(store.exportBackup());
    if(JSON.stringify(backup).length>5*1024*1024)throw new Error(tr('This backup is too large for cloud sync. Export a local file instead.','یہ بیک اپ کلاؤڈ کے لیے بہت بڑا ہے۔ مقامی فائل برآمد کریں۔'));
    // The database enforces auth.uid() = user_id with RLS, configured in cloud-setup.sql.
    await api('/rest/v1/compass_backups?on_conflict=user_id',{method:'POST',auth:true,headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:{user_id:session.user.id,payload:backup,updated_at:new Date().toISOString()}});
    message=tr('Your current progress is backed up. You can restore it on another signed-in device.','موجودہ پیشرفت کا بیک اپ بن گیا۔ دوسرے سائن اِن ڈیوائس پر بحال کر سکتے ہیں۔');
  }
  async function load(){const rows=await api('/rest/v1/compass_backups?select=payload,updated_at&user_id=eq.'+encodeURIComponent(session.user.id),{auth:true});if(!Array.isArray(rows)||!rows.length){message=tr('There is no cloud backup yet. Back up this device first.','ابھی کلاؤڈ بیک اپ نہیں۔ پہلے اس ڈیوائس کا بیک اپ بنائیں۔');return;}pending=store.validateBackup(rows[0].payload);message=tr('Cloud backup loaded. Review it below before replacing this device.','کلاؤڈ بیک اپ مل گیا۔ اس ڈیوائس کی پیشرفت بدلنے سے پہلے نیچے دیکھیں۔');}
  async function signOut(){try{await api('/auth/v1/logout',{method:'POST',auth:true});}catch{}session=null;pending=null;try{localStorage.removeItem(SESSION_KEY);}catch{}message=tr('Signed out. Your local progress is still here.','سائن آؤٹ ہو گیا۔ مقامی پیشرفت موجود ہے۔');}
  function mount(){
    const panel=document.getElementById('cloud-sync-panel');if(!panel||!store)return;
    panel.className='cloud-section';
    if(!enabled){panel.innerHTML=`<h3>${tr('Carry your journey to another device','اپنا سفر دوسرے ڈیوائس پر لے جائیں')}</h3><p>${tr('Export a backup above, then import it on your other device. Password-protected backups are available. Account-based cloud backup can also be enabled by the app owner.','اوپر سے بیک اپ برآمد کرکے دوسرے ڈیوائس پر درآمد کریں۔ پاس ورڈ سے محفوظ بیک اپ بھی دستیاب ہے۔ منتظم اکاؤنٹ کے ساتھ کلاؤڈ بیک اپ بھی فعال کر سکتا ہے۔')}</p>`;return;}
    const pendingCount=pending?Object.values(pending.learning.surahs).reduce((n,s)=>n+s.readAyahs.length,0):0;
    panel.innerHTML=`<h3>${tr('Your journey, across devices','آپ کا سفر، ہر ڈیوائس پر')}</h3><p>${tr('Sign in with an email link to save a private cloud backup of your progress, notes, bookmarks, and compass cycle. Quran and audio packs stay on each device.','ای میل لنک سے سائن اِن کرکے پیشرفت، یادداشتوں، نشانات اور کمپاس کا نجی کلاؤڈ بیک اپ بنائیں۔ قرآن اور آڈیو پیک ہر ڈیوائس پر الگ رہتے ہیں۔')}</p>${session?`<p>${tr('Signed in as','سائن اِن:')} <strong>${esc(session.user?.email||'')}</strong></p><div class="cloud-actions"><button class="primary-button" data-cloud="upload" ${busy?'disabled':''}>${tr('Back up to cloud','کلاؤڈ بیک اپ')}</button><button class="secondary-button" data-cloud="load" ${busy?'disabled':''}>${tr('Load cloud backup','کلاؤڈ بیک اپ کھولیں')}</button><button class="text-button" data-cloud="logout" ${busy?'disabled':''}>${tr('Sign out','سائن آؤٹ')}</button></div>`:`<form id="cloud-email-form"><label class="sr-only" for="cloud-email">Email</label><input id="cloud-email" type="email" autocomplete="email" placeholder="${tr('Your email address','آپ کا ای میل پتہ')}" required maxlength="254"><button class="primary-button" ${busy?'disabled':''}>${tr('Email me a sign-in link','سائن اِن لنک بھیجیں')}</button></form>`}<p class="cloud-status" role="status">${esc(message)}</p>${pending?`<div class="cloud-warning"><p>${tr('Backup date','بیک اپ کی تاریخ')}: ${esc(new Date(pending.createdAt).toLocaleString(ur()?'ur-PK':'en-GB'))}<br>${pendingCount} ${tr('ayahs read','پڑھی ہوئی آیات')} · ${pending.learning.bookmarks.length} ${tr('bookmarks and notes','نشانات اور یادداشتیں')}</p><p>${tr('Restoring replaces progress on this device. Download a local backup first if you want to keep both. Cloud backup is manual; back up the active device before switching devices.','بحالی اس ڈیوائس کی پیشرفت بدل دیتی ہے۔ دونوں رکھنا چاہیں تو پہلے مقامی بیک اپ بنا لیں۔ کلاؤڈ بیک اپ دستی ہے؛ ڈیوائس بدلنے سے پہلے فعال ڈیوائس کا بیک اپ بنائیں۔')}</p><div class="cloud-actions"><button class="primary-button" data-cloud="restore">${tr('Restore this backup','یہ بیک اپ بحال کریں')}</button><button class="secondary-button" data-cloud="cancel">${tr('Keep this device','موجودہ پیشرفت رکھیں')}</button></div></div>`:''}`;
    panel.querySelector('form')?.addEventListener('submit',event=>{event.preventDefault();const email=panel.querySelector('#cloud-email').value.trim();if(email)action(()=>signIn(email));});
    panel.querySelectorAll('[data-cloud]').forEach(button=>button.addEventListener('click',()=>{switch(button.dataset.cloud){case'upload':action(upload);break;case'load':action(load);break;case'logout':action(signOut);break;case'cancel':pending=null;mount();break;case'restore':if(pending){try{store.importBackup(pending);pending=null;message=tr('Cloud backup restored on this device.','کلاؤڈ بیک اپ اس ڈیوائس پر بحال ہو گیا۔');mount();}catch(error){message=error.message;mount();}}break;}}));
  }
  async function acceptLink(){
    if(!location.hash.includes('access_token=')&&!location.hash.includes('refresh_token='))return;
    const params=new URLSearchParams(location.hash.slice(1));const access=params.get('access_token'),refresh=params.get('refresh_token');
    // Remove tokens from the visible URL before any external navigation.
    history.replaceState(null,'',location.pathname+location.search+'#settings');
    if(!enabled||!access||!refresh){message=tr('This sign-in link is incomplete or cloud backup is not enabled.','یہ سائن اِن لنک نامکمل ہے یا کلاؤڈ بیک اپ فعال نہیں۔');globalThis.CompassApp?.navigate('settings');mount();return;}
    try{const response=await fetch(config.supabaseUrl.replace(/\/$/,'')+'/auth/v1/user',{headers:{apikey:config.supabaseAnonKey,Authorization:'Bearer '+access},signal:AbortSignal.timeout(30000)});if(!response.ok)throw new Error('Invalid sign-in link');const user=await response.json();saveSession({access_token:access,refresh_token:refresh,expires_in:Number(params.get('expires_in'))||3600,user});message=tr('Signed in. Your cloud backup is private to this account.','سائن اِن ہو گیا۔ کلاؤڈ بیک اپ صرف اس اکاؤنٹ کا ہے۔');globalThis.CompassApp?.navigate('settings');mount();}catch{message=tr('The sign-in link expired or could not be verified. Request a new link.','سائن اِن لنک ختم ہو گیا یا تصدیق نہیں ہوئی۔ نیا لنک حاصل کریں۔');mount();}
  }
  globalThis.CompassSync={mount,enabled:()=>enabled};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{mount();acceptLink();},{once:true});else{mount();acceptLink();}
})();
