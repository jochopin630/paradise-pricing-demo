"use client";

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Settings, CalendarDays, LineChart, Cpu, Bell, ChevronDown, 
  Loader2, PlaneTakeoff, Building2, ShieldAlert, Sliders, Sparkles, X, 
  ExternalLink, Save, CheckCircle2, DollarSign, PieChart, RefreshCcw, Send, Check
} from 'lucide-react';

export default function ParadiseDuettoDashboard() {
  const [activeMenu, setActiveMenu] = useState('대시보드');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('방금 전');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 캘린더 모달 상태 및 동적 날짜 배열
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-14');
  const [dateRangeLabel, setDateRangeLabel] = useState('2026.10.01 ~ 10.14 (성수기/황금연휴)');
  const [dates, setDates] = useState(['10.01', '10.02', '10.03', '10.04', '10.05', '10.06', '10.07', '10.08', '10.09', '10.10', '10.11', '10.12', '10.13', '10.14']);

  // 모달 상태
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isOccModalOpen, setIsOccModalOpen] = useState(false);
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);

  // 시나리오 정의
  const scenarios = {
    normal: { 
      id: 'normal', name: '평시 (Standard Week)', baseOcc: 74, compPrice: 310000, 
      flightIndex: '안정적 (인천공항 일일 입국 10만석)', 
      flightDetail: { pax: '102450', flights: '610' },
      competitors: [
        { name: '인스파이어 엔터테인먼트', avgPrice: '320,000원', occ: '72%', position: '영종도 인근 (경쟁)' },
        { name: '그랜드 하얏트 인천', avgPrice: '290,000원', occ: '68%', position: '공항 인접 (비즈니스)' },
        { name: '네스트 호텔', avgPrice: '220,000원', occ: '75%', position: '수요 분산 (디자인)' }
      ],
      revenueBreakdown: { room: '31,500,000원', casinoFnb: '15,200,000원', artTainment: '7,300,000원' },
      occBreakdown: { totalRooms: '711실', casinoComp: '90실 (홀딩)', miceBlock: '40실 (홀딩)', available: '581실', sold: '430실' },
      baseRevenue: 54000000 
    },
    vip: { 
      id: 'vip', name: '외국인 VIP 카지노 초청행사 (High Roller)', baseOcc: 96, compPrice: 420000, 
      flightIndex: '매우 높음 (중화권 비즈니스젯/전세기 집중)', 
      flightDetail: { pax: '145200', flights: '780' },
      competitors: [
        { name: '인스파이어 엔터테인먼트', avgPrice: '440,000원', occ: '94%', position: '영종도 인근 (경쟁)' },
        { name: '그랜드 하얏트 인천', avgPrice: '360,000원', occ: '85%', position: '공항 인접 (비즈니스)' },
        { name: '네스트 호텔', avgPrice: '280,000원', occ: '88%', position: '수요 분산 (디자인)' }
      ],
      revenueBreakdown: { room: '52,000,000원', casinoFnb: '28,500,000원', artTainment: '9,000,000원' },
      occBreakdown: { totalRooms: '711실', casinoComp: '140실 (홀딩)', miceBlock: '20실 (홀딩)', available: '551실', sold: '528실' },
      baseRevenue: 89500000 
    },
    mice: { 
      id: 'mice', name: '대규모 국제 회의 및 아트페어 (FRIEZE)', baseOcc: 91, compPrice: 390000, 
      flightIndex: '높음 (글로벌 비즈니스 및 예술계 입국)', 
      flightDetail: { pax: '131000', flights: '720' },
      competitors: [
        { name: '인스파이어 엔터테인먼트', avgPrice: '390,000원', occ: '89%', position: '영종도 인근 (경쟁)' },
        { name: '그랜드 하얏트 인천', avgPrice: '340,000원', occ: '82%', position: '공항 인접 (비즈니스)' },
        { name: '네스트 호텔', avgPrice: '260,000원', occ: '84%', position: '수요 분산 (디자인)' }
      ],
      revenueBreakdown: { room: '44,200,000원', casinoFnb: '21,000,000원', artTainment: '10,800,000원' },
      occBreakdown: { totalRooms: '711실', casinoComp: '80실 (홀딩)', miceBlock: '90실 (홀딩)', available: '541실', sold: '492실' },
      baseRevenue: 76000000 
    }
  };

  const [currentScenario, setCurrentScenario] = useState('normal');
  const [minDrop, setMinDrop] = useState(-10);
  const [maxRise, setMaxRise] = useState(30);
  const [sensitivity, setSensitivity] = useState<'Low' | 'Mid' | 'High'>('High');

  const [roomConfigs, setRoomConfigs] = useState([
    { type: '디럭스 (Deluxe)', basePrice: 320000, minPrice: 250000, maxPrice: 500000 },
    { type: '코너 스위트 (Suite)', basePrice: 650000, minPrice: 550000, maxPrice: 1100000 },
    { type: '그랜드 풀빌라 (Pool Villa)', basePrice: 2200000, minPrice: 1800000, maxPrice: 3500000 }
  ]);

  const [aiRules, setAiRules] = useState({
    autoPriceSync: true, casinoBlockProtection: true, competitorUnderCutGuard: true, weekendSurgeBoost: true
  });

  const [metrics, setMetrics] = useState(scenarios['normal']);
  const [roomRates, setRoomRates] = useState<any[]>([]);
  const [dailySummary, setDailySummary] = useState<any[]>([]);

  const checkWeekend = (dateStr: string) => {
    const year = startDate.split('-')[0] || new Date().getFullYear().toString();
    const [m, d] = dateStr.split('.');
    const dayOfWeek = new Date(`${year}-${m}-${d}`).getDay();
    return dayOfWeek === 5 || dayOfWeek === 6; 
  };

  // Duetto 스타일 셀 배경 색상 맵핑
  const getDuettoBadgeStyle = (status: string) => {
    switch(status) {
      case 'dark-red': return 'bg-red-500/15 text-red-700 border-red-300 font-bold';
      case 'high': return 'bg-amber-500/15 text-amber-800 border-amber-300 font-bold';
      case 'lower': return 'bg-emerald-500/15 text-emerald-800 border-emerald-300 font-bold';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const applyAI = () => {
    setIsAnalyzing(true);
    const scenarioData = scenarios[currentScenario as keyof typeof scenarios];

    setTimeout(() => {
      let sensitivityMultiplier = sensitivity === 'High' ? 1.25 : sensitivity === 'Low' ? 0.75 : 1.0;
      const adjustedRevenue = scenarioData.baseRevenue * (1 + (maxRise * 0.004 * sensitivityMultiplier) - (Math.abs(minDrop) * 0.0015));
      setMetrics({ ...scenarioData, baseRevenue: adjustedRevenue });

      // 1. Duetto 일별 요약 헤더 데이터 생성 (Daily Summary Stack)
      const summary = dates.map(dateStr => {
        const isWeekend = checkWeekend(dateStr);
        const basePax = parseInt(scenarioData.flightDetail.pax);
        const randomNoise = 1 + (Math.random() * 0.04 - 0.02);
        const weekendMult = isWeekend ? 1.18 : 0.95;
        
        const calcPax = Math.round(basePax * weekendMult * randomNoise);
        const calcOcc = Math.min(99, Math.round(scenarioData.baseOcc * (isWeekend ? 1.2 : 0.95)));

        return { date: dateStr, pax: calcPax, occ: calcOcc, isWeekend };
      });
      setDailySummary(summary);

      // 2. 객실별 Open Pricing 요금 생성
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

          return { 
            date: dateStr, 
            price: finalPrice.toLocaleString() + '원', 
            basePrice: (room.basePrice / 10000).toFixed(0) + '만',
            status, 
            rate: Math.min(99, Math.round(demandFactor * 100)) + '%' 
          };
        });
        return { type: room.type, basePrice: room.basePrice, rates: newRates };
      });

      setRoomRates(updatedRates);
      const now = new Date();
      setLastUpdated(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
      setIsAnalyzing(false);
    }, 400);
  };

  useEffect(() => { 
    applyAI(); 
  }, [currentScenario, roomConfigs, sensitivity, dates]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDateApply = () => {
    const newDates = [];
    let current = new Date(startDate);
    const stop = new Date(endDate);
    
    while (current <= stop && newDates.length < 14) { 
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      newDates.push(`${m}.${d}`);
      current.setDate(current.getDate() + 1);
    }
    
    if(newDates.length === 0) newDates.push('10.01'); 
    setDates(newDates);
    setDateRangeLabel(`${startDate} ~ ${endDate} (선택 기간)`);
    setIsCalendarOpen(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const menuItems = [
    { icon: <LayoutDashboard size={15} />, label: '대시보드' },
    { icon: <Sliders size={15} />, label: '요금 설정' },
    { icon: <CalendarDays size={15} />, label: '예약 현황' },
    { icon: <LineChart size={15} />, label: '시장 분석' },
    { icon: <Sparkles size={15} />, label: 'AI 최적화 룰' },
    { icon: <ShieldAlert size={15} />, label: '시스템 설정' },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-900 font-sans text-xs select-none relative text-slate-100">
      
      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="absolute top-14 right-6 bg-amber-500 text-slate-950 px-4 py-2 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-in fade-in slide-in-from-top-2 font-bold">
          <CheckCircle2 size={16} />
          <span className="text-xs">{toastMessage}</span>
        </div>
      )}

      {/* 캘린더 모달 */}
      {isCalendarOpen && (
        <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-[380px] p-5 flex flex-col gap-4 animate-in zoom-in-95 text-slate-200">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-bold flex items-center gap-2 text-sm text-amber-400"><CalendarDays size={16}/> 시뮬레이션 기간 설정</h3>
              <button onClick={() => setIsCalendarOpen(false)} className="text-slate-400 hover:text-white"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-[11px] font-medium text-slate-400 mb-1">시작일</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-slate-700 rounded-lg p-2 text-xs font-semibold bg-slate-800 text-white outline-none focus:border-amber-500" /></div>
              <div><label className="block text-[11px] font-medium text-slate-400 mb-1">종료일</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-slate-700 rounded-lg p-2 text-xs font-semibold bg-slate-800 text-white outline-none focus:border-amber-500" /></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-800">
              <button onClick={() => setIsCalendarOpen(false)} className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-lg font-bold hover:bg-slate-700">취소</button>
              <button onClick={handleDateApply} className="flex-1 bg-amber-500 text-slate-950 py-2 rounded-lg font-bold hover:bg-amber-400">기간 적용</button>
            </div>
          </div>
        </div>
      )}

      {/* 좌측 사이드바 (Duetto 스타일 다크 세로 바) */}
      <aside className="w-56 bg-slate-950 border-r border-slate-800/80 flex flex-col shrink-0">
        <div className="p-4 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg border border-amber-400/80 flex items-center justify-center text-amber-400 font-serif font-black text-base bg-amber-400/10 shadow-inner">P</div>
          <div>
            <div className="text-white font-serif font-bold tracking-wider text-xs">PARADISE CITY</div>
            <div className="text-[9px] text-amber-400 font-mono tracking-tight uppercase">Duetto Open Pricing</div>
          </div>
        </div>
        <div className="px-4 pt-4 pb-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest font-mono">GameChange Engine</div>
        <nav className="flex-1 px-2 space-y-1">
          {menuItems.map((item) => (
            <button key={item.label} onClick={() => setActiveMenu(item.label)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all text-xs ${activeMenu === item.label ? 'bg-amber-500/15 text-amber-400 font-bold border-l-2 border-amber-400' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>
        <div className="p-3 m-2 bg-slate-900/90 rounded border border-slate-800 text-[10px] text-slate-400">
          <div className="font-bold text-slate-300 mb-0.5 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Opera Cloud Connected</div>
          <div>인천 영종 IR 메인서버 연동 중</div>
        </div>
      </aside>

      {/* 우측 메인 대시보드 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900/95">
        
        {/* 상단 툴바 (Duetto Style Header Bar) */}
        <header className="h-12 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-5 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-200 tracking-tight flex items-center gap-2">
              <span className="text-amber-400 font-mono font-bold">[Duetto GameChange]</span> 오픈 프라이싱 워크스페이스
            </span>
            <span className="text-slate-700">|</span>
            <div onClick={() => setIsCalendarOpen(true)} className="flex items-center gap-2 bg-slate-900 px-2.5 py-1 rounded text-slate-300 border border-slate-700/80 cursor-pointer hover:border-amber-500/50 transition-all text-xs font-mono">
              <CalendarDays size={13} className="text-amber-400" />
              <span>{dateRangeLabel}</span>
              <ChevronDown size={13} className="text-slate-500" />
            </div>
          </div>

          {/* Duetto 상단 핵심 액션 버튼군 */}
          <div className="flex items-center gap-2">
            <button onClick={applyAI} className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded font-bold text-xs border border-slate-700 transition-all">
              <RefreshCcw size={12} className={isAnalyzing ? "animate-spin text-amber-400" : "text-slate-400"} /> AI 재연산
            </button>
            <button onClick={() => showToast("PMS(오페라)로 최적화 요금이 성공적으로 발행(Publish)되었습니다.")} className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded font-black text-xs transition-all shadow-md">
              <Send size={12} /> 요금 PMS 발행 (Publish)
            </button>
          </div>
        </header>

        {/* 메인 레이아웃 */}
        <div className="flex-1 p-4 flex gap-4 overflow-hidden">
          
          {activeMenu === '대시보드' && (
            <>
              {/* 중앙 그리드 영역 */}
              <div className="flex-1 flex flex-col gap-3 h-full overflow-hidden">
                
                {/* 상단 4가지 주요 지표 카드 (Duetto Sleek Style) */}
                <div className="grid grid-cols-4 gap-3 shrink-0">
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-amber-500/40 transition-all">
                    <div className="text-[10px] text-slate-400 font-mono flex justify-between"><span>EST. REVPAR / REVENUE</span><DollarSign size={13} className="text-amber-400" /></div>
                    <div className="text-base font-black text-amber-400 font-mono mt-1">{Math.round(metrics.baseRevenue).toLocaleString()}원</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-amber-500/40 transition-all">
                    <div className="text-[10px] text-slate-400 font-mono flex justify-between"><span>TARGET OCCUPANCY</span><PieChart size={13} className="text-amber-400" /></div>
                    <div className="text-base font-bold text-slate-100 font-mono mt-1">{metrics.baseOcc}% <span className="text-[10px] text-slate-500 font-normal">(Comp Except)</span></div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-amber-500/40 transition-all">
                    <div className="text-[10px] text-slate-400 font-mono flex justify-between"><span>COMPETITOR ADR</span><Building2 size={13} className="text-amber-400" /></div>
                    <div className="text-base font-bold text-slate-100 font-mono mt-1">{metrics.compPrice.toLocaleString()}원</div>
                  </div>
                  <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 hover:border-amber-500/40 transition-all">
                    <div className="text-[10px] text-slate-400 font-mono flex justify-between"><span>AIRPORT PAX DEMAND</span><PlaneTakeoff size={13} className="text-amber-400" /></div>
                    <div className="text-xs font-bold text-slate-200 mt-1 truncate">{metrics.flightIndex}</div>
                  </div>
                </div>

                {/* Duetto Open Pricing 히트맵 테이블 */}
                <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-3.5 flex flex-col overflow-hidden shadow-xl">
                  
                  {/* 컬러 레전드 바 */}
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-800 text-[10px] shrink-0">
                    <div className="font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span>Open Pricing Grid Matrix</span>
                      {isAnalyzing && <span className="text-amber-400 text-[9px] animate-pulse">Computing Matrix...</span>}
                    </div>
                    <div className="flex items-center gap-3 font-mono">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Sold Out (+105%)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Surge High (+88%)</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-slate-400"></span> Standard</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Discount Offer</span>
                    </div>
                  </div>

                  {/* Open Pricing 데이터 그리드 */}
                  <div className="flex-1 overflow-auto border border-slate-800/80 rounded bg-slate-900/50">
                    <table className="w-full text-center border-collapse">
                      <thead>
                        {/* 1층: Duetto Daily Summary Stack (일별 수요 및 OCC 미니 게이지) */}
                        <tr className="bg-slate-950 text-slate-400 font-mono border-b border-slate-800">
                          <th className="p-2 border-r border-slate-800 text-left pl-3 text-[10px] bg-slate-950 sticky left-0 z-20 w-36">
                            DAILY METRICS
                          </th>
                          {dailySummary.map((sum, i) => (
                            <th key={i} className="p-1.5 border-r border-slate-800/60 min-w-[70px]">
                              <div className="text-[9px] text-slate-500">PAX {Math.round(sum.pax/1000)}k</div>
                              <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
                                <div className={`h-full ${sum.isWeekend ? 'bg-amber-400' : 'bg-slate-500'}`} style={{ width: `${sum.occ}%` }}></div>
                              </div>
                              <div className="text-[9px] font-bold text-slate-300 mt-0.5">{sum.occ}% OCC</div>
                            </th>
                          ))}
                        </tr>

                        {/* 2층: 날짜 헤더 */}
                        <tr className="bg-slate-900 text-slate-300 font-mono border-b border-slate-800">
                          <th className="p-2.5 border-r border-slate-800 text-left pl-3 text-xs bg-slate-900 sticky left-0 z-20">
                            ROOM TYPES
                          </th>
                          {dates.map((d, i) => (
                            <th key={i} className={`p-2 border-r border-slate-800/60 font-bold text-xs ${checkWeekend(d) ? 'text-amber-400 bg-amber-500/5' : ''}`}>
                              {d}
                              {checkWeekend(d) && <div className="text-[8px] font-normal text-amber-400/80 uppercase">Wknd</div>}
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {roomRates.map((room, idx) => (
                          <tr key={idx} className="border-b border-slate-800/60 hover:bg-slate-800/30 transition-colors">
                            {/* 객실명 열 */}
                            <td className="p-2.5 border-r border-slate-800 font-bold text-slate-200 text-left pl-3 sticky left-0 z-10 bg-slate-950 text-xs shadow-md">
                              {room.type}
                              <div className="text-[9px] font-mono text-slate-500 font-normal mt-0.5">Base: {(room.basePrice/10000).toFixed(0)}만원</div>
                            </td>

                            {/* Duetto 오픈 프라이싱 셀 (추천가 + 상태 뱃지) */}
                            {room.rates.map((rate: any, i: number) => (
                              <td key={i} className="p-1 border-r border-slate-800/40 align-middle">
                                {rate ? (
                                  <div className={`p-1.5 rounded border flex flex-col justify-center items-center transition-all ${getDuettoBadgeStyle(rate.status)}`}>
                                    <span className="font-mono font-bold text-xs text-slate-900 tracking-tight">{rate.price}</span>
                                    <span className="text-[8px] opacity-75 font-mono mt-0.5">REC / {rate.rate}</span>
                                  </div>
                                ) : (
                                  <div className="animate-pulse h-8 bg-slate-800 rounded"></div>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 우측 컨트롤 패널 (Duetto Sidebar Controls) */}
              <div className="w-72 shrink-0 flex flex-col gap-3 h-full overflow-hidden">
                
                {/* 시나리오 셀렉터 */}
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-3.5 shrink-0">
                  <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                    <CalendarDays size={12} className="text-amber-400" /> Event Demand Scenario
                  </div>
                  <select 
                    value={currentScenario} 
                    onChange={(e) => setCurrentScenario(e.target.value)}
                    className="w-full border border-slate-700 rounded p-2 text-xs font-bold bg-slate-900 text-slate-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    {Object.values(scenarios).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
                </div>

                {/* 알고리즘 파라미터 조절 슬라이더 */}
                <div className="bg-slate-950 rounded-lg border border-slate-800 p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-mono font-bold text-slate-400 uppercase mb-3 flex items-center gap-1.5">
                      <Sliders size={12} className="text-amber-400" /> Yield Rules & Elasticity
                    </div>
                    
                    <div className="mb-4">
                      <div className="flex justify-between mb-1 text-[11px] font-mono">
                        <span className="text-slate-400">Floor Guard (Min)</span>
                        <span className="font-bold text-slate-200">{minDrop}%</span>
                      </div>
                      <input type="range" min="-30" max="0" value={minDrop} onChange={(e) => setMinDrop(Number(e.target.value))} className="w-full accent-amber-500 h-1 bg-slate-800 rounded cursor-pointer" />
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between mb-1 text-[11px] font-mono">
                        <span className="text-slate-400">Ceiling Cap (Max)</span>
                        <span className="font-bold text-amber-400">+{maxRise}%</span>
                      </div>
                      <input type="range" min="0" max="100" value={maxRise} onChange={(e) => setMaxRise(Number(e.target.value))} className="w-full accent-amber-500 h-1 bg-slate-800 rounded cursor-pointer" />
                    </div>

                    <div className="mb-3">
                      <div className="text-[11px] text-slate-400 font-mono mb-1.5">AI Sensitivity</div>
                      <div className="flex gap-1">
                        {(['Low', 'Mid', 'High'] as const).map(level => (
                          <button key={level} onClick={() => setSensitivity(level)} className={`flex-1 py-1 text-[10px] font-mono font-bold rounded border transition-all ${sensitivity === level ? 'bg-amber-500 text-slate-950 border-amber-500' : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'}`}>
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex gap-2">
                    <button onClick={() => { setMinDrop(-10); setMaxRise(30); setSensitivity('High'); setCurrentScenario('normal'); }} className="flex-1 bg-slate-900 border border-slate-700 text-slate-300 py-2 rounded text-xs font-bold hover:bg-slate-800">초기화</button>
                    <button onClick={applyAI} className="flex-[2] bg-amber-500 text-slate-950 py-2 rounded text-xs font-bold hover:bg-amber-400 flex items-center justify-center gap-1">
                      <Sparkles size={13} /> 최적화 실행
                    </button>
                  </div>
                </div>

              </div>
            </>
          )}

          {/* 나머지 서브 메뉴 화면 처리 */}
          {activeMenu !== '대시보드' && (
            <div className="flex-1 bg-slate-950 rounded-lg border border-slate-800 p-6 flex items-center justify-center text-slate-400 font-mono">
              [{activeMenu}] 모듈 구동 가능 상태입니다.
            </div>
          )}

        </div>
      </main>
    </div>
  );
}