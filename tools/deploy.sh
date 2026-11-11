#!/bin/sh
# 소스(/home/claude/samttuk-src)를 암호화해서 GitHub(samttuk)에 배포
set -e
SRC=/home/claude/samttuk-src; REPO=/home/claude/samttuk
cd "$SRC" && ./bump.sh
cd "$REPO" && git pull -q --rebase origin main || true
find "$REPO" -mindepth 1 -maxdepth 1 ! -name .git -exec rm -rf {} +
SAMTTUK_PW="$SAMTTUK_PW" node /home/claude/tools/build_encrypted.js "$SRC" "$REPO"
printf '# private notes\n\n비공개 노트입니다. 내용은 암호화되어 있습니다.\n' > "$REPO/README.md"
cd "$REPO" && git add -A && git -c user.name="ctrp123-cpu" -c user.email="ctrp123-cpu@users.noreply.github.com" commit -qm "${1:-update}

Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01ViY42syQqGATeAy3PZ1Zhq" && git push -q origin HEAD
git log --oneline -1
