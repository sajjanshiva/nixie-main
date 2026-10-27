// Money helpers. Invoices/payments are always integers in paise.

function formatRupees(paise) {
  const rupees = paise / 100;
  const hasPaise = paise % 100 !== 0;
  return (
    "₹" +
    rupees.toLocaleString("en-IN", {
      minimumFractionDigits: hasPaise ? 2 : 0,
      maximumFractionDigits: 2,
    })
  );
}

/** For CSV: 129950 → "1299.50" */
function paiseToDecimal(paise) {
  return (paise / 100).toFixed(2);
}

module.exports = { formatRupees, paiseToDecimal };
