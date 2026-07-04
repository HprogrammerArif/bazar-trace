import zlib from 'node:zlib';

export const ok = (res, data, status = 200) => {
  const payload = JSON.stringify({ success: true, data });
  const acceptEncoding = res.req?.headers?.['accept-encoding'] || '';

  if (acceptEncoding.includes('gzip')) {
    zlib.gzip(payload, (err, compressed) => {
      if (err) {
        res.writeHead(status, {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        });
        res.end(payload);
      } else {
        res.writeHead(status, {
          'Content-Type': 'application/json',
          'Content-Encoding': 'gzip',
          'Content-Length': compressed.length
        });
        res.end(compressed);
      }
    });
  } else {
    res.writeHead(status, {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    });
    res.end(payload);
  }
};

export const created = (res, data) => ok(res, data, 201);

export const noContent = (res) => {
  res.writeHead(204);
  res.end();
};
