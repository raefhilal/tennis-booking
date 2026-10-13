'use strict';
/**
 * قواعد نظام حجز ملاعب التنس — كل القواعد قابلة للتعديل من هذا الملف فقط.
 */

const TZ = 'Asia/Muscat'; // توقيت السلطنة (UTC+4) — عدّلها إذا كان الملعب في بلد آخر

const RULES = {
  facility: 'ملاعب التنس',
  courts: [
    { id: 'C1', name: 'ملعب التنس الأول', short: 'ملعب ١' },
    { id: 'C2', name: 'ملعب التنس الثاني', short: 'ملعب ٢' },
  ],
  openHour: 15,            // ٣ عصراً
  closeHour: 21,           // حتى ٩ مساءً
  slotMinutes: 60,         // مدة الحجز ساعة واحدة
  leadTimeHours: 24,       // قاعدة الـ ٢٤ ساعة
  // 'window'  = لا يمكن الحجز قبل أكثر من ٢٤ ساعة من الموعد (الحجز يُفتح قبل ٢٤ ساعة)
  // 'minimum' = يجب الحجز قبل ٢٤ ساعة على الأقل من الموعد
  leadTimeMode: 'window',
  minMinutesBeforeStart: 0, // لا يُسمح بحجز وقت بدأ بالفعل
  maxActivePerEmployee: 2,  // أقصى عدد حجوزات قادمة لنفس الرقم الوظيفي (0 = بلا حد)
  daysToShow: 7,
  tz: TZ,
};

const AR_DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

/** إزاحة المنطقة الزمنية (مللي ثانية) عند لحظة معيّنة */
function zoneOffsetMs(instant, tz) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
  const p = {};
  for (const part of dtf.formatToParts(new Date(instant))) p[part.type] = part.value;
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return asUTC - instant;
}

/** تحويل توقيت جدارى محلي (بتوقيت الملعب) إلى لحظة حقيقية */
function zonedInstant(y, m, d, h, mi) {
  const guess = Date.UTC(y, m - 1, d, h, mi, 0, 0);
  let instant = guess - zoneOffsetMs(guess, RULES.tz);
  instant = guess - zoneOffsetMs(instant, RULES.tz);
  return instant;
}

/** أجزاء التاريخ/الوقت بتوقيت الملعب */
function localParts(instant) {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: RULES.tz, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', weekday: 'short',
  });
  const p = {};
  for (const part of dtf.formatToParts(new Date(instant))) p[part.type] = part.value;
  const hour = +p.hour % 24;
  return { y: +p.year, m: +p.month, d: +p.day, hour, minute: +p.minute };
}

const pad = (n) => String(n).padStart(2, '0');
const dateKey = (p) => `${p.y}-${pad(p.m)}-${pad(p.d)}`;

/** وصف التاريخ بالعربية */
function describeDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return {
    date: key,
    day: d,
    month: AR_MONTHS[m - 1],
    monthNum: m,
    year: y,
    weekday: AR_DAYS[dow],
    label: `${AR_DAYS[dow]} ${d} ${AR_MONTHS[m - 1]}`,
    short: `${d} ${AR_MONTHS[m - 1].slice(0, 4)}`,
  };
}

function addDays(key, n) {
  const [y, m, d] = key.split('-').map(Number);
  const t = Date.UTC(y, m - 1, d) + n * 86400000;
  const dt = new Date(t);
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}

/** الأيام المعروضة في شريط التاريخ + حالة القفل لكل يوم */
function dayStrip(now) {
  const today = dateKey(localParts(now));
  const lead = RULES.leadTimeHours * 3600000;
  return Array.from({ length: RULES.daysToShow }, (_, i) => {
    const key = addDays(today, i);
    let open = 0, locked = 0, past = 0;
    for (const s of slotsForDay(key, now)) {
      if (s.start <= now) past++;
      else if (RULES.leadTimeMode === 'minimum' ? s.start < now + lead : s.start > now + lead) locked++;
      else open++;
    }
    return {
      ...describeDate(key),
      isToday: key === today,
      total: open + locked + past,
      open, locked, past,
      state: open > 0 ? (locked > 0 ? 'partial' : 'open') : (locked > 0 ? 'locked' : 'closed'),
    };
  });
}

/** حالة الوقت الواحد */
function slotState(startInstant, now, activeCount) {
  if (startInstant <= now + RULES.minMinutesBeforeStart * 60000) return { status: 'past' };
  const lead = RULES.leadTimeHours * 3600000;
  if (RULES.leadTimeMode === 'minimum') {
    if (startInstant < now + lead) {
      return { status: 'locked', reason: `يجب الحجز قبل ${RULES.leadTimeHours} ساعة على الأقل من الموعد` };
    }
  } else if (startInstant > now + lead) {
    return { status: 'locked', reason: `يفتح الحجز قبل ${RULES.leadTimeHours} ساعة فقط من الموعد` };
  }
  if (RULES.maxActivePerEmployee > 0 && activeCount >= RULES.maxActivePerEmployee) {
    return { status: 'limit', reason: `وصلت للحد الأقصى (${RULES.maxActivePerEmployee}) من الحجوزات القادمة` };
  }
  return { status: 'available' };
}

/** كل أوقات يوم معيّن لملعب معيّن */
function slotsForDay(key, now) {
  const [y, m, d] = key.split('-').map(Number);
  const out = [];
  for (let h = RULES.openHour; h < RULES.closeHour; h++) {
    const start = zonedInstant(y, m, d, h, 0);
    const end = zonedInstant(y, m, d, h, RULES.slotMinutes);
    out.push({ hour: h, start, end, startISO: new Date(start).toISOString(), endISO: new Date(end).toISOString() });
  }
  return out;
}

function publicRules() {
  return {
    facility: RULES.facility,
    courts: RULES.courts,
    openHour: RULES.openHour,
    closeHour: RULES.closeHour,
    slotMinutes: RULES.slotMinutes,
    leadTimeHours: RULES.leadTimeHours,
    leadTimeMode: RULES.leadTimeMode,
    maxActivePerEmployee: RULES.maxActivePerEmployee,
    tz: RULES.tz,
    daysToShow: RULES.daysToShow,
  };
}

module.exports = { RULES, localParts, zonedInstant, dateKey, addDays, describeDate, dayStrip, slotState, slotsForDay, publicRules, AR_DAYS, AR_MONTHS };
