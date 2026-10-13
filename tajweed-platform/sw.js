/* sw.js — التخزين المحلي لتعمل المنصة دون إنترنت بعد أول زيارة */
var CV='tajweed-v6';
var FILES=['./','index.html','demo-lesson.html','demo-mushaf.html','demo-mutun.html','demo-skill-tree.html','demo-duel.html','demo-time-attack.html','demo-leaderboard.html','demo-teacher-studio.html','demo-quiz.html','manifest.webmanifest','assets/app.css','assets/site.js','assets/xp.js','assets/gharib.json','assets/mutun.js','assets/icons/icon-192.png','assets/icons/icon-512.png','assets/icons/icon.svg'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CV).then(function(c){return c.addAll(FILES)}).then(function(){return self.skipWaiting()}).catch(function(){}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CV}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
function fromCache(req){
  return caches.match(req).then(function(r){
    if(r)return r;
    try{
      var u=new URL(req.url);u.search='';u.hash='';
      if(u.href!==req.url)return caches.match(u.href);
    }catch(e){}
    return null;
  });
}
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  try{if(new URL(e.request.url).origin!==location.origin)return}catch(err){return}
  e.respondWith(fromCache(e.request).then(function(r){
    if(r)return r;
    return fetch(e.request).then(function(res){
      var cp=res.clone();
      caches.open(CV).then(function(c){try{c.put(e.request,cp)}catch(err){}}).catch(function(){});
      return res;
    }).catch(function(){return caches.match('index.html')});
  }));
});
