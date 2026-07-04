import http from 'node:http';
import { env } from './config/env.js';
import { logger, httpLogStream } from './config/logger.js';
import v1Routes from './api/v1/routes/index.js';
import { Router } from './api/v1/router-helper.js';
import { notFoundHandler } from './middlewares/not-found.js';
import { errorHandler } from './middlewares/error-handler.js';
import { AppError } from './utils/app-error.js';

// Custom middleware: HTTP request logger (morgan equivalent)
function logRequest(req, res, next) {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const contentLength = res.getHeader('content-length') || '-';
    let logLine = '';

    if (env.isProd) {
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '-';
      const userAgent = req.headers['user-agent'] || '-';
      const referrer = req.headers['referer'] || '-';
      logLine = `${ip} - - "${req.method} ${req.originalUrl} HTTP/${req.httpVersion}" ${status} ${contentLength} "${referrer}" "${userAgent}"`;
    } else {
      logLine = `${req.method} ${req.originalUrl} ${status} - ${duration}ms`;
    }
    httpLogStream.write(logLine);
  });
  next();
}

// Custom middleware: CORS and security headers (cors/helmet equivalent)
function setHeaders(req, res, next) {
  const origin = req.headers.origin;
  if (origin && (env.corsOrigin.includes('*') || env.corsOrigin.includes(origin))) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (env.corsOrigin.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Security headers (helmet equivalent)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  next();
}

// Custom middleware: JSON and Form body parser
function parseBody(req, res, next) {
  if (req.method === 'GET' || req.method === 'DELETE' || req.method === 'OPTIONS') {
    req.body = {};
    return next();
  }

  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 1024 * 1024) { // 1MB limit
      next(AppError.badRequest('Request body too large'));
    }
  });

  req.on('end', () => {
    try {
      const contentType = req.headers['content-type'] || '';
      if (contentType.includes('application/x-www-form-urlencoded')) {
        req.body = Object.fromEntries(new URLSearchParams(body));
      } else {
        req.body = body ? JSON.parse(body) : {};
      }
      next();
    } catch (err) {
      next(AppError.badRequest('Invalid JSON body'));
    }
  });
}

export function createApp() {
  const apiRouter = new Router();
  apiRouter.use(env.apiPrefix, v1Routes);

  // Pre-compile routing patterns
  const compiledRoutes = apiRouter.routes.map((route) => {
    const paramNames = [];
    const pattern = route.path
      .replace(/([.+*?[^]$(){}=!<>|])/g, '\\$1') // escape special regex chars
      .replace(/:([a-zA-Z0-9_]+)/g, (_, name) => {
        paramNames.push(name);
        return '([^/]+)';
      });
    const regex = new RegExp(`^${pattern}$`);
    return {
      method: route.method,
      regex,
      paramNames,
      handlers: route.handlers,
    };
  });

  const server = http.createServer((req, res) => {
    // Setup Express-like status helper to preserve error-handler compatibility
    res.status = (code) => {
      res.statusCode = code;
      return res;
    };

    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname.endsWith('/') && parsedUrl.pathname.length > 1
      ? parsedUrl.pathname.slice(0, -1)
      : parsedUrl.pathname;

    req.originalUrl = req.url;
    req.path = pathname;
    req.query = Object.fromEntries(parsedUrl.searchParams);

    const globalHandlers = [logRequest, setHeaders, parseBody];

    let globalIndex = 0;
    function next(err) {
      if (err) {
        return errorHandler(err, req, res, next);
      }

      if (globalIndex < globalHandlers.length) {
        const handler = globalHandlers[globalIndex++];
        try {
          handler(req, res, next);
        } catch (ex) {
          next(ex);
        }
      } else {
        // Find matching route handler
        const matched = compiledRoutes.find(
          (route) => route.method === req.method && route.regex.test(pathname)
        );

        if (!matched) {
          return notFoundHandler(req, res, next);
        }

        // Extract route variables
        const match = pathname.match(matched.regex);
        req.params = {};
        matched.paramNames.forEach((name, i) => {
          req.params[name] = match[i + 1];
        });

        // Run route handlers pipeline
        let routeIndex = 0;
        function nextRoute(routeErr) {
          if (routeErr) {
            return errorHandler(routeErr, req, res, nextRoute);
          }
          if (routeIndex < matched.handlers.length) {
            const handler = matched.handlers[routeIndex++];
            try {
              Promise.resolve(handler(req, res, nextRoute)).catch(nextRoute);
            } catch (ex) {
              nextRoute(ex);
            }
          }
        }

        nextRoute();
      }
    }

    next();
  });

  return server;
}
