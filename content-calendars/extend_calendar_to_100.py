# -*- coding: utf-8 -*-
"""
Extend «تقویم محتوایی همراز.xlsx» from 30 to 100 days per tab.

Existing rows (days 1–30) are never modified: new rows are appended after
the last filled row, copying cell styles from the existing rows (alternating
the last two rows so any zebra striping continues) and reusing each tab's
own disclaimer text from day 1. Idempotent: a tab that already reaches day
100 is skipped. A backup of the original file is written first.

    python extend_calendar_to_100.py
"""
import os
import shutil
import sys
from copy import copy

from openpyxl import load_workbook

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)

import more_academic  # noqa: E402
import more_legal  # noqa: E402
import more_mind  # noqa: E402

FILE = os.path.join(HERE, "تقویم محتوایی همراز.xlsx")
TARGET_DAYS = 100

SOURCES = {
    "تقویم حقوقی": more_legal.ROWS,
    "تقویم سلامت روان": more_mind.ROWS,
    "تقویم مشاوره تحصیلی": more_academic.ROWS,
}


def last_day_row(ws):
    """Row index of the last row whose column A holds a day number."""
    last = 1
    for r in range(2, ws.max_row + 1):
        if isinstance(ws.cell(r, 1).value, (int, float)):
            last = r
    return last


def copy_row_style(ws, src_row, dst_row):
    for col in range(1, ws.max_column + 1):
        s, d = ws.cell(src_row, col), ws.cell(dst_row, col)
        if s.has_style:
            d.font, d.fill, d.border = copy(s.font), copy(s.fill), copy(s.border)
            d.alignment, d.number_format, d.protection = copy(s.alignment), s.number_format, copy(s.protection)
    h = ws.row_dimensions[src_row].height
    if h:
        ws.row_dimensions[dst_row].height = h


def main():
    backup = FILE.replace(".xlsx", " - backup-30days.xlsx")
    if not os.path.exists(backup):
        shutil.copy2(FILE, backup)

    wb = load_workbook(FILE)
    for title, rows in SOURCES.items():
        ws = wb[title]
        last = last_day_row(ws)
        last_day = int(ws.cell(last, 1).value)
        if last_day >= TARGET_DAYS:
            print(f"{title}: already {last_day} days, skipped")
            continue
        existing = {str(ws.cell(r, 2).value).strip() for r in range(2, last + 1)}
        disclaimer = ws.cell(2, 7).value
        needed = TARGET_DAYS - last_day
        assert len(rows) >= needed, f"{title}: need {needed} rows, have {len(rows)}"
        style_rows = [last - 1, last]
        for i, (head, hook, points, cta, tags) in enumerate(rows[:needed]):
            assert head.strip() not in existing, f"duplicate title in {title}: {head}"
            r = last + 1 + i
            copy_row_style(ws, style_rows[i % 2], r)
            values = [last_day + 1 + i, head, hook, "\n".join(f"• {p}" for p in points), cta, tags, disclaimer]
            for c, v in enumerate(values, start=1):
                ws.cell(r, c, v)
        if ws.print_area:
            ws.print_area = f"A1:{ws.cell(1, ws.max_column).column_letter}{last + needed}"
        if ws.auto_filter and ws.auto_filter.ref:
            ws.auto_filter.ref = f"A1:{ws.cell(1, ws.max_column).column_letter}{last + needed}"
        print(f"{title}: days {last_day + 1}-{TARGET_DAYS} added")
    wb.save(FILE)


if __name__ == "__main__":
    main()
