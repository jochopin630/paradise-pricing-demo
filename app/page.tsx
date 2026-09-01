<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Paradise City - Dynamic Pricing (Duetto GameChanger Concept)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif; }
    </style>
</head>
<body class="bg-slate-100 text-slate-800 p-6">

    <!-- Top Header -->
    <header class="flex justify-between items-center mb-6 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-amber-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">P</div>
            <div>
                <h1 class="text-xl font-bold text-slate-900">파라다이스 시티 다이나믹 프라이싱 Engine</h1>
                <p class="text-xs text-slate-500">Duetto GameChanger Open Pricing Framework 기반</p>
            </div>
        </div>
        <div class="flex items-center gap-4">
            <span class="text-sm bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full font-medium border border-emerald-200">PMS & OTA 실시간 연동 중</span>
            <button onclick="calculatePricing()" class="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition">AI 요금 재산출</button>
        </div>
    </header>

    <!-- Main Content Layout -->
    <div class="grid grid-cols-12 gap-6">

        <!-- Left Controls & Open Pricing Logic Panel -->
        <div class="col-span-4 flex flex-col gap-6">
            
            <!-- Global Variables / Trigger Panel -->
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h2 class="text-base font-bold text-slate-900 mb-4 border-b pb-2">1. 수요 파라미터 (Market Signals)</h2>
                
                <div class="space-y-4">
                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-slate-600 font-medium">예상 점유율 (Occupancy Pace)</span>
                            <span id="occ-val" class="font-bold text-amber-600">85%</span>
                        </div>
                        <input type="range" id="occ-range" min="30" max="100" value="85" class="w-full accent-amber-600" oninput="updateValues()">
                    </div>

                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-slate-600 font-medium">경쟁사 요금 지수 (CompSet Index)</span>
                            <span id="comp-val" class="font-bold text-amber-600">110%</span>
                        </div>
                        <input type="range" id="comp-range" min="80" max="150" value="110" class="w-full accent-amber-600" oninput="updateValues()">
                    </div>

                    <div>
                        <div class="flex justify-between text-sm mb-1">
                            <span class="text-slate-600 font-medium">자사몰 검색 전환율 (Regret & Denial)</span>
                            <span id="regret-val" class="font-bold text-amber-600">High (15%)</span>
                        </div>
                        <select id="regret-select" class="w-full border border-slate-300 rounded-lg p-2 text-sm" onchange="updateValues()">
                            <option value="low">Low (수요 침체)</option>
                            <option value="mid">Medium (정상 수요)</option>
                            <option value="high" selected>High (수요 폭발 / 초과 수요)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Open Pricing Channel Controls -->
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h2 class="text-base font-bold text-slate-900 mb-2 border-b pb-2">2. Open Pricing 채널 마진 제어</h2>
                <p class="text-xs text-slate-500 mb-4">고정 격차 없이 채널별 독립 가격 책정 (GameChanger 핵심)</p>

                <div class="space-y-3">
                    <div class="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                        <span class="font-semibold text-slate-700">파라다이스 자사몰 (Direct)</span>
                        <span class="text-xs bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">기준가 (0% 수수료)</span>
                    </div>
                    <div class="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                        <span class="font-semibold text-slate-700">주요 OTA (Booking/Agoda)</span>
                        <div class="flex items-center gap-1">
                            <span class="text-xs text-slate-500">Premium:</span>
                            <input type="number" id="ota-markup" value="12" class="w-12 text-center border rounded text-xs p-1" onchange="updateValues()"> %
                        </div>
                    </div>
                    <div class="flex justify-between items-center text-sm p-2 bg-slate-50 rounded">
                        <span class="font-semibold text-slate-700">카지노/VIP 패키지</span>
                        <div class="flex items-center gap-1">
                            <span class="text-xs text-slate-500">Discount:</span>
                            <input type="number" id="vip-discount" value="15" class="w-12 text-center border rounded text-xs p-1" onchange="updateValues()"> %
                        </div>
                    </div>
                </div>
            </div>

        </div>

        <!-- Right Output Matrix & Chart Panel -->
        <div class="col-span-8 flex flex-col gap-6">

            <!-- Open Pricing Dynamic Rate Matrix Table -->
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <div class="flex justify-between items-center mb-4">
                    <div>
                        <h2 class="text-base font-bold text-slate-900">객실 유형 및 채널별 실시간 산출 요금 Matrix</h2>
                        <p class="text-xs text-slate-500">BAR 연동 방식이 아닌 객실/채널별 개별 알고리즘 반영 결과</p>
                    </div>
                    <span class="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-1 rounded">단위: KRW</span>
                </div>

                <div class="overflow-x-auto">
                    <table class="w-full text-left border-collapse text-sm">
                        <thead>
                            <tr class="bg-slate-100 border-b border-slate-200">
                                <th class="p-3 font-semibold text-slate-700">객실 타입</th>
                                <th class="p-3 font-semibold text-slate-700">기본 요금(Base)</th>
                                <th class="p-3 font-semibold text-blue-600">자사몰 (Direct)</th>
                                <th class="p-3 font-semibold text-amber-600">OTA 채널</th>
                                <th class="p-3 font-semibold text-purple-600">카지노/VIP</th>
                            </tr>
                        </thead>
                        <tbody id="matrix-body" class="divide-y divide-slate-100">
                            <!-- Dynamic Content Rendered by JS -->
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Revenue Trend Chart -->
            <div class="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                <h2 class="text-base font-bold text-slate-900 mb-2">수요 시뮬레이션 및 RevPAR 시각화</h2>
                <div class="h-64">
                    <canvas id="revparChart"></canvas>
                </div>
            </div>

        </div>

    </div>

    <!-- JavaScript Logic -->
    <script>
        // Paradise City Room Types Base Rates
        const roomData = [
            { id: 'deluxe', name: '디럭스 룸', base: 320000, elasticity: 1.2 },
            { id: 'grand_deluxe', name: '그랜드 디럭스', base: 410000, elasticity: 1.0 },
            { id: 'suite', name: '코너 스위트', base: 650000, elasticity: 0.7 },
            { id: 'pool_villa', name: '풀빌라', base: 1500000, elasticity: 0.4 }
        ];

        let chartInstance = null;

        function updateValues() {
            document.getElementById('occ-val').innerText = document.getElementById('occ-range').value + '%';
            document.getElementById('comp-val').innerText = document.getElementById('comp-range').value + '%';
            
            const regretText = {
                'low': 'Low (수요 침체)',
                'mid': 'Medium (정상 수요)',
                'high': 'High (수요 폭발 / 초과 수요)'
            };
            document.getElementById('regret-val').innerText = regretText[document.getElementById('regret-select').value];

            calculatePricing();
        }

        function calculatePricing() {
            const occ = parseFloat(document.getElementById('occ-range').value) / 100;
            const comp = parseFloat(document.getElementById('comp-range').value) / 100;
            const regretMultiplier = { 'low': 0.95, 'mid': 1.0, 'high': 1.12 }[document.getElementById('regret-select').value];
            
            const otaMarkup = parseFloat(document.getElementById('ota-markup').value) / 100;
            const vipDiscount = parseFloat(document.getElementById('vip-discount').value) / 100;

            const tbody = document.getElementById('matrix-body');
            tbody.innerHTML = '';

            const chartLabels = [];
            const directPrices = [];
            const otaPrices = [];

            roomData.forEach(room => {
                // GameChanger Open Pricing Algorithm Simulation
                // 가격 = 기본가 * (점유율 가중치 ^ 탄력성) * 경쟁사 지수 * 수요 폭발 지수
                const demandFactor = Math.pow(occ, room.elasticity) * comp * regretMultiplier;
                const directPrice = Math.round((room.base * demandFactor) / 1000) * 1000;
                const otaPrice = Math.round((directPrice * (1 + otaMarkup)) / 1000) * 1000;
                const vipPrice = Math.round((directPrice * (1 - vipDiscount)) / 1000) * 1000;

                const row = `
                    <tr class="hover:bg-slate-50 transition">
                        <td class="p-3 font-semibold text-slate-800">${room.name}</td>
                        <td class="p-3 text-slate-400 line-through">${room.base.toLocaleString()}원</td>
                        <td class="p-3 font-bold text-blue-600">${directPrice.toLocaleString()}원</td>
                        <td class="p-3 font-bold text-amber-600">${otaPrice.toLocaleString()}원</td>
                        <td class="p-3 font-bold text-purple-600">${vipPrice.toLocaleString()}원</td>
                    </tr>
                `;
                tbody.innerHTML += row;

                chartLabels.push(room.name);
                directPrices.push(directPrice);
                otaPrices.push(otaPrice);
            });

            renderChart(chartLabels, directPrices, otaPrices);
        }

        function renderChart(labels, directData, otaData) {
            const ctx = document.getElementById('revparChart').getContext('2d');
            
            if (chartInstance) {
                chartInstance.destroy();
            }

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: '자사몰 요금 (Direct)',
                            data: directData,
                            backgroundColor: '#2563eb'
                        },
                        {
                            label: 'OTA 채널 요금',
                            data: otaData,
                            backgroundColor: '#d97706'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: false,
                            ticks: {
                                callback: function(value) {
                                    return value.toLocaleString() + '원';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Initialize on Load
        window.onload = () => {
            calculatePricing();
        };
    </script>
</body>
</html>