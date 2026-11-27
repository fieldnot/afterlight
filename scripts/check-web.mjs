import { readFileSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const temp=mkdtempSync(join(tmpdir(),'afterlight-'));
try {
 const html=readFileSync('index.html','utf8');
 const scripts=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].filter(m=>!(/\bsrc\s*=/.test(m[1]))&&(!/\btype\s*=/.test(m[1])||/type=["'](?:module|text\/javascript|application\/javascript)["']/.test(m[1])));
 if(!scripts.length) throw Error('No inline scripts found');
 for(const [i,m] of scripts.entries()){const file=join(temp,'inline-'+i+(/type=["']module/.test(m[1])?'.mjs':'.js'));writeFileSync(file,m[2]);execFileSync(process.execPath,['--check',file],{stdio:'inherit'});}
 for(const name of ['city3d.js','world3d.js']){const file=join(temp,name+'.mjs');writeFileSync(file,readFileSync(name));execFileSync(process.execPath,['--check',file],{stdio:'inherit'});}
 console.log('JavaScript syntax checks passed');
} finally {rmSync(temp,{recursive:true,force:true});}
