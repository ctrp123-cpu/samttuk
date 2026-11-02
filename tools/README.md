# 배포 도구
- 소스 복원: `SAMTTUK_PW=... node tools/restore.js . /home/claude/samttuk-src`
- 수정 후 배포: `SAMTTUK_PW=... sh tools/deploy.sh "커밋 메시지"` (deploy.sh의 SRC/REPO 경로 확인)
- 소스 폴더에서 `./bump.sh`가 버전을 올림. 날짜는 {W12}, {D+89} 같은 예정일 기준 토큰으로 씀.
