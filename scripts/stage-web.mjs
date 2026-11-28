import { mkdir, copyFile, cp, stat } from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','city3d.js','world3d.js']) await copyFile(file,'dist/'+file);
await cp('support','dist/support',{recursive:true});
const art=await stat('genesis-art').catch(e=>{if(e.code==='ENOENT')return null;throw e;});
if(art?.isDirectory()) await cp('genesis-art','dist/genesis-art',{recursive:true});
else console.warn('Genesis artwork not present; built-in graphics remain available.');
console.log('Web game staged');
