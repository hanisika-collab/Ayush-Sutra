// services/bookingValidator.js
const Room = require('../models/Room');
const Session = require('../models/Session');

function timeToMinutes(t) {
  const [h,m] = t.split(':').map(Number);
  return h*60 + m;
}

async function canBookRoom(roomId, startDate, endDate) {
  const room = await Room.findById(roomId);
  if (!room) throw new Error('Room not found');

  const day = startDate.getDay(); // 0..6
  const startMin = startDate.getHours()*60 + startDate.getMinutes();
  const endMin = endDate.getHours()*60 + endDate.getMinutes();

  const slot = room.slots.find(s => s.dayOfWeek === day &&
    timeToMinutes(s.startTime) <= startMin &&
    timeToMinutes(s.endTime) >= endMin);

  if (!slot) return { ok: false, reason: 'No slot for requested time' };

  // count overlapping sessions
  const overlapping = await Session.countDocuments({
    room: room._id,
    status: { $ne: 'cancelled' },
    $or: [
      { start: { $lt: endDate }, end: { $gt: startDate } }
    ]
  });

  if (overlapping >= slot.maxConcurrent) {
    return { ok: false, reason: 'Room capacity full' };
  }

  return { ok: true, slot };
}

module.exports = { canBookRoom };
