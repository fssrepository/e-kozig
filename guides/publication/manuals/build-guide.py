#!/usr/bin/env python3
"""Render the Hungarian E-közig prototype manual from its Markdown source."""

from __future__ import annotations

import html
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer


HERE = Path(__file__).resolve().parent
GUIDES = HERE.parents[1]
SOURCE = GUIDES / "development/reference/prototype-guide-hu.md"
OUTPUT = HERE / "E_Kozig_Prototype_Guide_v1.0.0_HU.pdf"
FONTS = Path("/usr/share/fonts/truetype/dejavu")

pdfmetrics.registerFont(TTFont("DejaVu", str(FONTS / "DejaVuSans.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Bold", str(FONTS / "DejaVuSans-Bold.ttf")))
pdfmetrics.registerFont(TTFont("DejaVu-Mono", str(FONTS / "DejaVuSansMono.ttf")))
pdfmetrics.registerFontFamily("DejaVu", normal="DejaVu", bold="DejaVu-Bold")

W, H = A4
NAVY = colors.HexColor("#102544")
BLUE = colors.HexColor("#245AB6")
CYAN = colors.HexColor("#66D8E7")
INK = colors.HexColor("#17263F")
MUTED = colors.HexColor("#53637A")
LINE = colors.HexColor("#DCE4EF")
PAPER = colors.HexColor("#F7F9FC")


class ManualDoc(SimpleDocTemplate):
    def afterFlowable(self, flowable):
        key = getattr(flowable, "bookmark_key", None)
        if key:
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(flowable.getPlainText(), key, level=0)


class InvariantCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        kwargs["invariant"] = 1
        super().__init__(*args, **kwargs)
        self.setTitle("E-közig - prototípus kézikönyv")
        self.setAuthor("E-közig")
        self.setSubject("A felület, a helyi adatkezelés és a fejlesztői felépítés dokumentációja")


STYLES = {
    "cover_kicker": ParagraphStyle(
        "cover_kicker", fontName="DejaVu-Bold", fontSize=10, leading=15,
        textColor=CYAN, spaceAfter=22,
    ),
    "cover_title": ParagraphStyle(
        "cover_title", fontName="DejaVu-Bold", fontSize=31, leading=40,
        textColor=colors.white, spaceAfter=22,
    ),
    "cover_subtitle": ParagraphStyle(
        "cover_subtitle", fontName="DejaVu", fontSize=13, leading=21,
        textColor=colors.HexColor("#D9E8F7"), spaceAfter=26,
    ),
    "cover_meta": ParagraphStyle(
        "cover_meta", fontName="DejaVu", fontSize=9, leading=16,
        textColor=colors.HexColor("#B8CDDE"),
    ),
    "contents_title": ParagraphStyle(
        "contents_title", fontName="DejaVu-Bold", fontSize=23, leading=30,
        textColor=INK, spaceAfter=25,
    ),
    "contents_item": ParagraphStyle(
        "contents_item", fontName="DejaVu", fontSize=10.5, leading=17,
        textColor=INK, leftIndent=10, spaceAfter=11,
    ),
    "h2": ParagraphStyle(
        "h2", fontName="DejaVu-Bold", fontSize=15, leading=21,
        textColor=NAVY, spaceBefore=21, spaceAfter=9, keepWithNext=True,
    ),
    "h3": ParagraphStyle(
        "h3", fontName="DejaVu-Bold", fontSize=10.7, leading=16,
        textColor=BLUE, spaceBefore=14, spaceAfter=6, keepWithNext=True,
    ),
    "body": ParagraphStyle(
        "body", fontName="DejaVu", fontSize=9.2, leading=15.2,
        textColor=INK, spaceAfter=8, alignment=TA_LEFT,
        splitLongWords=True,
    ),
    "bullet": ParagraphStyle(
        "bullet", fontName="DejaVu", fontSize=9.2, leading=15.2,
        textColor=INK, leftIndent=18, firstLineIndent=-12, spaceAfter=4,
        splitLongWords=True,
    ),
    "number": ParagraphStyle(
        "number", fontName="DejaVu", fontSize=9.2, leading=15.2,
        textColor=INK, leftIndent=20, firstLineIndent=-16, spaceAfter=4,
        splitLongWords=True,
    ),
    "note": ParagraphStyle(
        "note", fontName="DejaVu", fontSize=8.7, leading=14.4,
        textColor=MUTED, spaceAfter=8,
    ),
}


def inline(markdown: str) -> str:
    value = html.escape(markdown, quote=False)
    value = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", value)
    value = re.sub(
        r"`(https?://[^`]+)`",
        r'<link href="\1" color="#245AB6">\1</link>',
        value,
    )
    value = re.sub(r"`([^`]+)`", r'<font name="DejaVu-Mono" size="8.4">\1</font>', value)
    return value


def blocks(markdown: str):
    pending = []
    section = 0

    def flush():
        nonlocal pending
        if pending:
            value = " ".join(pending).strip()
            pending = []
            return [Paragraph(inline(value), STYLES["body"])]
        return []

    for raw in markdown.splitlines():
        line = raw.strip()
        if not line:
            yield from flush()
            continue
        if line.startswith("# "):
            yield from flush()
            continue  # Cover carries the document title.
        if line.startswith("## "):
            yield from flush()
            section += 1
            heading = Paragraph(inline(line[3:]), STYLES["h2"])
            heading.bookmark_key = f"chapter-{section}"
            yield heading
            continue
        if line.startswith("### "):
            yield from flush()
            yield Paragraph(inline(line[4:]), STYLES["h3"])
            continue
        if line.startswith("- "):
            yield from flush()
            yield Paragraph("•  " + inline(line[2:]), STYLES["bullet"])
            continue
        numbered = re.match(r"^(\d+)\.\s+(.+)$", line)
        if numbered:
            yield from flush()
            yield Paragraph(numbered.group(1) + ".  " + inline(numbered.group(2)), STYLES["number"])
            continue
        pending.append(line)
    yield from flush()


def cover(pdf, doc):
    pdf.setFillColor(NAVY)
    pdf.rect(0, 0, W, H, stroke=0, fill=1)
    pdf.setFillColor(CYAN)
    pdf.rect(48, H - 100, 48, 4, stroke=0, fill=1)
    pdf.setFillColor(colors.HexColor("#1A3860"))
    pdf.circle(W + 50, 120, 225, stroke=0, fill=1)
    pdf.setFillColor(colors.HexColor("#22518B"))
    pdf.circle(W + 15, 95, 125, stroke=0, fill=1)
    pdf.setFillColor(CYAN)
    pdf.rect(48, 90, 170, 2, stroke=0, fill=1)
    pdf.setFillColor(colors.HexColor("#B8CDDE"))
    pdf.setFont("DejaVu", 8)
    pdf.drawString(48, 68, "MAGYAR NYELVŰ FORRÁSALAPÚ DOKUMENTÁCIÓ")


def inner_page(pdf, doc):
    pdf.setFillColor(PAPER)
    pdf.rect(0, 0, W, H, stroke=0, fill=1)
    pdf.setFillColor(NAVY)
    pdf.rect(0, H - 45, W, 45, stroke=0, fill=1)
    pdf.setFont("DejaVu-Bold", 8)
    pdf.setFillColor(colors.white)
    pdf.drawString(48, H - 28, "E-KÖZIG  /  PROTOTÍPUS KÉZIKÖNYV")
    pdf.setStrokeColor(LINE)
    pdf.line(48, 47, W - 48, 47)
    pdf.setFont("DejaVu", 7.5)
    pdf.setFillColor(MUTED)
    pdf.drawString(48, 32, "Forrásállapot: e4e08d59a0fc  ·  HU  ·  v1.0.0")
    pdf.drawRightString(W - 48, 32, str(doc.page))


def make_story(markdown: str):
    story = [
        Spacer(1, 165),
        Paragraph("E-KÖZIG", STYLES["cover_kicker"]),
        Paragraph("Prototípus<br/>kézikönyv", STYLES["cover_title"]),
        Paragraph("Felület, működő folyamatok, helyi adatkezelés<br/>és fejlesztői felépítés", STYLES["cover_subtitle"]),
        Paragraph("Magyar kiadás  ·  1.0.0<br/>Forrásállapot: e4e08d59a0fc<br/>2026. október", STYLES["cover_meta"]),
        PageBreak(),
        Paragraph("Tartalom", STYLES["contents_title"]),
    ]
    chapters = [line[3:].strip() for line in markdown.splitlines() if line.startswith("## ")]
    for chapter in chapters:
        story.append(Paragraph(inline(chapter), STYLES["contents_item"]))
    story.extend([
        Spacer(1, 12),
        Paragraph(
            "A kézikönyv a forrásban működő felületi interakciókat, az IndexedDB-ben tárolt adatokat "
            "és a helykitöltő elemeket külön nevezi meg. A hivatali háttérrendszerekhez való kapcsolódás "
            "nem része a jelenlegi prototípusnak.",
            STYLES["note"],
        ),
        PageBreak(),
    ])
    story.extend(blocks(markdown))
    return story


def main():
    markdown = SOURCE.read_text(encoding="utf-8")
    doc = ManualDoc(
        str(OUTPUT), pagesize=A4,
        leftMargin=48, rightMargin=48, topMargin=62, bottomMargin=61,
        title="E-közig - prototípus kézikönyv",
        author="E-közig",
        subject="A felület, a helyi adatkezelés és a fejlesztői felépítés dokumentációja",
    )
    doc.build(make_story(markdown), onFirstPage=cover, onLaterPages=inner_page,
              canvasmaker=InvariantCanvas)
    print(OUTPUT)


if __name__ == "__main__":
    main()
