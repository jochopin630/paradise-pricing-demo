// 음력 환산 검증: 가족 카드(2016년)와 설날·추석 공휴일
import { resolveLunar } from "./lunar";
import { addDays, type YMD } from "./events";

const p = (n: number) => String(n).padStart(2, "0");
const md = (d: YMD) => `${p(d.m)}-${p(d.d)}`;

// [이름, 음력 MM-DD, 카드에 적힌 2016년 양력]
export const CARD_2016: [string, string, string][] = [
  ["할아버지 제사", "01-14", "02-22"],
  ["병남형 생신", "01-29", "03-08"],
  ["고정리 합제", "03-05", "04-11"],
  ["큰 할머니 제사", "03-19", "04-25"],
  ["애희 생일", "03-20", "04-26"],
  ["병남형 형수 생신", "04-29", "06-04"],
  ["장모님 생신", "05-18", "06-22"],
  ["어머님 생신", "05-27", "07-01"],
  ["종조 할아버지 제사", "07-02", "08-04"],
  ["처제 생일", "07-14", "08-16"],
  ["용호형 생신", "07-29", "08-31"],
  ["할머니 제사", "08-26", "09-26"],
  ["장인 어른 생신", "09-17", "10-17"],
  ["처남 생일", "09-20", "10-20"],
  ["유빈 생일", "09-27", "10-27"],
  ["조용철 생일", "11-08", "12-06"],
  ["병학형 생신", "11-15", "12-13"],
  ["아버님 생신", "11-18", "12-16"],
];

// 정부 지정 공휴일 기준 설날·추석 당일 (양력)
export const HOLIDAYS: [number, string, string][] = [
  [2016, "02-08", "09-15"],
  [2017, "01-28", "10-04"],
  [2018, "02-16", "09-24"],
  [2019, "02-05", "09-13"],
  [2020, "01-25", "10-01"],
  [2021, "02-12", "09-21"],
  [2022, "02-01", "09-10"],
  [2023, "01-22", "09-29"],
  [2024, "02-10", "09-17"],
  [2025, "01-29", "10-06"],
  [2026, "02-17", "09-25"],
  [2027, "02-07", "09-15"], // 중국 음력과 하루 다른 해 (중국 설은 2/6)
  [2028, "01-27", "10-03"],
  [2029, "02-13", "09-22"],
  [2030, "02-03", "09-12"],
];

export interface CardCheck {
  name: string;
  lunar: string;
  computed: string;
  card: string;
  ok: boolean;
  diff: number;
}

export function checkCard(): CardCheck[] {
  return CARD_2016.map(([name, lunar, card]) => {
    const [m, d] = lunar.split("-").map(Number);
    const r = resolveLunar(2016, m, d)!.solar;
    const [cm, cd] = card.split("-").map(Number);
    const diff = Math.round((Date.UTC(2016, cm - 1, cd) - Date.UTC(r.y, r.m - 1, r.d)) / 86400000);
    return { name, lunar, computed: md(r), card, ok: md(r) === card, diff };
  });
}

export function checkHolidays() {
  return HOLIDAYS.map(([y, seol, chuseok]) => {
    const s = resolveLunar(y, 1, 1)!.solar;
    const c = resolveLunar(y, 8, 15)!.solar;
    return {
      year: y,
      seol: md(s),
      seolOk: md(s) === seol,
      seolEve: md(addDays(s, -1)),
      chuseok: md(c),
      chuseokOk: md(c) === chuseok,
    };
  });
}
