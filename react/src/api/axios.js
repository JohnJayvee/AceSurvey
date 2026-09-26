import axios from "axios";

const responseCache = new Map();
const pendingRequests = new Map();
const CACHE_TTL = 60000;
const getToken = () => localStorage.getItem("TOKEN") || sessionStorage.getItem("TOKEN") || "";
const baseURL = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");
const axiosClient = axios.create({
   baseURL: baseURL.endsWith('/api') ? baseURL : baseURL + '/api',
   withCredentials: true,
   headers: { Accept: "application/json" },
   timeout: 15000,
});
let cacheToken = getToken();
let cacheVersion = 0;
const syncCache = () => {
   const token = getToken();
   if (token !== cacheToken) {
      responseCache.clear();
      cacheVersion++;
      cacheToken = token;
   }
   return token;
};
const getRequestKey = (method, url, params = {}, data = {}) =>
   method.toUpperCase() + ':' + url + ':' + JSON.stringify(params) + ':' + JSON.stringify(data);
const release = config => {
   if (!config) return;
   config._removeAbortListener?.();
   const entries = pendingRequests.get(config.requestKey);
   entries?.delete(config._controller);
   if (entries?.size === 0) pendingRequests.delete(config.requestKey);
};
axiosClient.interceptors.request.use(config => {
   const token = syncCache();
   if (token) config.headers.Authorization = 'Bearer ' + token;
   else delete config.headers.Authorization;
   config._cacheToken = token;
   config._cacheVersion = cacheVersion;
   config.requestKey ||= getRequestKey(config.method || 'get', config.url, config.params, config.data);
   // Separate consumers must not cancel one another's requests.
   if (config.cancelPrevious === true) axiosClient.cancelRequest(config.requestKey);
   const controller = new AbortController();
   const originalSignal = config.signal;
   config._callerSignal = originalSignal;
   const abort = () => controller.abort();
   if (originalSignal?.aborted) controller.abort();
   else originalSignal?.addEventListener('abort', abort, { once: true });
   config._removeAbortListener = () => originalSignal?.removeEventListener('abort', abort);
   config._controller = controller;
   config.signal = controller.signal;
   if (!pendingRequests.has(config.requestKey)) pendingRequests.set(config.requestKey, new Set());
   pendingRequests.get(config.requestKey).add(controller);
   return config;
});
axiosClient.interceptors.response.use(response => {
   const { config } = response;
   release(config);
   if (!['get', 'head'].includes(config.method)) {
      axiosClient.clearCache();
   } else if (config.cache === true && config._cacheToken === syncCache() && config._cacheVersion === cacheVersion) {
      responseCache.set(config.requestKey, {
         data: response.data, headers: response.headers, timestamp: Date.now(),
      });
      if (responseCache.size > 100) responseCache.delete(responseCache.keys().next().value);
   }
   return response;
}, async error => {
   const config = error.config;
   release(config);
   if (axios.isCancel(error)) {
      error.isCanceled = true;
      throw error;
   }
   // Retrying writes could create duplicate survey answers.
   if (config && ['get', 'head'].includes(config.method) && !config.signal?.aborted &&
      (config.retries || 0) < (config.maxRetries ?? 1) &&
      (['ERR_NETWORK', 'ECONNABORTED', 'ETIMEDOUT'].includes(error.code) ||
         [502, 503, 504].includes(error.response?.status))) {
      config.retries = (config.retries || 0) + 1;
      await new Promise(resolve => setTimeout(resolve, config.retryDelay ?? 500));
      config.signal = config._callerSignal;
      return axiosClient(config);
   }
   if (error.response?.status === 401 && config?._cacheToken && config._cacheToken === getToken()) {
      axiosClient.clearCache();
      window.dispatchEvent(new Event('auth:expired'));
   }
   throw error;
});
axiosClient.cancelRequest = key => {
   const entries = pendingRequests.get(key);
   entries?.forEach(controller => controller.abort());
   pendingRequests.delete(key);
   return Boolean(entries);
};
axiosClient.cancelAllRequests = () => {
   const count = pendingRequests.size;
   [...pendingRequests.keys()].forEach(axiosClient.cancelRequest);
   return count;
};
axiosClient.isRequestPending = key => pendingRequests.has(key);
axiosClient.getPendingRequests = () => [...pendingRequests.keys()];
axiosClient.clearCache = () => {
   const count = responseCache.size;
   responseCache.clear();
   cacheVersion++;
   return count;
};
axiosClient.invalidateCache = prefix => {
   cacheVersion++;
   let count = 0;
   for (const key of responseCache.keys()) {
      if (key.startsWith(prefix)) { responseCache.delete(key); count++; }
   }
   return count;
};
axiosClient.getWithCache = (url, params = {}, options = {}) => {
   syncCache();
   if (options.signal?.aborted) return Promise.reject(new axios.CanceledError());
   const requestKey = options.requestKey || getRequestKey('get', url, params);
   const cached = responseCache.get(requestKey);
   if (options.cache !== false && cached && Date.now() - cached.timestamp < (options.cacheTTL ?? CACHE_TTL)) {
      return Promise.resolve({ ...cached, status: 200, statusText: 'OK', fromCache: true });
   }
   return axiosClient.get(url, { ...options, params, requestKey, cache: options.cache !== false });
};
axiosClient.postWithCancel = (url, data = {}, options = {}) => axiosClient.post(url, data, options);
axiosClient.putWithCancel = (url, data = {}, options = {}) => axiosClient.put(url, data, options);
axiosClient.deleteWithCancel = (url, options = {}) => axiosClient.delete(url, options);

const debouncedRequests = new Map();
axiosClient.getDebouncedWithCancel = (url, params = {}, options = {}) => {
   const key = options.requestKey || 'debounced:' + getRequestKey('get', url, params);
   axiosClient.clearDebouncedRequest(key);
   return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
         debouncedRequests.delete(key);
         axiosClient.getWithCache(url, params, options).then(resolve, reject);
      }, options.debounceTime ?? 300);
      debouncedRequests.set(key, { timer, reject });
   });
};
axiosClient.clearDebouncedRequest = key => {
   const pending = debouncedRequests.get(key);
   if (!pending) return false;
   clearTimeout(pending.timer);
   const error = new axios.CanceledError('Debounced request superseded');
   error.isCanceled = true;
   pending.reject(error);
   return debouncedRequests.delete(key);
};
axiosClient.clearDebouncedRequests = () => {
   const count = debouncedRequests.size;
   [...debouncedRequests.keys()].forEach(axiosClient.clearDebouncedRequest);
   return count;
};
axiosClient.batchRequests = (requests, options = {}) => Promise.all(requests.map(req => {
   const config = { ...options, ...req.options };
   return (req.method || 'get').toLowerCase() === 'get'
      ? axiosClient.getWithCache(req.url, req.params || {}, config)
      : axiosClient({ ...config, method: req.method, url: req.url, params: req.params, data: req.data });
}));
axiosClient.getCacheStats = () => ({
   size: responseCache.size, maxSize: 100,
   pendingRequests: pendingRequests.size, pendingKeys: [...pendingRequests.keys()],
   debouncedRequests: debouncedRequests.size,
});

export default axiosClient;
