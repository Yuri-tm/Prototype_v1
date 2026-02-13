class TextViewer {
    constructor(containerId, mapper) {
        this.container = document.getElementById(containerId);
        this.mapper = mapper;
        this.init();
    }

    init() {
        this.render();
        this.attachEventListeners();
    }

    render() {
        const metadata = this.mapper.getMetadata();
        const segments = this.mapper.getSegments();

        this.container.innerHTML = `
      <div class="viewer-header">
        <h1>${metadata.title}</h1>
        <div class="language-labels">
          <div class="lang-label source-label">${metadata.sourceLanguage.toUpperCase()}</div>
          <div class="lang-label target-label">${metadata.targetLanguage.toUpperCase()}</div>
        </div>
      </div>
      
      <div class="viewer-content">
        <div class="text-panel source-panel" id="sourcePanel">
          ${this.renderPanel(segments, 'source')}
        </div>
        
        <div class="divider"></div>
        
        <div class="text-panel target-panel" id="targetPanel">
          ${this.renderPanel(segments, 'target')}
        </div>
      </div>
    `;
    }

    renderPanel(segments, language) {
        return segments.map(segment => {
            const lexemes = language === 'source' ? segment.source : segment.target;
            const lexemeHtml = lexemes.map(lexeme =>
                `<span class="lexeme" id="${lexeme.id}" data-text="${lexeme.text}">${lexeme.text}</span>`
            ).join(' ');

            return `<p class="segment" data-segment-id="${segment.id}">${lexemeHtml}.</p>`;
        }).join('\n');
    }

    attachEventListeners() {
        // Add click handlers to all lexemes
        const lexemes = this.container.querySelectorAll('.lexeme');

        lexemes.forEach(lexeme => {
            lexeme.addEventListener('click', (e) => {
                const lexemeId = e.target.id;
                const result = this.mapper.highlightAlignment(lexemeId);

                // Optional: Log for debugging
                console.log('Selected:', result.selected, 'Aligned:', result.aligned);

                // Scroll aligned text into view if needed
                this.scrollToAlignedText(result.aligned);
            });

            // Add hover effect
            lexeme.addEventListener('mouseenter', (e) => {
                e.target.classList.add('hover');
            });

            lexeme.addEventListener('mouseleave', (e) => {
                e.target.classList.remove('hover');
            });
        });

        // Optional: Click outside to clear highlights
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('lexeme')) {
                this.mapper.clearHighlights();
            }
        });
    }

    scrollToAlignedText(alignedIds) {
        if (alignedIds.length === 0) return;

        const firstAligned = document.getElementById(alignedIds[0]);
        if (firstAligned) {
            firstAligned.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }
    }
    showTooltip(lexemeId, event) {
        const phraseInfo = this.mapper.getPhraseInfo(lexemeId);

        if (phraseInfo && phraseInfo.isPhrasal) {
            const tooltip = document.createElement('div');
            tooltip.className = 'alignment-tooltip';
            tooltip.innerHTML = `
      <div><strong>Source:</strong> ${phraseInfo.sourcePhrase}</div>
      <div><strong>Target:</strong> ${phraseInfo.targetPhrase}</div>
    `;
            tooltip.style.position = 'absolute';
            tooltip.style.left = event.pageX + 'px';
            tooltip.style.top = (event.pageY - 60) + 'px';

            document.body.appendChild(tooltip);

            setTimeout(() => tooltip.remove(), 3000);
        }
    }
}