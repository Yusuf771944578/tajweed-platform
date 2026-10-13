/* sw.js — network-first: fresh when online, cache fallback offline. Wipes all old caches. */
var CV='tajweed-v7';
self.addEventListener('install',function(e){self.skipWaiting()});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){return caches.delete(k)}));
  }).then(function(){return self.clients.claim()}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var same=false;
  try{same=new URL(e.request.url).origin===location.origin}catch(err){return}
  if(!same)return;
  e.respondWith(
    fetch(e.request).then(function(res){
      try{
        var cp=res.clone();
        caches.open(CV).then(function(c){try{c.put(e.request,cp).catch(function(){})}catch(err){}}).catch(function(){});
      }catch(err){}
      return res;
    }).catch(function(){
      return caches.match(e.request).then(function(r){return r||caches.match('index.html')});
    })
  );
});
