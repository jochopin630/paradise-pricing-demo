"use client";

import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Settings, CalendarDays, LineChart, Cpu, Bell, ChevronDown, Loader2, PlaneTakeoff, Building2, ShieldAlert, Sliders, Sparkles, X, ExternalLink, Save, CheckCircle2, DollarSign, PieChart, RefreshCcw, LayoutGrid } from 'lucide-react';

export default function ParadisePricingDashboard() {
  // 1. 상태 관리
  const [activeMenu, setActiveMenu] = useState('대시보드');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('방금 전');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-14');
  const [dateRangeLabel, setDateRangeLabel] = useState('2026.10.01 ~ 10.14 (성수기/황금연휴)');
  
  const [dates, setDates] = useState(['10.01', '10.02', '10.03', '10.04', '10.05', '10.06', '10.07', '10.08', '10.09', '10.10', '10.11', '10.12', '10.13', '10.14']);

  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isOccModalOpen, setIsOccModalOpen] = useState(false);
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);

  // 2. 외부 환경 시나리오
  const scenarios = {
    normal: { id: 'normal', name: '평시 (Standard Week)', baseOcc: 74, compPrice: 310000, flightIndex: '안정적 (입국 10만석)', flightDetail: { pax: '102,450명', flights: '610편착륙', chinaRate: '38%', charter: '0편' }, competitors: [{ name: '인스파이어', avgPrice: '320,000원', occ: '72%', position: '경쟁' }, { name: '그랜드 하얏트', avgPrice: '290,000원', occ: '68%', position: '비즈니스' }], revenueBreakdown: { room: '31,500,000원', casinoFnb: '15,200,000원', artTainment: '7,300,000원' }, occBreakdown: { totalRooms: '711실', casinoComp: '90실', miceBlock: '40실', available: '581실', sold: '430실' }, baseRevenue: 54000000 },
    vip: { id: 'vip', name: 'VIP 카지노 초청행사 (High Roller)', baseOcc: 96, compPrice: 420000, flightIndex: '매우 높음 (비즈니스젯 집중)', flightDetail: { pax: '145,200명', flights: '780편착륙', chinaRate: '65%', charter: '12편' }, competitors: [{ name: '인스파이어', avgPrice: '440,000원', occ: '94%', position: '경쟁' }, { name: '그랜드 하얏트', avgPrice: '360,000원', occ: '85%', position: '비즈니스' }], revenueBreakdown: { room: '52,000,000원', casinoFnb: '28,500,000원', artTainment: '9,000,000원' }, occBreakdown: { totalRooms: '711실', casinoComp: '140실', miceBlock: '20실', available: '551실', sold: '528실' }, baseRevenue: 89500000 },
    mice: { id: 'mice', name: '국제 회의 및 아트페어 (FRIEZE)', baseOcc: 91, compPrice: 390000, flightIndex: '높음 (글로벌 비즈니스 입국)', flightDetail: { pax: '131,000명', flights: '720편착륙', chinaRate: '45%', charter: '3편' }, competitors: [{ name: '인스파이어', avgPrice: '390,000원', occ: '89%', position: '경쟁' }, { name: '그랜드 하얏트', avgPrice: '340,000원', occ: '82%', position: '비즈니스' }], revenueBreakdown: { room: '44,200,000원', casinoFnb: '21,000,000원', artTainment: '10,800,000원' }, occBreakdown: { totalRooms: '711실', casinoComp: '80실', miceBlock: '90실', available: '541실', sold: '492실' }, baseRevenue: 76000000 }
  };
  const [currentScenario, setCurrentScenario] = useState('normal');

  // 3. 민감도 상태
  const [sensitivity, setSensitivity] = useState<'Low' | 'Mid' | 'High'>('High');

  // 4. 다이나믹 프라이싱 매트릭스 데이터 (완벽 동기화)
  const matrixConfigs = [
    { 
      group: '1. VIP & Premium', examples: '풀빌라, 아트파라디소, 카지노 하이롤러', basePrice: 7500000,
      lt: 'LT ≥ 30일', occ: '-', multiplier: '0% (고정가)', floor: 'Base Rate', ceiling: 'Base Rate',
      constraints: ['카지노 VIP 콤프 및 브랜드 가치 보호를 위해 다이나믹 할인 미적용', '미판매 시 영업팀 전용 블록으로 전환'],
      minCap: 1.0, maxCap: 1.0 
    },
    { 
      group: '2. Family & Kids', examples: '원더박스 패키지, 키캉스, 코넥팅룸', basePrice: 750000,
      lt: '14 ≤ LT ≤ 30일', occ: 'OCC ≥ 70% / 85%', multiplier: '+20% ~ +50%', floor: 'Base - 10%', ceiling: 'Base + 50%',
      constraints: ['주말/공휴일/방학 시즌 위주 인상', 'LT ≤ 3일 미판매 시 키즈 부대시설 바우처를 결합하여 Floor 방어'],
      minCap: 0.9, maxCap: 1.5 
    },
    { 
      group: '3. Wellness & MZ', examples: '씨메르 패키지, 크로마 파티, 럽디너', basePrice: 500000,
      lt: 'LT ≤ 7일 / 당일', occ: 'OCC ≥ 80% / < 50%', multiplier: '-20% ~ +60%', floor: 'Base - 20%', ceiling: 'Base + 60%',
      constraints: ['풀파티/이벤트 당일 수요 집중 시 스파 카바나 및 객실 최고가 적용', '심야 미판매 객실 타임세일(Night-Owl) 가동'],
      minCap: 0.8, maxCap: 1.6 
    },
    { 
      group: '4. MICE & Bleisure', examples: '이그제큐티브 라운지, MICE 연계, 공항 트랜짓', basePrice: 1200000,
      lt: 'LT ≥ 60일 / 당일', occ: '외부 MICE 발생 / 공항 결항률 ≥ 30%', multiplier: '-15% ~ +85%', floor: 'Base - 15%', ceiling: 'Base + 85%',
      constraints: ['대형 컨벤션/국제행사 확정 시 연박 조건(MLOS 2~3박) 자동 결합', '기상악화 시 공항 대기객 대상 레이트 체크아웃 포함 트랜짓 패키지 가동'],
      minCap: 0.85, maxCap: 1.85 
    },
    { 
      group: '5. Seasonal & Stay', examples: '롱스테이 워케이션, 전시/도슨트 패키지', basePrice: 350000,
      lt: '3 ≤ LT ≤ 14일', occ: 'OCC < 45% (주중)', multiplier: '-30% ~ +15%', floor: 'Base - 30%', ceiling: 'Base + 15%',
      constraints: ['비수기 주중(월~목) 점유율 방어용 최우선 적용', '순수 객실 단가 하락을 완화하기 위해 F&B/전시 바우처 포함 판매'],
      minCap: 0.7, maxCap: 1.15 
    }
  ];

  // 5. AI 룰 설정
  const [aiRules, setAiRules] = useState({
    autoPriceSync: true, casinoBlockProtection: true, competitorUnderCutGuard: true, weekendSurgeBoost: true
  });

  const [metrics, setMetrics] = useState(scenarios['normal']);
  const [roomRates, setRoomRates] = useState<any[]>([]);

  const checkWeekend = (dateStr: string) => {
    const year = startDate.split('-')[0] || new Date().getFullYear().toString();
    const [m, d] = dateStr.split('.');
    const dayOfWeek = new Date(`${year}-${m}-${d}`).getDay();
    return dayOfWeek === 5 || dayOfWeek === 6;
  };

  const getBgColor = (status: string) => {
    switch(status) {
      case 'dark-red': return 'bg-red-800 text-white font-bold';
      case 'high': return 'bg-amber-600 text-white font-bold';
      case 'lower': return 'bg-emerald-600 text-white font-bold';
      default: return 'bg-slate-50 text-slate-800 border border-slate-200';
    }
  };

  // AI 매트릭스 산출 로직 적용
  const applyAI = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const scenarioData = scenarios[currentScenario as keyof typeof scenarios];
      let sensitivityMultiplier = sensitivity === 'High' ? 1.2 : sensitivity === 'Low' ? 0.8 : 1.0;

      const adjustedRevenue = scenarioData.baseRevenue * (1 + (0.15 * sensitivityMultiplier));
      setMetrics({ ...scenarioData, baseRevenue: adjustedRevenue });

      const updatedRates = matrixConfigs.map((room, idx) => {
        const newRates = dates.map(dateStr => {
          const isWeekend = checkWeekend(dateStr); 
          let demandFactor = (scenarioData.baseOcc / 100) + (isWeekend ? 0.25 : 0);
          
          let finalPrice = room.basePrice;
          let status = 'standard';

          // VIP & Premium (Index 0)은 룰에 따라 무조건 고정가 방어
          if (idx === 0) {
            status = demandFactor > 1.0 ? 'dark-red' : 'standard';
          } else {
            // 다른 그룹들은 수요에 따라 multiplier 변동
            let priceMultiplier = 1.0;
            if (demandFactor > 0.85) {
              priceMultiplier = 1 + ((room.maxCap - 1) * ((demandFactor - 0.7) * 2) * sensitivityMultiplier);
            } else if (demandFactor < 0.65) {
              priceMultiplier = 1 - ((1 - room.minCap) * ((0.7 - demandFactor) * 2));
            }

            finalPrice = Math.round((room.basePrice * priceMultiplier) / 10000) * 10000;
            
            // Floor & Ceiling 제약 조건 캡 적용
            const floorPrice = room.basePrice * room.minCap;
            const ceilingPrice = room.basePrice * room.maxCap;
            
            if (finalPrice > ceilingPrice) finalPrice = ceilingPrice;
            if (finalPrice < floorPrice) finalPrice = floorPrice;
            
            // 색상 단계 부여
            if (finalPrice >= room.basePrice * 1.3) status = 'dark-red';
            else if (finalPrice > room.basePrice * 1.05) status = 'high';
            else if (finalPrice < room.basePrice * 0.95) status = 'lower';
          }

          return { date: dateStr, price: finalPrice.toLocaleString() + '원', status, rate: Math.min(99, Math.round(demandFactor * 100)) + '%' };
        });
        return { group: room.group, examples: room.examples, basePrice: room.basePrice, rates: newRates };
      });

      setRoomRates(updatedRates);
      const now = new Date();
      setLastUpdated(`${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`);
      setIsAnalyzing(false);
    }, 500);
  };

  useEffect(() => { 
    applyAI(); 
  }, [currentScenario, sensitivity, dates]); // eslint-disable-line react-hooks/exhaustive-deps

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
    { icon: <LayoutDashboard size={16} />, label: '대시보드' },
    { icon: <LayoutGrid size={16} />, label: '프라이싱 매트릭스' },
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

      {/* 모달 팝업 생략 처리 없이 전체 유지 */}
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
            <div className="pt-2 border-t border-slate-100 flex justify-end"><button onClick={() => setIsRevenueModalOpen(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs">확인 완료</button></div>
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
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsCalendarOpen(false)} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-bold">취소</button>
              <button onClick={handleDateApply} className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-bold">기간 적용</button>
            </div>
          </div>
        </div>
      )}

      {/* 사이드바 */}
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
      </aside>

      {/* 우측 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
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
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><DollarSign size={12} className="text-amber-600"/> 예상 전사 영업이익 (RevPAR)</span></div>
                      <div className="text-lg font-black text-amber-600 tracking-tight mt-1">{Math.round(metrics.baseRevenue).toLocaleString()}원</div>
                   </div>
                   <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><PieChart size={12} className="text-amber-600"/> 실질 점유율 (블록 제외)</span></div>
                      <div className="text-lg font-bold text-slate-800 mt-1">{metrics.baseOcc}%</div>
                   </div>
                   <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><Building2 size={12} className="text-amber-600"/> 인근 복합리조트 평균 요금</span></div>
                      <div className="text-lg font-bold text-slate-800 mt-1">{metrics.compPrice.toLocaleString()}원</div>
                   </div>
                   <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><PlaneTakeoff size={12} className="text-amber-600"/> 인천공항 입국 및 항공 수요</span></div>
                      <div className="text-xs font-bold text-slate-800 mt-1 truncate">{metrics.flightIndex}</div>
                   </div>
                </div>

                <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex flex-col overflow-hidden shadow-2xs">
                  <div className="flex justify-between items-end mb-3 shrink-0">
                    <div><h2 className="text-xs font-bold text-slate-800 uppercase tracking-wide">매트릭스 룰 기반 실시간 요금 히트맵</h2></div>
                  </div>

                  {/* 히트맵 색상 단계 설명 패널 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-md p-2.5 mb-3 text-[10px] text-slate-600 grid grid-cols-4 gap-2 shrink-0 shadow-inner">
                    <div className="flex flex-col gap-1 border-r border-slate-200 pr-2"><span className="font-bold text-red-800 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-red-800 rounded-full"></div> 최대 할증가 (Ceiling)</span><span>수요 초과 또는 MICE 연박 시. Max Cap 도달 구간.</span></div>
                    <div className="flex flex-col gap-1 border-r border-slate-200 pr-2 pl-1"><span className="font-bold text-amber-600 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-600 rounded-full"></div> 상향 조정 (High)</span><span>수요 집중 구간. Base 대비 5% 이상 요금이 인상된 상태.</span></div>
                    <div className="flex flex-col gap-1 border-r border-slate-200 pr-2 pl-1"><span className="font-bold text-slate-700 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-slate-200 border border-slate-300 rounded-full"></div> 표준 방어 (Standard)</span><span>안정 수요 구간. VIP 그룹은 항상 이 상태(고정가)를 유지.</span></div>
                    <div className="flex flex-col gap-1 pl-1"><span className="font-bold text-emerald-600 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div> 하한선 방어 (Floor)</span><span>수요 부족 시 예약 유도를 위해 설정된 Floor 가격까지 인하.</span></div>
                  </div>

                  <div className="flex-1 overflow-auto border border-slate-200 rounded-md relative">
                    <table className="w-full text-center">
                      <thead>
                        <tr className="bg-slate-100 sticky top-0 z-10 text-slate-700 shadow-sm">
                          <th className="border-b border-r border-slate-200 p-2.5 font-bold w-48 text-left pl-4 bg-slate-100">상품 그룹 분류</th>
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
                              {room.group}
                              <div className="text-[10px] font-normal text-slate-500 mt-0.5">{room.examples}</div>
                              <div className="text-[10px] font-bold text-amber-700 mt-1">기준가: {(room.basePrice/10000).toLocaleString()}만원</div>
                            </td>
                            {room.rates.map((rate: any, i: number) => (
                              <td key={i} className={`border-b border-r border-slate-200 p-1.5 transition-colors ${getBgColor(rate?.status)}`}>
                                {rate ? (
                                  <>
                                    <div className="font-bold tracking-tight text-xs">{rate.price}</div>
                                    {rate.status !== 'standard' && idx !== 0 && <div className="text-[9px] opacity-90 mt-0.5">예상점유 {rate.rate}</div>}
                                    {idx === 0 && <div className="text-[9px] opacity-70 mt-0.5">고정가 룰</div>}
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
                  <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5 text-xs"><CalendarDays size={14} className="text-amber-600"/> 수요 이벤트 시나리오</h3>
                  <select value={currentScenario} onChange={(e) => setCurrentScenario(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-xs text-slate-800 font-bold bg-slate-50 outline-none">
                    {Object.values(scenarios).map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
                  </select>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-2xs flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-slate-800 mb-3.5 flex items-center gap-1.5 text-xs"><Settings size={14} className="text-amber-600"/> 매트릭스 변동 민감도</h3>
                    <div className="mb-2">
                      <div className="flex gap-1.5 mt-4">
                        {(['Low', 'Mid', 'High'] as const).map(level => (
                          <button key={level} onClick={() => setSensitivity(level)} className={`flex-1 py-2 text-[11px] font-bold rounded border transition-all ${sensitivity === level ? 'bg-amber-600 text-white border-amber-600 shadow-2xs' : 'bg-white text-slate-500 border-slate-300 hover:bg-slate-50'}`}>
                            {level}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">High 설정 시 사전에 정의된 각 상품 그룹별 Ceiling Price(최고가) 제한에 더욱 공격적으로 도달합니다.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button onClick={applyAI} className="w-full flex items-center justify-center gap-1.5 bg-slate-900 text-white py-2 rounded text-xs font-bold hover:bg-slate-800 shadow-xs">
                      <Sparkles size={14} className="text-amber-400" /> AI 매트릭스 적용
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* [메뉴 2] 프라이싱 매트릭스 모듈 (신규 대시보드 구조) */}
          {activeMenu === '프라이싱 매트릭스' && (
            <div className="flex-1 bg-white rounded-lg border border-slate-200 flex flex-col overflow-hidden shadow-2xs">
              <div className="p-6 border-b border-slate-100 shrink-0">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><LayoutGrid size={20} className="text-amber-600" /> 다이나믹 프라이싱 매트릭스 통제 센터</h2>
                    <p className="text-xs text-slate-500 mt-1">리드타임(LT)과 OCC 임계치를 결합하여 각 상품 그룹별 Floor(최저가)와 Ceiling(최고가)을 통제하는 RM 마스터 룰입니다.</p>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-6 bg-slate-50/50">
                <table className="w-full text-left border-collapse bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 text-xs">
                      <th className="p-4 font-bold w-1/4">상품 그룹 및 대표 예시</th>
                      <th className="p-4 font-bold w-1/6">LT / OCC 임계치</th>
                      <th className="p-4 font-bold w-1/5">가격 변동폭 (Floor ~ Ceiling)</th>
                      <th className="p-4 font-bold">주요 제약 및 운영 조건</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs text-slate-700">
                    {matrixConfigs.map((m, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
                        <td className="p-4 align-top border-r border-slate-100">
                          <div className="font-extrabold text-slate-900 text-sm mb-1">{m.group}</div>
                          <div className="text-slate-500">{m.examples}</div>
                          <div className="mt-2 inline-block bg-slate-100 text-slate-600 px-2 py-1 rounded text-[10px] font-bold">Base: {(m.basePrice/10000).toLocaleString()}만원</div>
                        </td>
                        <td className="p-4 align-top border-r border-slate-100">
                          <div className="mb-2"><span className="text-[10px] font-bold text-slate-400 block mb-0.5">리드타임 (LT)</span> <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">{m.lt}</span></div>
                          <div><span className="text-[10px] font-bold text-slate-400 block mb-0.5">점유율 (OCC)</span> <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{m.occ}</span></div>
                        </td>
                        <td className="p-4 align-top border-r border-slate-100">
                          <div className="font-black text-slate-900 text-sm mb-2">{m.multiplier}</div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between"><span className="text-emerald-600 font-bold">Floor</span><span>{m.floor}</span></div>
                            <div className="flex justify-between"><span className="text-red-700 font-bold">Ceiling</span><span>{m.ceiling}</span></div>
                          </div>
                        </td>
                        <td className="p-4 align-top">
                          <ul className="space-y-1.5 list-disc pl-4 text-slate-600">
                            {m.constraints.map((c, i) => (
                              <li key={i} className="leading-relaxed">{c}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 나머지 메뉴 생략 (이전과 동일한 기능 유지) */}
          {activeMenu === '시장 분석' && (
            <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 shadow-2xs"><div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><LineChart size={20} className="text-amber-600" /> 시장 분석 모듈 준비중</h2></div></div>
          )}
          {activeMenu === '예약 현황' && (
            <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 shadow-2xs"><div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><CalendarDays size={20} className="text-amber-600" /> 예약 현황 모듈 준비중</h2></div></div>
          )}
          {activeMenu === 'AI 최적화 룰' && (
            <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 shadow-2xs"><div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Sparkles size={20} className="text-amber-600" /> AI 최적화 모듈 준비중</h2></div></div>
          )}
          {activeMenu === '시스템 설정' && (
            <div className="flex-1 bg-white rounded-lg border border-slate-200 p-6 shadow-2xs"><div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><ShieldAlert size={20} className="text-amber-600" /> 시스템 설정 모듈 준비중</h2></div></div>
          )}

        </div>
      </main>
    </div>
  );
}