'use client';

import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  TrendingUp, 
  Users, 
  Calendar, 
  Search, 
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

// Duetto Open Pricing 데이터 구조 정의
interface RoomType {
  id: string;
  type: string;
  category: string;
  base: number;
  sensitivity: number;
  minFloor: number;
  maxCeil: number;
}

const ROOM_MASTER: RoomType[] = [
  { id: 'deluxe', type: '디럭스 (Deluxe)', category: '본관', base: 350000, sensitivity: 1.0, minFloor: 230000, maxCeil: 650000 },
  { id: 'p_deluxe', type: '프리미어 디럭스', category: '본관', base: 450000, sensitivity: 1.1, minFloor: 300000, maxCeil: 800000 },
  { id: 'd_suite', type: '디럭스 스위트 (Family)', category: '패밀리', base: 800000, sensitivity: 1.3, minFloor: 550000, maxCeil: 1500000 },
  { id: 'art_duplex', type: '아트파라디소 듀플렉스', category: '아트파라디소', base: 650000, sensitivity: 0.9, minFloor: 500000, maxCeil: 1100000 },
  { id: 'exec_suite', type: '이그제큐티브 스위트', category: 'MICE/VIP', base: 1200000, sensitivity: 1.4, minFloor: 900000, maxCeil: 2200000 },
  { id: 'villa', type: '디럭스 풀빌라 (VVIP)', category: 'VIP', base: 6000000, sensitivity: 0.0, minFloor: 6000000, maxCeil: 6000000 },
];

export default function DynamicPricingDashboard() {
  // 파라미터 상태 관리
  const [eventScenario, setEventScenario] = useState<string>('NORMAL');
  const [leadTime, setLeadTime] = useState<number>(14);
  const [occupancy, setOccupancy] = useState<number>(65);
  const [searchVelocity, setSearchVelocity] = useState<number>(100);

  // Duetto Open Pricing 로직에 따른 실시간 가격 산출
  const pricingData = useMemo(() => {
    return ROOM_MASTER.map((room) => {
      let multiplier = 1.0;

      // 시나리오 조건
      if (eventScenario === 'MICE' && leadTime >= 30) multiplier += 0.40;
      if (eventScenario === 'CIMER' && occupancy >= 70) multiplier += 0.50;
      if (eventScenario === 'CONCERT' && searchVelocity >= 200) multiplier += 0.60;
      if (eventScenario === 'FAMILY' && room.category === '패밀리') multiplier += 0.35;
      if (eventScenario === 'FLIGHT_CANCEL' && leadTime === 0) multiplier -= 0.15;

      // Open Pricing 감응도 수식
      if (room.sensitivity > 0) {
        if (occupancy >= 80) multiplier += (occupancy - 80) * 0.015 * room.sensitivity;
        if (searchVelocity >= 150) multiplier += (searchVelocity - 150) * 0.001 * room.sensitivity;
        if (occupancy < 45 && leadTime <= 3) multiplier -= (45 - occupancy) * 0.01 * room.sensitivity;
      }

      // Floor & Ceiling 적용
      let calculatedPrice = room.base * multiplier;
      calculatedPrice = Math.max(room.minFloor, Math.min(room.maxCeil, calculatedPrice));
      calculatedPrice = Math.round(calculatedPrice / 1000) * 1000;

      const finalMultiplier = parseFloat((calculatedPrice / room.base).toFixed(2));
      const diffPercent = Math.round((finalMultiplier - 1) * 100);

      return {
        ...room,
        calculatedPrice,
        finalMultiplier,
        diffPercent,
      };
    });
  }, [eventScenario, leadTime, occupancy, searchVelocity]);

  // 대시보드 요약 KPI 계산
  const summaryKPI = useMemo(() => {
    const totalADR = pricingData.reduce((acc, cur) => acc + cur.calculatedPrice, 0);
    const avgADR = Math.round(totalADR / pricingData.length);
    const revpar = Math.round(avgADR * (occupancy / 100));
    return { avgADR, revpar };
  }, [pricingData, occupancy]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 헤더 */}
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <Building2 className="w-7 h-7 text-amber-500" />
            <h1 className="text-xl font-bold tracking-tight text-amber-500">
              PARADISE CITY <span className="text-slate-400 font-normal">| RMS Open Pricing Engine</span>
            </h1>
          </div>
          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold">
            Duetto GameChanger Architecture
          </span>
        </header>

        {/* 요약 KPI 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-sm">
              <span>예상 총 점유율 (Forecast OCC)</span>
              <Users className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-2">{occupancy}%</div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-sm">
              <span>목표 평균 단가 (Target ADR)</span>
              <TrendingUp className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-2">
              ₩{summaryKPI.avgADR.toLocaleString()}
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div className="flex justify-between items-center text-slate-400 text-sm">
              <span>예상 RevPAR</span>
              <Calendar className="w-4 h-4 text-slate-500" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-2">
              ₩{summaryKPI.revpar.toLocaleString()}
            </div>
          </div>
        </div>

        {/* 메인 컨트롤러 & 테이블 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 사이드바 파라미터 조절 */}
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-5">
            <div className="flex items-center space-x-2 border-b border-slate-800 pb-3">
              <SlidersHorizontal className="w-5 h-5 text-amber-500" />
              <h2 className="font-semibold text-slate-200">수요 변수 설정 (Variables)</h2>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-slate-400">수요 이벤트 시나리오</label>
              <select
                value={eventScenario}
                onChange={(e) => setEventScenario(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="NORMAL">일반 평일 / 주말</option>
                <option value="MICE">인천공항 대형 MICE / 국제회의</option>
                <option value="CIMER">씨메르 썸머 풀파티 (여름 피크)</option>
                <option value="CONCERT">스튜디오 파라다이스 K-POP 콘서트</option>
                <option value="FAMILY">어린이날 / 키캉스 시즌</option>
                <option value="FLIGHT_CANCEL">인천공항 기상악화 (대규모 결항)</option>
              </select>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">잔여 리드타임 (Lead Time)</span>
                <span className="text-amber-400 font-bold">D-{leadTime}일</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                value={leadTime}
                onChange={(e) => setLeadTime(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">현재 객실 점유율 (Occupancy)</span>
                <span className="text-amber-400 font-bold">{occupancy}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={occupancy}
                onChange={(e) => setOccupancy(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-950"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">실시간 검색량 증가율 (Velocity)</span>
                <span className="text-amber-400 font-bold">+{searchVelocity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                step="10"
                value={searchVelocity}
                onChange={(e) => setSearchVelocity(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-950"
              />
            </div>
          </div>

          {/* 메인 데이터 테이블 */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl space-y-4">
            <h2 className="font-semibold text-slate-200">객실 라인업별 Open Pricing 추천가</h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 text-xs bg-slate-950/50">
                    <th className="p-3">객실 분류</th>
                    <th className="p-3">기준가 (Base)</th>
                    <th className="p-3">승수 (Multiplier)</th>
                    <th className="p-3">추천 판매가</th>
                    <th className="p-3">변동률</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pricingData.map((room) => (
                    <tr key={room.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 font-medium text-slate-200">
                        {room.type}
                        <span className="block text-xs text-slate-500 font-normal">{room.category}</span>
                      </td>
                      <td className="p-3 text-slate-400">₩{room.base.toLocaleString()}</td>
                      <td className="p-3 text-slate-400">x {room.finalMultiplier}</td>
                      <td className="p-3 font-bold text-slate-100">
                        ₩{room.calculatedPrice.toLocaleString()}
                      </td>
                      <td className="p-3">
                        {room.diffPercent > 0 ? (
                          <span className="inline-flex items-center text-xs text-rose-400 font-medium">
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />+{room.diffPercent}%
                          </span>
                        ) : room.diffPercent < 0 ? (
                          <span className="inline-flex items-center text-xs text-sky-400 font-medium">
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />{room.diffPercent}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs text-slate-500">
                            <Minus className="w-3.5 h-3.5 mr-0.5" />0%
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 시각화 차트 */}
            <div className="pt-4 border-t border-slate-800">
              <h3 className="text-xs text-slate-400 mb-3">객실별 가격 비교 차트</h3>
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pricingData}>
                    <XAxis dataKey="id" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                      formatter={(value: any) => [`₩${Number(value).toLocaleString()}`, '가격']}
                    />
                    <Bar dataKey="calculatedPrice" fill="#c5a059" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}