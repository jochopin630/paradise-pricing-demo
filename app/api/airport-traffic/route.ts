// app/api/airport-traffic/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  // URL에서 특정 날짜를 받아올 수 있습니다 (예: ?date=2026-10-02)
  const { searchParams } = new URL(request.url);
  const targetDate = searchParams.get('date') || '2026-10-02';

  try {
    // 💡 [실무 연동 포인트]
    // 공공데이터포털(인천국제공항공사_승객예고 API)에 fetch 요청을 보내는 공간입니다.
    // const apiKey = process.env.AIRPORT_API_KEY;
    // const res = await fetch(`http://apis.data.go.kr/B551177/StatusOfPassoengAside/getPassoengAside?serviceKey=${apiKey}&...`);
    // const data = await res.json();

    // 여기서는 이해하기 쉽도록 시나리오별/날짜별 입국객 데이터 Mock(가상) 로직을 적용합니다.
    let simulatedPax = 102450; // 평시 기준 입국객 (PAX)
    let flightCount = 610;

    if (targetDate.includes('10.02') || targetDate.includes('10.03')) {
      simulatedPax = 145200; // 연휴/주말 성수기 시뮬레이션
      flightCount = 780;
    }

    // 평시 기준(10만 명) 대비 공항 수요 계수 산출
    const baseNormalPax = 100000;
    const airportMultiplier = Number((simulatedPax / baseNormalPax).toFixed(2)); // 예: 1.45

    return NextResponse.json({
      success: true,
      date: targetDate,
      pax: simulatedPax,
      flights: flightCount,
      multiplier: airportMultiplier, // 👈 이 계수를 다이내믹 프라이싱 엔진에 곱해줍니다!
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch airport data' }, { status: 500 });
  }
}