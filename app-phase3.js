// Canadian Political Alignment Test - Phase 3
// Complete with Issue Clustering, Faction Analysis, Enhanced Contradictions, Visualizations

// Likert intensity scale: how strongly the user holds their chosen position.
// Multiplier scales the raw option score before it's added to axis totals.
// This prevents a weakly-held extreme view from scoring identically to a
// strongly-held one — addresses the "forced choice" critique of fixed-option quizzes.
const INTENSITY_LEVELS = [
    { label: 'Slightly',   multiplier: 0.55 },
    { label: 'Somewhat',   multiplier: 0.70 },
    { label: 'Mostly',     multiplier: 0.85 },
    { label: 'Strongly',   multiplier: 1.00 },
    { label: 'Completely', multiplier: 1.15 },
];
const DEFAULT_INTENSITY_INDEX = 3; // "Strongly" — full score, matches pre-existing behaviour

class QuizApp {
    constructor() {
        this.questions = [];
        this.activeQuestions = [];  // Subset used during quiz (full or quick mode)
        this.phaseData = null;
        this.currentQuestionIndex = 0;
        this.scores = [0, 0, 0, 0];
        this.answers = [];
        this.intensities = []; // Likert intensity (0-4) per question, scales score contribution
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
            this.intensities = progress.intensities || [];
            this.testMode = progress.testMode;
            // Restore activeQuestions to match saved mode
            this.activeQuestions = this.testMode === 'quick'
                ? this.questions.filter((_, i) => i % 3 === 0)
                : this.questions;
        } else {
            this.activeQuestions = this.questions;
        }
    }

    saveProgress() {
        const progress = {
            currentQuestionIndex: this.currentQuestionIndex,
            scores: this.scores,
            answers: this.answers,
            intensities: this.intensities,
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
        this.scores = [0, 0, 0, 0];
        this.answers = [];
        this.intensities = [];
        this.currentQuestionIndex = 0;
        this.currentSection = '';

        if (mode === 'quick') {
            // Quick mode: pick every 3rd question, ensuring coverage of all 5 sections.
            // Result: ~20 questions, ~10 minutes, all axes represented.
            this.activeQuestions = this.questions.filter((_, i) => i % 3 === 0);
        } else {
            this.activeQuestions = this.questions;
        }

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

        if (!this.activeQuestions || this.activeQuestions.length === 0) {
            console.error('No questions loaded');
            return;
        }

        if (this.currentQuestionIndex >= this.activeQuestions.length) {
            console.error('Question index out of bounds');
            this.showResults();
            return;
        }

        const question = this.activeQuestions[this.currentQuestionIndex];
        
        // Map question index to a broad section group (not per-question unique labels)
        const idx = this.currentQuestionIndex;
        const sectionGroup =
            idx < 10  ? '📊 Economic Policy' :
            idx < 20  ? '🌱 Social & Progressive Values' :
            idx < 30  ? '⚖️ Authority & Civil Liberties' :
            idx < 40  ? '🌍 National Identity & Foreign Policy' :
                        '🔀 Cross-cutting Issues';

        const isNewSection = sectionGroup !== this.currentSection;

        if (isNewSection) {
            this.currentSection = sectionGroup;
            const sectionLabel = document.getElementById('sectionLabel');
            if (sectionLabel) {
                sectionLabel.textContent = sectionGroup;
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
        if (totalQuestions) totalQuestions.textContent = this.activeQuestions.length;
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
            button.setAttribute('role', 'radio');
            button.setAttribute('aria-checked', this.answers[this.currentQuestionIndex] === index ? 'true' : 'false');
            button.setAttribute('tabindex', index === 0 ? '0' : '-1');

            if (this.answers[this.currentQuestionIndex] === index) {
                button.classList.add('selected');
            }

            button.addEventListener('click', () => this.selectOption(index));
            // Arrow-key navigation between options, matching native radiogroup behaviour
            button.addEventListener('keydown', (e) => {
                const buttons = Array.from(container.querySelectorAll('.option-btn'));
                const currentIdx = buttons.indexOf(e.target);
                if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
                    e.preventDefault();
                    const next = buttons[(currentIdx + 1) % buttons.length];
                    next.setAttribute('tabindex', '0');
                    e.target.setAttribute('tabindex', '-1');
                    next.focus();
                } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
                    e.preventDefault();
                    const prev = buttons[(currentIdx - 1 + buttons.length) % buttons.length];
                    prev.setAttribute('tabindex', '0');
                    e.target.setAttribute('tabindex', '-1');
                    prev.focus();
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.selectOption(index);
                }
            });
            container.appendChild(button);
        });

        // Show intensity slider only after a statement has been picked for this question
        if (this.answers[this.currentQuestionIndex] !== undefined) {
            this.renderIntensitySlider(container);
        }
    }

    renderIntensitySlider(container) {
        const currentIntensity = this.intensities[this.currentQuestionIndex] ?? DEFAULT_INTENSITY_INDEX;

        const wrapper = document.createElement('div');
        wrapper.className = 'intensity-slider-wrapper';
        wrapper.innerHTML = `
            <p class="intensity-label" id="intensityLabel">How strongly do you hold this view?</p>
            <input type="range" id="intensitySlider" class="intensity-slider"
                   min="0" max="4" step="1" value="${currentIntensity}"
                   role="slider" aria-labelledby="intensityLabel"
                   aria-valuemin="0" aria-valuemax="4" aria-valuenow="${currentIntensity}"
                   aria-valuetext="${INTENSITY_LEVELS[currentIntensity].label}">
            <div class="intensity-ticks" aria-hidden="true">
                ${INTENSITY_LEVELS.map((lvl, i) =>
                    `<span class="intensity-tick${i === currentIntensity ? ' active' : ''}">${lvl.label}</span>`
                ).join('')}
            </div>
        `;
        container.appendChild(wrapper);

        const slider = wrapper.querySelector('#intensitySlider');
        slider.addEventListener('input', (e) => this.setIntensity(parseInt(e.target.value, 10)));
    }

    setIntensity(intensityIndex) {
        const qIdx = this.currentQuestionIndex;
        const optionIdx = this.answers[qIdx];
        if (optionIdx === undefined) return;

        const question = this.activeQuestions[qIdx];
        const option = question.options[optionIdx];
        const oldIntensity = this.intensities[qIdx] ?? DEFAULT_INTENSITY_INDEX;
        const oldMultiplier = INTENSITY_LEVELS[oldIntensity].multiplier;
        const newMultiplier = INTENSITY_LEVELS[intensityIndex].multiplier;

        // Remove old weighted score, apply new weighted score
        for (let i = 0; i < 4; i++) {
            this.scores[i] -= option.score[i] * oldMultiplier;
            this.scores[i] += option.score[i] * newMultiplier;
        }

        this.intensities[qIdx] = intensityIndex;

        // Update tick highlighting and ARIA slider state without a full re-render
        document.querySelectorAll('.intensity-tick').forEach((tick, i) => {
            tick.classList.toggle('active', i === intensityIndex);
        });
        const sliderEl = document.getElementById('intensitySlider');
        if (sliderEl) {
            sliderEl.setAttribute('aria-valuenow', intensityIndex);
            sliderEl.setAttribute('aria-valuetext', INTENSITY_LEVELS[intensityIndex].label);
        }

        this.saveProgress();
    }

    selectOption(optionIndex) {
        const question = this.activeQuestions[this.currentQuestionIndex];
        const option = question.options[optionIndex];

        // If answer is already set, undo previous score (using its stored intensity)
        if (this.answers[this.currentQuestionIndex] !== undefined) {
            const previousOption = question.options[this.answers[this.currentQuestionIndex]];
            const previousIntensity = this.intensities[this.currentQuestionIndex] ?? DEFAULT_INTENSITY_INDEX;
            const previousMultiplier = INTENSITY_LEVELS[previousIntensity].multiplier;
            for (let i = 0; i < 4; i++) {
                this.scores[i] -= previousOption.score[i] * previousMultiplier;
            }
        }

        // Set new answer with default intensity ("Strongly" = 1.0x, preserves prior scoring behaviour)
        this.answers[this.currentQuestionIndex] = optionIndex;
        this.intensities[this.currentQuestionIndex] = DEFAULT_INTENSITY_INDEX;
        const defaultMultiplier = INTENSITY_LEVELS[DEFAULT_INTENSITY_INDEX].multiplier;

        for (let i = 0; i < 4; i++) {
            this.scores[i] += option.score[i] * defaultMultiplier;
        }

        const buttons = document.querySelectorAll('.option-btn');
        buttons.forEach((btn, idx) => {
            btn.classList.toggle('selected', idx === optionIndex);
        });

        // Re-render options to reveal the intensity slider beneath the chosen statement
        this.renderOptions(question);

        document.getElementById('nextBtn').disabled = false;
        this.saveProgress();
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.activeQuestions.length - 1) {
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

        const progress = ((this.currentQuestionIndex + 1) / this.activeQuestions.length) * 100;
        progressFill.style.width = progress + '%';

        const progressBarOuter = document.getElementById('progressBarOuter');
        if (progressBarOuter) {
            progressBarOuter.setAttribute('aria-valuenow', Math.round(progress));
            progressBarOuter.setAttribute('aria-valuetext',
                `Question ${this.currentQuestionIndex + 1} of ${this.activeQuestions.length}`);
        }
    }

    showResults() {
        document.getElementById('quizScreen').style.display = 'none';
        document.getElementById('resultsScreen').style.display = 'block';
        
        // CLEAR previous results to prevent duplication
        const container = document.getElementById('results-content');
        container.innerHTML = '';
        
        // NORMALIZATION: compute max possible per axis from answered questions.
        // Each option scores 0.0–2.0 per axis, further scaled by intensity multiplier (0.55–1.15).
        // Max possible = sum of (max raw score × max intensity multiplier) across answered questions.
        // This ensures 0% = most left/prog/lib/global, 100% = most right/trad/order/nat,
        // even when users pick "Completely" (1.15x) on their most extreme answers.
        const maxIntensityMultiplier = Math.max(...INTENSITY_LEVELS.map(l => l.multiplier));
        const axisMax = [0, 0, 0, 0];
        this.activeQuestions.forEach((question, qIdx) => {
            if (this.answers[qIdx] !== undefined) {
                for (let axis = 0; axis < 4; axis++) {
                    const maxForQ = Math.max(...question.options.map(o => o.score[axis]));
                    axisMax[axis] += maxForQ * maxIntensityMultiplier;
                }
            }
        });
        const normalize = (score, max) => max > 0 ? Math.round(Math.min(100, Math.max(0, (score / max) * 100))) : 50;
        const econ = normalize(this.scores[0], axisMax[0]);
        const prog = normalize(this.scores[1], axisMax[1]);
        const auth = normalize(this.scores[2], axisMax[2]);
        const nat  = normalize(this.scores[3], axisMax[3]);

        this.renderAxisResults(econ, prog, auth, nat);
        this.renderPartyAlignment(econ, prog, auth, nat);
        this.renderRadarChart(econ, prog, auth, nat);
        this.renderIssueAnalysis();
        this.renderFactionAnalysis(econ, prog, auth, nat);
        this.renderEnhancedContradictions();

        // Confidence = average intensity multiplier across answered questions, normalized.
        // Low confidence (lots of "Slightly"/"Somewhat" picks) signals a less decisive
        // respondent; high confidence signals strongly-held, consistent positions.
        const answeredIntensities = this.intensities.filter(i => i !== undefined);
        const avgMultiplier = answeredIntensities.length > 0
            ? answeredIntensities.reduce((sum, i) => sum + INTENSITY_LEVELS[i].multiplier, 0) / answeredIntensities.length
            : INTENSITY_LEVELS[DEFAULT_INTENSITY_INDEX].multiplier;
        const minMult = Math.min(...INTENSITY_LEVELS.map(l => l.multiplier));
        const maxMult = Math.max(...INTENSITY_LEVELS.map(l => l.multiplier));
        const confidence = Math.round(((avgMultiplier - minMult) / (maxMult - minMult)) * 100);

        // Save BEFORE trajectory and comparison so they read current result
        this.saveResults({
            econ, prog, auth, nat,
            scores: this.scores,
            answers: this.answers,
            intensities: this.intensities,
            confidence,
            timestamp: Date.now()
        });

        this.renderPoliticalTrajectory();
        this.showComparisonMode();

        // Move focus to the results region so screen-reader and keyboard users
        // are taken directly to the results instead of being left on the old quiz screen
        const resultsContainer = document.getElementById('results-content');
        if (resultsContainer) resultsContainer.focus();
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

        // Confidence indicator: reflects how strongly-held the user's answers were,
        // not how "correct" or precise the result is. Low confidence = lots of
        // "Slightly"/"Somewhat" picks; high confidence = consistently strong convictions.
        const answeredIntensities = this.intensities.filter(i => i !== undefined);
        const avgMultiplier = answeredIntensities.length > 0
            ? answeredIntensities.reduce((sum, i) => sum + INTENSITY_LEVELS[i].multiplier, 0) / answeredIntensities.length
            : INTENSITY_LEVELS[DEFAULT_INTENSITY_INDEX].multiplier;
        const minMult = Math.min(...INTENSITY_LEVELS.map(l => l.multiplier));
        const maxMult = Math.max(...INTENSITY_LEVELS.map(l => l.multiplier));
        const confidence = Math.round(((avgMultiplier - minMult) / (maxMult - minMult)) * 100);
        const confidenceLabel = confidence >= 70 ? 'High confidence' : confidence >= 40 ? 'Moderate confidence' : 'Low confidence';
        const confidenceNote = confidence >= 70
            ? 'You held your positions strongly and consistently.'
            : confidence >= 40
            ? 'Your positions were moderate — some convictions, some uncertainty.'
            : 'You leaned toward weaker convictions — your results may shift if you retake the test.';

        const section = document.createElement('div');
        section.className = 'results-section';
        section.innerHTML = `
            <h3>Your Scores</h3>
            <div class="confidence-badge confidence-${confidence >= 70 ? 'high' : confidence >= 40 ? 'medium' : 'low'}">
                <strong>${confidenceLabel} (${confidence}%)</strong>
                <p>${confidenceNote}</p>
            </div>
            ${axisHTML}
        `;
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
        if (!this.phaseData || !this.phaseData.factions) {
            return [{ name: 'Unknown', desc: 'Data not loaded.', match: 0 }];
        }

        // Compute each party's centroid as the mean of its factions' midpoints
        const partyScores = Object.entries(this.phaseData.factions).map(([partyId, party]) => {
            const centroids = party.factions.map(f => ({
                econ: (f.characteristics.economic[0] + f.characteristics.economic[1]) / 2,
                prog: (f.characteristics.progressive[0] + f.characteristics.progressive[1]) / 2,
                auth: (f.characteristics.authority[0] + f.characteristics.authority[1]) / 2,
                nat:  (f.characteristics.nationalism[0] + f.characteristics.nationalism[1]) / 2,
            }));
            const centroid = {
                econ: centroids.reduce((s, c) => s + c.econ, 0) / centroids.length,
                prog: centroids.reduce((s, c) => s + c.prog, 0) / centroids.length,
                auth: centroids.reduce((s, c) => s + c.auth, 0) / centroids.length,
                nat:  centroids.reduce((s, c) => s + c.nat, 0) / centroids.length,
            };

            // Average axis distance, scaled to 0–100% match
            const avgDiff = (
                Math.abs(econ - centroid.econ) +
                Math.abs(prog - centroid.prog) +
                Math.abs(auth - centroid.auth) +
                Math.abs(nat  - centroid.nat)
            ) / 4;
            const match = Math.max(0, Math.round(100 - avgDiff));

            const descs = {
                liberal:      'Centrist pragmatism — social investment, multilateralism, and managed markets.',
                ndp:          'Progressive left — universal programs, workers\' rights, and social justice.',
                conservative: 'Economic right — lower taxes, strong law and order, and Canadian sovereignty.',
            };

            return { name: party.name, desc: descs[partyId] || party.name, match };
        });

        return partyScores.sort((a, b) => b.match - a.match);
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
                // qIdx refers to the full questions array index.
                // Find its position in activeQuestions to check if it was answered.
                const activeIdx = this.activeQuestions.findIndex(q => q.id === this.questions[qIdx]?.id);
                if (activeIdx === -1 || this.answers[activeIdx] === undefined) return;

                const question = this.activeQuestions[activeIdx];
                const chosen = question.options[this.answers[activeIdx]];
                const intensityIdx = this.intensities[activeIdx] ?? DEFAULT_INTENSITY_INDEX;
                const intensityMultiplier = INTENSITY_LEVELS[intensityIdx].multiplier;
                const maxPerAxis = chosen.score.map((s, i) =>
                    Math.max(...question.options.map(o => o.score[i]))
                );
                const primaryAxis = maxPerAxis.indexOf(Math.max(...maxPerAxis));
                const maxPossible = maxPerAxis[primaryAxis];
                // Strength reflects both how extreme the chosen statement is AND
                // how strongly the user holds it (Likert intensity).
                const rawStrength = maxPossible > 0
                    ? (chosen.score[primaryAxis] / maxPossible) * 100
                    : 50;
                const strength = Math.min(100, rawStrength * intensityMultiplier);
                totalStrength += strength;
                count++;
            });
            
            scores[issue.id] = {
                strength: count > 0 ? Math.round(totalStrength / count) : 0,
                count: count,
                weight: issue.weight || 1.0
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
        
        const allScores = this.calculateFactionScores(econ, prog, auth, nat);
        const partyScores = allScores.filter(f => !f.isCoalition);
        const coalitionScores = allScores.filter(f => f.isCoalition).sort((a, b) => b.probability - a.probability);
        const topFaction = partyScores[0];
        
        let factionHTML = `
            <div class="faction-primary">
                <h4>${topFaction.faction.name}</h4>
                <p class="faction-party">Within: ${topFaction.party}</p>
                <p class="faction-prob">Alignment: ${topFaction.probability}%</p>
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
        
        partyScores.slice(1, 5).forEach(f => {
            factionHTML += `
                <div class="faction-alt">
                    <h5>${f.faction.name}</h5>
                    <p>${f.probability}% alignment</p>
                </div>
            `;
        });
        
        factionHTML += '</div>';

        // Coalition factions: only surface this section if the user has a meaningfully
        // strong match (≥55%) to one of the cross-cutting coalitions. These represent
        // axis combinations that break the "expected" party-line correlation — showing
        // a weak match would just be noise, since everyone scores SOMETHING here.
        const topCoalition = coalitionScores[0];
        if (topCoalition && topCoalition.probability >= 55) {
            factionHTML += `
                <div class="coalition-callout">
                    <h5>🔀 You may also belong to a cross-party coalition</h5>
                    <p class="coalition-intro">Some Canadians don't fit neatly into one party's internal factions —
                    their views combine in ways that cut across the usual left-right alignment.
                    Your answers show a strong match to:</p>
                    <div class="coalition-card">
                        <h4>${topCoalition.faction.name}</h4>
                        <p class="faction-prob">Alignment: ${topCoalition.probability}%</p>
                        <p class="faction-desc">${topCoalition.faction.description}</p>
                    </div>
                </div>
            `;
        }
        
        const factionSection = document.createElement('div');
        factionSection.className = 'results-section';
        factionSection.innerHTML = `<h3>Your Political Faction</h3>${factionHTML}`;
        container.appendChild(factionSection);
        
        // Render faction pie chart after main faction display (party factions only —
        // coalitions are a separate lens, not a competing slice of the same pie)
        this.renderFactionPieChart(partyScores);
    }

    // PHASE 3 TIER 2: FACTION PIE CHART
    renderFactionPieChart(factionScores) {
        const container = document.getElementById('results-content');
        if (!container) return;

        // Take only the top 5 factions, then normalize THEIR probabilities to sum to 100%.
        // No "Other Factions" catch-all slice — showing exactly 5 keeps the chart readable
        // and matches the "Other Possible Factions" list above it one-to-one.
        const topFactions = factionScores.slice(0, 5);
        const top5Total = topFactions.reduce((sum, f) => sum + f.probability, 0);
        const normalizedTop5 = topFactions.map(f => ({
            ...f,
            probability: top5Total > 0 ? Math.round((f.probability / top5Total) * 100) : 0
        }));

        let chartLabels = normalizedTop5.map(f => f.faction.name);
        let chartData = normalizedTop5.map(f => f.probability);
        let chartColors = [
            '#1976D2', '#D32F2F', '#388E3C', '#F57C00', '#7B1FA2'
        ];

        const pieSection = document.createElement('div');
        pieSection.className = 'results-section';
        pieSection.innerHTML = `
            <h3>Top 5 Faction Matches</h3>
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
                    // Use raw match score directly — normalization dilutes strong matches
                    // (85% match divided across 13 factions becomes ~9%, which reads as weak)
                    probability: Math.round(avgMatch),
                    matches: { econMatch, progMatch, authMatch, natMatch }
                });
            });
        });

        // Coalition factions: cross-cutting groups that don't map to a single party,
        // defined by axis combinations that violate the "expected" left/right correlation
        // (e.g. economically left but authority-leaning, or economically right but libertarian).
        // Scored the same way, but tagged separately so results can present them distinctly.
        if (this.phaseData.coalitionFactions) {
            this.phaseData.coalitionFactions.forEach(faction => {
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
                    party: 'Cross-Party Coalition',
                    faction: faction,
                    probability: Math.round(avgMatch),
                    matches: { econMatch, progMatch, authMatch, natMatch },
                    isCoalition: true
                });
            });
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
        const answers = this.answers;

        this.phaseData.contradictions.forEach(contradiction => {
            try {
                if (this._evalCondition(contradiction.condition, answers)) {
                    found.push({ contradiction, severity: contradiction.severity });
                }
            } catch (e) {
                console.error('Error evaluating contradiction:', contradiction.id, e);
            }
        });

        return found;
    }

    // Safe condition evaluator — no eval() or new Function().
    // Parses conditions of the form:
    //   answers[N] !== undefined && answers[N] OP VALUE && ...
    // where OP is one of: <=, >=, ===, !==, <, >
    _evalCondition(condition, answers) {
        // Split on && and evaluate each clause independently
        const clauses = condition.split('&&').map(s => s.trim());
        return clauses.every(clause => {
            // Match: answers[N] OP VALUE
            const m = clause.match(/^answers\[(\d+)\]\s*(===|!==|<=|>=|<|>)\s*(.+)$/);
            if (!m) return true; // unknown clause format — skip (don't falsely fail)
            const idx = parseInt(m[1], 10);
            const op  = m[2];
            const raw = m[3].trim();
            const rhs = raw === 'undefined' ? undefined : Number(raw);
            const lhs = answers[idx];
            switch (op) {
                case '===': return lhs === rhs;
                case '!==': return lhs !== rhs;
                case '<=':  return lhs !== undefined && lhs <= rhs;
                case '>=':  return lhs !== undefined && lhs >= rhs;
                case '<':   return lhs !== undefined && lhs <  rhs;
                case '>':   return lhs !== undefined && lhs >  rhs;
                default:    return true;
            }
        });
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
        // Estimated national averages derived from 2021/2025 federal election vote shares
        // and Environics/Leger polling on policy positions. Not from quiz data (no server).
        // Liberal ~33% + NDP ~18% pull left on econ/prog; CPC ~34% pulls right.
        // Weighted centroid across party vote shares gives approximate population centre.
        const nationalAvg = { econ: 46, prog: 58, auth: 52, nat: 54 };

        const axisLabels = {
            econ: { label: 'Economic', left: 'Left', right: 'Right' },
            prog: { label: 'Progressive', left: 'Traditional', right: 'Progressive' },
            auth: { label: 'Authority', left: 'Civil Liberties', right: 'Law & Order' },
            nat:  { label: 'Nationalism', left: 'Globalist', right: 'Nationalist' },
        };

        const rows = Object.entries(axisLabels).map(([key, meta]) => `
            <div class="comparison-item">
                <h4>${meta.label}</h4>
                <div class="score-comparison">
                    <div class="score-bar user">
                        <span>You: ${userScores[key]}%</span>
                        <div class="bar" style="width: ${userScores[key]}%"></div>
                    </div>
                    <div class="score-bar national">
                        <span>Est. National: ${nationalAvg[key]}%</span>
                        <div class="bar" style="width: ${nationalAvg[key]}%"></div>
                    </div>
                    <div class="axis-endpoints" style="display:flex;justify-content:space-between;font-size:11px;color:#888;margin-top:2px;">
                        <span>← ${meta.left}</span><span>${meta.right} →</span>
                    </div>
                </div>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="comparison-grid">${rows}</div>
            <p style="font-size:12px;color:#888;margin-top:16px;font-style:italic;">
                * National estimates are approximations derived from 2021–2025 federal election
                vote shares and published Environics/Leger polling. They are not collected from
                quiz responses — all data stays on your device.
            </p>
        `;
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
            this.intensities = [];
            this.currentSection = '';
            this.activeQuestions = this.questions; // reset to full mode default
            
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
        const toggle = document.getElementById('themeToggle');
        if (this.darkMode) {
            document.body.classList.add('dark-mode');
            toggle.textContent = '☀️';
            toggle.setAttribute('aria-pressed', 'true');
        } else {
            document.body.classList.remove('dark-mode');
            toggle.textContent = '🌙';
            toggle.setAttribute('aria-pressed', 'false');
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
        const resultsContent = document.getElementById('results-content');
        if (!resultsContent || resultsContent.innerHTML.trim() === '') {
            alert('No results to export. Complete the quiz first.');
            return;
        }

        if (typeof html2pdf === 'undefined') {
            alert('PDF export library not loaded. Try again in a moment.');
            return;
        }

        const opt = {
            margin: [10, 10, 10, 10],
            filename: `canadian-political-alignment-${Date.now()}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
        };

        // Clone results to avoid canvas serialization issues with Chart.js
        const clone = resultsContent.cloneNode(true);
        // Remove canvas elements (charts can't be cloned — they'll appear blank)
        clone.querySelectorAll('canvas').forEach(c => {
            const note = document.createElement('p');
            note.style.cssText = 'color:#888;font-style:italic;font-size:12px;';
            note.textContent = '[Chart available in browser version]';
            c.parentNode.replaceChild(note, c);
        });

        const wrapper = document.createElement('div');
        wrapper.style.cssText = 'font-family: Arial, sans-serif; padding: 20px;';
        const title = document.createElement('h1');
        title.textContent = 'Canadian Political Alignment Test — Results';
        title.style.cssText = 'font-size: 20px; margin-bottom: 16px; color: #1976D2;';
        wrapper.appendChild(title);
        wrapper.appendChild(clone);

        html2pdf().set(opt).from(wrapper).save();
    }

    shareURL() {
        const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
        if (results.length === 0) {
            alert('No results to share. Take the quiz first.');
            return;
        }

        const { econ, prog, auth, nat } = results[results.length - 1];
        const encoded = btoa(JSON.stringify({ econ, prog, auth, nat }));
        const shareUrl = `${window.location.origin}${window.location.pathname}?results=${encoded}`;

        openModal('', `
            <h3>Share Your Results</h3>
            <p style="color:#666;margin-bottom:12px;">Anyone with this link will see your scores on the compass.</p>
            <div style="display:flex;gap:8px;align-items:center;">
                <input type="text" value="${shareUrl}" readonly
                    style="flex:1;padding:10px;border:1px solid #ddd;border-radius:4px;font-size:13px;">
                <button onclick="copyToClipboard(this)"
                    style="padding:10px 16px;background:#1976D2;color:#fff;border:none;border-radius:4px;cursor:pointer;">
                    Copy Link
                </button>
            </div>
        `);
    }

    shareQR() {
        const results = JSON.parse(localStorage.getItem('quizResults') || '[]');
        if (results.length === 0) {
            alert('No results to share. Take the quiz first.');
            return;
        }

        const { econ, prog, auth, nat } = results[results.length - 1];
        const encoded = btoa(JSON.stringify({ econ, prog, auth, nat }));
        const shareUrl = `${window.location.origin}${window.location.pathname}?results=${encoded}`;

        openModal('', '<h3>Share via QR Code</h3><div id="qrcode" style="margin-top:16px;"></div>');

        if (typeof QRCode === 'undefined') {
            document.getElementById('shareContent').innerHTML +=
                '<p style="color:#e53935;">QR Code library not loaded. Try the Copy Link option instead.</p>';
            return;
        }

        new QRCode(document.getElementById('qrcode'), {
            text: shareUrl,
            width: 200,
            height: 200
        });
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

// ── Unified modal helpers ────────────────────────────────────────────────────
let _modalReturnFocusEl = null;

function openModal(bodyHTML, shareHTML) {
    _modalReturnFocusEl = document.activeElement;
    document.getElementById('modalBody').innerHTML   = bodyHTML  || '';
    document.getElementById('shareContent').innerHTML = shareHTML || '';
    const modal = document.getElementById('modal');
    modal.style.display = 'flex';

    // Move focus into the dialog so keyboard and screen-reader users land inside it
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.focus();

    document.addEventListener('keydown', _modalEscapeHandler);
}

function _modalEscapeHandler(e) {
    if (e.key === 'Escape') closeModal();
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
    document.getElementById('modalBody').innerHTML   = '';
    document.getElementById('shareContent').innerHTML = '';
    document.removeEventListener('keydown', _modalEscapeHandler);

    // Return focus to whatever triggered the modal, so keyboard users aren't stranded
    if (_modalReturnFocusEl && typeof _modalReturnFocusEl.focus === 'function') {
        _modalReturnFocusEl.focus();
    }
    _modalReturnFocusEl = null;
}

function copyToClipboard(button) {
    const input = button.previousElementSibling;
    input.select();
    document.execCommand('copy');
    button.textContent = 'Copied!';
    setTimeout(() => { button.textContent = 'Copy Link'; }, 2000);
}

function showAbout() {
    openModal(`
        <h2>About This Test</h2>
        <p>A research-based Canadian political alignment test mapping your positions across four axes: Economic, Progressive, Authority, and Nationalism.</p>
        <p>Questions are grounded in real Canadian policy debates and calibrated against character composites of known political figures (Trudeau, Singh, Harper, Poilievre, and others).</p>
        <p><strong>Version 3.0</strong> — Phase 3 rebuild with issue clustering, faction analysis, and contradiction detection.</p>
        <p>All data is stored locally on your device. Nothing is sent to any server.</p>
    `);
}

function showFAQ() {
    openModal(`
        <h2>Frequently Asked Questions</h2>
        <h3>How is this different from other political compasses?</h3>
        <p>Most quizzes use arbitrary scoring. This one is calibrated against research-based character composites of real political figures and grounded in actual Canadian policy positions.</p>
        <h3>What do the four axes mean?</h3>
        <p><strong>Economic:</strong> Left (public programs, redistribution) ↔ Right (markets, low taxes).<br>
        <strong>Progressive:</strong> Traditional (social conservatism) ↔ Progressive (social liberalism).<br>
        <strong>Authority:</strong> Civil libertarian (individual rights) ↔ Order (strong state).<br>
        <strong>Nationalism:</strong> Globalist (multilateralism) ↔ Nationalist (sovereignty-first).</p>
        <h3>Are my results private?</h3>
        <p>Yes. All data is stored locally in your browser. Nothing leaves your device.</p>
        <h3>What is Quick Mode?</h3>
        <p>Quick Mode runs every third question (~20 questions, ~10 minutes) and covers all four axes. Full Mode runs all 61 questions (~30 minutes) for a more precise result.</p>
    `);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new QuizApp();
});
