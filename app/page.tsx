"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, Settings, CalendarDays, LineChart, Cpu, ChevronDown, 
  Loader2, PlaneTakeoff, Building2, ShieldAlert, Sliders, Sparkles, X, 
  ExternalLink, Save, CheckCircle2, DollarSign, PieChart, RefreshCcw, 
  Award, Users, CloudSun, Sun, CloudRain, Zap, MapPin 
} from 'lucide-react';

export default function GladPricingDashboard() {
  // 1. 프로퍼티(지점) 선택 상태 (여의도 / 마포 / 강남 코엑스센터)
  const [selectedProperty, setSelectedProperty] = useState<'yeouido' | 'mapo' | 'coex'>('yeouido');

  // 2. 기본 상태 관리
  const [activeMenu, setActiveMenu] = useState('대시보드');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('방금 전');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 캘린더 모달 상태 및 동적 날짜 배열
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-14');
  const [dateRangeLabel, setDateRangeLabel] = useState('2026.10.01 ~ 10.14 (가을 시즌/이벤트 관제)');
  const [dates, setDates] = useState(['10.01', '10.02', '10.03', '10.04', '10.05', '10.06', '10.07', '10.08', '10.09', '10.10', '10.11', '10.12', '10.13', '10.14']);

  // 날씨 및 외부 기상 환경 변수 상태
  const [weatherCondition, setWeatherCondition] = useState<'sunny' | 'festival_fine' | 'rain' | 'cold'>('festival_fine');
  const weatherPolicies = {
    sunny: { name: '☀️ 맑음/쾌청', factor: 1.03, desc: '야외 활동 증가로 레저 demand +3%' },
    festival_fine: { name: '🍂 가을 야외축제 적기', factor: 1.08, desc: '한강/윤중로/도심 행사 피크 demand +8%' },
    rain: { name: '🌧️ 우천/강풍', factor: 0.92, desc: '야외 행사 취소 및 유입 감소 -8%' },
    cold: { name: '❄️ 한파/악천후', factor: 0.95, desc: '도심 이동량 감소 demand -5%' }
  };

  // 공항 실시간 연동 데이터 상태
  const [airportData, setAirportData] = useState({
    pax: '102,450명/일',
    flights: '610편착륙',
    multiplier: 1.0
  });

  // GLAD 멤버십 (Club GLAD) 회원 등급 상태 (Default: Gold 회원)
  const [memberTier, setMemberTier] = useState<'regular' | 'silver' | 'gold' | 'platinum' | 'black'>('gold');

  // 고객 등급별 할인/혜택 정책 정의
  const [tierPolicies, setTierPolicies] = useState({
    regular: { name: '일반 고객 (Non-Member)', discountRate: 0, rewardMultiplier: 1.0, perk: '기본 포인트 1% 적립' },
    silver: { name: 'GLAD 실버 (Silver)', discountRate: -3, rewardMultiplier: 1.5, perk: '객실 요금 3% 우대 할인' },
    gold: { name: 'GLAD 골드 (Gold)', discountRate: -7, rewardMultiplier: 2.0, perk: '객실 요금 7% 우대 + 레이트 체크아웃' },
    platinum: { name: 'GLAD 플래티넘 (Platinum)', discountRate: -12, rewardMultiplier: 3.0, perk: '객실 요금 12% 우대 + 무료 조식 1인' },
    black: { name: 'GLAD VIP 블랙 (Black Prestige)', discountRate: -18, rewardMultiplier: 5.0, perk: '글래드 스위트 업그레이드 + 18% 할인' }
  });

  // 지표별 상세 모달 상태
  const [isRevenueModalOpen, setIsRevenueModalOpen] = useState(false);
  const [isOccModalOpen, setIsOccModalOpen] = useState(false);
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [isCompetitorModalOpen, setIsCompetitorModalOpen] = useState(false);

  // 3개 Property별 프로필, 객실 기준가, 특화 시나리오, Comp-Set 데이터 구조
  const propertyProfiles = {
    yeouido: {
      name: '글래드 여의도',
      subText: 'Yeouido Financial District & Riverview',
      totalRooms: '319실',
      roomConfigs: [
        { type: 'Standard Room', basePrice: 180000, minPrice: 140000, maxPrice: 320000 },
        { type: 'Deluxe Room', basePrice: 240000, minPrice: 180000, maxPrice: 420000 },
        { type: 'Corner Deluxe', basePrice: 290000, minPrice: 220000, maxPrice: 520000 },
        { type: 'Glad Suite', basePrice: 480000, minPrice: 380000, maxPrice: 880000 }
      ],
      scenarios: {
        normal: {
          id: 'normal', name: '여의도 금융가 평시 비즈니스 (Standard Week)', baseOcc: 76, compPrice: 240000,
          flightIndex: '안정적 (여의도/금융가 출장 & 도심 비즈니스 중심)',
          competitors: [
            { name: '콘래드 서울 (Conrad)', avgPrice: '390,000원', occ: '76%', position: '여의도 IFC' },
            { name: '페어몬트 앰배서더 서울', avgPrice: '420,000원', occ: '74%', position: '여의도 파크원' },
            { name: '호텔 나루 서울 매갤러리', avgPrice: '310,000원', occ: '78%', position: '마포 한강변' },
            { name: '켄싱턴호텔 여의도', avgPrice: '170,000원', occ: '80%', position: '여의도 순복음 상권' }
          ],
          revenueBreakdown: { room: '32,500,000원', fnbDining: '14,200,000원', banquetMice: '8,300,000원' },
          occBreakdown: { totalRooms: '319실', corpBlock: '50실 (금융법인)', memberHold: '30실 (VIP)', available: '239실', sold: '182실' },
          baseRevenue: 55000000
        },
        fireworks: {
          id: 'fireworks', name: '🎆 서울세계불꽃축제 & 한강 피크 (Fireworks Peak)', baseOcc: 98, compPrice: 480000,
          flightIndex: '매우 높음 (한강 조망 및 한화 불꽃축제 관람 특수)',
          competitors: [
            { name: '콘래드 서울 (Conrad)', avgPrice: '680,000원', occ: '99%', position: '여의도 IFC' },
            { name: '페어몬트 앰배서더 서울', avgPrice: '750,000원', occ: '98%', position: '여의도 파크원' },
            { name: '호텔 나루 서울 매갤러리', avgPrice: '590,000원', occ: '97%', position: '마포 한강변' },
            { name: '켄싱턴호텔 여의도', avgPrice: '320,000원', occ: '95%', position: '여의도 순복음 상권' }
          ],
          revenueBreakdown: { room: '78,000,000원', fnbDining: '25,000,000원', banquetMice: '15,000,000원' },
          occBreakdown: { totalRooms: '319실', corpBlock: '30실 (법인계약)', memberHold: '20실 (VIP)', available: '269실', sold: '264실' },
          baseRevenue: 118000000
        },
        spring_flower: {
          id: 'spring_flower', name: '🌸 여의도 봄꽃축제 & 윤중로 호캉스 (Spring Blossom)', baseOcc: 92, compPrice: 320000,
          flightIndex: '높음 (윤중로 벚꽃길 관광객 & 주말 호캉스 유입)',
          competitors: [
            { name: '콘래드 서울 (Conrad)', avgPrice: '480,000원', occ: '93%', position: '여의도 IFC' },
            { name: '페어몬트 앰배서더 서울', avgPrice: '520,000원', occ: '91%', position: '여의도 파크원' },
            { name: '호텔 나루 서울 매갤러리', avgPrice: '410,000원', occ: '90%', position: '마포 한강변' },
            { name: '켄싱턴호텔 여의도', avgPrice: '240,000원', occ: '88%', position: '여의도 순복음 상권' }
          ],
          revenueBreakdown: { room: '54,000,000원', fnbDining: '18,500,000원', banquetMice: '9,500,000원' },
          occBreakdown: { totalRooms: '319실', corpBlock: '40실 (법인계약)', memberHold: '30실 (VIP)', available: '249실', sold: '229실' },
          baseRevenue: 82000000
        }
      }
    },
    mapo: {
      name: '글래드 마포',
      subText: 'Gongdeok Station Hub & Business Transit',
      totalRooms: '378실',
      roomConfigs: [
        { type: 'Standard Room', basePrice: 160000, minPrice: 120000, maxPrice: 290000 },
        { type: 'Deluxe Twin/Double', basePrice: 210000, minPrice: 160000, maxPrice: 380000 },
        { type: 'Glad House', basePrice: 270000, minPrice: 200000, maxPrice: 480000 },
        { type: 'Glad Suite', basePrice: 420000, minPrice: 320000, maxPrice: 750000 }
      ],
      scenarios: {
        normal: {
          id: 'normal', name: '공덕/마포 비즈니스 평시 (Gongdeok Biz Base)', baseOcc: 78, compPrice: 210000,
          flightIndex: '안정적 (공항철도 연결 직장인 & 환승 비즈니스)',
          competitors: [
            { name: '호텔 나루 서울 매갤러리', avgPrice: '310,000원', occ: '77%', position: '마포대교 남단' },
            { name: '롯데시티호텔 마포', avgPrice: '200,000원', occ: '83%', position: '공덕역 직결' },
            { name: '신라스테이 마포', avgPrice: '180,000원', occ: '81%', position: '공덕 비즈니스' },
            { name: 'ROYNET Hotel Seoul Mapo', avgPrice: '195,000원', occ: '80%', position: '마포대로' }
          ],
          revenueBreakdown: { room: '38,000,000원', fnbDining: '12,000,000원', banquetMice: '6,000,000원' },
          occBreakdown: { totalRooms: '378실', corpBlock: '65실 (IT/마케팅법인)', memberHold: '35실 (VIP)', available: '278실', sold: '217실' },
          baseRevenue: 56000000
        },
        food_fest: {
          id: 'food_fest', name: '🍷 마포 음식문화축제 & 경의선 숲길 호캉스', baseOcc: 94, compPrice: 290000,
          flightIndex: '높음 (경의선 숲길 도보 관광 & 맛집 투어 호캉스)',
          competitors: [
            { name: '호텔 나루 서울 매갤러리', avgPrice: '450,000원', occ: '95%', position: '마포대교 남단' },
            { name: '롯데시티호텔 마포', avgPrice: '270,000원', occ: '92%', position: '공덕역 직결' },
            { name: '신라스테이 마포', avgPrice: '250,000원', occ: '90%', position: '공덕 비즈니스' },
            { name: 'ROYNET Hotel Seoul Mapo', avgPrice: '260,000원', occ: '89%', position: '마포대로' }
          ],
          revenueBreakdown: { room: '58,000,000원', fnbDining: '21,000,000원', banquetMice: '8,000,000원' },
          occBreakdown: { totalRooms: '378실', corpBlock: '40실 (법인계약)', memberHold: '30실 (VIP)', available: '308실', sold: '290실' },
          baseRevenue: 87000000
        },
        hongdae_transit: {
          id: 'hongdae_transit', name: '✈️ 공항철도 인바운드 & 홍대 상권 연계 시즌', baseOcc: 89, compPrice: 260000,
          flightIndex: '매우 높음 (인천/김포 공항철도 이용 외국인 FIT 집중)',
          competitors: [
            { name: '호텔 나루 서울 매갤러리', avgPrice: '380,000원', occ: '88%', position: '마포대교 남단' },
            { name: '롯데시티호텔 마포', avgPrice: '240,000원', occ: '91%', position: '공덕역 직결' },
            { name: '신라스테이 마포', avgPrice: '220,000원', occ: '89%', position: '공덕 비즈니스' },
            { name: 'L7 홍대', avgPrice: '270,000원', occ: '93%', position: '홍대입구역' }
          ],
          revenueBreakdown: { room: '51,000,000원', fnbDining: '15,000,000원', banquetMice: '7,000,000원' },
          occBreakdown: { totalRooms: '378실', corpBlock: '50실 (법인계약)', memberHold: '25실 (VIP)', available: '303실', sold: '270실' },
          baseRevenue: 73000000
        }
      }
    },
    coex: {
      name: '글래드 강남 코엑스센터',
      subText: 'Teheran-ro Tech & COEX MICE Hub',
      totalRooms: '282실',
      roomConfigs: [
        { type: 'Standard Double', basePrice: 190000, minPrice: 150000, maxPrice: 350000 },
        { type: 'Superior Twin', basePrice: 250000, minPrice: 190000, maxPrice: 450000 },
        { type: 'Glad Smart Room', basePrice: 310000, minPrice: 240000, maxPrice: 580000 },
        { type: 'Coex Suite', basePrice: 520000, minPrice: 400000, maxPrice: 950000 }
      ],
      scenarios: {
        normal: {
          id: 'normal', name: '테헤란로 IT/금융 비즈니스 평시 (Tech Biz Base)', baseOcc: 81, compPrice: 270000,
          flightIndex: '안정적 (삼성역/테헤란로 IT 바이어 & 해외 출장자)',
          competitors: [
            { name: '그랜드 인터컨티넨탈 파르나스', avgPrice: '460,000원', occ: '82%', position: '삼성역 직결' },
            { name: '파크 하얏트 서울', avgPrice: '620,000원', occ: '79%', position: '삼성역 교차로' },
            { name: '신라스테이 삼성', avgPrice: '240,000원', occ: '85%', position: '삼성역 맞은편' },
            { name: '오크우드 프리미어 코엑스', avgPrice: '410,000원', occ: '80%', position: '코엑스 단지' }
          ],
          revenueBreakdown: { room: '41,000,000원', fnbDining: '11,000,000원', banquetMice: '9,000,000원' },
          occBreakdown: { totalRooms: '282실', corpBlock: '70실 (테헤란로 IT)', memberHold: '25실 (VIP)', available: '187실', sold: '151실' },
          baseRevenue: 61000000
        },
        mice_peak: {
          id: 'mice_peak', name: '🏢 코엑스 대규모 MICE & 국제컨벤션 피크', baseOcc: 97, compPrice: 410000,
          flightIndex: '매우 높음 (글로벌 바이어, 학회 참석자 & IT 엑스포 집중)',
          competitors: [
            { name: '그랜드 인터컨티넨탈 파르나스', avgPrice: '690,000원', occ: '98%', position: '삼성역 직결' },
            { name: '파크 하얏트 서울', avgPrice: '850,000원', occ: '96%', position: '삼성역 교차로' },
            { name: '신라스테이 삼성', avgPrice: '380,000원', occ: '97%', position: '삼성역 맞은편' },
            { name: '오크우드 프리미어 코엑스', avgPrice: '580,000원', occ: '95%', position: '코엑스 단지' }
          ],
          revenueBreakdown: { room: '74,000,000원', fnbDining: '19,000,000원', banquetMice: '22,000,000원' },
          occBreakdown: { totalRooms: '282실', corpBlock: '90실 (MICE 바이어)', memberHold: '20실 (VIP)', available: '172실', sold: '167실' },
          baseRevenue: 115000000
        },
        kpop_concert: {
          id: 'kpop_concert', name: '🎤 영동대로 K-POP 페스티벌 & 대형 공연 시즌', baseOcc: 95, compPrice: 360000,
          flightIndex: '높음 (글로벌 한류 팬덤 & 주말 강남 도심 호캉스 유입)',
          competitors: [
            { name: '그랜드 인터컨티넨탈 파르나스', avgPrice: '580,000원', occ: '96%', position: '삼성역 직결' },
            { name: '파크 하얏트 서울', avgPrice: '720,000원', occ: '94%', position: '삼성역 교차로' },
            { name: '신라스테이 삼성', avgPrice: '330,000원', occ: '95%', position: '삼성역 맞은편' },
            { name: '오크우드 프리미어 코엑스', avgPrice: '490,000원', occ: '92%', position: '코엑스 단지' }
          ],
          revenueBreakdown: { room: '63,000,000원', fnbDining: '16,000,000원', banquetMice: '11,000,000원' },
          occBreakdown: { totalRooms: '282실', corpBlock: '40실 (법인계약)', memberHold: '30실 (VIP)', available: '212실', sold: '201실' },
          baseRevenue: 90000000
        }
      }
    }
  };

  const activePropertyData = propertyProfiles[selectedProperty];

  const [currentScenario, setCurrentScenario] = useState('normal');
  const [roomConfigs, setRoomConfigs] = useState(activePropertyData.roomConfigs);

  // 다이내믹 프라이싱 설정 및 민감도 상태
  const [minDrop, setMinDrop] = useState(-10);
  const [maxRise, setMaxRise] = useState(30);
  const [sensitivity, setSensitivity] = useState<'Low' | 'Mid' | 'High'>('High');

  // AI 룰 설정 상태
  const [aiRules, setAiRules] = useState({
    autoPriceSync: true, corpBlockProtection: true, competitorUnderCutGuard: true, weekendSurgeBoost: true
  });

  const [metrics, setMetrics] = useState(activePropertyData.scenarios['normal']);
  const [roomRates, setRoomRates] = useState<any[]>([]);

  // 선택된 프로퍼티 변경 시 객실 및 시나리오 갱신
  useEffect(() => {
    const defaultScen = 'normal';
    setCurrentScenario(defaultScen);
    setRoomConfigs(activePropertyData.roomConfigs);
    setMetrics(activePropertyData.scenarios[defaultScen as keyof typeof activePropertyData.scenarios]);
  }, [selectedProperty]);

  // 특정 날짜가 주말(금, 토)인지 판별하는 함수
  const checkWeekend = (dateStr: string) => {
    const year = startDate.split('-')[0] || new Date().getFullYear().toString();
    const [m, d] = dateStr.split('.');
    const dayOfWeek = new Date(`${year}-${m}-${d}`).getDay();
    return dayOfWeek === 5 || dayOfWeek === 6;
  };

  // 💡 밝은 라이트 테마 맞춤형 요금 수준별 히트맵 셀 색상 (선명하고 고급스러운 톤)
  const getBgColor = (status: string) => {
    switch(status) {
      case 'dark-red': return 'bg-rose-600 text-white font-bold border border-rose-700 shadow-sm';
      case 'high': return 'bg-amber-500 text-slate-950 font-bold border border-amber-600 shadow-sm';
      case 'lower': return 'bg-emerald-600 text-white font-bold border border-emerald-700 shadow-sm';
      default: return 'bg-white text-slate-800 border border-slate-200 hover:bg-slate-50';
    }
  };

  // 공항 API 연동 비동기 호출 (가상 API)
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

  // AI 최적화 연산 엔진
  const applyAI = useCallback(() => {
    setIsAnalyzing(true);
    setTimeout(() => {
      const currentScenariosObj = activePropertyData.scenarios;
      const scenarioData = currentScenariosObj[currentScenario as keyof typeof currentScenariosObj] || currentScenariosObj['normal'];
      
      let sensitivityMultiplier = sensitivity === 'High' ? 1.25 : sensitivity === 'Low' ? 0.75 : 1.0;
      const weatherMultiplier = weatherPolicies[weatherCondition].factor;
      const currentTierDiscount = tierPolicies[memberTier].discountRate;

      // 전사 매출 보정 연산
      const adjustedRevenue = scenarioData.baseRevenue * airportData.multiplier * weatherMultiplier * (1 + (maxRise * 0.004 * sensitivityMultiplier));
      setMetrics({ ...scenarioData, baseRevenue: adjustedRevenue });

      const updatedRates = roomConfigs.map(room => {
        const newRates = dates.map(dateStr => {
          const isWeekend = checkWeekend(dateStr); 
          
          let demandFactor = (scenarioData.baseOcc / 100) * weatherMultiplier + (isWeekend ? 0.15 : 0) + ((airportData.multiplier - 1.0) * 0.25);
          
          let priceMultiplier = 1;
          if (demandFactor > 0.85) {
            priceMultiplier = 1 + (maxRise / 100) * (demandFactor - 0.75) * sensitivityMultiplier;
          } else if (demandFactor < 0.65) {
            priceMultiplier = 1 + (minDrop / 100);
          }

          let rawPrice = room.basePrice * priceMultiplier * (1 + currentTierDiscount / 100);
          let finalPrice = Math.round(rawPrice / 10000) * 10000;
          
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
      setLastUpdated(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`);
      setIsAnalyzing(false);
    }, 300);
  }, [selectedProperty, currentScenario, roomConfigs, sensitivity, weatherCondition, dates, airportData.multiplier, maxRise, minDrop, memberTier, tierPolicies]);

  useEffect(() => { 
    if (dates.length > 0) {
      fetchAirportTraffic(dates[0]).then(() => {
        applyAI();
      });
    }
  }, [selectedProperty, dates, currentScenario, sensitivity, weatherCondition, memberTier, fetchAirportTraffic, applyAI]);

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
    setDateRangeLabel(`${startDate} ~ ${endDate} (선택 관제 기간)`);
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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans text-xs select-none relative">
      
      {/* 알림 토스트 */}
      {toastMessage && (
        <div className="absolute top-16 right-6 bg-slate-900 text-amber-400 px-4 py-2.5 rounded-lg shadow-2xl z-50 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 size={16} className="text-amber-400" />
          <span className="font-medium text-xs text-white">{toastMessage}</span>
        </div>
      )}

      {/* 1. 매출 상세 모달 */}
      {isRevenueModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] p-6 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><DollarSign size={18} className="text-amber-600"/> [{activePropertyData.name}] 전사 예상 매출 브레이크다운</h3>
              <button onClick={() => setIsRevenueModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-amber-950 flex justify-between items-center">
                <div><div className="font-bold text-slate-900">총 예상 매출</div><div className="text-[10px] text-slate-500">날씨({weatherPolicies[weatherCondition].name}) & 멤버십({tierPolicies[memberTier].name}) 반영</div></div>
                <div className="text-lg font-black text-amber-600">{Math.round(metrics.baseRevenue).toLocaleString()}원</div>
              </div>
              <div className="font-bold text-slate-700 mt-2">부문별 매출 기여도</div>
              <div className="space-y-2">
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center"><span className="text-slate-600">객실 숙박 매출 (Room Revenue)</span><span className="font-bold text-slate-900">{metrics.revenueBreakdown.room}</span></div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center"><span className="text-slate-600">다이닝 및 F&B (Greets / Bar)</span><span className="font-bold text-slate-900">{metrics.revenueBreakdown.fnbDining}</span></div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center"><span className="text-slate-600">연회 및 MICE (Banquet & Event)</span><span className="font-bold text-slate-900">{metrics.revenueBreakdown.banquetMice}</span></div>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsRevenueModalOpen(false)} className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold text-xs hover:bg-slate-800">확인 완료</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. 점유율 모달 */}
      {isOccModalOpen && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] p-6 flex flex-col gap-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><PieChart size={18} className="text-amber-600"/> 실질 점유율 & 객실 블록 관리 현황</h3>
              <button onClick={() => setIsOccModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex justify-between items-center">
                <div><div className="font-bold text-slate-900">실질 가동률 (Effective OCC)</div><div className="text-[10px] text-slate-500">법인 및 VIP 홀딩 제외 일반 판매 기준</div></div>
                <div className="text-lg font-black text-amber-600">{metrics.baseOcc}%</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white border border-slate-200 p-3 rounded-lg"><div className="text-slate-500 mb-1">총 객실 수</div><div className="text-sm font-bold text-slate-800">{metrics.occBreakdown.totalRooms}</div></div>
                <div className="bg-white border border-slate-200 p-3 rounded-lg"><div className="text-slate-500 mb-1">법인 계약 블록</div><div className="text-sm font-bold text-amber-600">{metrics.occBreakdown.corpBlock}</div></div>
                <div className="bg-white border border-slate-200 p-3 rounded-lg"><div className="text-slate-500 mb-1">멤버십 VIP 홀딩</div><div className="text-sm font-bold text-sky-600">{metrics.occBreakdown.memberHold}</div></div>
                <div className="bg-white border border-slate-200 p-3 rounded-lg"><div className="text-slate-500 mb-1">일반 가용 객실</div><div className="text-sm font-bold text-emerald-600">{metrics.occBreakdown.available} 중 {metrics.occBreakdown.sold} 판매</div></div>
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

      {/* 4. 공항 실시간 연동 모달 */}
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
                <div>글로벌 출장자 및 외국인 관광객 유입량이 [{activePropertyData.name}] 요금 추천 모델에 즉시 반영됩니다.</div>
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
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-sm"><Building2 size={18} className="text-amber-600"/> [{activePropertyData.name}] 권역 Comp-Set 상세 분석</h3>
              <button onClick={() => setIsCompetitorModalOpen(false)} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 flex justify-between items-center">
                <div><div className="font-bold text-slate-900">당사 권장 요금 ({tierPolicies[memberTier].name})</div></div>
                <div className="text-base font-black text-amber-600">{metrics.compPrice.toLocaleString()}원 대</div>
              </div>
              <div className="font-bold text-slate-700 mt-2">인근 핵심 경쟁호텔 현황</div>
              <div className="space-y-2">
                {metrics.competitors.map((comp, idx) => (
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

      {/* 좌측 사이드바 - GLAD HOTEL 공식 브랜드 네이비 톤 고정 (대시보드와 대비감을 주는 프리미엄 네이비 헤리티지) */}
      <aside className="w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col shrink-0 shadow-lg">
        
        {/* GLAD HOTELS & RESORTS 브랜드 로고 영역 */}
        <div className="p-5 border-b border-slate-800 flex flex-col items-center justify-center text-center gap-1 bg-slate-950">
          <div className="tracking-[0.22em] font-black text-white text-2xl font-sans uppercase">
            GLAD
          </div>
          <div className="h-[1px] w-28 bg-slate-700 my-0.5"></div>
          <div className="text-[8.5px] tracking-[0.28em] font-semibold text-slate-400 uppercase">
            HOTELS & RESORTS
          </div>
          <div className="mt-2 bg-amber-500/15 border border-amber-400/30 text-amber-400 px-2.5 py-0.5 rounded-full text-[9px] font-bold">
            Dynamic Pricing RMS
          </div>
        </div>

        {/* 3개 Property 선택 셀렉터 */}
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
                  <span className="text-[9px] text-slate-400 font-normal truncate mt-0.5">{item.subText}</span>
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
          <div className="font-bold text-amber-400 mb-0.5">Club GLAD 허브</div>
          <div className="text-[10px] text-slate-400">멤버십 등급 할인 실시간 파이프라인 작동 중</div>
        </div>
      </aside>

      {/* 우측 메인 콘텐츠 영역 (밝고 선명한 라이트 테마 적용) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-slate-100">
        
        {/* 상단 헤더 (화이트 라이트 테마) */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-2">
              <span className="bg-slate-900 text-amber-400 font-black px-2.5 py-0.5 rounded text-[11px]">{activePropertyData.name}</span>
              <span className="text-slate-700 font-medium">다이내믹 프라이싱 & 멤버십 관제</span>
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-amber-600 font-bold text-xs">{activeMenu}</span>
            {isAnalyzing && <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1"><Loader2 size={10} className="animate-spin" /> 연산 중...</span>}
          </div>

          <div className="flex items-center gap-3">
            {/* 날씨 변수 Quick Selector */}
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

            {/* 날짜 선택 버블 */}
            <div onClick={() => setIsCalendarOpen(true)} className="flex items-center gap-2 bg-slate-50 px-3 py-1 rounded-md text-slate-700 border border-slate-200 cursor-pointer hover:bg-amber-50/50 hover:border-amber-300 transition-all text-xs shadow-2xs">
              <CalendarDays size={14} className="text-amber-600" />
              <span className="font-semibold">{dateRangeLabel}</span>
              <ChevronDown size={14} className="text-slate-400" />
            </div>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-7 h-7 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-[11px] border border-amber-400/40">RM</div>
              <div className="text-[11px] leading-tight"><div className="font-bold text-slate-800">GLAD RMS Center</div><div className="text-emerald-600 text-[9px] flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> 실시간 연결</div></div>
            </div>
          </div>
        </header>

        {/* 본문 레이아웃 */}
        <div className="flex-1 p-4 flex gap-4 overflow-hidden bg-slate-100">
          
          {/* [메뉴 1] 대시보드 화면 */}
          {activeMenu === '대시보드' && (
            <>
              <div className="flex-1 flex flex-col gap-3 h-full overflow-hidden">
                
                {/* 4대 핵심 KPI 카드 (화이트 앤 실버 스타일) */}
                <div className="grid grid-cols-4 gap-3 shrink-0">
                   <div onClick={() => setIsRevenueModalOpen(true)} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><DollarSign size={13} className="text-emerald-600"/> [{activePropertyData.name}] 예상 매출</span><ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" /></div>
                      <div className="text-lg font-black text-amber-600 tracking-tight mt-1">{Math.round(metrics.baseRevenue).toLocaleString()}원</div>
                   </div>
                   <div onClick={() => setIsOccModalOpen(true)} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><PieChart size={13} className="text-sky-600"/> 실질 가동률 (OCC)</span><ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" /></div>
                      <div className="text-lg font-bold text-slate-900 mt-1">{metrics.baseOcc}%</div>
                   </div>
                   <div onClick={() => setIsCompetitorModalOpen(true)} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><Building2 size={13} className="text-purple-600"/> 권역 Comp-Set 평균 요금</span><ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" /></div>
                      <div className="text-lg font-bold text-slate-900 mt-1">{metrics.compPrice.toLocaleString()}원</div>
                   </div>
                   <div onClick={() => setIsFlightModalOpen(true)} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs cursor-pointer hover:border-amber-500 hover:shadow-md transition-all group">
                      <div className="text-[11px] text-slate-500 mb-0.5 font-medium flex items-center justify-between"><span className="flex items-center gap-1"><PlaneTakeoff size={13} className="text-amber-600"/> 공항 실시간 입국 트래픽</span><ExternalLink size={12} className="text-slate-400 group-hover:text-amber-600" /></div>
                      <div className="text-xs font-bold text-slate-900 mt-1 truncate">{airportData.pax} (계수 x{airportData.multiplier})</div>
                   </div>
                </div>

                {/* 중앙 히트맵 테이블 영역 (화이트 앤 깨끗한 스톤 라이트) */}
                <div className="flex-1 bg-white rounded-xl border border-slate-200 p-4 flex flex-col overflow-hidden shadow-2xs">
                  <div className="flex justify-between items-center mb-3 shrink-0">
                    <div>
                      <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                        <span>[{activePropertyData.name}] 객실 타입별 실시간 다이내믹 요금 히트맵</span>
                        <span className="text-[10px] text-amber-700 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          {tierPolicies[memberTier].name} 할인율({tierPolicies[memberTier].discountRate}%) 연동 중
                        </span>
                      </h2>
                    </div>
                  </div>

                  {/* 히트맵 상태 가이드 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 mb-3 text-[10px] text-slate-600 grid grid-cols-4 gap-2 shrink-0 shadow-inner">
                    <div className="flex flex-col gap-0.5 border-r border-slate-200 pr-2">
                      <span className="font-bold text-rose-700 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-rose-600 rounded-full"></div> 만실임박 (Dark Red)</span>
                      <span>수요 105% 초과. 최고 할증가(Max Cap) 적용.</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-r border-slate-200 pr-2 pl-1">
                      <span className="font-bold text-amber-800 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div> 수요높음 (High)</span>
                      <span>수요 88% 이상. 이벤트/기상 호조로 요금 인상.</span>
                    </div>
                    <div className="flex flex-col gap-0.5 border-r border-slate-200 pr-2 pl-1">
                      <span className="font-bold text-slate-700 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-white border border-slate-300 rounded-full"></div> 표준 방어 (Standard)</span>
                      <span>수요 65~88% 평시 안정 구간.</span>
                    </div>
                    <div className="flex flex-col gap-0.5 pl-1">
                      <span className="font-bold text-emerald-700 flex items-center gap-1"><div className="w-2.5 h-2.5 bg-emerald-600 rounded-full"></div> 할인필요 (Lower)</span>
                      <span>수요 65% 미만. 최저 하한선까지 요금 완화.</span>
                    </div>
                  </div>

                  {/* 히트맵 데이터 매트릭스 */}
                  <div className="flex-1 overflow-auto border border-slate-200 rounded-lg relative bg-white">
                    <table className="w-full text-center">
                      <thead>
                        <tr className="bg-slate-100 sticky top-0 z-10 text-slate-700 border-b border-slate-200">
                          <th className="border-r border-slate-200 p-2.5 font-bold w-40 text-left pl-4 bg-slate-100">객실 타입</th>
                          {dates.map((d, i) => (
                            <th key={i} className={`border-r border-slate-200 p-2 font-bold bg-slate-100 ${checkWeekend(d) ? 'text-amber-700 bg-amber-50/60' : ''}`}>
                              {d}
                              {checkWeekend(d) && <div className="text-[9px] font-normal text-amber-600 leading-none mt-0.5">주말</div>}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {roomRates.map((room, idx) => (
                          <tr key={idx} className="border-b border-slate-200">
                            <td className="border-r border-slate-200 p-2.5 font-bold text-slate-800 bg-slate-50 text-left pl-4 sticky left-0 z-10">
                              {room.type}
                              <div className="text-[10px] font-normal text-slate-400 mt-0.5">기준: {(room.basePrice/10000).toFixed(0)}만원</div>
                            </td>
                            {room.rates.map((rate: any, i: number) => (
                              <td key={i} className={`border-r border-slate-200 p-1.5 transition-colors ${getBgColor(rate?.status)}`}>
                                {rate ? (
                                  <>
                                    <div className="font-bold tracking-tight text-xs">{rate.price}</div>
                                    {rate.status !== 'standard' && <div className="text-[9px] opacity-90 mt-0.5">예상 {rate.rate}</div>}
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

              {/* 우측 제어 파라미터 패널 */}
              <div className="w-80 shrink-0 flex flex-col gap-3 h-full overflow-hidden">
                
                {/* 1. GLAD 멤버십 (Club GLAD) 등급 선택 */}
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

                {/* 2. Property 맞춤형 수요 이벤트 시나리오 */}
                <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs shrink-0">
                  <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5 text-xs">
                    <Zap size={14} className="text-amber-600"/> [{activePropertyData.name}] 특화 시나리오
                  </h3>
                  <select 
                    value={currentScenario} 
                    onChange={(e) => setCurrentScenario(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-900 font-bold bg-slate-50 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    {Object.values(activePropertyData.scenarios).map(sc => (
                      <option key={sc.id} value={sc.id} className="bg-white text-slate-900">
                        {sc.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 3. 프라이싱 알고리즘 파라미터 제어 */}
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
                    <button onClick={() => { setMinDrop(-10); setMaxRise(30); setSensitivity('High'); setCurrentScenario('normal'); setMemberTier('gold'); setWeatherCondition('festival_fine'); }} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-50">초기화</button>
                    <button onClick={applyAI} className="flex-[2] flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white py-2 rounded-lg text-xs font-bold shadow-2xs">
                      <Sparkles size={14} className="text-amber-400" /> AI 최적화 적용
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* [메뉴 2] 요금 설정 모듈 */}
          {activeMenu === '요금 설정' && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-5 overflow-auto shadow-2xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Sliders size={20} className="text-amber-600" /> [{activePropertyData.name}] 객실 타입별 기준 요금 & 가격 가드레일</h2><p className="text-xs text-slate-400 mt-0.5">다이내믹 프라이싱 엔진이 준수해야 할 지점별 마스터 기준가 및 방어 요금선</p></div>
                <button onClick={() => { applyAI(); showToast('요금 설정 값이 히트맵에 실시간 반영되었습니다!'); }} className="flex items-center gap-2 bg-amber-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-700 text-xs shadow-2xs"><Save size={14} /> 요금 정책 저장 및 반영</button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {roomConfigs.map((room, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col gap-4">
                    <div className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2 flex justify-between items-center">
                      <span>{room.type}</span>
                      <span className="text-xs font-normal text-amber-600">지점 마스터 등록</span>
                    </div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">기본 객실가 (Base Rate)</label><input type="number" step="10000" value={room.basePrice} onChange={(e) => { const updated = [...roomConfigs]; updated[idx].basePrice = Number(e.target.value); setRoomConfigs(updated); }} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold bg-white text-slate-900 outline-none focus:border-amber-500" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">최저 방어 요금 (Floor Price)</label><input type="number" step="10000" value={room.minPrice} onChange={(e) => { const updated = [...roomConfigs]; updated[idx].minPrice = Number(e.target.value); setRoomConfigs(updated); }} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold bg-white text-slate-900 outline-none focus:border-amber-500" /></div>
                    <div><label className="block text-xs font-medium text-slate-600 mb-1">최고 상한 요금 (Max Ceiling)</label><input type="number" step="10000" value={room.maxPrice} onChange={(e) => { const updated = [...roomConfigs]; updated[idx].maxPrice = Number(e.target.value); setRoomConfigs(updated); }} className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-bold bg-white text-slate-900 outline-none focus:border-amber-500" /></div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* [메뉴 3] 예약 현황 모듈 */}
          {activeMenu === '예약 현황' && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><CalendarDays size={20} className="text-amber-600" /> [{activePropertyData.name}] 객실 예약 현황 및 블록 관리</h2><p className="text-xs text-slate-400 mt-0.5">지점별 법인 계약 블록 및 Club GLAD VIP 홀딩 물량을 제외한 실질 일반 가용 객실 현황</p></div>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4"><div className="text-xs text-amber-900 font-medium mb-1">총 객실 수 / 가용 객실</div><div className="text-2xl font-black text-slate-900">{activePropertyData.totalRooms} <span className="text-xs font-normal text-slate-500">({metrics.occBreakdown.available} 일반판매)</span></div></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500 font-medium mb-1">확정 예약 객실 (OTA/Direct)</div><div className="text-2xl font-black text-emerald-600">{metrics.occBreakdown.sold} ({metrics.baseOcc}%)</div></div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4"><div className="text-xs text-slate-500 font-medium mb-1">법인 계약 및 VIP 블록</div><div className="text-2xl font-black text-amber-600">{metrics.occBreakdown.corpBlock} + {metrics.occBreakdown.memberHold}</div></div>
              </div>
            </div>
          )}

          {/* [메뉴 4] 시장 분석 모듈 */}
          {activeMenu === '시장 분석' && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><LineChart size={20} className="text-amber-600" /> [{activePropertyData.name}] 권역 특성 & 시장 수요 리포트</h2><p className="text-xs text-slate-400 mt-0.5">인근 컴프세트 호텔 가격 추이와 기상/주변 행사 연동 트래픽 분석</p></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm mb-2">지점별 상권 및 이벤트 탄력성</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedProperty === 'yeouido' && '여의도 금융가 출장자 중심의 평시 주중(화~목) 점유율과 불꽃축제/봄꽃축제 시 주말 요금 폭발(Surge) 패턴이 뚜렷합니다.'}
                      {selectedProperty === 'mapo' && '공항철도 및 마포대로 비즈니스 직장인 수요가 안정적이며, 경의선 숲길 및 홍대 인바운드 외국인 FIT 유입 탄력성이 높습니다.'}
                      {selectedProperty === 'coex' && '테헤란로 IT/금융 바이어 비즈니스와 코엑스 MICE 행사 및 영동대로 K-POP 공연 시즌의 객실 단가 상승 폭이 가장 큽니다.'}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm mb-2">기상(Weather) & 주변 행사 연동 효율</div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      현재 설정된 기상 환경 [{weatherPolicies[weatherCondition].name}] 변수가 가용 점유율 계수에 연동되어 자동 가격을 보정하고 있습니다. ({weatherPolicies[weatherCondition].desc})
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* [메뉴 5] AI 최적화 룰 모듈 */}
          {activeMenu === 'AI 최적화 룰' && (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 flex flex-col gap-4 overflow-auto shadow-2xs">
              <div className="border-b border-slate-100 pb-4"><h2 className="text-base font-bold text-slate-900 flex items-center gap-2"><Sparkles size={20} className="text-amber-600" /> AI 프라이싱 자율 구동 최적화 룰</h2><p className="text-xs text-slate-400 mt-0.5">글래드 프라이싱 엔진의 자동 가격 방어 및 서지 알고리즘 제어</p></div>
              <div className="space-y-3">
                {[
                  { key: 'autoPriceSync', title: '경쟁사 가격 실시간 자동 동기화 봇', desc: `${activePropertyData.name} 권역 Comp-Set 변동 시 자사 요금 실시간 자동 보정` },
                  { key: 'corpBlockProtection', title: '법인 계약 및 VIP 홀딩 블록 보호 가드레일', desc: '지역 대형 행사 시즌 일반 객실 요금을 자동 상향하여 객실 수익성 사수' },
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

          {/* [메뉴 6] 시스템 설정 모듈 */}
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
                    <div className="font-bold text-slate-900 text-sm mb-3">글래드 통합 PMS & 리워즈 서버 연동 상태</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between items-center bg-white p-3 rounded border border-slate-200">
                        <span className="text-slate-700">오라클 오페라 PMS / Club GLAD API</span>
                        <span className="text-emerald-600 font-bold flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 정상 연동중</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex flex-col justify-between flex-1">
                    <div>
                      <div className="font-bold text-slate-900 text-sm mb-2">리워즈 정책 데이터 강제 동기화</div>
                      <p className="text-xs text-slate-500 leading-relaxed mb-4">멤버십 서버에서 최신 등급별 할인 규칙과 회원 등급 변동 원장을 동기화합니다.</p>
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