const C = require("../config/constants");

const invoiceLabel = (number) => (number ? `${C.INVOICE_PREFIX}${String(number).padStart(4, "0")}` : null);

/** Parses "NX-0013", "nx13" or "13" into 13; returns null otherwise. */
function parseInvoiceNumber(text) {
  const m = String(text || "").trim().match(/^(?:nx-?)?0*(\d{1,9})$/i);
  return m ? Number(m[1]) : null;
}

module.exports = { invoiceLabel, parseInvoiceNumber };
