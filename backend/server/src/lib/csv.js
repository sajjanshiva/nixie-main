// Builds CSV text. Cells starting with = + - @ are prefixed with ' so Excel
// never runs them as formulas (CSV injection protection).
function cell(value) {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
  return s;
}

function toCsv(headers, rows) {
  const lines = [headers.map(cell).join(",")];
  for (const row of rows) lines.push(row.map(cell).join(","));
  return "\uFEFF" + lines.join("\r\n"); // BOM so Excel shows ₹ and names correctly
}

module.exports = { toCsv };
