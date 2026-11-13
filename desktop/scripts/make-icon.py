"""저장소 루트 아이콘.png(투명 배경 + 검은 도형)를 앱 아이콘 build/icon.ico로 만든다.
어두운 작업 표시줄에서도 보이도록 모서리가 둥근 흰 바탕 위에 도형을 올린다.
실행: python desktop/scripts/make-icon.py  (Pillow 필요)"""
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, '..', '..', '아이콘.png')
OUT_DIR = os.path.join(HERE, '..', 'build')
S = 1024                 # 작업 크기 (줄일 때 가장자리를 깨끗하게)
RADIUS = 0.18            # 모서리 반지름 (한 변 대비)
GLYPH = 0.62             # 도형 긴 변이 바탕에서 차지하는 비율

src = Image.open(SRC).convert('RGBA')
glyph = src.crop(src.getchannel('A').getbbox())
scale = GLYPH * S / max(glyph.size)
glyph = glyph.resize((round(glyph.width * scale), round(glyph.height * scale)), Image.LANCZOS)

canvas = Image.new('RGBA', (S, S), (0, 0, 0, 0))
mask = Image.new('L', (S, S), 0)
ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), radius=round(RADIUS * S), fill=255)
canvas.paste(Image.new('RGBA', (S, S), (255, 255, 255, 255)), (0, 0), mask)
canvas.alpha_composite(glyph, ((S - glyph.width) // 2, (S - glyph.height) // 2))

os.makedirs(OUT_DIR, exist_ok=True)
canvas.resize((256, 256), Image.LANCZOS).save(os.path.join(OUT_DIR, 'icon.png'))
canvas.resize((256, 256), Image.LANCZOS).save(
    os.path.join(OUT_DIR, 'icon.ico'), sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print('build/icon.ico, build/icon.png 저장')
