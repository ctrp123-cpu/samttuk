// 사용법: SAMTTUK_PW=비밀번호 node build_encrypted.js <소스폴더> <저장소폴더>
// 소스폴더의 index.html에 notes.js·details.js·firebase-config.js를 넣어 하나로 묶고, AES-GCM으로 암호화해 저장소에 site.enc로 저장.
// 소스 전체도 src.enc로 암호화 보관(나중에 수정할 때 복원용).
const fs=require('fs'), path=require('path'), crypto=require('crypto'), {execSync}=require('child_process');
const [src,repo]=process.argv.slice(2); const pw=process.env.SAMTTUK_PW;
if(!pw||!src||!repo){ console.error('usage'); process.exit(1); }
const ITER=200000;
function enc(buf){ const salt=crypto.randomBytes(16), iv=crypto.randomBytes(12);
  const key=crypto.pbkdf2Sync(Buffer.from(pw,'utf8'),salt,ITER,32,'sha256');
  const c=crypto.createCipheriv('aes-256-gcm',key,iv); const ct=Buffer.concat([c.update(buf),c.final(),c.getAuthTag()]);
  return JSON.stringify({v:1,iter:ITER,salt:salt.toString('base64'),iv:iv.toString('base64'),ct:ct.toString('base64')}); }
let html=fs.readFileSync(path.join(src,'index.html'),'utf8');
for(const f of ['notes.js','details.js','firebase-config.js']){
  const re=new RegExp('<script src="'+f.replace('.','\\.')+'\\?v=[0-9a-zA-Z]*"></script>');
  const code=fs.readFileSync(path.join(src,f),'utf8').replace(/<\/script/gi,'<\\/script');
  if(!re.test(html)) throw new Error('no tag '+f);
  html=html.replace(re,'<script>\n'+code+'\n</script>');
}
fs.writeFileSync(path.join(repo,'site.enc'),enc(Buffer.from(html,'utf8')));
const tar=execSync(`tar -czf - -C ${src} --exclude=.git .`);
fs.writeFileSync(path.join(repo,'src.enc'),enc(tar));
const ver=(fs.readFileSync(path.join(src,'version.txt'),'utf8')||'').trim();
fs.writeFileSync(path.join(repo,'version.txt'),ver+'\n');
for(const f of ['sync.js','sw.js','manifest.webmanifest','icon-192.png','icon-512.png']) fs.copyFileSync(path.join(src,f),path.join(repo,f));
fs.mkdirSync(path.join(repo,'tools'),{recursive:true});
for(const f of ['build_encrypted.js','loader.html','deploy.sh','restore.js','README.md']) fs.copyFileSync(path.join(__dirname,f),path.join(repo,'tools',f));
const loader=fs.readFileSync(path.join(__dirname,'loader.html'),'utf8').replace('__VER__',ver);
fs.writeFileSync(path.join(repo,'index.html'),loader);
console.log('built',ver,'site.enc',fs.statSync(path.join(repo,'site.enc')).size);
