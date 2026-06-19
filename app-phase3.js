// Canadian Political Alignment Test - Phase 3
// Complete with Issue Clustering, Faction Analysis, Enhanced Contradictions, Visualizations
 
class QuizApp {
    constructor() {
        this.questions = [];
        this.phaseData = null;
        this.currentQuestionIndex = 0;
        this.scores = [0, 0, 0, 0];
        this.answers = [];
        this.currentSection = '';
        this.testMode = 'full';
        this.startTime = null;
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        
        this.init();
    }
 
    async init() {
        this.setupEventListeners();
        this.applyDarkMode();
        await this.loadQuestions();
        await this.loadPhaseData();
        this.loadSavedProgress();
        this.showWelcomeScreen();
    }
 
    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.startQuiz('full'));
        document.getElementById('quickStartBtn').addEventListener('click', () => this.startQuiz('quick'));
        document.getElementById('nextBtn').addEventListener('click', () => this.nextQuestion());
        document.getElementById('prevBtn').addEventListener('click', () => this.previousQuestion());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetTest());
        document.getElementById('retakeBtn').addEventListener('click', () => this.resetTest());
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleDarkMode());
        
        // Export buttons
        document.getElementById('exportJsonBtn').addEventListener('click', () => this.exportJSON());
        document.getElementById('exportPdfBtn').addEventListener('click', () => this.exportPDF());
        document.getElementById('shareUrlBtn').addEventListener('click', () => this.shareURL());
        document.getElementById('shareQrBtn').addEventListener('click', () => this.shareQR());
    }
 
    async loadQuestions() {
        try {
            const response = await fetch('questions.json');
            const data = await response.json();
            this.questions = data.questions;
            document.getElementById('loadingScreen').style.display = 'none';
        } catch (error) {
            console.error('Failed to load questions:', error);
            alert('Failed to load quiz questions. Please refresh the page.');
        }
    }
 
    async loadPhaseData() {
        try {
            const response = await fetch('data-phase3.json');
            this.phaseData = await response.json();
            console.log('Phase 3 data loaded successfully:', this.phaseData.issues.length, 'issues found');
        } catch (error) {
            console.error('Failed to load phase data:', error);
            this.phaseData = { issues: [], factions: {}, contradictions: [] };
        }
    }
 
    loadSavedProgress() {
        const saved = localStorage.getItem('quizProgress');
        if (saved) {
            const progress = JSON.parse(saved);
            this.currentQuestionIndex = progress.currentQuestionIndex;
            this.scores = progress.scores;
            this.answers = progress.answers;
            this.testMode = progress.testMode;
        }
    }
 
    saveProgress() {
        const progress = {
            currentQuestionIndex: this.currentQuestionIndex,
            scores: this.scores,
            answers: this.answers,
            testMode: this.testMode,
            timestamp: Date.now()
        };
        localStorage.setItem('quizProgress', JSON.stringify(progress));
    }
 
    showWelcomeScreen() {
        document.getElementById('welcomeScreen').style.display = 'block';
    }
 
    startQuiz(mode) {
        this.testMode = mode;
        this.startTime = Date.now();
        document.getElementById('welcomeScreen').style.display = 'none';
        document.getElementById('resetBtn').style.display = 'inline-block';
        this.renderQuestion();
    }
 
    renderQuestion() {
        const screen = document.getElementById('quizScreen');
        screen.style.display = 'block';
 
        const question = this.questions[this.currentQuestionIndex];
        const isNewSection = question.sectionLabel !== this.currentSection;
 
        if (isNewSection) {
            this.currentSection = question.sectionLabel;
            const sectionLabel = document.getElementById('sectionLabel');
            sectionLabel.textContent = question.sectionLabel;
            sectionLabel.style.display = 'block';
        } else {
            document.getElementById('sectionLabel').style.display = 'none';
        }
 
        document.getElementById('questionText').textContent = question.text;
        document.getElementById('questionSubtext').textContent = question.subtext || '';
        
        document.getElementById('questionNumber').textContent = this.currentQuestionIndex + 1;
        document.getElementById('totalQuestions').textContent = this.questions.length;
        this.updateProgressBar();
 
        this.renderOptions(question);
 
        document.getElementById('prevBtn').style.display = this.currentQuestionIndex > 0 ? 'inline-block' : 'none';
        document.getElementById('nextBtn').disabled = this.answers[this.currentQuestionIndex] === undefined;
    }
 
    renderOptions(question) {
        const container = document.getElementById('optionsContainer');
        container.innerHTML = '';
 
        question.options.forEach((option, index) => {
            const button = document.createElement('button');
            button.className = 'option-btn';
            button.textContent = option.text;
 
            if (this.answers[this.currentQuestionIndex] === index) {
                button.classList.add('selected');
            }
 
            button.addEventListener('click', () => this.selectOption(index));
            container.appendChild(button);
        });
    }
 
    selectOption(optionIndex) {
        const question = this.questions[this.currentQuestionIndex];
        const option = question.options[optionIndex];
 
        this.answers[this.currentQuestionIndex] = optionIndex;
        
        if (!this.answers[this.currentQuestionIndex] || this.answers[this.currentQuestionIndex] !== optionIndex) {
            for (let i = 0; i < 4; i++) {
                this.scores[i] = Math.max(0, Math.min(10, this.scores[i] + option.score[i]));
            }
        }
 
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === optionIndex);
        });
 
        document.getElementById('nextBtn').disabled = false;
        this.saveProgress();
    }
 
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.renderQuestion();
        } else {
            this.showResults();
        }
    }
 
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.renderQuestion();
        }
    }
 
    updateProgressBar() {
        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        document.getElementById('progressFill').style.width = progress + '%';
    }
 
    showResults() {
        document.getElementById('quizScreen').style.display = 'none';
        document.getElementById('resultsScreen').style.display = 'block';
        
        const econ = Math.round((this.scores[0] / 10) * 100);
        const prog = Math.round((this.scores[1] / 10) * 100);
        const auth = Math.round((this.scores[2] / 10) * 100);
        const nat = Math.round((this.scores[3] / 10) * 100);
 
        this.renderAxisResults(econ, prog, auth, nat);
        this.renderPartyAlignment(econ, prog, auth, nat);
        this.renderRadarChart(econ, prog, auth, nat);
        this.renderIssueAnalysis();
        this.renderFactionAnalysis(econ, prog, auth, nat);
        this.renderEnhancedContradictions();
        this.showComparisonMode();
        
        this.saveResults({
            econ, prog, auth, nat,
            scores: this.scores,
            answers: this.answers,
            timestamp: Date.now()
        });
    }
 
    renderAxisResults(econ, prog, auth, nat) {
        const container = document.getElementById('axisResults');
        container.innerHTML = '';
 
        const axes = [
            { label: 'Economic', value: econ, left: 'Left: Regulation', right: 'Right: Markets' },
            { label: 'Progressive', value: prog, left: 'Tradition: Caution', right: 'Progressive: Reform' },
            { label: 'Authority', value: auth, left: 'Civil Liberties', right: 'Law & Order' },
            { label: 'Nationalism', value: nat, left: 'Globalist: Open', right: 'Nationalist: Sovereignty' }
        ];
 
        axes.forEach(axis => {
            const axisDiv = document.createElement('div');
            axisDiv.className = 'axis-result';
            
            const color = axis.value > 65 ? '#D32F2F' : axis.value > 50 ? '#E6A0A0' : axis.value > 40 ? '#1976D2' : '#64B5F6';
            
            axisDiv.innerHTML = `
                <h4>${axis.label}</h4>
                <div class="axis-bar">
                    <div class="axis-fill" style="width: ${axis.value}%; background: ${color};">
                        <span>${axis.value}%</span>
                    </div>
                </div>
                <div class="axis-endpoints">
                    <span>${axis.left}</span>
                    <span>${axis.right}</span>
                </div>
            `;
            
            container.appendChild(axisDiv);
        });
    }
 
    renderPartyAlignment(econ, prog, auth, nat) {
        const parties = this.calculatePartyAlignment(econ, prog, auth, nat);
        const container = document.getElementById('partyAlignment');
        container.innerHTML = '';
 
        parties.slice(0, 3).forEach(party => {
            const partyDiv = document.createElement('div');
            partyDiv.className = 'party-item';
            partyDiv.innerHTML = `
                <div class="party-name">${party.name}</div>
                <div class="party-desc">${party.desc}</div>
                <div class="alignment-score">Match: ${party.match}%</div>
            `;
            container.appendChild(partyDiv);
        });
    }
 
    calculatePartyAlignment(econ, prog, auth, nat) {
        const parties = [];
        
        if (econ < 45) {
            if (prog > 60) {
                parties.push({
                    name: 'NDP',
                    desc: 'Economic left + progressive. Social programs, workers, climate, Indigenous rights.',
                    match: Math.round(Math.min(95, 85 - Math.abs(econ - 25) + Math.abs(prog - 75)))
                });
            }
            if (prog >= 45 && prog <= 60) {
                parties.push({
                    name: 'Liberals (Left Wing)',
                    desc: 'Centre-left pragmatism with progressive social policy.',
                    match: Math.round(Math.min(90, 75 - Math.abs(econ - 35) + Math.abs(prog - 55)))
                });
            }
        }
 
        if (econ >= 40 && econ <= 55 && prog >= 45 && prog <= 60) {
            parties.push({
                name: 'Liberals',
                desc: 'Political centre. Pragmatic balance of competing values.',
                match: Math.round(Math.min(90, 80 - Math.abs(econ - 48) + Math.abs(prog - 50)))
            });
        }
 
        if (econ > 55) {
            if (prog < 45) {
                parties.push({
                    name: 'Conservatives',
                    desc: 'Economic right + traditional values. Markets, lower taxes, law & order.',
                    match: Math.round(Math.min(95, 85 - Math.abs(econ - 75) + Math.abs(prog - 30)))
                });
            }
            if (prog >= 45 && prog <= 60) {
                parties.push({
                    name: 'Conservatives (Mainstream)',
                    desc: 'Market solutions with pragmatism on some social issues.',
                    match: Math.round(Math.min(85, 70 - Math.abs(econ - 65) + Math.abs(prog - 45)))
                });
            }
        }
 
        if (parties.length === 0) {
            parties.push({
                name: 'Independent/Cross-party',
                desc: 'Your positions blend views across party lines in unique ways.',
                match: 65
            });
        }
 
        return parties;
    }
 
    // PHASE 3: ISSUE ANALYSIS
    renderIssueAnalysis() {
        if (!this.phaseData || !this.phaseData.issues) {
            console.error('Phase data not loaded');
            return;
        }
 
        const container = document.getElementById('results-content');
        
        const issueScores = this.calculateIssueScores();
        const sortedIssues = Object.entries(issueScores)
            .sort((a, b) => b[1].strength - a[1].strength)
            .slice(0, 8);
 
        let issueHTML = '<div class="issue-grid">';
        
        sortedIssues.forEach(([issueId, data]) => {
            const issue = this.phaseData.issues.find(i => i.id === issueId);
            if (!issue) return;
            
            const strength = data.strength;
            const bar = '█'.repeat(Math.round(strength / 5)) + '░'.repeat(20 - Math.round(strength / 5));
            
            issueHTML += `
                <div class="issue-item">
                    <h4>${issue.name}</h4>
                    <div class="issue-bar">${bar}</div>
                    <span class="issue-score">${strength}%</span>
                </div>
            `;
        });
        
        issueHTML += '</div>';
        
        const issueSection = document.createElement('div');
        issueSection.className = 'results-section';
        issueSection.innerHTML = `<h3>Your Issue Priorities</h3>${issueHTML}`;
        container.appendChild(issueSection);
    }
 
    calculateIssueScores() {
        const scores = {};
        
        this.phaseData.issues.forEach(issue => {
            let totalStrength = 0;
            let count = 0;
            
            issue.questions.forEach(qIdx => {
                if (this.answers[qIdx] !== undefined) {
                    const option = this.questions[qIdx].options[this.answers[qIdx]];
                    // Strength = sum of all score components (shows how extreme the position is)
                    const strength = option.score.reduce((a, b) => a + b, 0);
                    totalStrength += strength;
                    count++;
                }
            });
            
            // Scale to 0-100% (max is around 30 for 4 axes * 7.5 avg per axis)
            scores[issue.id] = {
                strength: count > 0 ? Math.min(100, Math.round((totalStrength / count) * 3)) : 0,
                count: count
            };
        });
        
        return scores;
    }
 
    // PHASE 3: FACTION ANALYSIS
    renderFactionAnalysis(econ, prog, auth, nat) {
        const container = document.getElementById('results-content');
        
        const factionScores = this.calculateFactionScores(econ, prog, auth, nat);
        const topFaction = factionScores[0];
        
        let factionHTML = `
            <div class="faction-primary">
                <h4>${topFaction.faction.name}</h4>
                <p class="faction-party">Within: ${topFaction.party}</p>
                <p class="faction-prob">Probability: ${topFaction.probability}%</p>
                <p class="faction-desc">${topFaction.faction.description}</p>
                <div class="faction-positions">
                    <h5>Key Positions:</h5>
                    <ul>
                        ${Object.entries(topFaction.faction.keyPositions).slice(0, 4).map(([k, v]) => 
                            `<li><strong>${k}:</strong> ${v}</li>`
                        ).join('')}
                    </ul>
                </div>
            </div>
            <h5>Other Possible Factions:</h5>
            <div class="faction-alternatives">
        `;
        
        factionScores.slice(1, 4).forEach(f => {
            factionHTML += `
                <div class="faction-alt">
                    <h5>${f.faction.name}</h5>
                    <p>${f.probability}% match</p>
                </div>
            `;
        });
        
        factionHTML += '</div>';
        
        const factionSection = document.createElement('div');
        factionSection.className = 'results-section';
        factionSection.innerHTML = `<h3>Your Political Faction</h3>${factionHTML}`;
        container.appendChild(factionSection);
    }
 
    calculateFactionScores(econ, prog, auth, nat) {
        const scores = [];
        
        Object.entries(this.phaseData.factions).forEach(([partyId, party]) => {
            party.factions.forEach(faction => {
                const [econMin, econMax] = faction.characteristics.economic;
                const [progMin, progMax] = faction.characteristics.progressive;
                const [authMin, authMax] = faction.characteristics.authority;
                const [natMin, natMax] = faction.characteristics.nationalism;
                
                const econMatch = econ >= econMin && econ <= econMax ? 100 : Math.max(0, 100 - Math.abs(econ - (econMin + econMax) / 2) * 2);
                const progMatch = prog >= progMin && prog <= progMax ? 100 : Math.max(0, 100 - Math.abs(prog - (progMin + progMax) / 2) * 2);
                const authMatch = auth >= authMin && auth <= authMax ? 100 : Math.max(0, 100 - Math.abs(auth - (authMin + authMax) / 2) * 2);
                const natMatch = nat >= natMin && nat <= natMax ? 100 : Math.max(0, 100 - Math.abs(nat - (natMin + natMax) / 2) * 2);
                
                const avgMatch = (econMatch + progMatch + authMatch + natMatch) / 4;
                
                scores.push({
                    party: party.name,
                    faction: faction,
                    probability: Math.round(avgMatch),
                    matches: { econMatch, progMatch, authMatch, natMatch }
                });
            });
        });
        
        return scores.sort((a, b) => b.probability - a.probability);
    }
 
    // PHASE 3: RADAR CHART
    renderRadarChart(econ, prog, auth, nat) {
        const container = document.getElementById('results-content');
        
        const radarSection = document.createElement('div');
        radarSection.className = 'results-section';
        radarSection.innerHTML = `
            <h3>Political Position (4D View)</h3>
            <canvas id="radarChart" width="300" height="300"></canvas>
        `;
        container.appendChild(radarSection);
        
        setTimeout(() => {
            const ctx = document.getElementById('radarChart').getContext('2d');
            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: ['Economic\n(Left-Right)', 'Progressive\n(Trad-Reform)', 'Authority\n(Liberty-Order)', 'Nationalism\n(Global-National)'],
                    datasets: [{
                        label: 'Your Position',
                        data: [econ, prog, auth, nat],
                        borderColor: '#1976D2',
                        backgroundColor: 'rgba(25, 118, 210, 0.2)',
                        borderWidth: 2,
                        pointRadius: 5,
                        pointBackgroundColor: '#1976D2'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: true,
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: { stepSize: 20 }
                        }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });
        }, 100);
    }
 
    // PHASE 3: ENHANCED CONTRADICTIONS
    renderEnhancedContradictions() {
        const contradictions = this.detectContradictions();
        
        if (contradictions.length === 0) return;
        
        const container = document.getElementById('results-content');
        
        let html = '';
        
        contradictions.forEach(c => {
            const severity = c.severity === 'high' ? '🔴' : '🟡';
            html += `
                <div class="contradiction-item severity-${c.severity}">
                    <h4>${severity} ${c.contradiction.name}</h4>
                    <p class="contradiction-desc">${c.contradiction.description}</p>
                    <p class="contradiction-explanation">${c.contradiction.explanation}</p>
                    <div class="contradiction-resolutions">
                        <h5>Possible Resolutions:</h5>
                        ${c.contradiction.resolutions.map((r, idx) => `
                            <div class="resolution">
                                <strong>${idx + 1}. ${r.name}</strong>
                                <p>${r.text}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        const contradictionSection = document.createElement('div');
        contradictionSection.className = 'results-section';
        contradictionSection.innerHTML = `<h3>Possible Contradictions</h3>${html}`;
        container.appendChild(contradictionSection);
    }
 
    detectContradictions() {
        const found = [];
        
        this.phaseData.contradictions.forEach(contradiction => {
            const condition = contradiction.condition;
            
            try {
                // Use Function constructor to properly scope 'answers' parameter
                const fn = new Function('answers', `return ${condition}`);
                if (fn(this.answers)) {
                    found.push({
                        contradiction: contradiction,
                        severity: contradiction.severity
                    });
                }
            } catch (e) {
                console.error('Error evaluating contradiction:', condition, e);
            }
        });
        
        return found;
    }
 
    // COMPARISON MODE (From Phase 2)
    showComparisonMode() {
        const screen = document.getElementById('resultsScreen');
        const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
        const latestResult = results[results.length - 1];
 
        if (!latestResult) return;
 
        const econ = latestResult.econ;
        const prog = latestResult.prog;
        const auth = latestResult.auth;
        const nat = latestResult.nat;
 
        const container = document.getElementById('results-content');
        
        const comparisonSection = document.createElement('div');
        comparisonSection.className = 'results-section';
        comparisonSection.innerHTML = `
            <h3>How You Compare</h3>
            <div class="comparison-tabs">
                <button class="tab-btn active" onclick="app.showComparisonTab('national')">National Average</button>
                <button class="tab-btn" onclick="app.showComparisonTab('parties')">Party Voters</button>
                <button class="tab-btn" onclick="app.showComparisonTab('history')">Your History</button>
            </div>
            <div id="comparison-content"></div>
        `;
        
        container.appendChild(comparisonSection);
        this.showComparisonTab('national');
    }
 
    showComparisonTab(tab) {
        const content = document.getElementById('comparison-content');
        const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
        const latestResult = results[results.length - 1];
 
        if (!latestResult) return;
 
        const userScores = {
            econ: latestResult.econ,
            prog: latestResult.prog,
            auth: latestResult.auth,
            nat: latestResult.nat
        };
 
        if (tab === 'national') {
            this.renderNationalComparison(content, userScores);
        } else if (tab === 'parties') {
            this.renderPartyComparison(content, userScores);
        } else if (tab === 'history') {
            this.renderResultsHistory(content);
        }
 
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
    }
 
    renderNationalComparison(container, userScores) {
        const nationalAvg = {
            econ: 48,
            prog: 55,
            auth: 50,
            nat: 52
        };
 
        const html = `
            <div class="comparison-grid">
                <div class="comparison-item">
                    <h4>Economic Axis</h4>
                    <div class="score-comparison">
                        <div class="score-bar user">
                            <span>You: ${userScores.econ}%</span>
                            <div class="bar" style="width: ${userScores.econ}%"></div>
                        </div>
                        <div class="score-bar national">
                            <span>National: ${nationalAvg.econ}%</span>
                            <div class="bar" style="width: ${nationalAvg.econ}%"></div>
                        </div>
                    </div>
                </div>
                <div class="comparison-item">
                    <h4>Progressive Axis</h4>
                    <div class="score-comparison">
                        <div class="score-bar user">
                            <span>You: ${userScores.prog}%</span>
                            <div class="bar" style="width: ${userScores.prog}%"></div>
                        </div>
                        <div class="score-bar national">
                            <span>National: ${nationalAvg.prog}%</span>
                            <div class="bar" style="width: ${nationalAvg.prog}%"></div>
                        </div>
                    </div>
                </div>
                <div class="comparison-item">
                    <h4>Authority Axis</h4>
                    <div class="score-comparison">
                        <div class="score-bar user">
                            <span>You: ${userScores.auth}%</span>
                            <div class="bar" style="width: ${userScores.auth}%"></div>
                        </div>
                        <div class="score-bar national">
                            <span>National: ${nationalAvg.auth}%</span>
                            <div class="bar" style="width: ${nationalAvg.auth}%"></div>
                        </div>
                    </div>
                </div>
                <div class="comparison-item">
                    <h4>Nationalism Axis</h4>
                    <div class="score-comparison">
                        <div class="score-bar user">
                            <span>You: ${userScores.nat}%</span>
                            <div class="bar" style="width: ${userScores.nat}%"></div>
                        </div>
                        <div class="score-bar national">
                            <span>National: ${nationalAvg.nat}%</span>
                            <div class="bar" style="width: ${nationalAvg.nat}%"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
 
        container.innerHTML = html;
    }
 
    renderPartyComparison(container, userScores) {
        const partyPositions = {
            'Liberal': { econ: 45, prog: 55, auth: 45, nat: 50 },
            'NDP': { econ: 28, prog: 72, auth: 45, nat: 48 },
            'Conservative': { econ: 72, prog: 35, auth: 55, nat: 65 }
        };
 
        let html = '<div class="party-comparison-grid">';
        
        Object.entries(partyPositions).forEach(([party, positions]) => {
            const similarity = this.calculateSimilarity(userScores, positions);
            html += `
                <div class="party-comparison-item">
                    <h4>${party}</h4>
                    <div class="similarity-score">
                        <div class="score-circle" style="--percentage: ${similarity}%">
                            ${similarity}%
                        </div>
                        <p>Match</p>
                    </div>
                </div>
            `;
        });
 
        html += '</div>';
        container.innerHTML = html;
    }
 
    renderResultsHistory(container) {
        const resultsHistory = JSON.parse(localStorage.getItem('quizResults') || '[]');
        
        if (resultsHistory.length === 0) {
            container.innerHTML = '<p>No previous results. Take the quiz to build history.</p>';
            return;
        }
 
        let html = '<div class="results-history">';
        
        resultsHistory.forEach((result, idx) => {
            const date = new Date(result.timestamp).toLocaleDateString();
            html += `
                <div class="history-item">
                    <h4>Result ${resultsHistory.length - idx}</h4>
                    <p class="date">${date}</p>
                    <div class="history-scores">
                        <span>E: ${result.econ}%</span>
                        <span>P: ${result.prog}%</span>
                        <span>A: ${result.auth}%</span>
                        <span>N: ${result.nat}%</span>
                    </div>
                </div>
            `;
        });
 
        html += '</div>';
        container.innerHTML = html;
    }
 
    calculateSimilarity(userScores, partyScores) {
        const diffs = [
            Math.abs(userScores.econ - partyScores.econ),
            Math.abs(userScores.prog - partyScores.prog),
            Math.abs(userScores.auth - partyScores.auth),
            Math.abs(userScores.nat - partyScores.nat)
        ];
        
        const avgDiff = diffs.reduce((a, b) => a + b) / 4;
        return Math.max(0, Math.round(100 - avgDiff));
    }
 
    // UTILITIES
    saveResults(results) {
        const savedResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
        savedResults.push(results);
        localStorage.setItem('quizResults', JSON.stringify(savedResults.slice(-10)));
    }
 
    resetTest() {
        if (confirm('Start over? Progress will be lost.')) {
            localStorage.removeItem('quizProgress');
            this.currentQuestionIndex = 0;
            this.scores = [0, 0, 0, 0];
            this.answers = [];
            this.currentSection = '';
            
            document.getElementById('quizScreen').style.display = 'none';
            document.getElementById('resultsScreen').style.display = 'none';
            document.getElementById('welcomeScreen').style.display = 'block';
        }
    }
 
    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        this.applyDarkMode();
    }
 
    applyDarkMode() {
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').textContent = '☀️';
        } else {
            document.body.classList.remove('dark-mode');
            document.getElementById('themeToggle').textContent = '🌙';
        }
    }
 
    exportJSON() {
        const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
        const latestResult = results[results.length - 1];
        
        const data = {
            testDate: new Date(latestResult.timestamp).toISOString(),
            scores: {
                economic: latestResult.econ,
                progressive: latestResult.prog,
                authority: latestResult.auth,
                nationalism: latestResult.nat
            }
        };
 
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `political-quiz-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
 
    exportPDF() {
        const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
        const latestResult = results[results.length - 1];
 
        const content = `
Canadian Political Alignment Test - Phase 3 Results
 
Test Date: ${new Date(latestResult.timestamp).toLocaleDateString()}
 
SCORES:
Economic: ${latestResult.econ}% | Progressive: ${latestResult.prog}%
Authority: ${latestResult.auth}% | Nationalism: ${latestResult.nat}%
 
Generated by Canadian Political Alignment Test v3.0
        `.trim();
 
        const element = document.createElement('div');
        element.innerHTML = `<pre>${content}</pre>`;
        
        const opt = {
            margin: 10,
            filename: `political-quiz-${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };
 
        html2pdf().set(opt).from(element).save();
    }
 
    shareURL() {
        const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
        const latestResult = results[results.length - 1];
        
        const data = {
            econ: latestResult.econ,
            prog: latestResult.prog,
            auth: latestResult.auth,
            nat: latestResult.nat
        };
 
        const encoded = btoa(JSON.stringify(data));
        const shareUrl = `${window.location.origin}${window.location.pathname}?results=${encoded}`;
        
        const modal = document.getElementById('shareModal');
        const shareContent = document.getElementById('shareContent');
        shareContent.innerHTML = `
            <h3>Share Your Results</h3>
            <input type="text" value="${shareUrl}" readonly style="width: 100%; padding: 10px; margin: 10px 0;">
            <button onclick="copyToClipboard(this)">Copy Link</button>
        `;
        modal.style.display = 'flex';
    }
 
    shareQR() {
        const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
        const latestResult = results[results.length - 1];
        
        const data = {
            econ: latestResult.econ,
            prog: latestResult.prog,
            auth: latestResult.auth,
            nat: latestResult.nat
        };
 
        const encoded = btoa(JSON.stringify(data));
        const shareUrl = `${window.location.origin}${window.location.pathname}?results=${encoded}`;
 
        const modal = document.getElementById('shareModal');
        const shareContent = document.getElementById('shareContent');
        shareContent.innerHTML = '<h3>Share via QR Code</h3><div id="qrcode"></div>';
        
        new QRCode(document.getElementById('qrcode'), {
            text: shareUrl,
            width: 200,
            height: 200
        });
        
        modal.style.display = 'flex';
    }
}
 
// Utility functions
function closeModal() {
    document.getElementById('shareModal').style.display = 'none';
}
 
function copyToClipboard(button) {
    const input = button.previousElementSibling;
    input.select();
    document.execCommand('copy');
    button.textContent = 'Copied!';
    setTimeout(() => { button.textContent = 'Copy Link'; }, 2000);
}
 
function showAbout() {
    const modal = document.getElementById('modal');
    document.getElementById('modalBody').innerHTML = `
        <h2>About This Test - Phase 3</h2>
        <p>Advanced political alignment test with issue clustering, faction analysis, and contradiction detection.</p>
        <p>Version 3.0 | Phase 3 Complete</p>
    `;
    modal.style.display = 'flex';
}
 
function showFAQ() {
    const modal = document.getElementById('modal');
    document.getElementById('modalBody').innerHTML = `
        <h2>FAQ</h2>
        <h3>What's new in Phase 3?</h3>
        <p>Issue clustering shows which topics matter most to you. Faction analysis reveals nuanced political positions. Enhanced contradictions explain tensions in your views.</p>
        <h3>Are my results private?</h3>
        <p>Completely! All data stored locally on your device.</p>
    `;
    modal.style.display = 'flex';
}
 
// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuizApp();
});
