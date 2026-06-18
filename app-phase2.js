// Canadian Political Alignment Test - Phase 2 (Self-Contained)
// Includes both QuizApp base class and Phase 2 enhancements

class QuizApp {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.scores = [0, 0, 0, 0]; // [economic, progressive, authority, nationalism]
        this.answers = [];
        this.currentSection = '';
        this.testMode = 'full'; // 'full' or 'quick'
        this.startTime = null;
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.applyDarkMode();
        await this.loadQuestions();
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

        // Update question text
        document.getElementById('questionText').textContent = question.text;
        document.getElementById('questionSubtext').textContent = question.subtext || '';
        
        // Update progress
        document.getElementById('questionNumber').textContent = this.currentQuestionIndex + 1;
        document.getElementById('totalQuestions').textContent = this.questions.length;
        this.updateProgressBar();

        // Render options
        this.renderOptions(question);

        // Update navigation buttons
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

        // Update answers and scores
        this.answers[this.currentQuestionIndex] = optionIndex;
        
        // Add scores (only if not already answered)
        if (!this.answers[this.currentQuestionIndex] || this.answers[this.currentQuestionIndex] !== optionIndex) {
            for (let i = 0; i < 4; i++) {
                this.scores[i] = Math.max(0, Math.min(10, this.scores[i] + option.score[i]));
            }
        }

        // Update UI
        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === optionIndex);
        });

        // Enable next button
        document.getElementById('nextBtn').disabled = false;

        // Save progress
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
        this.showComparisonMode();
        
        // Save results
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
        
        // Economic left
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

        // Centrist
        if (econ >= 40 && econ <= 55 && prog >= 45 && prog <= 60) {
            parties.push({
                name: 'Liberals',
                desc: 'Political centre. Pragmatic balance of competing values.',
                match: Math.round(Math.min(90, 80 - Math.abs(econ - 48) + Math.abs(prog - 50)))
            });
        }

        // Economic right
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

        // Default
        if (parties.length === 0) {
            parties.push({
                name: 'Independent/Cross-party',
                desc: 'Your positions blend views across party lines in unique ways.',
                match: 65
            });
        }

        return parties;
    }

    saveResults(results) {
        const savedResults = JSON.parse(localStorage.getItem('quizResults') || '[]');
        savedResults.push(results);
        localStorage.setItem('quizResults', JSON.stringify(savedResults.slice(-10))); // Keep last 10
    }

    resetTest() {
        if (confirm('Are you sure you want to start over? Your progress will be lost.')) {
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
            },
            testDetails: {
                totalQuestions: this.questions.length,
                questionsAnswered: this.answers.filter(a => a !== undefined).length
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
Canadian Political Alignment Test - Results

Test Date: ${new Date(latestResult.timestamp).toLocaleDateString()}

SCORES:
Economic Axis: ${latestResult.econ}%
Progressive Axis: ${latestResult.prog}%
Authority Axis: ${latestResult.auth}%
Nationalism Axis: ${latestResult.nat}%

INTERPRETATION:
- Economic: Left (0-35%), Centre-left (35-45%), Centrist (45-55%), Centre-right (55-70%), Right (70%+)
- Progressive: Traditional (0-35%), Centre-conservative (35-45%), Moderate (45-55%), Centre-progressive (55-70%), Progressive (70%+)
- Authority: Libertarian (0-35%), Civil liberties (35-45%), Balanced (45-55%), Law & order (55-70%), Authoritarian (70%+)
- Nationalism: Globalist (0-35%), Internationalist (35-45%), Balanced (45-55%), Sovereignty (55-70%), Nationalist (70%+)

---
Generated by Canadian Political Alignment Test v2.0
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
            <p>Copy this link to share:</p>
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

    // PHASE 2: Comparison Mode
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
        
        // Add comparison section to results
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

        // Update active tab
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        event.target.classList.add('active');
    }

    renderNationalComparison(container, userScores) {
        // Estimated national averages (based on Canadian demographics)
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
                        <p class="diff">${userScores.econ > nationalAvg.econ ? '✓ More right-leaning' : '✗ More left-leaning'} than average</p>
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
                        <p class="diff">${userScores.prog > nationalAvg.prog ? '✓ More progressive' : '✗ More traditional'} than average</p>
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
                        <p class="diff">${userScores.auth > nationalAvg.auth ? '✓ Prioritize order/security' : '✗ Prioritize freedom'}</p>
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
                        <p class="diff">${userScores.nat > nationalAvg.nat ? '✓ More nationalist' : '✗ More globalist'} than average</p>
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
            'Conservative': { econ: 72, prog: 35, auth: 55, nat: 65 },
            'Green': { econ: 25, prog: 75, auth: 40, nat: 45 },
            'Bloc Québécois': { econ: 45, prog: 50, auth: 50, nat: 75 }
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
                        <p>Match with ${party} voters</p>
                    </div>
                    <div class="party-breakdown">
                        <span>Econ: ${positions.econ}%</span>
                        <span>Prog: ${positions.prog}%</span>
                        <span>Auth: ${positions.auth}%</span>
                        <span>Nat: ${positions.nat}%</span>
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
        <h2>About This Test</h2>
        <p>The Canadian Political Alignment Test measures your political positions on 4 distinct axes:</p>
        <ul>
            <li><strong>Economic:</strong> Left vs. Right on government role in economy</li>
            <li><strong>Progressive:</strong> Traditional vs. Progressive on social change</li>
            <li><strong>Authority:</strong> Civil liberties vs. Law & order</li>
            <li><strong>Nationalism:</strong> Globalist vs. Nationalist perspectives</li>
        </ul>
        <p>This test covers Canadian politics comprehensively, including federal policies, provincial issues, and recent events.</p>
        <p>Version 2.0 | Phase 2 Complete</p>
    `;
    modal.style.display = 'flex';
}

function showFAQ() {
    const modal = document.getElementById('modal');
    document.getElementById('modalBody').innerHTML = `
        <h2>Frequently Asked Questions</h2>
        <h3>How long does the test take?</h3>
        <p>Full test: 15-20 minutes. Quick mode: 5-10 minutes.</p>
        <h3>Can I save my progress?</h3>
        <p>Yes! Progress is automatically saved to your browser's local storage.</p>
        <h3>Are my results private?</h3>
        <p>Completely! All data is stored locally on your device. Nothing is sent to any server.</p>
        <h3>How are the axes calculated?</h3>
        <p>Each answer contributes points to the 4 axes. Your final score (0-100%) on each axis determines your alignment.</p>
        <h3>How accurate is the party matching?</h3>
        <p>Party matching is based on aggregate policy positions. Most people don't perfectly align with one party.</p>
    `;
    modal.style.display = 'flex';
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuizApp();
});
