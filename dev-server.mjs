import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webp':'image/webp','.svg':'image/svg+xml','.woff2':'font/woff2','.zip':'application/zip'};
http.createServer((req,res)=>{
 let p;
 try{p=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));}catch{res.writeHead(400);return res.end();}
 if(!p.startsWith(root+path.sep)&&p!==root){res.writeHead(403);return res.end();}
 try{if(fs.statSync(p).isDirectory())p=path.join(p,'index.html');const data=fs.readFileSync(p);res.writeHead(200,{'Content-Type':types[path.extname(p)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}
}).listen(Number(process.env.PORT||4173),'0.0.0.0',()=>console.log('Atelier preview ready'));
