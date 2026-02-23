import axios from "axios";

/**
 * Enhanced Axios Client with advanced request lifecycle management,
 * intelligent caching, and performance optimizations.
 */

// Cache and request tracking
const responseCache = new Map();
const pendingRequests = new Map();
const debouncedFunctions = new Map();

// Configuration
const CACHE_TTL = 60000; // 1 minute cache lifetime
const MAX_CACHE_SIZE = 100; // Maximum cached responses
const RETRY_DELAY = 1000; // Retry delay in ms
const MAX_RETRIES = 2; // Maximum retry attempts

/**
 * Create enhanced axios instance
 */
const axiosClient = axios.create({
   baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
   withCredentials: true,
   headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
   },
   decompress: true,
   timeout: 30000
});

/**
 * Properly implemented debounce function
 */
const debounce = (func, wait) => {
   let timeout;
   return function executedFunction(...args) {
      const later = () => {
         clearTimeout(timeout);
         func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
   };
};

/**
 * Trims cache when it exceeds limit
 */
const trimCache = () => {
   if (responseCache.size <= MAX_CACHE_SIZE) return;

   const entries = Array.from(responseCache.entries());
   entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

   const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE * 0.2));
   toRemove.forEach(([key]) => responseCache.delete(key));
};

/**
 * Generate consistent request keys
 */
const getRequestKey = (method, url, params = {}, data = {}) => {
   const paramString = typeof params === 'object' ? JSON.stringify(params) : params;
   const dataString = data ? JSON.stringify(data) : '';
   return `${method.toUpperCase()}:${url}:${paramString}:${dataString}`;
};

/**
 * Request interceptor with caching and cancellation
 */
axiosClient.interceptors.request.use((config) => {
   // Auth token
   const token = localStorage.getItem("TOKEN") || sessionStorage.getItem("TOKEN");
   if (token) {
      config.headers.Authorization = `Bearer ${token}`;
   }

   // Set up cancellation
   const controller = new AbortController();

   // Merge with existing signal if present
   if (config.signal) {
      const originalSignal = config.signal;
      originalSignal.addEventListener('abort', () => controller.abort());
   }

   config.signal = controller.signal;

   // Generate or use request key
   const method = config.method || 'get';
   const requestKey = config.requestKey ||
      getRequestKey(method, config.url, config.params, config.data);
   config.requestKey = requestKey;

   // Check cache for GET requests
   if (method === 'get' && config.cache !== false) {
      const cached = responseCache.get(requestKey);
      if (cached && Date.now() - cached.timestamp < (config.cacheTTL || CACHE_TTL)) {
         // Short-circuit if resolving from cache
         if (config.resolveFromCache) {
            return { ...config, cachedResponse: cached };
         }
      }
   }

   // Cancel existing request with same key
   axiosClient.cancelRequest(requestKey);

   // Track for cancellation
   pendingRequests.set(requestKey, controller);

   return config;
}, error => Promise.reject(error));

/**
 * Response interceptor with cache management
 */
axiosClient.interceptors.response.use(
   (response) => {
      const { config } = response;

      // Handle cached responses
      if (config.cachedResponse) {
         return {
            ...response,
            data: config.cachedResponse.data,
            headers: config.cachedResponse.headers,
            fromCache: true,
            status: 200,
         };
      }

      // Remove from pending requests
      if (config.requestKey) {
         pendingRequests.delete(config.requestKey);
      }

      // Cache successful GET responses
      if (config.method === 'get' && config.cache !== false) {
         responseCache.set(config.requestKey, {
            data: response.data,
            timestamp: Date.now(),
            headers: response.headers
         });

         trimCache();
      }

      return response;
   },
   (error) => {
      // Handle aborted requests
      if (axios.isCancel(error)) {
         return Promise.reject({
            isCanceled: true,
            message: 'Request was canceled',
            originalError: error
         });
      }

      // Clean up pending request
      if (error.config?.requestKey) {
         pendingRequests.delete(error.config.requestKey);
      }

      // Handle retries
      const config = error.config;
      if (config) {
         // Only retry network errors and timeout errors
         const shouldRetry = (
            !config.retryAttempt &&
            config.retries < (config.maxRetries || MAX_RETRIES) &&
            (error.code === 'ECONNABORTED' || !error.response)
         );

         if (shouldRetry) {
            const retryCount = (config.retries || 0) + 1;
            const retryConfig = {
               ...config,
               retries: retryCount,
               retryDelay: config.retryDelay || RETRY_DELAY
            };

            // Exponential backoff
            const delay = retryConfig.retryDelay * Math.pow(2, retryCount - 1);

            return new Promise(resolve => {
               console.log(`Retrying request (${retryCount}/${MAX_RETRIES}) after ${delay}ms`);
               setTimeout(() => resolve(axiosClient(retryConfig)), delay);
            });
         }
      }

      // Handle authentication errors
      if (error.response?.status === 401) {
         localStorage.removeItem("TOKEN");
         sessionStorage.removeItem("TOKEN");

         // Only reload if not already on login page
         if (!window.location.pathname.includes('/login')) {
            window.location.reload();
         }
      }

      return Promise.reject(error);
   }
);

/**
 * PUBLIC API METHODS
 */

/**
 * Cancel a specific request by key
 */
axiosClient.cancelRequest = (key) => {
   if (pendingRequests.has(key)) {
      const controller = pendingRequests.get(key);
      controller.abort();
      pendingRequests.delete(key);
      return true;
   }
   return false;
};

/**
 * Cancel all pending requests
 */
axiosClient.cancelAllRequests = () => {
   let count = 0;
   pendingRequests.forEach((controller) => {
      controller.abort();
      count++;
   });
   pendingRequests.clear();
   return count;
};

/**
 * Check if a request is pending
 */
axiosClient.isRequestPending = (key) => pendingRequests.has(key);

/**
 * Get all pending request keys
 */
axiosClient.getPendingRequests = () => Array.from(pendingRequests.keys());

/**
 * Clear entire response cache
 */
axiosClient.clearCache = () => {
   const size = responseCache.size;
   responseCache.clear();
   return size;
};

/**
 * Invalidate cache entries by prefix
 */
axiosClient.invalidateCache = (keyPrefix) => {
   let count = 0;
   for (const key of responseCache.keys()) {
      if (key.startsWith(keyPrefix)) {
         responseCache.delete(key);
         count++;
      }
   }
   return count;
};

/**
 * GET with built-in caching
 */
axiosClient.getWithCache = (url, params = {}, options = {}) => {
   const config = {
      ...options,
      params,
      method: 'get',
      cache: options.cache !== false,
      cacheTTL: options.cacheTTL || CACHE_TTL
   };

   const requestKey = options.requestKey || getRequestKey('get', url, params);
   config.requestKey = requestKey;

   // Fast path for cached data
   const cached = responseCache.get(requestKey);
   if (cached && Date.now() - cached.timestamp < config.cacheTTL) {
      return Promise.resolve({
         data: cached.data,
         headers: cached.headers,
         fromCache: true,
         status: 200,
         statusText: 'OK (cached)'
      });
   }

   return axiosClient(url, config);
};

/**
 * POST with cache invalidation
 */
axiosClient.postWithCancel = (url, data = {}, options = {}) => {
   const requestKey = options.requestKey || getRequestKey('post', url, {}, data);

   // Invalidate affected caches
   if (options.invalidateCache !== false) {
      const cachePrefix = options.cachePrefix || url.split('/')[1];
      axiosClient.invalidateCache(`GET:/${cachePrefix}`);
   }

   return axiosClient.post(url, data, {
      ...options,
      requestKey,
      cache: false
   });
};

/**
 * PUT with cache invalidation
 */
axiosClient.putWithCancel = (url, data = {}, options = {}) => {
   const requestKey = options.requestKey || getRequestKey('put', url, {}, data);

   // Invalidate affected caches
   if (options.invalidateCache !== false) {
      const cachePrefix = options.cachePrefix || url.split('/')[1];
      axiosClient.invalidateCache(`GET:/${cachePrefix}`);
   }

   return axiosClient.put(url, data, {
      ...options,
      requestKey,
      cache: false
   });
};

/**
 * DELETE with cache invalidation
 */
axiosClient.deleteWithCancel = (url, options = {}) => {
   const requestKey = options.requestKey || getRequestKey('delete', url);

   // Invalidate affected caches
   if (options.invalidateCache !== false) {
      const cachePrefix = options.cachePrefix || url.split('/')[1];
      axiosClient.invalidateCache(`GET:/${cachePrefix}`);
   }

   return axiosClient.delete(url, {
      ...options,
      requestKey,
      cache: false
   });
};

/**
 * Properly implemented debounced GET with promise interface
 */
axiosClient.getDebouncedWithCancel = (url, params = {}, options = {}) => {
   const debounceTime = options.debounceTime || 300;
   const requestKey = options.requestKey || `debounced:${getRequestKey('get', url, params)}`;

   // Create promise-based debounced function
   if (!debouncedFunctions.has(requestKey)) {
      let resolvePromise = null;
      let rejectPromise = null;

      // Create the debounced executor
      const debouncedExecutor = debounce(async () => {
         try {
            const response = await axiosClient.getWithCache(url, params, {
               ...options,
               requestKey: `${requestKey}:executed`
            });
            if (resolvePromise) resolvePromise(response);
         } catch (error) {
            if (rejectPromise) rejectPromise(error);
         }
      }, debounceTime);

      // Store the function and its resolver
      debouncedFunctions.set(requestKey, {
         execute: debouncedExecutor,
         setPromiseHandlers: (resolve, reject) => {
            resolvePromise = resolve;
            rejectPromise = reject;
         }
      });
   }

   // Return promise that will be resolved when the debounced function executes
   return new Promise((resolve, reject) => {
      const debouncedFn = debouncedFunctions.get(requestKey);
      debouncedFn.setPromiseHandlers(resolve, reject);
      debouncedFn.execute();
   });
};

/**
 * Clear all debounced functions
 */
axiosClient.clearDebouncedRequests = () => {
   const count = debouncedFunctions.size;
   debouncedFunctions.clear();
   return count;
};

/**
 * Clear specific debounced function
 */
axiosClient.clearDebouncedRequest = (key) => {
   return debouncedFunctions.delete(key);
};

/**
 * Batch multiple requests together with a single promise
 */
axiosClient.batchRequests = (requests, options = {}) => {
   return Promise.all(requests.map(req => {
      const method = req.method || 'get';
      const url = req.url;

      // Apply common configuration
      const requestConfig = {
         ...options,
         ...req.options
      };

      // Call appropriate method based on request
      switch (method.toLowerCase()) {
         case 'get':
            return axiosClient.getWithCache(url, req.params || {}, requestConfig);
         case 'post':
            return axiosClient.postWithCancel(url, req.data || {}, requestConfig);
         case 'put':
            return axiosClient.putWithCancel(url, req.data || {}, requestConfig);
         case 'delete':
            return axiosClient.deleteWithCancel(url, requestConfig);
         default:
            return axiosClient({
               method,
               url,
               params: req.params,
               data: req.data,
               ...requestConfig
            });
      }
   }));
};

/**
 * Get cache statistics
 */
axiosClient.getCacheStats = () => {
   return {
      size: responseCache.size,
      maxSize: MAX_CACHE_SIZE,
      pendingRequests: pendingRequests.size,
      pendingKeys: Array.from(pendingRequests.keys()),
      debouncedRequests: debouncedFunctions.size,
      oldestCacheEntry: responseCache.size > 0 ?
         Math.min(...Array.from(responseCache.values()).map(v => v.timestamp)) : null,
      newestCacheEntry: responseCache.size > 0 ?
         Math.max(...Array.from(responseCache.values()).map(v => v.timestamp)) : null
   };
};

export default axiosClient;
