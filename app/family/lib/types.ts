export type Side = "본가" | "처가" | "공통";
export type Kind = "birthday" | "wedding" | "memorial" | "rite" | "other";

export const KIND_LABEL: Record<Kind, string> = {
  birthday: "생일·생신",
  wedding: "결혼기념일",
  memorial: "제사(기일)",
  rite: "시제·합제",
  other: "기타",
};

/** 연도 칸의 이름 (종류마다 의미가 다름) */
export const YEAR_LABEL: Record<Kind, string> = {
  birthday: "출생년도",
  wedding: "결혼년도",
  memorial: "별세년도",
  rite: "시작년도",
  other: "기준년도",
};

export interface FamilyEvent {
  id: string;
  name: string; // 구분 (카드에 적힌 이름)
  side: Side;
  kind: Kind;
  label: string; // 카드의 유형 표기: 생일, 생신, 제사, 진도 시제 ...
  calendar: "solar" | "lunar";
  month: number;
  day: number;
  leap: boolean; // 윤달
  year: number | null; // 출생/결혼/별세 년도 (모르면 비움)
  title: string; // 나 기준 호칭
  relation: string; // 관계 설명
  memo: string;
}

export interface Settings {
  ageBasis: "traditional" | "western"; // 칠순 등을 세는나이(전통) / 만 나이 기준
  fontScale: number; // 1, 1.15, 1.3
  notifyDays: number; // 며칠 전부터 알려줄지
}

export const DEFAULT_SETTINGS: Settings = {
  ageBasis: "traditional",
  fontScale: 1.15,
  notifyDays: 30,
};
