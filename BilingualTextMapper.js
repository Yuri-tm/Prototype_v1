class BilingualTextMapper {
    constructor(jsonData) {
        this.data = jsonData;
        this.alignmentMap = new Map();
        this.currentHighlights = new Set();
        this.buildAlignmentMap();
    }

    /**
     * Build a fast lookup map for all lexemes and their alignments
     */
    buildAlignmentMap() {
        this.data.segments.forEach(segment => {
            // Index source lexemes
            segment.source.forEach(lexeme => {
                this.alignmentMap.set(lexeme.id, {
                    text: lexeme.text,
                    language: 'source',
                    segmentId: segment.id,
                    alignments: lexeme.alignments || []
                });
            });

            // Index target lexemes
            segment.target.forEach(lexeme => {
                this.alignmentMap.set(lexeme.id, {
                    text: lexeme.text,
                    language: 'target',
                    segmentId: segment.id,
                    alignments: lexeme.alignments || []
                });
            });
        });
    }

    /**
     * Get all lexemes aligned to the given lexeme ID
     */
    getAlignedLexemes(lexemeId) {
        const lexeme = this.alignmentMap.get(lexemeId);
        if (!lexeme) return [];

        return lexeme.alignments.map(id => ({
            id,
            ...this.alignmentMap.get(id)
        }));
    }

    /**
     * Get metadata about the text
     */
    getMetadata() {
        return this.data.metadata;
    }

    /**
     * Get all segments for rendering
     */
    getSegments() {
        return this.data.segments;
    }

    /**
     * Clear all current highlights
     */
    clearHighlights() {
        this.currentHighlights.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.remove('highlighted', 'selected');
            }
        });
        this.currentHighlights.clear();
    }

    /**
     * Highlight a lexeme and its alignments
     */
    highlightAlignment(lexemeId) {
        // Clear previous highlights
        this.clearHighlights();

        // Highlight the selected lexeme
        const selectedElement = document.getElementById(lexemeId);
        if (selectedElement) {
            selectedElement.classList.add('selected');
            this.currentHighlights.add(lexemeId);
        }

        // Highlight aligned lexemes
        const aligned = this.getAlignedLexemes(lexemeId);
        aligned.forEach(lexeme => {
            const element = document.getElementById(lexeme.id);
            if (element) {
                element.classList.add('highlighted');
                this.currentHighlights.add(lexeme.id);
            }
        });

        return {
            selected: lexemeId,
            aligned: aligned.map(l => l.id)
        };
    }
    /**
 * Get phrase information for multi-word alignments
 */
    getPhraseInfo(lexemeId) {
        const lexeme = this.alignmentMap.get(lexemeId);
        if (!lexeme) return null;

        const alignedLexemes = this.getAlignedLexemes(lexemeId);

        // Check if this is part of a multi-word phrase
        const isPhrasal = alignedLexemes.length > 1 || lexeme.alignments.length > 1;

        if (isPhrasal) {
            const sourceWords = lexeme.language === 'source'
                ? [lexeme.text]
                : alignedLexemes.map(l => l.text);

            const targetWords = lexeme.language === 'target'
                ? [lexeme.text]
                : alignedLexemes.map(l => l.text);

            return {
                isPhrasal: true,
                sourcePhrase: sourceWords.join(' '),
                targetPhrase: targetWords.join(' ')
            };
        }

        return {
            isPhrasal: false,
            sourcePhrase: null,
            targetPhrase: null
        };
    }
}