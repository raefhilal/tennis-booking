'use strict';
const fs = require('fs');
const path = require('path');

const DIR = path.join(__dirname, 'data');
const FILE = path.join(DIR, 'bookings.json');

function ensure() {
  if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });
  if (!fs.existsSync(FILE)) fs.writeFileSync(FILE, JSON.stringify({ seq: 0, bookings: [] }, null, 2));
}

function readAll() {
  ensure();
  try {
    const db = JSON.parse(fs.readFileSync(FILE, 'utf8'));
    if (!Array.isArray(db.bookings)) db.bookings = [];
    if (typeof db.seq !== 'number') db.seq = db.bookings.length;
    return db;
  } catch (e) {
    return { seq: 0, bookings: [] };
  }
}

function writeAll(db) {
  ensure();
  const tmp = `${FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, FILE);
}

/** إزالة أي وسوم/رموز خطرة من النصوص القادمة من المستخدم */
function clean(value, max) {
  return String(value == null ? '' : value)
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max || 80);
}

function cleanEmployeeId(value) {
  return String(value == null ? '' : value).replace(/[^0-9A-Za-z-]/g, '').slice(0, 12);
}

function all() {
  return readAll().bookings;
}

function byEmployee(employeeId) {
  return all().filter((b) => b.employeeId === employeeId);
}

function byCourtAndStart(courtId, startISO) {
  return all().filter((b) => b.courtId === courtId && b.startISO === startISO);
}

function activeCount(employeeId, now) {
  return all().filter((b) => b.employeeId === employeeId && Date.parse(b.startISO) > now).length;
}

/** إنشاء حجز بشكل ذرّي مع إعادة التحقق من التعارض */
function create(booking) {
  const db = readAll();
  const clash = db.bookings.find((b) => b.courtId === booking.courtId && b.startISO === booking.startISO);
  if (clash) return { error: 'conflict' };
  const mine = db.bookings.find((b) => b.employeeId === booking.employeeId && b.startISO === booking.startISO);
  if (mine) return { error: 'duplicate' };
  db.seq += 1;
  const row = { ...booking, id: `B${String(db.seq).padStart(4, '0')}`, ref: `TB-${1000 + db.seq}` };
  db.bookings.push(row);
  writeAll(db);
  return { booking: row };
}

function remove(id, employeeId) {
  const db = readAll();
  const i = db.bookings.findIndex((b) => b.id === id);
  if (i === -1) return { error: 'notfound' };
  if (employeeId && db.bookings[i].employeeId !== employeeId) return { error: 'forbidden' };
  const [row] = db.bookings.splice(i, 1);
  writeAll(db);
  return { booking: row };
}

module.exports = { all, byEmployee, byCourtAndStart, activeCount, create, remove, clean, cleanEmployeeId };
