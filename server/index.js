'use strict';
const path = require('path');
const fs = require('fs');
const express = require('express');
const R = require('./rules');
const store = require('./store');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.disable('x-powered-by');
app.use(express.json({ limit: '64kb' }));
app.set('trust proxy', true);

// شريط النشر: إزالة بادئة /p/<deployId> إن وُجدت
app.use((req, res, next) => {
  const m = req.url.match(/^\/p\/[a-f0-9]{16}(?=\/|$)/i);
  if (m) req.url = req.url.slice(m[0].length) || '/';
  next();
});

app.use((req, res, next) => { res.setHeader('Cache-Control', 'no-store'); next(); });

const H = (hour) => `${String(hour).padStart(2, '0')}:00`;

/** بناء أوقات يوم كامل مع حالتها */
function buildDay(dateKey, employeeId, now) {
  const active = employeeId ? store.activeCount(employeeId, now) : 0;
  const rows = store.all();
  const courts = R.RULES.courts.map((court) => {
    const slots = R.slotsForDay(dateKey, now).map((s) => {
      const start = Date.parse(s.startISO);
      const found = rows.find((b) => b.courtId === court.id && b.startISO === s.startISO);
      let status = 'available';
      let reason = '';
      let ref;
      let bookingId;
      if (start <= now) {
        status = 'past';
      } else if (found) {
        status = found.employeeId === employeeId ? 'mine' : 'booked';
        reason = status === 'mine' ? 'حجزك' : 'محجوز';
        if (status === 'mine') { ref = found.ref; bookingId = found.id; }
      } else {
        const st = R.slotState(start, now, active);
        status = st.status;
        reason = st.reason || '';
      }
      return { hour: s.hour, label: H(s.hour), endLabel: H(s.hour + 1), startISO: s.startISO, endISO: s.endISO, status, reason, ref, bookingId };
    });
    return { id: court.id, name: court.name, short: court.short, slots };
  });
  return { courts };
}

/* ─────────────────────────  API  ───────────────────────── */

app.get('/api/health', (req, res) => res.json({ ok: true, service: 'tennis-booking', time: new Date().toISOString() }));

app.get('/api/config', (req, res) => {
  const now = Date.now();
  res.json({ ok: true, now: new Date(now).toISOString(), today: R.dateKey(R.localParts(now)), rules: R.publicRules(), days: R.dayStrip(now) });
});

app.get('/api/slots', (req, res) => {
  const now = Date.now();
  const today = R.dateKey(R.localParts(now));
  const days = R.dayStrip(now);
  let date = store.clean(req.query.date, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !days.some((d) => d.date === date)) date = today;
  const employeeId = store.cleanEmployeeId(req.query.employeeId);
  const { courts } = buildDay(date, employeeId, now);
  res.json({ ok: true, now: new Date(now).toISOString(), today, date, rules: R.publicRules(), days, courts });
});

app.post('/api/bookings', (req, res) => {
  const now = Date.now();
  const body = req.body || {};
  const employeeId = store.cleanEmployeeId(body.employeeId);
  const name = store.clean(body.name, 60);
  const phone = store.clean(body.phone, 20);
  const courtId = store.clean(body.courtId, 8);
  const date = store.clean(body.date, 10);
  const hour = Number(body.hour);

  if (!/^[0-9A-Za-z-]{3,12}$/.test(employeeId)) {
    return res.status(400).json({ ok: false, code: 'bad_employee', error: 'الرقم الوظيفي غير صحيح — أدخل من ٣ إلى ١٢ رقماً أو حرفاً.' });
  }
  if (name.length < 3) {
    return res.status(400).json({ ok: false, code: 'bad_name', error: 'الاسم مطلوب (٣ أحرف على الأقل).' });
  }
  if (phone && !/^[0-9+\s-]{8,20}$/.test(phone)) {
    return res.status(400).json({ ok: false, code: 'bad_phone', error: 'رقم الجوال غير صحيح.' });
  }
  const court = R.RULES.courts.find((c) => c.id === courtId);
  if (!court) return res.status(400).json({ ok: false, code: 'bad_court', error: 'الملعب غير معروف.' });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ ok: false, code: 'bad_date', error: 'التاريخ غير صحيح.' });
  }
  const slot = R.slotsForDay(date, now).find((s) => s.hour === hour);
  if (!slot) {
    return res.status(400).json({ ok: false, code: 'bad_hour', error: `المواعيد المتاحة من ${H(R.RULES.openHour)} حتى ${H(R.RULES.closeHour)}.` });
  }

  const active = store.activeCount(employeeId, now);
  const state = R.slotState(slot.start, now, active);
  if (state.status !== 'available') {
    return res.status(state.status === 'past' ? 410 : 403).json({ ok: false, code: state.status, error: state.reason || 'هذا الوقت لم يعد متاحاً للحجز.' });
  }

  const result = store.create({
    employeeId, name, phone, courtId: court.id, courtName: court.short,
    date, hour, label: H(hour),
    startISO: slot.startISO, endISO: slot.endISO,
    createdAtISO: new Date(now).toISOString(),
    createdByTz: R.RULES.tz,
  });
  if (result.error === 'conflict') {
    return res.status(409).json({ ok: false, code: 'conflict', error: 'تم حجز هذا الوقت للتو من شخص آخر — اختر وقتاً مختلفاً.' });
  }
  if (result.error === 'duplicate') {
    return res.status(409).json({ ok: false, code: 'duplicate', error: 'لديك حجز بالفعل في نفس هذا الوقت.' });
  }
  res.status(201).json({ ok: true, booking: result.booking });
});

app.get('/api/bookings', (req, res) => {
  const employeeId = store.cleanEmployeeId(req.query.employeeId);
  if (!/^[0-9A-Za-z-]{3,12}$/.test(employeeId)) {
    return res.status(400).json({ ok: false, code: 'bad_employee', error: 'أدخل رقمك الوظيفي لعرض الحجوزات.' });
  }
  const now = Date.now();
  const rows = store.byEmployee(employeeId).sort((a, b) => Date.parse(a.startISO) - Date.parse(b.startISO));
  const map = (b, upcoming) => ({
    id: b.id, ref: b.ref, courtId: b.courtId, courtName: b.courtName, date: b.date, label: b.label,
    endLabel: H(b.hour + 1), startISO: b.startISO, endISO: b.endISO, createdAtISO: b.createdAtISO,
    upcoming, cancellable: upcoming, day: R.describeDate(b.date),
  });
  res.json({
    ok: true,
    now: new Date(now).toISOString(),
    employeeId,
    upcoming: rows.filter((b) => Date.parse(b.startISO) > now).map((b) => map(b, true)),
    past: rows.filter((b) => Date.parse(b.startISO) <= now).reverse().slice(0, 20).map((b) => map(b, false)),
  });
});

app.delete('/api/bookings/:id', (req, res) => {
  const now = Date.now();
  const employeeId = store.cleanEmployeeId(req.query.employeeId);
  const found = store.all().find((b) => b.id === store.clean(req.params.id, 12));
  if (!found) return res.status(404).json({ ok: false, code: 'notfound', error: 'الحجز غير موجود.' });
  if (found.employeeId !== employeeId) return res.status(403).json({ ok: false, code: 'forbidden', error: 'لا يمكنك إلغاء حجز لا يخصك.' });
  if (Date.parse(found.startISO) <= now) return res.status(410).json({ ok: false, code: 'past', error: 'لا يمكن إلغاء حجز بدأ بالفعل.' });
  const out = store.remove(found.id, employeeId);
  if (out.error) return res.status(400).json({ ok: false, code: out.error, error: 'تعذّر إلغاء الحجز.' });
  res.json({ ok: true, cancelled: out.booking.id });
});

/* ───────────────────  الموقع الثابت + التشغيل  ─────────────────── */

const DIST = path.join(__dirname, '..', 'client', 'dist');

app.use(express.static(DIST, { index: false, maxAge: 0 }));

app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: 'not found' });
  const idx = path.join(DIST, 'index.html');
  if (fs.existsSync(idx)) return res.sendFile(idx);
  res.status(503).send('واجهة الموقع غير مبنية بعد (client/dist غير موجود).');
});

app.listen(PORT, HOST, () => {
  console.log(`[tennis-booking] ready on http://${HOST}:${PORT}  tz=${R.RULES.tz}  mode=${R.RULES.leadTimeMode}`);
});
