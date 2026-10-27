// parse(schema, data) → validated data, or a 400 error listing each bad field.
const { AppError } = require("../lib/errors");

function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    const fields = {};
    for (const issue of result.error.issues) {
      const key = issue.path.join(".") || "_";
      if (!fields[key]) fields[key] = issue.message;
    }
    const first = Object.values(fields)[0] || "Please check the form.";
    throw new AppError(400, "VALIDATION_ERROR", first, { fields });
  }
  return result.data;
}

module.exports = { parse };
