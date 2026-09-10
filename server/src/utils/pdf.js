const PDFDocument = require('pdfkit');

const streamToBuffer = (doc) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

const buildInvoicePdf = async (sale) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const done = streamToBuffer(doc);

  doc.fontSize(20).text('Pharmacy Invoice', { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(10).fillColor('#555').text('Pharmacy Inventory & Sales Management', { align: 'center' });
  doc.fillColor('#000');
  doc.moveDown();
  doc.fontSize(11).text(`Invoice: ${sale.invoiceNumber}`);
  doc.text(`Date: ${new Date(sale.createdAt).toLocaleString()}`);
  doc.text(`Payment: ${sale.paymentMethod}`);
  doc.text(`Status: ${sale.status}`);
  if (sale.cashierId?.name) doc.text(`Cashier: ${sale.cashierId.name}`);
  doc.moveDown();

  doc.fontSize(12).text('Items', { underline: true });
  doc.moveDown(0.4);
  sale.items.forEach((item, i) => {
    const name = item.medicineId?.name || 'Item';
    doc
      .fontSize(10)
      .text(
        `${i + 1}. ${name}  x${item.qty}  @ ${item.price.toFixed(2)}  = ${(item.qty * item.price).toFixed(2)}`
      );
  });

  doc.moveDown();
  const subtotal = sale.items.reduce((s, i) => s + i.qty * i.price, 0);
  doc.fontSize(11).text(`Subtotal: ${subtotal.toFixed(2)}`);
  doc.text(`Discount: ${sale.discount.toFixed(2)}`);
  doc.text(`Tax: ${sale.tax.toFixed(2)}`);
  doc.fontSize(13).text(`Total: ${sale.total.toFixed(2)}`);

  doc.end();
  return done;
};

const buildReportPdf = async (title, rows, columns) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40, layout: 'landscape' });
  const done = streamToBuffer(doc);
  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown();
  doc.fontSize(9);
  const colWidth = (doc.page.width - 80) / columns.length;
  columns.forEach((c, i) => {
    doc.text(c.label, 40 + i * colWidth, doc.y, { width: colWidth, continued: i < columns.length - 1 });
  });
  doc.moveDown(0.6);
  rows.forEach((row) => {
    columns.forEach((c, i) => {
      const val = row[c.key] == null ? '' : String(row[c.key]);
      doc.text(val, 40 + i * colWidth, doc.y, { width: colWidth, continued: i < columns.length - 1 });
    });
    doc.moveDown(0.4);
    if (doc.y > doc.page.height - 50) doc.addPage();
  });
  doc.end();
  return done;
};

module.exports = { buildInvoicePdf, buildReportPdf };
