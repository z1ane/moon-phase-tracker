// DOM Elements
const greetingPage = document.getElementById('greeting-page');
const mainPage = document.getElementById('main-page');
const infoPage = document.getElementById('info-page');
const checkPhaseBtn = document.getElementById('check-phase-btn');
const backToHomeBtn = document.getElementById('back-to-home-btn');
const learnMoreBtn = document.getElementById('learn-more-btn');
const backToMainBtn = document.getElementById('back-to-main-btn');
const todayMoonContainer = document.getElementById('today-moon');
const forecastBtn = document.getElementById('forecast-btn');
const forecastContainer = document.getElementById('forecast-container');
const forecastGrid = document.getElementById('forecast-grid');

let userLocation = { lat: 11.2588, lon: 75.7804 };
let locationPromise = null;
let timeUpdateInterval = null;

const moonPhases = [
    { emoji: '🌑', name: 'New Moon' }, { emoji: '🌒', name: 'Waxing Crescent' },
    { emoji: '🌓', name: 'First Quarter' }, { emoji: '🌔', name: 'Waxing Gibbous' },
    { emoji: '🌕', name: 'Full Moon' }, { emoji: '🌖', name: 'Waning Gibbous' },
    { emoji: '🌗', name: 'Last Quarter' }, { emoji: '🌘', name: 'Waning Crescent' }
];

function getMoonPhase(date) {
    let year = date.getFullYear(), month = date.getMonth() + 1, day = date.getDate();
    if (month < 3) { year--; month += 12; }
    month++;
    let c = 365.25 * year, e = 30.6 * month;
    let jd = c + e + day - 694039.09;
    jd /= 29.5305882;
    let b = parseInt(jd);
    jd -= b;
    b = Math.round(jd * 8);
    if (b >= 8) b = 0;
    return moonPhases[b];
}

function createMoonPhaseElement(date, phase, moonTimes, isToday = false) {
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    const moonrise = moonTimes.rise ? new Date(moonTimes.rise).toLocaleTimeString('en-US', timeOptions) : 'N/A';
    const moonset = moonTimes.set ? new Date(moonTimes.set).toLocaleTimeString('en-US', timeOptions) : 'N/A';
    const container = document.createElement('div');
    
    if (isToday) {
        const now = new Date();
        const riseTime = moonTimes.rise ? new Date(moonTimes.rise) : null;
        const setTime = moonTimes.set ? new Date(moonTimes.set) : null;
        let progressPercent = 0, nowPercent = 0;
        if (riseTime && setTime && riseTime < setTime) {
            progressPercent = Math.max(0, Math.min(100, ((now - riseTime) / (setTime - riseTime)) * 100));
        }
        if (riseTime && setTime) {
            const dayStart = new Date(now).setHours(0,0,0,0);
            nowPercent = ((now - dayStart) / (86400000)) * 100;
        }
        container.innerHTML = `<div class="text-8xl mb-3">${phase.emoji}</div><div class="text-xl font-bold text-yellow-300">${phase.name}</div><div class="text-md text-gray-400 mb-4">${formattedDate}</div><div class="w-full max-w-xs mx-auto"><div class="flex justify-between text-xs text-gray-400 mb-1"><span>Rise: ${moonrise}</span><span>Set: ${moonset}</span></div><div class="time-bar-bg">${riseTime && setTime && riseTime < setTime ? `<div class="time-bar-progress" style="width:${progressPercent}%"></div>` : ''}<div class="time-bar-now" style="left:${nowPercent}%"></div></div></div>`;
    } else {
        container.className = 'bg-gray-800 bg-opacity-80 backdrop-blur-sm rounded-lg p-4 flex flex-col items-center justify-center shadow-md border border-gray-700 moon-card h-full forecast-card';
        container.innerHTML = `<div class="text-5xl mb-2">${phase.emoji}</div><div class="font-semibold text-yellow-400 text-sm">${phase.name}</div><div class="text-xs text-gray-500 mt-1 mb-2">${formattedDate}</div><div class="text-xs text-gray-400"><div>Rise: ${moonrise}</div><div>Set: ${moonset}</div></div>`;
    }
    return container;
}

function getLocation() {
    if (locationPromise) return locationPromise;
    locationPromise = new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            () => resolve(userLocation)
        );
    });
    return locationPromise;
}

async function displayTodayPhase() {
    const loc = await getLocation();
    const today = new Date();
    const phase = getMoonPhase(today);
    const times = SunCalc.getMoonTimes(today, loc.lat, loc.lon);
    todayMoonContainer.innerHTML = '';
    todayMoonContainer.appendChild(createMoonPhaseElement(today, phase, times, true));
}

async function displayForecast() {
    const loc = await getLocation();
    forecastGrid.innerHTML = '';
    const elements = [];
    for (let i = 1; i <= 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const phase = getMoonPhase(date);
        const times = SunCalc.getMoonTimes(date, loc.lat, loc.lon);
        const el = createMoonPhaseElement(date, phase, times);
        forecastGrid.appendChild(el);
        elements.push(el);
    }
    elements.forEach((el, i) => setTimeout(() => el.classList.add('visible'), i * 100));
    forecastContainer.classList.remove('opacity-0', 'scale-95');
    forecastContainer.style.maxHeight = forecastContainer.scrollHeight + 'px';
    forecastBtn.textContent = 'Hide Forecast';
}

checkPhaseBtn.addEventListener('click', () => {
    greetingPage.classList.add('hidden');
    mainPage.classList.remove('hidden');
    document.body.style.overflow = 'auto';
    displayTodayPhase();
    if (timeUpdateInterval) clearInterval(timeUpdateInterval);
    timeUpdateInterval = setInterval(displayTodayPhase, 60000);
});

backToHomeBtn.addEventListener('click', () => {
    mainPage.classList.add('hidden');
    greetingPage.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    setTimeout(() => {
        forecastContainer.style.maxHeight = '0px';
        forecastContainer.classList.add('opacity-0', 'scale-95');
        forecastBtn.textContent = 'Show Next 7 Days';
    }, 600);
});

learnMoreBtn.addEventListener('click', () => {
    mainPage.classList.add('hidden');
    infoPage.classList.remove('hidden');
});

backToMainBtn.addEventListener('click', () => {
    infoPage.classList.add('hidden');
    mainPage.classList.remove('hidden');
});

forecastBtn.addEventListener('click', () => {
    const isHidden = forecastContainer.style.maxHeight === '0px';
    if (isHidden) displayForecast();
    else {
        forecastContainer.style.maxHeight = '0px';
        forecastContainer.classList.add('opacity-0', 'scale-95');
        forecastBtn.textContent = 'Show Next 7 Days';
    }
});

document.body.style.overflow = 'hidden';
