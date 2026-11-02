// 사용법: SAMTTUK_PW=비밀번호 node restore.js <저장소폴더> <복원할 소스폴더>
// 저장소의 src.enc를 풀어서 편집 가능한 소스로 복원
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{execSync}=require('child_process');
const [repo,out]=process.argv.slice(2); const pw=process.env.SAMTTUK_PW;
const d=JSON.parse(fs.readFileSync(path.join(repo,'src.enc'),'utf8'));
const key=crypto.pbkdf2Sync(Buffer.from(pw,'utf8'),Buffer.from(d.salt,'base64'),d.iter,32,'sha256');
const ct=Buffer.from(d.ct,'base64'); const tag=ct.subarray(ct.length-16), body=ct.subarray(0,ct.length-16);
const dc=crypto.createDecipheriv('aes-256-gcm',key,Buffer.from(d.iv,'base64')); dc.setAuthTag(tag);
const tar=Buffer.concat([dc.update(body),dc.final()]);
fs.mkdirSync(out,{recursive:true}); execSync(`tar -xzf - -C ${out}`,{input:tar}); console.log('restored to',out);
