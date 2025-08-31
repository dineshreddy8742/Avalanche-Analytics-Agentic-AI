document.addEventListener('DOMContentLoaded', () => {
    console.log('Avalanche Voting Analytics - Enhanced System Loading...');
    
    const API_BASE_URL = 'http://localhost:8080';
    const WEBSOCKET_URL = 'http://localhost:8080';

    let currentConstituency = null;

    function getThemeColors() {
        const isDarkMode = document.body.classList.contains('theme-dark');
        return {
            textColor: isDarkMode ? '#f5f5f5' : '#222',
            tooltipBg: isDarkMode ? 'rgba(34, 34, 34, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            gridColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        };
    }

    // Connection Status Manager
    class ConnectionManager {
        constructor() {
            this.statusElement = document.getElementById('connectionStatus');
            this.loadingOverlay = document.getElementById('loadingOverlay');
            this.progressBar = document.getElementById('loadingProgress');
        }
        updateStatus(status) {
            console.log('ConnectionManager.updateStatus called with:', status);
            if (!this.statusElement) {
                console.warn('Connection status element not found!');
                return;
            }
            this.statusElement.className = 'connection-status';
            this.statusElement.innerHTML = `<span>${
                status === 'connected' ? 'CONNECTED' :
                status === 'disconnected' ? 'DISCONNECTED' :
                'CONNECTING...'
            }</span>`;
            this.statusElement.classList.add(status);
        }
        showLoading(message = 'Loading Analytics...') {
            if (this.loadingOverlay) {
                this.loadingOverlay.classList.remove('d-none');
                const textEl = this.loadingOverlay.querySelector('.loader-text');
                if (textEl) textEl.textContent = message;
                this.animateProgress();
            }
        }
        hideLoading() {
            if (this.loadingOverlay) this.loadingOverlay.classList.add('d-none');
        }
        animateProgress() {
            if (!this.progressBar) return;
            let progress = 0;
            const interval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(interval);
                }
                this.progressBar.style.width = progress + '%';
            }, 200);
        }
    }
    const connectionManager = new ConnectionManager();

    // API Service for HTTP Requests
    class APIService {
        constructor() {
            this.primary = API_BASE_URL;
        }
        async request(endpoint, options = {}) {
            const url = `${this.primary}${endpoint}`;
            try {
                const res = await fetch(url, {
                    ...options,
                    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) }
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
                return await res.json();
            } catch (e) {
                console.error(`Failed fetch ${url}: ${e.message}`);
                throw e; // Re-throw the error to be caught by the calling function
            }
        }
        getHealth() { return this.request('/api/health'); }
        getAIInsights() { return this.request('/api/ai/insights'); }
        getLivePredictions() { return this.request('/api/ai/predictions/live'); }
        getAnalytics() { return this.request('/api/analytics/enhanced'); }
        getConstituencies() { return this.request('/api/constituencies'); }
        getConstituencyAnalysis(name) { return this.request(`/api/analysis/constituency/${encodeURIComponent(name)}`); }
        getLiveTransactions() { return this.request('/api/live/transactions'); }
        get3DData() { return this.request('/api/visualization/3d'); }
        getNetworkStats() { return this.request('/api/blockchain/network-stats'); }
        getHistoricalVotes() { return this.request('/api/analytics/historical-votes'); }
    }

    // Chart Manager to handle Chart.js charts creation and updates
    class ChartManager {
        constructor() {
            this.charts = {};
            this.colors = {
                avalanche: ['#E84142', '#2D74DA', '#FF6B35', '#00D4AA', '#9B59B6'],
                rainbow: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
                gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']
            };
        }
        createChart(id, type, data, options = {}) {
            console.log(`ChartManager: Attempting to create chart '${id}' (Type: ${type}) with data:`, data, 'and options:', options);

            console.log(`Canvas element for ${id} exists:`, !!document.getElementById(id));
            const ctx = document.getElementById(id)?.getContext('2d');
            if (!ctx) { console.warn(`Canvas with id: ${id} not found`); return null; }

            // Force canvas dimensions before Chart.js initialization
            ctx.canvas.style.width = '100%';
            ctx.canvas.style.height = '350px'; // Set a default height

            // Ensure canvas visibility
            ctx.canvas.style.display = 'block';

            if (this.charts[id]) this.charts[id].destroy();
            data.datasets.forEach((ds,i) => {
                if (!ds.backgroundColor) {
                    const palette = (type == 'pie' || type == 'doughnut') ? this.colors.avalanche : this.colors.avalanche.map(c => c + '80');
                    ds.backgroundColor = palette;
                    ds.borderColor = palette.map(c => c.replace('80',''));
                    ds.borderWidth = 2;
                }
            });
            const defaultOptions = {
                responsive:true,
                maintainAspectRatio:false,
                plugins:{
                    legend:{
                        position:'bottom',
                        labels:{
                            usePointStyle:true,
                            padding:20,
                            font:{
                                size:16, /* Increased legend font size */
                                weight:'bold'
                            },
                            color: getThemeColors().textColor /* Dynamic color */
                        }
                    },
                    tooltip:{
                        backgroundColor: getThemeColors().tooltipBg, /* Dynamic background */
                        titleColor: getThemeColors().textColor, /* Dynamic color */
                        bodyColor: getThemeColors().textColor, /* Dynamic color */
                        borderColor:'#E84142',
                        borderWidth:1,
                        cornerRadius:10,
                        titleFont:{
                            size:14, /* Larger tooltip font */
                            weight:'bold'
                        },
                        bodyFont:{
                            size:14 /* Larger tooltip font */
                        },
                        padding: 10 /* Add padding to tooltips */
                    },
                    title:{
                        display:true,
                        font:{
                            size:20, /* Chart title font size */
                            weight:'bold'
                        },
                        color: getThemeColors().textColor, /* Dynamic color */
                        padding:{top:10,bottom:20}
                    }
                },
                animation:{duration:2000,easing:'easeInOutQuart'},
                interaction:{mode:'index', intersect:false},
                scales:{
                    x:{
                        ticks:{
                            font:{
                                size:14, /* Axis tick font size */
                                weight:'bold'
                            },
                            color: getThemeColors().textColor /* Dynamic color */
                        },
                        title:{
                            display:true,
                            font:{
                                size:16, /* Axis title font size */
                                weight:'bold'
                            },
                            color: getThemeColors().textColor /* Dynamic color */
                        },
                        grid:{
                            color: getThemeColors().gridColor /* Dynamic grid color */
                        },
                        offset: true /* Add offset for padding */
                    },
                    y:{
                        ticks:{
                            font:{
                                size:14, /* Axis tick font size */
                                weight:'bold'
                            },
                            color: getThemeColors().textColor /* Dynamic color */
                        },
                        title:{
                            display:true,
                            font:{
                                size:16, /* Axis title font size */
                                weight:'bold'
                            },
                            color: getThemeColors().textColor /* Dynamic color */
                        },
                        grid:{
                            color: getThemeColors().gridColor /* Dynamic grid color */
                        }
                    }
                }
            };
            const opts = Object.assign(defaultOptions, options);
            this.charts[id] = new Chart(ctx,{type, data, options:opts});
        }
        updateChart(id, newData) {
            console.log(`ChartManager: Attempting to update chart '${id}' with new data:`, newData);
            if (this.charts[id]) {
                this.charts[id].data = newData;
                this.charts[id].update();
            }
        }
        destroyChart(id) {
            console.log(`Attempting to destroy chart: ${id}`);
            if (this.charts[id]) {
                this.charts[id].destroy();
                delete this.charts[id];
                console.log(`Chart ${id} destroyed.`);
            }
        }
    }

    // WebSocket Manager for real-time updates and reconnection logic
    class WebSocketManager {
        constructor(apiService, chartManager) {
            this.api = apiService;
            this.chartMgr = chartManager;
            this.socket = null;
            this.retries = 0;
            this.maxRetries = 5;
        }
        connect() {
            try {
                this.socket = io(WEBSOCKET_URL, {transports:['websocket','polling'],timeout:20000,forceNew:true});
                this.registerEvents();
            } catch(e) { console.error('WebSocket init error:', e); this.fallback(); }
        }
        registerEvents() {
            this.socket.on('connect', () => {
                connectionManager.updateStatus('connected');
                this.retries = 0;
                this.socket.emit('request_live_data');
                this.socket.emit('request_3d_data');
            });
            this.socket.on('disconnect', () => connectionManager.updateStatus('disconnected'));
            this.socket.on('connect_error', (e) => { console.error('WS connect_error:', e); this.handleReconnect(); });
            this.socket.on('enhanced_voting_update', data => app.handleVotingUpdate(data));
            this.socket.on('blockchain_update', data => app.handleBlockchainUpdate(data));
            this.socket.on('prediction_update', data => app.handlePredictionUpdate(data));
            this.socket.on('vote_count_update', data => app.handleVoteCountUpdate(data));
            this.socket.on('new_transaction', data => app.handleNewTransaction(data));
            this.socket.on('visualization_data', data => app.handle3DVisualizationUpdate(data));
        }
        handleReconnect() {
            if (this.retries < this.maxRetries) {
                this.retries++;
                setTimeout(() => this.connect(), 3000 * this.retries);
            } else {
                console.warn('Max WS retries reached; start fallback polling');
                connectionManager.updateStatus('disconnected');
                this.fallback();
            }
        }
        fallback() {
            setInterval(async () => {
                try {
                    const [analytics,predictions,transactions] = await Promise.allSettled([
                        this.api.getAnalytics(),
                        this.api.getLivePredictions(),
                        this.api.getLiveTransactions()
                    ]);
                    if (analytics.status === 'fulfilled') app.handleVotingUpdate(analytics.value);
                    if (predictions.status === 'fulfilled') app.handlePredictionUpdate(predictions.value);
                    if (transactions.status === 'fulfilled') app.handleBlockchainUpdate({transactions: transactions.value.transactions});
                } catch (e) { console.error('Fallback polling error:', e); }
            },10000);
        }
        disconnect() {
            this.socket?.disconnect();
        }
    }

    // Search Manager for Constituency Search Interaction
    class SearchManager {
        constructor(apiService, chartManager, app) {
            this.api = apiService;
            this.chartMgr = chartManager;
            this.app = app;
            this.constituencies = [];
            this.topSuggestions = [];
            this.highlightIndex = -1;
            this.initElements();
            this.bindEvents();
        }
        initElements() {
            this.input = document.getElementById('constituencySearch');
            this.results = document.getElementById('searchResults');
            this.button = document.getElementById('searchButton');
        }
        async loadConstituencies() {
            console.log('SearchManager: Attempting to load constituencies...');
            try {
                const data = await this.api.getConstituencies();
                console.log('SearchManager: Data from API for constituencies:', data);
                if (Array.isArray(data?.constituencies)) {
                    this.constituencies = data.constituencies;
                    console.log('SearchManager: Constituencies loaded successfully.', this.constituencies.length, 'items.');
                } else if (Array.isArray(data)) {
                    this.constituencies = data;
                    console.log('SearchManager: Constituencies loaded successfully (direct array).', this.constituencies.length, 'items.');
                } else {
                    console.warn('SearchManager: Invalid constituency data format:', data);
                    throw new Error('Invalid constituency data');
                }
            } catch (error) {
                console.error('SearchManager: Error loading constituencies:', error);
            }
        }
        bindEvents() {
            console.log('SearchManager: Binding events...');
            if (!this.input || !this.results || !this.button) {
                console.warn('SearchManager: Search elements not found for event binding.', {input: !!this.input, results: !!this.results, button: !!this.button});
                return;
            }

            let debounceTimeout = null;
            this.input.addEventListener('input', e => {
                console.log('SearchManager: Input event fired. Value:', e.target.value);
                clearTimeout(debounceTimeout);
                debounceTimeout = setTimeout(() => this.search(e.target.value), 300);
            });
            this.input.addEventListener('keydown', e => {
                console.log('SearchManager: Keydown event fired. Key:', e.key);
                const items = this.results.querySelectorAll('.search-result-item');
                if (!items.length) return;
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.highlightIndex = (this.highlightIndex + 1) % items.length;
                    this.updateHighlight(items);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.highlightIndex = (this.highlightIndex - 1 + items.length) % items.length;
                    this.updateHighlight(items);
                } else if (e.key === 'Enter' && this.highlightIndex >= 0) {
                    e.preventDefault();
                    this.select(items[this.highlightIndex].dataset.constituency);
                } else if (e.key === 'Escape') {
                    this.hideResults();
                }
            });
            this.input.addEventListener('focus', () => {
                console.log('SearchManager: Input focused.');
                if (!this.input.value) this.showResults(this.topSuggestions, 'Top Suggestions');
                else if (this.results.children.length) this.results.style.display = 'block';
            });
            this.button.addEventListener('click', () => {
                console.log('SearchManager: Search button clicked.');
                this.handleSearch();
            });

            document.addEventListener('click', e => {
                if (!this.input.contains(e.target) && !this.results.contains(e.target)) this.hideResults();
            });
            console.log('SearchManager: Events bound.');
        }
        search(query) {
            console.log('SearchManager: search function called with query:', query);
            query = query.trim();
            if (query.length < 2) {
                this.hideResults();
                console.log('SearchManager: Query too short, hiding results.');
                return;
            }
            const results = this.constituencies.filter(c => c.toLowerCase().includes(query.toLowerCase())).slice(0, 10);
            console.log('SearchManager: Filtered search results:', results);
            this.showResults(results, 'Results');
        }
        showResults(results, title) {
            console.log('SearchManager: showResults called with results:', results, 'and title:', title);
            if (!this.results) {
                console.warn('SearchManager: Search results container (this.results) not found!');
                return;
            }
            console.log('SearchManager: Search results container element:', this.results);
            console.log('SearchManager: Computed style of search results container:', window.getComputedStyle(this.results));
            let html = `<div class="search-header">${title}</div>`;
            if (!results.length && title !== 'Top Suggestions') html += '<div class="search-empty">No results found.</div>';
            else results.forEach(r => {
                // Assuming r is an object like { name: "Rayachoty", votes: 12, confidence: 91 }
                // The original code assumes 'r' is a string, but the comment suggests an object. This needs clarification.
                // For now, assuming 'r' is a string (constituency name) based on 'this.constituencies.filter(c => c.toLowerCase().includes(query.toLowerCase()))'
                html += `<div class="search-result-item" data-constituency="${r}">
                            ${r}
                        </div>`;
            });
            console.log('SearchManager: Generated search results HTML:', html);
            this.results.innerHTML = html;
            this.results.style.display = 'block !important';
            this.highlightIndex = -1;
            this.results.querySelectorAll('.search-result-item').forEach(item => {
                item.addEventListener('mousedown', () => this.select(item.dataset.constituency));
            });
        }
        hideResults() {
            // Add a small delay to allow results to render before hiding
            setTimeout(() => {
                if (this.results) {
                    this.results.style.display = 'none';
                }
            }, 100); // 100ms delay
        }
        updateHighlight(items) {
            items.forEach((item,i) => {
                item.classList.toggle('active', i === this.highlightIndex);
            });
        }
        handleSearch() {
            const val = this.input.value.trim();
            if (!val) return;
            const exact = this.constituencies.find(c => c.toLowerCase() === val.toLowerCase());
            if (exact) this.select(exact);
            else {
                const partial = this.constituencies.filter(c => c.toLowerCase().includes(val.toLowerCase()))[0];
                if (partial) this.select(partial);
                else this.showError('No matching constituency found.');
            }
        }
        select(name) {
            if (!name) return;
            currentConstituency = name;
            if (this.input) this.input.value = name;
            this.hideResults();
            this.app.loadConstituencyAnalysis(name);
        }
        showError(msg) {
            this.app.showToastNotification(msg, 'error');
            this.hideResults(); // Also hide results when showing an error
        }
    }

    // Theme Manager for light/dark and chart re-style
    class ThemeManager {
        constructor() {
            this.theme = localStorage.getItem('theme') || 'light';
            this.init();
        }
        init() {
            this.applyTheme(this.theme);
            const toggle = document.getElementById('themeToggle');
            if (toggle) toggle.addEventListener('click', () => this.toggle());
        }
        toggle() {
            this.theme = this.theme === 'light' ? 'dark' : 'light';
            localStorage.setItem('theme', this.theme);
            this.applyTheme(this.theme);
        }
        applyTheme(t) {
            document.body.classList.remove('light','dark');
            document.body.classList.add(t);
            document.body.setAttribute('data-theme', t);
            const icon = document.getElementById('themeIcon');
            if (icon) icon.className = t === 'dark' ? 'fas fa-moon rotate-slow' : 'fas fa-sun rotate-slow';
            // Update charts colors appropriately:
            window.chartManager && window.chartManager.charts && Object.values(window.chartManager.charts).forEach(c => {
                const colors = getThemeColors();
                if (c.options.scales) {
                    c.options.scales.x.ticks.color = colors.textColor;
                    c.options.scales.y.ticks.color = colors.textColor;
                    c.options.scales.x.grid.color = colors.gridColor;
                    c.options.scales.y.grid.color = colors.gridColor;
                }
                if (c.options.plugins?.legend) c.options.plugins.legend.labels.color = colors.textColor;
                if (c.options.plugins?.title) c.options.plugins.title.color = colors.textColor;
                if (c.options.plugins?.tooltip) {
                    c.options.plugins.tooltip.backgroundColor = colors.tooltipBg;
                    c.options.plugins.tooltip.titleColor = colors.textColor;
                    c.options.plugins.tooltip.bodyColor = colors.textColor;
                }
                c.update();
            });
        }
    }

    // Main Application Class - Manages all components & logic
    class VotingAnalyticsApp {
        constructor() {
            this.api = new APIService();
            this.chartMgr = new ChartManager();
            this.wsMgr = new WebSocketManager(this.api, this.chartMgr);
            this.themeMgr = new ThemeManager();
            this.searchMgr = new SearchManager(this.api, this.chartMgr, this);
            this.initialized = false;
            this.candidates = [];
            this.rotationIndex = 0;
            this.rotationCount = 5;
            this.rotationInterval = null;
            this.liveVoteCount = 0;
            this.predictionConfidence = 0;
            this.threeJs = {};
            this.init();
        }
        async init() {
            console.log('VotingAnalyticsApp.init() called.');
            connectionManager.showLoading('Initializing...');
            this.loadTimeout = setTimeout(() => {
                if (!this.initialized) this.handleError(new Error('Timeout loading data'));
            }, 15000);

            try {
                console.log('Fetching health...');
                await this.api.getHealth();
                console.log('Health fetched. Loading constituencies...');
                await this.searchMgr.loadConstituencies();
                console.log('Constituencies loaded. Loading historical data...');
                await this.loadHistoricalData();
                console.log('Historical data loaded. Creating prediction chart...');
                await this.createPredictionChart();
                console.log('Prediction chart created. Creating turnout heatmap...');
                await this.createTurnoutHeatmap();
                console.log('Turnout heatmap created. Connecting to WebSocket...');
                this.wsMgr.connect();
                console.log('WebSocket connected. Handling 3D visualization update...');
                this.handle3DVisualizationUpdate();
                // this.initialized = true; // Moved to handleInitialData
                clearTimeout(this.loadTimeout);
                connectionManager.hideLoading();
                this.setupUIEvents();
                console.log('Avalanche Voting Analytics Ready.');
            } catch(e) { 
                console.error('Error during init:', e);
                this.handleError(e); 
            }
        }
        async loadHistoricalData() {
            try {
                const data = await this.api.getHistoricalVotes();
                if (data && data.success) {
                    this.chartMgr.createChart('historicalVotesChart', 'bar', {
                        labels: data.labels,
                        datasets: [{
                            label: 'Votes',
                            data: data.data,
                            backgroundColor: ['rgba(232,65,66,0.7)','rgba(45,116,218,0.7)'],
                            borderColor: ['rgba(232,65,66,1)','rgba(45,116,218,1)'],
                            borderWidth:1,
                            borderRadius:5
                        }]
                    }, {
                        plugins:{
                            legend:{display:false},
                            title:{
                                display:true,
                                text: 'Total Votes Over Time',
                                font: { size: 20, weight: 'bold' },
                                color: getThemeColors().textColor
                            }
                        },
                        scales:{
                            x:{
                                title:{
                                    display:true,
                                    text: 'Election Year',
                                    font: { size: 16, weight: 'bold' },
                                    color: getThemeColors().textColor
                                },
                                ticks:{
                                    font: { size: 14, weight: 'bold' },
                                    color: getThemeColors().textColor
                                }
                            },
                            y:{
                                title:{
                                    display:true,
                                    text: 'Total Votes',
                                    font: { size: 16, weight: 'bold' },
                                    color: getThemeColors().textColor
                                },
                                ticks:{
                                    font: { size: 14, weight: 'bold' },
                                    color: getThemeColors().textColor
                                }
                            }
                        }
                    });
                }
            } catch(e) {
                console.error('Loading historical votes failed:', e);
            }
        }
        handleVotingUpdate(data) {
            console.log('App: handleVotingUpdate called with data:', data);
            if (!this.initialized) {
                this.handleInitialData(data);
                return;
            }
            if (data.election_data) {
                console.log('App: Updating votes with election_data:', data.election_data);
                this.updateVotes(data.election_data);
            }
            if (data.ai_insights) {
                console.log('App: Updating AI insights with ai_insights:', data.ai_insights);
                this.updateAIInsights(data.ai_insights);
            }
            if (data.analytics) {
                console.log('App: Updating analytics with analytics:', data.analytics);
                this.updateAnalytics(data.analytics);
                // Also update demographic charts on subsequent updates if data is present
                if (data.analytics.demographics) {
                    console.log('App: Updating demographic charts with demographics:', data.analytics.demographics);
                    this.updateDemographicChartsData(data.analytics.demographics);
                }
            }
        }
        handleInitialData(data) {
            console.log('handleInitialData called with data:', data);
            if (this.initialized) {
                console.log('handleInitialData already initialized. Returning.');
                return;
            }
            clearTimeout(this.loadTimeout);

            // Initialize candidate charts
            this.chartMgr.createChart('votesPerCandidateChart', 'bar', {
                labels: [],
                datasets: [{
                    label: 'Votes',
                    data: [],
                    backgroundColor: this.chartMgr.colors.avalanche
                }]
            });
            this.chartMgr.createChart('votePercentageShareChart', 'doughnut', {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: this.chartMgr.colors.avalanche
                }]
            });
            // Initialize demographic charts - handled by initializeDemographicCharts
            // this.chartMgr.createChart('ageGroupDistributionChart', 'bar', {
            //     labels: [],
            //     datasets: [{
            //         label: 'Votes',
            //         data: [],
            //         backgroundColor: this.chartMgr.colors.rainbow
            //     }]
            // });
            // this.chartMgr.createChart('genderVotingTrendsChart', 'pie', {
            //     labels: [],
            //     datasets: [{
            //         data: [],
            //         backgroundColor: ['#2D74DA', '#E84142', '#00D4AA']
            //     }]
            // });
            // this.chartMgr.createChart('locationParticipationChart', 'bar', {
            //     labels: [],
            //     datasets: [{
            //         label: 'Votes',
            //         data: [],
            //         backgroundColor: this.chartMgr.colors.gradient
            //     }]
            // });

            this.updateDashboard(data.analytics || {}, 'Overall');

            if (data.election_data?.candidates) {
                this.candidates = data.election_data.candidates;
                // Initial display of top 5 overall
                this.updateCandidateCharts(this.candidates);
                this.updateVotePercentageChart(this.candidates);
                // Initialize demographic charts
                this.initializeDemographicCharts(data.analytics?.demographics || {});
                this.rotateCandidates(); // Start rotation after initial display
            }
            
            // Initialize demographic charts
            this.initializeDemographicCharts(data.analytics?.demographics || {});
            
            this.setupUIEvents();
            connectionManager.hideLoading();
            this.initialized = true; // Moved to the end
        }
        updateVotes(election) {
            console.log('App: updateVotes called with election:', election);
            this.liveVoteCount = election.current_turnout || this.liveVoteCount;
            console.log("App: Current live vote count:", this.liveVoteCount); // Added log
            const liveVoteCountEl = document.getElementById('liveVoteCount'); // Target the correct element
            if (liveVoteCountEl) liveVoteCountEl.textContent = this.liveVoteCount.toLocaleString();
            // Update charts for candidates - handled by rotateCandidates or initial load
            // if (election.candidates) {
            //     console.log('App: Updating candidate charts with candidates:', election.candidates);
            //     this.updateCandidateCharts(election.candidates);
            //     this.updateVotePercentageChart(election.candidates);
            // }
        }
        updateCandidateCharts(candidates) {
            console.log('updateCandidateCharts called with candidates:', candidates);
            if (!candidates?.length) return;
            let sorted = candidates.filter(c => c.name !== 'Other').slice().sort((a,b)=> b.votes - a.votes).slice(0,5);
            let labels = sorted.map(c=>c.name);
            let votes = sorted.map(c=>c.votes);
            console.log(`DEBUG: votesPerCandidateChart - Labels: ${labels}, Votes: ${votes}`);
            this.chartMgr.updateChart('votesPerCandidateChart', {
                labels,
                datasets: [{
                    label:'Votes',
                    data:votes,
                    backgroundColor:this.chartMgr.colors.avalanche
                }]
            });
        }

        updateVotePercentageChart(candidates) {
            console.log('updateVotePercentageChart called with candidates:', candidates);
            if (!candidates?.length) return;
            let sorted = candidates.filter(c => c.name !== 'Other').slice().sort((a,b)=> b.votes - a.votes).slice(0,5);
            let labels = sorted.map(c=>c.name);
            let percentages = sorted.map(c=>c.percentage);
            console.log(`DEBUG: votePercentageShareChart - Labels: ${labels}, Percentages: ${percentages}`);
            this.chartMgr.updateChart('votePercentageShareChart', {
                labels,
                datasets: [{
                    data:percentages,
                    backgroundColor:this.chartMgr.colors.avalanche
                }]
            });
        }
        updateAIInsights(insights) {
            console.log('updateAIInsights called with insights:', insights);
            if (!insights?.length) return;

            const summaryTextContainer = document.getElementById('analysis-summary-text');
            if (summaryTextContainer) {
                summaryTextContainer.innerHTML = ''; // Clear previous content
                if (typeof insights[0] === 'string') {
                    // If insights are strings, display them as plain text
                    console.warn('updateAIInsights: insights are strings, expected objects. Displaying as plain text.');
                    summaryTextContainer.innerHTML = insights.slice(0,3).map(i => `
                        <div class="narrative-insight mb-3">
                            <p>${i}</p>
                        </div>`).join('');
                } else {
                    // If insights are objects, process them as before
                    summaryTextContainer.innerHTML = insights.slice(0,3).map(i => {
                        const title = i.title || 'Insight unavailable';
                        const description = i.description || 'No description provided.';
                        const confidence = isNaN(i.confidence) ? 'N/A' : `${Math.round(i.confidence * 100)}%`;
                        const importance = i.importance || 'N/A';
                        return `
                            <div class="narrative-insight mb-3">
                                <h6 class="text-avalanche-blue"><i class="fas fa-lightbulb me-2"></i>${title}</h6>
                                <p>${description}</p>
                                <div class="insight-meta mt-2">
                                    <span class="badge bg-avalanche-green">Confidence: ${confidence}</span>
                                    <span class="badge bg-avalanche-orange ms-2">Priority: ${importance}/10</span>
                                </div>
                            </div>`;
                    }).join('');
                }
            }

            const otherInsightsContainer = document.getElementById('other-insights-content');
            if (otherInsightsContainer) {
                otherInsightsContainer.innerHTML = ''; // Clear previous content
                if (typeof insights[0] === 'string') {
                    // If insights are strings, display them as plain text
                    otherInsightsContainer.innerHTML = insights.map(i => `
                        <div class="narrative-insight mb-3">
                            <p>${i}</p>
                        </div>`).join('');
                } else {
                    // If insights are objects, process them as before
                    otherInsightsContainer.innerHTML = insights.map(i => {
                        const title = i.title || 'Insight unavailable';
                        const description = i.description || 'No description provided.';
                        const confidence = isNaN(i.confidence) ? 'N/A' : `${Math.round(i.confidence * 100)}%`;
                        const importance = i.importance || 'N/A';
                        return `
                            <div class="narrative-insight mb-3">
                                <h6 class="insight-title"><i class="fas fa-lightbulb me-2"></i>${title}</h6>
                                <p class="insight-description">${description}</p>
                                <div class="insight-meta mt-2">
                                    <span class="badge bg-confidence">Confidence: ${confidence}</span>
                                    <span class="badge bg-priority ms-2">Priority: ${importance}/10
                                </div>
                            </div>`;
                    }).join('');
                }
            }
        }
        updateAnalytics(analytics) {
            console.log('updateAnalytics called with analytics:', analytics);
            if (!analytics) return;

            const totalVotesEl = document.getElementById('total-votes');
            if (totalVotesEl) {
                if (analytics.candidates) {
                    const totalVotes = analytics.candidates.reduce((sum, candidate) => sum + candidate.votes, 0);
                    totalVotesEl.textContent = totalVotes.toLocaleString();
                } else {
                    totalVotesEl.textContent = '0';
                }
            }

            const totalInsightsEl = document.getElementById('total-insights');
            if (totalInsightsEl) {
                if (analytics.ai_insights) {
                    totalInsightsEl.textContent = analytics.ai_insights.length;
                } else {
                    totalInsightsEl.textContent = '0';
                }
            }

            const avgConfidenceEl = document.getElementById('avg-confidence');
            if (avgConfidenceEl) {
                if (analytics.ai_predictions && analytics.ai_predictions.confidence) {
                    avgConfidenceEl.textContent = `${Math.round(analytics.ai_predictions.confidence * 100)}%`;
                } else {
                    avgConfidenceEl.textContent = 'N/A';
                }
            }

            const highImportanceEl = document.getElementById('high-importance');
            if (highImportanceEl) {
                let maxImportance = 'N/A';
                if (analytics.ai_insights && analytics.ai_insights.length > 0) {
                    const insightsWithImportance = analytics.ai_insights.filter(i => typeof i.importance === 'number');
                    if (insightsWithImportance.length > 0) {
                        maxImportance = Math.max(...insightsWithImportance.map(i => i.importance));
                    }
                }
                highImportanceEl.textContent = maxImportance;
            }
        }
        rotateCandidates() {
            if (this.rotationInterval) clearInterval(this.rotationInterval);
            this.rotationInterval = setInterval(() => {
                if(this.candidates.length <= this.rotationCount) {
                    clearInterval(this.rotationInterval);
                    return;
                }
                let start = this.rotationIndex % this.candidates.length;
                let chunk = this.candidates.slice(start, start + this.rotationCount);
                if (chunk.length < this.rotationCount) chunk.push(...this.candidates.slice(0,this.rotationCount - chunk.length));
                this.updateCandidateCharts(chunk);
                this.updateVotePercentageChart(chunk);
                this.rotationIndex += this.rotationCount;
            }, 6000);
        }
        setupUIEvents() {
            const cycleBtn = document.getElementById('cycleCandidatesButton');
            if (cycleBtn) {
                cycleBtn.addEventListener('click', () => this.rotateCandidates());
            }

            // Add event listeners for stat cards
            document.querySelectorAll('.stat-card').forEach(card => {
                card.addEventListener('click', () => {
                    const statType = card.dataset.stat;
                    let title = '';
                    let content = '';

                    switch (statType) {
                        case 'total-votes':
                            title = 'Total Votes';
                            content = `<p><strong>Current Total Votes:</strong> ${document.getElementById('total-votes').textContent}</p>
                                       <p>This represents the cumulative number of votes recorded on the Avalanche blockchain.</p>`;
                            break;
                        case 'total-insights':
                            title = 'AI Insights';
                            content = `<p><strong>Total AI Insights:</strong> ${document.getElementById('total-insights').textContent}</p>
                                       <p>These are real-time analytical observations generated by the AI agent, highlighting key trends and anomalies.</p>`;
                            break;
                        case 'avg-confidence':
                            title = 'Average AI Confidence';
                            content = `<p><strong>Average Confidence:</strong> ${document.getElementById('avg-confidence').textContent}</p>
                                       <p>This metric indicates the AI\'s certainty in its predictions and analyses across various data points.</p>`;
                            break;
                        case 'high-importance':
                            title = 'High Priority Alerts';
                            content = `<p><strong>High Priority Insights:</strong> ${document.getElementById('high-importance').textContent}</p>
                                       <p>These are critical insights flagged by the AI due to their significant impact or unusual patterns.</p>`;
                            break;
                        default:
                            title = 'Detail';
                            content = '<p>No specific details available for this statistic.</p>';
                    }
                    this.showStatDetailModal(title, content);
                });
            });

            // Fix for Blocked aria-hidden warning
            const statDetailModal = document.getElementById('statDetailModal');
            if (statDetailModal) {
                statDetailModal.addEventListener('hidden.bs.modal', () => {
                    // Return focus to the element that opened the modal, or a sensible default
                    const lastFocusedElement = document.activeElement; // This might be the close button
                    if (lastFocusedElement && lastFocusedElement.tagName === 'BUTTON') {
                        lastFocusedElement.blur(); // Remove focus from the close button
                    }
                    // Optionally, return focus to the stat card that was clicked
                    // This would require storing which card was clicked
                });
            }

            const viewGlobeBtn = document.getElementById('viewGlobeBtn');
            const viewMapBtn = document.getElementById('viewMapBtn');
            const viewParticlesBtn = document.getElementById('viewParticlesBtn');

            if (viewGlobeBtn) {
                viewGlobeBtn.addEventListener('click', () => {
                    this.showToastNotification('Globe view is already active.', 'info');
                });
            }

            if (viewMapBtn) {
                viewMapBtn.addEventListener('click', () => {
                    this.showToastNotification('Map view is coming soon!', 'info');
                });
            }

            if (viewParticlesBtn) {
                viewParticlesBtn.addEventListener('click', () => {
                    this.showToastNotification('Particles view is coming soon!', 'info');
                });
            }
        }

        initializeDemographicCharts(demographics) {
            if (!demographics) return;

            const ageCounts = (demographics.age_groups && demographics.age_groups.counts) ? demographics.age_groups.counts : {};
            const genderCounts = (demographics.gender && demographics.gender.counts) ? demographics.gender.counts : {};
            const locationCounts = (demographics.locations && demographics.locations.top_10_counts) ? demographics.locations.top_10_counts : {};

            this.chartMgr.createChart('ageGroupDistributionChart', 'bar', {
                labels: Object.keys(ageCounts),
                datasets: [{
                    label: 'Votes',
                    data: Object.values(ageCounts),
                    backgroundColor: this.chartMgr.colors.rainbow
                }]
            });

            this.chartMgr.createChart('genderVotingTrendsChart', 'pie', {
                labels: Object.keys(genderCounts),
                datasets: [{
                    data: Object.values(genderCounts),
                    backgroundColor: ['#2D74DA', '#E84142', '#00D4AA']
                }]
            });

            this.chartMgr.createChart('locationParticipationChart', 'bar', {
                labels: Object.keys(locationCounts),
                datasets: [{
                    label: 'Votes',
                    data: Object.values(locationCounts),
                    backgroundColor: this.chartMgr.colors.gradient
                }]
            });
        }

        updateDemographicChartsData(demographics) {
            if (!demographics) return;

            const ageCounts = (demographics.age_groups && demographics.age_groups.counts) ? demographics.age_groups.counts : {};
            const genderCounts = (demographics.gender && demographics.gender.counts) ? demographics.gender.counts : {};
            const locationCounts = (demographics.locations && demographics.locations.top_10_counts) ? demographics.locations.top_10_counts : {};

            if (this.chartMgr.charts['ageGroupDistributionChart']) {
                this.chartMgr.updateChart('ageGroupDistributionChart', {
                    labels: Object.keys(ageCounts),
                    datasets: [{
                        label: 'Votes',
                        data: Object.values(ageCounts),
                        backgroundColor: this.chartMgr.colors.rainbow
                    }]
                });
            }

            if (this.chartMgr.charts['genderVotingTrendsChart']) {
                this.chartMgr.updateChart('genderVotingTrendsChart', {
                    labels: Object.keys(genderCounts),
                    datasets: [{
                        data: Object.values(genderCounts),
                        backgroundColor: ['#2D74DA', '#E84142', '#00D4AA']
                    }]
                });
            }

            if (this.chartMgr.charts['locationParticipationChart']) {
                this.chartMgr.updateChart('locationParticipationChart', {
                    labels: Object.keys(locationCounts),
                    datasets: [{
                        label: 'Votes',
                        data: Object.values(locationCounts),
                        backgroundColor: this.chartMgr.colors.gradient
                    }]
                });
            }
        }

        clearDashboardContainers() {
            const containersToClear = [
                'analysis-summary-text',
                'other-insights-content',
                'ai-insights', // Added to clear potential duplication in AI insights section
                // 'demographic-analytics', // Removed to prevent clearing chart canvases
                'prediction-chart-container', // Added for Electoral Outcome Forecast
                'turnout-heatmap-container', // Added for Turnout Prediction with AI Modeling
            ];

            containersToClear.forEach(id => {
                const element = document.getElementById(id);
                if (element) {
                    element.innerHTML = '';
                }
            });
        }

        updateDashboard(data, name='Overall') {
            console.log('App: Updating dashboard for:', name, 'with data:', data);
            this.clearDashboardContainers();

            const constituencyHeader = document.getElementById('constituency-header');
            const constituencyHeaderName = document.getElementById('constituency-header-name');
            const backToOverallBtn = document.getElementById('back-to-overall');

            if (name === "Overall") {
                constituencyHeader.classList.add('d-none');
            }
            else {
                constituencyHeader.classList.remove('d-none');
                constituencyHeaderName.textContent = `Showing Analytics for: ${name}`;
                if (backToOverallBtn) {
                    backToOverallBtn.onclick = () => this.showOverallDashboard();
                }
            }

            const candidates = (data.candidates || []).filter(c => c.name !== 'Other');
            const demographics = data.demographics || {};
            const aiInsights = data.ai_insights || [];

            // Removed summaryEl handling, as updateAIInsights handles populating #summary-text

            if (candidates.length > 0) {
                console.log('App: Dashboard updating candidate charts with:', candidates);
                this.updateCandidateCharts(candidates);
                this.updateVotePercentageChart(candidates);
            }

            console.log('App: Dashboard creating demographic charts with:', demographics);
            this.updateDemographicChartsData(demographics);
            console.log('App: Dashboard updating AI insights with:', aiInsights);
            this.updateAIInsights(aiInsights); // This will populate #summary-text and #other-insights-content
            console.log('App: Dashboard updating analytics with:', data);
            this.updateAnalytics(data);

            console.log("App: Dashboard updated successfully.");
            console.log(`[After updateDashboard] Canvas element for votesPerCandidateChart exists:`, !!document.getElementById('votesPerCandidateChart'));
            console.log(`[After updateDashboard] Canvas element for votePercentageShareChart exists:`, !!document.getElementById('votePercentageShareChart'));
        }

        async createPredictionChart() {
            console.log('createPredictionChart called.');
            try {
                const data = await this.api.getLivePredictions();
                console.log('Data from getLivePredictions:', data);
                if (data && data.predictions) {
                    const labels = data.predictions.map(p => p.name);
                    const probabilities = data.predictions.map(p => p.probability);

                    this.chartMgr.createChart('predictionChart', 'bar', {
                        labels: labels,
                        datasets: [{
                            label: 'Prediction Probability',
                            data: probabilities,
                            backgroundColor: this.chartMgr.colors.gradient,
                            borderColor: this.chartMgr.colors.gradient.map(c => c.replace('80', '')),
                            borderWidth: 1
                        }]
                    }, {
                        plugins: {
                            legend: { display: false },
                            title: { display: false }
                        },
                        scales: {
                            x: { display: false },
                            y: { display: false }
                        }
                    });

                    const predictionTextEl = document.querySelector('.prediction-text');
                    if (predictionTextEl) {
                        predictionTextEl.textContent = `AI is predicting ${data.leading_candidate} will win with ${data.predictions[0].probability.toFixed(1)}% probability`;
                    }
                    const confidenceMeterEl = document.getElementById('confidenceMeter');
                    const confidenceTextEl = document.getElementById('confidenceText');
                    if (confidenceMeterEl && confidenceTextEl) {
                        confidenceMeterEl.style.width = `${data.confidence}%`;
                        confidenceTextEl.textContent = `${data.confidence}%`;
                    }
                }
            } catch (e) {
                console.error('Failed to create prediction chart:', e);
            }
        }

        async createTurnoutHeatmap() {
            console.log('createTurnoutHeatmap called.');
            try {
                const data = await this.api.request('/api/analytics/turnout-heatmap');
                console.log('Data from turnout-heatmap:', data);
                if (data && data.success) {
                    // For a bar chart, we need labels and data arrays
                    const labels = data.data.map(d => d.constituency || d.label); // Use constituency name or label for bar labels
                    const turnoutData = data.data.map(d => d.r); // Use 'r' value for bar height

                    this.chartMgr.createChart('turnoutHeatmapChart', 'bar', {
                        labels: labels,
                        datasets: [{
                            label: 'Voter Turnout',
                            data: turnoutData,
                            backgroundColor: this.chartMgr.colors.avalanche, // Use a standard color palette
                            borderColor: this.chartMgr.colors.avalanche.map(c => c.replace('80','')),
                            borderWidth: 1,
                            borderRadius: 5 // Rounded bars
                        }]
                    }, {
                        plugins: {
                            tooltip: {
                                // Tooltip settings from defaultOptions will apply
                                // Custom callbacks can be added if needed
                            },
                            title:{
                                display:true,
                                text: 'Top Constituencies by Voter Turnout',
                                font: { size: 20, weight: 'bold' },
                                color: getThemeColors().textColor
                            }
                        },
                        scales:{
                            x:{
                                display: true, // Display X-axis for labels
                                title:{
                                    display:true,
                                    text: 'Constituency',
                                    font: { size: 16, weight: 'bold' },
                                    color: getThemeColors().textColor
                                },
                                ticks:{
                                    font: { size: 14, weight: 'bold' },
                                    color: getThemeColors().textColor
                                }
                            },
                            y:{
                                display: true, // Display Y-axis for values
                                title:{}
                            }
                        }
                    });
                }
            } catch (e) {
                console.error('Failed to create turnout heatmap:', e);
            }
        }

        showOverallDashboard() {
            const constituencySection = document.getElementById('constituency-analysis');
            const comprehensiveSection = document.getElementById('comprehensive-analysis');
            const candidateSection = document.getElementById('candidate-results');
            const demographicSection = document.getElementById('demographic-analytics');
            const historicalSection = document.getElementById('historical-analysis-section');
            const heatmapSection = document.getElementById('heatmap-section');
            const visualizationSection = document.getElementById('visualization-section-id');
            const heroSection = document.querySelector('.hero-section');

            if (constituencySection) constituencySection.classList.add('d-none');
            if (comprehensiveSection) comprehensiveSection.classList.remove('d-none');
            if (candidateSection) candidateSection.classList.remove('d-none');
            if (demographicSection) demographicSection.classList.remove('d-none');
            if (historicalSection) historicalSection.classList.remove('d-none');
            if (heatmapSection) heatmapSection.classList.remove('d-none');
            if (visualizationSection) visualizationSection.classList.remove('d-none');
            if (heroSection) heroSection.classList.remove('d-none');

            const constituencyHeader = document.getElementById('constituency-header');
            if (constituencyHeader) constituencyHeader.classList.add('d-none');

            const feedWrapper = document.querySelector('.feed-content-wrapper');
            if (feedWrapper) feedWrapper.classList.remove('d-none');

            this.searchMgr.input.value = '';
            currentConstituency = null;
        }
        async loadConstituencyAnalysis(name) {
            connectionManager.showLoading(`Loading ${name} Analysis...`);
            try {
                const data = await this.api.getConstituencyAnalysis(name);
                if (data?.success) {
                    this.displayConstituencyAnalysis(name, data);
                } else {
                    console.warn('Failed to load analysis for', name);
                }
            } catch(e) {
                console.error('Error loading constituency analysis:', e);
            }
            finally {
                connectionManager.hideLoading();
            }
        }
        displayConstituencyAnalysis(name, data) {
            console.log('displayConstituencyAnalysis called with data:', data); // Added log
            if (!data || !data.constituency_name) {
                this.showToastNotification(`No analysis data available for ${name}.`, 'warning');
                console.warn('Missing analysis data for constituency', name, data);
                return;
            }

            const feedWrapper = document.querySelector('.feed-content-wrapper');
            if (feedWrapper) feedWrapper.classList.add('d-none');

            const comprehensiveSection = document.getElementById('comprehensive-analysis');
            const candidateSection = document.getElementById('candidate-results');
            const demographicSection = document.getElementById('demographic-analytics');
            const historicalSection = document.getElementById('historical-analysis-section');
            const heatmapSection = document.getElementById('heatmap-section');
            const visualizationSection = document.getElementById('visualization-section-id');
            const constituencySection = document.getElementById('constituency-analysis');
            const contentDisplay = document.getElementById('constituency-details-content');
            const nameDisplay = document.getElementById('constituency-name-display');
            const heroSection = document.querySelector('.hero-section');

            if (!comprehensiveSection || !candidateSection || !demographicSection || !constituencySection || !contentDisplay || !nameDisplay || !historicalSection || !heatmapSection || !visualizationSection || !heroSection) {
                console.error("One or more display sections are missing from the DOM for constituency analysis.");
                return;
            }

            comprehensiveSection.classList.add('d-none');
            candidateSection.classList.add('d-none');
            demographicSection.classList.add('d-none');
            historicalSection.classList.add('d-none');
            heatmapSection.classList.add('d-none');
            visualizationSection.classList.add('d-none');
            heroSection.classList.add('d-none');

            nameDisplay.textContent = name;

            const analysisHtml = `
                <div class="row">
                    <div class="col-lg-6">
                        <div class="chart-card">
                            <h5 class="chart-title">
                                <i class="fas fa-chart-bar me-2 text-avalanche-cyan"></i>
                                Votes Per Candidate
                            </h5>
                            <div class="chart-container">
                                <canvas id="constituencyVotesPerCandidateChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="chart-card">
                            <h5 class="chart-title">
                                <i class="fas fa-chart-pie me-2"></i>
                                Vote Percentage Share
                            </h5>
                            <div class="chart-container">
                                <canvas id="constituencyVotePercentageShareChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4 narrative-section" id="candidate-narrative-constituency">
                    <!-- Candidate narrative insights will be injected here -->
                </div>

                <h3 class="section-title-dynamic mt-4">Demographic Analytics</h3>
                <div class="row">
                    <div class="col-lg-6">
                        <div class="chart-card">
                            <h5 class="chart-title">
                                <i class="fas fa-birthday-cake me-2"></i>
                                Age Distribution
                            </h5>
                            <div class="chart-container">
                                <canvas id="constituencyAgeGroupDistributionChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="chart-card">
                            <h5 class="chart-title">
                                <i class="fas fa-venus-mars me-2"></i>
                                Gender Trends
                            </h5>
                            <div class="chart-container">
                                <canvas id="constituencyGenderTrendsChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="mt-4 narrative-section" id="demographic-narrative-constituency">
                    <!-- Demographic narrative insights will be injected here -->
                </div>

                <h3 class="section-title-dynamic mt-4">Historical Vote Trend</h3>
                <div class="chart-card">
                    <div class="chart-container">
                        <canvas id="constituencyHistoricalChart"></canvas>
                    </div>
                </div>

                <button class="btn btn-avalanche mt-4" id="backToOverviewBtn">Back to Overview</button>
            `;
            
            contentDisplay.innerHTML = analysisHtml;

            // Render Candidate Charts
            setTimeout(() => {
                if (data.chart_data && data.chart_data.candidate_votes && data.chart_data.candidate_votes.labels.length > 0) {
                    const rawCandidates = data.chart_data.candidate_votes.labels.map((label, index) => ({
                        name: label,
                        votes: data.chart_data.candidate_votes.votes[index],
                        percentage: data.chart_data.candidate_votes.percentages[index]
                    }));

                    // Sort by votes and take top 5
                    const sortedCandidates = rawCandidates.sort((a, b) => b.votes - a.votes).slice(0, 5);

                    // Pad with empty data if less than 5 candidates
                    const paddedLabels = sortedCandidates.map(c => c.name);
                    const paddedVotes = sortedCandidates.map(c => c.votes);
                    const paddedPercentages = sortedCandidates.map(c => c.percentage);

                    while (paddedLabels.length < 5) {
                        paddedLabels.push(`Candidate ${paddedLabels.length + 1}`);
                        paddedVotes.push(0);
                        paddedPercentages.push(0);
                    }

                    const votesCanvas = document.getElementById('constituencyVotesPerCandidateChart');
                    if (votesCanvas) {
                        votesCanvas.style.width = '100%';
                        votesCanvas.style.height = '350px'; // Set a default height
                        this.chartMgr.createChart('constituencyVotesPerCandidateChart', 'bar', {
                            labels: paddedLabels,
                            datasets: [{
                                label: 'Votes',
                                data: paddedVotes,
                                backgroundColor: this.chartMgr.colors.avalanche
                            }]
                        });
                    }

                    const percentageCanvas = document.getElementById('constituencyVotePercentageShareChart');
                    if (percentageCanvas) {
                        percentageCanvas.style.width = '100%';
                        percentageCanvas.style.height = '350px'; // Set a default height
                        this.chartMgr.createChart('constituencyVotePercentageShareChart', 'doughnut', {
                            labels: paddedLabels,
                            datasets: [{
                                data: paddedPercentages,
                                backgroundColor: this.chartMgr.colors.avalanche
                            }]
                        });
                    }
                } else {
                    const candidateNarrativeEl = document.getElementById('candidate-narrative-constituency');
                    if (candidateNarrativeEl) {
                        candidateNarrativeEl.innerHTML = '<p class="text-center text-muted mt-3">No votes recorded yet for this constituency.</p>';
                    }
                }
            }, 500); // Increased delay to allow DOM to render

            // Render Demographic and Historical Charts
            setTimeout(() => {
                console.log('Demographic charts rendering. Gender distribution data:', data.chart_data?.gender_distribution); // Added log
                if (data.chart_data && data.chart_data.age_distribution && data.chart_data.age_distribution.labels.length > 0) {
                    const ageCanvas = document.getElementById('constituencyAgeGroupDistributionChart');
                    if (ageCanvas) {
                        ageCanvas.style.width = '100%';
                        ageCanvas.style.height = '350px'; // Set a default height
                        this.chartMgr.createChart('constituencyAgeGroupDistributionChart', 'bar', {
                            labels: data.chart_data.age_distribution.labels,
                            datasets: [{
                                label: 'Votes',
                                data: data.chart_data.age_distribution.counts,
                                backgroundColor: this.chartMgr.colors.rainbow
                            }]
                        });
                    }
                }

                if (data.chart_data && data.chart_data.gender_distribution && data.chart_data.gender_distribution.labels.length > 0) {
                    console.log('Attempting to create constituencyGenderTrendsChart with data:', data.chart_data.gender_distribution);
                    const genderCanvas = document.getElementById('constituencyGenderTrendsChart');
                    if (genderCanvas) {
                        console.log('constituencyGenderTrendsChart canvas element found.');
                        genderCanvas.style.width = '100%';
                        genderCanvas.style.height = '350px'; // Set a default height
                        this.chartMgr.createChart('constituencyGenderTrendsChart', 'pie', {
                            labels: data.chart_data.gender_distribution.labels,
                            datasets: [{
                                data: data.chart_data.gender_distribution.counts,
                                backgroundColor: ['#2D74DA', '#E84142', '#00D4AA']
                            }]
                        });
                        console.log('constituencyGenderTrendsChart created.');
                    } else {
                        console.warn('constituencyGenderTrendsChart canvas element NOT found.');
                    }
                } else {
                    console.warn('No gender_distribution data available or invalid for constituencyGenderTrendsChart.', data.chart_data?.gender_distribution);
                    const demographicNarrativeEl = document.getElementById('demographic-narrative-constituency');
                    if (demographicNarrativeEl) {
                        demographicNarrativeEl.innerHTML = '<p class="text-center text-muted mt-3">No demographic data available for this constituency.</p>';
                    }
                }

                if (data.historical_data && data.historical_data.labels.length > 0) {
                    const historicalCanvas = document.getElementById('constituencyHistoricalChart');
                    if (historicalCanvas) {
                        this.chartMgr.createChart('constituencyHistoricalChart', 'bar', {
                            labels: data.historical_data.labels,
                            datasets: [{
                                label: 'Total Votes',
                                data: data.historical_data.data,
                                backgroundColor: this.chartMgr.colors.gradient
                            }]
                        });
                    }
                }
            }, 500); // Increased delay to allow DOM to render

            // Populate Narrative Insights
            const candidateNarrativeEl = document.getElementById('candidate-narrative-constituency');
            const demographicNarrativeEl = document.getElementById('demographic-narrative-constituency');
            const constituencySummaryTextEl = document.getElementById('constituency-summary-text');

            if (constituencySummaryTextEl && data.narrative_insights && data.narrative_insights.length > 4) {
                constituencySummaryTextEl.innerHTML = `
                    <p class="lead mb-2 hover-glow-blue">${data.narrative_insights[1]}</p>
                    <p class="lead mb-2 hover-glow-blue">${data.narrative_insights[2]}</p>
                    <p class="text-muted hover-glow-green">${data.narrative_insights[3]}</p>
                    <p class="text-muted hover-glow-green">${data.narrative_insights[4]}</p>
                `;
            }

            if (candidateNarrativeEl && data.narrative_insights && data.narrative_insights.length > 1) {
                candidateNarrativeEl.innerHTML = ``;
            }

            if (demographicNarrativeEl && data.narrative_insights && data.narrative_insights.length > 5) {
                demographicNarrativeEl.innerHTML = data.narrative_insights.slice(5).map(insight => `<p>${insight}</p>`).join('');
            }


            // Show the constituency header
            const constituencyHeader = document.getElementById('constituency-header');
            const constituencyHeaderName = document.getElementById('constituency-header-name');
            const backToOverallBtn = document.getElementById('back-to-overall');

            if (constituencyHeader && constituencyHeaderName) {
                constituencyHeader.classList.remove('d-none');
                constituencyHeaderName.textContent = `Analysis for: ${name}`;
                if (backToOverallBtn) {
                    backToOverallBtn.onclick = () => this.showOverallDashboard();
                }
            }

            constituencySection.classList.remove('d-none');
            constituencySection.offsetHeight; // Force reflow
            constituencySection.scrollIntoView({ behavior: 'smooth' });

            // The backToOverviewBtn event listener is now handled above within the constituencyHeader check.
            // document.getElementById('backToOverviewBtn').addEventListener('click', () => {
            //     this.showOverallDashboard();
            // });
        }
        handle3DVisualizationUpdate(data) {
            console.log('handle3DVisualizationUpdate called with data:', data);
            const container = document.getElementById('threejs-container');
            if (!container || !window.THREE) return;

            if (!this.threeJs.scene) {
                this.threeJs.scene = new THREE.Scene();
                this.threeJs.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
                this.threeJs.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
                this.threeJs.renderer.setSize(container.clientWidth, container.clientHeight);
                container.appendChild(this.threeJs.renderer.domElement);

                const textureLoader = new THREE.TextureLoader();
                const earthTexture = textureLoader.load('https://threejs.org/examples/textures/land_ocean_ice_cloud_2048.jpg');

                const globeGeometry = new THREE.SphereGeometry(100, 64, 64);
                const globeMaterial = new THREE.MeshPhongMaterial({
                    map: earthTexture, // Apply earth texture
                    transparent: true,
                    opacity: 0.9,
                    shininess: 10
                });
                this.threeJs.globe = new THREE.Mesh(globeGeometry, globeMaterial);
                this.threeJs.scene.add(this.threeJs.globe);

                // Add Stars
                const starGeometry = new THREE.BufferGeometry();
                const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 1, sizeAttenuation: true });
                const starVertices = [];
                for (let i = 0; i < 10000; i++) { // 10,000 stars
                    const x = (Math.random() - 0.5) * 2000;
                    const y = (Math.random() - 0.5) * 2000;
                    const z = (Math.random() - 0.5) * 2000;
                    starVertices.push(x, y, z);
                }
                starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
                const stars = new THREE.Points(starGeometry, starMaterial);
                this.threeJs.scene.add(stars);

                const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
                this.threeJs.scene.add(ambientLight);
                const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
                directionalLight.position.set(5, 3, 5);
                this.threeJs.scene.add(directionalLight);

                this.threeJs.controls = new THREE.OrbitControls(this.threeJs.camera, this.threeJs.renderer.domElement);
                this.threeJs.controls.enableDamping = true;
                this.threeJs.controls.dampingFactor = 0.05;
                this.threeJs.controls.screenSpacePanning = false;
                this.threeJs.controls.minDistance = 120;
                this.threeJs.controls.maxDistance = 300;

                this.threeJs.camera.position.z = 200;

                const animate = () => {
                    requestAnimationFrame(animate);
                    this.threeJs.controls.update();
                    this.threeJs.renderer.render(this.threeJs.scene, this.threeJs.camera);
                    if (this.threeJs.globe) {
                        this.threeJs.globe.rotation.y += 0.0005;
                    }
                };
                animate();

                window.addEventListener('resize', () => {
                    this.threeJs.camera.aspect = container.clientWidth / container.clientHeight;
                    this.threeJs.camera.updateProjectionMatrix();
                    this.threeJs.renderer.setSize(container.clientWidth, container.clientHeight);
                });
            }

            if (data && data.constituencies) {
                if (this.threeJs.markers) {
                    this.threeJs.markers.forEach(marker => this.threeJs.scene.remove(marker));
                }
                this.threeJs.markers = [];

                data.constituencies.forEach(c => {
                    const lat = c.lat;
                    const lon = c.lng;
                    const radius = 100;
                    const phi = (90 - lat) * (Math.PI / 180);
                    const theta = (lon + 180) * (Math.PI / 180);

                    const x = -(radius * Math.sin(phi) * Math.cos(theta));
                    const y = radius * Math.cos(phi);
                    const z = radius * Math.sin(phi) * Math.sin(theta);

                    const markerGeometry = new THREE.SphereGeometry(3, 16, 16); // Slightly larger marker
                    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xE84142 });
                    const marker = new THREE.Mesh(markerGeometry, markerMaterial);
                    marker.position.set(x, y, z);
                    this.threeJs.scene.add(marker);
                    this.threeJs.markers.push(marker);
                });
            }
        }
        handleError(error) {
            console.error('App initialization failed:', error);
            connectionManager.hideLoading();
            this.showToastNotification(`Application Error: ${error.message}`, 'error');
        }

        handleNewTransaction(transactionData) {
            console.log("New transaction received:", transactionData);
            const feedContainer = document.getElementById('transactionFeed');
            if (feedContainer && transactionData.transaction) {
                const tx = transactionData.transaction;
                const txElement = document.createElement('div');
                txElement.className = 'transaction-item';
                txElement.setAttribute('data-tx-hash', tx.tx_hash);
                txElement.innerHTML = `
                    <span class="tx-icon"><i class="fas fa-receipt"></i></span>
                    <span class="tx-hash">${tx.tx_hash.substring(0, 12)}...</span>
                    <span class="tx-details">Vote for Candidate ${tx.candidate_id}</span>
                    <span class="tx-amount ms-auto">${(tx.gas_used / 1000000).toFixed(4)} AVAX</span>`;
                feedContainer.prepend(txElement);
                while (feedContainer.children.length > 5) {
                    feedContainer.lastChild.remove();
                }
            }
        }

        handlePredictionUpdate(data) {
            console.log('App: handlePredictionUpdate called with data:', data);
            if (!data || !data.predictions || data.predictions.length === 0) {
                console.warn('handlePredictionUpdate: No valid prediction data received.', data);
                return;
            }

            const predictionTextEl = document.querySelector('.prediction-text');
            if (predictionTextEl) {
                predictionTextEl.textContent = `AI is predicting ${data.leading_candidate} will win with ${data.predictions[0].probability.toFixed(1)}% probability`;
            }

            const confidenceMeterEl = document.getElementById('confidenceMeter');
            const confidenceTextEl = document.getElementById('confidenceText');
            if (confidenceMeterEl && confidenceTextEl) {
                confidenceMeterEl.style.width = `${data.confidence}%`;
                confidenceTextEl.textContent = `${data.confidence}%`;
            }

            // Update the prediction chart if it exists
            if (this.chartMgr.charts['predictionChart']) {
                const labels = data.predictions.map(p => p.name);
                const probabilities = data.predictions.map(p => p.probability);
                this.chartMgr.updateChart('predictionChart', {
                    labels: labels,
                    datasets: [{
                        label: 'Prediction Probability',
                        data: probabilities,
                        backgroundColor: this.chartMgr.colors.gradient,
                        borderColor: this.chartMgr.colors.gradient.map(c => c.replace('80', '')),
                        borderWidth: 1
                    }]
                });
            }
        }

        showToastNotification(message, type = 'info') {
            const toastContainer = document.getElementById('toast-container');
            if (!toastContainer) {
                const newContainer = document.createElement('div');
                newContainer.id = 'toast-container';
                newContainer.style.cssText = `
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    z-index: 1050;
                `;
                document.body.appendChild(newContainer);
                toastContainer = newContainer;
            }

            const toast = document.createElement('div');
            toast.className = `toast-notification ${type}`;
            toast.innerHTML = message;
            toast.style.cssText = `background: ${type === 'error' ? '#E84142' : type === 'success' ? '#00D4AA' : '#2D74DA'};
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                margin-bottom: 10px;
                max-width: 350px;
                animation: slideInRight 0.3s ease-out;
            `;
            toastContainer.appendChild(toast);
            setTimeout(() => {
                toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
                toast.addEventListener('animationend', () => toast.remove());
            }, 5000);
        }

        showStatDetailModal(title, content) {
            const modalTitle = document.getElementById('statDetailModalLabel');
            const modalBody = document.getElementById('statDetailModalBody');
            if (modalTitle && modalBody) {
                modalTitle.textContent = title;
                modalBody.innerHTML = content;
                const statModal = new bootstrap.Modal(document.getElementById('statDetailModal'));
                statModal.show();
            }
        }

        animateNumber(element, endValue, duration = 1000) {
            if (!element) return;
            const startValue = parseInt(element.textContent.replace(/,/g, '')) || 0;
            if (startValue === endValue) return;

            let startTime = null;

            const step = (timestamp) => {
                if (!startTime) startTime = timestamp;
                const progress = Math.min((timestamp - startTime) / duration, 1);
                const currentValue = Math.floor(progress * (endValue - startValue) + startValue);
                element.textContent = currentValue.toLocaleString();
                if (progress < 1) {
                    window.requestAnimationFrame(step);
                }
            };

            window.requestAnimationFrame(step);
        }
    }

    // Instantiate and start app
    const app = new VotingAnalyticsApp();
    window.chartManager = app.chartMgr;
    window.connectionManager = connectionManager;

    // Simulate initial ready status after 3 seconds (can be removed)
    setTimeout(() => connectionManager.updateStatus('connected'), 3000);
});