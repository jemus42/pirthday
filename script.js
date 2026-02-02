const PI = Math.PI;

// Special pi-based milestones
const SPECIAL_MILESTONES = [
  { multiplier: PI * PI, label: 'π²', description: 'Pi squared' },
  { multiplier: Math.pow(PI, PI), label: 'π^π', description: 'Pi to the power of pi' },
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
