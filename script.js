document.addEventListener('DOMContentLoaded', () => {
    console.log('Avalanche Voting Analytics - Enhanced System Loading...');
    
    // Configuration - Backend API connections
    const API_BASE_URL = window.location.protocol + '//' + window.location.host;
    const WEBSOCKET_URL = window.location.protocol + '//' + window.location.host;
    const FALLBACK_API = 'http://127.0.0.1:5000';
    
    // Global state management
    let socket = null;
    let scene, camera, renderer, globe;
    let currentTheme = 'light';
    let charts = {};
    let liveVoteCount = 0;
    let predictionConfidence = 0;
    let connectionStatus = 'connecting';
    let constituencies = [];
    let currentConstituency = null;
    
    // ===============================================
    // CONNECTION STATUS MANAGEMENT
    // ===============================================
    
    class ConnectionManager {
        constructor() {
            this.statusElement = document.getElementById('connectionStatus');
            this.loadingOverlay = document.getElementById('loadingOverlay');
            this.progressBar = document.getElementById('loadingProgress');
        }
        
        updateConnectionStatus(status) {
            if (!this.statusElement) return;
            
            this.statusElement.className = 'connection-status';
            
            switch(status) {
                case 'connected':
                    this.statusElement.classList.add('connected');
                    this.statusElement.innerHTML = '<span>CONNECTED</span>';
                    break;
                case 'disconnected':
                    this.statusElement.classList.add('disconnected');
                    this.statusElement.innerHTML = '<span>DISCONNECTED</span>';
                    break;
                case 'connecting':
                default:
                    this.statusElement.classList.add('connecting');
                    this.statusElement.innerHTML = '<span>CONNECTING...</span>';
                    break;
            }
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
            if (this.loadingOverlay) {
                this.loadingOverlay.classList.add('d-none');
            }
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
    
    // ===============================================
    // API SERVICE - BACKEND CONNECTIONS
    // ===============================================
    
    class APIService {
        constructor() {
            this.baseURL = API_BASE_URL;
            this.fallbackURL = FALLBACK_API;
        }
        
        async request(endpoint, options = {}) {
            const urls = [`${this.baseURL}${endpoint}`, `${this.fallbackURL}${endpoint}`];
            
            for (const url of urls) {
                try {
                    const response = await fetch(url, {
                        ...options,
                        headers: {
                            'Content-Type': 'application/json',
                            ...options.headers
                        }
                    });
                    
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }
                    
                    return await response.json();
                } catch (error) {
                    console.error(`Failed to fetch from ${url}:`, error.message);
                    if (url === urls[urls.length - 1]) {
                        throw error;
                    }
                }
            }
        }
        
        async getHealthStatus() {
            return this.request('/api/health');
        }
        
        async getAIInsights() {
            return this.request('/api/ai/insights');
        }
        
        async getLivePredictions() {
            return this.request('/api/ai/predictions/live');
        }
        
        async getEnhancedAnalytics() {
            return this.request('/api/analytics/enhanced');
        }
        
        async getConstituencies() {
            return this.request('/api/constituencies');
        }
        
        async getConstituencyAnalysis(constituency) {
            return this.request(`/api/analysis/constituency/${encodeURIComponent(constituency)}`);
        }
        
        async getLiveTransactions() {
            return this.request('/api/live/transactions');
        }
        
        async get3DVisualizationData() {
            return this.request('/api/visualization/3d');
        }
        
        async getNetworkStats() {
            return this.request('/api/blockchain/network-stats');
        }
        
        async getDemographicAnalysis() {
            return this.request('/api/analytics/demographics');
        }
    }
    
    // ===============================================
    // CHART VISUALIZATION MANAGER
    // ===============================================
    
    class ChartManager {
        constructor() {
            this.charts = {};
            this.colorSchemes = {
                avalanche: ['#E84142', '#2D74DA', '#FF6B35', '#00D4AA', '#9B59B6'],
                rainbow: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'],
                gradient: ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe']
            };
        }
        
        createChart(canvasId, type, data, options = {}) {
            const canvas = document.getElementById(canvasId);
            if (!canvas) {
                console.error(`Canvas element not found: ${canvasId}`);
                return null;
            }
            
            const ctx = canvas.getContext('2d');
            
            // Destroy existing chart if exists
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
            }
            
            // Enhanced chart options with animations
            const defaultOptions = {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: 'bold'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(26, 29, 41, 0.9)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#E84142',
                        borderWidth: 1,
                        cornerRadius: 10,
                        displayColors: true
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            };
            
            // Apply color scheme to data
            if (data.datasets && data.datasets.length > 0) {
                data.datasets.forEach((dataset, index) => {
                    if (!dataset.backgroundColor) {
                        if (type === 'doughnut' || type === 'pie') {
                            dataset.backgroundColor = this.colorSchemes.avalanche;
                            dataset.borderColor = '#ffffff';
                            dataset.borderWidth = 2;
                        } else {
                            dataset.backgroundColor = this.colorSchemes.avalanche[index % this.colorSchemes.avalanche.length] + '80';
                            dataset.borderColor = this.colorSchemes.avalanche[index % this.colorSchemes.avalanche.length];
                            dataset.borderWidth = 2;
                        }
                    }
                });
            }
            
            const mergedOptions = this.mergeOptions(defaultOptions, options, type);
            
            this.charts[canvasId] = new Chart(ctx, {
                type: type,
                data: data,
                options: mergedOptions
            });
            
            return this.charts[canvasId];
        }
        
        mergeOptions(defaultOptions, userOptions, chartType) {
            const merged = { ...defaultOptions, ...userOptions };
            
            // Type-specific enhancements
            if (chartType === 'line') {
                merged.elements = {
                    line: {
                        tension: 0.4,
                        borderCapStyle: 'round'
                    },
                    point: {
                        radius: 4,
                        hoverRadius: 8,
                        backgroundColor: '#ffffff',
                        borderWidth: 2
                    }
                };
            }
            
            if (chartType === 'bar') {
                merged.scales = {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#888',
                            font: {
                                weight: 'bold'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#888',
                            font: {
                                weight: 'bold'
                            }
                        }
                    }
                };
            }
            
            return merged;
        }
        
        updateChart(canvasId, newData) {
            if (this.charts[canvasId]) {
                this.charts[canvasId].data = newData;
                this.charts[canvasId].update();
            }
        }
        
        destroyChart(canvasId) {
            if (this.charts[canvasId]) {
                this.charts[canvasId].destroy();
                delete this.charts[canvasId];
            }
        }
    }
    
    // ===============================================
    // WEBSOCKET MANAGER - REAL-TIME UPDATES
    // ===============================================
    
    class WebSocketManager {
        constructor(apiService, chartManager) {
            this.apiService = apiService;
            this.chartManager = chartManager;
            this.socket = null;
            this.reconnectAttempts = 0;
            this.maxReconnectAttempts = 5;
        }
        
        connect() {
            try {
                // Try connecting to the correct WebSocket URL
                this.socket = io(WEBSOCKET_URL, {
                    transports: ['websocket', 'polling'],
                    timeout: 20000,
                    forceNew: true
                });
                
                this.setupEventHandlers();
                
            } catch (error) {
                console.error('WebSocket connection failed:', error);
                this.handleConnectionError();
            }
        }
        
        setupEventHandlers() {
            this.socket.on('connect', () => {
                console.log('WebSocket connected successfully');
                connectionManager.updateConnectionStatus('connected');
                this.reconnectAttempts = 0;
                
                // Request initial data
                this.socket.emit('request_live_data');
                this.socket.emit('request_3d_data');
            });
            
            this.socket.on('disconnect', () => {
                console.log('WebSocket disconnected');
                connectionManager.updateConnectionStatus('disconnected');
            });
            
            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                this.handleConnectionError();
            });
            
            // Live data updates
            this.socket.on('enhanced_voting_update', (data) => {
                this.handleVotingUpdate(data);
            });
            
            this.socket.on('blockchain_feed_update', (data) => {
                this.handleBlockchainUpdate(data);
            });
            
            this.socket.on('prediction_update', (data) => {
                this.handlePredictionUpdate(data);
            });
            
            this.socket.on('vote_count_update', (data) => {
                this.handleVoteCountUpdate(data);
            });
            
            this.socket.on('new_transaction', (data) => {
                this.handleNewTransaction(data);
            });
            
            this.socket.on('visualization_data', (data) => {
                this.handle3DVisualizationUpdate(data);
            });
        }
        
        handleConnectionError() {
            connectionManager.updateConnectionStatus('connecting');
            
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
                this.reconnectAttempts++;
                console.log(`Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
                
                setTimeout(() => {
                    this.connect();
                }, 3000 * this.reconnectAttempts);
            } else {
                console.error('Max reconnection attempts reached. Falling back to polling.');
                connectionManager.updateConnectionStatus('disconnected');
                this.startPollingFallback();
            }
        }
        
        handleVotingUpdate(data) {
            if (!app.initialDataLoaded) {
                app.handleInitialData(data);
            }

            if (data.election_data) {
                this.updateVoteDisplay(data.election_data);
            }
            
            if (data.ai_insights) {
                this.updateAIInsights(data.ai_insights);
                this.updateIntelligenceHub(data.ai_insights);
            }
            
            if (data.analytics) {
                this.updateAnalytics(data);
            }
        }
        
        handleBlockchainUpdate(data) {
            if (data.network_stats) {
                this.updateNetworkStats(data.network_stats);
            }
        }
        
        handlePredictionUpdate(data) {
            const confidenceEl = document.getElementById('confidenceText');
            const meterEl = document.getElementById('confidenceMeter');
            
            if (confidenceEl && data.confidence) {
                confidenceEl.textContent = `${Math.round(data.confidence)}%`;
            }
            
            if (meterEl && data.confidence) {
                meterEl.style.width = `${data.confidence}%`;
            }
            
            if (data.predictions) {
                this.updatePredictionText(data.predictions);
            }
        }
        
        handleVoteCountUpdate(data) {
            const totalVotesEl = document.getElementById('total-votes');
            const liveCountEl = document.getElementById('liveVoteCount');
            
            if (totalVotesEl && data.total_votes) {
                totalVotesEl.textContent = data.total_votes.toLocaleString();
                liveVoteCount = data.total_votes;
            }
            
            if (liveCountEl && data.total_votes) {
                liveCountEl.textContent = data.total_votes.toLocaleString();
            }
            
            // Update charts with new vote data
            if (data.votes_by_candidate) {
                this.updateVoteCharts(data.votes_by_candidate);
            }
        }
        
        handleNewTransaction(data) {
            this.addTransactionToFeed(data);
        }
        
        handle3DVisualizationUpdate(data) {
            if (window.votingVisualization) {
                window.votingVisualization.updateData(data);
            }
        }
        
        updateVoteDisplay(electionData) {
            if (electionData.candidates) {
                // Update candidate displays
                const candidateData = electionData.candidates.map(c => ({
                    name: c.name,
                    votes: c.votes || electionData.votes[c.id] || 0,
                    percentage: c.percentage || 0
                }));
                
                this.updateCandidateCharts(candidateData);
            }
        }
        
        updateAIInsights(insights) {
            const insightsContainer = document.getElementById('summary-text');
            if (insightsContainer && insights.length > 0) {
                const insightHtml = insights.slice(0, 3).map(insight => `
                    <div class="ai-insight-item mb-3">
                        <h6 class="text-avalanche-blue">${insight.title}</h6>
                        <p class="mb-1">${insight.description}</p>
                        <small class="text-muted">Confidence: ${Math.round(insight.confidence * 100)}%</small>
                    </div>
                `).join('');
                
                insightsContainer.innerHTML = insightHtml;
            }
        }
        
        updateAnalytics(data) {
            if (!data) return;
            // Update various stat elements
            const totalVotesEl = document.getElementById('total-votes');
            if (totalVotesEl && data.election_data?.current_turnout) {
                totalVotesEl.textContent = data.election_data.current_turnout.toLocaleString();
            }

            const totalInsightsEl = document.getElementById('total-insights');
            if (totalInsightsEl && data.ai_insights) {
                totalInsightsEl.textContent = data.ai_insights.length;
            }
            
            const avgConfidenceEl = document.getElementById('avg-confidence');
            if (avgConfidenceEl && data.analytics?.ai_predictions?.confidence) {
                const confidence = Math.round(data.analytics.ai_predictions.confidence * 100);
                avgConfidenceEl.textContent = `${confidence}%`;
            }
            
            const highPriorityEl = document.getElementById('high-importance');
            if (highPriorityEl && data.analytics?.security_status) {
                highPriorityEl.textContent = data.analytics.security_status.anomalies_detected || '0';
            }
        }

        updateIntelligenceHub(insights) {
            const hubContainer = document.getElementById('other-insights-content');
            if (hubContainer && insights.length > 0) {
                const insightHtml = insights.map(insight => `
                    <div class="narrative-insight mb-3">
                        <h6 class="text-avalanche-blue"><i class="fas fa-lightbulb me-2"></i>${insight.title}</h6>
                        <p>${insight.description}</p>
                        <div class="insight-meta mt-2">
                            <span class="badge bg-avalanche-green">Confidence: ${Math.round(insight.confidence * 100)}%</span>
                            <span class="badge bg-avalanche-orange ms-2">Priority: ${insight.importance}/10</span>
                        </div>
                    </div>
                `).join('');
                
                hubContainer.innerHTML = insightHtml;
            }
        }
        
        updateTransactionFeed(transactions) {
            const feedContainer = document.getElementById('transactionFeed');
            if (!feedContainer || !transactions.length) return;
            
            // Show latest transaction
            const latestTx = transactions[transactions.length - 1];
            if (latestTx && latestTx.transaction) {
                const tx = latestTx.transaction;
                const txElement = document.createElement('div');
                txElement.className = 'transaction-item';
                txElement.innerHTML = `
                    <span class="tx-hash">${tx.tx_hash.substring(0, 16)}...</span>
                    <span class="tx-details">Vote for Candidate ${tx.candidate_id}</span>
                    <span class="tx-amount">${(tx.gas_used / 1000000).toFixed(3)} AVAX</span>
                `;
                
                feedContainer.innerHTML = '';
                feedContainer.appendChild(txElement);
                
                // Fade out after 3 seconds
                setTimeout(() => {
                    txElement.style.opacity = '0.6';
                }, 3000);
            }
        }
        
        updateNetworkStats(stats) {
            const tpsEl = document.getElementById('tps-counter');
            const gasPriceEl = document.getElementById('gas-price');
            
            if (tpsEl && stats.live_tps) {
                tpsEl.textContent = `${stats.live_tps}k`;
            }
            
            if (gasPriceEl && stats.avg_fee) {
                gasPriceEl.textContent = stats.avg_fee;
            }
        }
        
        updateCandidateCharts(candidateData) {
            // Update main voting chart
            const chartData = {
                labels: candidateData.map(c => c.name),
                datasets: [{
                    label: 'Votes',
                    data: candidateData.map(c => c.votes),
                    backgroundColor: chartManager.colorSchemes.avalanche,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            
            chartManager.updateChart('votesPerCandidateChart', chartData);
            
            // Update percentage chart
            const percentageData = {
                labels: candidateData.map(c => c.name),
                datasets: [{
                    data: candidateData.map(c => c.percentage),
                    backgroundColor: chartManager.colorSchemes.avalanche,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            
            chartManager.updateChart('votePercentageShareChart', percentageData);
        }
        
        updateVoteCharts(voteData) {
            // Convert vote data object to arrays
            const candidates = Object.keys(voteData);
            const votes = Object.values(voteData);
            const totalVotes = votes.reduce((sum, v) => sum + v, 0);
            
            const chartData = {
                labels: candidates.map(id => `Candidate ${id}`),
                datasets: [{
                    label: 'Votes',
                    data: votes,
                    backgroundColor: chartManager.colorSchemes.avalanche,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            
            chartManager.updateChart('votesPerCandidateChart', chartData);
            
            // Update percentage chart
            const percentages = votes.map(v => totalVotes > 0 ? (v / totalVotes) * 100 : 0);
            const percentageData = {
                labels: candidates.map(id => `Candidate ${id}`),
                datasets: [{
                    data: percentages,
                    backgroundColor: chartManager.colorSchemes.avalanche,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            
            chartManager.updateChart('votePercentageShareChart', percentageData);
        }
        
        updatePredictionText(predictions) {
            const predictionContainer = document.getElementById('livePredicton');
            if (predictionContainer && predictions.length > 0) {
                const topPrediction = predictions[0];
                const candidateName = topPrediction.name || 'the leading candidate';
                const probability = (topPrediction.probability || 0).toFixed(1);

                predictionContainer.innerHTML = `
                    <div class="prediction-item">
                        <span class="prediction-text">
                            <i class="fas fa-chart-line me-2 text-avalanche-cyan"></i>
                            AI predicts <strong>${candidateName}</strong> has a <strong>${probability}%</strong> chance of winning.
                        </span>
                        <div class="prediction-graph">
                            <canvas id="predictionChart" width="200" height="60"></canvas>
                        </div>
                    </div>
                `;
            }
        }
        
        addTransactionToFeed(transactionEvent) {
            const feedContainer = document.getElementById('transactionFeed');
            if (!feedContainer) return;

            if (transactionEvent.transaction) {
                const tx = transactionEvent.transaction;

                const existingTx = feedContainer.querySelector(`[data-tx-hash="${tx.tx_hash}"]`);
                if (existingTx) {
                    return; 
                }

                const txElement = document.createElement('div');
                txElement.className = 'transaction-item';
                txElement.setAttribute('data-tx-hash', tx.tx_hash);
                
                txElement.innerHTML = `
                    <span class="tx-icon"><i class="fas fa-receipt"></i></span>
                    <span class="tx-hash">${tx.tx_hash.substring(0, 12)}...</span>
                    <span class="tx-details">Vote for Candidate ${tx.candidate_id}</span>
                    <span class="tx-amount ms-auto">${(tx.gas_used / 1000000).toFixed(4)} AVAX</span>
                `;
                
                feedContainer.prepend(txElement);

                while (feedContainer.children.length > 5) {
                    feedContainer.lastChild.remove();
                }
            }
        }
        
        startPollingFallback() {
            // Fallback polling when WebSocket fails
            setInterval(async () => {
                try {
                    const [analytics, predictions, transactions] = await Promise.allSettled([
                        this.apiService.getEnhancedAnalytics(),
                        this.apiService.getLivePredictions(),
                        this.apiService.getLiveTransactions()
                    ]);
                    
                    if (analytics.status === 'fulfilled') {
                        this.handleVotingUpdate({ 
                            election_data: analytics.value.election_data,
                            analytics: analytics.value.live_analytics,
                            ai_insights: analytics.value.ai_insights
                        });
                    }
                    
                    if (predictions.status === 'fulfilled') {
                        this.handlePredictionUpdate(predictions.value);
                    }
                    
                    if (transactions.status === 'fulfilled') {
                        this.handleBlockchainUpdate({ transactions: transactions.value.transactions });
                    }
                    
                } catch (error) {
                    console.error('Polling fallback error:', error);
                }
            }, 10000); // Poll every 10 seconds
        }
        
        disconnect() {
            if (this.socket) {
                this.socket.disconnect();
            }
        }
    }
    
    // ===============================================
    // CONSTITUENCY SEARCH MANAGER
    // ===============================================
    
    class SearchManager {
        constructor(apiService, chartManager) {
            this.apiService = apiService;
            this.chartManager = chartManager;
            this.constituencies = [];
            this.searchInput = null;
            this.searchResults = null;
            this.initializeSearch();
        }
        
        async initializeSearch() {
            this.searchInput = document.getElementById('constituencySearch');
            this.searchResults = document.getElementById('searchResults');
            
            if (!this.searchInput || !this.searchResults) {
                console.error("Search elements not found in the DOM.");
                return;
            }

            this.setupSearchEventListeners();

            try {
                const response = await this.apiService.getConstituencies();
                
                // Flexible data handling for constituencies
                if (response && Array.isArray(response.constituencies)) {
                    // Handles { success: true, constituencies: [...] }
                    this.constituencies = response.constituencies;
                } else if (Array.isArray(response)) {
                    // Handles a direct array response [...]
                    this.constituencies = response;
                } else {
                    throw new Error("Invalid or unexpected data format for constituencies.");
                }

            } catch (error) {
                console.error('Failed to load constituencies:', error);
                this.constituencies = [];
                this.showError("Could not load constituency data. Search is disabled.");
            }
        }
        
        setupSearchEventListeners() {
            const searchInput = document.getElementById('constituencySearch');
            const searchResults = document.getElementById('searchResults');
            const searchButton = document.getElementById('searchButton');
            
            if (!searchInput || !searchResults || !searchButton) return;
            
            this.searchInput = searchInput;
            this.searchResults = searchResults;
            this.highlightedIndex = -1;
            
            let searchTimeout;
            
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.performSearch(e.target.value);
                }, 300);
            });

            searchButton.addEventListener('click', () => {
                const query = this.searchInput.value;
                if (query) {
                    // Find the best match and select it
                    const bestMatch = this.constituencies.find(c => c.toLowerCase() === query.toLowerCase());
                    if (bestMatch) {
                        this.selectConstituency(bestMatch);
                    } else {
                        // If no exact match, take the first result from the filtered list
                        const filtered = this.constituencies.filter(c => c.toLowerCase().includes(query.toLowerCase()));
                        if (filtered.length > 0) {
                            this.selectConstituency(filtered[0]);
                        } else {
                            this.showError("No matching constituency found.");
                        }
                    }
                }
            });

            this.searchInput.addEventListener('keydown', (e) => {
                const items = this.searchResults.querySelectorAll('.search-result-item');
                if (items.length === 0) return;

                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    this.highlightedIndex = (this.highlightedIndex + 1) % items.length;
                    this.updateHighlight(items);
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    this.highlightedIndex = (this.highlightedIndex - 1 + items.length) % items.length;
                    this.updateHighlight(items);
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.highlightedIndex > -1) {
                        const selectedItem = items[this.highlightedIndex];
                        this.selectConstituency(selectedItem.dataset.constituency);
                    }
                } else if (e.key === 'Escape') {
                    this.hideSearchResults();
                }
            });
            
            this.searchInput.addEventListener('focus', () => {
                if (this.searchResults && this.searchResults.children.length > 0) {
                    this.searchResults.style.display = 'block';
                }
            });
            
            this.searchInput.addEventListener('blur', () => {
                setTimeout(() => {
                    if (this.searchResults) {
                        this.searchResults.style.display = 'none';
                    }
                }, 200);
            });
        }

        updateHighlight(items) {
            items.forEach((item, index) => {
                if (index === this.highlightedIndex) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
        }
        
        performSearch(query) {
            if (!query || query.length < 2) {
                this.hideSearchResults();
                return;
            }

            if (this.constituencies.length === 0) {
                this.displaySearchResults([]);
                return;
            }

            const filtered = this.constituencies.filter(c => 
                c.toLowerCase().includes(query.toLowerCase())
            );
            
            this.displaySearchResults(filtered.slice(0, 10));
        }
        
        displaySearchResults(results) {
            if (!this.searchResults) return;

            if (results.length === 0) {
                this.searchResults.innerHTML = `<div class="search-result-item text-muted">No results found.</div>`;
            } else {
                this.searchResults.innerHTML = results.map(result => `
                    <div class="search-result-item" data-constituency="${result}">
                        ${result}
                    </div>
                `).join('');

                this.searchResults.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('mousedown', (e) => {
                        this.selectConstituency(e.target.dataset.constituency);
                    });
                });
            }
            
            this.searchResults.style.display = 'block';
        }
        
        hideSearchResults() {
            if (this.searchResults) {
                this.searchResults.style.display = 'none';
                this.searchResults.innerHTML = '';
            }
        }
        
        async selectConstituency(constituency) {
            currentConstituency = constituency;
            
            if (this.searchInput) {
                this.searchInput.value = constituency;
            }
            
            this.hideSearchResults();
            
            // Load constituency analysis
            await this.loadConstituencyAnalysis(constituency);
        }
        
        async loadConstituencyAnalysis(constituency) {
            try {
                connectionManager.showLoading(`Loading analysis for ${constituency}...`);
                
                const analysis = await this.apiService.getConstituencyAnalysis(constituency);
                
                if (analysis.success) {
                    this.displayConstituencyAnalysis(constituency, analysis);
                } else {
                    throw new Error(analysis.error || 'Failed to load constituency analysis');
                }
                
                connectionManager.hideLoading();
                
            } catch (error) {
                console.error('Error loading constituency analysis:', error);
                connectionManager.hideLoading();
                this.showError(`Failed to load analysis for ${constituency}: ${error.message}`);
            }
        }
        
        displayConstituencyAnalysis(constituency, analysis) {
            const comprehensiveSection = document.getElementById('comprehensive-analysis');
            const candidateSection = document.getElementById('candidate-results');
            const demographicSection = document.getElementById('demographic-analytics');
            const constituencySection = document.getElementById('constituency-analysis');
            const contentDisplay = document.getElementById('constituency-analysis-content');
            const nameDisplay = document.getElementById('constituency-name-display');

            if (!comprehensiveSection || !candidateSection || !demographicSection || !constituencySection || !contentDisplay || !nameDisplay) {
                console.error("One or more display sections are missing from the DOM.");
                return;
            }

            // Hide main dashboard sections
            comprehensiveSection.style.display = 'none';
            candidateSection.style.display = 'none';
            demographicSection.style.display = 'none';

            // Set the title
            nameDisplay.textContent = constituency;

            // Build the inner HTML for the analysis
            const analysisHtml = `
                <div class="row">
                    <div class="col-lg-8">
                        <div class="constituency-insights">
                            <h5 class="text-avalanche-blue mb-3">AI Insights for ${constituency}</h5>
                            ${analysis.insights.map(insight => `
                                <div class="narrative-insight mb-3">
                                    <h6 class="text-avalanche-blue">${insight.title}</h6>
                                    <p>${insight.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    <div class="col-lg-4">
                        <div class="constituency-stats">
                            <div class="stat-card glass-effect p-3 mb-3">
                                <h5 class="text-avalanche-blue mb-3">Summary</h5>
                                <div class="stat-item mb-2"><strong>Total Votes:</strong> ${analysis.summary.total_votes.toLocaleString()}</div>
                                <div class="stat-item mb-2"><strong>Candidates:</strong> ${analysis.summary.total_candidates}</div>
                                <div class="stat-item mb-2"><strong>Years Covered:</strong> ${analysis.summary.years_covered.join(', ')}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="row mt-4">
                    <div class="col-lg-6">
                        <div class="chart-card">
                            <h5 class="chart-title">Age Distribution</h5>
                            <div class="chart-container" style="height: 300px;">
                                <canvas id="constituencyAgeChart"></canvas>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="chart-card">
                            <h5 class="chart-title">Gender Distribution</h5>
                            <div class="chart-container" style="height: 300px;">
                                <canvas id="constituencyGenderChart"></canvas>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="btn btn-avalanche mt-4" id="backToOverviewBtn">Back to Overview</button>
            `;
            
            contentDisplay.innerHTML = analysisHtml;

            // NOW create the charts, after the canvas elements are in the DOM
            if (analysis.chart_data) {
                const ageData = {
                    labels: Object.keys(analysis.chart_data.age_distribution),
                    datasets: [{ label: 'Votes', data: Object.values(analysis.chart_data.age_distribution).map(d => d.votes), backgroundColor: this.chartManager.colorSchemes.rainbow }]
                };
                this.chartManager.createChart('constituencyAgeChart', 'bar', ageData);

                const genderData = {
                    labels: Object.keys(analysis.chart_data.gender_distribution),
                    datasets: [{ data: Object.values(analysis.chart_data.gender_distribution).map(d => d.votes), backgroundColor: ['#2D74DA', '#E84142', '#00D4AA'] }]
                };
                this.chartManager.createChart('constituencyGenderChart', 'pie', genderData);
            }

            // Show the constituency section
            constituencySection.classList.remove('d-none');
            constituencySection.scrollIntoView({ behavior: 'smooth' });

            // Add event listener for the back button
            document.getElementById('backToOverviewBtn').addEventListener('click', () => {
                constituencySection.classList.add('d-none');
                comprehensiveSection.style.display = 'block';
                candidateSection.style.display = 'block';
                demographicSection.style.display = 'block';
            });
        }
        
        showOverview() {
            const comprehensiveSection = document.getElementById('comprehensive-analysis');
            const constituencySection = document.getElementById('constituency-analysis');
            
            if (comprehensiveSection) {
                comprehensiveSection.style.display = 'block';
            }
            
            if (constituencySection) {
                constituencySection.style.display = 'none';
            }
            
            // Clear search input
            if (this.searchInput) {
                this.searchInput.value = '';
            }
            
            currentConstituency = null;
        }
        
        // populateConstituencyDropdown() function removed
        
        showError(message) {
            const errorToast = document.createElement('div');
            errorToast.className = 'toast-notification error';
            errorToast.innerHTML = message;
            errorToast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #E84142;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 9999;
                max-width: 350px;
                animation: slideInRight 0.3s ease-out;
            `;
            
            document.body.appendChild(errorToast);
            
            setTimeout(() => {
                errorToast.remove();
            }, 5000);
        }
    }
    
    // ===============================================
    // THEME MANAGEMENT
    // ===============================================
    
    class ThemeManager {
        constructor() {
            this.currentTheme = localStorage.getItem('theme') || 'light';
            this.init();
        }
        
        init() {
            this.applyTheme(this.currentTheme);
            const themeToggle = document.getElementById('themeToggle');
            if (themeToggle) {
                themeToggle.addEventListener('click', () => {
                    this.toggleTheme();
                });
            }
        }
        
        toggleTheme() {
            this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
            this.applyTheme(this.currentTheme);
            localStorage.setItem('theme', this.currentTheme);
        }
        
        applyTheme(theme) {
            const body = document.body;
            const themeIcon = document.getElementById('themeIcon');
            
            if (theme === 'dark') {
                body.classList.remove('theme-light');
                body.classList.add('theme-dark');
                body.setAttribute('data-theme', 'dark');
                if (themeIcon) {
                    themeIcon.className = 'fas fa-moon rotate-slow';
                }
            } else {
                body.classList.remove('theme-dark');
                body.classList.add('theme-light');
                body.setAttribute('data-theme', 'light');
                if (themeIcon) {
                    themeIcon.className = 'fas fa-sun rotate-slow';
                }
            }
            
            // Re-render charts with new theme colors if they exist
            if (window.chartManager && window.chartManager.charts) {
                this.updateChartsForTheme();
            }
        }
        
        updateChartsForTheme() {
            // Update chart colors based on theme
            Object.keys(chartManager.charts).forEach(chartId => {
                const chart = chartManager.charts[chartId];
                if (chart) {
                    // Update chart options for theme
                    const isDark = this.currentTheme === 'dark';
                    
                    if (chart.options.scales) {
                        const textColor = isDark ? '#ffffff' : '#2c3e50';
                        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
                        
                        if (chart.options.scales.y) {
                            chart.options.scales.y.ticks.color = textColor;
                            chart.options.scales.y.grid.color = gridColor;
                        }
                        if (chart.options.scales.x) {
                            chart.options.scales.x.ticks.color = textColor;
                            chart.options.scales.x.grid.color = gridColor;
                        }
                    }
                    
                    if (chart.options.plugins && chart.options.plugins.legend) {
                        chart.options.plugins.legend.labels.color = isDark ? '#ffffff' : '#2c3e50';
                    }
                    
                    chart.update();
                }
            });
        }
    }
    
    // ===============================================
    // MAIN APPLICATION CLASS
    // ===============================================
    
    class VotingAnalyticsApp {
        constructor() {
            this.apiService = new APIService();
            this.chartManager = new ChartManager();
            this.wsManager = new WebSocketManager(this.apiService, this.chartManager);
            this.searchManager = new SearchManager(this.apiService, this.chartManager);
            this.themeManager = new ThemeManager();
            this.initialDataLoaded = false;
            this.loadingTimeout = null; // To manage the loading timeout
            this.allCandidates = []; // Store all candidates
            this.currentCandidateIndex = 0; // Current starting index for display
            this.candidateDisplayLimit = 5; // Number of candidates to display at once
            this.candidateRotationInterval = null; // To store the interval ID
            
            this.init();
        }
        
        async init() {
            console.log('Initializing Avalanche Voting Analytics...');
            
            // Set a timeout to prevent getting stuck on the loading screen
            this.loadingTimeout = setTimeout(() => {
                if (!this.initialDataLoaded) {
                    console.error("Application timed out waiting for initial data.");
                    this.handleInitializationError(new Error("Initial data load timed out."));
                }
            }, 15000); // 15-second timeout

            try {
                // Check backend health
                await this.checkBackendHealth();
                
                // Connect to WebSocket
                this.wsManager.connect();
                
                // Initialize 3D visualization if needed
                this.init3DVisualization();
                
                console.log('Application initialized successfully, waiting for data...');
                
            } catch (error) {
                console.error('Application initialization failed:', error);
                this.handleInitializationError(error);
                clearTimeout(this.loadingTimeout); // Clear timeout on error
            }
        }

        handleInitialData(data) {
            if (this.initialDataLoaded) return;
            console.log("handleInitialData: Received initial data, processing now.");

            // Clear the loading timeout since we received data
            clearTimeout(this.loadingTimeout);

            this.processAnalyticsData(data.election_data);
            this.processPredictionsData(data.ai_predictions || {}); // Safely pass ai_predictions
            
            if (data.analytics && data.analytics.demographics) {
                this.processDemographicsData(data.analytics.demographics);
                this.createDemographicCharts(data.analytics.demographics);
            } else {
                console.warn("handleInitialData: 'demographics' data missing from analytics object.", data);
            }
            
            if (data.election_data && data.election_data.candidates) {
                this.allCandidates = data.election_data.candidates; // Store all candidates
                this.createEnhancedCharts(this.allCandidates.slice(0, this.candidateDisplayLimit)); // Display initial 5
                this.startCandidateRotation();
            } else {
                console.error("handleInitialData: 'candidates' data missing from election_data object.", data);
            }

            this.setupEventListeners();
            connectionManager.hideLoading();
            this.initialDataLoaded = true;
            console.log("handleInitialData: Processing complete, UI should be visible.");
        }
        
        updateEnhancedCharts(candidateData) {
            if (!candidateData || candidateData.length === 0) return;

            const votesData = {
                labels: candidateData.map(c => c.name),
                datasets: [{
                    label: 'Votes',
                    data: candidateData.map(c => c.votes),
                    backgroundColor: this.chartManager.colorSchemes.avalanche,
                    borderColor: this.chartManager.colorSchemes.avalanche,
                    borderWidth: 1,
                    borderRadius: 5,
                }]
            };
            this.adjustChartHeight('votesPerCandidateChart', votesData);
            this.chartManager.updateChart('votesPerCandidateChart', votesData);

            const percentageData = {
                labels: candidateData.map(c => c.name),
                datasets: [{
                    data: candidateData.map(c => c.percentage),
                    backgroundColor: this.chartManager.colorSchemes.avalanche,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            this.chartManager.updateChart('votePercentageShareChart', percentageData);
        }

        startCandidateRotation() {
            if (this.candidateRotationInterval) {
                clearInterval(this.candidateRotationInterval);
            }
            this.candidateRotationInterval = setInterval(() => {
                if (this.allCandidates.length <= this.candidateDisplayLimit) {
                    clearInterval(this.candidateRotationInterval);
                    return;
                }

                this.currentCandidateIndex = (this.currentCandidateIndex + this.candidateDisplayLimit) % this.allCandidates.length;
                
                let candidatesToDisplay = this.allCandidates.slice(
                    this.currentCandidateIndex,
                    this.currentCandidateIndex + this.candidateDisplayLimit
                );

                if (candidatesToDisplay.length < this.candidateDisplayLimit) {
                    const remaining = this.candidateDisplayLimit - candidatesToDisplay.length;
                    candidatesToDisplay.push(...this.allCandidates.slice(0, remaining));
                }
                
                this.updateEnhancedCharts(candidatesToDisplay);
            }, 5000); // Rotate every 5 seconds
        }
        
        async checkBackendHealth() {
            try {
                const health = await this.apiService.getHealthStatus();
                console.log('Backend health check passed:', health.status);
                return health;
            } catch (error) {
                console.warn('Backend health check failed, using fallback mode');
                throw error;
            }
        }
        
        async loadInitialData() {
            // This function is now deprecated, initial data is loaded via WebSocket
        }
        
        processAnalyticsData(data) {
            if (data.election_data) {
                // Update vote counts
                const totalVotes = data.election_data.current_turnout;
                liveVoteCount = totalVotes;
                
                const totalVotesEl = document.getElementById('total-votes');
                if (totalVotesEl) {
                    totalVotesEl.textContent = totalVotes.toLocaleString();
                }
                
                const liveCountEl = document.getElementById('liveVoteCount');
                if (liveCountEl) {
                    liveCountEl.textContent = totalVotes.toLocaleString();
                }
                
                // Update turnout
                const turnoutEl = document.getElementById('participationRate');
                if (turnoutEl) {
                    turnoutEl.textContent = `${data.election_data.turnout_percentage}%`;
                }
            }
            
            if (data.live_analytics) {
                // Update AI insights count
                const insightsEl = document.getElementById('total-insights');
                if (insightsEl && data.live_analytics.ai_insights) {
                    insightsEl.textContent = data.live_analytics.ai_insights.length;
                }
                
                // Update confidence
                if (data.live_analytics.ai_predictions) {
                    const confidenceEl = document.getElementById('avg-confidence');
                    if (confidenceEl) {
                        const confidence = Math.round(data.live_analytics.ai_predictions.confidence * 100);
                        confidenceEl.textContent = `${confidence}%`;
                    }
                }
                
                // Update high priority count
                const highPriorityEl = document.getElementById('high-importance');
                if (highPriorityEl && data.live_analytics.security_status) {
                    highPriorityEl.textContent = data.live_analytics.security_status.anomalies_detected || '0';
                }
            }
            
            if (data.ai_insights) {
                this.updateDashboardSummary(data.ai_insights);
            }
        }
        
        processPredictionsData(data) {
            if (!data || !data.confidence) {
                console.warn("processPredictionsData: Missing or invalid confidence data.", data);
                return;
            }

            predictionConfidence = data.confidence;
            
            const confidenceTextEl = document.getElementById('confidenceText');
            const confidenceMeterEl = document.getElementById('confidenceMeter');
            
            if (confidenceTextEl) {
                confidenceTextEl.textContent = `${Math.round(data.confidence)}%`;
            }
            
            if (confidenceMeterEl) {
                confidenceMeterEl.style.width = `${data.confidence}%`;
            }
            
            if (data.predictions && data.predictions.length > 0) {
                const prediction = data.predictions[0];
                const predictionContainer = document.getElementById('livePredicton');
                
                if (predictionContainer) {
                    predictionContainer.innerHTML = `
                        <div class="prediction-item">
                            <span class="prediction-text">AI predicts ${data.leading_candidate || 'a candidate'} will win with ${prediction.probability.toFixed(1)}% probability</span>
                            <small class="text-muted d-block mt-1">Model confidence: ${Math.round(data.confidence)}%</small>
                        </div>
                    `;
                }
            } else {
                console.warn("processPredictionsData: No predictions array or empty.", data);
            }
        }
        
        processDemographicsData(insights) {
            // Update demographic narrative section
            const demographicNarrative = document.getElementById('demographic-narrative');
            if (demographicNarrative && insights && insights.length > 0) {
                const narrativeHtml = insights.filter(insight => insight.type === 'demographic').slice(0, 3).map(insight => `
                    <div class="narrative-insight fade-in-up">
                        <h6><i class="fas fa-lightbulb me-2"></i>${insight.title}</h6>
                        <p>${insight.description}</p>
                        <div class="mt-2">
                            <span class="badge bg-avalanche-blue">Confidence: ${Math.round(insight.confidence * 100)}%</span>
                            <span class="badge bg-avalanche-orange ms-2">Priority: ${insight.importance}/10</span>
                        </div>
                    </div>
                `).join('');
                
                demographicNarrative.innerHTML = narrativeHtml;
            }
        }
        
        updateDashboardSummary(insights) {
            const summaryEl = document.getElementById('summary-text');
            if (summaryEl && insights.length > 0) {
                const summaryHtml = insights.slice(0, 3).map(insight => `
                    <div class="narrative-insight mb-3">
                        <h6 class="text-avalanche-blue"><i class="fas fa-lightbulb me-2"></i>${insight.title}</h6>
                        <p>${insight.description}</p>
                        <div class="insight-meta mt-2">
                            <span class="badge bg-avalanche-green">Confidence: ${Math.round(insight.confidence * 100)}%</span>
                            <span class="badge bg-avalanche-orange ms-2">Priority: ${insight.importance}/10</span>
                        </div>
                    </div>
                `).join('');
                
                summaryEl.innerHTML = summaryHtml;
            }
        }
        
        adjustChartHeight(canvasId, data) {
            const canvas = document.getElementById(canvasId);
            if (!canvas || !canvas.parentElement) return;

            const container = canvas.parentElement;
            const numBars = data.labels.length;
            const barHeight = 40; // pixels per bar
            const padding = 60; // for title, labels, etc.
            const newHeight = (numBars * barHeight) + padding;
            
            container.style.height = `${Math.max(350, newHeight)}px`;
        }

        createEnhancedCharts(candidateData) {
            if (!candidateData || candidateData.length === 0) {
                console.warn("createEnhancedCharts: No candidate data provided.");
                return;
            }
            
            // Candidate votes chart (Horizontal Bar)
            const votesData = {
                labels: candidateData.map(c => c.name),
                datasets: [{
                    label: 'Votes',
                    data: candidateData.map(c => c.votes),
                    backgroundColor: this.chartManager.colorSchemes.avalanche,
                    borderColor: this.chartManager.colorSchemes.avalanche,
                    borderWidth: 1,
                    borderRadius: 5,
                }]
            };
            
            this.adjustChartHeight('votesPerCandidateChart', votesData);
            this.chartManager.createChart('votesPerCandidateChart', 'bar', votesData, {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Live Vote Count',
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: { display: false }
                },
                scales: {
                    y: { // The value axis (votes)
                        beginAtZero: true,
                        title: { 
                            display: true, 
                            text: 'Number of Votes' 
                        }
                    },
                    x: { // The category axis (candidates)
                        title: {
                            display: true,
                            text: 'Candidates'
                        }
                    }
                }
            });
            
            // Vote percentage chart
            const percentageData = {
                labels: candidateData.map(c => c.name),
                datasets: [{
                    data: candidateData.map(c => c.percentage),
                    backgroundColor: this.chartManager.colorSchemes.avalanche,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            
            this.chartManager.createChart('votePercentageShareChart', 'doughnut', percentageData, {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Vote Share %',
                        font: { size: 16, weight: 'bold' }
                    }
                }
            });
        }
        
        createDemographicCharts(demographics) {
            console.log("createDemographicCharts: Received demographics data:", JSON.stringify(demographics, null, 2));
            if (!demographics || !demographics.age_groups || !demographics.gender || !demographics.locations) {
                console.error("createDemographicCharts: Missing essential demographic data.", demographics);
                return;
            }

            // Age group distribution
            const ageGroupData = {
                labels: Object.keys(demographics.age_groups.counts),
                datasets: [{
                    label: 'Votes',
                    data: Object.values(demographics.age_groups.counts),
                    backgroundColor: this.chartManager.colorSchemes.rainbow,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            console.log("createDemographicCharts: Age Group Chart Data:", JSON.stringify(ageGroupData, null, 2));
            
            this.chartManager.createChart('ageGroupDistributionChart', 'bar', ageGroupData, {
                plugins: {
                    title: {
                        display: true,
                        text: 'Age Group Distribution'
                    }
                }
            });
            console.log("createDemographicCharts: Age Group Chart created.", this.chartManager.charts['ageGroupDistributionChart']);
            
            // Gender distribution
            const genderData = {
                labels: Object.keys(demographics.gender.counts),
                datasets: [{
                    data: Object.values(demographics.gender.counts),
                    backgroundColor: ['#2D74DA', '#E84142', '#00D4AA'],
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            console.log("createDemographicCharts: Gender Chart Data:", JSON.stringify(genderData, null, 2));
            
            this.chartManager.createChart('genderVotingTrendsChart', 'pie', genderData, {
                plugins: {
                    title: {
                        display: true,
                        text: 'Gender Distribution'
                    }
                }
            });
            console.log("createDemographicCharts: Gender Chart created.", this.chartManager.charts['genderVotingTrendsChart']);
            
            // Location participation
            const locationData = {
                labels: Object.keys(demographics.locations.top_10_counts),
                datasets: [{
                    label: 'Participation',
                    data: Object.values(demographics.locations.top_10_counts),
                    backgroundColor: this.chartManager.colorSchemes.gradient,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            console.log("createDemographicCharts: Location Chart Data:", JSON.stringify(locationData, null, 2));
            
            this.chartManager.createChart('locationParticipationChart', 'bar', locationData, {
                plugins: {
                    title: {
                        display: true,
                        text: 'Location-wise Participation'
                    }
                }
            });
            console.log("createDemographicCharts: Location Chart created.", this.chartManager.charts['locationParticipationChart']);
        }
        
        loadFallbackData() {
            // This function is now deprecated
        }
        
        setupEventListeners() {
            // 3D visualization controls
            const viewControls = {
                'viewGlobe': 'globe',
                'viewMap': 'map',
                'viewParticles': 'particles'
            };
            
            Object.entries(viewControls).forEach(([buttonId, viewType]) => {
                const button = document.getElementById(buttonId);
                if (button) {
                    button.addEventListener('click', () => this.switch3DView(viewType));
                }
            });

            // Stat card click events
            document.querySelectorAll('.stat-card').forEach(card => {
                card.addEventListener('click', (e) => {
                    const statType = e.currentTarget.dataset.stat;
                    this.handleStatCardClick(statType);
                });
            });

            // Cycle candidates button
            const cycleButton = document.getElementById('cycleCandidates');
            if (cycleButton) {
                cycleButton.addEventListener('click', () => this.cycleCandidates());
            }
        }

        cycleCandidates() {
            if (this.allCandidates.length <= this.candidateDisplayLimit) return;

            this.currentCandidateIndex = (this.currentCandidateIndex + this.candidateDisplayLimit) % this.allCandidates.length;
            
            let candidatesToDisplay = this.allCandidates.slice(
                this.currentCandidateIndex,
                this.currentCandidateIndex + this.candidateDisplayLimit
            );

            if (candidatesToDisplay.length < this.candidateDisplayLimit) {
                const remaining = this.candidateDisplayLimit - candidatesToDisplay.length;
                candidatesToDisplay.push(...this.allCandidates.slice(0, remaining));
            }
            
            this.updateEnhancedCharts(candidatesToDisplay);
        }

        handleStatCardClick(statType) {
            const modalTitle = document.getElementById('statDetailModalLabel');
            const modalBody = document.getElementById('statDetailModalBody');
            if (!modalTitle || !modalBody) return;

            let title = '';
            let bodyContent = '';

            switch(statType) {
                case 'total-votes':
                    title = 'Total Votes Analysis';
                    bodyContent = `
                        <p>This card shows the total number of votes cast and recorded on the Avalanche blockchain.</p>
                        <ul>
                            <li><strong>Live Count:</strong> ${document.getElementById('total-votes').textContent}</li>
                            <li><strong>Verification:</strong> Every vote is a transaction verified by the Avalanche network.</li>
                        </ul>
                    `;
                    break;
                case 'total-insights':
                    title = 'AI Insights Overview';
                    bodyContent = `
                        <p>This card displays the total number of AI-generated insights from the election data.</p>
                        <ul>
                            <li><strong>Total Insights:</strong> ${document.getElementById('total-insights').textContent}</li>
                            <li><strong>Analysis:</strong> Insights are generated by the Enhanced LLM Election Agent.</li>
                        </ul>
                    `;
                    break;
                case 'avg-confidence':
                    title = 'Average Confidence Score';
                    bodyContent = `
                        <p>This shows the average confidence score of the AI's predictions and insights.</p>
                        <ul>
                            <li><strong>Average Confidence:</strong> ${document.getElementById('avg-confidence').textContent}</li>
                        </ul>
                    `;
                    break;
                case 'high-importance':
                    title = 'High Priority Alerts';
                    bodyContent = `
                        <p>This card tracks the number of high-priority events, such as detected anomalies.</p>
                        <ul>
                            <li><strong>High Priority Events:</strong> ${document.getElementById('high-importance').textContent}</li>
                        </ul>
                    `;
                    break;
            }

            modalTitle.textContent = title;
            modalBody.innerHTML = bodyContent;

            const modal = new bootstrap.Modal(document.getElementById('statDetailModal'));
            modal.show();
        }
        
        handleWalletConnection() {
            const button = document.getElementById('connectWallet');
            if (!button) return;
            
            button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Connecting...';
            button.disabled = true;
            
            // Simulate wallet connection
            setTimeout(() => {
                button.innerHTML = '<i class="fas fa-check me-2"></i>Connected';
                button.classList.remove('btn-avalanche');
                button.classList.add('btn-success');
                
                this.showSuccessToast('Wallet connected successfully!');
            }, 2000);
        }
        
        switch3DView(viewType) {
            console.log(`Switching 3D view to: ${viewType}`);
            
            // Update active button
            document.querySelectorAll('.view-controls button').forEach(btn => {
                btn.classList.remove('active');
            });
            
            const activeButton = document.getElementById(`view${viewType.charAt(0).toUpperCase() + viewType.slice(1)}`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
            
            // Update 3D visualization if implemented
            if (window.votingVisualization) {
                window.votingVisualization.switchView(viewType);
            }
        }
        
        init3DVisualization() {
            const container = document.getElementById('threejs-container');
            if (!container) return;
            
            // Basic 3D scene setup (simplified)
            try {
                // This would contain the Three.js 3D visualization code
                // For now, just add a placeholder
                container.innerHTML = '<div class="text-center p-5"><h4 class="text-avalanche-blue">3D Visualization Loading...</h4><p class="text-muted">Interactive vote visualization will appear here</p></div>';
                
                // Load 3D data from backend
                this.load3DData();
            } catch (error) {
                console.error('3D visualization initialization failed:', error);
            }
        }
        
        async load3DData() {
            try {
                const data = await this.apiService.get3DVisualizationData();
                if (data.constituencies && data.particles) {
                    console.log('3D visualization data loaded:', data.constituencies.length, 'constituencies');
                    // Process 3D data here
                }
            } catch (error) {
                console.error('Failed to load 3D visualization data:', error);
            }
        }
        
        showSuccessToast(message) {
            const toast = document.createElement('div');
            toast.className = 'toast-notification success';
            toast.innerHTML = message;
            toast.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #00D4AA;
                color: white;
                padding: 15px 20px;
                border-radius: 8px;
                z-index: 9999;
                animation: slideInRight 0.3s ease-out;
            `;
            
            document.body.appendChild(toast);
            
            setTimeout(() => {
                toast.remove();
            }, 3000);
        }
        
        handleInitializationError(error) {
            console.error('Application failed to initialize:', error);
            
            connectionManager.updateConnectionStatus('disconnected');
            connectionManager.hideLoading();
            
            // Show error message to user
            const errorContainer = document.createElement('div');
            errorContainer.className = 'alert alert-warning m-3';
            errorContainer.innerHTML = `
                <h6><i class="fas fa-exclamation-triangle me-2"></i>Connection Issue</h6>
                <p>Unable to connect to the backend server. Running in demo mode with sample data.</p>
                <button class="btn btn-outline-primary btn-sm" onclick="location.reload()">Retry Connection</button>
            `;
            
            const container = document.querySelector('.container-fluid');
            if (container) {
                container.insertBefore(errorContainer, container.firstChild);
            }
            
            // Load fallback data
            this.loadFallbackData();
        }
    }
    
    // ===============================================
    // APPLICATION INITIALIZATION
    // ===============================================
    
    // Initialize managers
    const connectionManager = new ConnectionManager();
    const chartManager = new ChartManager();
    
    // Make globally available
    window.chartManager = chartManager;
    window.connectionManager = connectionManager;
    
    // Show initial loading
    connectionManager.showLoading('Initializing Avalanche Analytics...');
    
    // Start the application
    const app = new VotingAnalyticsApp();
    
    // Simulate connection process
    setTimeout(() => {
        connectionManager.updateConnectionStatus('connected');
    }, 3000);
    
    console.log('Avalanche Voting Analytics - Enhanced System Ready!');
});