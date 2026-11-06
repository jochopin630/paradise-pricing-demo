"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import {
  WEEK,
  addDays,
  daysInMonth,
  dday,
  diffDays,
  fmtLunar,
  holidaysInYear,
  occurrencesForEvent,
  occurrencesInYear,
  originalDateText,
  toNum,
  todayYMD,
  upcomingMilestonesOf,
  weekday,
  ymdKey,
  type Occurrence,
  type YMD,
} from "./lib/events";
import { lunarMonthDays, solarToLunar } from "./lib/lunar";
import {
  buildIcs,
  downloadFile,
  loadEvents,
  loadSettings,
  newId,
  parseBackup,
  saveEvents,
  saveSettings,
} from "./lib/store";
import { seedEvents } from "./lib/seed";
import { KIND_LABEL, YEAR_LABEL, type FamilyEvent, type Kind, type Settings, type Side } from "./lib/types";
import { checkCard, checkHolidays } from "./lib/verify";

type Tab = "cal" | "list" | "family" | "settings";

const KIND_STYLE: Record<Kind, { chip: string; dot: string }> = {
  birthday: { chip: "bg-rose-100 text-rose-800", dot: "bg-rose-500" },
  wedding: { chip: "bg-violet-100 text-violet-800", dot: "bg-violet-500" },
  memorial: { chip: "bg-slate-200 text-slate-800", dot: "bg-slate-600" },
  rite: { chip: "bg-teal-100 text-teal-800", dot: "bg-teal-600" },
  other: { chip: "bg-sky-100 text-sky-800", dot: "bg-sky-500" },
};
const SIDE_STYLE: Record<Side, string> = {
  본가: "bg-blue-100 text-blue-800",
  처가: "bg-orange-100 text-orange-800",
  공통: "bg-green-100 text-green-800",
};

const subscribeNoop = () => () => {};

export default function FamilyAppGate() {
  // 저장된 데이터는 브라우저에만 있으므로 클라이언트에서만 그림
  const isClient = useSyncExternalStore(subscribeNoop, () => true, () => false);
  if (!isClient) return <div className="min-h-dvh bg-stone-50 p-8 text-center text-xl text-stone-500">불러오는 중…</div>;
  return <FamilyApp />;
}

function FamilyApp() {
  const [events, setEvents] = useState<FamilyEvent[]>(loadEvents);
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [today] = useState<YMD>(todayYMD);
  const [tab, setTab] = useState<Tab>("cal");
  const [view, setView] = useState({ y: today.y, m: today.m });
  const [selected, setSelected] = useState<YMD>(today);
  const [editing, setEditing] = useState<FamilyEvent | null>(null);

  useEffect(() => saveEvents(events), [events]);
  useEffect(() => saveSettings(settings), [settings]);
  useEffect(() => {
    const el = document.documentElement;
    const prev = el.style.fontSize;
    el.style.fontSize = `${settings.fontScale * 100}%`;
    return () => {
      el.style.fontSize = prev;
    };
  }, [settings.fontScale]);

  // 앱 설치용 서비스 워커
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/family-sw.js", { scope: "/family" }).catch(() => {});
    }
  }, []);

  // 다가오는 중요한 날 (오늘부터 1년)
  const upcoming = useMemo(() => {
    const end = addDays(today, 366);
    return [today.y, today.y + 1]
      .flatMap((y) => occurrencesInYear(events, y, settings))
      .filter((o) => toNum(o.date) >= toNum(today) && toNum(o.date) <= toNum(end));
  }, [events, settings, today]);

  // 하루 한 번, 휴대폰 알림
  useEffect(() => {
    notifyOncePerDay(upcoming, today, settings.notifyDays);
  }, [upcoming, today, settings.notifyDays]);

  const save = (ev: FamilyEvent) => {
    setEvents((list) => (list.some((e) => e.id === ev.id) ? list.map((e) => (e.id === ev.id ? ev : e)) : [...list, ev]));
    setEditing(null);
  };
  const remove = (id: string) => {
    setEvents((list) => list.filter((e) => e.id !== id));
    setEditing(null);
  };

  return (
    <div className="min-h-dvh bg-stone-100 text-stone-900">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col bg-stone-50 shadow-sm">
        <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/95 px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] backdrop-blur">
          <h1 className="text-2xl font-extrabold tracking-tight">우리 가족 기념일</h1>
          <p className="mt-0.5 text-base text-stone-600">
            오늘 {today.y}년 {today.m}월 {today.d}일 ({WEEK[weekday(today)]}) · 음력 {lunarText(today)}
          </p>
        </header>

        <main className="flex-1 px-3 pb-28 pt-3">
          {tab === "cal" && (
            <CalendarTab
              events={events}
              settings={settings}
              today={today}
              view={view}
              setView={setView}
              selected={selected}
              setSelected={setSelected}
              upcoming={upcoming}
              onEdit={setEditing}
            />
          )}
          {tab === "list" && <ListTab events={events} settings={settings} today={today} onEdit={setEditing} />}
          {tab === "family" && (
            <FamilyTab events={events} settings={settings} today={today} onEdit={setEditing} onAdd={() => setEditing(blankEvent())} />
          )}
          {tab === "settings" && (
            <SettingsTab events={events} setEvents={setEvents} settings={settings} setSettings={setSettings} today={today} />
          )}
        </main>

        <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white pb-[env(safe-area-inset-bottom)]">
          <div className="mx-auto grid max-w-md grid-cols-4">
            {(
              [
                ["cal", "달력", "📅"],
                ["list", "목록", "📋"],
                ["family", "가족", "👪"],
                ["settings", "설정", "⚙️"],
              ] as [Tab, string, string][]
            ).map(([t, label, icon]) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex flex-col items-center py-2 text-base font-bold ${tab === t ? "text-rose-700" : "text-stone-500"}`}
              >
                <span className="text-2xl leading-none" aria-hidden>
                  {icon}
                </span>
                {label}
              </button>
            ))}
          </div>
        </nav>
      </div>

      {editing && (
        <EditSheet
          initial={editing}
          isNew={!events.some((e) => e.id === editing.id)}
          settings={settings}
          today={today}
          onCancel={() => setEditing(null)}
          onSave={save}
          onDelete={remove}
        />
      )}
    </div>
  );
}

function lunarText(d: YMD) {
  const l = solarToLunar(d.y, d.m, d.d);
  return l ? `${l.leap ? "윤" : ""}${l.m}월 ${l.d}일` : "-";
}

function blankEvent(): FamilyEvent {
  return {
    id: newId(),
    name: "",
    side: "본가",
    kind: "birthday",
    label: "생일",
    calendar: "lunar",
    month: 1,
    day: 1,
    leap: false,
    year: null,
    title: "",
    relation: "",
    memo: "",
  };
}

function notifyOncePerDay(upcoming: Occurrence[], today: YMD, days: number) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const key = "family-cal:notified";
  const stamp = ymdKey(today);
  try {
    if (localStorage.getItem(key) === stamp) return;
    localStorage.setItem(key, stamp);
  } catch {
    return;
  }
  const items = upcoming.filter((o) => {
    const n = diffDays(today, o.date);
    return n <= 3 || (o.milestone?.major && n <= days);
  });
  if (!items.length) return;
  const body = items
    .slice(0, 6)
    .map((o) => `${dday(today, o.date)} ${o.date.m}/${o.date.d} ${o.event.title || o.event.name} ${o.milestone?.major ? `★${o.milestone.name}` : o.event.label}`)
    .join("\n");
  const title = "가족 기념일 알림";
  navigator.serviceWorker?.ready
    .then((r) => r.showNotification(title, { body, icon: "/family-icon-192.png", tag: "family-daily" }))
    .catch(() => new Notification(title, { body }));
}

// =================== 공용 카드 ===================
function OccCard({ o, today, onEdit, showDate = true }: { o: Occurrence; today: YMD; onEdit: (e: FamilyEvent) => void; showDate?: boolean }) {
  const e = o.event;
  const ks = KIND_STYLE[e.kind];
  const major = o.milestone?.major;
  const n = diffDays(today, o.date);
  return (
    <button
      onClick={() => onEdit(e)}
      className={`flex w-full items-stretch gap-3 rounded-2xl border p-3 text-left shadow-sm active:scale-[0.99] ${
        major ? "border-amber-400 bg-amber-50" : "border-stone-200 bg-white"
      }`}
    >
      {showDate && (
        <div className="flex w-16 shrink-0 flex-col items-center justify-center rounded-xl bg-stone-100 py-1">
          <span className="text-2xl font-extrabold leading-tight">
            {o.date.m}.{o.date.d}
          </span>
          <span className={`text-base font-bold ${weekday(o.date) === 0 ? "text-red-600" : weekday(o.date) === 6 ? "text-blue-600" : "text-stone-600"}`}>
            {WEEK[weekday(o.date)]}요일
          </span>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xl font-extrabold leading-snug">
            {e.title || e.name} <span className="font-bold text-stone-600">{o.special === "100days" ? "백일" : e.label}</span>
          </p>
          <span className={`shrink-0 rounded-lg px-2 py-0.5 text-base font-bold ${n === 0 ? "bg-rose-600 text-white" : n > 0 && n <= 7 ? "bg-rose-100 text-rose-700" : "text-stone-500"}`}>
            {dday(today, o.date)}
          </span>
        </div>
        {major && (
          <p className="mt-1 text-lg font-extrabold text-amber-800">
            ★ {o.milestone!.name} <span className="text-base font-semibold text-amber-700">— {o.milestone!.desc}</span>
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1.5 text-base">
          <span className={`rounded-md px-1.5 font-semibold ${SIDE_STYLE[e.side]}`}>{e.side}</span>
          <span className={`rounded-md px-1.5 font-semibold ${ks.chip}`}>{KIND_LABEL[e.kind]}</span>
          {e.calendar === "lunar" && <span className="rounded-md bg-stone-200 px-1.5 font-semibold text-stone-700">{originalDateText(e)}</span>}
          {o.meaning && !major && <span className="rounded-md bg-amber-100 px-1.5 font-bold text-amber-900">{o.meaning}{o.milestone ? ` · ${o.milestone.name}` : ""}</span>}
          {o.meaning && major && <span className="rounded-md bg-amber-200 px-1.5 font-bold text-amber-900">{o.meaning}</span>}
        </div>
        <p className="mt-1 text-base text-stone-600">
          {e.name !== e.title && <span>{e.name} · </span>}
          {e.relation}
        </p>
        {o.note && <p className="mt-0.5 text-base font-semibold text-sky-700">※ {o.note}</p>}
      </div>
    </button>
  );
}

// =================== 달력 ===================
function CalendarTab(props: {
  events: FamilyEvent[];
  settings: Settings;
  today: YMD;
  view: { y: number; m: number };
  setView: (v: { y: number; m: number }) => void;
  selected: YMD;
  setSelected: (d: YMD) => void;
  upcoming: Occurrence[];
  onEdit: (e: FamilyEvent) => void;
}) {
  const { events, settings, today, view, setView, selected, setSelected, upcoming, onEdit } = props;
  const occ = useMemo(() => occurrencesInYear(events, view.y, settings), [events, view.y, settings]);
  const hol = useMemo(() => holidaysInYear(view.y), [view.y]);

  const byDay = useMemo(() => {
    const m = new Map<string, Occurrence[]>();
    for (const o of occ) {
      const k = ymdKey(o.date);
      m.set(k, [...(m.get(k) ?? []), o]);
    }
    return m;
  }, [occ]);
  const holByDay = useMemo(() => new Map(hol.map((h) => [ymdKey(h.date), h.name])), [hol]);

  const first = weekday({ y: view.y, m: view.m, d: 1 });
  const dim = daysInMonth(view.y, view.m);
  const cells: (YMD | null)[] = [...Array(first).fill(null), ...Array.from({ length: dim }, (_, i) => ({ y: view.y, m: view.m, d: i + 1 }))];
  while (cells.length % 7) cells.push(null);

  const move = (delta: number) => {
    const t = view.y * 12 + (view.m - 1) + delta;
    setView({ y: Math.floor(t / 12), m: (t % 12) + 1 });
  };
  const monthOcc = occ.filter((o) => o.date.m === view.m);
  const selOcc = byDay.get(ymdKey(selected)) ?? [];
  const selHol = holByDay.get(ymdKey(selected));
  const majors = upcoming.filter((o) => o.milestone?.major);
  const soon = upcoming.filter((o) => diffDays(today, o.date) <= 14);
  const missingYears = events.filter((e) => e.year == null && e.kind !== "rite").length;

  return (
    <div className="space-y-4">
      {/* 중요한 날 알림 */}
      <section className="rounded-2xl border-2 border-amber-300 bg-amber-50 p-3">
        <h2 className="text-xl font-extrabold text-amber-900">🔔 꼭 챙길 의미 있는 날</h2>
        {majors.length > 0 ? (
          <div className="mt-2 space-y-2">
            {majors.map((o) => (
              <OccCard key={o.key} o={o} today={today} onEdit={onEdit} />
            ))}
          </div>
        ) : (
          <p className="mt-1 text-lg text-amber-900">앞으로 1년 안에는 환갑·칠순 같은 특별한 해가 없어요.</p>
        )}
        {missingYears > 0 && (
          <p className="mt-2 text-base text-amber-800">
            출생·결혼·별세년도를 넣으면 환갑, 칠순, 주년, 주기를 자동으로 알려드려요. (아직 {missingYears}명 미입력 → 아래 ‘가족’ 탭)
          </p>
        )}
      </section>

      {soon.length > 0 && (
        <section>
          <h2 className="mb-2 text-xl font-extrabold">다가오는 2주</h2>
          <div className="space-y-2">
            {soon.map((o) => (
              <OccCard key={o.key} o={o} today={today} onEdit={onEdit} />
            ))}
          </div>
        </section>
      )}

      {/* 달력 */}
      <section className="rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => move(-1)} className="h-12 w-12 rounded-xl bg-stone-100 text-2xl font-bold" aria-label="이전 달">
            ‹
          </button>
          <div className="text-center">
            <p className="text-2xl font-extrabold">
              {view.y}년 {view.m}월
            </p>
            {(view.y !== today.y || view.m !== today.m) && (
              <button
                onClick={() => {
                  setView({ y: today.y, m: today.m });
                  setSelected(today);
                }}
                className="text-base font-bold text-rose-700 underline"
              >
                오늘로
              </button>
            )}
          </div>
          <button onClick={() => move(1)} className="h-12 w-12 rounded-xl bg-stone-100 text-2xl font-bold" aria-label="다음 달">
            ›
          </button>
        </div>
        <div className="grid grid-cols-7 text-center text-base font-bold">
          {WEEK.map((w, i) => (
            <div key={w} className={`py-1 ${i === 0 ? "text-red-600" : i === 6 ? "text-blue-600" : "text-stone-600"}`}>
              {w}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {cells.map((c, i) => {
            if (!c) return <div key={i} />;
            const k = ymdKey(c);
            const list = byDay.get(k) ?? [];
            const h = holByDay.get(k);
            const wd = weekday(c);
            const l = solarToLunar(c.y, c.m, c.d);
            const isToday = k === ymdKey(today);
            const isSel = k === ymdKey(selected);
            return (
              <button
                key={i}
                onClick={() => setSelected(c)}
                className={`flex min-h-[4.6rem] flex-col items-center rounded-lg px-0.5 pt-0.5 ${
                  isSel ? "bg-rose-100 ring-2 ring-rose-500" : isToday ? "bg-amber-100" : list.length ? "bg-stone-50" : ""
                }`}
              >
                <span className={`text-xl font-extrabold leading-tight ${h || wd === 0 ? "text-red-600" : wd === 6 ? "text-blue-600" : ""}`}>{c.d}</span>
                <span className={`text-[0.7rem] leading-tight ${l?.d === 1 ? "font-bold text-stone-800" : "text-stone-500"}`}>
                  {l ? (l.d === 1 ? `${l.leap ? "윤" : ""}${l.m}.1` : `${l.leap ? "윤" : ""}${l.m}.${l.d}`) : ""}
                </span>
                {h && <span className="w-full truncate text-[0.62rem] font-bold leading-tight text-red-600">{h}</span>}
                <span className="mt-0.5 flex w-full flex-col gap-px">
                  {list.slice(0, 2).map((o) => (
                    <span
                      key={o.key}
                      className={`w-full truncate rounded px-0.5 text-[0.68rem] font-bold leading-tight ${
                        o.milestone?.major ? "bg-amber-400 text-amber-950" : KIND_STYLE[o.event.kind].chip
                      }`}
                    >
                      {shortName(o)}
                    </span>
                  ))}
                  {list.length > 2 && <span className="text-[0.65rem] font-bold text-stone-500">+{list.length - 2}</span>}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 px-1 text-sm text-stone-500">작은 숫자는 음력 날짜입니다. 날짜를 누르면 아래에 자세히 나와요.</p>
      </section>

      {/* 선택한 날 */}
      <section>
        <h2 className="mb-2 text-xl font-extrabold">
          {selected.m}월 {selected.d}일 ({WEEK[weekday(selected)]}) <span className="text-lg font-bold text-stone-500">음력 {lunarText(selected)}</span>
        </h2>
        {selHol && <p className="mb-2 text-lg font-bold text-red-600">🎌 {selHol}</p>}
        {selOcc.length ? (
          <div className="space-y-2">
            {selOcc.map((o) => (
              <OccCard key={o.key} o={o} today={today} onEdit={onEdit} showDate={false} />
            ))}
          </div>
        ) : (
          !selHol && <p className="text-lg text-stone-500">이 날은 일정이 없어요.</p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-xl font-extrabold">{view.m}월 전체 ({monthOcc.length}건)</h2>
        <div className="space-y-2">
          {monthOcc.map((o) => (
            <OccCard key={o.key} o={o} today={today} onEdit={onEdit} />
          ))}
          {!monthOcc.length && <p className="text-lg text-stone-500">이 달은 가족 일정이 없어요.</p>}
        </div>
      </section>
    </div>
  );
}

function shortName(o: Occurrence) {
  const t = o.event.title || o.event.name;
  return t.replace(/\s*\(.*\)$/, "").replace(/님$/, "");
}

// =================== 목록 ===================
function ListTab({ events, settings, today, onEdit }: { events: FamilyEvent[]; settings: Settings; today: YMD; onEdit: (e: FamilyEvent) => void }) {
  const [year, setYear] = useState(today.y);
  const [side, setSide] = useState<Side | "전체">("전체");
  const [onlyMajor, setOnlyMajor] = useState(false);
  const occ = useMemo(() => occurrencesInYear(events, year, settings), [events, year, settings]);
  const filtered = occ.filter((o) => (side === "전체" || o.event.side === side) && (!onlyMajor || o.milestone));
  const months = Array.from(new Set(filtered.map((o) => o.date.m)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between rounded-2xl bg-white p-2 shadow-sm">
        <button onClick={() => setYear(year - 1)} className="h-12 w-12 rounded-xl bg-stone-100 text-2xl font-bold" aria-label="이전 해">
          ‹
        </button>
        <p className="text-2xl font-extrabold">{year}년 전체</p>
        <button onClick={() => setYear(year + 1)} className="h-12 w-12 rounded-xl bg-stone-100 text-2xl font-bold" aria-label="다음 해">
          ›
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {(["전체", "본가", "처가", "공통"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`rounded-full px-4 py-1.5 text-lg font-bold ${side === s ? "bg-stone-900 text-white" : "bg-white text-stone-700 shadow-sm"}`}
          >
            {s}
          </button>
        ))}
        <button
          onClick={() => setOnlyMajor(!onlyMajor)}
          className={`rounded-full px-4 py-1.5 text-lg font-bold ${onlyMajor ? "bg-amber-500 text-white" : "bg-white text-amber-800 shadow-sm"}`}
        >
          ★ 의미 있는 날만
        </button>
      </div>
      {months.map((m) => (
        <section key={m}>
          <h2 className="sticky top-[5.2rem] z-10 -mx-1 bg-stone-50/95 px-1 py-1 text-xl font-extrabold">{m}월</h2>
          <div className="space-y-2">
            {filtered
              .filter((o) => o.date.m === m)
              .map((o) => (
                <OccCard key={o.key} o={o} today={today} onEdit={onEdit} />
              ))}
          </div>
        </section>
      ))}
      {!filtered.length && <p className="p-4 text-lg text-stone-500">해당하는 일정이 없어요.</p>}
    </div>
  );
}

// =================== 가족 ===================
function FamilyTab({
  events,
  settings,
  today,
  onEdit,
  onAdd,
}: {
  events: FamilyEvent[];
  settings: Settings;
  today: YMD;
  onEdit: (e: FamilyEvent) => void;
  onAdd: () => void;
}) {
  const [q, setQ] = useState("");
  const list = events.filter((e) => !q || `${e.name} ${e.title} ${e.relation} ${e.label}`.includes(q.trim()));
  return (
    <div className="space-y-3">
      <button onClick={onAdd} className="w-full rounded-2xl bg-rose-600 py-4 text-xl font-extrabold text-white shadow active:bg-rose-700">
        ＋ 가족·기념일 추가
      </button>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="이름·호칭으로 찾기"
        className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-lg"
      />
      {(["본가", "처가", "공통"] as Side[]).map((side) => {
        const group = list.filter((e) => e.side === side);
        if (!group.length) return null;
        return (
          <section key={side}>
            <h2 className="mb-2 text-xl font-extrabold">
              <span className={`rounded-lg px-2 ${SIDE_STYLE[side]}`}>{side}</span> <span className="text-stone-500">{group.length}건</span>
            </h2>
            <div className="divide-y divide-stone-200 overflow-hidden rounded-2xl border border-stone-200 bg-white">
              {group.map((e) => {
                const occs = occurrencesForEvent(e, today.y, settings).filter((o) => !o.special);
                const occ = occs[occs.length - 1];
                const next = upcomingMilestonesOf(e, today, settings, 40)[0];
                return (
                  <button key={e.id} onClick={() => onEdit(e)} className="block w-full p-3 text-left active:bg-stone-50">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-xl font-extrabold">
                        {e.title || e.name} <span className="text-lg font-bold text-stone-500">{e.label}</span>
                      </p>
                      <span className="shrink-0 text-base font-bold text-rose-700">수정 ›</span>
                    </div>
                    <p className="text-base text-stone-600">
                      {e.name} · {e.relation}
                    </p>
                    <p className="mt-0.5 text-lg">
                      {originalDateText(e)}
                      {occ && e.calendar === "lunar" && (
                        <span className="font-bold">
                          {" "}
                          → 올해 {occs.map((o) => `${o.date.m}월 ${o.date.d}일`).join(", ")}
                        </span>
                      )}
                    </p>
                    <p className="text-base text-stone-600">
                      {YEAR_LABEL[e.kind]}: {e.year ?? <span className="text-stone-400">미입력</span>}
                      {occ?.meaning && <span className="font-bold text-amber-800"> · 올해 {occ.meaning}</span>}
                    </p>
                    {next && (
                      <p className="text-base font-bold text-amber-700">
                        ★ 다음: {next.milestone!.name} — {next.date.y}년 {next.date.m}월 {next.date.d}일
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

// =================== 추가·수정 ===================
const KIND_DEFAULT_LABEL: Record<Kind, string> = {
  birthday: "생일",
  wedding: "결혼기념",
  memorial: "제사",
  rite: "시제",
  other: "기념일",
};

function EditSheet({
  initial,
  isNew,
  settings,
  today,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: FamilyEvent;
  isNew: boolean;
  settings: Settings;
  today: YMD;
  onCancel: () => void;
  onSave: (e: FamilyEvent) => void;
  onDelete: (id: string) => void;
}) {
  const [f, setF] = useState<FamilyEvent>(initial);
  const [yearText, setYearText] = useState(initial.year?.toString() ?? "");
  const set = <K extends keyof FamilyEvent>(k: K, v: FamilyEvent[K]) => setF((p) => ({ ...p, [k]: v }));

  const yearNum = /^\d{4}$/.test(yearText) ? Number(yearText) : null;
  const draft: FamilyEvent = { ...f, year: yearNum, name: f.name || f.title || "(이름 없음)" };
  const maxDay = f.calendar === "lunar" ? 30 : daysInMonth(2024, f.month);
  const preview = [today.y, today.y + 1].flatMap((y) => occurrencesForEvent(draft, y, settings));
  const milestones = upcomingMilestonesOf(draft, today, settings, 45).slice(0, 4);
  const lunarSmall = f.calendar === "lunar" && f.day === 30 && yearNum && lunarMonthDays(yearNum, f.month, f.leap) === 29;

  const field = "w-full rounded-xl border border-stone-300 bg-white px-3 py-3 text-lg";
  const lab = "mb-1 block text-lg font-bold";

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/40">
      <div className="flex h-full w-full max-w-md flex-col bg-stone-50">
        <div className="flex items-center justify-between border-b border-stone-200 bg-white px-4 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button onClick={onCancel} className="text-lg font-bold text-stone-600">
            취소
          </button>
          <h2 className="text-xl font-extrabold">{isNew ? "새로 추가" : "수정"}</h2>
          <button
            onClick={() => onSave({ ...draft, name: f.name.trim() || f.title.trim() || "(이름 없음)" })}
            className="rounded-xl bg-rose-600 px-4 py-2 text-lg font-extrabold text-white"
          >
            저장
          </button>
        </div>
        <div className="flex-1 space-y-4 overflow-y-auto p-4 pb-16">
          <div>
            <label className={lab}>이름 (카드 표기)</label>
            <input className={field} value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="예: 어머님, 승환이(큰형)" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lab}>호칭 (나 기준)</label>
              <input className={field} value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="예: 큰형수님" />
            </div>
            <div>
              <label className={lab}>관계</label>
              <input className={field} value={f.relation} onChange={(e) => set("relation", e.target.value)} placeholder="예: 첫째 형의 부인" />
            </div>
          </div>
          <div>
            <label className={lab}>분류</label>
            <Segmented value={f.side} options={["본가", "처가", "공통"]} onChange={(v) => set("side", v as Side)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={lab}>종류</label>
              <select
                className={field}
                value={f.kind}
                onChange={(e) => {
                  const k = e.target.value as Kind;
                  setF((p) => ({ ...p, kind: k, label: Object.values(KIND_DEFAULT_LABEL).includes(p.label) || !p.label ? KIND_DEFAULT_LABEL[k] : p.label }));
                }}
              >
                {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
                  <option key={k} value={k}>
                    {KIND_LABEL[k]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={lab}>표시 이름</label>
              <input className={field} value={f.label} onChange={(e) => set("label", e.target.value)} placeholder="생일 / 생신 / 제사" />
            </div>
          </div>
          <div>
            <label className={lab}>날짜</label>
            <Segmented
              value={f.calendar === "lunar" ? "음력" : "양력"}
              options={["음력", "양력"]}
              onChange={(v) => setF((p) => ({ ...p, calendar: v === "음력" ? "lunar" : "solar", leap: v === "음력" ? p.leap : false }))}
            />
            <div className="mt-2 grid grid-cols-2 gap-3">
              <select className={field} value={f.month} onChange={(e) => set("month", Number(e.target.value))}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}월
                  </option>
                ))}
              </select>
              <select className={field} value={Math.min(f.day, maxDay)} onChange={(e) => set("day", Number(e.target.value))}>
                {Array.from({ length: maxDay }, (_, i) => (
                  <option key={i} value={i + 1}>
                    {i + 1}일
                  </option>
                ))}
              </select>
            </div>
            {f.calendar === "lunar" && (
              <label className="mt-2 flex items-center gap-2 text-lg">
                <input type="checkbox" className="h-6 w-6" checked={f.leap} onChange={(e) => set("leap", e.target.checked)} />
                윤달 (그 해에 윤달이 없으면 평달로 계산)
              </label>
            )}
          </div>
          <div>
            <label className={lab}>
              {YEAR_LABEL[f.kind]} <span className="font-normal text-stone-500">(모르면 비워 두세요)</span>
            </label>
            <input
              className={field}
              inputMode="numeric"
              value={yearText}
              onChange={(e) => setYearText(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder="예: 1958"
            />
            {f.calendar === "lunar" && f.kind === "birthday" && <p className="mt-1 text-base text-stone-500">음력 생일은 태어난 해의 음력 연도를 넣으세요.</p>}
            {lunarSmall && <p className="mt-1 text-base text-sky-700">그 해 음력 {f.month}월은 29일까지라 실제 생일은 29일이었어요.</p>}
          </div>
          <div>
            <label className={lab}>메모</label>
            <textarea className={field} rows={2} value={f.memo} onChange={(e) => set("memo", e.target.value)} />
          </div>

          <div className="rounded-2xl border border-stone-200 bg-white p-3">
            <p className="text-lg font-extrabold">미리 보기</p>
            {preview.map((o) => (
              <p key={o.key} className="text-lg">
                {o.date.y}년 {o.date.m}월 {o.date.d}일 ({WEEK[weekday(o.date)]}){o.lunar && <span className="text-stone-500"> · 음력 {fmtLunar(o.lunar)}</span>}
                {o.meaning && <b className="text-amber-800"> · {o.meaning}</b>}
                {o.milestone && <b className="text-amber-700"> ★{o.milestone.name}</b>}
                {o.note && <span className="text-sky-700"> ({o.note})</span>}
              </p>
            ))}
            {milestones.length > 0 && (
              <div className="mt-2 border-t border-stone-200 pt-2">
                <p className="text-lg font-extrabold text-amber-800">앞으로의 의미 있는 날</p>
                {milestones.map((o) => (
                  <p key={o.key} className="text-lg">
                    ★ {o.milestone!.name} — {o.date.y}년 {o.date.m}월 {o.date.d}일
                  </p>
                ))}
              </div>
            )}
          </div>

          {!isNew && (
            <button
              onClick={() => {
                if (confirm(`'${initial.name}' 항목을 삭제할까요?`)) onDelete(initial.id);
              }}
              className="w-full rounded-2xl border-2 border-red-300 bg-white py-3 text-lg font-extrabold text-red-600"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Segmented({ value, options, onChange }: { value: string; options: string[]; onChange: (v: string) => void }) {
  return (
    <div className="grid rounded-xl bg-stone-200 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, 1fr)` }}>
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)} className={`rounded-lg py-2 text-lg font-bold ${value === o ? "bg-white shadow" : "text-stone-600"}`}>
          {o}
        </button>
      ))}
    </div>
  );
}

// =================== 설정 ===================
function SettingsTab({
  events,
  setEvents,
  settings,
  setSettings,
  today,
}: {
  events: FamilyEvent[];
  setEvents: (e: FamilyEvent[]) => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
  today: YMD;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [perm, setPerm] = useState(typeof Notification === "undefined" ? "unsupported" : Notification.permission);
  const [showCheck, setShowCheck] = useState(false);
  const card = useMemo(() => (showCheck ? checkCard() : []), [showCheck]);
  const hol = useMemo(() => (showCheck ? checkHolidays() : []), [showCheck]);
  const box = "rounded-2xl border border-stone-200 bg-white p-4 space-y-2";
  const btn = "w-full rounded-xl bg-stone-900 py-3 text-lg font-bold text-white active:bg-stone-700";
  const btn2 = "w-full rounded-xl border-2 border-stone-300 bg-white py-3 text-lg font-bold";

  return (
    <div className="space-y-4">
      <section className={box}>
        <h2 className="text-xl font-extrabold">글씨 크기</h2>
        <Segmented
          value={settings.fontScale === 1 ? "보통" : settings.fontScale === 1.15 ? "크게" : "아주 크게"}
          options={["보통", "크게", "아주 크게"]}
          onChange={(v) => setSettings({ ...settings, fontScale: v === "보통" ? 1 : v === "크게" ? 1.15 : 1.3 })}
        />
      </section>

      <section className={box}>
        <h2 className="text-xl font-extrabold">칠순·팔순 나이 기준</h2>
        <Segmented
          value={settings.ageBasis === "traditional" ? "전통(세는나이)" : "만 나이"}
          options={["전통(세는나이)", "만 나이"]}
          onChange={(v) => setSettings({ ...settings, ageBasis: v === "만 나이" ? "western" : "traditional" })}
        />
        <p className="text-base text-stone-600">
          전통: 칠순=만 69세, 팔순=만 79세 생일에 표시. 만 나이: 칠순=만 70세. 환갑(만 60)·진갑(만 61)·돌은 어느 쪽이든 같아요.
        </p>
      </section>

      <section className={box}>
        <h2 className="text-xl font-extrabold">알림</h2>
        <p className="text-base text-stone-600">
          앱을 열 때 하루 한 번, 3일 안의 일정과 {settings.notifyDays}일 안의 환갑·칠순 같은 특별한 날을 알려드려요. 폰에서 앱을 열지 않아도 알림을 받으려면 아래
          ‘휴대폰 캘린더에 넣기’를 쓰세요.
        </p>
        <Segmented
          value={`${settings.notifyDays}일 전`}
          options={["14일 전", "30일 전", "60일 전"]}
          onChange={(v) => setSettings({ ...settings, notifyDays: parseInt(v) })}
        />
        {perm === "granted" ? (
          <p className="text-lg font-bold text-green-700">✓ 알림이 켜져 있어요</p>
        ) : perm === "unsupported" ? (
          <p className="text-base text-stone-500">이 브라우저는 알림을 지원하지 않아요. (아이폰은 홈 화면에 앱을 추가한 뒤 사용할 수 있어요)</p>
        ) : (
          <button className={btn} onClick={() => Notification.requestPermission().then(setPerm)}>
            알림 켜기
          </button>
        )}
      </section>

      <section className={box}>
        <h2 className="text-xl font-extrabold">휴대폰 캘린더에 넣기</h2>
        <p className="text-base text-stone-600">
          음력을 양력으로 바꾼 날짜로 일정 파일(.ics)을 만듭니다. 열면 삼성·구글·아이폰 캘린더에 추가되고, 하루 전 오전 9시(특별한 날은 2주 전에도) 알림이 울려요.
        </p>
        <button className={btn} onClick={() => downloadFile(`가족기념일_${today.y}-${today.y + 2}.ics`, buildIcs(events, [today.y, today.y + 1, today.y + 2], settings), "text/calendar")}>
          {today.y}~{today.y + 2}년 일정 내려받기
        </button>
      </section>

      <section className={box}>
        <h2 className="text-xl font-extrabold">백업·옮기기</h2>
        <p className="text-base text-stone-600">입력한 내용은 이 휴대폰에만 저장돼요. 폰을 바꾸거나 다른 사람과 나누려면 백업 파일을 쓰세요.</p>
        <button className={btn} onClick={() => downloadFile(`가족기념일_백업_${ymdKey(today)}.json`, JSON.stringify({ version: 1, events }, null, 2), "application/json")}>
          백업 파일 저장
        </button>
        <button className={btn2} onClick={() => fileRef.current?.click()}>
          백업 파일 불러오기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            const list = parseBackup(await file.text());
            if (!list) return alert("백업 파일을 읽을 수 없어요.");
            if (confirm(`${list.length}건으로 바꿀까요? 지금 내용은 지워집니다.`)) setEvents(list);
          }}
        />
        <button
          className={btn2}
          onClick={() => {
            if (confirm("처음 카드 내용으로 되돌릴까요? 입력한 년도·수정 내용이 모두 지워집니다.")) setEvents(seedEvents());
          }}
        >
          처음 데이터로 되돌리기
        </button>
      </section>

      <section className={box}>
        <h2 className="text-xl font-extrabold">홈 화면에 앱으로 설치</h2>
        <p className="text-lg">
          <b>아이폰</b>: Safari 아래쪽 공유 버튼 → ‘홈 화면에 추가’
          <br />
          <b>갤럭시</b>: Chrome 오른쪽 위 ⋮ → ‘홈 화면에 추가’ 또는 ‘앱 설치’
        </p>
      </section>

      <section className={box}>
        <h2 className="text-xl font-extrabold">음력 계산 방법</h2>
        <ul className="list-disc space-y-1 pl-5 text-base text-stone-700">
          <li>한국천문연구원 음력(한국 시간 기준)을 씁니다. 중국 음력과 하루 다른 해(예: 2027년 설날 2월 7일)도 한국 기준으로 맞춰요.</li>
          <li>음력 30일인데 그 해 그 달이 작은달(29일)이면 29일로 표시해요.</li>
          <li>윤달로 등록한 날은 그 해 같은 윤달이 있으면 윤달, 없으면 평달로 계산해요. 평달 등록 날짜는 윤달이 있어도 평달 기준이에요.</li>
          <li>음력 11·12월 날짜가 다음 해 1·2월로 넘어가면 그 양력 해에 표시하고, 나이·주년은 음력 연도 기준으로 셉니다.</li>
          <li>양력 2월 29일은 평년엔 2월 28일로 표시해요.</li>
          <li>공휴일은 설·추석·부처님오신날(음력)과 양력 국경일만 표시하고, 대체공휴일·임시공휴일은 빠져 있어요.</li>
        </ul>
        <button className={btn2} onClick={() => setShowCheck(!showCheck)}>
          {showCheck ? "검증 결과 접기" : "카드(2016)·설/추석 대조 결과 보기"}
        </button>
        {showCheck && (
          <div className="space-y-3 text-base">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-1">2016년</th>
                  <th>음력</th>
                  <th>계산</th>
                  <th>카드</th>
                </tr>
              </thead>
              <tbody>
                {card.map((c) => (
                  <tr key={c.name} className={`border-b border-stone-100 ${c.ok ? "" : "bg-red-50 font-bold text-red-700"}`}>
                    <td className="py-1">{c.name}</td>
                    <td>{c.lunar}</td>
                    <td>{c.computed}</td>
                    <td>
                      {c.card} {c.ok ? "✓" : `✗`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-stone-700">
              {card.filter((c) => c.ok).length}/{card.length} 일치. 불일치 2건(음력 1월)은 카드가 하루 늦게 적혀 있어요. 2016년 설날이 양력 2월 8일(=음력 1월 1일)이므로 음력
              1월 14일은 2월 21일, 1월 29일은 3월 7일이 맞습니다.
            </p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b">
                  <th className="py-1">연도</th>
                  <th>설날</th>
                  <th>추석</th>
                </tr>
              </thead>
              <tbody>
                {hol.map((h) => (
                  <tr key={h.year} className="border-b border-stone-100">
                    <td className="py-1">{h.year}</td>
                    <td>
                      {h.seol} {h.seolOk ? "✓" : "✗"}
                    </td>
                    <td>
                      {h.chuseok} {h.chuseokOk ? "✓" : "✗"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
