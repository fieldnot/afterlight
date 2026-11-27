import { mkdir, copyFile } from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','city3d.js','world3d.js']) await copyFile(file,'dist/'+file);
console.log('Web game staged');
