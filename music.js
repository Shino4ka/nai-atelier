(()=>{
'use strict';
const tracks=[{"title": "Ханнамонтана", "file": "khannamontana.mp3", "duration": 190.8538, "tint": "195,166,244", "peaks": [39, 53, 52, 53, 63, 84, 90, 93, 94, 91, 55, 88, 89, 90, 76, 72, 75, 71, 73, 90, 89, 95, 94, 93, 88, 91, 97, 91, 80, 75, 73, 72, 72, 71, 71, 71, 69, 71, 72, 73, 75, 71, 91, 94, 94, 91, 92, 90, 90, 90, 85, 89, 89, 96, 93, 86, 74, 76, 86, 90, 96, 100, 82, 24]}, {"title": "Супермаркет", "file": "supermarket.mp3", "duration": 214.4685, "tint": "124,222,208", "peaks": [62, 73, 82, 96, 95, 72, 67, 87, 91, 94, 93, 87, 93, 100, 100, 99, 99, 96, 98, 99, 98, 97, 91, 69, 74, 91, 91, 94, 87, 90, 81, 94, 99, 99, 97, 98, 99, 97, 99, 97, 94, 93, 95, 94, 91, 81, 84, 100, 100, 94, 95, 96, 94, 93, 96, 95, 95, 94, 91, 94, 93, 92, 66, 14]}, {"title": "Паки пуси", "file": "paki-pusi.mp3", "duration": 143.54605, "tint": "243,159,192", "peaks": [65, 59, 61, 58, 58, 58, 62, 85, 92, 89, 91, 89, 87, 73, 90, 89, 89, 89, 90, 89, 52, 59, 58, 88, 94, 92, 94, 92, 93, 86, 100, 91, 91, 99, 94, 76, 90, 89, 89, 90, 90, 90, 69, 58, 54, 72, 87, 94, 92, 92, 94, 83, 98, 94, 93, 95, 97, 85, 88, 98, 98, 83, 17, 14]}, {"title": "Контракт", "file": "kontrakt.mp3", "duration": 204.8, "tint": "239,197,130", "peaks": [47, 45, 71, 80, 80, 79, 78, 80, 79, 75, 79, 81, 74, 98, 95, 97, 99, 96, 90, 97, 97, 99, 96, 98, 88, 79, 82, 79, 76, 78, 81, 72, 81, 78, 77, 99, 100, 97, 97, 98, 94, 96, 97, 96, 96, 94, 71, 91, 87, 88, 88, 87, 100, 99, 97, 97, 98, 97, 96, 98, 97, 96, 95, 33]}];
const t=window.atelierText || (text=>text);
const widget=document.getElementById('musicWidget');
if(!widget)return;
const q=id=>document.getElementById(id),audio=q('atelierAudio'),panel=q('musicPanel');
const root=new URL(widget.dataset.root||'./',location.href);
const glyphs={
 play:'<path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none"/>',
 pause:'<path d="M8 5v14M16 5v14" stroke-width="4"/>',
 prev:'<path d="m17 5-9 7 9 7Z" fill="currentColor" stroke="none"/><path d="M5 5v14"/>',
 next:'<path d="m7 5 9 7-9 7Z" fill="currentColor" stroke="none"/><path d="M19 5v14"/>',
 close:'<path d="m6 6 12 12M18 6 6 18"/>',
 music:'<path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>',
 volume:'<path d="M4 9h4l5-4v14l-5-4H4ZM17 8q5 4 0 8"/>',
 muted:'<path d="M4 9h4l5-4v14l-5-4H4ZM17 9l5 6M22 9l-5 6"/>',
 shuffle:'<path d="M3 7h3c5 0 7 10 12 10h3M3 17h3c2 0 4-2 6-5M15 8c1-1 2-1 3-1h3M18 4l3 3-3 3M18 14l3 3-3 3"/>',
 repeat:'<path d="M4 10V8a3 3 0 0 1 3-3h13M17 2l3 3-3 3M20 14v2a3 3 0 0 1-3 3H4M7 16l-3 3 3 3"/>'
};
const svg=name=>'<svg viewBox="0 0 24 24" aria-hidden="true">'+glyphs[name]+'</svg>';
widget.querySelectorAll('[data-mp-icon]').forEach(b=>b.innerHTML=svg(b.dataset.mpIcon));
const format=n=>{n=Math.max(0,Math.floor(Number(n)||0));return Math.floor(n/60)+':'+String(n%60).padStart(2,'0')};
let settings={};try{settings=JSON.parse(localStorage.getItem('atelier-player-settings')||'{}')}catch{}
let session=null;try{session=JSON.parse(sessionStorage.getItem('atelier-player-session')||'null')}catch{}
let index=Number.isInteger(settings.track)&&settings.track>=0&&settings.track<tracks.length?settings.track:0;
let volume=Number.isFinite(settings.volume)?Math.max(0,Math.min(1,settings.volume)):.65;
let repeat=[0,1,2].includes(settings.repeat)?settings.repeat:0;
let shuffle=settings.shuffle===true,loaded=false,pendingSeek=null,request=0,lastSaved=0,used=false;
let history=[],bag=tracks.map((_,i)=>i).filter(i=>i!==index),lastVolume=volume||.65;
if(session&&Number.isInteger(session.track)&&session.track>=0&&session.track<tracks.length){index=session.track;pendingSeek=Number(session.time)||0;used=true;bag=tracks.map((_,i)=>i).filter(i=>i!==index)}
audio.volume=volume;
function save(){
 try{localStorage.setItem('atelier-player-settings',JSON.stringify({track:index,volume:audio.volume,repeat,shuffle}));sessionStorage.setItem('atelier-player-session',JSON.stringify({track:index,time:loaded?audio.currentTime:(pendingSeek||0)}))}catch{}
}
function duration(){return loaded&&Number.isFinite(audio.duration)&&audio.duration>0?audio.duration:tracks[index].duration}
function progress(){
 const time=loaded?audio.currentTime:(pendingSeek||0),total=duration(),fraction=Math.min(1,Math.max(0,time/total));
 q('musicSeek').max=total;q('musicSeek').value=time;q('musicSeek').setAttribute('aria-valuetext',format(time)+t(' из ')+format(total));
 q('musicElapsed').textContent=format(time);q('musicDuration').textContent=format(total);q('musicMiniProgress').style.width=(fraction*100)+'%';
 if(!panel.hidden)[...q('musicWave').children].forEach((b,i)=>b.classList.toggle('played',i<fraction*tracks[index].peaks.length));
}
function renderVolume(){
 const silent=audio.volume===0||audio.muted;
 q('musicVolume').value=silent?0:Math.round(audio.volume*100);q('musicVolumeValue').textContent=(silent?0:Math.round(audio.volume*100))+'%';
 q('musicMute').innerHTML=svg(silent?'muted':'volume');q('musicMute').setAttribute('aria-label',t(silent?'Включить звук':'Выключить звук'));
}
function renderModes(){
 q('musicShuffle').setAttribute('aria-pressed',String(shuffle));q('musicRepeat').setAttribute('aria-pressed',String(repeat!==0));
 q('musicRepeat').setAttribute('aria-label',t(['Повтор: выключен','Повтор: вся очередь','Повтор: один трек'][repeat]));q('musicRepeat').innerHTML=svg('repeat')+(repeat===2?'<span class="mp-repeat-one" aria-hidden="true">1</span>':'');
}
function renderTrack(){
 const track=tracks[index];widget.style.setProperty('--mp-tint',track.tint);
 q('musicTitle').textContent=track.title;q('musicNumber').textContent=String(index+1).padStart(2,'0')+' / 04';
 q('musicMiniTitle').textContent=used?track.title:t('Музыка');q('musicMiniArtist').textContent=used?'Пошлая Молли':t('Пошлая Молли · 4 трека');
 q('musicWave').innerHTML=track.peaks.map(h=>'<i style="height:'+h+'%"></i>').join('');
 widget.querySelectorAll('[data-mp-track]').forEach(b=>{const active=Number(b.dataset.mpTrack)===index;b.setAttribute('aria-current',String(active))});
 if('mediaSession' in navigator&&'MediaMetadata' in window){navigator.mediaSession.metadata=new MediaMetadata({title:track.title,artist:'Пошлая Молли',album:'Atelier',artwork:[{src:new URL('assets/hero-tavern-cutout.webp',root).href,type:'image/webp'}]})}
 progress();
}
function renderPlayback(){
 const playing=!audio.paused&&!audio.ended;widget.classList.toggle('is-playing',playing);
 ['musicPlay','musicMiniPlay'].forEach(id=>{q(id).innerHTML=svg(playing?'pause':'play');q(id).setAttribute('aria-label',t(playing?'Пауза':'Воспроизвести'))});
 if('mediaSession' in navigator)navigator.mediaSession.playbackState=playing?'playing':'paused';
}
async function play(){
 used=true;renderTrack();q('musicStatus').textContent='';
 if(!loaded)load(index,false,pendingSeek||0);
 if(audio.ended)audio.currentTime=0;
 const attempt=request;
 try{await audio.play();if(attempt===request)q('musicStatus').textContent=''}
 catch(error){if(attempt!==request||error.name==='AbortError')return;renderPlayback();q('musicStatus').textContent=t(error.name==='NotAllowedError'?'Нажми «Воспроизвести», чтобы включить музыку.':'Не удалось загрузить трек. Попробуй ещё раз.')}
}
function load(next,autoplay=false,time=0){
 request++;audio.pause();index=(next+tracks.length)%tracks.length;loaded=true;pendingSeek=Math.max(0,Number(time)||0);
 audio.preload='metadata';audio.src=new URL('assets/music/'+tracks[index].file,root).href;audio.load();renderTrack();q('musicStatus').textContent='';save();if(autoplay)play();
}
function togglePlay(){if(audio.paused||audio.ended)play();else audio.pause()}
function next(ended=false){
 const playing=!audio.paused||ended;
 if(ended&&repeat===2){audio.currentTime=0;play();return}
 if(ended&&repeat===0&&((!shuffle&&index===tracks.length-1)||(shuffle&&bag.length===0))){renderPlayback();save();return}
 let target=(index+1)%tracks.length;
 if(shuffle){if(!bag.length)bag=tracks.map((_,i)=>i).filter(i=>i!==index);target=bag.splice(Math.floor(Math.random()*bag.length),1)[0]}
 history.push(index);used=true;load(target,playing);
}
function previous(){
 if(loaded&&audio.currentTime>3){audio.currentTime=0;progress();save();return}
 const playing=!audio.paused;const target=history.length?history.pop():(index-1+tracks.length)%tracks.length;used=true;bag=bag.filter(i=>i!==target);load(target,playing);
}
function seek(time){
 const target=Math.min(duration(),Math.max(0,Number(time)||0));
 if(!loaded){load(index,false,target);return}
 if(audio.readyState>=1)audio.currentTime=target;else pendingSeek=target;progress();save();
}
function open(){panel.hidden=false;q('musicOpen').setAttribute('aria-expanded','true');progress();q('musicClose').focus()}
function close(){panel.hidden=true;q('musicOpen').setAttribute('aria-expanded','false');q('musicOpen').focus()}
q('musicQueue').innerHTML=tracks.map((track,i)=>'<button class="mp-track" data-mp-track="'+i+'" aria-label="'+t('Включить: ')+track.title+'"><span class="mp-track-number"><span class="mp-track-index">'+String(i+1).padStart(2,'0')+'</span><span class="mp-playing-mark" aria-hidden="true"><i></i><i></i><i></i></span></span><span class="mp-track-title">'+track.title+'</span><span class="mp-track-time">'+format(track.duration)+'</span></button>').join('');
widget.querySelectorAll('[data-mp-track]').forEach(b=>b.addEventListener('click',()=>{history.push(index);used=true;const target=Number(b.dataset.mpTrack);bag=bag.filter(i=>i!==target);load(target,true)}));
q('musicOpen').addEventListener('click',()=>panel.hidden?open():close());q('musicClose').addEventListener('click',close);
q('musicPlay').addEventListener('click',togglePlay);q('musicMiniPlay').addEventListener('click',togglePlay);
q('musicNext').addEventListener('click',()=>next());q('musicMiniNext').addEventListener('click',()=>next());q('musicPrev').addEventListener('click',previous);
q('musicSeek').addEventListener('input',e=>seek(e.target.value));
q('musicVolume').addEventListener('input',e=>{audio.muted=false;audio.volume=Number(e.target.value)/100;if(audio.volume>0)lastVolume=audio.volume;renderVolume();save()});
q('musicMute').addEventListener('click',()=>{if(audio.volume===0||audio.muted){audio.muted=false;audio.volume=lastVolume||.65}else{lastVolume=audio.volume;audio.volume=0}renderVolume();save()});
q('musicShuffle').addEventListener('click',()=>{shuffle=!shuffle;bag=tracks.map((_,i)=>i).filter(i=>i!==index);renderModes();save()});
q('musicRepeat').addEventListener('click',()=>{repeat=(repeat+1)%3;renderModes();save()});
audio.addEventListener('loadedmetadata',()=>{if(pendingSeek!==null){audio.currentTime=Math.min(pendingSeek,duration());pendingSeek=null}progress()});
audio.addEventListener('timeupdate',()=>{progress();if(Date.now()-lastSaved>5000){save();lastSaved=Date.now()}});
audio.addEventListener('play',()=>{renderPlayback();save()});audio.addEventListener('pause',()=>{renderPlayback();save()});audio.addEventListener('ended',()=>next(true));
audio.addEventListener('waiting',()=>{q('musicStatus').textContent=t('Загрузка…')});audio.addEventListener('playing',()=>{q('musicStatus').textContent=''});
audio.addEventListener('error',()=>{renderPlayback();q('musicStatus').textContent=t('Не удалось загрузить трек. Попробуй ещё раз.')});
widget.addEventListener('keydown',e=>{
 if(e.key==='Escape'&&!panel.hidden){e.preventDefault();close();return}
 if(/INPUT|TEXTAREA/.test(e.target.tagName))return;
 if(e.key==='ArrowRight'){e.preventDefault();next()}else if(e.key==='ArrowLeft'){e.preventDefault();previous()}
 else if(e.code==='Space'&&e.target===q('musicCover')){e.preventDefault();togglePlay()}
});
document.addEventListener('pointerdown',e=>{if(!panel.hidden&&!widget.contains(e.target)){panel.hidden=true;q('musicOpen').setAttribute('aria-expanded','false')}});
let wheelTime=0,pointerX=null;
q('musicCover').addEventListener('wheel',e=>{if(Math.abs(e.deltaY)<50)return;e.preventDefault();if(Date.now()-wheelTime<400)return;wheelTime=Date.now();e.deltaY>0?next():previous()},{passive:false});
q('musicCover').addEventListener('pointerdown',e=>{pointerX=e.clientX});q('musicCover').addEventListener('pointerup',e=>{if(pointerX!==null&&Math.abs(e.clientX-pointerX)>45)e.clientX<pointerX?next():previous();pointerX=null});q('musicCover').addEventListener('pointercancel',()=>pointerX=null);
window.addEventListener('pagehide',save);
if('mediaSession' in navigator){
 const handlers={play:()=>play(),pause:()=>audio.pause(),previoustrack:previous,nexttrack:()=>next(),seekbackward:e=>seek(audio.currentTime-(e.seekOffset||10)),seekforward:e=>seek(audio.currentTime+(e.seekOffset||10)),seekto:e=>seek(e.seekTime)};
 for(const [action,handler] of Object.entries(handlers)){try{navigator.mediaSession.setActionHandler(action,handler)}catch{}}
}
renderTrack();renderVolume();renderModes();renderPlayback();
})();
