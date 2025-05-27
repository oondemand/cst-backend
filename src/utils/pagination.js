function parsePagination(query) {
  const page = parseInt(query.pageIndex) || 0;
  const limit = parseInt(query.pageSize) || 10;
  return { page, limit };
}

function parseSorting(sortBy) {
  if (!sortBy) return {};
  const [campo, direcao] = sortBy.split(".");
  const campoFormatado = campo.replaceAll("_", ".");
  return { [campoFormatado]: direcao === "desc" ? -1 : 1 };
}

module.exports = { parsePagination, parseSorting };
