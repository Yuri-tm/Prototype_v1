import { BilingualTextMapper } from './BilingualTextMapper.js';

let mapper = null;
let ttsManager = null;
let pages = [];
let currentPageIndex = 0;
let isPageAnimating = false;
const MOBILE_BREAKPOINT = 768;

function isMobileView() {
    return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

function buildPages() {
    const segments = mapper.getSegments();
    if (!segments.length) return [];

    const contentWrap = document.querySelector('.viewer-content-wrap');
    const sourcePanel = document.getElementById('sourcePanel');
    if (!contentWrap || !sourcePanel) return [];

    const maxHeight = contentWrap.clientHeight;
    const halfHeight = (maxHeight - 2) / 2;
    const measureDiv = document.createElement('div');
    measureDiv.className = 'text-panel source-panel';
    measureDiv.style.cssText = 'position:absolute;left:-9999px;top:0;width:' + sourcePanel.offsetWidth + 'px;padding:16px;visibility:hidden;pointer-events:none;';
    measureDiv.style.fontSize = '18px';
    measureDiv.style.lineHeight = '1.85';
    document.body.appendChild(measureDiv);

    const pageList = [];
    let currentPage = [];
    let currentHeight = 0;

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];
        const p = document.createElement('p');
        p.className = 'segment';
        p.style.marginBottom = '16px';
        seg.source.forEach(lex => {
            const s = document.createElement('span');
            s.textContent = lex.text + ' ';
            p.appendChild(s);
        });
        measureDiv.appendChild(p);
        currentHeight = measureDiv.scrollHeight;

        if (currentPage.length > 0 && currentHeight > halfHeight) {
            measureDiv.removeChild(p);
            currentHeight = measureDiv.scrollHeight;
            pageList.push(currentPage.slice());
            currentPage = [];
            measureDiv.innerHTML = '';
            measureDiv.appendChild(p);
            currentHeight = measureDiv.scrollHeight;
        }
        currentPage.push(i);
    }

    document.body.removeChild(measureDiv);
    if (currentPage.length) pageList.push(currentPage);
    return pageList;
}

function getPageIndexForSegment(segmentIndex) {
    for (let p = 0; p < pages.length; p++) {
        if (pages[p].indexOf(segmentIndex) !== -1) return p;
    }
    return 0;
}

function goToPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    if (isMobileView()) {
        animatePageChange(pageIndex);
    } else {
        currentPageIndex = pageIndex;
        renderPage(pageIndex);
    }
}

function animatePageChange(newIndex) {
    if (newIndex === currentPageIndex) return;
    if (newIndex < 0 || newIndex >= pages.length) return;
    if (isPageAnimating) return;

    const viewerContent = document.getElementById('viewerContent');
    if (!viewerContent) {
        currentPageIndex = newIndex;
        renderPage(newIndex);
        return;
    }

    isPageAnimating = true;
    const direction = newIndex > currentPageIndex ? -1 : 1;

    viewerContent.style.transform = 'translateX(0)';

    requestAnimationFrame(() => {
        viewerContent.style.transform = `translateX(${direction * 100}%)`;
    });

    const onTransitionEnd = (event) => {
        if (event.target !== viewerContent || event.propertyName !== 'transform') return;

        viewerContent.removeEventListener('transitionend', onTransitionEnd);

        const enterFrom = -direction * 100;

        viewerContent.style.transition = 'none';
        viewerContent.style.transform = `translateX(${enterFrom}%)`;

        currentPageIndex = newIndex;
        renderPage(newIndex);

        // Force reflow so that the browser applies the transform before re-enabling transition
        void viewerContent.offsetWidth;

        viewerContent.style.transition = '';
        viewerContent.style.transform = 'translateX(0)';

        isPageAnimating = false;
    };

    viewerContent.addEventListener('transitionend', onTransitionEnd);
}

function renderPage(pageIndex) {
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    const segmentIndices = pages[pageIndex];
    const segments = mapper.getSegments();
    const sourcePanel = document.getElementById('sourcePanel');
    const targetPanel = document.getElementById('targetPanel');
    sourcePanel.innerHTML = '';
    targetPanel.innerHTML = '';

    segmentIndices.forEach(idx => {
        const segment = segments[idx];
        const sourcePara = document.createElement('p');
        sourcePara.className = 'segment';
        segment.source.forEach(lexeme => {
            const span = createLexemeElement(lexeme);
            sourcePara.appendChild(span);
            sourcePara.appendChild(document.createTextNode(' '));
        });
        sourcePanel.appendChild(sourcePara);

        const targetPara = document.createElement('p');
        targetPara.className = 'segment';
        segment.target.forEach(lexeme => {
            const span = createLexemeElement(lexeme);
            targetPara.appendChild(span);
            targetPara.appendChild(document.createTextNode(' '));
        });
        targetPanel.appendChild(targetPara);
    });

    attachClickHandlers();
}

// Demo data
const demoData = {
    "metadata": {
        "sourceLanguage": "en",
        "targetLanguage": "es",
        "title": "The Little Prince - Demo",
        "author": "Antoine de Saint-Exupéry"
    },
    "segments": [
        {
            "id": "seg_1",
            "source": [
                { "id": "s1_0", "text": "Once", "alignments": ["t1_0"] },
                { "id": "s1_1", "text": "upon", "alignments": ["t1_1"] },
                { "id": "s1_2", "text": "a", "alignments": [] },
                { "id": "s1_3", "text": "time", "alignments": ["t1_1"] },
                { "id": "s1_4", "text": "I", "alignments": ["t1_2"] },
                { "id": "s1_5", "text": "was", "alignments": ["t1_3"] },
                { "id": "s1_6", "text": "six", "alignments": ["t1_4"] },
                { "id": "s1_7", "text": "years", "alignments": ["t1_5"] },
                { "id": "s1_8", "text": "old", "alignments": [] }
            ],
            "target": [
                { "id": "t1_0", "text": "Una", "alignments": ["s1_0"] },
                { "id": "t1_1", "text": "vez", "alignments": ["s1_1", "s1_3"] },
                { "id": "t1_2", "text": "yo", "alignments": ["s1_4"] },
                { "id": "t1_3", "text": "tenía", "alignments": ["s1_5"] },
                { "id": "t1_4", "text": "seis", "alignments": ["s1_6"] },
                { "id": "t1_5", "text": "años", "alignments": ["s1_7"] }
            ]
        },
        {
            "id": "seg_2",
            "source": [
                { "id": "s2_0", "text": "I", "alignments": ["t2_0"] },
                { "id": "s2_1", "text": "saw", "alignments": ["t2_0"] },
                { "id": "s2_2", "text": "a", "alignments": ["t2_1"] },
                { "id": "s2_3", "text": "magnificent", "alignments": ["t2_2"] },
                { "id": "s2_4", "text": "picture", "alignments": ["t2_3"] }
            ],
            "target": [
                { "id": "t2_0", "text": "Vi", "alignments": ["s2_0", "s2_1"] },
                { "id": "t2_1", "text": "una", "alignments": ["s2_2"] },
                { "id": "t2_2", "text": "magnífica", "alignments": ["s2_3"] },
                { "id": "t2_3", "text": "ilustración", "alignments": ["s2_4"] }
            ]
        }
    ]
};

// Language code mapping for TTS
const LANGUAGE_CODES = {
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR',
    'de': 'de-DE',
    'it': 'it-IT',
    'pt': 'pt-PT',
    'ru': 'ru-RU',
    'zh': 'zh-CN',
    'ja': 'ja-JP',
    'ko': 'ko-KR',
    'ar': 'ar-SA',
    'hi': 'hi-IN'
};

// TTS Manager Class - Reads SOURCE language only
class TTSManager {
    constructor(data, options = {}) {
        this.data = data;
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSegmentIndex = 0;
        this.voices = [];
        this.selectedVoice = null;
        this.selectedVoiceName = null;
        this.rate = 1.0;
        this.pitch = 1.0;
        this.sourceLanguage = data.metadata.sourceLanguage || 'en';
        this.sourceLangCode = LANGUAGE_CODES[this.sourceLanguage] || 'en-US';
        this.goToPage = options.goToPage || (() => { });
        this.getPageIndexForSegment = options.getPageIndexForSegment || (() => 0);

        this.initVoices();
        this.setupControls();
    }

    initVoices() {
        if ('speechSynthesis' in window) {
            // Load voices
            const loadVoices = () => {
                this.voices = speechSynthesis.getVoices();
                this.populateVoiceList();
            };

            loadVoices();

            // Chrome loads voices asynchronously
            if (speechSynthesis.onvoiceschanged !== undefined) {
                speechSynthesis.onvoiceschanged = loadVoices;
            }
        } else {
            console.warn('Browser does not support Web Speech API');
            alert('Your browser does not support text-to-speech. Please use Chrome, Edge, or Safari.');
        }
    }

    populateVoiceList() {
        const voiceSelect = document.getElementById('voiceSelect');
        voiceSelect.innerHTML = '';

        const previousName = this.selectedVoice ? this.selectedVoice.name : this.selectedVoiceName;

        // Filter voices for SOURCE language only
        const languageVoices = this.voices.filter(voice =>
            voice.lang.startsWith(this.sourceLanguage) ||
            voice.lang.startsWith(this.sourceLangCode)
        );

        if (languageVoices.length === 0) {
            // Fallback: try to find any English voice if source is English
            const fallbackVoices = this.voices.filter(v => v.lang.startsWith('en'));
            languageVoices.push(...fallbackVoices);
        }

        let matchedVoice = null;

        languageVoices.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            if (voice.name === previousName) {
                option.selected = true;
                matchedVoice = voice;
            } else if (!previousName && voice.default) {
                option.selected = true;
                matchedVoice = voice;
            }
            voiceSelect.appendChild(option);
        });

        if (languageVoices.length > 0) {
            if (matchedVoice) {
                this.selectedVoice = matchedVoice;
            } else {
                this.selectedVoice = languageVoices[0] || this.voices[0] || null;
            }
            console.log(`TTS initialized for ${this.sourceLanguage.toUpperCase()} with ${languageVoices.length} voice(s)`);
        } else {
            console.warn(`No voices found for language: ${this.sourceLanguage}`);
            // Use first available voice as fallback
            this.selectedVoice = this.voices[0] || null;
        }

        this.selectedVoiceName = this.selectedVoice ? this.selectedVoice.name : null;
    }

    setupControls() {
        const playPauseBtn = document.getElementById('ttsPlayPause');
        const playPauseMobile = document.getElementById('ttsPlayPauseMobile');
        const settingsBtn = document.getElementById('ttsSettings');
        const settingsMobile = document.getElementById('ttsSettingsMobile');

        const togglePlay = () => this.togglePlayPause();
        const toggleSettings = () => {
            const panel = document.getElementById('ttsSettingsPanel');
            panel.classList.toggle('visible');
        };

        if (playPauseBtn) playPauseBtn.addEventListener('click', togglePlay);
        if (playPauseMobile) playPauseMobile.addEventListener('click', togglePlay);
        if (settingsBtn) settingsBtn.addEventListener('click', toggleSettings);
        if (settingsMobile) settingsMobile.addEventListener('click', toggleSettings);

        // Voice selection
        document.getElementById('voiceSelect').addEventListener('change', (e) => {
            this.selectedVoice = this.voices.find(v => v.name === e.target.value);
            if (this.selectedVoice) {
                this.selectedVoiceName = this.selectedVoice.name;
                console.log('Voice changed to:', this.selectedVoice.name);
            } else {
                this.selectedVoiceName = null;
                console.log('Voice changed but matching voice not found.');
            }
        });

        // Speed control
        document.getElementById('speedRange').addEventListener('input', (e) => {
            this.rate = parseFloat(e.target.value);
            document.getElementById('speedValue').textContent = this.rate.toFixed(1) + 'x';
        });

        // Pitch control
        document.getElementById('pitchRange').addEventListener('input', (e) => {
            this.pitch = parseFloat(e.target.value);
            document.getElementById('pitchValue').textContent = this.pitch.toFixed(1);
        });
    }

    togglePlayPause() {
        if (this.isPlaying) {
            this.pause();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.updatePlayButton(true);

        // Add visual indicator to source language label
        document.getElementById('sourceLangLabel').classList.add('reading');

        if (this.isPaused) {
            this.isPaused = false;
            speechSynthesis.resume();
        } else {
            this.speakSourceText();
        }
    }

    pause() {
        this.isPlaying = false;
        this.isPaused = true;
        this.updatePlayButton(false);
        document.getElementById('sourceLangLabel').classList.remove('reading');
        speechSynthesis.pause();
    }

    stop() {
        this.isPlaying = false;
        this.isPaused = false;
        this.currentSegmentIndex = 0;
        this.updatePlayButton(false);
        this.clearHighlights();
        document.getElementById('sourceLangLabel').classList.remove('reading');
        speechSynthesis.cancel();
    }

    async speakSourceText() {
        const segments = this.data.segments;

        for (let i = this.currentSegmentIndex; i < segments.length; i++) {
            if (!this.isPlaying) break;

            this.currentSegmentIndex = i;
            const pageIndex = this.getPageIndexForSegment(i);
            this.goToPage(pageIndex);
            const segment = segments[i];
            const sourceWords = segment.source;

            // Collect SOURCE text for the segment
            const segmentText = sourceWords.map(w => w.text).join(' ');

            await this.speakWithWebAPI(segmentText, sourceWords);

            // Small pause between segments
            if (this.isPlaying) {
                await this.sleep(300);
            }
        }

        // Finished speaking all segments
        this.stop();
    }

    speakWithWebAPI(text, words) {
        return new Promise((resolve) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.voice = this.selectedVoice;
            utterance.rate = this.rate;
            utterance.pitch = this.pitch;
            utterance.lang = this.sourceLangCode;

            let wordIndex = 0;
            let highlightTimeout = null;

            // Estimate word duration based on text length and speech rate
            const wordArray = words.filter(w => w && w.text);
            const estimatedWordDuration = Math.max(200, 60000 / (this.rate * 150));

            // Try to use onboundary for better accuracy (desktop browsers)
            let boundarySupported = false;

            utterance.onboundary = (event) => {
                if (event.name === 'word') {
                    boundarySupported = true;
                    // Clear previous highlight
                    this.clearHighlights();

                    // Highlight current word
                    if (wordIndex < wordArray.length) {
                        const currentWord = wordArray[wordIndex];
                        this.highlightWord(currentWord.id);

                        // Also highlight aligned target words
                        if (currentWord.alignments && currentWord.alignments.length > 0) {
                            currentWord.alignments.forEach(targetId => {
                                const targetElement = document.getElementById(targetId);
                                if (targetElement) {
                                    targetElement.classList.add('highlighted');
                                }
                            });
                        }

                        wordIndex++;
                    }
                }
            };

            // Fallback: Use timer-based highlighting for better mobile compatibility
            utterance.onstart = () => {
                // Start fallback timer immediately - if onboundary works, it will take over
                const highlightNextWord = () => {
                    if (!this.isPlaying) return;

                    // Only use fallback if boundary events aren't being triggered
                    if (!boundarySupported && wordIndex < wordArray.length) {
                        this.clearHighlights();
                        const currentWord = wordArray[wordIndex];
                        this.highlightWord(currentWord.id);

                        // Also highlight aligned target words
                        if (currentWord.alignments && currentWord.alignments.length > 0) {
                            currentWord.alignments.forEach(targetId => {
                                const targetElement = document.getElementById(targetId);
                                if (targetElement) {
                                    targetElement.classList.add('highlighted');
                                }
                            });
                        }

                        wordIndex++;
                        highlightTimeout = setTimeout(highlightNextWord, estimatedWordDuration);
                    } else if (boundarySupported) {
                        // Boundary events are working, clear the fallback timer
                        return;
                    }
                };
                highlightTimeout = setTimeout(highlightNextWord, estimatedWordDuration);
            };

            utterance.onend = () => {
                if (highlightTimeout) clearTimeout(highlightTimeout);
                this.clearHighlights();
                resolve();
            };

            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                if (highlightTimeout) clearTimeout(highlightTimeout);
                this.clearHighlights();
                resolve();
            };

            speechSynthesis.speak(utterance);
        });
    }

    highlightWord(wordId) {
        const wordElement = document.getElementById(wordId);
        if (wordElement) {
            wordElement.classList.add('speaking');

            // Scroll into view - mobile-safe approach
            try {
                if (isMobileView()) {
                    // Mobile: use simple scroll without smooth animation
                    wordElement.scrollIntoView({
                        block: 'nearest',
                        inline: 'nearest'
                    });
                } else {
                    // Desktop: use smooth scrolling
                    wordElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'center',
                        inline: 'nearest'
                    });
                }
            } catch (e) {
                // Fallback for browsers that don't support scrollIntoView options
                wordElement.scrollIntoView();
            }
        }
    }

    clearHighlights() {
        document.querySelectorAll('.speaking, .highlighted, .selected').forEach(el => {
            el.classList.remove('speaking', 'highlighted', 'selected');
        });
    }

    updatePlayButton(playing) {
        const set = (btnId, iconId, textId) => {
            const button = document.getElementById(btnId);
            const icon = document.getElementById(iconId);
            const text = document.getElementById(textId);
            if (button) button.classList.toggle('playing', playing);
            if (icon) icon.textContent = playing ? '⏸️' : '▶️';
            if (text) text.textContent = playing ? 'Pause' : 'Play';
        };
        set('ttsPlayPause', 'ttsIcon', 'ttsText');
        set('ttsPlayPauseMobile', 'ttsIconMobile', 'ttsTextMobile');
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

function ensurePagesForAllSegments() {
    if (pages && pages.length) return;
    const segments = mapper.getSegments();
    if (!segments || !segments.length) return;
    pages = [segments.map((_, idx) => idx)];
}

function setupResponsiveLayout() {
    const sourcePanel = document.getElementById('sourcePanel');
    const targetPanel = document.getElementById('targetPanel');
    if (!sourcePanel || !targetPanel || !mapper) return;

    sourcePanel.innerHTML = '';
    targetPanel.innerHTML = '';

    if (isMobileView()) {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                pages = buildPages();
                if (!pages.length) {
                    // Гарантируем хотя бы одну страницу даже при сбое измерения
                    ensurePagesForAllSegments();
                }
                if (pages.length) {
                    currentPageIndex = 0;
                    renderPage(0);
                    attachSwipeListeners();
                }
            });
        });
    } else {
        pages = [];
        currentPageIndex = 0;
        renderContent();
    }
}

// Initialize viewer with data
function initializeViewer(data) {
    try {
        if (!data.metadata || !data.segments) {
            throw new Error('Invalid JSON structure. Must contain "metadata" and "segments".');
        }

        const title = data.metadata.title || 'Bilingual Text Alignment';
        const sourceLang = (data.metadata.sourceLanguage || 'SOURCE').toUpperCase();
        const targetLang = (data.metadata.targetLanguage || 'TARGET').toUpperCase();

        document.getElementById('viewerTitle').textContent = title;
        document.getElementById('sourceLangLabel').innerHTML = `${sourceLang} 🔊`;
        document.getElementById('targetLangLabel').textContent = targetLang;

        mapper = new BilingualTextMapper(data);

        document.getElementById('filePickerSection').classList.add('hidden');
        document.getElementById('viewerSection').style.display = 'block';

        setupResponsiveLayout();

        ttsManager = new TTSManager(data, {
            goToPage,
            getPageIndexForSegment
        });

        console.log(`✅ Viewer initialized: ${title}`);
        console.log(`📢 TTS will read: ${sourceLang}`);
    } catch (error) {
        showError(error.message);
        throw error;
    }
}

function renderContent() {
    const segments = mapper.getSegments();
    const sourcePanel = document.getElementById('sourcePanel');
    const targetPanel = document.getElementById('targetPanel');

    segments.forEach(segment => {
        const sourcePara = document.createElement('p');
        sourcePara.className = 'segment';
        segment.source.forEach(lexeme => {
            const span = createLexemeElement(lexeme);
            sourcePara.appendChild(span);
            sourcePara.appendChild(document.createTextNode(' '));
        });
        sourcePanel.appendChild(sourcePara);

        const targetPara = document.createElement('p');
        targetPara.className = 'segment';
        segment.target.forEach(lexeme => {
            const span = createLexemeElement(lexeme);
            targetPara.appendChild(span);
            targetPara.appendChild(document.createTextNode(' '));
        });
        targetPanel.appendChild(targetPara);
    });

    attachClickHandlers();
}

function createLexemeElement(lexeme) {
    const span = document.createElement('span');
    span.className = 'lexeme';
    span.id = lexeme.id;
    span.textContent = lexeme.text;
    return span;
}

let clickHandlersAttached = false;

function attachClickHandlers() {
    if (clickHandlersAttached) return;
    clickHandlersAttached = true;

    const viewerRoot = document.getElementById('viewerContent');
    if (!viewerRoot) return;

    viewerRoot.addEventListener('click', (e) => {
        const lexeme = e.target.closest('.lexeme');
        if (!lexeme) return;
        e.stopPropagation();
        mapper.highlightAlignment(lexeme.id);
    });

    viewerRoot.addEventListener('touchend', (e) => {
        const lexeme = e.target.closest('.lexeme');
        if (!lexeme) return;
        e.preventDefault();
        e.stopPropagation();
        mapper.highlightAlignment(lexeme.id);
    }, { passive: false });

    viewerRoot.addEventListener('mouseover', (e) => {
        if (isMobileView()) return;
        const lexeme = e.target.closest('.lexeme');
        if (lexeme && !lexeme.classList.contains('speaking')) {
            lexeme.style.background = '#ffd70020';
        }
    });

    viewerRoot.addEventListener('mouseout', (e) => {
        if (isMobileView()) return;
        const lexeme = e.target.closest('.lexeme');
        if (!lexeme) return;
        if (!lexeme.classList.contains('speaking') &&
            !lexeme.classList.contains('selected') &&
            !lexeme.classList.contains('highlighted')) {
            lexeme.style.background = '';
        }
    });

    const clearHighlightsIfOutside = (target) => {
        if (!target.closest('.lexeme') &&
            !target.closest('.tts-controls') &&
            !target.closest('.tts-settings') &&
            !target.closest('.mobile-bottom-bar') &&
            !target.closest('input') &&
            !target.closest('select')) {
            if (mapper) mapper.clearHighlights();
        }
    };

    document.addEventListener('click', (e) => clearHighlightsIfOutside(e.target));
    document.addEventListener('touchend', (e) => clearHighlightsIfOutside(e.target), { passive: true });
}

const SWIPE_THRESHOLD_X = 60;
const SWIPE_THRESHOLD_Y = 30;

function attachSwipeListeners() {
    const el = document.getElementById('viewerContent');
    if (!el) return;
    let startX = 0, startY = 0;
    el.addEventListener('touchstart', (e) => {
        if (e.touches.length !== 1) return;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
    }, { passive: true });
    el.addEventListener('touchend', (e) => {
        if (e.changedTouches.length !== 1) return;
        const dx = e.changedTouches[0].clientX - startX;
        const dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > SWIPE_THRESHOLD_X && Math.abs(dy) < SWIPE_THRESHOLD_Y) {
            if (dx > 0) goToPage(currentPageIndex - 1);
            else goToPage(currentPageIndex + 1);
        }
    }, { passive: true });
}

// File input handler
document.getElementById('fileInputViewer').addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    document.getElementById('fileName').textContent = file.name;
    document.getElementById('selectedFileInfo').classList.add('visible');
    hideError();

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            initializeViewer(data);
        } catch (error) {
            showError(`Failed to parse JSON: ${error.message}`);
        }
    };

    reader.readAsText(file);
});

// Load demo button
document.getElementById('loadDemoBtn').addEventListener('click', (e) => {
    e.preventDefault();
    hideError();
    initializeViewer(demoData);
});

function showError(message) {
    document.getElementById('errorText').textContent = message;
    document.getElementById('errorMessage').classList.add('visible');
}

function hideError() {
    document.getElementById('errorMessage').classList.remove('visible');
}
