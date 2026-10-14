import { jalaliMonthKey, toJalali } from "@/utils/jalali";

describe("jalali", () => {
  it("converts known dates", () => {
    expect(toJalali(new Date(2026, 2, 21))).toEqual({ jy: 1405, jm: 1, jd: 1 }); // Nowruz 1405
    expect(toJalali(new Date(2026, 2, 20))).toEqual({ jy: 1404, jm: 12, jd: 29 });
    expect(toJalali(new Date(2026, 8, 23))).toEqual({ jy: 1405, jm: 7, jd: 1 }); // 1 Mehr 1405
    expect(toJalali(new Date(2026, 8, 22))).toEqual({ jy: 1405, jm: 6, jd: 31 });
    expect(toJalali(new Date(2025, 2, 21))).toEqual({ jy: 1404, jm: 1, jd: 1 });
    expect(toJalali(new Date(2024, 11, 21))).toEqual({ jy: 1403, jm: 10, jd: 1 }); // 1 Dey 1403
    expect(toJalali(new Date(2025, 2, 20))).toEqual({ jy: 1403, jm: 12, jd: 30 }); // 1403 is leap
  });

  it("builds a month key", () => {
    expect(jalaliMonthKey(new Date(2026, 8, 23))).toBe("1405-07");
  });
});
