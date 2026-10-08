import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.zip':'application/zip','.mp3':'audio/mpeg'};
http.createServer((req,res)=>{
 let p;
 try{p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);return res.end();}
 if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);return res.end();}
 try{
  if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');
  const size=fs.statSync(p).size,headers={'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store','Accept-Ranges':'bytes'};
  let start=0,end=size-1,status=200;
  if(req.headers.range){
   const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
   if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
   if(match[1]){start=Number(match[1]);end=match[2]?Math.min(Number(match[2]),end):end;}
   else start=Math.max(0,size-Number(match[2]));
   if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}
   status=206;headers['Content-Range']=`bytes ${start}-${end}/${size}`;
  }
  headers['Content-Length']=Math.max(0,end-start+1);res.writeHead(status,headers);
  if(req.method==='HEAD'||size===0)return res.end();
  fs.createReadStream(p,{start,end}).on('error',()=>res.destroy()).pipe(res);
 }catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT||4173),'0.0.0.0',()=>console.log('Atelier preview ready'));
