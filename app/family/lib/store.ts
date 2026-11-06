import { seedEvents } from "./seed";
import { DEFAULT_SETTINGS, type FamilyEvent, type Settings } from "./types";
import { addDays, occurrencesInYear, originalDateText, type YMD } from "./events";
export type { YMD };

const EVENTS_KEY = "family-cal:events:v1";
const SETTINGS_KEY = "family-cal:settings:v1";

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, v: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* 저장 공간이 막혀 있으면 이번 세션에서만 유지 */
  }
}

export const loadEvents = () => read<FamilyEvent[]>(EVENTS_KEY) ?? seedEvents();
export const saveEvents = (e: FamilyEvent[]) => write(EVENTS_KEY, e);
export const loadSettings = (): Settings => ({ ...DEFAULT_SETTINGS, ...(read<Partial<Settings>>(SETTINGS_KEY) ?? {}) });
export const saveSettings = (s: Settings) => write(SETTINGS_KEY, s);

export function newId() {
  return `e-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

/** 백업 파일 검증 */
export function parseBackup(text: string): FamilyEvent[] | null {
  try {
    const data = JSON.parse(text);
    const list = Array.isArray(data) ? data : data?.events;
    if (!Array.isArray(list)) return null;
    return list
      .filter((e) => e && typeof e.name === "string" && Number(e.month) >= 1 && Number(e.day) >= 1)
      .map((e) => ({
        id: String(e.id ?? newId()),
        name: e.name,
        side: e.side ?? "공통",
        kind: e.kind ?? "other",
        label: e.label ?? "",
        calendar: e.calendar === "lunar" ? "lunar" : "solar",
        month: Number(e.month),
        day: Number(e.day),
        leap: !!e.leap,
        year: e.year == null || e.year === "" ? null : Number(e.year),
        title: e.title ?? "",
        relation: e.relation ?? "",
        memo: e.memo ?? "",
      }));
  } catch {
    return null;
  }
}

export function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- 휴대폰 캘린더(.ics) 내보내기: 폰 기본 알림을 쓰기 위함 ----------
const pad = (n: number) => String(n).padStart(2, "0");
const icsDate = (d: YMD) => `${d.y}${pad(d.m)}${pad(d.d)}`;
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

export function buildIcs(events: FamilyEvent[], years: number[], s: Settings): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//family-calendar//KO", "CALSCALE:GREGORIAN", "X-WR-CALNAME:가족 기념일"];
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  for (const y of years) {
    for (const o of occurrencesInYear(events, y, s)) {
      const e = o.event;
      const label = o.special === "100days" ? "백일" : e.label;
      const mark = o.milestone?.major ? `★${o.milestone.name} ` : "";
      const summary = `${mark}${e.title || e.name} ${label}${o.meaning && !o.milestone ? ` (${o.meaning})` : ""}`;
      const desc = [`${e.name} · ${e.relation}`, originalDateText(e), o.meaning, o.milestone?.desc, o.note].filter(Boolean).join("\n");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${o.key}@family-calendar`,
        `DTSTAMP:${stamp}`,
        `DTSTART;VALUE=DATE:${icsDate(o.date)}`,
        `DTEND;VALUE=DATE:${icsDate(addDays(o.date, 1))}`,
        `SUMMARY:${esc(summary)}`,
        `DESCRIPTION:${esc(desc)}`,
        // 하루 전 오전 9시 알림
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${esc(summary)}`,
        "TRIGGER:-PT15H",
        "END:VALARM",
      );
      if (o.milestone?.major) {
        lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(summary)}`, "TRIGGER:-P14DT15H", "END:VALARM");
      }
      lines.push("END:VEVENT");
    }
  }
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
