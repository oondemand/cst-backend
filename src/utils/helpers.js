exports.sendSimpleResponse = ({ res, statusCode, message = "OK", ...rest }) => {
  res.status(statusCode).send({ message, ...rest });
};

exports.sendErrorResponse = ({ res, statusCode, message, error }) => {
  res.status(statusCode).json({
    message,
    ...(error ? { error } : {}),
  });
};

exports.sendPaginatedResponse = ({
  res,
  statusCode,
  message,
  results,
  pagination: { currentPage, totalPages, totalItems, itemsPerPage },
}) => {
  res.status(statusCode).json({
    message,
    results,
    pagination: {
      currentPage,
      totalPages,
      totalItems,
      itemsPerPage,
    },
  });
};
