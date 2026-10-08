import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
process.chdir(path.dirname(fileURLToPath(import.meta.url)));
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist');
for(const p of ['index.html','catalog.js','examples.js','fonts.css','guides','downloads','assets'])fs.cpSync(p,'dist/'+p,{recursive:true});
console.log('Atelier static files ready');
