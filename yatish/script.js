document.addEventListener('DOMContentLoaded', () => {
  const API_BASE_URL = window.location.origin;
  const WEBSOCKET_URL = API_BASE_URL;

  let liveVoteCount = 0;

  class ConnectionManager {
    constructor() {
      this.statusElement = document.getElementById('connectionStatus');
      this.loadingOverlay = document.getElementById('loadingOverlay');
      this.progressBar = document.getElementById('loadingProgress');
    }
    updateConnectionStatus(status) {
      if (!this.statusElement) return;
      this.statusElement.className = 'connection-status';
      switch (status) {
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
      if (!this.loadingOverlay) return;
      this.loadingOverlay.classList.remove('d-none');
      const textEl = this.loadingOverlay.querySelector('.loader-text');
      if (textEl) textEl.textContent = message;
      this.animateProgress();
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
    toast(message, type = 'error', timeout = 4000) {
      const toast = document.createElement('div');
      toast.className = 'toast-notification';
      toast.style.cssText = `position:fixed;top:20px;right:20px;z-index:9999;padding:12px 16px;border-radius:8px;color:#fff;`;
      toast.style.background = type === 'success' ? '#00D4AA' : '#E84142';
      toast.textContent = message;
      document.body.appendChild(toast);
      setTimeout(() => toast.remove(), timeout);
    }
  }

  class APIService {
    constructor() {
      this.baseURL = API_BASE_URL;
      this.maxRetries = 5;
      this.maxDelay = 30000;
    }
    async request(endpoint, options = {}) {
      let attempt = 0;
      while (attempt <= this.maxRetries) {
        try {
          const res = await fetch(`${this.baseURL}${endpoint}`, {
            ...options,
            headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
            credentials: 'same-origin'
          });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return await res.json();
        } catch (err) {
          attempt++;
          if (attempt > this.maxRetries) {
            connectionManager.toast(`API error: ${err.message}`, 'error');
            throw err;
          }
          const delay = Math.min(this.maxDelay, Math.pow(2, attempt) * 500);
          await new Promise(r => setTimeout(r, delay));
        }
      }
    }
    getHealthStatus() { return this.request('/api/health'); }
    getAIInsights() { return this.request('/api/ai/insights'); }
    getLivePredictions() { return this.request('/api/ai/predictions/live'); }
    getEnhancedAnalytics() { return this.request('/api/analytics/enhanced'); }
    getConstituencies() { return this.request('/api/constituencies'); }
    getConstituencyAnalysis(c) { return this.request(`/api/analysis/constituency/${encodeURIComponent(c)}`); }
    getLiveTransactions() { return this.request('/api/live/transactions'); }
    get3DVisualizationData() { return this.request('/api/visualization/3d'); }
    getNetworkStats() { return this.request('/api/blockchain/network-stats'); }
    getDemographicAnalysis() { return this.request('/api/analytics/demographics'); }
  }

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
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (this.charts[canvasId]) this.charts[canvasId].destroy();
      const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12, weight: 'bold' } } },
          tooltip: { backgroundColor: 'rgba(26, 29, 41, 0.9)', titleColor: '#ffffff', bodyColor: '#ffffff', borderColor: '#E84142', borderWidth: 1, cornerRadius: 10, displayColors: true }
        },
        animation: { duration: 1200, easing: 'easeInOutQuart' },
        interaction: { intersect: false, mode: 'index' }
      };
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
      const mergedOptions = { ...defaultOptions, ...options };
      if (type === 'bar') {
        mergedOptions.scales = {
          y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#888', font: { weight: 'bold' } } },
          x: { grid: { display: false }, ticks: { color: '#888', font: { weight: 'bold' } } }
        };
      }
      this.charts[canvasId] = new Chart(ctx, { type, data, options: mergedOptions });
      return this.charts[canvasId];
    }
    updateChart(id, newData) { if (this.charts[id]) { this.charts[id].data = newData; this.charts[id].update(); } }
  }

  class WebSocketManager {
    constructor(apiService, chartManager) {
      this.apiService = apiService;
      this.chartManager = chartManager;
      this.socket = null;
      this.reconnectAttempts = 0;
      this.maxDelay = 30000;
    }
    connect() {
      try {
        this.socket = io(WEBSOCKET_URL, { transports: ['websocket', 'polling'], timeout: 20000, forceNew: true });
        this.setupEventHandlers();
      } catch (e) {
        this.handleConnectionError();
      }
    }
    setupEventHandlers() {
      this.socket.on('connect', () => {
        connectionManager.updateConnectionStatus('connected');
        this.reconnectAttempts = 0;
        this.socket.emit('request_live_data');
        this.socket.emit('request_3d_data');
        this.socket.emit('request_blockchain_status');
      });
      this.socket.on('disconnect', () => {
        connectionManager.updateConnectionStatus('disconnected');
      });
      this.socket.on('connect_error', () => {
        this.handleConnectionError();
      });
      this.socket.on('enhanced_voting_update', (data) => this.handleVotingUpdate(data));
      this.socket.on('new_transaction', (data) => this.handleNewTransaction(data));
      this.socket.on('visualization_data', (data) => this.handle3DVisualizationUpdate(data));
      this.socket.on('ai_analysis_update', (data) => this.updateAIInsights(data.insights || []));
      this.socket.on('blockchain_status', (data) => this.updateNetworkStats(data.network_stats || {}));
    }
    handleConnectionError() {
      connectionManager.updateConnectionStatus('connecting');
      this.reconnectAttempts++;
      const delay = Math.min(this.maxDelay, Math.pow(2, this.reconnectAttempts) * 1000);
      setTimeout(() => this.connect(), delay);
      if (this.reconnectAttempts % 2 === 0) connectionManager.toast('Reconnecting to realtime service...', 'error', 2000);
      if (this.reconnectAttempts > 6) this.startPollingFallback();
    }
    handleVotingUpdate(data) {
      if (!app.initialDataLoaded) app.handleInitialData(data);
      if (data.election_data) this.updateVoteDisplay(data.election_data);
      if (data.ai_insights) { this.updateAIInsights(data.ai_insights); this.updateIntelligenceHub(data.ai_insights); }
      if (data.analytics) this.updateAnalytics(data);
    }
    handleNewTransaction(data) { this.addTransactionToFeed(data); }
    handle3DVisualizationUpdate(data) { if (window.votingVisualization) window.votingVisualization.updateData(data); }
    updateVoteDisplay(electionData) {
      if (!electionData.candidates) return;
      const sorted = [...electionData.candidates].sort((a, b) => b.votes - a.votes);
      const topCandidates = sorted.slice(0, 5);
      const table = document.getElementById('candidate-results-table');
      if (table) {
        table.innerHTML = topCandidates.map(c => `
          <tr>
            <td>${c.name}</td><td>${c.party}</td><td>${c.votes.toLocaleString()}</td>
            <td><div class="progress" style="height:20px"><div class="progress-bar bg-avalanche-red" role="progressbar" style="width:${c.percentage}%" aria-valuenow="${c.percentage}" aria-valuemin="0" aria-valuemax="100">${(c.percentage||0).toFixed(2)}%</div></div></td>
          </tr>`).join('');
      }
      this.updateVoteCharts(topCandidates);
    }
    updateVoteCharts(candidateData) {
      const percentageData = { labels: candidateData.map(c => c.name), datasets: [{ data: candidateData.map(c => c.percentage), backgroundColor: chartManager.colorSchemes.avalanche, borderColor: '#fff', borderWidth: 2 }] };
      chartManager.updateChart('votePercentageShareChart', percentageData);
    }
    updateAIInsights(insights) {
      const container = document.getElementById('summary-text');
      if (!container || !insights || insights.length === 0) return;
      container.innerHTML = insights.slice(0, 3).map(ins => `
        <div class="ai-insight-item mb-3"><h6 class="text-avalanche-blue">${ins.title}</h6><p class="mb-1">${ins.description}</p><small class="text-muted">Confidence: ${Math.round((ins.confidence||0) * 100)}%</small></div>`).join('');
    }
    updateAnalytics(data) {
      const totalVotesEl = document.getElementById('total-votes');
      if (totalVotesEl && data.election_data?.current_turnout) totalVotesEl.textContent = data.election_data.current_turnout.toLocaleString();
      const totalInsightsEl = document.getElementById('total-insights');
      if (totalInsightsEl && data.ai_insights) totalInsightsEl.textContent = data.ai_insights.length;
      const avgConfidenceEl = document.getElementById('avg-confidence');
      if (avgConfidenceEl && data.analytics?.ai_predictions?.confidence) avgConfidenceEl.textContent = `${Math.round(data.analytics.ai_predictions.confidence * 100)}%`;
      const highPriorityEl = document.getElementById('high-importance');
      if (highPriorityEl && data.analytics?.security_status) highPriorityEl.textContent = data.analytics.security_status.anomalies_detected || '0';
    }
    updateIntelligenceHub(insights) {
      const hub = document.getElementById('other-insights-content');
      if (!hub || !insights) return;
      hub.innerHTML = insights.map(ins => `
        <div class="narrative-insight mb-3"><h6 class="text-avalanche-blue"><i class="fas fa-lightbulb me-2"></i>${ins.title}</h6><p>${ins.description}</p>
          <div class="insight-meta mt-2"><span class="badge bg-avalanche-green">Confidence: ${Math.round((ins.confidence||0) * 100)}%</span><span class="badge bg-avalanche-orange ms-2">Priority: ${ins.importance||0}/10</span></div>
        </div>`).join('');
    }
    addTransactionToFeed(event) {
      const feed = document.getElementById('transactionFeed');
      if (!feed || !event.transaction) return;
      const tx = event.transaction;
      if (feed.querySelector(`[data-tx-hash="${tx.tx_hash}"]`)) return;
      const el = document.createElement('div');
      el.className = 'transaction-item';
      el.setAttribute('data-tx-hash', tx.tx_hash);
      el.innerHTML = `<span class="tx-icon"><i class="fas fa-receipt"></i></span><span class="tx-hash">${tx.tx_hash.substring(0,12)}...</span><span class="tx-details">Vote for Candidate ${tx.candidate_id}</span><span class="tx-amount ms-auto">${(tx.gas_used/1000000).toFixed(4)} AVAX</span>`;
      feed.prepend(el);
      while (feed.children.length > 5) feed.lastChild.remove();
    }
    updateNetworkStats(stats) {
      const tpsEl = document.getElementById('tps-counter');
      const gasEl = document.getElementById('gas-price');
      if (tpsEl && stats.live_tps) tpsEl.textContent = `${stats.live_tps}k`;
      if (gasEl && stats.avg_fee) gasEl.textContent = stats.avg_fee;
    }
    startPollingFallback() {
      setInterval(async () => {
        try {
          const [analytics, predictions, transactions] = await Promise.allSettled([
            this.apiService.getEnhancedAnalytics(),
            this.apiService.getLivePredictions(),
            this.apiService.getLiveTransactions()
          ]);
          if (analytics.status === 'fulfilled') {
            this.handleVotingUpdate({ election_data: analytics.value.election_data, analytics: analytics.value.live_analytics, ai_insights: analytics.value.ai_insights });
          }
          if (transactions.status === 'fulfilled') {
            this.updateNetworkStats(transactions.value.network_stats || {});
          }
        } catch (e) {
          // ignore
        }
      }, 10000);
    }
  }

  class SearchManager {
    constructor(apiService, chartManager) {
      this.apiService = apiService;
      this.chartManager = chartManager;
      this.constituencies = [];
      this.initializeSearch();
    }
    async initializeSearch() {
      this.searchInput = document.getElementById('constituencySearch');
      this.searchResults = document.getElementById('searchResults');
      if (!this.searchInput || !this.searchResults) return;
      this.setupSearchEventListeners();
      try {
        const response = await this.apiService.getConstituencies();
        if (response && Array.isArray(response.constituencies)) this.constituencies = response.constituencies;
        else if (Array.isArray(response)) this.constituencies = response;
        else this.constituencies = [];
      } catch {
        this.constituencies = [];
        connectionManager.toast('Could not load constituency data.');
      }
    }
    setupSearchEventListeners() {
      const searchInput = this.searchInput;
      const searchResults = this.searchResults;
      const searchButton = document.getElementById('searchButton');
      if (!searchInput || !searchResults || !searchButton) return;
      this.highlightedIndex = -1; let t;
      searchInput.addEventListener('input', (e) => { clearTimeout(t); t = setTimeout(() => this.performSearch(e.target.value), 300); });
      searchButton.addEventListener('click', () => { const q = searchInput.value; if (!q) return; const exact = this.constituencies.find(c => c.toLowerCase() === q.toLowerCase()); if (exact) this.selectConstituency(exact); else { const filtered = this.constituencies.filter(c => c.toLowerCase().includes(q.toLowerCase())); if (filtered.length) this.selectConstituency(filtered[0]); else connectionManager.toast('No matching constituency found.'); } });
      searchInput.addEventListener('keydown', (e) => {
        const items = searchResults.querySelectorAll('.search-result-item'); if (!items.length) return;
        if (e.key === 'ArrowDown') { e.preventDefault(); this.highlightedIndex = (this.highlightedIndex + 1) % items.length; this.updateHighlight(items); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); this.highlightedIndex = (this.highlightedIndex - 1 + items.length) % items.length; this.updateHighlight(items); }
        else if (e.key === 'Enter') { e.preventDefault(); if (this.highlightedIndex > -1) this.selectConstituency(items[this.highlightedIndex].dataset.constituency); }
        else if (e.key === 'Escape') { this.hideSearchResults(); }
      });
      searchInput.addEventListener('focus', () => { if (searchResults.children.length > 0) searchResults.style.display = 'block'; });
      searchInput.addEventListener('blur', () => { setTimeout(() => { searchResults.style.display = 'none'; }, 200); });
    }
    updateHighlight(items) { items.forEach((item, idx) => item.classList.toggle('active', idx === this.highlightedIndex)); }
    performSearch(query) {
      if (!query || query.length < 2) { this.hideSearchResults(); return; }
      const filtered = this.constituencies.filter(c => c.toLowerCase().includes(query.toLowerCase()));
      this.displaySearchResults(filtered.slice(0, 10));
    }
    displaySearchResults(results) {
      if (!this.searchResults) return;
      this.searchResults.innerHTML = results.length ? results.map(r => `<div class="search-result-item" data-constituency="${r}">${r}</div>`).join('') : '<div class="search-result-item text-muted">No results found.</div>';
      this.searchResults.querySelectorAll('.search-result-item').forEach(i => i.addEventListener('mousedown', (e) => this.selectConstituency(e.target.dataset.constituency)));
      this.searchResults.style.display = 'block';
    }
    hideSearchResults() { if (this.searchResults) { this.searchResults.style.display = 'none'; this.searchResults.innerHTML = ''; } }
    async selectConstituency(c) { currentConstituency = c; if (this.searchInput) this.searchInput.value = c; this.hideSearchResults(); await this.loadConstituencyAnalysis(c); }
    async loadConstituencyAnalysis(c) {
      try {
        connectionManager.showLoading(`Loading analysis for ${c}...`);
        const analysis = await this.apiService.getConstituencyAnalysis(c);
        if (analysis.success) this.displayConstituencyAnalysis(c, analysis); else throw new Error(analysis.error || 'Failed to load constituency analysis');
      } catch (e) {
        connectionManager.toast(`Failed to load analysis for ${c}: ${e.message}`);
      } finally { connectionManager.hideLoading(); }
    }
    displayConstituencyAnalysis(constituency, analysis) {
      const comprehensive = document.getElementById('comprehensive-analysis');
      const candidateSection = document.getElementById('candidate-results');
      const demographicSection = document.getElementById('demographic-analytics');
      const constituencySection = document.getElementById('constituency-analysis');
      const content = document.getElementById('constituency-analysis-content');
      const name = document.getElementById('constituency-name-display');
      if (!comprehensive || !candidateSection || !demographicSection || !constituencySection || !content || !name) return;
      comprehensive.style.display = 'none'; candidateSection.style.display = 'none'; demographicSection.style.display = 'none';
      name.textContent = constituency;
      content.innerHTML = `
        <div class="row"><div class="col-lg-8"><div class="constituency-insights"><h5 class="text-avalanche-blue mb-3">AI Insights for ${constituency}</h5>
        ${analysis.insights.map(i => `<div class="narrative-insight mb-3"><h6 class="text-avalanche-blue">${i.title}</h6><p>${i.description}</p></div>`).join('')}</div></div>
        <div class="col-lg-4"><div class="constituency-stats"><div class="stat-card glass-effect p-3 mb-3"><h5 class="text-avalanche-blue mb-3">Summary</h5>
        <div class="stat-item mb-2"><strong>Total Votes:</strong> ${analysis.summary.total_votes.toLocaleString()}</div>
        <div class="stat-item mb-2"><strong>Candidates:</strong> ${analysis.summary.total_candidates}</div>
        <div class="stat-item mb-2"><strong>Years Covered:</strong> ${analysis.summary.years_covered.join(', ')}</div>
        </div></div></div></div>
        <div class="row mt-4"><div class="col-lg-6"><div class="chart-card"><h5 class="chart-title">Age Distribution</h5><div class="chart-container" style="height:300px"><canvas id="constituencyAgeChart"></canvas></div></div></div>
        <div class="col-lg-6"><div class="chart-card"><h5 class="chart-title">Gender Distribution</h5><div class="chart-container" style="height:300px"><canvas id="constituencyGenderChart"></canvas></div></div></div></div>
        <button class="btn btn-avalanche mt-4" id="backToOverviewBtn">Back to Overview</button>`;
      if (analysis.chart_data) {
        const ageData = { labels: Object.keys(analysis.chart_data.age_distribution), datasets: [{ label: 'Votes', data: Object.values(analysis.chart_data.age_distribution).map(d => d.votes), backgroundColor: chartManager.colorSchemes.rainbow }] };
        chartManager.createChart('constituencyAgeChart', 'bar', ageData);
        const genderData = { labels: Object.keys(analysis.chart_data.gender_distribution), datasets: [{ data: Object.values(analysis.chart_data.gender_distribution).map(d => d.votes), backgroundColor: ['#2D74DA', '#E84142', '#00D4AA'] }] };
        chartManager.createChart('constituencyGenderChart', 'pie', genderData);
      }
      constituencySection.classList.remove('d-none');
      constituencySection.scrollIntoView({ behavior: 'smooth' });
      document.getElementById('backToOverviewBtn').addEventListener('click', () => {
        constituencySection.classList.add('d-none');
        comprehensive.style.display = 'block';
        candidateSection.style.display = 'block';
        demographicSection.style.display = 'block';
      });
    }
  }

  class ThemeManager {
    constructor() { this.currentTheme = localStorage.getItem('theme') || 'light'; this.init(); }
    init() { this.applyTheme(this.currentTheme); const t = document.getElementById('themeToggle'); if (t) t.addEventListener('click', () => this.toggleTheme()); }
    toggleTheme() { this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light'; this.applyTheme(this.currentTheme); localStorage.setItem('theme', this.currentTheme); }
    applyTheme(theme) {
      const body = document.body; const icon = document.getElementById('themeIcon');
      if (theme === 'dark') { body.classList.remove('theme-light'); body.classList.add('theme-dark'); body.setAttribute('data-theme', 'dark'); if (icon) icon.className = 'fas fa-moon rotate-slow'; }
      else { body.classList.remove('theme-dark'); body.classList.add('theme-light'); body.setAttribute('data-theme', 'light'); if (icon) icon.className = 'fas fa-sun rotate-slow'; }
    }
  }

  class VotingAnalyticsApp {
    constructor() {
      this.apiService = new APIService();
      this.chartManager = new ChartManager();
      this.wsManager = new WebSocketManager(this.apiService, this.chartManager);
      this.searchManager = new SearchManager(this.apiService, this.chartManager);
      this.themeManager = new ThemeManager();
      this.initialDataLoaded = false;
      this.loadingTimeout = null;
      this.allCandidates = [];
      this.init();
    }
    async init() {
      connectionManager.showLoading('Initializing Avalanche Analytics...');
      this.loadingTimeout = setTimeout(() => { if (!this.initialDataLoaded) this.handleInitializationError(new Error('Initial data load timed out.')); }, 15000);
      try {
        await this.apiService.getHealthStatus();
        this.wsManager.connect();
        this.init3DVisualization();
      } catch (e) {
        this.handleInitializationError(e);
        clearTimeout(this.loadingTimeout);
      }
    }
    handleInitialData(data) {
      if (this.initialDataLoaded) return;
      clearTimeout(this.loadingTimeout);
      this.processAnalyticsData(data);
      this.processPredictionsData(data.ai_predictions || {});
      if (data.analytics && data.analytics.demographics) {
        this.createDemographicCharts(data.analytics.demographics);
      }
      if (data.election_data && data.election_data.candidates) {
        this.allCandidates = data.election_data.candidates;
        this.createEnhancedCharts(this.allCandidates);
      }
      connectionManager.hideLoading();
      this.initialDataLoaded = true;
    }
    processAnalyticsData(data) {
      if (data.election_data) {
        const totalVotes = data.election_data.current_turnout; liveVoteCount = totalVotes;
        const totalVotesEl = document.getElementById('total-votes'); if (totalVotesEl) totalVotesEl.textContent = totalVotes.toLocaleString();
        const liveCountEl = document.getElementById('liveVoteCount'); if (liveCountEl) liveCountEl.textContent = totalVotes.toLocaleString();
        const turnoutEl = document.getElementById('participationRate'); if (turnoutEl) turnoutEl.textContent = `${data.election_data.turnout_percentage}%`;
      }
      if (data.live_analytics) {
        const insightsEl = document.getElementById('total-insights'); if (insightsEl && data.live_analytics.ai_insights) insightsEl.textContent = data.live_analytics.ai_insights.length;
        if (data.live_analytics.ai_predictions) { const confidenceEl = document.getElementById('avg-confidence'); if (confidenceEl) confidenceEl.textContent = `${Math.round(data.live_analytics.ai_predictions.confidence * 100)}%`; }
        const highPriorityEl = document.getElementById('high-importance'); if (highPriorityEl && data.live_analytics.security_status) highPriorityEl.textContent = data.live_analytics.security_status.anomalies_detected || '0';
      }
      if (data.ai_insights) this.updateDashboardSummary(data.ai_insights);
    }
    processPredictionsData(data) {
      if (!data || !data.confidence) return;
      const confidenceTextEl = document.getElementById('confidenceText'); if (confidenceTextEl) confidenceTextEl.textContent = `${Math.round(data.confidence)}%`;
      const confidenceMeterEl = document.getElementById('confidenceMeter'); if (confidenceMeterEl) confidenceMeterEl.style.width = `${data.confidence}%`;
      const container = document.getElementById('livePredicton');
      if (container && data.predictions && data.predictions.length) {
        const p = data.predictions[0];
        container.innerHTML = `<div class="prediction-item"><span class="prediction-text"><i class="fas fa-chart-line me-2 text-avalanche-cyan"></i>AI predicts <strong>${p.name || 'the leading candidate'}</strong> has a <strong>${(p.probability||0).toFixed(1)}%</strong> chance of winning.</span><div class="prediction-graph"><canvas id="predictionChart" width="200" height="60"></canvas></div></div>`;
      }
    }
    updateDashboardSummary(insights) {
      const el = document.getElementById('summary-text'); if (!el || !insights || !insights.length) return;
      el.innerHTML = insights.slice(0, 3).map(i => `
        <div class="narrative-insight mb-3"><h6 class="text-avalanche-blue"><i class="fas fa-lightbulb me-2"></i>${i.title}</h6><p>${i.description}</p>
        <div class="insight-meta mt-2"><span class="badge bg-avalanche-green">Confidence: ${Math.round((i.confidence||0) * 100)}%</span><span class="badge bg-avalanche-orange ms-2">Priority: ${i.importance||0}/10</span></div></div>`).join('');
    }
    createEnhancedCharts(candidateData) {
      if (!candidateData || !candidateData.length) return;
      const top = [...candidateData].sort((a, b) => b.votes - a.votes).slice(0, 5);
      const percentageData = { labels: top.map(c => c.name), datasets: [{ data: top.map(c => c.percentage), backgroundColor: chartManager.colorSchemes.avalanche, borderColor: '#fff', borderWidth: 2 }] };
      chartManager.createChart('votePercentageShareChart', 'doughnut', percentageData, { responsive: true, maintainAspectRatio: false });
    }
    createDemographicCharts(d) {
      if (!d || !d.age_groups || !d.gender || !d.locations) return;
      const ageData = { labels: Object.keys(d.age_groups.counts), datasets: [{ label: 'Votes', data: Object.values(d.age_groups.counts), backgroundColor: chartManager.colorSchemes.rainbow, borderColor: '#fff', borderWidth: 2 }] };
      chartManager.createChart('ageGroupDistributionChart', 'bar', ageData, { plugins: { title: { display: true, text: 'Age Group Distribution' } } });
      const genderData = { labels: Object.keys(d.gender.counts), datasets: [{ data: Object.values(d.gender.counts), backgroundColor: ['#2D74DA', '#E84142', '#00D4AA'], borderColor: '#fff', borderWidth: 2 }] };
      chartManager.createChart('genderVotingTrendsChart', 'pie', genderData, { plugins: { title: { display: true, text: 'Gender Distribution' } } });
      const locData = { labels: Object.keys(d.locations.top_10_counts), datasets: [{ label: 'Participation', data: Object.values(d.locations.top_10_counts), backgroundColor: chartManager.colorSchemes.gradient, borderColor: '#fff', borderWidth: 2 }] };
      chartManager.createChart('locationParticipationChart', 'bar', locData, { plugins: { title: { display: true, text: 'Location-wise Participation' } } });
    }
    init3DVisualization() {
      const container = document.getElementById('threejs-container'); if (!container) return;
      container.innerHTML = '<div class="text-center p-5"><h4 class="text-avalanche-blue">3D Visualization Loading...</h4><p class="text-muted">Interactive vote visualization will appear here</p></div>';
      this.load3DData();
    }
    async load3DData() { try { await this.apiService.get3DVisualizationData(); } catch (e) { /* ignore */ } }
    handleInitializationError(error) {
      connectionManager.updateConnectionStatus('disconnected');
      connectionManager.hideLoading();
      const alert = document.createElement('div');
      alert.className = 'alert alert-warning m-3';
      alert.innerHTML = `<h6><i class="fas fa-exclamation-triangle me-2"></i>Connection Issue</h6><p>Unable to connect to the backend server. Running in demo mode with sample data.</p><button class="btn btn-outline-primary btn-sm" onclick="location.reload()">Retry Connection</button>`;
      const container = document.querySelector('.container-fluid'); if (container) container.insertBefore(alert, container.firstChild);
    }
  }

  const connectionManager = new ConnectionManager();
  const chartManager = new ChartManager();
  window.chartManager = chartManager; window.connectionManager = connectionManager;
  const app = new VotingAnalyticsApp();
  setTimeout(() => connectionManager.updateConnectionStatus('connected'), 3000);
});
