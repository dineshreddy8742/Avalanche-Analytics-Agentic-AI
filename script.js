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
        }
        
        async request(endpoint, options = {}) {
            const url = `${this.baseURL}${endpoint}`;
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
                throw error;
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

        async getHistoricalVotes() {
            return this.request('/api/analytics/historical-votes');
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
                                size: 16,
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
                        displayColors: true,
                        titleFont: { size: 16, weight: 'bold' },
                        bodyFont: { size: 14 }
                    },
                    title: {
                        display: true,
                        font: {
                            size: 20,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 20
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutQuart'
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                scales: {
                    x: {
                        ticks: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        title: {
                            display: true,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    },
                    y: {
                        ticks: {
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        title: {
                            display: true,
                            font: {
                                size: 16,
                                weight: 'bold'
                            }
                        }
                    }
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
                app.handleInitializationError(error);
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
                        <h6 class="insight-title"><i class="fas fa-lightbulb me-2"></i>${insight.title}</h6>
                        <p class="insight-description">${insight.description}</p>
                        <div class="insight-meta mt-2">
                            <span class="badge bg-confidence">Confidence: ${Math.round(insight.confidence * 100)}%</span>
                            <span class="badge bg-priority ms-2">Priority: ${insight.importance}/10</span>
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
            const topCandidates = [...candidateData].sort((a, b) => b.votes - a.votes).slice(0, 5);

            // Update main voting chart
            const chartData = {
                labels: topCandidates.map(c => c.name),
                datasets: [{
                    label: 'Votes',
                    data: topCandidates.map(c => c.votes),
                    backgroundColor: chartManager.colorSchemes.avalanche,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            };
            
            chartManager.updateChart('votesPerCandidateChart', chartData);
            
            // Update percentage chart
            const percentageData = {
                labels: topCandidates.map(c => c.name),
                datasets: [{
                    data: topCandidates.map(c => c.percentage),
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
        constructor(apiService, chartManager, app) {
            this.apiService = apiService;
            this.chartManager = chartManager;
            this.app = app;
            this.constituencies = [];
            this.topSuggestions = [];
            this.searchInput = document.getElementById('constituencySearch');
            this.searchResults = document.getElementById('searchResults');
            this.searchButton = document.getElementById('searchButton');
            this.highlightedIndex = -1;
            this.initializeSearch();
        }

        setTopSuggestions(topLocations) {
            if (topLocations) {
                this.topSuggestions = Object.keys(topLocations).slice(0, 5);
            }
        }
        
        async initializeSearch() {
            console.log("SearchManager: Initializing search...");
            if (!this.searchInput || !this.searchResults || !this.searchButton) {
                console.error("SearchManager: Search elements not found in the DOM.");
                return;
            }

            this.setupSearchEventListeners();

            try {
                const response = await this.apiService.getConstituencies();
                console.log("SearchManager: Fetched constituencies response:", response);
                if (response && Array.isArray(response.constituencies)) {
                    this.constituencies = response.constituencies;
                    console.log("SearchManager: Constituencies loaded:", this.constituencies);
                } else {
                    throw new Error("Invalid data format for constituencies.");
                }
            } catch (error) {
                console.error('SearchManager: Failed to load constituencies:', error);
                this.constituencies = [];
                this.showError("Could not load constituency data.");
            }
        }
        
        setupSearchEventListeners() {
            let searchTimeout;
            
            this.searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => this.performSearch(e.target.value), 300);
            });

            this.searchButton.addEventListener('click', () => this.handleSearchAction());

            this.searchInput.addEventListener('keydown', (e) => {
                const items = this.searchResults.querySelectorAll('.search-result-item');
                
                if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (items.length > 0) {
                        this.highlightedIndex = (this.highlightedIndex + 1) % items.length;
                        this.updateHighlight(items);
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (items.length > 0) {
                        this.highlightedIndex = (this.highlightedIndex - 1 + items.length) % items.length;
                        this.updateHighlight(items);
                    }
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (this.highlightedIndex > -1 && items[this.highlightedIndex]) {
                        const selectedConstituency = items[this.highlightedIndex].dataset.constituency;
                        if (selectedConstituency) {
                            this.selectConstituency(selectedConstituency);
                        } else {
                            this.handleSearchAction();
                        }
                    } else {
                        this.handleSearchAction();
                    }
                } else if (e.key === 'Escape') {
                    this.hideSearchResults();
                }
            });
            
            this.searchInput.addEventListener('focus', () => {
                if (this.searchInput.value === '') {
                    this.displaySearchResults(this.topSuggestions, "Top Suggestions");
                } else if (this.searchResults.children.length > 0) {
                    this.searchResults.style.display = 'block';
                }
            });
            
            document.addEventListener('click', (e) => {
                if (!this.searchInput.contains(e.target) && !this.searchResults.contains(e.target)) {
                    this.hideSearchResults();
                }
            });
        }

        handleSearchAction() {
            const query = this.searchInput.value.trim();
            console.log("SearchManager: Handling search action for query:", query);
            if (!query) return;

            const exactMatch = this.constituencies.find(c => c.toLowerCase() === query.toLowerCase());
            if (exactMatch) {
                this.selectConstituency(exactMatch);
                return;
            }

            const partialMatches = this.constituencies.filter(c => c.toLowerCase().includes(query.toLowerCase()));
            if (partialMatches.length > 0) {
                this.selectConstituency(partialMatches[0]);
            } else {
                this.showError("No matching constituency found.");
            }
        }

        updateHighlight(items) {
            items.forEach((item, index) => {
                item.classList.toggle('active', index === this.highlightedIndex);
            });
        }
        
        performSearch(query) {
            console.log("SearchManager: Performing search for query:", query);
            if (!query || query.length < 2) {
                this.hideSearchResults();
                return;
            }

            if (this.constituencies.length === 0) {
                this.displaySearchResults([], "No data available");
                return;
            }

            const filtered = this.constituencies.filter(c => c.toLowerCase().includes(query.toLowerCase()));
            console.log("SearchManager: Filtered results:", filtered);
            this.displaySearchResults(filtered.slice(0, 10), "Results");
        }
        
        displaySearchResults(results, title) {
            if (!this.searchResults) return;

            let content = `<div class="search-result-title">${title}</div>`;
            if (results.length === 0 && title !== "Top Suggestions") {
                content += `<div class="search-result-item text-muted">No results found.</div>`;
            } else {
                content += results.map(result => `
                    <div class="search-result-item" data-constituency="${result}">
                        ${result}
                    </div>
                `).join('');
            }
            
            this.searchResults.innerHTML = content;
            this.searchResults.querySelectorAll('.search-result-item[data-constituency]').forEach(item => {
                item.addEventListener('mousedown', () => this.selectConstituency(item.dataset.constituency));
            });
            
            this.searchResults.style.display = 'block';
            this.highlightedIndex = -1;
        }
        
        hideSearchResults() {
            if (this.searchResults) {
                this.searchResults.style.display = 'none';
            }
        }
        
        showError(message) {
            this.displaySearchResults([], message);
        }
        
        async selectConstituency(constituency) {
            console.log("SearchManager: Selecting constituency:", constituency);
            currentConstituency = constituency;
            this.searchInput.value = constituency;
            this.hideSearchResults();
            await this.loadConstituencyAnalysis(constituency);
        }
        
        async loadConstituencyAnalysis(constituency) {
            console.log("SearchManager: Loading analysis for constituency:", constituency);
            try {
                connectionManager.showLoading(`Loading analysis for ${constituency}...`);
                const data = await this.apiService.getConstituencyAnalysis(constituency);
                console.log("SearchManager: Fetched analysis data:", data);
                
                if (data.success) {
                    this.app.updateDashboard(data.analysis, constituency);
                } else {
                    throw new Error(data.error || 'Failed to load constituency analysis');
                }
            } catch (error) {
                console.error('SearchManager: Error loading constituency analysis:', error);
                // You might want to show an error message to the user on the dashboard
            } finally {
                connectionManager.hideLoading();
            }
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
            this.searchManager = new SearchManager(this.apiService, this.chartManager, this);
            this.themeManager = new ThemeManager();
            this.initialDataLoaded = false;
            this.loadingTimeout = null; // To manage the loading timeout
            this.allCandidates = []; // Store all candidates
            this.candidateDisplayLimit = 5; // Number of candidates to show at once
            this.currentCandidateIndex = 0; // Starting index for rotation
            this.candidateRotationInterval = null; // To hold the interval ID
            
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
                
                // Load historical data for the line chart
                await this.loadHistoricalData();

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

            this.updateDashboard(data.analytics, "Overall");

            this.processAnalyticsData(data); // Pass the whole data object
            if (data.analytics && data.analytics.ai_predictions) {
                this.processPredictionsData(data.analytics.ai_predictions);
            }
            
            if (data.analytics && data.analytics.demographics) {
                this.searchManager.setTopSuggestions(data.analytics.demographics.locations.top_10_counts);
            } else {
                console.warn("handleInitialData: 'demographics' data missing from analytics object.", data);
            }
            
            if (data.election_data && data.election_data.candidates) {
                this.allCandidates = data.election_data.candidates; // Store all candidates
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
        
        async loadHistoricalData() {
            try {
                const historicalData = await this.apiService.getHistoricalVotes();
                if (historicalData.success) {
                    this.createHistoricalChart(historicalData);
                }
            } catch (error) {
                console.error("Failed to load historical data:", error);
            }
        }

        createHistoricalChart(historicalData) {
            const chartData = {
                labels: historicalData.labels,
                datasets: [{
                    label: 'Total Votes',
                    data: historicalData.data,
                    backgroundColor: [
                        'rgba(232, 65, 66, 0.7)',
                        'rgba(45, 116, 218, 0.7)'
                    ],
                    borderColor: [
                        'rgba(232, 65, 66, 1)',
                        'rgba(45, 116, 218, 1)'
                    ],
                    borderWidth: 1,
                    borderRadius: 5
                }]
            };

            this.chartManager.createChart('historicalVotesChart', 'bar', chartData, {
                plugins: {
                    legend: {
                        display: false
                    }
                }
            });
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
            
            if (data.analytics) {
                // Update AI insights count
                const insightsEl = document.getElementById('total-insights');
                if (insightsEl && data.ai_insights) {
                    insightsEl.textContent = data.ai_insights.length;
                }
                
                // Update confidence
                if (data.analytics.ai_predictions) {
                    const confidenceEl = document.getElementById('avg-confidence');
                    if (confidenceEl) {
                        const confidence = Math.round(data.analytics.ai_predictions.confidence * 100);
                        confidenceEl.textContent = `${confidence}%`;
                    }
                }
                
                // Update high priority count
                const highPriorityEl = document.getElementById('high-importance');
                if (highPriorityEl && data.analytics.security_status) {
                    highPriorityEl.textContent = data.analytics.security_status.anomalies_detected || '0';
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
                        <p class="text-primary">${insight.description}</p>
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

        updateDashboard(analysisData, constituencyName = "Overall") {
            console.log(`Updating dashboard for: ${constituencyName}`);

            const constituencyHeader = document.getElementById('constituency-header');
            const constituencyHeaderName = document.getElementById('constituency-header-name');

            if (constituencyName === "Overall") {
                constituencyHeader.classList.add('d-none');
            } else {
                constituencyHeader.classList.remove('d-none');
                constituencyHeaderName.textContent = `Showing Analytics for: ${constituencyName}`;
            }

            // --- SAFE DATA ACCESS (FIXED) ---
            const analysis = analysisData || {};
            const candidateResults = analysis.candidate_results || {};
            // This is the key fix: check for both possible names for the demographic data
            const demographics = analysis.demographic_analysis || analysis.demographics || {};
            const summary = analysis.summary || {};
            const keyInsights = summary.key_insights || ["No key insights available."];
            const candidateVotes = candidateResults.candidate_votes || {};
            const votePercentages = candidateResults.vote_percentage_share || {};
            const ageCounts = (demographics.age_groups && demographics.age_groups.counts) ? demographics.age_groups.counts : {};
            const genderCounts = (demographics.gender && demographics.gender.counts) ? demographics.gender.counts : {};
            const locationCounts = (demographics.locations && demographics.locations.top_10_counts) ? demographics.locations.top_10_counts : {};

            // Update titles and summary sections
            const summaryEl = document.getElementById('summary-text');
            if (summaryEl) {
                summaryEl.innerHTML = `
                    <div class="narrative-insight mb-3">
                        <h6 class="text-avalanche-blue"><i class="fas fa-lightbulb me-2"></i>Key Insights for ${constituencyName}</h6>
                        <p class="text-primary">${keyInsights.join('</p><p class="text-primary">')}</p>
                    </div>
                `;
            }

            // --- UPDATE CHARTS ---
            this.createEnhancedCharts(candidateResults, constituencyName);
            this.createDemographicCharts(demographics, constituencyName);
            
            console.log("Dashboard updated successfully.");
        }

        createEnhancedCharts(candidateData, constituencyName = "Overall") {
            if (!candidateData) {
                console.warn("createEnhancedCharts: No candidate data provided.");
                return;
            }

            const candidateVotes = candidateData.candidate_votes || {};
            const votePercentages = candidateData.vote_percentage_share || {};

            const topCandidates = Object.keys(candidateVotes).map(key => ({ name: key, votes: candidateVotes[key] })).sort((a, b) => b.votes - a.votes).slice(0, 5);
            
            // Candidate votes chart (Horizontal Bar)
            const votesData = {
                labels: topCandidates.map(c => c.name),
                datasets: [{
                    label: 'Votes',
                    data: topCandidates.map(c => c.votes),
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
                        text: `Live Vote Count - ${constituencyName}`,
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
                labels: Object.keys(votePercentages),
                datasets: [{
                    data: Object.values(votePercentages),
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
                        text: `Vote Share % - ${constituencyName}`,
                        font: { size: 16, weight: 'bold' }
                    }
                }
            });
        }
        
        createDemographicCharts(demographics, constituencyName = "Overall") {
            if (!demographics) {
                console.error("createDemographicCharts: Missing demographic data.", demographics);
                return;
            }

            const ageCounts = (demographics.age_groups && demographics.age_groups.counts) ? demographics.age_groups.counts : {};
            const genderCounts = (demographics.gender && demographics.gender.counts) ? demographics.gender.counts : {};
            const locationCounts = (demographics.locations && demographics.locations.top_10_counts) ? demographics.locations.top_10_counts : {};

            // Age group distribution
            const ageGroupData = {
                labels: Object.keys(ageCounts),
                datasets: [{
                    label: 'Votes',
                    data: Object.values(ageCounts),
                    backgroundColor: this.chartManager.colorSchemes.avalanche,
                }]
            };
            
            this.chartManager.createChart('ageGroupDistributionChart', 'bar', ageGroupData, {
                plugins: {
                    title: {
                        display: true,
                        text: `Age Group Distribution - ${constituencyName}`
                    },
                    legend: { display: false }
                }
            });
            
            // Gender distribution
            const genderData = {
                labels: Object.keys(genderCounts),
                datasets: [{
                    data: Object.values(genderCounts),
                    backgroundColor: ['#2D74DA', '#E84142', '#00D4AA'],
                }]
            };
            
            this.chartManager.createChart('genderVotingTrendsChart', 'pie', genderData, {
                plugins: {
                    title: {
                        display: true,
                        text: `Gender Distribution - ${constituencyName}`
                    },
                    datalabels: {
                        display: false
                    }
                }
            });
            
            // Location participation
            const topLocations = Object.entries(locationCounts).sort(([,a],[,b]) => a-b);
            const locationLabels = topLocations.map(([name]) => name);
            const locationVotes = topLocations.map(([,votes]) => votes);

            const locationData = {
                labels: locationLabels,
                datasets: [{
                    label: 'Participation',
                    data: locationVotes,
                    backgroundColor: this.chartManager.colorSchemes.rainbow,
                }]
            };
            
            this.chartManager.createChart('locationParticipationChart', 'bar', locationData, {
                indexAxis: 'y',
                plugins: {
                    title: {
                        display: true,
                        text: `Top Locations by Votes - ${constituencyName}`
                    },
                    legend: { display: false }
                }
            });

            // Voter Turnout Hotspots (Heatmap-style Horizontal Bar Chart)
            if (locationVotes.length > 0) {
                const maxVotes = Math.max(...locationVotes);
                const turnoutData = {
                    labels: locationLabels,
                    datasets: [{
                        label: 'Total Votes',
                        data: locationVotes,
                        backgroundColor: locationVotes.map(votes => `hsla(0, 100%, 60%, ${0.2 + (votes / maxVotes) * 0.8})`), // Red intensity based on votes
                        borderColor: 'hsla(0, 100%, 50%, 1)',
                        borderWidth: 1
                    }]
                };

                this.chartManager.createChart('turnoutHeatmapChart', 'bar', turnoutData, {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        title: {
                            display: true,
                            text: `Voter Turnout Hotspots - ${constituencyName}`
                        }
                    },
                    scales: {
                        x: {
                            ticks: {
                                beginAtZero: true
                            }
                        }
                    }
                });
            }
        }
        
        loadFallbackData() {
            // This function is now deprecated
        }
        
        setupEventListeners() {
            // 3D visualization controls
            const viewControls = {
                'viewGlobeBtn': 'globe',
                'viewMapBtn': 'map',
                'viewParticlesBtn': 'particles'
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

            // Section click-to-scroll events for the main dashboard
            document.querySelectorAll('#main-dashboard-view section[id]').forEach(section => {
                section.style.cursor = 'pointer';
                section.addEventListener('click', (e) => {
                    // Prevent scrolling when interacting with buttons or inputs inside the section
                    if (e.target.closest('button, input, a, .form-control, .btn')) return;
                    
                    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });

            // Back to Overall button
            document.getElementById('back-to-overall').addEventListener('click', () => {
                this.apiService.getEnhancedAnalytics().then(data => {
                    this.updateDashboard(data.live_analytics, "Overall");
                });
            });
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
            if (!container || !window.THREE) return;

            // Scene setup
            const scene = new THREE.Scene();
            const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
            camera.position.z = 2.5;

            const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(container.clientWidth, container.clientHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            container.innerHTML = ''; // Clear placeholder
            container.appendChild(renderer.domElement);

            // Globe
            const geometry = new THREE.SphereGeometry(1.5, 64, 64);
            const textureLoader = new THREE.TextureLoader();
            const texture = textureLoader.load('https://raw.githubusercontent.com/jeromeetienne/threex.planets/master/images/earthmap1k.jpg');
            const material = new THREE.MeshStandardMaterial({ map: texture, metalness: 0.3, roughness: 0.7 });
            const globe = new THREE.Mesh(geometry, material);
            scene.add(globe);

            // Lighting
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
            scene.add(ambientLight);
            const pointLight = new THREE.PointLight(0xffffff, 1);
            pointLight.position.set(5, 5, 5);
            scene.add(pointLight);

            // Controls
            const controls = new THREE.OrbitControls(camera, renderer.domElement);
            controls.enableDamping = true;
            controls.dampingFactor = 0.05;
            controls.minDistance = 2;
            controls.maxDistance = 10;
            controls.enablePan = false;
            controls.autoRotate = true;
            controls.autoRotateSpeed = 0.5;

            // Animation loop
            const animate = () => {
                requestAnimationFrame(animate);
                controls.update(); // autoRotate needs this in the loop
                renderer.render(scene, camera);
            };
            animate();

            // Handle window resize
            window.addEventListener('resize', () => {
                camera.aspect = container.clientWidth / container.clientHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.clientWidth, container.clientHeight);
            });

            // Add vote hotspots
            this.addVoteHotspots(scene, globe);

            // Add live vote particles
            const particlesMesh = this.addLiveVoteParticles(scene, globe);

            // Enable clickable regions
            this.enableClickableRegions(container, camera, scene);

            // Make view controls work
            this.setupViewControls(globe, particlesMesh, camera, controls);
        }

        addVoteHotspots(scene, globe) {
            // Placeholder for vote hotspots
            const hotspots = [
                { lat: 28.6139, lon: 77.2090, city: 'New Delhi', votes: 1200 },
                { lat: 19.0760, lon: 72.8777, city: 'Mumbai', votes: 1500 },
                { lat: 12.9716, lon: 77.5946, city: 'Bangalore', votes: 1350 }
            ];

            hotspots.forEach(spot => {
                const phi = (90 - spot.lat) * (Math.PI / 180);
                const theta = (spot.lon + 180) * (Math.PI / 180);

                const x = -(1.5 * Math.sin(phi) * Math.cos(theta));
                const z = (1.5 * Math.sin(phi) * Math.sin(theta));
                const y = (1.5 * Math.cos(phi));

                const geometry = new THREE.SphereGeometry(0.02, 16, 16);
                const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
                const marker = new THREE.Mesh(geometry, material);
                
                marker.position.set(x, y, z);
                marker.userData = { isVoteMarker: true, ...spot };
                globe.add(marker);
            });
        }

        addLiveVoteParticles(scene, globe) {
            const particleCount = 1000;
            const particles = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);

            for (let i = 0; i < particleCount; i++) {
                const phi = Math.acos(-1 + (2 * i) / particleCount);
                const theta = Math.sqrt(particleCount * Math.PI) * phi;

                const x = 1.6 * Math.cos(theta) * Math.sin(phi);
                const y = 1.6 * Math.sin(theta) * Math.sin(phi);
                const z = 1.6 * Math.cos(phi);
                
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;
            }

            particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            const particleMaterial = new THREE.PointsMaterial({
                color: 0x00d4aa,
                size: 0.015,
                transparent: true,
                opacity: 0.7
            });
            const particleSystem = new THREE.Points(particles, particleMaterial);
            scene.add(particleSystem);
            return particleSystem;
        }

        switchView(viewId) {
            const mainDashboard = document.getElementById('main-dashboard-view');
            const constituencySection = document.getElementById('constituency-analysis');
            
            // Hide all views first
            mainDashboard.style.display = 'none';
            constituencySection.style.display = 'none';
            
            // Show the requested view
            const viewToShow = document.getElementById(viewId);
            if (viewToShow) {
                viewToShow.style.display = 'block';
                viewToShow.classList.remove('d-none');
                console.log(`Switched view to: ${viewId}`);
            } else {
                console.error(`View with ID '${viewId}' not found.`);
            }
        }

        displayConstituencyAnalysis(constituency, data) {
            console.log("Attempting to display analysis for:", constituency);
            
            const contentDisplay = document.getElementById('constituency-analysis-content');
            const nameDisplay = document.getElementById('constituency-name-display');

            if (!contentDisplay || !nameDisplay) {
                console.error("DisplayConstituencyAnalysis: Critical content elements are missing.");
                return;
            }

            // Ensure data is valid before proceeding
            const analysis = data ? data.analysis : null;
            if (!analysis) {
                contentDisplay.innerHTML = `<div class="alert alert-danger">Could not load analysis. Invalid data received from server.</div>`;
                this.switchView('constituency-analysis');
                return;
            }

            nameDisplay.textContent = constituency;
            
            const candidateResults = analysis.candidate_results || {};
            const demographics = analysis.demographic_analysis || {};
            const summary = analysis.summary || {};
            const keyInsights = summary.key_insights || ["No key insights available."];
            const candidateVotes = candidateResults.candidate_votes || {};
            const ageCounts = (demographics.age_groups && demographics.age_groups.counts) ? demographics.age_groups.counts : {};
            const genderCounts = (demographics.gender && demographics.gender.counts) ? demographics.gender.counts : {};

            const analysisHtml = `
                <div class="card glass-effect mb-4">
                    <div class="card-header avalanche-gradient text-white">
                        <h4 class="mb-0">Summary for ${constituency}</h4>
                    </div>
                    <div class="card-body">
                        <p class="lead text-primary">${keyInsights.join('</p><p class="lead text-primary">')}</p>
                    </div>
                </div>
                <div class="row">
                    <div class="col-lg-12 mb-4">
                        <div class="card glass-effect h-100">
                            <div class="card-header avalanche-gradient text-white">
                                <h5 class="mb-0">Candidate Results</h5>
                            </div>
                            <div class="card-body">
                                <div class="chart-container" style="height: 400px;">
                                    <canvas id="constituencyCandidateChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="card glass-effect mt-4">
                    <div class="card-header avalanche-gradient text-white">
                        <h4 class="mb-0">Demographic Visualizations</h4>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6 mb-4">
                                <div class="chart-card h-100">
                                    <h5 class="chart-title">Age Distribution</h5>
                                    <div class="chart-container">
                                        <canvas id="constituencyAgeChart"></canvas>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-6 mb-4">
                                <div class="chart-card h-100">
                                    <h5 class="chart-title">Gender Distribution</h5>
                                    <div class="chart-container">
                                        <canvas id="constituencyGenderChart"></canvas>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <button class="btn btn-avalanche mt-4" id="backToOverviewBtn">Back to Overview</button>
            `;
            
            contentDisplay.innerHTML = analysisHtml;
            console.log("Successfully injected new HTML for constituency analysis.");

            // Create charts
            this.chartManager.createChart('constituencyCandidateChart', 'bar', { labels: Object.keys(candidateVotes), datasets: [{ label: 'Votes', data: Object.values(candidateVotes), backgroundColor: this.chartManager.colorSchemes.rainbow }] });
            this.chartManager.createChart('constituencyAgeChart', 'pie', { labels: Object.keys(ageCounts), datasets: [{ data: Object.values(ageCounts), backgroundColor: this.chartManager.colorSchemes.avalanche }] });
            this.chartManager.createChart('constituencyGenderChart', 'doughnut', { labels: Object.keys(genderCounts), datasets: [{ data: Object.values(genderCounts), backgroundColor: ['#2D74DA', '#E84142', '#00D4AA'] }] });
            console.log("All charts have been created.");

            // Switch to the analysis view
            this.switchView('constituency-analysis');
            
            const constituencySection = document.getElementById('constituency-analysis');
            if(constituencySection) {
                constituencySection.scrollIntoView({ behavior: 'smooth' });
                console.log("Scrolled to constituency section.");
            }

            document.getElementById('backToOverviewBtn').addEventListener('click', () => {
                this.switchView('main-dashboard-view');
            });
        }

        setupViewControls(globe, particles, camera, controls) {
            const globeBtn = document.getElementById('viewGlobeBtn');
            const mapBtn = document.getElementById('viewMapBtn');
            const particlesBtn = document.getElementById('viewParticlesBtn');

            if (!globeBtn || !mapBtn || !particlesBtn) return;

            globeBtn.addEventListener('click', () => {
                globe.visible = true;
                particles.visible = true;
                controls.reset();
                camera.position.set(0, 0, 2.5);
                controls.update();
            });

            mapBtn.addEventListener('click', () => {
                globe.visible = true;
                particles.visible = false;
                controls.reset();
                camera.position.set(0, 2.5, 0); // Top-down view
                camera.lookAt(0, 0, 0);
                controls.update();
            });

            particlesBtn.addEventListener('click', () => {
                globe.visible = false;
                particles.visible = true;
                controls.reset();
                camera.position.set(0, 0, 2.5);
                controls.update();
            });
        }

        enableClickableRegions(container, camera, scene) {
            const raycaster = new THREE.Raycaster();
            const mouse = new THREE.Vector2();
            const tooltip = document.getElementById('globe-tooltip');

            container.addEventListener('mousemove', (event) => {
                // Update mouse position
                const rect = container.getBoundingClientRect();
                mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
                mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

                raycaster.setFromCamera(mouse, camera);
                const intersects = raycaster.intersectObjects(scene.children, true);

                let hoveredMarker = null;
                for (let i = 0; i < intersects.length; i++) {
                    if (intersects[i].object.userData.isVoteMarker) {
                        hoveredMarker = intersects[i].object;
                        break;
                    }
                }

                if (hoveredMarker) {
                    tooltip.style.display = 'block';
                    tooltip.style.left = `${event.clientX + 15}px`;
                    tooltip.style.top = `${event.clientY + 15}px`;
                    
                    const data = hoveredMarker.userData;
                    tooltip.innerHTML = `
                        <h6>${data.city}</h6>
                        <ul>
                            <li><strong>Votes:</strong> ${data.votes}</li>
                            <li><strong>Intensity:</strong> ${data.intensity.toFixed(2)}</li>
                        </ul>
                    `;
                } else {
                    tooltip.style.display = 'none';
                }
            });
        }

        handleInitializationError(error) {
            console.error("Failed to initialize the application:", error);
            connectionManager.hideLoading();
            
            const mainContent = document.getElementById('main-dashboard-view');
            if (mainContent) {
                mainContent.innerHTML = `
                    <div class="container text-center mt-5">
                        <div class="alert alert-danger">
                            <h4><i class="fas fa-exclamation-triangle me-2"></i>Connection Failed</h4>
                            <p>Could not connect to the analytics server. Please ensure the server is running and try again.</p>
                            <pre style="text-align: left; font-size: 12px;">${error.message}</pre>
                        </div>
                    </div>
                `;
            }
        }
    }

    // Initialize the application
    const connectionManager = new ConnectionManager();
    const app = new VotingAnalyticsApp();
    window.chartManager = app.chartManager; // Make it globally accessible for theme updates
});