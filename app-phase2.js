// Canadian Political Alignment Test - Phase 2 Enhancement
// Adds: Comparison mode, advanced visualizations, result comparison

class QuizAppPhase2 extends QuizApp {
    constructor() {
        super();
        this.resultsHistory = JSON.parse(localStorage.getItem('quizResults') || '[]');
        this.comparisonMode = false;
        this.partyAverages = this.calculatePartyAverages();
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
            btn.classList.toggle('active', btn.textContent.includes(['National', 'Party', 'History'][['national', 'parties', 'history'].indexOf(tab)]));
        });
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
        if (this.resultsHistory.length === 0) {
            container.innerHTML = '<p>No previous results. Take the quiz to build history.</p>';
            return;
        }

        let html = '<div class="results-history">';
        
        this.resultsHistory.forEach((result, idx) => {
            const date = new Date(result.timestamp).toLocaleDateString();
            html += `
                <div class="history-item">
                    <h4>Result ${this.resultsHistory.length - idx}</h4>
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

    calculatePartyAverages() {
        return {
            'Liberal': { econ: 45, prog: 55, auth: 45, nat: 50 },
            'NDP': { econ: 28, prog: 72, auth: 45, nat: 48 },
            'Conservative': { econ: 72, prog: 35, auth: 55, nat: 65 }
        };
    }

    // PHASE 2: Issue Clustering Analysis
    analyzeIssuePreferences() {
        const issueCategories = {
            'Healthcare': ['Q001', 'Q002', 'Q039'],
            'Housing': ['Q004'],
            'Climate & Energy': ['Q005', 'Q006', 'Q057', 'Q059'],
            'Immigration': ['Q008', 'Q009', 'Q047'],
            'Education': ['Q012', 'Q013'],
            'Justice & Safety': ['Q014', 'Q015', 'Q016'],
            'Taxation & Labor': ['Q017', 'Q018', 'Q019'],
            'Social Values': ['Q020', 'Q021', 'Q022'],
            'Foreign Policy': ['Q023', 'Q024', 'Q025', 'Q026', 'Q027', 'Q040', 'Q041', 'Q042', 'Q043'],
            'Economy & Trade': ['Q028', 'Q031', 'Q032', 'Q033', 'Q044', 'Q045', 'Q060'],
            'Democracy & Governance': ['Q010', 'Q033', 'Q034', 'Q035', 'Q051', 'Q052', 'Q053']
        };

        const categoryScores = {};
        
        Object.entries(issueCategories).forEach(([category, qIds]) => {
            let scores = [0, 0, 0, 0];
            let count = 0;

            qIds.forEach(qId => {
                const qIndex = parseInt(qId.substring(1)) - 1;
                if (this.answers[qIndex] !== undefined) {
                    const option = this.questions[qIndex].options[this.answers[qIndex]];
                    option.score.forEach((score, i) => {
                        scores[i] += score;
                    });
                    count++;
                }
            });

            if (count > 0) {
                categoryScores[category] = scores.map(s => Math.round((s / count) * 10));
            }
        });

        return categoryScores;
    }

    // PHASE 2: Contradiction Detection
    detectContradictions() {
        const contradictions = [];

        // Example contradiction tests
        const tests = [
            {
                name: "Housing Affordability vs. Zoning",
                q1: 3, // Housing affordability (Q004)
                q2: 11, // Oppose density
                condition: (a1, a2) => a1 < 2 && a2 > 2,
                message: "You want affordable housing but oppose density - these often conflict"
            },
            {
                name: "Climate vs. Oil",
                q1: 4, // Decarbonization (Q005)
                q2: 56, // Oil sands (Q057)
                condition: (a1, a2) => a1 < 2 && a2 > 2,
                message: "You support rapid climate action but oil expansion - these conflict"
            },
            {
                name: "Immigration & Housing",
                q1: 7, // Immigration (Q008)
                q2: 3, // Housing (Q004)
                condition: (a1, a2) => a1 >= 2 && a2 >= 2,
                message: "You want high immigration and cheap housing - housing strain is partly demographic"
            }
        ];

        tests.forEach(test => {
            const ans1 = this.answers[test.q1];
            const ans2 = this.answers[test.q2];
            
            if (ans1 !== undefined && ans2 !== undefined && test.condition(ans1, ans2)) {
                contradictions.push({
                    name: test.name,
                    message: test.message,
                    severity: 'medium'
                });
            }
        });

        return contradictions;
    }

    // PHASE 2: Consistency Score
    calculateConsistencyScore() {
        const contradictions = this.detectContradictions();
        const maxContradictions = 5;
        const consistency = Math.max(0, Math.round(100 - (contradictions.length / maxContradictions) * 25));
        
        return {
            score: consistency,
            contradictions: contradictions,
            interpretation: consistency > 75 ? "Highly consistent" : consistency > 50 ? "Moderately consistent" : "Some contradictions"
        };
    }

    // Override showResults to include Phase 2 features
    showResults() {
        super.showResults();
        
        // Add Phase 2 features
        this.showComparisonMode();
        
        const consistency = this.calculateConsistencyScore();
        this.renderConsistencyScore(consistency);
    }

    renderConsistencyScore(consistency) {
        const container = document.getElementById('resultsScreen');
        const consistencySection = document.createElement('div');
        consistencySection.className = 'results-section';
        
        let html = `
            <h3>Consistency Analysis</h3>
            <div class="consistency-score">
                <div class="score-circle" style="--percentage: ${consistency.score}%">
                    ${consistency.score}%
                </div>
                <p>${consistency.interpretation}</p>
            </div>
        `;

        if (consistency.contradictions.length > 0) {
            html += '<div class="contradictions"><h4>Potential contradictions:</h4><ul>';
            consistency.contradictions.forEach(c => {
                html += `<li><strong>${c.name}</strong>: ${c.message}</li>`;
            });
            html += '</ul></div>';
        }

        consistencySection.innerHTML = html;
        container.appendChild(consistencySection);
    }
}

// Initialize Phase 2 version
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuizAppPhase2();
});
