use client;

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, CalendarDays, LineChart, Cpu, Bell, ChevronDown, Loader2, PlaneTakeoff, Building2, ShieldAlert, Sliders, Sparkles, X, ExternalLink, Save, CheckCircle2, DollarSign, PieChart, RefreshCcw } from 'lucide-react';

export default function ParadisePricingDashboard() {
  // 1. 상태 관리
  const [activeMenu, setActiveMenu] = useState('대시보드');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('방금 전');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 캘린더 모달 상태 및 동적 날짜 배열
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-14');
  const [dateRangeLabel, setDateRangeLabel] = useState('2026.10.01 ~ 10.14 (성수기/황금연휴)');
  
  // 동적 날짜 배열 (초기값 설정)
  const [dates, setDates] = useState(['10.01', '10.02', '10.03', '10.04', '10.05', '10.06', '10.07', '10.08', '10.09', '10.10', '10.11', '10.12', '10.13', '10.14']);

  // 지표별 상세 모달 상태
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isOccModalOpen, setIsOccModalOpen] = useState(false);
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);

  // 2. 파라다이스시티 맞춤형 외부 환경 시나리오
  const scenarios = {
    normal: { 
      id: 'normal', name: '평시 (Standard Week)', baseOcc: 74, compPrice: 310000, 
      flightIndex: '안정적 (인천공항 일일 입국 10만석)', 
      flightDetail: { pax: '102,450명/일', flights: '610편착륙', chinaRate: '38%', charter: '0편' },
      competitors: [
        { name: '인스파이어 엔터테인먼트 리조트', avgPrice: '320,000원', occ: '72%', position: '영종도 인근 (경쟁)' },
        { name: '그랜드 하얏트 인천', avgPrice: '290,000원', occ: '68%', position: '공항 인접 (비즈니스)' },
        { name: '네스트 호텔', avgPrice: '220,000원', occ: '75%', position: '수요 분산 (디자인)' }
      ],
      revenueBreakdown: { room: '31,500,000원', casinoFnb: '15,200,000원', artTainment: '7,300,000원' },
      occBreakdown: { totalRooms: '711실', casinoComp: '90실 (홀딩)', miceBlock: '40실 (홀딩)', available: '581실', sold: '430실' },
      baseRevenue: 54000000 
    },
    vip: { 
      id: 'vip', name: '외국인 VIP 카지노 초청행사 (High Roller)', baseOcc: 96, compPrice: 420000, 
      flightIndex: '매우 높음 (중화권 비즈니스젯 및 전세기 집중)', 
      flightDetail: { pax: '145,200명/일 (+42%)', flights: '780편착륙', chinaRate: '65%', charter: '12편 (VIP 전용)' },
      competitors: [
        { name: '인스파이어 엔터테인먼트 리조트', avgPrice: '440,000원', occ: '94%', position: '영종도 인근 (경쟁)' },
        { name: '그랜드 하얏트 인천', avgPrice: '360,000원', occ: '85%', position: '공항 인접 (비즈니스)' },
        { name: '네스트 호텔', avgPrice: '280,000원', occ: '88%', position: '수요 분산 (디자인)' }
      ],
      revenueBreakdown: { room: '52,000,000원', casinoFnb: '28,500,000원', artTainment: '9,000,000원' },
      occBreakdown: { totalRooms: '711실', casinoComp: '140실 (홀딩)', miceBlock: '20실 (홀딩)', available: '551실', sold: '528실' },
      baseRevenue: 89500000 
    },
    mice: { 
      id: 'mice', name: '대규모 국제 회의 및 아트페어 (FRIEZE 연계)', baseOcc: 91, compPrice: 390000, 
      flightIndex: '높음 (글로벌 비즈니스 및 예술계 입국 집중)', 
      flightDetail: { pax: '131,000명/일 (+28%)', flights: '720편착륙', chinaRate: '45%', charter: '3편' },
      competitors: [
        { name: '인스파이어 엔터테인먼트 리조트', avgPrice: '390,000원', occ: '89%', position: '영종도 인근 (경쟁)' },
        { name: '그랜드 하얏트 인천', avgPrice: '340,000원', occ: '82%', position: '공항 인접 (비즈니스)' },
        { name: '네스트 호텔', avgPrice: '260,000원', occ: '84%', position: '수요 분산 (디자인)' }
      ],
      revenueBreakdown: { room: '44,200,000원', casinoFnb: '21,000,000원', artTainment: '10,800,000원' },
      occBreakdown: { totalRooms: '711실', casinoComp: '80실 (홀딩)', miceBlock: '90실 (홀딩)', available: '541실', sold: '492실' },
      baseRevenue: 76000000 
    }
  };
  const [currentScenario, setCurrentScenario] = useState('normal');

  // 3. 다이내믹 프라이싱 설정 및 민감도 상태
  const [minDrop, setMinDrop] = useState(-10);
  const [maxRise, setMaxRise] = useState(30);
  const [sensitivity, setSensitivity] = useState<'Low' | 'Mid' | 'High'>('High');

  // 4. 객실 타입별 기준가 관리 상태
  const [roomConfigs, setRoomConfigs] = useState([
    { type: '디럭스 (Deluxe)', basePrice: 320000, minPrice: 250000, maxPrice: 500000 },
    { type: '코너 스위트 (Suite)', basePrice: 650000, minPrice: 550000, maxPrice: 1100000 },
    { type: '그랜드 풀빌라 (Pool Villa)', basePrice: 2200000, minPrice: 1800000, maxPrice: 3500000 }
  ]);

  // 5. AI 룰 설정 상태
  const [aiRules, setAiRules] = useState({
    autoPriceSync: true, casinoBlockProtection: true, competitorUnderCutGuard: true, weekendSurgeBoost: true
  });

  const [metrics, setMetrics] = useState(scenarios['normal']);
  const [roomRates, setRoomRates] = useState<any[]>([]);

  // 특정 날짜가 주말(금, 토)인지 동적으로 판별하는 함수
  const checkWeekend = (dateStr: string) => {
    const year = startDate.split('-')[0] || new Date().getFullYear().toString();
    const [m, d] = dateStr.split('.');
    const dayOfWeek = new Date(`${year}-${m}-${d}`).getDay();
    return dayOfWeek === 5 || dayOfWeek === 6; // 5: 금요일, 6: 토요일
  };

  const getBgColor = (status: string) => {
    switch(status) {
      case 'dark-red': return 'bg-red-800 text-white font-bold';
      case 'high': return 'bg-amber-600 text-white font-bold';
      case 'lower': return 'bg-emerald-600 text-white font-bold';
      default: return 'bg-slate-50 text-slate-800 border border-slate-200';
    }
  };

  const applyAI = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const scenarioData = scenarios[currentScenario as keyof typeof scenarios];
      let sensitivityMultiplier = sensitivity === 'High' ? 1.25 : sensitivity === 'Low' ? 0.75 : 1.0;

      const adjustedRevenue = scenarioData.baseRevenue * (1 + (maxRise * 0.004 * sensitivityMultiplier) - (Math.abs(minDrop) * 0.0015));
      setMetrics({ ...scenarioData, baseRevenue: adjustedRevenue });

      const updatedRates = roomConfigs.map(room => {
        const newRates = dates.map(dateStr => {
          const isWeekend = checkWeekend(dateStr); 
          let demandFactor = (scenarioData.baseOcc / 100) + (isWeekend ? 0.18 : 0);
          
          let priceMultiplier = 1;
          if (demandFactor > 0.85) priceMultiplier = 1 + (maxRise / 100) * (demandFactor - 0.75) * sensitivityMultiplier;
          else if (demandFactor < 0.65) priceMultiplier = 1 + (minDrop / 100);

          let finalPrice = Math.round((room.basePrice * priceMultiplier) / 10000) * 10000;
          
          if (finalPrice > room.maxPrice) finalPrice = room.maxPrice;
          if (finalPrice < room.minPrice) finalPrice = room.minPrice;
          
          let status = 'standard';
          if (demandFactor > 1.05) status = 'dark-red';
          else if (demandFactor > 0.88) status = 'high';
          else if (demandFactor < 0.65) status = 'lower';

          return { date: dateStr, price: finalPrice.toLocaleString() + '원', status, rate: Math.min(99, Math.round(demandFactor * 100)) + '%' };
        });
        return { type: room.type, basePrice: room.basePrice, rates: newRates };
      });

      setRoomRates(updatedRates);
      const now = new Date();
      setLastUpdated(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
      setIsAnalyzing(false);
    }, 500);
  };

  // 시나리오, 설정, '날짜(dates)' 변경 시 AI 산출 자동 재실행
  useEffect(() => { 
    applyAI(); 
  }, [currentScenario, roomConfigs, sensitivity, dates]); // eslint-disable-line react-hooks/exhaustive-deps

  // 캘린더에서 기간 선택 시 날짜 배열 동적 생성 로직
  const handleDateApply = () => {
    const newDates = [];
    let current = new Date(startDate);
    const stop = new Date(endDate);
    
    while (current <= stop && newDates.length < 14) { // UI를 위해 최대 14일치만 표출
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      newDates.push(`${m}.${d}`);
      current.setDate(current.getDate() + 1);
    }
    
    if(newDates.length === 0) newDates.push('10.01'); // 안전 장치
    
    setDates(newDates);
    setDateRangeLabel(`${startDate} ~ ${endDate} (선택 기간)`);
    setIsCalendarOpen(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const menuItems = [
    { icon: <LayoutDashboard size={16} />, label: '대시보드' },
    { icon: <Sliders size={16} />, label: '요금 설정' },
    { icon: <CalendarDays size={16} />, label: '예약 현황' },
    { icon: <LineChart size={16} />, label: '시장 분석' },
    { icon: <Sparkles size={16} />, label: 'AI 최적화 룰' },
    { icon: <ShieldAlert size={16} />, label: '시스템 설정' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans text-xs select-none relative">
      
      {toastMessage && (
        <div className="absolute top-16 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400" />
          <span className="font-medium text-xs">{toastMessage}</span>
        </div>
      )}

      {/* 각종 팝업 모달들 (수익, 점유율, 캘린더, 공항, 경쟁사) */}
      {isRevenueModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><DollarSign size={18} className="text-amber-600"/> 전사 예상 영업이익 상세 내역</h3>
              <button onClick={() => setIsRevenueModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900 flex justify-between items-center">
                <div><div className="font-bold">현재 시나리오 총 예상 영업이익</div><div className="text-[10px] text-amber-700">다이내믹 프라이싱 알고리즘 가중치 적용 완료</div></div>
                <div className="text-lg font-black text-amber-600">{Math.round(metrics.baseRevenue).toLocaleString()}원</div>
              </div>
              <div className="font-bold text-slate-700 mt-2">부문별 매출 기여도 브레이크다운</div>
              <div className="space-y-2">
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center"><span className="font-semibold text-slate-700">객실 숙박 매출 (Room Revenue)</span><span className="font-bold text-slate-900">{metrics.revenueBreakdown.room}</span></div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center"><span className="font-semibold text-slate-700">카지노 및 식음(F&B) 연계 매출</span><span className="font-bold text-slate-900">{metrics.revenueBreakdown.casinoFnb}</span></div>
                <div className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center"><span className="font-semibold text-slate-700">아트테인먼트 (씨메르/원더박스 등)</span><span className="font-bold text-slate-900">{metrics.revenueBreakdown.artTainment}</span></div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsRevenueModalOpen(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      {isOccModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] p-6 flex flex-col gap-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><PieChart size={18} className="text-amber-600"/> 실질 점유율 산출 근거 (블록 분리)</h3>
              <button onClick={() => setIsOccModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 flex justify-between items-center">
                <div><div className="font-bold text-slate-900">산출된 실질 가동률 (Effective OCC)</div><div className="text-[10px] text-slate-400">일반 판매 가용 객실 기준</div></div>
                <div className="text-lg font-black text-slate-800">{metrics.baseOcc}%</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-slate-500 mb-1">총 객실 수</div><div className="text-sm font-bold text-slate-800">{metrics.occBreakdown.totalRooms}</div></div>
                <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-slate-500 mb-1">카지노 VIP 컴프 홀딩</div><div className="text-sm font-bold text-amber-600">{metrics.occBreakdown.casinoComp}</div></div>
                <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-slate-500 mb-1">MICE 대규모 홀딩</div><div className="text-sm font-bold text-blue-600">{metrics.occBreakdown.miceBlock}</div></div>
                <div className="bg-white border border-slate-200 rounded-lg p-3"><div className="text-slate-500 mb-1">일반 판매 배정</div><div className="text-sm font-bold text-slate-800">{metrics.occBreakdown.available} 중 {metrics.occBreakdown.sold} 판매</div></div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsOccModalOpen(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      {isCalendarOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-[380px] p-5 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><CalendarDays size={16} className="text-amber-600"/> 시뮬레이션 기간 설정</h3>
              <button onClick={() => setIsCalendarOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-[11px] font-medium text-slate-600 mb-1">시작일</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-slate-50 outline-none" /></div>
              <div><label className="block text-[11px] font-medium text-slate-600 mb-1">종료일</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-slate-50 outline-none" /></div>
            </div>
            <div className="text-[10px] text-slate-400">* 설정한 기간에 맞추어 히트맵 날짜가 자동 변경됩니다 (최대 14일 표출).</div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsCalendarOpen(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-bold">취소</button>
              <button onClick={handleDateApply} className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-bold">기간 적용</button>
            </div>
          </div>
        </div>
      )}

      {isFlightModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[480px] p-6 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><PlaneTakeoff size={18} className="text-amber-600"/> 인천공항 연계 트래픽 인사이트</h3>
              <button onClick={() => setIsFlightModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-900">
                <div className="font-bold mb-1">현재 적용 시나리오: [{metrics.name}]</div>
                <div>인천공항 데이터베이스와 연동되어 자동 반영 중입니다.</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><div className="text-slate-500 mb-1">일일 총 입국객 수</div><div className="text-base font-bold text-slate-800">{metrics.flightDetail.pax}</div></div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><div className="text-slate-500 mb-1">착륙 항공편</div><div className="text-base font-bold text-slate-800">{metrics.flightDetail.flights}</div></div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsFlightModalOpen(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      {isCompetitorModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[520px] p-6 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm"><Building2 size={18} className="text-amber-600"/> 경쟁사 실시간 요금 비교 분석</h3>
              <button onClick={() => setIsCompetitorModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-700 flex justify-between items-center">
                <div><div className="font-bold text-slate-900">파라다이스시티 추천 요금</div></div>
                <div className="text-base font-black text-amber-600">{metrics.compPrice.toLocaleString()}원 대</div>
              </div>
              <div className="font-bold text-slate-700 mt-2">인근 경쟁사 현황 스냅샷</div>
              <div className="space-y-2">
                {metrics.competitors.map((comp, idx) => (
                  <div key={idx} className="bg-white border border-slate-200 rounded-lg p-3 flex justify-between items-center shadow-2xs">
                    <div><div className="font-bold text-slate-800">{comp.name}</div><div className="text-[10px] text-slate-400">{comp.position}</div></div>
                    <div className="text-right"><div className="font-bold text-slate-900">{comp.avgPrice}</div><div className="text-[10px] text-emerald-600 font-medium">점유율 {comp.occ}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsCompetitorModalOpen(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 좌측 사이드바 */}
      <aside className="w-60 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800 flex flex-col items-center justify-center text-center gap-1.5 bg-slate-950/40">
          <div className="w-9 h-9 rounded-full border border-amber-400/60 flex items-center justify-center text-amber-400 font-serif font-bold text-lg tracking-tighter bg-amber-400/10 shadow-inner">P</div>
          <div><div className="text-white font-serif font-bold tracking-widest text-xs">PARADISE CITY</div><div className="text-[9px] text-amber-400 font-sans tracking-wider uppercase mt-0.5">Dynamic Pricing RM</div></div>
        </div>
        <div className="px-4 pt-4 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Main Menu</div>
        <nav className="flex-1 px-2 space-y-1">
          {menuItems.map((item) => (
            <button key={item.label} onClick={() => setActiveMenu(item.label)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all font-medium ${activeMenu === item.label ? 'bg-amber-500/10 text-amber-400 font-bold border-l-2 border-amber-500' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 m-3 bg-slate-800/50 rounded-lg border border-slate-700/50 text-[11px] text-slate-400"><div className="font-bold text-slate-300 mb-0.5">인천영종 IR 허브</div><div>엔터테인먼트·카지노 연동형</div></div>
      </aside>

      {/* 우측 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* 상단 헤더 */}
        <header className="h-13 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-2xs">
          <h1 className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <span className="text-base font-serif tracking-tight">PARADISE CITY - 다이내믹 프라이싱 대시보드</span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded font-semibold">{activeMenu}</span>
            {isAnalyzing && <span className="text-[10px] font-normal text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> 연산 중...</span>}
          </h1>
          <div className="flex items-center gap-4">
            <div onClick={() => setIsCalendarOpen(true)} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-md text-slate-700 border border-slate-200 cursor-pointer hover:bg-amber-50 transition-all shadow-2xs">
              <CalendarDays size={14} className="text-amber-600" />
              <span className="font-semibold">{dateRangeLabel}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>
            <div className="flex items-center gap-2 pl-4 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 font-bold text-[11px]">RM</div>
              <div className="text-[11px] text-right leading-tight"><div className="font-bold text-slate-700">수익관리팀 (RM)</div><div className="text-slate-400">영종도 본사</div></div>
            </div>
          </div>
        </header>

        {/* 본문 레이아웃 */}
        <div className="flex-1 p-4 flex gap-4 overflow-hidden bg-slate-100/70">
          
          {/* [메뉴 1] 대시보드 화면 */}
          {activeMenu === '대시보드' && (
            <>
              <div className="flex-1 flex flex-col gap-3 h-full overflow-hidden">
                <div className="grid grid-cols-4 gap-3 shrink-0">
                   <div onClick={() => setIsRevenueModalOpen(true)} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-400 hover:bg-amber-50/20 transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><DollarSign size={12} className="text-amber-600"/> 예상 전사 영업이익 (RevPAR)</span><ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" /></div>
                      <div className="text-lg font-black text-amber-600 tracking-tight mt-1">{Math.round(metrics.baseRevenue).toLocaleString()}원</div>
                   </div>
                   <div onClick={() => setIsOccModalOpen(true)} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-400 hover:bg-amber-50/20 transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><PieChart size={12} className="text-amber-600"/> 실질 점유율 (블록 제외)</span><ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" /></div>
                      <div className="text-lg font-bold text-slate-800 mt-1">{metrics.baseOcc}%</div>
                   </div>
                   <div onClick={() => setIsCompetitorModalOpen(true)} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-400 hover:bg-amber-50/20 transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><Building2 size={12} className="text-amber-600"/> 인근 복합리조트 평균 요금</span><ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" /></div>
                      <div className="text-lg font-bold text-slate-800 mt-1">{metrics.compPrice.toLocaleString()}원</div>
                   </div>
                   <div onClick={() => setIsFlightModalOpen(true)} className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-400 hover:bg-amber-50/20 transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><PlaneTakeoff size={12} className="text-amber-600"/> 인천공항 입국 및 항공 수요</span><ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" /></div>
                      <div className="text-xs font-bold text-slate-800 mt-1 truncate">{metrics.flightIndex}</div>
                   </div>
                </div>

                <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex flex-col overflow-hidden shadow-2xs">
                  <div className="flex justify-between items-end mb-3 shrink-0">
                    <div>
                      <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">객실 타입별 실시간 다이내믹 요금 히트맵</h2>
                    </div>
                  </div>

                  {/* 💡 추가된 부분: 히트맵 색상 단계 직관적 설명 패널 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 mb-3 text-[10px] text-slate-600 grid grid-cols-4 gap-2 shrink-0 shadow-inner">
                    <div className="flex flex-col gap-1 border-r border-slate-200 pr-2">
                      <span className="font-bold text-red-800 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-800 rounded-full"></div> 만실임박 (Dark Red)</span>
                      <span>수요 105% 이상 초과. **최고 할증가(Max Cap)**를 적용해 수익을 극대화합니다.</span>
                    </div>
                    <div className="flex flex-col gap-1 border-r border-slate-200 pr-2 pl-1">
                      <span className="font-bold text-amber-600 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-600 rounded-full"></div> 수요높음 (High)</span>
                      <span>수요 88% 이상 집중. 상향 탄력성이 적용되어 요금이 인상되는 구간입니다.</span>
                    </div>
                    <div className="flex flex-col gap-1 border-r border-slate-200 pr-2 pl-1">
                      <span className="font-bold text-slate-700 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-slate-200 border border-slate-300 rounded-full"></div> 표준 방어 (Standard)</span>
                      <span>수요 65~88% 안정 구간. 브랜드 가치를 위해 **기본 기준가**를 방어합니다.</span>
                    </div>
                    <div className="flex flex-col gap-1 pl-1">
                      <span className="font-bold text-emerald-600 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div> 할인필요 (Lower)</span>
                      <span>수요 65% 미만. 예약 유도를 위해 설정한 **최저 하한선**까지 요금을 내립니다.</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto border border-slate-200 rounded-md relative">
                    <table className="w-full text-center">
                      <thead>
                        <tr className="bg-slate-100 sticky top-0 z-10 text-slate-700 shadow-sm">
                          <th className="border-b border-r border-slate-200 p-2.5 font-bold w-36 text-left pl-4 bg-slate-100">객실 타입</th>
                          {dates.map((d, i) => (
                            <th key={i} className={`border-b border-r border-slate-200 p-2 font-bold bg-slate-100 ${checkWeekend(d) ? 'text-amber-600 bg-amber-50/50' : ''}`}>
                              {d}
                              {checkWeekend(d) && <div className="text-[9px] font-normal text-amber-600/70 leading-none mt-0.5">주말</div>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {roomRates.map((room, idx) => (
                          <tr key={idx}>
                            <td className="border-b border-r border-slate-200 p-2.5 font-bold text-slate-700 bg-slate-50 text-left pl-4 sticky left-0 z-10 shadow-sm">
                              {room.type}
                              <div className="text-[10px] font-normal text-slate-400 mt-0.5">기준: {(room.basePrice/10000).toFixed(0)}만원</div>
                            </td>
                            {room.rates.map((rate: any, i: number) => (
                              <td key={i} className={`border-b border-r border-slate-200 p-1.5 transition-colors ${getBgColor(rate?.status)}`}>
                                {rate ? (
                                  <>
                                    <div className="font-bold tracking-tight text-xs">{rate.price}</div>
                                    {rate.status !== 'standard' && <div className="text-[9px] opacity-90 mt-0.5">예상점유 {rate.rate}</div>}
                                  </>
                                ) : <div className="animate-pulse h-5 bg-black/10 rounded w-full"></div>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 우측 패널 */}
              <div className="w-80 shrink-0 flex flex-col gap-3 h-full overflow-hidden">
                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs shrink-0">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-xs">
                    <CalendarDays size={14} className="text-amber-600"/> 복합리조트 수요 이벤트 시나리오
                  </h3>
                  <select 
                    value={currentScenario} 
                    onChange={(e) => setCurrentScenario(e.target.value)}
                    className="w-full border border-slate-300 rounded p-2 text-xs text-slate-800 font-bold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {Object.values(scenarios).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs flex-1 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3.5 flex items-center gap-1.5 text-xs">
                      <Settings size={14} className="text-amber-600"/> 프라이싱 알고리즘 파라미터
                    </h3>
                    <div className="mb-4">
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span className="text-slate-600 font-medium">하한선 방어 (Minimum Drop)</span><span className="font-bold text-slate-800">{minDrop}%</span>
                      </div>
                      <input type="range" min="-30" max="0" value={minDrop} onChange={(e) => setMinDrop(Number(e.target.value))} className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded cursor-pointer" />
                    </div>
                    <div className="mb-4">
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span className="text-slate-600 font-medium">상한선 프리미엄 (Max Cap)</span><span className="font-bold text-amber-600">+{maxRise}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={maxRise} onChange={(e) => setMaxRise(Number(e.target.value))} className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded cursor-pointer" />
                    </div>
                    <div className="mb-2">
                      <div className="text-[11px] text-slate-600 font-medium mb-1.5">AI 수요 반응 민감도 (Sensitivity)</div>
                      <div className="flex gap-1.5">
                        {(['Low', 'Mid', 'High'] as const).map(level => (
                          <button key={level} onClick={() => setSensitivity(level)} className={`flex-1 py-1.5 text-[11px] font-bold rounded border transition-all ${sensitivity === level ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button onClick={() => { setMinDrop(-10); setMaxRise(30); setSensitivity('High'); setCurrentScenario('normal'); }} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded text-xs font-bold hover:bg-slate-50">초기화</button>
                    <button onClick={applyAI} className="flex-[2] flex items-center justify-center gap-1.5 bg-slate-900 text-white py-2 rounded text-xs font-bold hover:bg-slate-800 shadow-xs">
                      <Sparkles size={14} className="text-amber-400" /> AI 최적화 적용
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* [메뉴 2] 요금 설정 모듈 */}
          {activeMenu === '요금 설정' && (
            <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 flex flex-col gap-5 overflow-auto shadow-2xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Sliders size={20} className="text-amber-600" /> 객실 타입별 기준 요금 및 가격 가드레일 설정</h2><p className="text-xs text-slate-400 mt-0.5">다이내믹 프라이싱 엔진이 준수해야 할 객실별 기준가 및 상하한 방어선</p></div>
                <button onClick={() => { applyAI(); showToast('요금 설정 값이 대시보드 히트맵에 실시간 반영되었습니다!'); }} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 shadow-xs text-xs"><Save size={14} /> 요금 정책 저장 및 반영</button>
              </div>
              <div className="grid grid-cols-3 gap-6">
                {roomConfigs.map((room, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
                    <div className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">{room.type}</div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">기본 객실가 (Base Rate)</label><input type="number" step="10000" value={room.basePrice} onChange={(e) => { const updated = [...roomConfigs]; updated[idx].basePrice = Number(e.target.value); setRoomConfigs(updated); }} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold bg-white outline-none" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">최저 방어 요금 (Floor Price)</label><input type="number" step="10000" value={room.minPrice} onChange={(e) => { const updated = [...roomConfigs]; updated[idx].minPrice = Number(e.target.value); setRoomConfigs(updated); }} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold bg-white outline-none" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">최고 상한 요금 (Max Ceiling)</label><input type="number" step="10000" value={room.maxPrice} onChange={(e) => { const updated = [...roomConfigs]; updated[idx].maxPrice = Number(e.target.value); setRoomConfigs(updated); }} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold bg-white outline-none" /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* [메뉴 3] 예약 현황 모듈 */}
          {activeMenu === '예약 현황' && (
            <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 flex flex-col gap-4 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><CalendarDays size={20} className="text-amber-600" /> 실시간 객실 예약 현황 및 블록 관리</h2><p className="text-xs text-slate-400 mt-0.5">카지노 VIP 콤프 객실 및 MICE 단체 블록 할당 물량을 제외한 일반 잔여 객실 실시간 현황</p></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><div className="text-xs text-amber-800 font-medium mb-1">일반 총 가용 객실</div><div className="text-2xl font-black text-amber-900">410실</div></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500 font-medium mb-1">확정 예약 객실 (OTA/Direct)</div><div className="text-2xl font-black text-slate-800">304실 (74%)</div></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500 font-medium mb-1">카지노/VIP 홀딩 블록</div><div className="text-2xl font-black text-slate-800">90실 (별도 관리)</div></div>
              </div>
            </div>
          )}

          {/* [메뉴 4] 시장 분석 모듈 */}
          {activeMenu === '시장 분석' && (
            <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 flex flex-col gap-4 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><LineChart size={20} className="text-amber-600" /> 영종도 권역 복합리조트 및 공항 수요 시장 분석</h2><p className="text-xs text-slate-400 mt-0.5">인천공항 입국자 트래픽과 인근 경쟁사의 가격 변동 추이 분석 리포트</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between"><div><div className="font-bold text-slate-800 text-sm mb-2">영종도 권역 수요 탄력성 지수</div><p className="text-xs text-slate-500 leading-relaxed">현재 공항 입국객 증가 추세에 따라 주말 객실 수요가 공급을 초과하고 있습니다. 경쟁사 대비 평균 5% 높은 단가 유지 시에도 점유율 90% 이상 방어가 가능할 것으로 분석됩니다.</p></div></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between"><div><div className="font-bold text-slate-800 text-sm mb-2">중화권 비즈니스젯 입국 상관관계</div><p className="text-xs text-slate-500 leading-relaxed">VIP 초청 행사 기간 중 인근 전세기 입항 편수와 풀빌라/스위트룸 예약률 간의 상관계수가 0.89로 매우 높게 나타납니다.</p></div></div>
              </div>
            </div>
          )}

          {/* [메뉴 5] AI 최적화 룰 모듈 */}
          {activeMenu === 'AI 최적화 룰' && (
            <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 flex flex-col gap-4 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Sparkles size={20} className="text-amber-600" /> AI 프라이싱 자동화 및 최적화 룰 설정</h2><p className="text-xs text-slate-400 mt-0.5">다이내믹 프라이싱 엔진이 자율 구동할 때 따르는 핵심 알고리즘 룰을 토글로 제어합니다.</p></div>
              <div className="space-y-3">
                {[
                  { key: 'autoPriceSync', title: '경쟁사 가격 실시간 자동 동기화 봇', desc: '인근 리조트 최저가 변동 시 10분 주기로 자사 요금 자동 보정' },
                  { key: 'casinoBlockProtection', title: '카지노 VIP 블록 침해 방지 가드레일', desc: 'VIP 초청 시즌 일반 객실 요금을 자동 상향하여 객실 가치 사수' },
                  { key: 'competitorUnderCutGuard', title: '출혈 경쟁 방지 하한선 자동 방어선', desc: '경쟁사가 무리한 할인을 진행하더라도 설정된 Floor Price 이하로 미끄러짐 방지' },
                  { key: 'weekendSurgeBoost', title: '금/토 주말 성수기 요금 서지(Surge) 부스팅', desc: '수요 집중 구간에 AI가 자동으로 가중치를 곱해 객실 단가 극대화' }
                ].map((rule) => {
                  const isOn = aiRules[rule.key as keyof typeof aiRules];
                  return (
                    <div key={rule.key} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div><div className="font-bold text-slate-800 text-xs">{rule.title}</div><div className="text-[11px] text-slate-400 mt-0.5">{rule.desc}</div></div>
                      <button onClick={() => { setAiRules({ ...aiRules, [rule.key]: !isOn }); showToast(`[${rule.title}] 룰이 ${!isOn ? '활성화' : '비활성화'} 되었습니다.`); }} className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all ${isOn ? 'bg-amber-600 text-white border-amber-600 shadow-xs' : 'bg-white text-slate-500 border-slate-300'}`}>{isOn ? '활성화 (ON)' : '비활성화 (OFF)'}</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* [메뉴 6] 시스템 설정 모듈 */}
          {activeMenu === '시스템 설정' && (
            <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 flex flex-col gap-4 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><ShieldAlert size={20} className="text-amber-600" /> 시스템 연동 및 PMS/오페라(Opera) 인터페이스 설정</h2><p className="text-xs text-slate-400 mt-0.5">파라다이스시티 호텔 PMS 시스템 및 오라클 오페라 클라우드와의 API 연동 상태 관리</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5"><div className="font-bold text-slate-800 text-sm mb-3">PMS / 오페라 클라우드 연동 상태</div><div className="space-y-2 text-xs"><div className="flex justify-between items-center bg-white p-3 rounded border border-slate-200"><span>Oracle Opera Cloud PMS API</span><span className="text-emerald-600 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 정상 연동중</span></div></div></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between"><div><div className="font-bold text-slate-800 text-sm mb-2">캐시 데이터 초기화 및 강제 동기화</div><p className="text-xs text-slate-500 leading-relaxed mb-4">시뮬레이션 캐시를 비우고 최신 PMS 예약 원장 데이터를 강제로 불러옵니다.</p></div><button onClick={() => showToast('시스템 캐시가 성공적으로 초기화되었습니다.')} className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-bold hover:bg-slate-800 text-xs shadow-xs flex items-center justify-center gap-2"><RefreshCcw size={14} /> 캐시 새로고침 및 강제 동기화</button></div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}