"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  LayoutDashboard, Settings, CalendarDays, LineChart, Cpu, ChevronDown, 
  Loader2, PlaneTakeoff, Building2, ShieldAlert, Sliders, Sparkles, X, 
  ExternalLink, Save, CheckCircle2, DollarSign, PieChart, RefreshCcw, 
  Award, Users, CloudSun, Zap, MapPin, Check 
} from 'lucide-react';

export default function GladPricingDashboard() {
  const [selectedProperty, setSelectedProperty] = useState<'yeouido' | 'mapo' | 'coex'>('yeouido');

  const [activeMenu, setActiveMenu] = useState('대시보드');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('방금 전');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-14');
  const [dateRangeLabel, setDateRangeLabel] = useState('2026.10.01 ~ 10.14');
  const [dates, setDates] = useState(['10.01', '10.02', '10.03', '10.04', '10.05', '10.06', '10.07', '10.08', '10.09', '10.10', '10.11', '10.12', '10.13', '10.14']);

  const [weatherCondition, setWeatherCondition] = useState<'sunny' | 'festival_fine' | 'rain' | 'cold'>('festival_fine');
  const weatherPolicies = {
    sunny: { name: '☀️ 맑음/쾌청', factor: 1.03, desc: '야외 활동 증가로 레저 demand +3%' },
    festival_fine: { name: '🍂 가을 야외축제 적기', factor: 1.06, desc: '한강/윤중로/도심 행사 피크 demand +6%' },
    rain: { name: '🌧️ 우천/강풍', factor: 0.92, desc: '야외 행사 취소 및 유입 감소 -8%' },
    cold: { name: '❄️ 한파/악천후', factor: 0.95, desc: '도심 이동량 감소 demand -5%' }
  };

  const [airportData, setAirportData] = useState({
    pax: '108,200명/일',
    flights: '635편착륙',
    multiplier: 1.0
  });

  const [memberTier, setMemberTier] = useState<'regular' | 'silver' | 'gold' | 'platinum' | 'black'>('gold');

  const [tierPolicies, setTierPolicies] = useState({
    regular: { name: '일반 고객 (Non-Member)', discountRate: 0, rewardMultiplier: 1.0, perk: '기본 포인트 1% 적립' },
    silver: { name: 'GLAD 실버 (Silver)', discountRate: -3, rewardMultiplier: 1.5, perk: '객실 요금 3% 우대 할인' },
    gold: { name: 'GLAD 골드 (Gold)', discountRate: -7, rewardMultiplier: 2.0, perk: '객실 요금 7% 우대 + 레이트 체크아웃' },
    platinum: { name: 'GLAD 플래티넘 (Platinum)', discountRate: -12, rewardMultiplier: 3.0, perk: '객실 요금 12% 우대 + 무료 조식 1인' },
    black: { name: 'GLAD VIP 블랙 (Black Prestige)', discountRate: -18, rewardMultiplier: 5.0, perk: '글래드 스위트 업그레이드 + 18% 할인' }
  });

  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isOccModalOpen, setIsOccModalOpen] = useState(false);
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);

  // 💡 [2026년 4분기 MICE & 이벤트 데이터셋]
  const propertyProfiles = {
    yeouido: {
      name: '글래드 여의도',
      subText: 'Yeouido Financial District & Riverview',
      totalRooms: '319실',
      totalRoomsNum: 319,
      roomConfigs: [
        { type: '스탠다드 (Standard)', basePrice: 250000, minPrice: 220000, maxPrice: 450000 },
        { type: '디럭스 (Deluxe)', basePrice: 310000, minPrice: 270000, maxPrice: 550000 },
        { type: '코너 디럭스 (Corner Deluxe)', basePrice: 380000, minPrice: 330000, maxPrice: 680000 },
        { type: '글래드 스위트 (Glad Suite)', basePrice: 620000, minPrice: 520000, maxPrice: 1150000 }
      ],
      scenarios: {
        normal: {
          id: 'normal', name: '10월 여의도 금융가 평시 비즈니스 (Standard Week)', baseOcc: 74, compPrice: 340000,
          flightIndex: '안정적 (여의도/금융가 출장 & 도심 비즈니스 중심)',
          competitors: [
            { name: '콘래드 서울 (Conrad)', avgPrice: '520,000원', occ: '82%', position: '여의도 IFC' },
            { name: '페어몬트 앰배서더 서울', avgPrice: '580,000원', occ: '80%', position: '여의도 파크원' },
            { name: '호텔 나루 서울 매갤러리', avgPrice: '410,000원', occ: '84%', position: '마포 한강변' },
            { name: '켄싱턴호텔 여의도', avgPrice: '230,000원', occ: '85%', position: '여의도 순복음 상권' }
          ],
          revenueBreakdown: { room: 48500000, fnbDining: 17000000, banquetMice: 11000000 },
          occBreakdown: { totalRooms: '319실', corpBlock: '55실 (금융법인)', memberHold: '30실 (VIP)', available: '234실', sold: '188실' },
          baseRevenue: 76500000
        },
        national_audit: {
          id: 'national_audit', name: '🏛️ 2026 정기 국정감사 & 여의도 금융 IR 피크 (10월중순~11월초)', baseOcc: 88, compPrice: 480000,
          flightIndex: '높음 (정부·국회 관계자 및 대형 금융 IR 출장 집중)',
          competitors: [
            { name: '콘래드 서울 (Conrad)', avgPrice: '690,000원', occ: '96%', position: '여의도 IFC' },
            { name: '페어몬트 앰배서더 서울', avgPrice: '780,000원', occ: '95%', position: '여의도 파크원' },
            { name: '호텔 나루 서울 매갤러리', avgPrice: '590,000원', occ: '92%', position: '마포 한강변' },
            { name: '켄싱턴호텔 여의도', avgPrice: '320,000원', occ: '91%', position: '여의도 순복음 상권' }
          ],
          revenueBreakdown: { room: 89000000, fnbDining: 26000000, banquetMice: 18000000 },
          occBreakdown: { totalRooms: '319실', corpBlock: '85실 (국회/법인)', memberHold: '25실 (VIP)', available: '209실', sold: '200실' },
          baseRevenue: 133000000
        },
        autumn_picnic: {
          id: 'autumn_picnic', name: '🍂 한강 억새 페스티벌 & 윤중로 가을 피크닉 호캉스 (10월초~11월초)', baseOcc: 84, compPrice: 410000,
          flightIndex: '높음 (윤중로 가을 산책로 & 주말 호캉스 유입)',
          competitors: [
            { name: '콘래드 서울 (Conrad)', avgPrice: '620,000원', occ: '94%', position: '여의도 IFC' },
            { name: '페어몬트 앰배서더 서울', avgPrice: '690,000원', occ: '92%', position: '여의도 파크원' },
            { name: '호텔 나루 서울 매갤러리', avgPrice: '520,000원', occ: '91%', position: '마포 한강변' },
            { name: '켄싱턴호텔 여의도', avgPrice: '310,000원', occ: '89%', position: '여의도 순복음 상권' }
          ],
          revenueBreakdown: { room: 71000000, fnbDining: 22000000, banquetMice: 12500000 },
          occBreakdown: { totalRooms: '319실', corpBlock: '40실 (법인계약)', memberHold: '30실 (VIP)', available: '249실', sold: '232실' },
          baseRevenue: 105500000
        },
        the_hyundai_popup: {
          id: 'the_hyundai_popup', name: '👗 더현대 서울 & 한강 연계 K-뷰티 / 패션 팝업 위크 (10월중~하순)', baseOcc: 81, compPrice: 380000,
          flightIndex: '보통 (2030 영타겟 및 외국인 쇼핑 관광객 유입)',
          competitors: [
            { name: '콘래드 서울 (Conrad)', avgPrice: '580,000원', occ: '88%', position: '여의도 IFC' },
            { name: '페어몬트 앰배서더 서울', avgPrice: '640,000원', occ: '87%', position: '여의도 파크원' },
            { name: '호텔 나루 서울 매갤러리', avgPrice: '460,000원', occ: '88%', position: '마포 한강변' },
            { name: '켄싱턴호텔 여의도', avgPrice: '270,000원', occ: '86%', position: '여의도 순복음 상권' }
          ],
          revenueBreakdown: { room: 61000000, fnbDining: 19500000, banquetMice: 11500000 },
          occBreakdown: { totalRooms: '319실', corpBlock: '45실 (패션/뷰티법인)', memberHold: '25실 (VIP)', available: '249실', sold: '210실' },
          baseRevenue: 92000000
        }
      }
    },
    mapo: {
      name: '글래드 마포',
      subText: 'Gongdeok Station Hub & Business Transit',
      totalRooms: '378실',
      totalRoomsNum: 378,
      roomConfigs: [
        { type: '스탠다드 (Standard)', basePrice: 240000, minPrice: 210000, maxPrice: 390000 },
        { type: '디럭스 (Deluxe)', basePrice: 300000, minPrice: 260000, maxPrice: 480000 },
        { type: '글래드 하우스 (Glad House)', basePrice: 370000, minPrice: 320000, maxPrice: 590000 },
        { type: '글래드 스위트 (Glad Suite)', basePrice: 580000, minPrice: 490000, maxPrice: 980000 }
      ],
      scenarios: {
        normal: {
          id: 'normal', name: '10월 공덕/마포 비즈니스 평시 (Standard Week)', baseOcc: 75, compPrice: 310000,
          flightIndex: '안정적 (공항철도 연결 직장인 & 환승 비즈니스)',
          competitors: [
            { name: '호텔 나루 서울 매갤러리', avgPrice: '410,000원', occ: '81%', position: '마포대교 남단' },
            { name: '롯데시티호텔 마포', avgPrice: '290,000원', occ: '86%', position: '공덕역 직결' },
            { name: '신라스테이 마포', avgPrice: '275,000원', occ: '84%', position: '공덕 비즈니스' },
            { name: 'ROYNET Hotel Seoul Mapo', avgPrice: '280,000원', occ: '83%', position: '마포대로' }
          ],
          revenueBreakdown: { room: 49200000, fnbDining: 14000000, banquetMice: 8000000 },
          occBreakdown: { totalRooms: '378실', corpBlock: '70실 (IT/마케팅법인)', memberHold: '35실 (VIP)', available: '273실', sold: '224실' },
          baseRevenue: 71200000
        },
        shrimp_fest: {
          id: 'shrimp_fest', name: '🐟 제19회 마포나루 새우젓 축제 (10.16~10.18 Regional Peak)', baseOcc: 88, compPrice: 420000,
          flightIndex: '높음 (상암 월드컵공원 대형 지역 축제 유입)',
          competitors: [
            { name: '호텔 나루 서울 매갤러리', avgPrice: '590,000원', occ: '97%', position: '마포대교 남단' },
            { name: '롯데시티호텔 마포', avgPrice: '390,000원', occ: '95%', position: '공덕역 직결' },
            { name: '신라스테이 마포', avgPrice: '360,000원', occ: '93%', position: '공덕 비즈니스' },
            { name: 'ROYNET Hotel Seoul Mapo', avgPrice: '370,000원', occ: '91%', position: '마포대로' }
          ],
          revenueBreakdown: { room: 78000000, fnbDining: 25000000, banquetMice: 11000000 },
          occBreakdown: { totalRooms: '378실', corpBlock: '40실 (법인계약)', memberHold: '30실 (VIP)', available: '308실', sold: '295실' },
          baseRevenue: 114000000
        }
      }
    },
    coex: {
      name: '글래드 강남 코엑스센터',
      subText: 'Teheran-ro Tech & COEX MICE Hub',
      totalRooms: '282실',
      totalRoomsNum: 282,
      roomConfigs: [
        { type: '스탠다드 (Standard)', basePrice: 280000, minPrice: 240000, maxPrice: 420000 },
        { type: '슈페리어 (Superior)', basePrice: 350000, minPrice: 300000, maxPrice: 520000 },
        { type: '글래드 점보/스마트 (Jumbo)', basePrice: 420000, minPrice: 360000, maxPrice: 630000 },
        { type: '코엑스 스위트 (Coex Suite)', basePrice: 680000, minPrice: 580000, maxPrice: 1250000 }
      ],
      scenarios: {
        normal: {
          id: 'normal', name: '10월 테헤란로 IT/금융 비즈니스 평시 (Standard Week)', baseOcc: 77, compPrice: 380000,
          flightIndex: '안정적 (삼성역/테헤란로 IT 바이어 & 해외 출장자)',
          competitors: [
            { name: '그랜드 인터컨티넨탈 파르나스', avgPrice: '620,000원', occ: '85%', position: '삼성역 직결' },
            { name: '파크 하얏트 서울', avgPrice: '820,000원', occ: '82%', position: '삼성역 교차로' },
            { name: '신라스테이 삼성', avgPrice: '340,000원', occ: '88%', position: '삼성역 맞은편' },
            { name: '오크우드 프리미엄 코엑스', avgPrice: '560,000원', occ: '83%', position: '코엑스 단지' }
          ],
          revenueBreakdown: { room: 50800000, fnbDining: 12000000, banquetMice: 11000000 },
          occBreakdown: { totalRooms: '282실', corpBlock: '75실 (테헤란로 IT)', memberHold: '25실 (VIP)', available: '182실', sold: '155실' },
          baseRevenue: 73800000
        },
        kes_sedex: {
          id: 'kes_sedex', name: '📱 KES 2026 (한국전자전) & SEDEX (반도체대전 / 10.14~10.17 Surge)', baseOcc: 90, compPrice: 620000,
          flightIndex: '최고조 (대한민국 대표 IT/전자/반도체 해외 바이어 및 대기업 출장자 총집결)',
          competitors: [
            { name: '그랜드 인터컨티넨탈 파르나스', avgPrice: '980,000원', occ: '99%', position: '삼성역 직결' },
            { name: '파크 하얏트 서울', avgPrice: '1,250,000원', occ: '98%', position: '삼성역 교차로' },
            { name: '신라스테이 삼성', avgPrice: '520,000원', occ: '99%', position: '삼성역 맞은편' },
            { name: '오크우드 프리미엄 코엑스', avgPrice: '850,000원', occ: '97%', position: '코엑스 단지' }
          ],
          revenueBreakdown: { room: 105000000, fnbDining: 24000000, banquetMice: 28000000 },
          occBreakdown: { totalRooms: '282실', corpBlock: '100실 (MICE 바이어)', memberHold: '20실 (VIP)', available: '162실', sold: '160실' },
          baseRevenue: 157000000
        }
      }
    }
  };

  const activePropertyData = propertyProfiles[selectedProperty];

  // 💡 [변경 1] 시나리오 단일 선택(Single-Select) 상태로 원복
  const [selectedScenario, setSelectedScenario] = useState<string>('normal');
  const [isScenarioDropdownOpen, setIsScenarioDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [roomConfigs, setRoomConfigs] = useState(activePropertyData.roomConfigs);

  const [minDrop, setMinDrop] = useState(-10);
  const [maxRise, setMaxRise] = useState(30);
  const [sensitivity, setSensitivity] = useState<'Low' | 'Mid' | 'High'>('High');

  const [aiRules, setAiRules] = useState({
    autoPriceSync: true, corpBlockProtection: true, competitorUnderCutGuard: true, weekendSurgeBoost: true
  });

  const [metrics, setMetrics] = useState<any>(activePropertyData.scenarios['normal']);
  const [roomRates, setRoomRates] = useState<any[]>([]);

  useEffect(() => {
    setSelectedScenario('normal');
    setRoomConfigs(activePropertyData.roomConfigs);
    setMetrics(activePropertyData.scenarios['normal']);
  }, [selectedProperty]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsScenarioDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 💡 [2026년 10월 정확한 주말 및 공휴일(대체휴무 포함) 정밀 동기화 로직]
  const getDayDetails = (dateStr: string) => {
    const year = startDate.split('-')[0] || '2026';
    const [m, d] = dateStr.split('.');
    const dateObj = new Date(`${year}-${m}-${d}`);
    const dayOfWeek = dateObj.getDay(); // 0: 일, 6: 토
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    const holidayMap: Record<string, string> = {
      '10.03': '개천절',
      '10.05': '대체휴무',
      '10.09': '한글날'
    };

    const holidayName = holidayMap[dateStr];
    const isHoliday = !!holidayName;
    const isHolidayPeak = isWeekend || isHoliday;

    return { dayOfWeek, isWeekend, isHoliday, holidayName, isHolidayPeak };
  };

  // 💡 [히트맵 수요 변별력 확보: 과도한 붉은색 방지 세분화 기준]
  const getBgColor = (status: string) => {
    switch(status) {
      case 'dark-red': return 'bg-rose-600 text-white font-bold border border-rose-700 shadow-xs';
      case 'high': return 'bg-amber-500 text-slate-950 font-bold border border-amber-600 shadow-xs';
      case 'lower': return 'bg-emerald-600 text-white font-bold border border-emerald-700 shadow-xs';
      default: return 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50';
    }
  };

  const fetchAirportTraffic = useCallback(async (dateStr: string) => {
    try {
      const response = await fetch(`/api/airport-traffic?date=${dateStr}`);
      const result = await response.json();
      if (result.success) {
        setAirportData({
          pax: `${result.pax.toLocaleString()}명/일`,
          flights: `${result.flights}편착륙`,
          multiplier: result.multiplier
        });
      }
    } catch (e) {
      // 모의 트래픽 유지
    }
  }, []);

  // 💡 [변경 2] 단일 시나리오 연산 시 장기 관제(10월 전체 등)에서도 전면 붉은색 도배를 방지하는 분산 수위 조절 로직
  const applyAI = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const currentScenariosObj = activePropertyData.scenarios;
      const currentScenarioData = currentScenariosObj[selectedScenario as keyof typeof currentScenariosObj] || currentScenariosObj['normal'];

      let sensitivityMultiplier = sensitivity === 'High' ? 1.15 : sensitivity === 'Low' ? 0.85 : 1.0;
      const weatherMultiplier = weatherPolicies[weatherCondition].factor;
      const currentTierDiscount = tierPolicies[memberTier].discountRate;

      const dailyOccList: number[] = [];
      const weekdayOccList: number[] = [];
      const weekendOccList: number[] = [];

      const updatedRates = roomConfigs.map((room, rIdx) => {
        const newRates = dates.map((dateStr, dIdx) => {
          const { isWeekend, isHoliday, isHolidayPeak } = getDayDetails(dateStr);
          
          let baseOccVal = currentScenarioData.baseOcc * weatherMultiplier;
          
          // 날짜 인덱스(dIdx) 및 객실 타입(rIdx)에 따른 자연스러운 편차 부여 (전면 붉은색 방지)
          const naturalVariance = ((dIdx + rIdx * 2) % 5) * 2 - 4; // -4% ~ +4% 분산
          baseOccVal += naturalVariance;

          if (isWeekend) baseOccVal += 6;           
          else if (isHoliday) baseOccVal += 10; 
          
          if (isHolidayPeak) baseOccVal += 4;

          baseOccVal += (airportData.multiplier - 1.0) * 10;

          const finalDailyOcc = Math.min(98, Math.max(45, Math.round(baseOccVal)));

          if (rIdx === 0) {
            dailyOccList.push(finalDailyOcc);
            if (isHolidayPeak) weekendOccList.push(finalDailyOcc);
            else weekdayOccList.push(finalDailyOcc);
          }

          let demandFactor = (finalDailyOcc / 100);
          
          let priceMultiplier = 1;
          if (demandFactor > 0.86) {
            priceMultiplier = 1 + (maxRise / 100) * (demandFactor - 0.72) * sensitivityMultiplier;
          } else if (demandFactor < 0.68) {
            priceMultiplier = 1 + (minDrop / 100);
          }

          let rawPrice = room.basePrice * priceMultiplier * (1 + currentTierDiscount / 100);
          let finalPrice = Math.round(rawPrice / 10000) * 10000;
          
          if (finalPrice > room.maxPrice) finalPrice = room.maxPrice;
          if (finalPrice < room.minPrice) finalPrice = room.minPrice;
          
          // 💡 [수요 구간 세분화 판정: 엄격한 기준 적용으로 변별력 확보]
          let status = 'standard';
          if (finalDailyOcc >= 94) status = 'dark-red';
          else if (finalDailyOcc >= 86) status = 'high';
          else if (finalDailyOcc < 68) status = 'lower';

          return { 
            date: dateStr, 
            price: finalPrice.toLocaleString() + '원', 
            status, 
            rate: finalDailyOcc + '%' 
          };
        });
        return { type: room.type, basePrice: room.basePrice, minPrice: room.minPrice, maxPrice: room.maxPrice, rates: newRates };
      });

      const periodAvgOcc = dailyOccList.length > 0 
        ? Math.round(dailyOccList.reduce((a, b) => a + b, 0) / dailyOccList.length) 
        : currentScenarioData.baseOcc;

      const weekdayAvgOcc = weekdayOccList.length > 0 
        ? Math.round(weekdayOccList.reduce((a, b) => a + b, 0) / weekdayOccList.length) 
        : periodAvgOcc - 6;

      const weekendAvgOcc = weekendOccList.length > 0 
        ? Math.round(weekendOccList.reduce((a, b) => a + b, 0) / weekendOccList.length) 
        : Math.min(97, periodAvgOcc + 8);

      const dailyAdjustedRevenue = currentScenarioData.baseRevenue * (periodAvgOcc / currentScenarioData.baseOcc) * (1 + (maxRise * 0.002 * sensitivityMultiplier));
      const selectedDaysCount = dates.length || 1;
      const periodRevenue = dailyAdjustedRevenue * selectedDaysCount;
      const monthlyRevenue = dailyAdjustedRevenue * 31;

      const totalSoldRoomsPeriod = Math.round((activePropertyData.totalRoomsNum * (periodAvgOcc / 100)) * selectedDaysCount);

      setMetrics({ 
        ...currentScenarioData, 
        baseRevenue: dailyAdjustedRevenue, 
        periodRevenue: periodRevenue,
        monthlyRevenue: monthlyRevenue,
        periodAvgOcc: periodAvgOcc,       
        weekdayAvgOcc: weekdayAvgOcc,   
        weekendAvgOcc: weekendAvgOcc,   
        totalSoldRoomsPeriod: totalSoldRoomsPeriod,
        scaledBreakdown: {
          room: currentScenarioData.revenueBreakdown.room * selectedDaysCount * (periodAvgOcc / currentScenarioData.baseOcc),
          fnbDining: currentScenarioData.revenueBreakdown.fnbDining * selectedDaysCount * weatherMultiplier,
          banquetMice: currentScenarioData.revenueBreakdown.banquetMice * selectedDaysCount
        }
      });

      setRoomRates(updatedRates);
      const now = new Date();
      setLastUpdated(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
      setIsAnalyzing(false);
    }, 300);
  }, [selectedProperty, selectedScenario, roomConfigs, sensitivity, weatherCondition, dates, airportData.multiplier, maxRise, minDrop, memberTier, tierPolicies]);

  useEffect(() => { 
    if (dates.length > 0) {
      fetchAirportTraffic(dates[0]).then(() => {
        applyAI();
      });
    }
  }, [selectedProperty, dates, selectedScenario, sensitivity, weatherCondition, memberTier, fetchAirportTraffic, applyAI]);

  const handleDateApply = () => {
    const newDates = [];
    let current = new Date(startDate);
    const stop = new Date(endDate);
    
    while (current <= stop && newDates.length < 31) {
      const m = String(current.getMonth() + 1).padStart(2, '0');
      const d = String(current.getDate()).padStart(2, '0');
      newDates.push(`${m}.${d}`);
      current.setDate(current.getDate() + 1);
    }
    
    if(newDates.length === 0) newDates.push('10.01');
    
    setDates(newDates);
    setDateRangeLabel(`${startDate} ~ ${endDate}`);
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

  const currentActiveScenarioObj = activePropertyData.scenarios[selectedScenario as keyof typeof activePropertyData.scenarios];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans text-xs select-none relative">
      
      {toastMessage && (
        <div className="absolute top-16 right-6 bg-slate-900 text-amber-400 px-4 py-2.5 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-amber-400" />
          <span className="font-medium text-xs text-white">{toastMessage}</span>
        </div>
      )}

      {/* 1. 매출 분석 모달 */}
      {isRevenueModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[520px] p-6 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><DollarSign size={18} className="text-amber-600"/> [{activePropertyData.name}] 선택 기간 예상 매출 상세 분석</h3>
              <button onClick={() => setIsRevenueModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-950 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">선택 관제 기간({dates.length}일간) 총 예상 매출</div>
                  <div className="text-[10px] text-slate-500">날씨({weatherPolicies[weatherCondition].name}) & 평균가동률({metrics.periodAvgOcc}%) 연동</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-amber-600">{Math.round(metrics.periodRevenue || 0).toLocaleString()}원</div>
                  <div className="text-[10px] text-slate-500 font-normal">일평균 약 {Math.round(metrics.baseRevenue || 0).toLocaleString()}원</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-2.5 rounded-lg">
                <span className="text-slate-600 font-medium">10월 한 달(31일 기준) 예상 매출 추산</span>
                <span className="font-bold text-slate-900 text-sm">{Math.round(metrics.monthlyRevenue || 0).toLocaleString()}원</span>
              </div>

              <div className="font-bold text-slate-700 mt-2">선택 기간({dates.length}일) 부문별 매출 기여도</div>
              <div className="space-y-2">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-slate-600">객실 숙박 매출 (Room Revenue)</span>
                  <span className="font-bold text-slate-900">{Math.round(metrics.scaledBreakdown?.room || 0).toLocaleString()}원</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-slate-600">다이닝 및 F&B (Greets / Bar)</span>
                  <span className="font-bold text-slate-900">{Math.round(metrics.scaledBreakdown?.fnbDining || 0).toLocaleString()}원</span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                  <span className="text-slate-600">연회 및 MICE (Banquet & Event)</span>
                  <span className="font-bold text-slate-900">{Math.round(metrics.scaledBreakdown?.banquetMice || 0).toLocaleString()}원</span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsRevenueModalOpen(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-800">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 동적 점유율(OCC) 모달 */}
      {isOccModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[520px] p-6 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><PieChart size={18} className="text-amber-600"/> [{activePropertyData.name}] 선택 기간 실질 점유율(OCC) 동적 분석</h3>
              <button onClick={() => setIsOccModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-900">선택 관제 기간({dates.length}일간) 실질 평균 가동률</div>
                  <div className="text-[10px] text-slate-500">주말/공휴일 피크 및 평시 비즈니스 분산 반영</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-amber-600">{metrics.periodAvgOcc || metrics.baseOcc}%</div>
                  <div className="text-[10px] text-emerald-600 font-semibold">총 {metrics.totalSoldRoomsPeriod?.toLocaleString()} 객실 판매 추정</div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 p-3 rounded-lg">
                  <div className="text-slate-500 mb-1">평일 평균 가동률 (Weekday)</div>
                  <div className="text-base font-bold text-slate-800">{metrics.weekdayAvgOcc}%</div>
                  <div className="text-[9.5px] text-slate-400 mt-0.5">금융/비즈니스 출장 중심</div>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-lg">
                  <div className="text-slate-500 mb-1">주말/공휴일 피크 (Weekend/Peak)</div>
                  <div className="text-base font-bold text-amber-600">{metrics.weekendAvgOcc}%</div>
                  <div className="text-[9.5px] text-amber-700/80 mt-0.5">가을 호캉스 & 연휴 서지</div>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-lg">
                  <div className="text-slate-500 mb-1">지점 총 객실 규모</div>
                  <div className="text-sm font-bold text-slate-800">{activePropertyData.totalRooms}</div>
                </div>
                <div className="bg-white border border-slate-200 p-3 rounded-lg">
                  <div className="text-slate-500 mb-1">법인/VIP 고정 블록</div>
                  <div className="text-sm font-bold text-slate-700">{metrics.occBreakdown.corpBlock} + {metrics.occBreakdown.memberHold}</div>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsOccModalOpen(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-800">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 3. 캘린더 모달 */}
      {isCalendarOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-[380px] p-5 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><CalendarDays size={16} className="text-amber-600"/> 관제 기간 설정</h3>
              <button onClick={() => setIsCalendarOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3">
              <div><label className="block text-[11px] font-medium text-slate-600 mb-1">시작일</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-slate-50 text-slate-900 outline-none focus:border-amber-500" /></div>
              <div><label className="block text-[11px] font-medium text-slate-600 mb-1">종료일</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-xs font-semibold bg-slate-50 text-slate-900 outline-none focus:border-amber-500" /></div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setIsCalendarOpen(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold hover:bg-slate-200">취소</button>
              <button onClick={handleDateApply} className="flex-1 bg-amber-600 text-white py-2 rounded-lg font-bold hover:bg-amber-700">기간 적용</button>
            </div>
          </div>
        </div>
      )}

      {/* 4. 공항 트래픽 모달 */}
      {isFlightModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[480px] p-6 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><PlaneTakeoff size={18} className="text-amber-600"/> 공항 실시간 입국 트래픽 인사이트</h3>
              <button onClick={() => setIsFlightModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-950">
                <div className="font-bold text-amber-700 mb-1">인천/김포 공항 API 연동: 정상 연동 중</div>
                <div>가격과 공항 입국객 트래픽 계수가 실시간 연동되어 프라이싱 추천을 업데이트합니다.</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><div className="text-slate-500 mb-1">일일 입국객 수</div><div className="text-base font-bold text-slate-900">{airportData.pax}</div></div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200"><div className="text-slate-500 mb-1">실시간 도착 항공편</div><div className="text-base font-bold text-slate-900">{airportData.flights}</div></div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsFlightModalOpen(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-800">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 5. 경쟁사 모달 */}
      {isCompetitorModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[520px] p-6 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><Building2 size={18} className="text-amber-600"/> [{activePropertyData.name}] 10월/11월 Comp-Set 분석</h3>
              <button onClick={() => setIsCompetitorModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 flex justify-between items-center">
                <div><div className="font-bold text-slate-900">당사 추천가 ({tierPolicies[memberTier].name})</div></div>
                <div className="text-base font-black text-amber-600">{metrics.compPrice.toLocaleString()}원 대</div>
              </div>
              <div className="font-bold text-slate-700 mt-2">경쟁사 가격대</div>
              <div className="space-y-2">
                {metrics.competitors.map((comp: any, idx: number) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                    <div><div className="font-bold text-slate-900">{comp.name}</div><div className="text-[10px] text-slate-500">{comp.position}</div></div>
                    <div className="text-right"><div className="font-bold text-slate-800">{comp.avgPrice}</div><div className="text-[10px] text-emerald-600 font-medium">점유율 {comp.occ}</div></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsCompetitorModalOpen(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-800">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 좌측 사이드바 */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 shadow-lg">
        
        {/* GLAD (Demo) 브랜딩 명기 */}
        <div className="p-5 border-b border-slate-800 flex flex-col items-center justify-center text-center gap-1 bg-slate-950">
          <div className="tracking-[0.22em] font-black text-white text-xl font-sans uppercase flex items-center gap-1.5">
            GLAD <span className="text-amber-400 text-xs font-bold tracking-normal bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">(Demo)</span>
          </div>
          <div className="h-[1px] w-28 bg-slate-700 my-0.5"></div>
          <div className="text-[8.5px] tracking-[0.28em] font-semibold text-slate-400 uppercase">
            HOTELS & RESORTS
          </div>
          <div className="mt-2 bg-amber-500/15 border border-amber-400/30 text-amber-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
            Dynamic Pricing RMS v2.0
          </div>
        </div>

        <div className="p-3 border-b border-slate-800/80 bg-slate-950/60">
          <div className="text-[10px] font-bold text-slate-400 mb-1.5 flex items-center gap-1 px-1">
            <MapPin size={12} className="text-amber-400" /> 관제 지점 (Property)
          </div>
          <div className="grid grid-cols-1 gap-1">
            {(Object.keys(propertyProfiles) as Array<keyof typeof propertyProfiles>).map((propKey) => {
              const item = propertyProfiles[propKey];
              const isSelected = selectedProperty === propKey;
              return (
                <button
                  key={propKey}
                  onClick={() => setSelectedProperty(propKey)}
                  className={`px-3 py-2 rounded-lg text-left transition-all flex flex-col ${
                    isSelected 
                      ? 'bg-amber-500/20 text-white font-bold border border-amber-400/60 shadow-sm' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                  }`}
                >
                  <span className="text-xs flex items-center justify-between">
                    {item.name}
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>}
                  </span>
                  <span className="text-[9px] text-slate-400 font-normal truncate mt-0.5">{item.subText} ({item.totalRooms})</span>
                </button>
              );
            })}
          </div>
        </div>

        <nav className="flex-1 px-3 py-3 space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">메인 메뉴</div>
          {menuItems.map((item) => (
            <button key={item.label} onClick={() => setActiveMenu(item.label)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all font-medium text-xs ${activeMenu === item.label ? 'bg-amber-500/15 text-amber-400 font-bold border-l-2 border-amber-400' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              {item.icon}{item.label}
            </button>
          ))}
        </nav>

        <div className="p-3 m-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400">
          <div className="font-bold text-amber-400 mb-0.5">2026년 4분기 MICE 반영</div>
          <div className="text-[10px] text-slate-400">국정감사·새우젓축제·KES·카페쇼 실시간 동기화</div>
        </div>
      </aside>

      {/* 메인 콘텐츠 영역 */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
        
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span className="bg-slate-900 text-amber-400 font-black px-2.5 py-0.5 rounded text-[11px]">{activePropertyData.name}</span>
              <span className="text-slate-700 font-medium">다이내믹 프라이싱</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600 font-bold text-xs">{activeMenu}</span>
            {isAnalyzing && <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> 연산 중...</span>}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200 text-xs shadow-2xs">
              <CloudSun size={14} className="text-amber-600" />
              <span className="text-slate-500 text-[11px]">기상 변수:</span>
              <select 
                value={weatherCondition} 
                onChange={(e) => setWeatherCondition(e.target.value as any)}
                className="bg-transparent text-slate-900 font-bold outline-none cursor-pointer text-xs"
              >
                {Object.entries(weatherPolicies).map(([k, w]) => (
                  <option key={k} value={k} className="bg-white text-slate-900">
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div onClick={() => setIsCalendarOpen(true)} className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-md text-slate-700 border border-slate-200 cursor-pointer hover:bg-amber-50/50 hover:border-amber-300 transition-all text-xs shadow-2xs">
              <CalendarDays size={14} className="text-amber-600" />
              <span className="font-semibold">{dateRangeLabel} ({dates.length}일간)</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[11px] border border-amber-400/40">RM</div>
              <div className="text-[11px] leading-tight"><div className="font-bold text-slate-800">GLAD RMS Center</div><div className="text-emerald-600 text-[9px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 실시간 연결</div></div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 flex gap-4 overflow-hidden bg-slate-100">
          
          {activeMenu === '대시보드' && (
            <>
              <div className="flex-1 flex flex-col gap-3 h-full overflow-hidden">
                
                {/* 4대 KPI 카드 */}
                <div className="grid grid-cols-4 gap-3 shrink-0">
                   <div onClick={() => setIsRevenueModalOpen(true)} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1"><DollarSign size={13} className="text-emerald-600"/> [{activePropertyData.name}] 선택 기간({dates.length}일) 예상 매출</span>
                        <ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" />
                      </div>
                      <div className="text-lg font-black text-amber-600 tracking-tight mt-1">
                        {Math.round(metrics.periodRevenue || (metrics.baseRevenue * dates.length)).toLocaleString()}원
                      </div>
                      <div className="text-[9.5px] text-slate-400 mt-0.5">일평균 약 {Math.round(metrics.baseRevenue || 0).toLocaleString()}원</div>
                   </div>

                   <div onClick={() => setIsOccModalOpen(true)} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between">
                        <span className="flex items-center gap-1"><PieChart size={13} className="text-sky-600"/> 실질 가동률 (Effective OCC)</span>
                        <ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" />
                      </div>
                      <div className="text-lg font-black text-slate-900 mt-1">
                        {metrics.periodAvgOcc || metrics.baseOcc}%
                      </div>
                      <div className="text-[9.5px] text-slate-400 mt-0.5">선택 {dates.length}일 평균 (주말/피크 {metrics.weekendAvgOcc || 95}%)</div>
                   </div>

                   <div onClick={() => setIsCompetitorModalOpen(true)} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><Building2 size={13} className="text-purple-600"/> Comp-Set 10월/11월 평균</span><ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" /></div>
                      <div className="text-lg font-bold text-slate-900 mt-1">{metrics.compPrice.toLocaleString()}원</div>
                      <div className="text-[9.5px] text-slate-400 mt-0.5">주변 4개 경쟁 호텔 실시간 분석</div>
                   </div>

                   <div onClick={() => setIsFlightModalOpen(true)} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><PlaneTakeoff size={13} className="text-amber-600"/> 공항 실시간 입국 트래픽</span><ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" /></div>
                      <div className="text-xs font-bold text-slate-900 mt-1 truncate">{airportData.pax}</div>
                      <div className="text-[9.5px] text-slate-400 mt-0.5">인바운드 demand 계수 x{airportData.multiplier}</div>
                   </div>
                </div>

                {/* 중앙 히트맵 */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex flex-col overflow-hidden shadow-2xs">
                  <div className="flex justify-between items-center mb-3 shrink-0">
                    <div>
                      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <span>[{activePropertyData.name}] 객실 상품별 다이내믹 요금 히트맵</span>
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {tierPolicies[memberTier].name} 할인율({tierPolicies[memberTier].discountRate}%) 연동 중
                        </span>
                      </h2>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3 text-[10px] text-slate-600 grid grid-cols-4 gap-2 shrink-0 shadow-inner">
                    <div className="flex flex-col gap-0.5 border-r border-slate-200 pr-2">
                      <span className="font-bold text-rose-700 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-rose-600 rounded-full"></div> 만실임박 (Dark Red)</span>
                      <span>수요 94% 이상. 상한 요금(Max Cap) 적용.</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-r border-slate-200 pr-2 pl-1">
                      <span className="font-bold text-amber-800 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div> 수요높음 (High)</span>
                      <span>수요 86% 이상. 성수기 주말/행사 인상 요금.</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-r border-slate-200 pr-2 pl-1">
                      <span className="font-bold text-slate-700 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-white border border-slate-300 rounded-full"></div> 통상 방어 (Standard)</span>
                      <span>평시 기준 요금대 유지.</span>
                    </div>
                    <div className="flex flex-col gap-0.5 pl-1">
                      <span className="font-bold text-emerald-700 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div> 할인필요 (Lower)</span>
                      <span>수요 68% 미만. 최저 하한선(Floor Price) 완화.</span>
                    </div>
                  </div>

                  <div className="flex-1 overflow-auto border border-slate-200 rounded-lg relative bg-white">
                    <table className="w-full text-center">
                      <thead>
                        <tr className="bg-slate-100 sticky top-0 z-10 text-slate-700 border-b border-slate-200">
                          <th className="border-r border-slate-200 p-2.5 font-bold w-48 text-left pl-4 bg-slate-100">객실 상품</th>
                          {dates.map((d, i) => {
                            const { isWeekend, isHoliday, holidayName } = getDayDetails(d);
                            return (
                              <th key={i} className={`border-r border-slate-200 p-2 font-bold bg-slate-100 ${isWeekend || isHoliday ? 'text-amber-700 bg-amber-50/70' : ''}`}>
                                {d}
                                {(isWeekend || isHoliday) && (
                                  <div className="text-[9px] font-semibold text-amber-600 leading-none mt-0.5">
                                    {holidayName ? holidayName : '주말'}
                                  </div>
                                )}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {roomRates.map((room, idx) => (
                          <tr key={idx} className="border-b border-slate-200">
                            <td className="border-r border-slate-200 p-2.5 font-bold text-slate-800 bg-slate-50 text-left pl-4 sticky left-0 z-10">
                              {room.type}
                              <div className="text-[10px] font-normal text-slate-400 mt-0.5">통상가: {(room.basePrice/10000).toFixed(0)}만 (범위: {(room.minPrice/10000).toFixed(0)}만~{(room.maxPrice/10000).toFixed(0)}만)</div>
                            </td>
                            {room.rates.map((rate: any, i: number) => (
                              <td key={i} className={`border-r border-slate-200 p-1.5 transition-colors ${getBgColor(rate?.status)}`}>
                                {rate ? (
                                  <>
                                    <div className="font-bold tracking-tight text-xs">{rate.price}</div>
                                    <div className="text-[9px] opacity-90 mt-0.5">예상 {rate.rate}</div>
                                  </>
                                ) : <div className="animate-pulse h-5 bg-slate-200 rounded w-full"></div>}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* 우측 제어 패널 */}
              <div className="w-80 shrink-0 flex flex-col gap-3 h-full overflow-hidden">
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs shrink-0 border-l-4 border-l-amber-500">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
                    <Award size={14} className="text-amber-600"/> Club GLAD 멤버십 등급
                  </h3>
                  <select 
                    value={memberTier} 
                    onChange={(e) => setMemberTier(e.target.value as any)}
                    className="w-full border border-amber-300 rounded-lg p-2 text-xs text-slate-900 font-bold bg-amber-50/40 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer mb-2"
                  >
                    {Object.entries(tierPolicies).map(([key, policy]) => (
                      <option key={key} value={key} className="bg-white text-slate-900">
                        {policy.name} ({policy.discountRate === 0 ? '정가 적용' : `${policy.discountRate}% 우대 할인`})
                      </option>
                    ))}
                  </select>
                  <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-md border border-slate-200">
                    <span className="font-bold text-slate-800">적용 혜택:</span> {tierPolicies[memberTier].perk}
                  </div>
                </div>

                {/* 💡 [이벤트 시나리오 단일 선택 드롭다운] */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs shrink-0 relative" ref={dropdownRef}>
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5">
                      <Zap size={14} className="text-amber-600"/> [{activePropertyData.name}] 행사 시나리오
                    </span>
                  </h3>
                  
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsScenarioDropdownOpen(!isScenarioDropdownOpen)}
                      className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold bg-slate-50 flex justify-between items-center text-left hover:border-amber-400 transition-all"
                    >
                      <span className="truncate">
                        {currentActiveScenarioObj ? currentActiveScenarioObj.name : '시나리오 선택'}
                      </span>
                      <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isScenarioDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {isScenarioDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-30 max-h-56 overflow-y-auto p-1.5 space-y-1">
                        {Object.values(activePropertyData.scenarios).map(sc => {
                          const isSelected = selectedScenario === sc.id;
                          return (
                            <div
                              key={sc.id}
                              onClick={() => {
                                setSelectedScenario(sc.id);
                                setIsScenarioDropdownOpen(false);
                              }}
                              className={`flex items-center gap-2 p-2 rounded-md cursor-pointer text-xs transition-colors ${
                                isSelected ? 'bg-amber-50 border border-amber-200 text-amber-950 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSelected ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300 bg-white'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                              </div>
                              <span className="leading-tight truncate">{sc.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200">
                    💡 선택한 단일 시나리오와 기간/날씨가 복합 연산됩니다.
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex-1 flex flex-col justify-between relative">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-1.5 text-xs">
                      <Settings size={14} className="text-amber-600"/> 프라이싱 알고리즘 파라미터
                    </h3>
                    <div className="mb-4">
                      <div className="flex justify-between mb-1 text-[11px]">
                        <span className="text-slate-600 font-medium">하한선 방어 (Minimum Drop)</span><span className="font-bold text-slate-900">{minDrop}%</span>
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
                          <button key={level} onClick={() => setSensitivity(level)} className={`flex-1 py-1.5 text-[11px] font-bold rounded-md border transition-all ${sensitivity === level ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-extrabold' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}`}>
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button onClick={() => { setMinDrop(-10); setMaxRise(30); setSensitivity('High'); setSelectedScenario('normal'); setMemberTier('gold'); setWeatherCondition('festival_fine'); }} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">초기화</button>
                    <button onClick={applyAI} className="flex-[2] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold shadow-2xs">
                      <Sparkles size={14} className="text-amber-400" /> AI 최적화 적용
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeMenu === '요금 설정' && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-5 overflow-auto shadow-2xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Sliders size={20} className="text-amber-600" /> [{activePropertyData.name}] 객실가 조정 마스터</h2><p className="text-xs text-slate-400 mt-0.5">통상 요금 및 가드레일 제어</p></div>
                <button onClick={() => { applyAI(); showToast('객실 요금 설정이 다이내믹 히트맵에 실시간 반영되었습니다!'); }} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 text-xs shadow-2xs"><Save size={14} /> 요금 정책 저장 및 반영</button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {roomConfigs.map((room, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
                    <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 flex justify-between items-center">
                      <span>{room.type}</span>
                    </div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">통상가 (Base Rate)</label><input type="number" step="10000" value={room.basePrice} onChange={(e) => { const updated = [...roomConfigs]; updated[idx].basePrice = Number(e.target.value); setRoomConfigs(updated); }} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold bg-white text-slate-900 outline-none focus:border-amber-500" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">평일 최저가 (Floor Price)</label><input type="number" step="10000" value={room.minPrice} onChange={(e) => { const updated = [...roomConfigs]; updated[idx].minPrice = Number(e.target.value); setRoomConfigs(updated); }} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold bg-white text-slate-900 outline-none focus:border-amber-500" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">주말/피크 상한가 (Max Ceiling)</label><input type="number" step="10000" value={room.maxPrice} onChange={(e) => { const updated = [...roomConfigs]; updated[idx].maxPrice = Number(e.target.value); setRoomConfigs(updated); }} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold bg-white text-slate-900 outline-none focus:border-amber-500" /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMenu === '예약 현황' && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><CalendarDays size={20} className="text-amber-600" /> [{activePropertyData.name}] 객실 예약 현황</h2><p className="text-xs text-slate-400 mt-0.5">OTA 및 직영 채널 판매 현황 및 법인/VIP 블록 물량 관리</p></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><div className="text-xs text-amber-900 font-medium mb-1">총 객실 수 / 가용 객실</div><div className="text-2xl font-black text-slate-900">{activePropertyData.totalRooms} <span className="text-xs font-normal text-slate-500">({metrics.occBreakdown.available} 일반판매)</span></div></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500 font-medium mb-1">선택 기간 평균 예약 가동률</div><div className="text-2xl font-black text-emerald-600">{metrics.periodAvgOcc || metrics.baseOcc}%</div></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500 font-medium mb-1">법인 계약 및 VIP 블록</div><div className="text-2xl font-black text-amber-600">{metrics.occBreakdown.corpBlock} + {metrics.occBreakdown.memberHold}</div></div>
              </div>
            </div>
          )}

          {activeMenu === '시장 분석' && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><LineChart size={20} className="text-amber-600" /> [{activePropertyData.name}] 시장 분석</h2><p className="text-xs text-slate-400 mt-0.5">경쟁사 및 주변 행사 연동 트래픽 분석</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm mb-2">지점별 대형 행사 시나리오 연동</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      국정감사·금융 IR(여의도), 마포나루 새우젓 축제(마포), KES 한국전자전·서울카페쇼(코엑스) 등 주요 대형 MICE 및 축제 일정이 RMS 가격 모델에 실시간 반영되어 있습니다.
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm mb-2">기상 & 공항 입국 트래픽 연동</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      현재 기상 변수 [{weatherPolicies[weatherCondition].name}] 및 공항 트래픽 계수({airportData.multiplier})가 연동되어 다이내믹 가격을 산출합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMenu === 'AI 최적화 룰' && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Sparkles size={20} className="text-amber-600" /> AI 프라이싱 자율 구동 최적화 룰</h2><p className="text-xs text-slate-400 mt-0.5">글래드 프라이싱 엔진의 자동 가격 방어 및 서지 알고리즘 제어</p></div>
              <div className="space-y-3">
                {[
                  { key: 'autoPriceSync', title: 'OTA 및 채널 실시간 요금 동기화 봇', desc: `${activePropertyData.name} 권역 실측 가격 변동 시 자사 요금 실시간 자동 보정` },
                  { key: 'corpBlockProtection', title: '법인 계약 및 VIP 홀딩 블록 보호 가드레일', desc: '대형 행사 시즌 일반 객실 요금을 자동 상향하여 객실 수익성 사수' },
                  { key: 'competitorUnderCutGuard', title: '출혈 경쟁 방지 하한선 자동 방어선', desc: '경쟁사의 무리한 할인전에도 설정된 Floor Price 이하로 하락 방지' },
                  { key: 'weekendSurgeBoost', title: '주말 및 기상 호조 요금 서지(Surge) 부스팅', desc: '수요 집중 및 날씨 쾌청 시 AI가 가중치를 곱해 단가 극대화' }
                ].map((rule) => {
                  const isOn = aiRules[rule.key as keyof typeof aiRules];
                  return (
                    <div key={rule.key} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
                      <div><div className="font-bold text-slate-900 text-xs">{rule.title}</div><div className="text-[11px] text-slate-500 mt-0.5">{rule.desc}</div></div>
                      <button onClick={() => { setAiRules({ ...aiRules, [rule.key]: !isOn }); showToast(`[${rule.title}] 룰이 ${!isOn ? '활성화' : '비활성화'} 되었습니다.`); }} className={`text-xs font-bold px-3.5 py-1.5 rounded-lg border transition-all ${isOn ? 'bg-amber-600 text-white border-amber-600 shadow-2xs font-bold' : 'bg-white text-slate-500 border-slate-300'}`}>{isOn ? '활성화 (ON)' : '비활성화 (OFF)'}</button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeMenu === '시스템 설정' && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-5 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><ShieldAlert size={20} className="text-amber-600" /> Club GLAD 멤버십 시스템 연동 & 고객 등급 관리</h2>
                <p className="text-xs text-slate-400 mt-0.5">글래드 리워즈 원장과 연동하여 다이내믹 프라이싱에 반영될 등급별 할인 파라미터 관리</p>
              </div>
              
              <div className="grid grid-cols-2 gap-5">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-3">
                  <div className="font-bold text-slate-900 text-sm flex items-center gap-2"><Users size={16} className="text-amber-600"/> Club GLAD 등급별 실시간 가격 연동 정책</div>
                  <div className="space-y-2 mt-1">
                    {Object.entries(tierPolicies).map(([key, policy]) => (
                      <div key={key} className="bg-white border border-slate-200 p-3 rounded-lg flex justify-between items-center text-xs">
                        <div>
                          <div className="font-bold text-slate-900">{policy.name}</div>
                          <div className="text-[10px] text-slate-500">{policy.perk}</div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">
                            {policy.discountRate === 0 ? '정가 (0%)' : `${policy.discountRate}% 할인`}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                    <div className="font-bold text-slate-900 text-sm mb-3">글래드 통합 PMS & Channel API 연동 상태</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center bg-white p-3 rounded border border-slate-200">
                        <span className="text-slate-700">오라클 오페라 PMS / Channel API</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 정상 연동중</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="font-bold text-slate-900 text-sm mb-2">리워즈 정책 데이터 강제 동기화</div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">멤버십 서버 및 채널 파이프라인에서 최신 등급별 할인 규칙을 동기화합니다.</p>
                    </div>
                    <button onClick={() => showToast('Club GLAD 멤버십 리워즈 정책이 최신 원장과 동기화되었습니다.')} className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-bold text-xs shadow-2xs flex items-center justify-center gap-2">
                      <RefreshCcw size={14} /> Club GLAD 정책 강제 동기화
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}