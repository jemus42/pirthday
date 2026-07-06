// Gamma function (for factorials) using Lanczos approximation
function gamma(z) {
  if (z < 0.5) {
    return Math.PI / (Math.sin(Math.PI * z) * gamma(1 - z));
  }
  z -= 1;
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
}

const MAX_YEARS = 101; // keeps π's original 32-term reach (32π ≈ 100.5 years)

// Cross-constant "extras" that reference two constants at once.
const CROSS = {
  'π^e': Math.pow(Math.PI, Math.E),
  'e^π': Math.pow(Math.E, Math.PI),
};

const CONSTANTS = {
  pi: {
    key: 'pi', symbol: 'π', value: Math.PI, name: 'Pirthday', term: 'pirthday',
    approx: '3.14159265359…', extras: ['π^e', 'e^π'],
  },
  e: {
    key: 'e', symbol: 'e', value: Math.E, name: 'Eirthday', term: 'eirthday',
    approx: '2.71828182846…', extras: ['e^π', 'π^e'],
  },
};

function buildMilestones(c) {
  const v = c.value;
  const s = c.symbol;
  const fact = gamma(v + 1);

  const special = [
    { multiplier: Math.sqrt(v), label: `√${s}` },
    { multiplier: v * v, label: `${s}²` },
    { multiplier: Math.pow(v, 3), label: `${s}³` },
    { multiplier: Math.pow(v, v), label: `${s}^${s}` },
    { multiplier: Math.pow(2, v), label: `2^${s}` },
    { multiplier: Math.pow(3, v), label: `3^${s}` },
    { multiplier: Math.pow(4, v), label: `4^${s}` },
  ];
  for (let n = 1; n <= 14; n++) {
    special.push({ multiplier: n * fact, label: `${n === 1 ? '' : n}${s}!` });
  }
  for (const k of c.extras || []) {
    if (CROSS[k] != null) special.push({ multiplier: CROSS[k], label: k });
  }

  const standard = [];
  for (let n = 1; n * v <= MAX_YEARS; n++) {
    standard.push({ multiplier: n * v, label: `${n}${s}`, isSpecial: false });
  }

  return [
    ...special.map((m) => ({ ...m, isSpecial: true })),
    ...standard,
  ].sort((a, b) => a.multiplier - b.multiplier);
}

function addYearsToDate(date, years) {
  const result = new Date(date);
  const wholeYears = Math.floor(years);
  const fractionalYear = years - wholeYears;

  result.setFullYear(result.getFullYear() + wholeYears);

  // Add fractional year as days (accounting for leap years)
  const yearStart = new Date(result.getFullYear(), 0, 1);
  const yearEnd = new Date(result.getFullYear() + 1, 0, 1);
  const daysInYear = (yearEnd - yearStart) / (1000 * 60 * 60 * 24);
  const additionalDays = Math.round(fractionalYear * daysInYear);

  result.setDate(result.getDate() + additionalDays);

  return result;
}

function formatDate(date) {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getRelativeTime(date) {
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const absDays = Math.abs(diffDays);
    if (absDays < 30) return `${absDays} day${absDays === 1 ? '' : 's'} ago`;
    if (absDays < 365) {
      const months = Math.round(absDays / 30);
      return `${months} month${months === 1 ? '' : 's'} ago`;
    }
    const years = Math.round(absDays / 365);
    return `${years} year${years === 1 ? '' : 's'} ago`;
  } else if (diffDays === 0) {
    return 'Today!';
  } else {
    if (diffDays < 30) return `in ${diffDays} day${diffDays === 1 ? '' : 's'}`;
    if (diffDays < 365) {
      const months = Math.round(diffDays / 30);
      return `in ${months} month${months === 1 ? '' : 's'}`;
    }
    const years = Math.round(diffDays / 365);
    return `in ${years} year${years === 1 ? '' : 's'}`;
  }
}

function calculatePirthdays(birthday, c) {
  const now = new Date();
  return buildMilestones(c).map((m) => {
    const date = addYearsToDate(birthday, m.multiplier);
    return {
      ...m,
      date,
      isPast: date < now,
      yearsValue: m.multiplier.toFixed(4),
    };
  });
}

function renderPirthdays(pirthdays) {
  const container = document.getElementById('pirthday-list');
  container.innerHTML = '';

  for (const p of pirthdays) {
    const card = document.createElement('div');
    card.className = `pirthday-card ${p.isPast ? 'past' : 'future'} ${p.isSpecial ? 'special' : ''}`;

    card.innerHTML = `
      <div class="pirthday-info">
        <div class="pirthday-label">
          <span class="pi-value">${p.label}</span> years old
        </div>
        <div class="pirthday-date">${formatDate(p.date)}</div>
        <div class="pirthday-years">≈ ${p.yearsValue} years</div>
      </div>
      <div class="pirthday-status ${p.isPast ? 'past' : 'future'}">
        ${getRelativeTime(p.date)}
      </div>
    `;

    container.appendChild(card);
  }

  document.getElementById('results').classList.remove('hidden');
}

function init() {
  const birthdayInput = document.getElementById('birthday');
  const calculateBtn = document.getElementById('calculate');

  // Set max date to today
  birthdayInput.max = new Date().toISOString().split('T')[0];

  // Set a reasonable min date (150 years ago)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 150);
  birthdayInput.min = minDate.toISOString().split('T')[0];

  calculateBtn.addEventListener('click', () => {
    const birthdayValue = birthdayInput.value;
    if (!birthdayValue) {
      birthdayInput.focus();
      return;
    }

    const birthday = new Date(birthdayValue + 'T00:00:00');
    const pirthdays = calculatePirthdays(birthday);
    renderPirthdays(pirthdays);
  });

  // Also calculate on Enter key
  birthdayInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      calculateBtn.click();
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', init);
}

if (typeof module !== 'undefined') {
  module.exports = { CONSTANTS, buildMilestones, calculatePirthdays };
}
