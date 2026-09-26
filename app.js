// Рендер динамических блоков из content.js.
// Каждый блок рисуется отдельно и молча пропускается, если его контейнера
// нет на странице, — одна ошибка не должна оставлять пустым весь сайт.

var MONTHS = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль',
  'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];

function plural(n, one, few, many) {
  var m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

function parseMonth(s) {
  var p = s.split('-');
  return { y: +p[0], m: +p[1] - 1 };
}

function nowMonth() {
  var d = new Date();
  return { y: d.getFullYear(), m: d.getMonth() };
}

// Длительность считается включительно: «февраль — декабрь» = 11 месяцев.
function durationText(from, to) {
  var a = parseMonth(from), b = to ? parseMonth(to) : nowMonth();
  var total = (b.y - a.y) * 12 + (b.m - a.m) + 1;
  var y = Math.floor(total / 12), m = total % 12, parts = [];
  if (y) parts.push(y + ' ' + plural(y, 'год', 'года', 'лет'));
  if (m) parts.push(m + ' ' + plural(m, 'месяц', 'месяца', 'месяцев'));
  return parts.join(' ');
}

function monthText(s) {
  var p = parseMonth(s), name = MONTHS[p.m];
  return name.charAt(0).toUpperCase() + name.slice(1) + ' ' + p.y;
}

function safe(name, fn) {
  try { fn(); } catch (e) { console.error('Блок «' + name + '» не отрисован:', e); }
}

function renderHeader(t) {
  var el = document.querySelector('[data-career]');
  if (el && t.careerStart) el.textContent = 'Опыт в QA: ' + durationText(t.careerStart);
}

function renderAbout(t) {
  var el = document.querySelector('[data-lang-content="bioContent"]');
  if (el) el.innerHTML = t.bioContent;
}

// Длинные списки обязанностей сворачиваются: видно первые SHOWN пунктов,
// остальное — по кнопке.
var SHOWN = 6;

function renderExperience(t) {
  var box = document.querySelector('.experience-container');
  if (!box) return;
  var html = '';
  t.experienceContent.forEach(function (job) {
    var title = job.url
      ? '<a href="' + job.url + '" target="_blank" rel="noopener">' + job.company + '</a>'
      : job.company;
    var period = monthText(job.from) + ' — ' + (job.to ? monthText(job.to) : 'сейчас');
    var items = job.responsibilities, extra = items.length - SHOWN;
    html += '<article class="job">' +
      '<div class="job-head">' +
        '<h3>' + title + '</h3>' +
        '<span class="job-role">' + job.position + '</span>' +
      '</div>' +
      '<p class="job-period">' + period + ' · ' + durationText(job.from, job.to) + '</p>' +
      '<ul class="job-list">';
    items.forEach(function (task, i) {
      html += '<li' + (extra > 1 && i >= SHOWN ? ' class="is-extra"' : '') + '>' + task + '</li>';
    });
    html += '</ul>';
    if (extra > 1) {
      html += '<button type="button" class="job-more" data-more="' + extra + '">Ещё ' + extra + '</button>';
    }
    html += '</article>';
  });
  box.innerHTML = html;

  box.addEventListener('click', function (e) {
    var btn = e.target.closest('.job-more');
    if (!btn) return;
    var job = btn.closest('.job');
    var open = job.classList.toggle('is-open');
    btn.textContent = open ? 'Свернуть' : 'Ещё ' + btn.getAttribute('data-more');
  });
}

function renderSkills(t) {
  var box = document.querySelector('.skills-container');
  if (!box) return;
  var html = '';
  Object.keys(t.skillsGroups).forEach(function (key) {
    var g = t.skillsGroups[key];
    html += '<div class="skill-group"><h3>' + g.title + '</h3><ul class="tags">';
    g.skills.forEach(function (s) { html += '<li>' + s + '</li>'; });
    html += '</ul></div>';
  });
  box.innerHTML = html;
}

function renderPortfolio(t) {
  var box = document.querySelector('.portfolio-container');
  if (!box) return;
  var html = '';
  t.portfolioContent.forEach(function (item) {
    html += '<a class="game" href="' + item.link + '" target="_blank" rel="noopener">' +
      '<img src="' + item.image + '" alt="' + item.title + '" loading="lazy">' +
      '<span class="game-body">' +
        '<span class="game-title">' + item.title + '</span>' +
        '<span class="game-meta">' + item.downloads + ' скачиваний</span>' +
        '<span class="game-meta"><i class="fas fa-star" aria-hidden="true"></i> ' + item.rating + ' отзывов</span>' +
      '</span>' +
    '</a>';
  });
  box.innerHTML = html;
}

function renderTools(t) {
  var box = document.querySelector('.tools-container');
  if (!box || !t.toolsContent) return;
  var html = '';
  t.toolsContent.forEach(function (tool) {
    html += '<a class="tool" href="' + tool.link + '" target="_blank" rel="noopener">' +
      '<span class="tool-title"><i class="fab fa-github" aria-hidden="true"></i> ' + tool.title + '</span>' +
      '<span class="tool-stack">' + tool.stack + '</span>' +
      '<span class="tool-text">' + tool.text + '</span>' +
    '</a>';
  });
  box.innerHTML = html;
}

// Подсветка пункта меню той секции, которую сейчас читают.
function trackNav() {
  var links = document.querySelectorAll('.topnav a[href^="#"]');
  if (!('IntersectionObserver' in window) || !links.length) return;
  var byId = {};
  links.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (!en.isIntersecting) return;
      links.forEach(function (a) { a.classList.remove('is-active'); });
      var a = byId[en.target.id];
      if (a) {
        a.classList.add('is-active');
        // На телефоне меню прокручивается вбок — держим активный пункт в кадре.
        var nav = a.parentNode.parentNode;
        if (nav.scrollWidth > nav.clientWidth) {
          nav.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
        }
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  Object.keys(byId).forEach(function (id) {
    var s = document.getElementById(id);
    if (s) obs.observe(s);
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var t = content.ru;
  safe('шапка', function () { renderHeader(t); });
  safe('обо мне', function () { renderAbout(t); });
  safe('опыт', function () { renderExperience(t); });
  safe('навыки', function () { renderSkills(t); });
  safe('игры', function () { renderPortfolio(t); });
  safe('инструменты', function () { renderTools(t); });
  safe('меню', trackNav);
});
