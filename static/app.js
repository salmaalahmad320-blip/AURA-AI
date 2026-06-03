'use strict';

// ── API contracts (must match main.py exactly) ──────────────────────────────
//
//  POST /transcribe   multipart file + ?language=  →  { transcript }
//  POST /summary      { text, language }           →  { summary, key_points[], important_concepts[] }
//  POST /quiz         { text }                     →  { questions: [{question, options[4], answer}] }
//  POST /chat         { question, lecture_text }   →  { response }
//  POST /translate    { text, target_language }    →  { translation }

class AuraApp {
    constructor() {
        this.lectureText  = '';   // source of truth for all cards + chat
        this.summaryData  = null; // original EN summary from /summary
        this.quizData     = [];   // questions array from /quiz
        this.summaryLang  = 'en'; // current display language of summary card
        this.activeTab    = 'upload';

        this._bindUI();
        this._initStartup();
    }

    // ── Startup ─────────────────────────────────────────────────────────────
    _initStartup() {
        const overlay = document.getElementById('startupOverlay');
        if (overlay) setTimeout(() => overlay.classList.add('hidden'), 2200);
    }

    // ── UI Binding ───────────────────────────────────────────────────────────
    _bindUI() {
        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn =>
            btn.addEventListener('click', () => this._switchTab(btn.dataset.tab))
        );

        // Upload zone — click & drag-drop
        const zone      = document.getElementById('uploadZone');
        const fileInput = document.getElementById('audioFile');

        zone.addEventListener('click', () => fileInput.click());

        zone.addEventListener('dragover', e => {
            e.preventDefault();
            zone.classList.add('dragover');
        });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', e => {
            e.preventDefault();
            zone.classList.remove('dragover');
            const file = e.dataTransfer.files[0];
            if (file) this._setFile(file, fileInput);
        });

        fileInput.addEventListener('change', () => {
            if (fileInput.files[0]) this._setFile(fileInput.files[0], fileInput);
        });

        document.getElementById('removeFileBtn')
            .addEventListener('click', () => this._clearFile(fileInput));

        // Paste textarea — enable button on input
        document.getElementById('pasteText')
            .addEventListener('input', () => this._syncProcessBtn());

        // Main action
        document.getElementById('processBtn')
            .addEventListener('click', () => this._processLecture());

        // Summary language toggle
        document.getElementById('toggleLangBtn')
            .addEventListener('click', () => this._toggleSummaryLang());

        // Chat
        document.getElementById('chatSendBtn')
            .addEventListener('click', () => this._sendChat());

        document.getElementById('chatInput')
            .addEventListener('keydown', e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this._sendChat();
                }
            });
    }

    // ── Tab switching ────────────────────────────────────────────────────────
    _switchTab(tab) {
        this.activeTab = tab;

        document.querySelectorAll('.tab-btn').forEach(b =>
            b.classList.toggle('active', b.dataset.tab === tab)
        );
        document.getElementById('tabUpload').classList.toggle('active', tab === 'upload');
        document.getElementById('tabPaste').classList.toggle('active',  tab === 'paste');

        this._syncProcessBtn();
    }

    // ── File handling ────────────────────────────────────────────────────────
    _setFile(file, inputEl) {
        // Update the real file input if dropped (DataTransfer)
        if (inputEl.files[0] !== file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            inputEl.files = dt.files;
        }
        document.getElementById('uploadZone').classList.add('hidden');
        document.getElementById('fileName').textContent = file.name;
        document.getElementById('fileInfo').classList.remove('hidden');
        this._syncProcessBtn();
    }

    _clearFile(inputEl) {
        inputEl.value = '';
        document.getElementById('fileInfo').classList.add('hidden');
        document.getElementById('uploadZone').classList.remove('hidden');
        this._syncProcessBtn();
    }

    _syncProcessBtn() {
        const btn = document.getElementById('processBtn');
        if (this.activeTab === 'upload') {
            btn.disabled = !document.getElementById('audioFile').files[0];
        } else {
            btn.disabled = !document.getElementById('pasteText').value.trim();
        }
    }

    // ── Main flow ────────────────────────────────────────────────────────────
    async _processLecture() {
        // Reset state
        this.lectureText = '';
        this.summaryData = null;
        this.quizData    = [];
        this.summaryLang = 'en';
        document.getElementById('toggleLangBtn').querySelector('span').textContent = 'اعرض بالعربي';

        this._hide('transcriptSection');
        this._hide('resultsSection');
        this._hide('chatSection');

        try {
            if (this.activeTab === 'upload') {
                // Step 1: transcribe
                this._showLoading('جاري التفريغ الصوتي…');
                await this._transcribe();
                this._renderTranscript();
            } else {
                // Direct text — no transcription needed
                this.lectureText = document.getElementById('pasteText').value.trim();
            }

            if (!this.lectureText) return;

            // Step 2: summary + quiz in parallel
            this._showLoading('جاري تحليل المحاضرة…');
            const [summaryResult, quizResult] = await Promise.allSettled([
                this._fetchSummary(),
                this._fetchQuiz(),
            ]);

            // Render whatever succeeded
            if (summaryResult.status === 'fulfilled') {
                this._renderSummary(summaryResult.value);
                this._renderConcepts(summaryResult.value);
            } else {
                this._renderError('summaryContent',  summaryResult.reason.message);
                this._renderError('conceptsContent', summaryResult.reason.message);
            }

            if (quizResult.status === 'fulfilled') {
                this._renderQuiz(quizResult.value);
            } else {
                this._renderError('quizContent', quizResult.reason.message);
            }

            this._show('resultsSection');
            this._show('chatSection');

        } catch (err) {
            this._showLoading('حدث خطأ: ' + err.message);
            setTimeout(() => this._hideLoading(), 3000);
            return;
        }

        this._hideLoading();
    }

    // ── /transcribe ──────────────────────────────────────────────────────────
    async _transcribe() {
        const file = document.getElementById('audioFile').files[0];
        const lang = encodeURIComponent(document.getElementById('speechLang').value);

        const body = new FormData();
        body.append('file', file);   // key must be "file" — matches File(...) in main.py

        const res  = await fetch(`/transcribe?language=${lang}`, { method: 'POST', body });
        const data = await res.json();

        if (!res.ok) throw new Error(data.detail || 'فشل التفريغ الصوتي');
        this.lectureText = data.transcript;   // { transcript }
    }

    _renderTranscript() {
        const words = this.lectureText.trim().split(/\s+/).length;
        document.getElementById('transcriptText').textContent = this.lectureText;
        document.getElementById('transcriptWordCount').textContent = `${words.toLocaleString()} كلمة`;
        this._show('transcriptSection');
    }

    // ── /summary ─────────────────────────────────────────────────────────────
    async _fetchSummary() {
        const res = await fetch('/summary', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            // SummaryRequest: { text, language }
            body: JSON.stringify({ text: this.lectureText, language: 'en' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'فشل توليد الملخص');
        return data;  // { summary, key_points[], important_concepts[] }
    }

    _renderSummary(data) {
        this.summaryData = data;
        const kpHtml = (data.key_points || [])
            .map(p => `<li>${this._esc(p)}</li>`).join('');

        document.getElementById('summaryContent').innerHTML = `
            <p class="summary-text">${this._esc(data.summary || '')}</p>
            ${kpHtml ? `
                <p class="kp-label">النقاط الرئيسية</p>
                <ul class="kp-list">${kpHtml}</ul>` : ''}
        `;
    }

    _renderConcepts(data) {
        const concepts = data.important_concepts || [];
        document.getElementById('conceptsContent').innerHTML = concepts.length
            ? `<div class="concept-grid">
                ${concepts.map(c => `<span class="concept-tag">${this._esc(c)}</span>`).join('')}
               </div>`
            : `<p style="color:var(--text-muted);font-size:13px">لم يتم استخراج مفاهيم.</p>`;
    }

    // ── /quiz ─────────────────────────────────────────────────────────────────
    async _fetchQuiz() {
        const res = await fetch('/quiz', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            // TextRequest: { text }  ← NOT { message }
            body: JSON.stringify({ text: this.lectureText }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'فشل توليد الاختبار');
        return data.questions || [];   // questions[]
    }

    _renderQuiz(questions) {
        this.quizData = questions;

        if (!questions.length) {
            this._renderError('quizContent', 'لم يتم توليد أسئلة.');
            return;
        }

        const qHtml = questions.map((q, i) => `
            <div class="quiz-q" data-qi="${i}">
                <span class="quiz-q-num">السؤال ${i + 1} من ${questions.length}</span>
                <p class="quiz-q-text">${this._esc(q.question)}</p>
                <div class="quiz-options">
                    ${q.options.map((opt, j) => `
                        <label class="quiz-option">
                            <input type="radio" name="q${i}" value="${j}">
                            ${this._esc(opt)}
                        </label>
                    `).join('')}
                </div>
            </div>
        `).join('');

        document.getElementById('quizContent').innerHTML = `
            <div class="quiz-questions">${qHtml}</div>
            <button class="check-btn" id="checkAnswersBtn" type="button">
                <i class="fas fa-check-circle"></i> تحقق من الإجابات
            </button>
            <button class="regen-btn" id="regenQuizBtn" type="button">
                <i class="fas fa-rotate-right"></i> أسئلة جديدة
            </button>
        `;

        document.getElementById('checkAnswersBtn')
            .addEventListener('click', () => this._checkQuiz());
        document.getElementById('regenQuizBtn')
            .addEventListener('click', () => this._regenerateQuiz());
    }

    _checkQuiz() {
        let correct = 0;

        this.quizData.forEach((q, i) => {
            const chosen = document.querySelector(`input[name="q${i}"]:checked`);
            const labels = document.querySelectorAll(`[data-qi="${i}"] .quiz-option`);

            labels.forEach((lbl, j) => {
                lbl.classList.remove('correct', 'wrong');
                if (j === q.answer) {
                    lbl.classList.add('correct');
                }
                if (chosen && parseInt(chosen.value) === j && j !== q.answer) {
                    lbl.classList.add('wrong');
                }
            });

            if (chosen && parseInt(chosen.value) === q.answer) correct++;
        });

        const total = this.quizData.length;
        const pct   = Math.round((correct / total) * 100);

        document.getElementById('quizScore').textContent = `${correct} / ${total} صحيح`;

        // Remove previous result bar if exists
        document.querySelector('.quiz-result-bar')?.remove();

        const bar = document.createElement('div');
        bar.className = 'quiz-result-bar';
        bar.innerHTML = `
            <div class="score-circle">
                <span class="score-pct">${pct}%</span>
            </div>
            <div class="score-text">
                <p>أجبت بشكل صحيح على ${correct} من أصل ${total} أسئلة</p>
                <p>${pct >= 80 ? 'أداء ممتاز!' : pct >= 60 ? 'أداء جيد، راجع بعض النقاط.' : 'راجع المحاضرة مجدداً.'}</p>
            </div>
        `;
        document.getElementById('quizContent').appendChild(bar);

        document.getElementById('checkAnswersBtn').disabled = true;
    }

    // ── Quiz regeneration ─────────────────────────────────────────────────────
    async _regenerateQuiz() {
        // Inline loading inside the card — no full-screen overlay
        document.getElementById('quizContent').innerHTML = `
            <div class="quiz-loading">
                <div class="quiz-spinner"></div>
                <p>جاري توليد أسئلة جديدة…</p>
            </div>
        `;
        document.getElementById('quizScore').textContent = '';

        try {
            const questions = await this._fetchQuiz();
            this._renderQuiz(questions);
        } catch (err) {
            this._renderError('quizContent', 'فشل توليد الأسئلة: ' + err.message);
        }
    }

    // ── /translate (summary language toggle) ────────────────────────────────
    async _toggleSummaryLang() {
        if (!this.summaryData) return;

        const btn  = document.getElementById('toggleLangBtn');
        const span = btn.querySelector('span');
        btn.disabled = true;

        try {
            if (this.summaryLang === 'en') {
                // Build a readable block to translate: summary + key points
                const block = [
                    this.summaryData.summary,
                    ...(this.summaryData.key_points || []),
                ].filter(Boolean).join('\n\n');

                this._showLoading('جاري الترجمة…');

                const res = await fetch('/translate', {
                    method:  'POST',
                    headers: { 'Content-Type': 'application/json' },
                    // TranslateRequest: { text, target_language }
                    body: JSON.stringify({ text: block, target_language: 'Arabic' }),
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.detail || 'فشل الترجمة');

                document.getElementById('summaryContent').innerHTML =
                    `<p class="translated-text">${this._esc(data.translation)}</p>`;

                span.textContent = 'اعرض بالإنجليزي';
                this.summaryLang = 'ar';

            } else {
                // Restore original English rendering
                this._renderSummary(this.summaryData);
                span.textContent = 'اعرض بالعربي';
                this.summaryLang = 'en';
            }
        } catch (err) {
            this._renderError('summaryContent', 'فشلت الترجمة: ' + err.message);
        } finally {
            btn.disabled = false;
            this._hideLoading();
        }
    }

    // ── /chat ─────────────────────────────────────────────────────────────────
    async _sendChat() {
        const input    = document.getElementById('chatInput');
        const question = input.value.trim();
        if (!question || !this.lectureText) return;

        this._addBubble('user', question);
        input.value = '';

        const sendBtn = document.getElementById('chatSendBtn');
        sendBtn.disabled = true;

        try {
            const res = await fetch('/chat', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                // ChatRequest: { question, lecture_text }
                body: JSON.stringify({ question, lecture_text: this.lectureText }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || 'فشل');
            this._addBubble('ai', data.response);   // { response }
        } catch (err) {
            this._addBubble('ai', 'عذراً، حدث خطأ: ' + err.message);
        } finally {
            sendBtn.disabled = false;
            document.getElementById('chatInput').focus();
        }
    }

    _addBubble(type, text) {
        const box = document.getElementById('chatMessages');
        const div = document.createElement('div');
        div.className = `chat-bubble ${type === 'user' ? 'user-bubble' : 'ai-bubble'}`;
        div.innerHTML = `
            <div class="bubble-avatar">
                <i class="fas fa-${type === 'ai' ? 'robot' : 'user'}"></i>
            </div>
            <div class="bubble-text">${this._esc(text)}</div>
        `;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    _show(id) { document.getElementById(id).classList.remove('hidden'); }
    _hide(id) { document.getElementById(id).classList.add('hidden'); }

    _showLoading(msg = 'Processing…') {
        document.getElementById('loadingMsg').textContent = msg;
        document.getElementById('loadingOverlay').classList.remove('hidden');
    }
    _hideLoading() {
        document.getElementById('loadingOverlay').classList.add('hidden');
    }

    _renderError(containerId, msg) {
        document.getElementById(containerId).innerHTML = `
            <div class="error-msg">
                <i class="fas fa-triangle-exclamation"></i>
                ${this._esc(msg)}
            </div>`;
    }

    // Safe HTML escaping — prevents XSS from API responses
    _esc(str) {
        const d = document.createElement('div');
        d.textContent = String(str ?? '');
        return d.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => { new AuraApp(); });
