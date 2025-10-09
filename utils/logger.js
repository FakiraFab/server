const serialize = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch (e) {
    return JSON.stringify('[unserializable]');
  }
};

const base = (level, message, meta) => {
  const log = {
    level,
    timestamp: new Date().toISOString(),
    message,
    ...meta,
  };
  const line = serialize(log);
  if (level === 'error') {
    console.error(line);
  } else if (level === 'warn') {
    console.warn(line);
  } else {
    console.log(line);
  }
};

module.exports = {
  info: (message, meta = {}) => base('info', message, meta),
  warn: (message, meta = {}) => base('warn', message, meta),
  error: (message, meta = {}) => base('error', message, meta),
};


