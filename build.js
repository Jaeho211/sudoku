import fs from 'node:fs';import {createHash} from 'node:crypto';
fs.rmSync('dist',{recursive:true,force:true});fs.mkdirSync('dist');
for(const p of ['index.html','style.css','src','manifest.webmanifest','pwa.js'])fs.cpSync(p,'dist/'+p,{recursive:true});
fs.mkdirSync('dist/icons');for(const [name,data] of Object.entries(JSON.parse(fs.readFileSync('icons.json','utf8'))))fs.writeFileSync('dist/icons/'+name,Buffer.from(data,'base64'));
const hash=createHash('sha256');function hashDirectory(dir){for(const name of fs.readdirSync(dir).sort()){const p=dir+'/'+name;hash.update(p);if(fs.statSync(p).isDirectory())hashDirectory(p);else hash.update(fs.readFileSync(p));}}hashDirectory('dist');hash.update(fs.readFileSync('sw.js'));fs.writeFileSync('dist/sw.js',fs.readFileSync('sw.js','utf8').replace('__BUILD_VERSION__',hash.digest('hex').slice(0,16)));
console.log('Static PWA built in dist/');
