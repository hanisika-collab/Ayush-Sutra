// controllers/analytics.js
const Session = require('../models/Session');

async function dailySessions(fromDate, toDate) {
  const pipeline = [
    { $match: { start: { $gte: fromDate, $lte: toDate } } },
    { $project: { day: { $dateToString: { format: "%Y-%m-%d", date: "$start" } }, status: 1 } },
    { $group: { _id: "$day", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status","completed"] },1,0] } } } },
    { $sort: { _id: 1 } }
  ];
  return Session.aggregate(pipeline);
}
