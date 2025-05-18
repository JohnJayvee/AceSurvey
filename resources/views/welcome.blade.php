<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AceSurvey API Documentation</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="shortcut icon" href="{{ asset('./AceLogo.png') }}">
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
    rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/styles/atom-one-dark.min.css">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/highlight.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.7.0/languages/json.min.js"></script>

  <style>
    :root {
      /* Method colors */
      --get-color: #49cc90;
      /* Green */
      --post-color: #fca130;
      /* Orange */
      --put-color: #61affe;
      /* Blue */
      --delete-color: #f93e3e;
      /* Red */

      /* Enhanced color palette */
      --header-bg: #051b33;
      --header-gradient: linear-gradient(135deg, #051b33 0%, #0e3361 100%);
      --sidebar-bg: #f5f7f9;
      --sidebar-hover: #e9edf2;
      --border-color: #e9ecef;
      --box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
      --body-bg: #f8fafc;
      --card-bg: #ffffff;
      --text-primary: #32325d;
      --text-secondary: #6b7c93;
      --code-bg: #f6f8fa;
      --transition-slow: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      --transition-fast: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
    }

    body {
      background-color: var(--body-bg);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: var(--text-primary);
      line-height: 1.6;
      overflow-x: hidden;
      scroll-behavior: smooth;
    }

    .dark-mode {
      --header-bg: #1a1f36;
      --header-gradient: linear-gradient(135deg, #1a1f36 0%, #283452 100%);
      --sidebar-bg: #252b3b;
      --sidebar-hover: #2d344b;
      --border-color: #363c4f;
      --body-bg: #171c2c;
      --card-bg: #202737;
      --text-primary: #e2e8f0;
      --text-secondary: #a0aec0;
      --code-bg: #2d344bs;
    }

    .dark-mode #endpoint-search {
      color: white;
    }

    .site-wrapper {
      display: flex;
      min-height: 100vh;
    }

    .content-area {
      flex: 1;
      margin-left: 280px;
      transition: var(--transition-fast);
    }

    .sidebar {
      position: fixed;
      width: 280px;
      height: 100vh;
      background-color: var(--sidebar-bg);
      border-right: 1px solid var(--border-color);
      padding: 1.5rem 0;
      overflow-y: auto;
      transition: var(--transition-fast);
      z-index: 1000;
    }

    .sidebar-header {
      padding: 0 1.5rem 1.5rem;
      border-bottom: 1px solid var(--border-color);
      margin-bottom: 1.5rem;
    }

    .sidebar-header img {
      height: 40px;
      margin-bottom: 1rem;
    }

    .sidebar-nav {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sidebar-nav-item {
      margin-bottom: 0.5rem;
      transition: var(--transition-fast);
    }

    .sidebar-nav-link {
      display: block;
      padding: 0.75rem 1.5rem;
      color: var(--text-primary);
      text-decoration: none;
      font-weight: 500;
      border-left: 3px solid transparent;
      transition: var(--transition-fast);
    }

    .sidebar-nav-link:hover {
      background-color: var(--sidebar-hover);
      color: var(--text-primary);
    }

    .sidebar-nav-link.active {
      border-left-color: var(--get-color);
      background-color: var(--sidebar-hover);
    }

    .sidebar-nav-link span.method {
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.7rem;
      margin-right: 0.5rem;
      font-weight: 600;
      color: white;
    }

    .sidebar-nav-link span.method.get {
      background-color: var(--get-color);
    }

    .sidebar-nav-link span.method.post {
      background-color: var(--post-color);
    }

    .sidebar-nav-link span.method.put {
      background-color: var(--put-color);
    }

    .sidebar-nav-link span.method.delete {
      background-color: var(--delete-color);
    }

    .swagger-header {
      background: var(--header-gradient);
      color: white;
      padding: 3rem 0 2.5rem;
      box-shadow: var(--box-shadow);
      position: relative;
    }

    .swagger-header::after {
      content: '';
      position: absolute;
      bottom: -5px;
      left: 0;
      right: 0;
      height: 10px;
      background: linear-gradient(135deg,
          rgba(73, 204, 144, 0.7) 0%,
          rgba(97, 175, 254, 0.7) 50%,
          rgba(252, 161, 48, 0.7) 100%);
      z-index: 1;
    }

    .swagger-header h1 {
      font-weight: 700;
      font-size: 2.5rem;
      margin-bottom: 0.75rem;
      background: linear-gradient(90deg, #ffffff, #e5e5e5);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    .swagger-header p {
      opacity: 0.85;
      font-size: 1.2rem;
      max-width: 600px;
    }

    .api-version {
      display: inline-block;
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      font-size: 0.9rem;
      margin-left: 1rem;
      vertical-align: middle;
    }

    .theme-toggle {
      position: fixed;
      top: 1rem;
      right: 1rem;
      z-index: 1001;
      background-color: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 50%;
      width: 42px;
      height: 42px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      box-shadow: var(--box-shadow);
      transition: var(--transition-fast);
    }

    .theme-toggle:hover {
      transform: translateY(-2px);
    }

    .theme-toggle i {
      color: var(--text-primary);
      font-size: 1.2rem;
    }

    .endpoint {
      border: 1px solid var(--border-color);
      border-radius: 12px;
      margin-bottom: 1.25rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
      transition: var(--transition-slow);
      overflow: hidden;
      background-color: var(--card-bg);
    }

    .endpoint:hover {
      box-shadow: var(--box-shadow);
      transform: translateY(-2px);
    }

    .endpoint-header {
      padding: 1rem 1.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      position: relative;
      border-bottom: 1px solid transparent;
      transition: var(--transition-fast);
    }

    .endpoint-header:hover {
      background-color: rgba(0, 0, 0, 0.01);
    }

    .endpoint-header::after {
      content: '\f107';
      font-family: 'Font Awesome 6 Free';
      font-weight: 900;
      position: absolute;
      right: 20px;
      transition: transform 0.3s ease;
      color: var(--text-secondary);
      font-size: 1.1rem;
    }

    .endpoint-header.active::after {
      transform: rotate(180deg);
    }

    .get .method-badge {
      background-color: var(--get-color);
    }

    .post .method-badge {
      background-color: var(--post-color);
    }

    .put .method-badge,
    .patch .method-badge {
      background-color: var(--put-color);
    }

    .delete .method-badge {
      background-color: var(--delete-color);
    }

    .method-badge {
      padding: 0.4rem 0.75rem;
      border-radius: 6px;
      font-weight: 600;
      min-width: 80px;
      display: inline-block;
      text-align: center;
      font-size: 0.85rem;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.08);
      color: white;
    }

    .uri-path {
      font-family: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
      margin-left: 1.25rem;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-primary);
    }

    .endpoint-content {
      padding: 1.5rem;
      background-color: var(--card-bg);
      border-top: 1px solid var(--border-color);
      display: none;
      animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .endpoint-content .row {
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.05);
    }

    .endpoint-content .row:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }

    .endpoint-content strong {
      font-weight: 600;
      color: var(--text-primary);
    }

    .section-title {
      font-weight: 600;
      margin-bottom: 1rem;
      color: var(--text-primary);
    }

    .param-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      margin-bottom: 1.5rem;
    }

    .param-table th {
      text-align: left;
      font-weight: 600;
      padding: 0.75rem 1rem;
      border-bottom: 2px solid var(--border-color);
      color: var(--text-primary);
      background-color: var(--sidebar-bg);
    }

    .param-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid var(--border-color);
      color: var(--text-secondary);
    }

    .param-table tr:last-child td {
      border-bottom: none;
    }

    .param-name {
      font-family: 'JetBrains Mono', monospace;
      font-weight: 500;
      color: var(--text-primary);
    }

    .param-required {
      color: var(--delete-color);
      font-weight: 500;
      margin-left: 0.25rem;
    }

    .param-type {
      display: inline-block;
      padding: 0.2rem 0.5rem;
      border-radius: 4px;
      font-size: 0.75rem;
      background-color: var(--code-bg);
      color: var(--text-secondary);
      font-family: 'JetBrains Mono', monospace;
    }

    .code-sample {
      background-color: var(--code-bg);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
      position: relative;
      overflow: hidden;
    }

    .code-sample-header {
      margin-bottom: 0.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .code-sample-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-secondary);
    }

    .code-sample pre {
      margin: 0;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      line-height: 1.5;
      color: var(--text-primary);
      max-height: 300px;
      overflow-y: auto;
    }

    .hljs {
      background-color: transparent !important;
      padding: 0 !important;
    }

    .group-header {
      margin: 2.5rem 0 1.5rem;
      position: relative;
      display: flex;
      align-items: center;
      padding-bottom: 0.75rem;
      border-bottom: 2px solid var(--border-color);
      scroll-margin-top: 100px;
    }

    .group-header h3 {
      font-weight: 700;
      font-size: 1.5rem;
      margin-bottom: 0;
      color: var(--text-primary);
    }

    .group-header .badge {
      margin-left: 0.75rem;
      background-color: var(--sidebar-hover);
      color: var(--text-secondary);
      font-weight: 500;
      padding: 0.4rem 0.8rem;
      font-size: 0.85rem;
    }

    .copy-btn {
      background: none;
      border: none;
      color: var(--text-secondary);
      cursor: pointer;
      transition: var(--transition-fast);
      font-size: 0.9rem;
      padding: 0.35rem 0.6rem;
      border-radius: 4px;
    }

    .copy-btn:hover {
      color: var(--text-primary);
      background-color: rgba(0, 0, 0, 0.03);
    }

    .tab-container {
      margin-bottom: 1.5rem;
    }

    .tab-nav {
      display: flex;
      list-style: none;
      padding: 0;
      margin: 0 0 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .tab-nav-item {
      margin-right: 0.5rem;
    }

    .tab-nav-link {
      display: block;
      padding: 0.75rem 1.25rem;
      color: var(--text-secondary);
      text-decoration: none;
      border-bottom: 2px solid transparent;
      transition: var(--transition-fast);
      font-weight: 500;
    }

    .tab-nav-link:hover {
      color: var(--text-primary);
    }

    .tab-nav-link.active {
      color: var(--text-primary);
      border-bottom-color: var(--get-color);
    }

    .tab-content {
      display: none;
    }

    .tab-content.active {
      display: block;
      animation: fadeIn 0.3s ease;
    }

    .try-btn {
      background-color: var(--get-color);
      color: white;
      border: none;
      padding: 0.5rem 1.25rem;
      border-radius: 6px;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition-fast);
      margin-left: auto;
    }

    .try-btn:hover {
      background-color: #3eb57e;
      transform: translateY(-2px);
    }

    .response-container {
      margin-top: 1.5rem;
      display: none;
    }

    .response-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .response-status {
      display: inline-flex;
      align-items: center;
      font-weight: 600;
    }

    .status-code {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
      margin-right: 0.5rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
    }

    .status-code.success {
      background-color: var(--get-color);
      color: white;
    }

    .status-code.error {
      background-color: var(--delete-color);
      color: white;
    }

    /* Search bar */
    .search-container {
      margin: 1.5rem 0 2.5rem;
      position: relative;
    }

    .search-container .search-icon {
      position: absolute;
      left: 1rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-secondary);
    }

    #endpoint-search {
      padding: 0.85rem 1rem 0.85rem 2.75rem;
      border-radius: 12px;
      border: 1px solid var(--border-color);
      width: 100%;
      font-size: 1rem;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
      transition: var(--transition-fast);
      background-color: var(--card-bg);
    }

    #endpoint-search:focus {
      outline: none;
      border-color: #a6c8ff;
      box-shadow: 0 0 0 4px rgba(97, 175, 254, 0.1);
    }

    .badge.bg-secondary {
      background-color: var(--sidebar-hover) !important;
      color: var(--text-secondary);
      font-weight: 500;
      padding: 0.4em 0.6em;
      border: 1px solid var(--border-color);
    }

    .no-results {
      display: none;
      padding: 2rem;
      text-align: center;
      color: var(--text-secondary);
      background-color: var(--card-bg);
      border-radius: 12px;
      border: 1px dashed var(--border-color);
      margin: 2rem 0;
    }

    .no-results i {
      font-size: 2rem;
      margin-bottom: 1rem;
      color: #c8c8c8;
    }

    .auth-info {
      background-color: var(--sidebar-bg);
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .auth-info-header {
      display: flex;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .auth-info-header i {
      margin-right: 0.5rem;
      color: var(--put-color);
    }

    .auth-info-title {
      font-weight: 600;
      margin: 0;
      color: var(--text-primary);
    }

    .auth-info-content {
      color: var(--text-secondary);
      font-size: 0.9rem;
    }

    .footer {
      background-color: var(--card-bg);
      padding: 2rem 0;
      text-align: center;
      color: var(--text-secondary);
      margin-top: 3rem;
      border-top: 1px solid var(--border-color);
    }

    .footer p {
      margin-bottom: 0;
    }

    @media (max-width: 992px) {
      .sidebar {
        transform: translateX(-100%);
        box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);
      }

      .sidebar.active {
        transform: translateX(0);
      }

      .content-area {
        margin-left: 0;
      }

      .mobile-menu-toggle {
        display: flex !important;
        /* Force show only on small screens */
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 1001;
        background-color: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 50%;
        width: 42px;
        height: 42px;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: var(--box-shadow);
        transition: var(--transition-fast);
      }

      .mobile-menu-toggle i {
        color: var(--text-primary);
        font-size: 1.2rem;
      }

      .swagger-header h1 {
        font-size: 2rem;
      }

      .swagger-header p {
        font-size: 1rem;
      }
    }

    @media (max-width: 768px) {
      .endpoint-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .uri-path {
        margin-left: 0;
        margin-top: 0.5rem;
        word-break: break-all;
      }

      .endpoint-header::after {
        top: 1rem;
        right: 1rem;
      }

      .copy-endpoint-btn {
        position: absolute;
        top: 1rem;
        right: 3rem;
      }

      .swagger-header {
        padding: 2rem 0 1.75rem;
      }

      .tab-nav {
        flex-wrap: wrap;
      }

      .tab-nav-item {
        margin-bottom: 0.5rem;
      }
    }

    /* Add this rule at the beginning of your style section */
    .mobile-menu-toggle {
      display: none;
      /* Hide by default on all screens */
    }

    /* Keep your existing media query rule */
    @media (max-width: 992px) {
      /* ...other media query styles... */

      .mobile-menu-toggle {
        display: flex !important;
        /* Only show on small screens */
        /* Other existing properties... */
      }

      /* ...other media query styles... */
    }
  </style>
</head>

<body>
  <div class="theme-toggle" title="Toggle dark mode">
    <i class="fas fa-moon"></i>
  </div>

  <div class="mobile-menu-toggle" title="Toggle menu">
    <i class="fas fa-bars"></i>
  </div>

  <div class="site-wrapper">
    <aside class="sidebar">
      <div class="sidebar-header">
        <img src="{{ asset('./AceLogo.png') }}" alt="AceSurvey Logo">
        <h5>AceSurvey API</h5>
        <p class="mb-0 text-secondary">Documentation</p>
      </div>

      <ul class="sidebar-nav">
        <li class="sidebar-nav-item">
          <a href="#introduction" class="sidebar-nav-link active">Introduction</a>
        </li>
        <li class="sidebar-nav-item">
          <a href="#authentication" class="sidebar-nav-link">Authentication</a>
        </li>

        @php
          $routeCollection = collect($routes->getRoutes());
          $groupedRoutes = $routeCollection->groupBy(function ($route) {
              $uri = $route->uri();
              return explode('/', $uri)[0] === '' ? 'root' : explode('/', $uri)[0];
          });
        @endphp

        @foreach ($groupedRoutes as $group => $routes)
          <li class="sidebar-nav-item">
            <a href="#{{ $group }}" class="sidebar-nav-link">{{ ucfirst($group) }}</a>
          </li>
        @endforeach
      </ul>
    </aside>

    <div class="content-area">
      <div class="swagger-header">
        <div class="container">
          <h1>AceSurvey API <span class="api-version">v1.0</span></h1>
          <p>Comprehensive documentation for the AceSurvey API with examples and testing tools</p>
        </div>
      </div>

      <div class="container">
        <div class="search-container">
          <i class="fas fa-search search-icon"></i>
          <input type="text" id="endpoint-search" placeholder="Search endpoints by path or method...">
        </div>

        <div class="no-results">
          <i class="far fa-folder-open"></i>
          <h4>No matching endpoints found</h4>
          <p>Try adjusting your search terms</p>
        </div>

        <section id="introduction">
          <div class="group-header">
            <h3>Introduction</h3>
          </div>

          <div class="endpoint">
            <div class="endpoint-content" style="display: block">
              <p>Welcome to the AceSurvey API documentation. This API allows you to manage surveys, collect responses,
                and analyze results. The API uses REST principles and returns responses in JSON format.</p>

              <div class="section-title">Base URL</div>
              <div class="code-sample">
                <code>{{ url('/api') }}</code>
              </div>

              <div class="section-title">Response Format</div>
              <p>All responses are returned in JSON format with appropriate HTTP status codes.</p>

              <div class="code-sample">
                <div class="code-sample-header">
                  <span class="code-sample-title">Success Response</span>
                  <button class="copy-btn"><i class="far fa-copy"></i></button>
                </div>
                <pre><code class="language-json">{
  "data": {},
  "message": "Operation successful"
}</code></pre>
              </div>

              <div class="code-sample">
                <div class="code-sample-header">
                  <span class="code-sample-title">Error Response</span>
                  <button class="copy-btn"><i class="far fa-copy"></i></button>
                </div>
                <pre><code class="language-json">{
  "message": "Error message",
  "errors": {
    "field": [
      "Error description"
    ]
  }
}</code></pre>
              </div>
            </div>
          </div>
        </section>

        <section id="authentication">
          <div class="group-header">
            <h3>Authentication</h3>
          </div>

          <div class="endpoint">
            <div class="endpoint-content" style="display: block">
              <p>AceSurvey API uses Laravel Sanctum for authentication. Most endpoints require authentication via a
                Bearer token.</p>

              <div class="auth-info">
                <div class="auth-info-header">
                  <i class="fas fa-shield-alt"></i>
                  <h5 class="auth-info-title">Bearer Authentication</h5>
                </div>
                <div class="auth-info-content">
                  <p>Add the following header to your requests:</p>
                  <div class="code-sample">
                    <code>Authorization: Bearer {your_token}</code>
                  </div>
                  <p>You can obtain a token by using the <code>/api/login</code> endpoint.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        @foreach ($groupedRoutes as $group => $routes)
          <section id="{{ $group }}">
            <div class="group-header">
              <h3>{{ ucfirst($group) }}</h3>
              <span class="badge rounded-pill">{{ count($routes) }}</span>
            </div>

            @foreach ($routes as $route)
              @php
                $method = collect($route->methods())->first(function ($method) {
                    return $method !== 'HEAD';
                });

                $needsAuth = strpos($route->getActionName(), 'auth:sanctum') !== false;
                $routeName = $route->getName() ?: 'Unnamed';
                $actionName = $route->getActionName();

                // Extract controller and method names
                preg_match('/([^\\\\]+)@([^\\\\]+)$/', $actionName, $matches);
                $controllerName = $matches[1] ?? '';
                $methodName = $matches[2] ?? '';

                // Generate example request/response
                if ($method === 'GET') {
                    $requestExample = '{
  // No request body for GET
}';
                    $responseExample = '{
  "data": {
    "id": 1,
    "name": "Example name",
    "created_at": "2023-01-01T00:00:00.000000Z",
    "updated_at": "2023-01-01T00:00:00.000000Z"
  }
}';
                } else {
                    $requestExample = '{
  "login": "Example login",
  "password": "Example password"
}';
                    $responseExample = '{
  "data": {
    "id": 1,
    "name": "Example name",
    "description": "Example description",
    "created_at": "2023-01-01T00:00:00.000000Z",
    "updated_at": "2023-01-01T00:00:00.000000Z"
  },
  "message": "Operation successful"
}';
                }
              @endphp

              <div class="endpoint"
                id="endpoint-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}">
                <div class="endpoint-header {{ strtolower($method) }}">
                  <span class="method-badge">{{ $method }}</span>
                  <span class="uri-path">{{ $route->uri() }}</span>
                  <button class="copy-btn copy-endpoint-btn" data-endpoint="{{ $route->uri() }}" title="Copy endpoint">
                    <i class="far fa-copy"></i>
                  </button>
                </div>

                <div class="endpoint-content">
                  <div class="row">
                    <div class="col-md-3">
                      <strong>Route Name:</strong>
                    </div>
                    <div class="col-md-9">
                      {{ $routeName }}
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-3">
                      <strong>Controller Action:</strong>
                    </div>
                    <div class="col-md-9">
                      {{ $actionName }}
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-3">
                      <strong>Authentication:</strong>
                    </div>
                    <div class="col-md-9">
                      @if ($needsAuth)
                        <span class="badge bg-primary">Required</span>
                      @else
                        <span class="badge bg-secondary">Not Required</span>
                      @endif
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-3">
                      <strong>HTTP Methods:</strong>
                    </div>
                    <div class="col-md-9">
                      @foreach ($route->methods() as $m)
                        @if ($m !== 'HEAD')
                          <span class="badge bg-secondary me-1">{{ $m }}</span>
                        @endif
                      @endforeach
                    </div>
                  </div>

                  <div class="tab-container">
                    <ul class="tab-nav">
                      <li class="tab-nav-item">
                        <a href="#" class="tab-nav-link active"
                          data-tab="details-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}">Details</a>
                      </li>
                      <li class="tab-nav-item">
                        <a href="#" class="tab-nav-link"
                          data-tab="try-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}">Try
                          It</a>
                      </li>
                      <li class="tab-nav-item">
                        <a href="#" class="tab-nav-link"
                          data-tab="code-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}">Code
                          Examples</a>
                      </li>
                    </ul>

                    <div class="tab-content active"
                      id="details-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}">
                      @if (strpos($route->uri(), '{') !== false)
                        <div class="section-title">URL Parameters</div>
                        <table class="param-table">
                          <thead>
                            <tr>
                              <th>Parameter</th>
                              <th>Type</th>
                              <th>Description</th>
                            </tr>
                          </thead>
                          <tbody>
                            @php
                              preg_match_all('/{([^}]+)}/', $route->uri(), $parameters);
                            @endphp

                            @foreach ($parameters[1] as $param)
                              <tr>
                                <td>
                                  <span class="param-name">{{ $param }}</span>
                                  <span class="param-required">*</span>
                                </td>
                                <td><span class="param-type">string</span></td>
                                <td>The {{ str_replace('_', ' ', $param) }} identifier</td>
                              </tr>
                            @endforeach
                          </tbody>
                        </table>
                      @endif

                      @if ($method !== 'GET')
                        <div class="section-title">Request Body</div>
                        <div class="code-sample">
                          <div class="code-sample-header">
                            <span class="code-sample-title">Example Request</span>
                            <button class="copy-btn"><i class="far fa-copy"></i></button>
                          </div>
                          <pre><code class="language-json">{{ $requestExample }}</code></pre>
                        </div>
                      @endif

                      <div class="section-title">Response</div>
                      <div class="code-sample">
                        <div class="code-sample-header">
                          <span class="code-sample-title">Example Response</span>
                          <button class="copy-btn"><i class="far fa-copy"></i></button>
                        </div>
                        <pre><code class="language-json">{{ $responseExample }}</code></pre>
                      </div>
                    </div>

                    <div class="tab-content"
                      id="try-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}">
                      <div class="section-title">Test Endpoint</div>

                      @if ($needsAuth)
                        <div class="mb-3 form-group">
                          <label
                            for="auth-token-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}"
                            class="form-label">API Token</label>
                          <input type="text" class="form-control"
                            id="auth-token-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}"
                            placeholder="Bearer token">
                          <div class="form-text">Enter your authentication token (without "Bearer" prefix)</div>
                        </div>
                      @endif

                      @if (strpos($route->uri(), '{') !== false)
                        <div class="section-title">URL Parameters</div>

                        @php
                          preg_match_all('/{([^}]+)}/', $route->uri(), $parameters);
                        @endphp

                        @foreach ($parameters[1] as $param)
                          <div class="mb-3 form-group">
                            <label
                              for="param-{{ $param }}-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}"
                              class="form-label">{{ ucfirst(str_replace('_', ' ', $param)) }}</label>
                            <input type="text" class="form-control"
                              id="param-{{ $param }}-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}"
                              placeholder="Enter {{ str_replace('_', ' ', $param) }}">
                          </div>
                        @endforeach
                      @endif

                      @if ($method !== 'GET')
                        <div class="section-title">Request Body</div>
                        <div class="mb-3 form-group">
                          <textarea class="form-control"
                            id="request-body-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}" rows="5"
                            placeholder="Enter request body JSON">{{ $requestExample }}</textarea>
                        </div>
                      @endif

                      <button class="try-btn" data-endpoint="{{ $route->uri() }}"
                        data-method="{{ $method }}">
                        <i class="fas fa-play me-2"></i> Send Request
                      </button>

                      <div class="response-container">
                        <div class="response-header">
                          <div class="response-status">
                            <span class="status-code">Status</span>
                            <span class="status-text">Waiting for response...</span>
                          </div>
                          <span class="response-time"></span>
                        </div>

                        <div class="code-sample">
                          <div class="code-sample-header">
                            <span class="code-sample-title">Response</span>
                            <button class="copy-btn"><i class="far fa-copy"></i></button>
                          </div>
                          <pre><code class="language-json response-body"></code></pre>
                        </div>
                      </div>
                    </div>

                    <div class="tab-content"
                      id="code-{{ str_replace(['/', '{', '}', ':'], ['-', '', '', ''], $route->uri()) }}">
                      <div class="section-title">JavaScript (Fetch)</div>
                      <div class="code-sample">
                        <div class="code-sample-header">
                          <span class="code-sample-title">Example Code</span>
                          <button class="copy-btn"><i class="far fa-copy"></i></button>
                        </div>
                        <pre><code class="language-javascript">const response = await fetch('{{ url('/api/' . $route->uri()) }}', {
  method: '{{ $method }}',
  headers: {
    'Content-Type': 'application/json',@if ($needsAuth)
'Authorization': 'Bearer YOUR_API_TOKEN',
@endif
  },@if ($method !== 'GET')
body: JSON.stringify({{ str_replace("\n", "\n  ", $requestExample) }}),
@endif
});

const data = await response.json();
console.log(data);</code></pre>
                      </div>

                      <div class="section-title">PHP (cURL)</div>
                      <div class="code-sample">
                        <div class="code-sample-header">
                          <span class="code-sample-title">Example Code</span>
                          <button class="copy-btn"><i class="far fa-copy"></i></button>
                        </div>
                        <pre><code class="language-php">$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "{{ url('/api/' . $route->uri()) }}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_ENCODING => "",
  CURLOPT_MAXREDIRS => 10,
  CURLOPT_TIMEOUT => 30,
  CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
  CURLOPT_CUSTOMREQUEST => "{{ $method }}",@if ($method !== 'GET')
CURLOPT_POSTFIELDS => json_encode({{ str_replace("\n", "\n  ", $requestExample) }}),
@endif
  CURLOPT_HTTPHEADER => [
    "Content-Type: application/json",@if ($needsAuth)
"Authorization: Bearer YOUR_API_TOKEN",
@endif
  ],
]);

$response = curl_exec($curl);
$err = curl_error($curl);

curl_close($curl);

if ($err) {
  echo "cURL Error #:" . $err;
} else {
  echo $response;
}</code></pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            @endforeach
          </section>
        @endforeach
      </div>

      <footer class="footer">
        <div class="container">
          <p>© {{ date('Y') }} AceSurvey API Documentation</p>
        </div>
      </footer>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // Syntax highlighting
      document.querySelectorAll('pre code').forEach(block => {
        hljs.highlightElement(block);
      });

      // Dark mode toggle
      const themeToggle = document.querySelector('.theme-toggle');
      const htmlElement = document.documentElement;

      // Check for saved theme preference or prefer-color-scheme
      const savedTheme = localStorage.getItem('theme');
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

      if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        htmlElement.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
      }

      themeToggle.addEventListener('click', () => {
        htmlElement.classList.toggle('dark-mode');

        if (htmlElement.classList.contains('dark-mode')) {
          localStorage.setItem('theme', 'dark');
          themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
          localStorage.setItem('theme', 'light');
          themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        }
      });

      // Mobile menu toggle
      const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
      const sidebar = document.querySelector('.sidebar');

      mobileMenuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
      });

      // Sidebar navigation
      document.querySelectorAll('.sidebar-nav-link').forEach(link => {
        link.addEventListener('click', () => {
          document.querySelectorAll('.sidebar-nav-link').forEach(l => l.classList.remove('active'));
          link.classList.add('active');

          if (window.innerWidth < 992) {
            sidebar.classList.remove('active');
          }
        });
      });

      // Smooth scrolling for sidebar links
      document.querySelectorAll('.sidebar-nav-link').forEach(link => {
        link.addEventListener('click', e => {
          e.preventDefault();
          const targetId = link.getAttribute('href');
          const targetElement = document.querySelector(targetId);

          window.scrollTo({
            top: targetElement.offsetTop - 20,
            behavior: 'smooth'
          });
        });
      });

      // Toggle endpoint content on header click
      document.querySelectorAll('.endpoint-header').forEach(header => {
        header.addEventListener('click', (event) => {
          // Don't toggle if copy button was clicked
          if (event.target.closest('.copy-btn')) return;

          const content = header.nextElementSibling;
          const isDisplayed = getComputedStyle(content).display !== 'none';

          // Close any other open endpoints
          document.querySelectorAll('.endpoint-content').forEach(el => {
            if (el !== content && getComputedStyle(el).display !== 'none') {
              el.style.display = 'none';
              el.previousElementSibling.classList.remove('active');
            }
          });

          // Toggle current endpoint
          content.style.display = isDisplayed ? 'none' : 'block';
          header.classList.toggle('active', !isDisplayed);
        });
      });

      // Tab navigation
      document.querySelectorAll('.tab-nav-link').forEach(tab => {
        tab.addEventListener('click', e => {
          e.preventDefault();

          const tabContainer = tab.closest('.tab-container');
          const tabId = tab.getAttribute('data-tab');

          // Deactivate all tabs
          tabContainer.querySelectorAll('.tab-nav-link').forEach(t => t.classList.remove('active'));
          tabContainer.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

          // Activate the clicked tab
          tab.classList.add('active');
          document.getElementById(tabId).classList.add('active');
        });
      });

      // Copy functionality
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();

          let textToCopy;

          if (btn.closest('.copy-endpoint-btn')) {
            textToCopy = btn.getAttribute('data-endpoint');
          } else if (btn.closest('.code-sample')) {
            const codeElement = btn.closest('.code-sample').querySelector('code');
            textToCopy = codeElement.textContent;
          }

          if (textToCopy) {
            navigator.clipboard.writeText(textToCopy);

            // Show feedback
            const originalHTML = btn.innerHTML;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            setTimeout(() => {
              btn.innerHTML = originalHTML;
            }, 1500);
          }
        });
      });

      // Try It functionality
      document.querySelectorAll('.try-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const endpoint = btn.getAttribute('data-endpoint');
          const method = btn.getAttribute('data-method');
          const endpointId = `endpoint-${endpoint.replace(/[\/{}:]/g, '-')}`;

          // Get values from the form
          //   let url = '{{ url('/api') }}/' + endpoint;
          let url = endpoint;

          const responseContainer = btn.nextElementSibling;
          const responseBody = responseContainer.querySelector('.response-body');
          const statusCode = responseContainer.querySelector('.status-code');
          const statusText = responseContainer.querySelector('.status-text');
          const responseTime = responseContainer.querySelector('.response-time');

          // Replace URL parameters
          if (url.includes('{')) {
            const paramMatches = url.match(/{([^}]+)}/g);
            if (paramMatches) {
              paramMatches.forEach(match => {
                const paramName = match.replace(/{|}/g, '');
                const paramInput = document.getElementById(
                  `param-${paramName}-${endpoint.replace(/[\/{}:]/g, '-')}`);
                if (paramInput && paramInput.value) {
                  url = url.replace(match, paramInput.value);
                }
              });
            }
          }

          // Show response container
          responseContainer.style.display = 'block';
          statusCode.textContent = 'Status';
          statusCode.className = 'status-code';
          statusText.textContent = 'Sending request...';
          responseBody.textContent = '';
          responseTime.textContent = '';

          try {
            const headers = {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            };

            // Add auth token if provided
            const authTokenInput = document.getElementById(
              `auth-token-${endpoint.replace(/[\/{}:]/g, '-')}`);
            if (authTokenInput && authTokenInput.value) {
              headers['Authorization'] = `Bearer ${authTokenInput.value}`;
            }

            const requestOptions = {
              method: method,
              headers: headers
            };

            // Add request body for non-GET requests
            if (method !== 'GET') {
              const requestBodyInput = document.getElementById(
                `request-body-${endpoint.replace(/[\/{}:]/g, '-')}`);
              if (requestBodyInput && requestBodyInput.value) {
                try {
                  requestOptions.body = requestBodyInput.value;
                } catch (e) {
                  statusText.textContent = 'Invalid JSON in request body';
                  return;
                }
              }
            }

            const startTime = performance.now();
            const response = await fetch(url, requestOptions);
            const endTime = performance.now();

            const responseData = await response.json();

            // Update response UI
            statusCode.textContent = response.status;
            statusCode.classList.add(response.ok ? 'success' : 'error');
            statusText.textContent = response.statusText || (response.ok ? 'OK' : 'Error');
            responseTime.textContent = `${Math.round(endTime - startTime)}ms`;

            responseBody.textContent = JSON.stringify(responseData, null, 2);
            hljs.highlightElement(responseBody);
          } catch (error) {
            statusCode.textContent = 'Error';
            statusCode.classList.add('error');
            statusText.textContent = error.message || 'Network error';
            responseBody.textContent = JSON.stringify({
              error: error.message || 'Network error'
            }, null, 2);
            hljs.highlightElement(responseBody);
          }
        });
      });

      // Search functionality
      const searchInput = document.getElementById('endpoint-search');
      const noResultsMsg = document.querySelector('.no-results');

      if (searchInput && noResultsMsg) {
        searchInput.addEventListener('input', () => {
          const searchTerm = searchInput.value.toLowerCase().trim();
          let foundResults = false;

          // Only hide dynamic API endpoint sections, not Introduction or Authentication
          if (searchTerm === '') {
            // Show everything when search is empty
            document.querySelectorAll('section').forEach(section => {
              section.style.display = 'block';
            });
            document.querySelectorAll('.endpoint').forEach(endpoint => {
              endpoint.style.display = 'block';
            });
            noResultsMsg.style.display = 'none';
            return;
          }

          // Hide introduction and authentication sections when searching
          document.getElementById('introduction').style.display = 'none';
          document.getElementById('authentication').style.display = 'none';

          // Process each endpoint section
          document.querySelectorAll('section[id]:not(#introduction):not(#authentication)').forEach(section => {
            const sectionEndpoints = section.querySelectorAll('.endpoint');
            let sectionHasVisibleEndpoints = false;

            sectionEndpoints.forEach(endpoint => {
              const uriElement = endpoint.querySelector('.uri-path');
              const methodElement = endpoint.querySelector('.method-badge');

              if (!uriElement || !methodElement) return;

              const uri = uriElement.textContent.toLowerCase();
              const method = methodElement.textContent.toLowerCase();

              // Check if endpoint matches search term
              const routeName = endpoint.querySelector('.endpoint-content')?.textContent.toLowerCase() ||
                '';
              const matches = uri.includes(searchTerm) ||
                method.includes(searchTerm) ||
                routeName.includes(searchTerm);

              endpoint.style.display = matches ? 'block' : 'none';

              if (matches) {
                foundResults = true;
                sectionHasVisibleEndpoints = true;
              }
            });

            // Show/hide the section based on if it has visible endpoints
            section.style.display = sectionHasVisibleEndpoints ? 'block' : 'none';
          });

          // Show/hide no results message
          noResultsMsg.style.display = !foundResults && searchTerm ? 'block' : 'none';
        });
      }

      // Update sidebar method badges
      document.querySelectorAll('.endpoint-header').forEach(header => {
        const method = header.classList[1]; // get, post, etc.
        const path = header.querySelector('.uri-path').textContent;
        const endpointId = header.closest('.endpoint').id;

        // Find or create the sidebar link for this endpoint
        const sidebarItems = document.querySelectorAll('.sidebar-nav-link');
        sidebarItems.forEach(item => {
          if (item.getAttribute('href') === `#${endpointId}`) {
            // Add method badge
            const methodBadge = document.createElement('span');
            methodBadge.className = `method ${method}`;
            methodBadge.textContent = method.toUpperCase();
            item.insertBefore(methodBadge, item.firstChild);
          }
        });
      });
    });
  </script>
</body>

</html>
