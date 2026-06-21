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
        const listeners = {
            'startBtn': () => this.startQuiz('full'),
            'quickStartBtn': () => this.startQuiz('quick'),
            'nextBtn': () => this.nextQuestion(),
            'prevBtn': () => this.previousQuestion(),
            'resetBtn': () => this.resetTest(),
            'retakeBtn': () => this.resetTest(),
            'themeToggle': () => this.toggleDarkMode(),
            'exportJsonBtn': () => this.exportJSON(),
            'exportPdfBtn': () => this.exportPDF(),
            'shareUrlBtn': () => this.shareURL(),
            'shareQrBtn': () => this.shareQR()
        };
        
        Object.entries(listeners).forEach(([id, handler]) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('click', handler);
            } else {
                console.warn(`Button element not found: ${id}`);
            }
        });
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
        if (!screen) {
            console.error('Quiz screen element not found');
            return;
        }
        screen.style.display = 'block';

        if (!this.questions || this.questions.length === 0) {
            console.error('No questions loaded');
            return;
        }

        if (this.currentQuestionIndex >= this.questions.length) {
            console.error('Question index out of bounds');
            this.showResults();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const isNewSection = question.sectionLabel !== this.currentSection;

        if (isNewSection) {
            this.currentSection = question.sectionLabel;
            const sectionLabel = document.getElementById('sectionLabel');
            if (sectionLabel) {
                sectionLabel.textContent = question.sectionLabel;
                sectionLabel.style.display = 'block';
            }
        } else {
            const sectionLabel = document.getElementById('sectionLabel');
            if (sectionLabel) {
                sectionLabel.style.display = 'none';
            }
        }

        const questionText = document.getElementById('questionText');
        const questionSubtext = document.getElementById('questionSubtext');
        if (questionText) questionText.textContent = question.text;
        if (questionSubtext) questionSubtext.textContent = question.subtext || '';
        
        const questionNumber = document.getElementById('questionNumber');
        const totalQuestions = document.getElementById('totalQuestions');
        if (questionNumber) questionNumber.textContent = this.currentQuestionIndex + 1;
        if (totalQuestions) totalQuestions.textContent = this.questions.length;
        this.updateProgressBar();

        this.renderOptions(question);

        const prevBtn = document.getElementById('prevBtn');
        if (prevBtn) {
            prevBtn.style.display = this.currentQuestionIndex > 0 ? 'inline-block' : 'none';
        }
        
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            nextBtn.disabled = this.answers[this.currentQuestionIndex] === undefined;
        }
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

        // If answer is already set, undo previous score
        if (this.answers[this.currentQuestionIndex] !== undefined) {
            const previousOption = question.options[this.answers[this.currentQuestionIndex]];
            for (let i = 0; i < 4; i++) {
                this.scores[i] -= previousOption.score[i];
            }
        }

        // Set new answer
        this.answers[this.currentQuestionIndex] = optionIndex;
        
        // Add new score
        for (let i = 0; i < 4; i++) {
            this.scores[i] = Math.max(0, Math.min(10, this.scores[i] + option.score[i]));
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
        const progressFill = document.getElementById('progressFill');
        if (!progressFill) return;

        const progress = ((this.currentQuestionIndex + 1) / this.questions.length) * 100;
        progressFill.style.width = progress + '%';
    }

    showResults() {
        document.getElementById('quizScreen').style.display = 'none';
        document.getElementById('resultsScreen').style.display = 'block';
        
        // CLEAR previous results to prevent duplication
        const container = document.getElementById('results-content');
        container.innerHTML = '';
        
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
        this.renderPoliticalTrajectory();
        this.showComparisonMode();
        
        this.saveResults({
            econ, prog, auth, nat,
            scores: this.scores,
            answers: this.answers,
            timestamp: Date.now()
        });
    }

    renderAxisResults(econ, prog, auth, nat) {
        const container = document.getElementById('results-content');
        if (!container) {
            console.error('Results content container not found');
            return;
        }

        const axes = [
            { label: 'Economic', value: econ, left: 'Left: Regulation', right: 'Right: Markets' },
            { label: 'Progressive', value: prog, left: 'Tradition: Caution', right: 'Progressive: Reform' },
            { label: 'Authority', value: auth, left: 'Civil Liberties', right: 'Law & Order' },
            { label: 'Nationalism', value: nat, left: 'Globalist: Open', right: 'Nationalist: Sovereignty' }
        ];

        let axisHTML = '';
        axes.forEach(axis => {
            const color = axis.value > 65 ? '#D32F2F' : axis.value > 50 ? '#E6A0A0' : axis.value > 40 ? '#1976D2' : '#64B5F6';
            
            axisHTML += `
                <div class="axis-result">
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
                </div>
            `;
        });

        const section = document.createElement('div');
        section.className = 'results-section';
        section.innerHTML = axisHTML;
        container.appendChild(section);
    }

    renderPartyAlignment(econ, prog, auth, nat) {
        const container = document.getElementById('results-content');
        if (!container) {
            console.error('Results content container not found');
            return;
        }

        const parties = this.calculatePartyAlignment(econ, prog, auth, nat);

        let partyHTML = '';
        parties.slice(0, 3).forEach(party => {
            partyHTML += `
                <div class="party-item">
                    <div class="party-name">${party.name}</div>
                    <div class="party-desc">${party.desc}</div>
                    <div class="alignment-score">Match: ${party.match}%</div>
                </div>
            `;
        });

        const section = document.createElement('div');
        section.className = 'results-section';
        section.innerHTML = `<h3>Party Alignment</h3><div class="party-alignment">${partyHTML}</div>`;
        container.appendChild(section);
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
        if (!container) {
            console.error('Results container not found');
            return;
        }
        
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
                    // Strength = sum of all score components
                    const strength = option.score.reduce((a, b) => a + b, 0);
                    totalStrength += strength;
                    count++;
                }
            });
            
            // Get weight from issue data (default 1.0 if not set)
            const weight = issue.weight || 1.0;
            
            // Scale to 0-100%: avg per question ~0.5-3, multiply by 20 = 10-60%
            // Then apply weight multiplier
            scores[issue.id] = {
                strength: count > 0 ? Math.min(100, Math.round((totalStrength / count) * 20 * weight)) : 0,
                count: count,
                weight: weight
            };
        });
        
        return scores;
    }

    // PHASE 3: FACTION ANALYSIS
    renderFactionAnalysis(econ, prog, auth, nat) {
        if (!this.phaseData || !this.phaseData.factions) {
            console.error('Faction data not loaded');
            return;
        }

        const container = document.getElementById('results-content');
        if (!container) {
            console.error('Results container not found');
            return;
        }
        
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
        
        // Render faction pie chart after main faction display
        this.renderFactionPieChart(factionScores);
    }

    // PHASE 3 TIER 2: FACTION PIE CHART
    renderFactionPieChart(factionScores) {
        const container = document.getElementById('results-content');
        if (!container) return;

        // Normalize probabilities to 100% (they're currently independent matches)
        const totalProbability = factionScores.reduce((sum, f) => sum + f.probability, 0);
        const normalizedScores = factionScores.map(f => ({
            ...f,
            probability: Math.round((f.probability / totalProbability) * 100)
        }));

        // Get top 5 factions, group rest as "Other"
        const topFactions = normalizedScores.slice(0, 5);
        let otherProbability = 0;
        normalizedScores.slice(5).forEach(f => {
            otherProbability += f.probability;
        });

        let chartLabels = topFactions.map(f => f.faction.name);
        let chartData = topFactions.map(f => f.probability);
        let chartColors = [
            '#1976D2', '#D32F2F', '#388E3C', '#F57C00', '#7B1FA2'
        ];

        if (otherProbability > 0) {
            chartLabels.push('Other Factions');
            chartData.push(otherProbability);
            chartColors.push('#BDBDBD');
        }

        const pieSection = document.createElement('div');
        pieSection.className = 'results-section';
        pieSection.innerHTML = `
            <h3>Faction Probability Distribution</h3>
            <canvas id="factionPieChart" width="300" height="300"></canvas>
        `;
        container.appendChild(pieSection);

        // Render chart with proper timing
        requestAnimationFrame(() => {
            setTimeout(() => {
                const canvas = document.getElementById('factionPieChart');
                if (!canvas || typeof Chart === 'undefined') {
                    console.warn('Faction pie chart canvas or Chart.js not available');
                    return;
                }

                try {
                    const ctx = canvas.getContext('2d');
                    new Chart(ctx, {
                        type: 'pie',
                        data: {
                            labels: chartLabels,
                            datasets: [{
                                data: chartData,
                                backgroundColor: chartColors,
                                borderColor: '#fff',
                                borderWidth: 2
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        padding: 15,
                                        font: { size: 12 }
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.label + ': ' + context.parsed + '%';
                                        }
                                    }
                                }
                            }
                        }
                    });
                } catch (e) {
                    console.error('Error rendering faction pie chart:', e);
                }
            }, 150);
        });
    }

    calculateFactionScores(econ, prog, auth, nat) {
        if (!this.phaseData || !this.phaseData.factions) {
            console.error('Faction data not loaded');
            return [{
                party: 'Unknown',
                faction: { name: 'Independent/Cross-party' },
                probability: 100,
                matches: {}
            }];
        }

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
                    rawScore: avgMatch,
                    probability: 0, // Will be normalized
                    matches: { econMatch, progMatch, authMatch, natMatch }
                });
            });
        });

        // Normalize probabilities to sum to 100%
        const totalScore = scores.reduce((sum, s) => sum + s.rawScore, 0);
        scores.forEach(score => {
            score.probability = Math.round((score.rawScore / totalScore) * 100);
        });

        // Ensure sum = 100% (handle rounding errors)
        const sum = scores.reduce((total, s) => total + s.probability, 0);
        if (sum !== 100) {
            const diff = 100 - sum;
            if (scores[0]) scores[0].probability += diff; // Add/subtract from top faction
        }

        return scores.sort((a, b) => b.probability - a.probability);
    }

    // PHASE 3: RADAR CHART
    renderRadarChart(econ, prog, auth, nat) {
        const container = document.getElementById('results-content');
        if (!container) {
            console.error('Results container not found');
            return;
        }
        
        const radarSection = document.createElement('div');
        radarSection.className = 'results-section';
        radarSection.innerHTML = `
            <h3>Political Position (4D View)</h3>
            <canvas id="radarChart" width="300" height="300"></canvas>
        `;
        container.appendChild(radarSection);
        
        // Use requestAnimationFrame for better timing than setTimeout
        requestAnimationFrame(() => {
            setTimeout(() => {
                const canvas = document.getElementById('radarChart');
                if (!canvas) {
                    console.error('Radar chart canvas not found');
                    return;
                }

                if (typeof Chart === 'undefined') {
                    console.error('Chart.js library not loaded');
                    return;
                }

                try {
                    const ctx = canvas.getContext('2d');
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
                } catch (e) {
                    console.error('Error rendering radar chart:', e);
                }
            }, 100);
        });
    }

    // PHASE 3: ENHANCED CONTRADICTIONS
    renderEnhancedContradictions() {
        const contradictions = this.detectContradictions();
        
        if (contradictions.length === 0) return;
        
        const container = document.getElementById('results-content');
        if (!container) {
            console.error('Results container not found');
            return;
        }
        
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
        if (!this.phaseData || !this.phaseData.contradictions) {
            console.error('Contradiction data not loaded');
            return [];
        }

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
        if (!container) {
            console.error('Results container not found');
            return;
        }
        
        const comparisonSection = document.createElement('div');
        comparisonSection.className = 'results-section';
        comparisonSection.innerHTML = `
            <h3>How You Compare</h3>
            <div class="comparison-tabs">
                <button class="tab-btn active" onclick="app.showComparisonTab('national', this)">National Average</button>
                <button class="tab-btn" onclick="app.showComparisonTab('parties', this)">Party Voters</button>
                <button class="tab-btn" onclick="app.showComparisonTab('history', this)">Your History</button>
            </div>
            <div id="comparison-content"></div>
        `;
        
        container.appendChild(comparisonSection);
        this.showComparisonTab('national', null);
    }

    showComparisonTab(tab, btn) {
        const content = document.getElementById('comparison-content');
        if (!content) {
            console.error('Comparison content container not found');
            return;
        }

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

        // Update button states
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.remove('active');
        });
        if (btn) {
            btn.classList.add('active');
        }
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
        if (results.length === 0) {
            alert('No results to export. Take the quiz first.');
            return;
        }
        
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
        if (results.length === 0) {
            alert('No results to export. Take the quiz first.');
            return;
        }

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

        if (typeof html2pdf === 'undefined') {
            alert('PDF export library not loaded. Try again in a moment.');
            return;
        }

        html2pdf().set(opt).from(element).save();
    }

    shareURL() {
        const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
        if (results.length === 0) {
            alert('No results to share. Take the quiz first.');
            return;
        }

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
        if (!modal) {
            alert('Share modal not found in page.');
            return;
        }

        const shareContent = document.getElementById('shareContent');
        if (!shareContent) {
            alert('Share content container not found.');
            return;
        }

        shareContent.innerHTML = `
            <h3>Share Your Results</h3>
            <input type="text" value="${shareUrl}" readonly style="width: 100%; padding: 10px; margin: 10px 0;">
            <button onclick="copyToClipboard(this)">Copy Link</button>
        `;
        modal.style.display = 'flex';
    }

    shareQR() {
        const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
        if (results.length === 0) {
            alert('No results to share. Take the quiz first.');
            return;
        }

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
        if (!modal) {
            alert('Share modal not found in page.');
            return;
        }

        const shareContent = document.getElementById('shareContent');
        if (!shareContent) {
            alert('Share content container not found.');
            return;
        }

        shareContent.innerHTML = '<h3>Share via QR Code</h3><div id="qrcode"></div>';

        if (typeof QRCode === 'undefined') {
            shareContent.innerHTML = '<p>QR Code library not loaded. Try again in a moment.</p>';
            return;
        }
        
        new QRCode(document.getElementById('qrcode'), {
            text: shareUrl,
            width: 200,
            height: 200
        });
        
        modal.style.display = 'flex';
    }

    // PHASE 3 TIER 2: POLITICAL TRAJECTORY
    renderPoliticalTrajectory() {
        const resultsHistory = JSON.parse(localStorage.getItem('quizResults') || '[]');
        
        if (resultsHistory.length < 2) {
            return; // Need at least 2 results to show trajectory
        }

        const container = document.getElementById('results-content');
        if (!container) return;

        // Prepare data for chart
        const labels = resultsHistory.map((r, idx) => {
            const date = new Date(r.timestamp);
            return (idx + 1) + '. ' + date.toLocaleDateString();
        });

        const econData = resultsHistory.map(r => r.econ);
        const progData = resultsHistory.map(r => r.prog);
        const authData = resultsHistory.map(r => r.auth);
        const natData = resultsHistory.map(r => r.nat);

        // Calculate trends
        const trends = this.calculateTrends(econData, progData, authData, natData);

        const trajectorySection = document.createElement('div');
        trajectorySection.className = 'results-section';
        trajectorySection.innerHTML = `
            <h3>Your Political Evolution</h3>
            <div class="trajectory-info">
                <div class="trend-item economic">
                    <strong>Economic Axis:</strong>
                    <span>${trends.econ.direction} ${Math.abs(trends.econ.change)}%</span>
                    <small>${trends.econ.interpretation}</small>
                </div>
                <div class="trend-item progressive">
                    <strong>Progressive Axis:</strong>
                    <span>${trends.prog.direction} ${Math.abs(trends.prog.change)}%</span>
                    <small>${trends.prog.interpretation}</small>
                </div>
                <div class="trend-item authority">
                    <strong>Authority Axis:</strong>
                    <span>${trends.auth.direction} ${Math.abs(trends.auth.change)}%</span>
                    <small>${trends.auth.interpretation}</small>
                </div>
                <div class="trend-item nationalism">
                    <strong>Nationalism Axis:</strong>
                    <span>${trends.nat.direction} ${Math.abs(trends.nat.change)}%</span>
                    <small>${trends.nat.interpretation}</small>
                </div>
            </div>
            <canvas id="trajectoryChart" width="400" height="200"></canvas>
        `;
        container.appendChild(trajectorySection);

        // Render chart with proper timing
        requestAnimationFrame(() => {
            setTimeout(() => {
                const canvas = document.getElementById('trajectoryChart');
                if (!canvas || typeof Chart === 'undefined') {
                    console.warn('Trajectory chart canvas or Chart.js not available');
                    return;
                }

                try {
                    const ctx = canvas.getContext('2d');
                    new Chart(ctx, {
                        type: 'line',
                        data: {
                            labels: labels,
                            datasets: [
                                {
                                    label: 'Economic',
                                    data: econData,
                                    borderColor: '#1976D2',
                                    backgroundColor: 'rgba(25, 118, 210, 0.1)',
                                    tension: 0.3,
                                    fill: false
                                },
                                {
                                    label: 'Progressive',
                                    data: progData,
                                    borderColor: '#D32F2F',
                                    backgroundColor: 'rgba(211, 47, 47, 0.1)',
                                    tension: 0.3,
                                    fill: false
                                },
                                {
                                    label: 'Authority',
                                    data: authData,
                                    borderColor: '#388E3C',
                                    backgroundColor: 'rgba(56, 142, 60, 0.1)',
                                    tension: 0.3,
                                    fill: false
                                },
                                {
                                    label: 'Nationalism',
                                    data: natData,
                                    borderColor: '#F57C00',
                                    backgroundColor: 'rgba(245, 124, 0, 0.1)',
                                    tension: 0.3,
                                    fill: false
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: true,
                            scales: {
                                y: {
                                    min: 0,
                                    max: 100,
                                    ticks: { stepSize: 20 }
                                }
                            },
                            plugins: {
                                legend: {
                                    position: 'top'
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.dataset.label + ': ' + context.parsed.y + '%';
                                        }
                                    }
                                }
                            }
                        }
                    });
                } catch (e) {
                    console.error('Error rendering trajectory chart:', e);
                }
            }, 150);
        });
    }

    calculateTrends(econData, progData, authData, natData) {
        const calculateTrend = (data) => {
            const first = data[0];
            const last = data[data.length - 1];
            const change = last - first;
            const direction = change > 0 ? '↑' : change < 0 ? '↓' : '→';
            const interpretation = 
                change > 5 ? 'Significant shift' :
                change > 0 ? 'Slight shift' :
                change < -5 ? 'Significant shift' :
                change < 0 ? 'Slight shift' :
                'Stable position';
            return { change, direction, interpretation };
        };

        return {
            econ: calculateTrend(econData),
            prog: calculateTrend(progData),
            auth: calculateTrend(authData),
            nat: calculateTrend(natData)
        };
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
