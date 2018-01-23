function error(status, message) {
  const err = new Error(message);

  err.status = status;
  throw err;
}

function reportError(res) {
  return function onError(err) {
    const { message, stack, status = 500 } = err;

    res.status(status).json({ message, stack });
  };
}

module.exports = { error, reportError };
