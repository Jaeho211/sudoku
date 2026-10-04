if('serviceWorker' in navigator)window.addEventListener('load',()=>{navigator.serviceWorker.register('/sw.js').catch(error=>console.warn('오프라인 기능 등록 실패',error));});
let installPrompt;
const button=document.getElementById('install-app');
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;button.hidden=false;});
button.addEventListener('click',async()=>{if(!installPrompt)return;button.hidden=true;await installPrompt.prompt();await installPrompt.userChoice;installPrompt=null;});
window.addEventListener('appinstalled',()=>{button.hidden=true;installPrompt=null;});
const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
if(ios&&!window.matchMedia('(display-mode: standalone)').matches&&!navigator.standalone)document.getElementById('ios-install').hidden=false;
