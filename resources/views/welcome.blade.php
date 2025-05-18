<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Documentation</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="shortcut icon" href="{{ asset('./AceLogo.png') }}">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">

    <style>
        :root {
            /* Method colors as requested */
            --get-color: #49cc90;   /* Green */
            --post-color: #fca130;  /* Orange */
            --put-color: #61affe;   /* Blue */
            --delete-color: #f93e3e; /* Red */

            /* Enhanced color palette */
            --header-bg: #051b33;
            --header-gradient: linear-gradient(135deg, #051b33 0%, #0e3361 100%);
            --sidebar-bg: #f0f4f8;
            --border-color: #e9ecef;
            --box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
            --body-bg: #f8fafc;
            --card-bg: #ffffff;
            --text-primary: #32325d;
            --text-secondary: #6b7c93;
            --transition-slow: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            --transition-fast: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
        }

        body {
            background-color: var(--body-bg);
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            color: var(--text-primary);
            line-height: 1.6;
            padding-bottom: 3rem;
        }

        .swagger-header {
            background: var(--header-gradient);
            color: white;
            padding: 3rem 0 2.5rem;
            box-shadow: var(--box-shadow);
            position: relative;
            margin-bottom: 2.5rem;
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
            color: #fff;
        }

        .post .method-badge {
            background-color: var(--post-color);
            color: #fff;
        }

        .put .method-badge, .patch .method-badge {
            background-color: var(--put-color);
            color: #fff;
        }

        .delete .method-badge {
            background-color: var(--delete-color);
            color: #fff;
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
            from { opacity: 0; transform: translateY(-5px); }
            to { opacity: 1; transform: translateY(0); }
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

        .group-header {
            margin: 2.5rem 0 1.5rem;
            position: relative;
            display: flex;
            align-items: center;
            padding-bottom: 0.75rem;
            border-bottom: 2px solid var(--border-color);
        }

        .group-header h3 {
            font-weight: 700;
            font-size: 1.5rem;
            margin-bottom: 0;
            color: var(--text-primary);
        }

        .group-header .badge {
            margin-left: 0.75rem;
            background-color: #e9ecef;
            color: var(--text-secondary);
            font-weight: 500;
            padding: 0.4rem 0.8rem;
            font-size: 0.85rem;
        }

        .copy-btn {
            margin-left: auto;
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

        /* Badge styles */
        .badge.bg-secondary {
            background-color: #f1f5f9 !important;
            color: var(--text-secondary);
            font-weight: 500;
            padding: 0.4em 0.6em;
            border: 1px solid #e9ecef;
        }

        /* No results message */
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

            .copy-btn {
                position: absolute;
                top: 1rem;
                right: 3rem;
            }

            .swagger-header {
                padding: 2rem 0 1.75rem;
            }

            .swagger-header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="swagger-header">
        <div class="container">
            <h1>API Documentation</h1>
            <p>Comprehensive documentation for all available API endpoints in AceSurvey</p>
        </div>
    </div>

    <div class="container">
        <div class="search-container">
            <i class="fas fa-search search-icon"></i>
            <input type="text" id="endpoint-search" placeholder="Search endpoints by path or method...">
        </div>

        <!-- No results message -->
        <div class="no-results">
            <i class="far fa-folder-open"></i>
            <h4>No matching endpoints found</h4>
            <p>Try adjusting your search terms</p>
        </div>

        @php
            $routeCollection = collect($routes->getRoutes());
            $groupedRoutes = $routeCollection->groupBy(function ($route) {
                $uri = $route->uri();
                return explode('/', $uri)[0] === '' ? 'root' : explode('/', $uri)[0];
            });
        @endphp

        @foreach($groupedRoutes as $group => $routes)
            <div class="endpoint-group" data-group="{{ $group }}">
                <div class="group-header">
                    <h3>{{ ucfirst($group) }}</h3>
                    <span class="badge rounded-pill">{{ count($routes) }}</span>
                </div>

                @foreach($routes as $route)
                    <div class="endpoint">
                        @php
                            $method = collect($route->methods())->first(function($method) {
                                return $method !== 'HEAD';
                            });
                        @endphp

                        <div class="endpoint-header {{ strtolower($method) }}">
                            <span class="method-badge">{{ $method }}</span>
                            <span class="uri-path">{{ $route->uri() }}</span>
                            <button class="copy-btn" data-endpoint="{{ $route->uri() }}" title="Copy endpoint">
                                <i class="far fa-copy"></i>
                            </button>
                        </div>

                        <div class="endpoint-content">
                            <div class="row">
                                <div class="col-md-3">
                                    <strong>Route Name:</strong>
                                </div>
                                <div class="col-md-9">
                                    {{ $route->getName() ?: 'Unnamed' }}
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-3">
                                    <strong>Controller Action:</strong>
                                </div>
                                <div class="col-md-9">
                                    {{ $route->getActionName() }}
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-3">
                                    <strong>HTTP Methods:</strong>
                                </div>
                                <div class="col-md-9">
                                    @foreach($route->methods() as $m)
                                        @if($m !== 'HEAD')
                                            <span class="badge bg-secondary me-1">{{ $m }}</span>
                                        @endif
                                    @endforeach
                                </div>
                            </div>
                        </div>
                    </div>
                @endforeach
            </div>
        @endforeach
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', () => {
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

            // Copy endpoint URL
            document.querySelectorAll('.copy-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const endpoint = btn.getAttribute('data-endpoint');
                    navigator.clipboard.writeText(endpoint);

                    // Show feedback
                    const originalHTML = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i>';
                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                    }, 1500);
                });
            });

            // Search functionality
            const searchInput = document.getElementById('endpoint-search');
            const noResultsMsg = document.querySelector('.no-results');

            searchInput.addEventListener('input', () => {
                const searchTerm = searchInput.value.toLowerCase().trim();
                let foundResults = false;

                document.querySelectorAll('.endpoint').forEach(endpoint => {
                    const uri = endpoint.querySelector('.uri-path').textContent.toLowerCase();
                    const method = endpoint.querySelector('.method-badge').textContent.toLowerCase();
                    const matches = uri.includes(searchTerm) || method.includes(searchTerm);
                    endpoint.style.display = matches ? 'block' : 'none';

                    if (matches) foundResults = true;
                });

                // Hide empty groups
                document.querySelectorAll('.endpoint-group').forEach(group => {
                    const visibleEndpoints = Array.from(group.querySelectorAll('.endpoint'))
                        .filter(ep => ep.style.display !== 'none');

                    group.style.display = visibleEndpoints.length > 0 ? 'block' : 'none';
                });

                // Show/hide no results message
                noResultsMsg.style.display = !foundResults && searchTerm ? 'block' : 'none';
            });
        });
    </script>
</body>
</html>
