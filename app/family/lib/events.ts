import { resolveLunar, solarToLunar, type LunarYMD, type YMD } from "./lunar";
export type { LunarYMD, YMD };
import type { FamilyEvent, Settings } from "./types";

// ---------- 날짜 도우미 ----------
export const toNum = (d: YMD) => d.y * 10000 + d.m * 100 + d.d;
export const ymdKey = (d: YMD) => `${d.y}-${d.m}-${d.d}`;

export function addDays(d: YMD, n: number): YMD {
  const t = new Date(Date.UTC(d.y, d.m - 1, d.d + n));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth() + 1, d: t.getUTCDate() };
}
export function diffDays(a: YMD, b: YMD): number {
  return Math.round((Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d)) / 86400000);
}
export const weekday = (d: YMD) => new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay();
export const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
export const isLeapYear = (y: number) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
export function daysInMonth(y: number, m: number) {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}
export function todayYMD(): YMD {
  const n = new Date();
  return { y: n.getFullYear(), m: n.getMonth() + 1, d: n.getDate() };
}
export const fmtLunar = (l: { m: number; d: number; leap: boolean }) => `${l.leap ? "윤" : ""}${l.m}.${l.d}`;
export function dday(today: YMD, d: YMD) {
  const n = diffDays(today, d);
  return n === 0 ? "오늘" : n > 0 ? `D-${n}` : `D+${-n}`;
}

// ---------- 의미 있는 나이·주년·주기 ----------
export interface Milestone {
  name: string;
  desc: string;
  major: boolean; // 크게 알려줄 날
}

// t: 전통 나이(세는나이). 환갑·진갑은 늘 만 60·61세.
const AGE_MILESTONES: { t: number; fixedMan?: number; name: string; desc: string }[] = [
  { t: 61, fixedMan: 60, name: "환갑(회갑)", desc: "60갑자가 한 바퀴 돈 해 · 만 60세" },
  { t: 62, fixedMan: 61, name: "진갑", desc: "환갑 이듬해 · 만 61세" },
  { t: 70, name: "칠순(고희)", desc: "70세 · 人生七十古來稀" },
  { t: 77, name: "희수", desc: "77세 · 喜자 초서가 七十七을 닮음" },
  { t: 80, name: "팔순(산수)", desc: "80세" },
  { t: 88, name: "미수", desc: "88세 · 米자를 풀면 八十八" },
  { t: 90, name: "구순(졸수)", desc: "90세" },
  { t: 99, name: "백수", desc: "99세 · 百에서 一을 빼면 白" },
  { t: 100, name: "상수", desc: "100세" },
];

export function ageMilestone(man: number, s: Settings): Milestone | null {
  if (man === 1) return { name: "돌", desc: "첫 번째 생일", major: true };
  for (const a of AGE_MILESTONES) {
    const target = a.fixedMan ?? (s.ageBasis === "traditional" ? a.t - 1 : a.t);
    if (man === target) return { name: a.name, desc: a.desc, major: true };
  }
  return null;
}

const WEDDING: Record<number, [string, boolean]> = {
  1: ["지혼식", false],
  5: ["목혼식", false],
  10: ["석혼식(주석혼)", true],
  15: ["동혼식", false],
  20: ["도자기혼식", true],
  25: ["은혼식", true],
  30: ["진주혼식", true],
  35: ["산호혼식", false],
  40: ["루비혼식", true],
  45: ["사파이어혼식", false],
  50: ["금혼식", true],
  55: ["에메랄드혼식", false],
  60: ["회혼례(금강혼)", true],
};

export function weddingMilestone(n: number): Milestone | null {
  const w = WEDDING[n];
  return w ? { name: w[0], desc: `결혼 ${n}주년`, major: w[1] } : null;
}

export function memorialMilestone(n: number): Milestone | null {
  if (n === 1) return { name: "소상(1주기)", desc: "돌아가신 지 1년", major: true };
  if (n === 2) return { name: "대상(2주기·탈상)", desc: "돌아가신 지 2년", major: true };
  if (n > 0 && n % 10 === 0) return { name: `${n}주기`, desc: `돌아가신 지 ${n}년`, major: false };
  return null;
}

// ---------- 발생(그 해의 실제 양력 날짜) ----------
export interface Occurrence {
  key: string;
  event: FamilyEvent;
  date: YMD; // 양력
  lunar?: LunarYMD; // 음력 기념일이면 적용된 음력 날짜
  note?: string; // 보정 안내 (작은달, 윤달, 2/29)
  meaning?: string; // 만 45세 / 25주년 / 10주기
  milestone?: Milestone | null;
  special?: "100days";
}

function meaningFor(ev: FamilyEvent, baseYear: number, s: Settings) {
  if (ev.year == null) return { ok: true as const };
  const n = baseYear - ev.year;
  switch (ev.kind) {
    case "birthday":
      if (n < 0) return { ok: false as const };
      if (n === 0) return { ok: true as const, meaning: "태어난 날" };
      return { ok: true as const, meaning: `만 ${n}세`, milestone: ageMilestone(n, s) };
    case "wedding":
      if (n < 0) return { ok: false as const };
      if (n === 0) return { ok: true as const, meaning: "결혼식" };
      return { ok: true as const, meaning: `${n}주년`, milestone: weddingMilestone(n) };
    case "memorial":
      if (n <= 0) return { ok: false as const };
      return { ok: true as const, meaning: `${n}주기`, milestone: memorialMilestone(n) };
    case "rite":
    case "other":
      if (n < 0) return { ok: true as const };
      return { ok: true as const, meaning: `${n}년째` };
  }
}

/** 출생일(양력). 음력 생일이면 출생년도 음력을 양력으로 환산 */
export function birthSolar(ev: FamilyEvent): YMD | null {
  if (ev.year == null) return null;
  if (ev.calendar === "solar") return { y: ev.year, m: ev.month, d: ev.day };
  return resolveLunar(ev.year, ev.month, ev.day, ev.leap)?.solar ?? null;
}

export function occurrencesForEvent(ev: FamilyEvent, year: number, s: Settings): Occurrence[] {
  const out: Occurrence[] = [];
  const push = (date: YMD, baseYear: number, lunar?: LunarYMD, note?: string) => {
    const m = meaningFor(ev, baseYear, s);
    if (!m.ok) return;
    out.push({
      key: `${ev.id}@${ymdKey(date)}`,
      event: ev,
      date,
      lunar,
      note,
      meaning: m.meaning,
      milestone: m.milestone,
    });
  };

  if (ev.calendar === "solar") {
    if (ev.month === 2 && ev.day === 29 && !isLeapYear(year)) {
      push({ y: year, m: 2, d: 28 }, year, undefined, "평년이라 2월 28일로");
    } else {
      push({ y: year, m: ev.month, d: ev.day }, year);
    }
  } else {
    // 음력 날짜는 양력 연도를 넘을 수 있으므로 전년도 음력까지 확인
    for (const ly of [year - 1, year]) {
      const r = resolveLunar(ly, ev.month, ev.day, ev.leap);
      if (r && r.solar.y === year) push(r.solar, ly, r.lunar, r.note);
    }
  }

  // 백일 (출생일 포함 100일째)
  if (ev.kind === "birthday") {
    const b = birthSolar(ev);
    if (b) {
      const h = addDays(b, 99);
      if (h.y === year) {
        out.push({
          key: `${ev.id}@100@${ymdKey(h)}`,
          event: ev,
          date: h,
          lunar: solarToLunar(h.y, h.m, h.d) ?? undefined,
          meaning: "백일",
          milestone: { name: "백일", desc: "태어난 지 100일째", major: true },
          special: "100days",
        });
      }
    }
  }
  return out;
}

export function occurrencesInYear(events: FamilyEvent[], year: number, s: Settings): Occurrence[] {
  return events
    .flatMap((e) => occurrencesForEvent(e, year, s))
    .sort((a, b) => toNum(a.date) - toNum(b.date) || a.event.name.localeCompare(b.event.name, "ko"));
}

/** 이 가족의 다가오는 의미 있는 날(앞으로 maxYears년) */
export function upcomingMilestonesOf(ev: FamilyEvent, from: YMD, s: Settings, maxYears = 40): Occurrence[] {
  if (ev.year == null) return [];
  const out: Occurrence[] = [];
  for (let y = from.y; y <= from.y + maxYears; y++) {
    for (const o of occurrencesForEvent(ev, y, s)) {
      if (o.milestone && toNum(o.date) >= toNum(from)) out.push(o);
    }
  }
  return out;
}

// ---------- 공휴일 ----------
export interface Holiday {
  date: YMD;
  name: string;
}

export function holidaysInYear(year: number): Holiday[] {
  const list: Holiday[] = [];
  const fixed: [number, number, string][] = [
    [1, 1, "신정"],
    [3, 1, "삼일절"],
    [5, 5, "어린이날"],
    [6, 6, "현충일"],
    [8, 15, "광복절"],
    [10, 3, "개천절"],
    [10, 9, "한글날"],
    [12, 25, "성탄절"],
  ];
  for (const [m, d, name] of fixed) list.push({ date: { y: year, m, d }, name });
  const seol = resolveLunar(year, 1, 1)?.solar;
  if (seol) {
    list.push({ date: addDays(seol, -1), name: "설 연휴" });
    list.push({ date: seol, name: "설날" });
    list.push({ date: addDays(seol, 1), name: "설 연휴" });
  }
  const buddha = resolveLunar(year, 4, 8)?.solar;
  if (buddha) list.push({ date: buddha, name: "부처님오신날" });
  const chuseok = resolveLunar(year, 8, 15)?.solar;
  if (chuseok) {
    list.push({ date: addDays(chuseok, -1), name: "추석 연휴" });
    list.push({ date: chuseok, name: "추석" });
    list.push({ date: addDays(chuseok, 1), name: "추석 연휴" });
  }
  return list.sort((a, b) => toNum(a.date) - toNum(b.date));
}

// ---------- 표시용 문자열 ----------
export function originalDateText(ev: FamilyEvent) {
  const md = `${ev.month}월 ${ev.day}일`;
  return ev.calendar === "lunar" ? `음력 ${ev.leap ? "윤" : ""}${md}` : `양력 ${md}`;
}
