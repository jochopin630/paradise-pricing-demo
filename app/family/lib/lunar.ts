// 한국 음력(한국천문연구원 기준 데이터) 변환 유틸리티
import KoreanLunarCalendar from "korean-lunar-calendar";

export interface YMD {
  y: number;
  m: number;
  d: number;
}

export interface LunarYMD extends YMD {
  leap: boolean;
}

const cal = new KoreanLunarCalendar();
const solarCache = new Map<string, LunarYMD | null>();

export function solarToLunar(y: number, m: number, d: number): LunarYMD | null {
  const key = `${y}-${m}-${d}`;
  if (solarCache.has(key)) return solarCache.get(key)!;
  let out: LunarYMD | null = null;
  if (cal.setSolarDate(y, m, d)) {
    const l = cal.getLunarCalendar();
    out = { y: l.year, m: l.month, d: l.day, leap: !!l.intercalation };
  }
  solarCache.set(key, out);
  return out;
}

/** 음력 → 양력. 존재하지 않는 날짜(작은달 30일, 없는 윤달)면 null */
export function lunarToSolarExact(y: number, m: number, d: number, leap = false): YMD | null {
  if (!cal.setLunarDate(y, m, d, leap)) return null;
  const s = cal.getSolarCalendar();
  const back = solarToLunar(s.year, s.month, s.day);
  // 라이브러리가 잘못된 날짜를 넘겨 계산하는 경우를 막기 위해 역변환으로 검증
  if (!back || back.y !== y || back.m !== m || back.d !== d || back.leap !== leap) return null;
  return { y: s.year, m: s.month, d: s.day };
}

/** 해당 음력 연도에 윤달이 있으면 그 달 번호, 없으면 0 */
export function leapMonthOf(lunarYear: number): number {
  for (let m = 1; m <= 12; m++) {
    if (lunarToSolarExact(lunarYear, m, 1, true)) return m;
  }
  return 0;
}

export function lunarMonthDays(y: number, m: number, leap = false): number {
  return lunarToSolarExact(y, m, 30, leap) ? 30 : 29;
}

export interface LunarResolve {
  solar: YMD;
  lunar: LunarYMD; // 실제로 적용된 음력 날짜
  note?: string; // 보정 내용
}

/**
 * 기념일용 음력 → 양력 변환.
 * - 윤달 기념일인데 그 해에 해당 윤달이 없으면 평달로
 * - 작은달(29일)인데 30일이면 29일(그믐)로
 */
export function resolveLunar(y: number, m: number, d: number, leap = false): LunarResolve | null {
  let useLeap = leap;
  const notes: string[] = [];
  if (leap && leapMonthOf(y) !== m) {
    useLeap = false;
    notes.push(`윤${m}월 없음 → 평달`);
  }
  let day = d;
  if (d === 30 && lunarMonthDays(y, m, useLeap) === 29) {
    day = 29;
    notes.push("작은달 → 29일");
  }
  const s = lunarToSolarExact(y, m, day, useLeap);
  if (!s) return null;
  return { solar: s, lunar: { y, m, d: day, leap: useLeap }, note: notes.join(", ") || undefined };
}
