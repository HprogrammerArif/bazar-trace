class RouterClass {
  constructor() {
    this.routes = [];
    this.middlewares = [];
  }

  use(prefixOrMiddleware, routerInstance) {
    if (typeof prefixOrMiddleware === 'string' && routerInstance instanceof RouterClass) {
      const prefix = prefixOrMiddleware;
      for (const route of routerInstance.routes) {
        let fullPath = prefix + route.path;
        // Normalize: remove trailing slash unless the path is just '/'
        if (fullPath.endsWith('/') && fullPath.length > 1) {
          fullPath = fullPath.slice(0, -1);
        }
        this.routes.push({
          method: route.method,
          path: fullPath,
          handlers: [...this.middlewares, ...route.handlers]
        });
      }
    } else if (typeof prefixOrMiddleware === 'function') {
      this.middlewares.push(prefixOrMiddleware);
    }
  }

  add(method, path, ...handlers) {
    let normalizedPath = path;
    if (normalizedPath.endsWith('/') && normalizedPath.length > 1) {
      normalizedPath = normalizedPath.slice(0, -1);
    }
    this.routes.push({
      method: method.toUpperCase(),
      path: normalizedPath,
      handlers: [...this.middlewares, ...handlers]
    });
  }

  get(path, ...handlers) { this.add('GET', path, ...handlers); }
  post(path, ...handlers) { this.add('POST', path, ...handlers); }
  patch(path, ...handlers) { this.add('PATCH', path, ...handlers); }
  put(path, ...handlers) { this.add('PUT', path, ...handlers); }
  delete(path, ...handlers) { this.add('DELETE', path, ...handlers); }
}

export function Router() {
  return new RouterClass();
}
