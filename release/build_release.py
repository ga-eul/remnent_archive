"""배포용 zip 만들기 → release/dist/
  1) RemnantArchive-web-<버전>.zip        웹 배포용(itch.io HTML 등). zip 맨 위에 index.html
  2) RemnantArchiveDemo-<버전>-win-itch.zip     itch.io용 Windows exe + 실행 안내
  3) RemnantArchiveDemo-<버전>-win-dropbox.zip  드롭박스 공유용 exe + 실행 안내(드롭박스 경고 줄 포함)
원본 게임 파일은 고치지 않는다. 웹용은 복사본에서만 허브 파일 이름을 index.html로 바꾸고 허브 주소 세 곳을 함께 바꾼다.
exe는 desktop/에서 `npm run dist`로 먼저 만들어 둔다.
실행: 저장소 루트에서 python release/build_release.py"""
import json, os, sys, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
OUT = os.path.join(HERE, 'dist')
VERSION = json.load(open(os.path.join(ROOT, 'desktop', 'package.json'), encoding='utf-8'))['version']

PAGES = ['index (1).html', 'first-launch-notice-terminal.html', 'loading.html', 'shinip_demo_complete.html']
HUB_OLD, HUB_NEW = 'index (1).html', 'index.html'
# 웹용 복사본에서만 바꾸는 곳: (파일, 원래 문자열, 바꿀 문자열) — 각각 정확히 한 번 있어야 한다
WEB_EDITS = [
    ('shinip/js/main.js', "const HUB_URL = '../index (1).html';", "const HUB_URL = '../index.html';"),
    ('shinip_demo_complete.html', "const HUB_URL = 'index (1).html';", "const HUB_URL = 'index.html';"),
    ('loading.html', 'data-next="index (1).html"', 'data-next="index.html"'),
]
DROPBOX_LINE = '- 드롭박스 로그인·가입 창 → 창을 닫고 [다운로드] (로그인 없이 받을 수 있습니다)\n'


def fail(msg):
    print('[release] ' + msg); sys.exit(1)


def web_files():
    """(zip 안 경로, 원본 경로) 목록"""
    files = [(HUB_NEW if p == HUB_OLD else p, os.path.join(ROOT, p)) for p in PAGES]
    for base, _, names in os.walk(os.path.join(ROOT, 'shinip')):
        for n in names:
            src = os.path.join(base, n)
            files.append((os.path.relpath(src, ROOT).replace(os.sep, '/'), src))
    return sorted(files)


def build_web():
    edits = {f: (a, b) for f, a, b in WEB_EDITS}
    name = os.path.join(OUT, f'RemnantArchive-web-{VERSION}.zip')
    with zipfile.ZipFile(name, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        for arc, src in web_files():
            if arc in edits:
                text = open(src, encoding='utf-8').read()
                old, new = edits.pop(arc)
                if text.count(old) != 1:
                    fail(f'{arc}: "{old}"가 {text.count(old)}번 있습니다 (1번이어야 함)')
                z.writestr(arc, text.replace(old, new).encode('utf-8'))
            else:
                z.write(src, arc)
        if edits:
            fail('바꾸지 못한 파일: ' + ', '.join(edits))
        # 웹용 묶음에 옛 허브 이름을 가리키는 코드가 남지 않았는지 (주석 제외는 위 세 곳으로 확인)
        n = len(z.namelist())
    if n > 1000:
        fail(f'파일 {n}개 — itch.io HTML 업로드 한도(1000개)를 넘습니다')
    return name, n


def build_exe(host):
    exe = os.path.join(ROOT, 'desktop', 'dist', f'RemnantArchiveDemo-{VERSION}-portable.exe')
    if not os.path.exists(exe):
        fail(f'{exe} 이 없습니다. desktop/에서 npm run dist를 먼저 실행하세요.')
    note = open(os.path.join(HERE, '실행 안내.txt'), encoding='utf-8').read()
    note = note.replace('{VERSION}', VERSION).replace('{HOST_WARNING}', DROPBOX_LINE if host == 'dropbox' else '')
    note = '﻿' + note.replace('\r\n', '\n').replace('\n', '\r\n')     # 메모장에서 한글이 깨지지 않게 UTF-8(BOM)·CRLF
    name = os.path.join(OUT, f'RemnantArchiveDemo-{VERSION}-win-{host}.zip')
    with zipfile.ZipFile(name, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as z:
        z.writestr('RemnantArchiveDemo/실행 안내.txt', note.encode('utf-8'))
        z.write(exe, f'RemnantArchiveDemo/{os.path.basename(exe)}')
    return name


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    web, n = build_web()
    print(f'[release] {os.path.relpath(web, ROOT)}  (파일 {n}개)')
    for host in ('itch', 'dropbox'):
        print('[release] ' + os.path.relpath(build_exe(host), ROOT))
