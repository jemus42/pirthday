const PI = Math.PI;
const E = Math.E;

// Gamma function (for π!) using Lanczos approximation
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

const PI_FACTORIAL = gamma(PI + 1); // ≈ 7.19

// Special pi-based milestones using various mathematical operations
const SPECIAL_MILESTONES = [
  // Roots and powers of pi
  { multiplier: Math.sqrt(PI), label: '√π', description: 'Square root of pi' },
  { multiplier: PI * PI, label: 'π²', description: 'Pi squared' },
  { multiplier: Math.pow(PI, 3), label: 'π³', description: 'Pi cubed' },
  { multiplier: Math.pow(PI, E), label: 'π^e', description: 'Pi to the power of e' },
  { multiplier: Math.pow(E, PI), label: 'e^π', description: 'e to the power of pi' },
  { multiplier: Math.pow(PI, PI), label: 'π^π', description: 'Pi to the power of pi' },

  // n^π series
  { multiplier: Math.pow(2, PI), label: '2^π', description: '2 to the power of pi' },
  { multiplier: Math.pow(3, PI), label: '3^π', description: '3 to the power of pi' },
  { multiplier: Math.pow(4, PI), label: '4^π', description: '4 to the power of pi' },

  // π! and multiples
  { multiplier: PI_FACTORIAL, label: 'π!', description: 'Pi factorial' },
  { multiplier: 2 * PI_FACTORIAL, label: '2π!', description: '2 times pi factorial' },
  { multiplier: 3 * PI_FACTORIAL, label: '3π!', description: '3 times pi factorial' },
  { multiplier: 4 * PI_FACTORIAL, label: '4π!', description: '4 times pi factorial' },
  { multiplier: 5 * PI_FACTORIAL, label: '5π!', description: '5 times pi factorial' },
  { multiplier: 6 * PI_FACTORIAL, label: '6π!', description: '6 times pi factorial' },
  { multiplier: 7 * PI_FACTORIAL, label: '7π!', description: '7 times pi factorial' },
  { multiplier: 8 * PI_FACTORIAL, label: '8π!', description: '8 times pi factorial' },
  { multiplier: 9 * PI_FACTORIAL, label: '9π!', description: '9 times pi factorial' },
  { multiplier: 10 * PI_FACTORIAL, label: '10π!', description: '10 times pi factorial' },
  { multiplier: 11 * PI_FACTORIAL, label: '11π!', description: '11 times pi factorial' },
  { multiplier: 12 * PI_FACTORIAL, label: '12π!', description: '12 times pi factorial' },
  { multiplier: 13 * PI_FACTORIAL, label: '13π!', description: '13 times pi factorial' },
  { multiplier: 14 * PI_FACTORIAL, label: '14π!', description: '14 times pi factorial' },
];

// Generate standard multiples of pi (1π to 32π, where 32π ≈ 100.5 years)
const STANDARD_MILESTONES = Array.from({ length: 32 }, (_, i) => ({
  multiplier: (i + 1) * PI,
  label: `${i + 1}π`,
  description: `${i + 1} times pi`,
}));

// Combine and sort all milestones
const ALL_MILESTONES = [...SPECIAL_MILESTONES, ...STANDARD_MILESTONES]
  .sort((a, b) => a.multiplier - b.multiplier);

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

function isSpecialMilestone(milestone) {
  return SPECIAL_MILESTONES.some(
    (s) => Math.abs(s.multiplier - milestone.multiplier) < 0.001
  );
}

function calculatePirthdays(birthday) {
  const now = new Date();

  return ALL_MILESTONES.map((milestone) => {
    const pirthdayDate = addYearsToDate(birthday, milestone.multiplier);
    return {
      ...milestone,
      date: pirthdayDate,
      isPast: pirthdayDate < now,
      isSpecial: isSpecialMilestone(milestone),
      yearsValue: milestone.multiplier.toFixed(4),
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

document.addEventListener('DOMContentLoaded', init);
