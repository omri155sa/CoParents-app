const moment = require('moment');
const { Op } = require('sequelize');
const reportService = require('../services/reportService');
const { Expense, ChildLog, CustodySchedule, Child, Message } = require('../models');

const getMonthlyReport = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { year = moment().year(), month = moment().month() + 1 } = req.query;

    const expenseSummary = await reportService.getMonthlyExpenseSummary(coupleId, year, month);

    const startDate = moment(`${year}-${month}-01`).startOf('month').format('YYYY-MM-DD');
    const endDate   = moment(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD');

    const schedules = await CustodySchedule.findAll({
      where: { couple_id: coupleId, startDate: { [Op.between]: [startDate, endDate] } },
    });

    const urgentLogs = await ChildLog.findAll({
      where: { isUrgent: true, logDate: { [Op.between]: [startDate, endDate] } },
      include: [{ model: Child, where: { couple_id: coupleId } }],
    });

    res.json({
      success: true,
      report: {
        period: { year, month, startDate, endDate },
        expenses: expenseSummary,
        custody: { totalDays: schedules.length, entries: schedules.length },
        urgentLogs: urgentLogs.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

const getYearlyReport = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const { year = moment().year() } = req.query;

    const months = [];
    for (let m = 1; m <= 12; m++) {
      const summary = await reportService.getMonthlyExpenseSummary(coupleId, year, m);
      months.push({ month: m, total: summary.total, byCategory: summary.byCategory });
    }

    const yearlyTotal = months.reduce((sum, m) => sum + m.total, 0);

    res.json({ success: true, report: { year, yearlyTotal, months } });
  } catch (err) {
    next(err);
  }
};

const legalExport = async (req, res, next) => {
  try {
    const { coupleId } = req.params;
    const {
      startDate = moment().subtract(1, 'year').format('YYYY-MM-DD'),
      endDate   = moment().format('YYYY-MM-DD'),
    } = req.query;

    const pdfBuffer = await reportService.generateLegalExportPDF(coupleId, {
      startDate,
      endDate,
      couple: req.couple,
    });

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="coparent-legal-export-${coupleId}.pdf"`,
      'Content-Length': pdfBuffer.length,
    });
    res.send(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

module.exports = { getMonthlyReport, getYearlyReport, legalExport };
