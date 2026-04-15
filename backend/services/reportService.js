const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { Op } = require('sequelize');
const moment = require('moment');
const { Expense, ChildLog, CustodySchedule, Child, User } = require('../models');

/**
 * Build a monthly expense summary for a couple.
 */
const getMonthlyExpenseSummary = async (coupleId, year, month) => {
  const startDate = moment(`${year}-${month}-01`).startOf('month').format('YYYY-MM-DD');
  const endDate = moment(`${year}-${month}-01`).endOf('month').format('YYYY-MM-DD');

  const expenses = await Expense.findAll({
    where: {
      couple_id: coupleId,
      date: { [Op.between]: [startDate, endDate] },
    },
    include: [{ model: User, as: 'payer', attributes: ['id', 'firstName', 'lastName'] }],
    order: [['date', 'ASC']],
  });

  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // Per-payer totals
  const byPayer = {};
  for (const e of expenses) {
    const key = e.paidBy;
    byPayer[key] = (byPayer[key] || 0) + parseFloat(e.amount);
  }

  // By category
  const byCategory = {};
  for (const e of expenses) {
    byCategory[e.category] = (byCategory[e.category] || 0) + parseFloat(e.amount);
  }

  return { expenses, total, byPayer, byCategory, startDate, endDate };
};

/**
 * Generate a legal-export PDF of a couple's activity for a date range.
 */
const generateLegalExportPDF = async (coupleId, { startDate, endDate, couple }) => {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const addPage = () => {
    const page = pdfDoc.addPage([595, 842]); // A4
    return { page, y: 800 };
  };

  let { page, y } = addPage();

  const drawText = (text, x, currentY, size = 12, useBold = false) => {
    page.drawText(text, {
      x,
      y: currentY,
      size,
      font: useBold ? boldFont : font,
      color: rgb(0, 0, 0),
    });
    return currentY - size - 4;
  };

  // Header
  y = drawText('CoParent Hub - Legal Export Report', 50, y, 18, true);
  y = drawText(`Generated: ${moment().format('DD/MM/YYYY HH:mm')}`, 50, y, 10);
  y = drawText(`Period: ${moment(startDate).format('DD/MM/YYYY')} - ${moment(endDate).format('DD/MM/YYYY')}`, 50, y, 10);
  y -= 10;

  // Fetch data
  const [expenses, logs, schedules, children] = await Promise.all([
    Expense.findAll({
      where: { couple_id: coupleId, date: { [Op.between]: [startDate, endDate] } },
      include: [{ model: User, as: 'payer', attributes: ['firstName', 'lastName'] }],
      order: [['date', 'ASC']],
    }),
    ChildLog.findAll({
      include: [
        { model: Child, where: { couple_id: coupleId }, attributes: ['name'] },
        { model: User, as: 'author', attributes: ['firstName', 'lastName'] },
      ],
      where: { logDate: { [Op.between]: [startDate, endDate] } },
      order: [['logDate', 'ASC']],
    }),
    CustodySchedule.findAll({
      where: { couple_id: coupleId, startDate: { [Op.between]: [startDate, endDate] } },
      include: [{ model: User, as: 'responsibleParent', attributes: ['firstName', 'lastName'] }],
      order: [['startDate', 'ASC']],
    }),
    Child.findAll({ where: { couple_id: coupleId } }),
  ]);

  // Expenses section
  y = drawText('EXPENSES', 50, y, 14, true);
  y -= 4;
  for (const e of expenses) {
    if (y < 80) { ({ page, y } = addPage()); }
    const line = `${e.date}  ${e.category}  ${e.amount} ILS  Paid by: ${e.payer?.firstName || '?'}  [${e.approvalStatus}]`;
    y = drawText(line, 60, y, 10);
  }

  y -= 16;
  // Child logs section
  if (y < 120) { ({ page, y } = addPage()); }
  y = drawText('CHILD LOGS', 50, y, 14, true);
  y -= 4;
  for (const log of logs) {
    if (y < 80) { ({ page, y } = addPage()); }
    const urgent = log.isUrgent ? ' [URGENT]' : '';
    const line = `${log.logDate}  ${log.Child?.name}  [${log.category}]${urgent}  by ${log.author?.firstName || '?'}`;
    y = drawText(line, 60, y, 10);
    y = drawText(`  ${log.content.substring(0, 100)}${log.content.length > 100 ? '...' : ''}`, 60, y, 9);
  }

  y -= 16;
  // Custody schedule section
  if (y < 120) { ({ page, y } = addPage()); }
  y = drawText('CUSTODY SCHEDULE', 50, y, 14, true);
  y -= 4;
  for (const s of schedules) {
    if (y < 80) { ({ page, y } = addPage()); }
    const line = `${s.startDate} → ${s.endDate || s.startDate}  Responsible: ${s.responsibleParent?.firstName || '?'}  [${s.scheduleType}]`;
    y = drawText(line, 60, y, 10);
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};

module.exports = { getMonthlyExpenseSummary, generateLegalExportPDF };
