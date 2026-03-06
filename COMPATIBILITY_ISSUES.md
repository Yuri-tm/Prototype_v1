# Mobile Chrome (Android) Compatibility Issues - Analysis & Fixes

## Issues Identified

### Issue 1: TTS Word Highlighting Not Working on Mobile
**Root Cause:** The `onboundary` event with 'word' boundary detection is unreliable or unsupported on Android Chrome v145.

**Affected Code:** `speakWithWebAPI()` method in index.html (~line 1020)

**Problems:**
- The `onboundary` event (used to detect when each word is spoken) may not fire on Android
- Without boundary events, `wordIndex` never increments, so highlighting may not work
- The word highlighting depends on accurate word boundary detection which varies by platform

**Evidence:**
```javascript
utterance.onboundary = (event) => {
    if (event.name === 'word') {  // ← May not fire on Android
        this.clearHighlights();
        // ... highlighting logic
        wordIndex++;  // ← This may never increment
    }
};
```

---

### Issue 2: Yellow Highlight Persists After Clicking (Mobile)
**Root Cause:** The click-outside-to-clear mechanism doesn't work reliably on Android Chrome due to touch vs click event differences.

**Affected Code:** `attachClickHandlers()` function (~line 1210) and `clearHighlights()` in BilingualTextMapper.js

**Problems:**
1. **Touch events don't trigger click events reliably:** Mobile browsers convert tap events to click events, but the bubbling and targeting may differ
2. **Event delegation fails on mobile:** The document click event handler checks for `.lexeme` class, but on mobile, the event handling is different
3. **No touch-specific clearing:** The code has no mechanism to clear highlights on mobile touch events
4. **Hover states persist:** Once `.selected` class is added with yellow background, there's no automatic removal on mobile

**Evidence:**
```javascript
// Desktop-only approach - doesn't work on mobile
document.addEventListener('click', (e) => {
    if (!e.target.classList.contains('lexeme')) {  // ← Event target might differ on mobile
        if (mapper) mapper.clearHighlights();
    }
});
```

---

### Issue 3: Hover Effects Don't Work on Mobile
**Affected Code:** Hover event listeners in `attachClickHandlers()` (~line 1205)

**Problems:**
- `mouseenter` and `mouseleave` events don't exist on touch devices
- The code tries to manage `.background` style inline, which is unreliable
- Mobile users cannot trigger hover states, leaving visual feedback inconsistent

---

### Issue 4: Scroll Into View May Fail on Mobile
**Affected Code:** `highlightWord()` and `speakWithWebAPI()` methods

**Problems:**
- The `scrollIntoView()` with `behavior: 'smooth'` and `block: 'center'` may cause layout thrashing on mobile
- The scroll behavior may not be supported on all Android Chrome versions
- Rapid scroll calls during word highlighting can freeze the UI

---

## Recommended Fixes

### Fix 1: Replace Boundary Events with Word Array Iteration
Instead of relying on `onboundary` events, manually iterate through words and use timing to sync highlighting with speech.

```javascript
async speakWithWebAPI(text, words) {
    return new Promise((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.selectedVoice;
        utterance.rate = this.rate;
        utterance.pitch = this.pitch;
        utterance.lang = this.sourceLangCode;

        const wordDuration = (text.split(/\s+/).length > 0) 
            ? (text.length * 60 / (this.rate * 10)) / text.split(/\s+/).length 
            : 500;

        let wordIndex = 0;

        // Use play event to sync timing
        utterance.onstart = () => {
            const highlightNext = () => {
                if (!this.isPlaying || wordIndex >= words.length) return;

                this.clearHighlights();
                const currentWord = words[wordIndex];
                this.highlightWord(currentWord.id);

                // Highlight aligned target words
                if (currentWord.alignments && currentWord.alignments.length > 0) {
                    currentWord.alignments.forEach(targetId => {
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                            targetElement.classList.add('highlighted');
                        }
                    });
                }

                wordIndex++;
                if (wordIndex < words.length) {
                    setTimeout(highlightNext, wordDuration * 1000);
                }
            };
            highlightNext();
        };

        utterance.onend = () => {
            this.clearHighlights();
            resolve();
        };

        utterance.onerror = (event) => {
            console.error('Speech synthesis error:', event);
            this.clearHighlights();
            resolve();
        };

        speechSynthesis.speak(utterance);
    });
}
```

---

### Fix 2: Add Touch Event Support for Clearing Highlights
Add explicit touch event handling to clear highlights on mobile.

```javascript
function attachClickHandlers() {
    const lexemes = document.querySelectorAll('.lexeme');

    lexemes.forEach(lexeme => {
        // CLICK - for desktop
        lexeme.addEventListener('click', (e) => {
            e.stopPropagation();
            mapper.highlightAlignment(e.target.id);
        });

        // TOUCH - for mobile (add this)
        lexeme.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            // Prevent default to avoid double-firing with click
            // mapper.highlightAlignment(e.target.id);
        }, { passive: true });

        lexeme.addEventListener('touchend', (e) => {
            e.stopPropagation();
            mapper.highlightAlignment(e.currentTarget.id);
        });

        // Hover effect (desktop only)
        lexeme.addEventListener('mouseenter', (e) => {
            if (!e.target.classList.contains('speaking')) {
                e.target.style.background = '#ffd70020';
            }
        });

        lexeme.addEventListener('mouseleave', (e) => {
            if (!e.target.classList.contains('speaking') &&
                !e.target.classList.contains('selected') &&
                !e.target.classList.contains('highlighted')) {
                e.target.style.background = '';
            }
        });
    });

    // DOCUMENT CLICK - clear highlights on desktop
    const clearOnDocumentClick = (e) => {
        if (!e.target.classList.contains('lexeme') &&
            !e.target.closest('.tts-controls') &&
            !e.target.closest('.tts-settings') &&
            !e.target.closest('.mobile-bottom-bar')) {
            if (mapper) mapper.clearHighlights();
        }
    };

    document.removeEventListener('click', clearOnDocumentClick);
    document.addEventListener('click', clearOnDocumentClick);

    // ADD TOUCH EVENT - clear highlights on mobile
    const clearOnDocumentTouch = (e) => {
        const target = e.target;
        if (!target.classList.contains('lexeme') &&
            !target.closest('.tts-controls') &&
            !target.closest('.tts-settings') &&
            !target.closest('.mobile-bottom-bar')) {
            if (mapper) mapper.clearHighlights();
        }
    };

    // Use a dedicated touch end listener that targets the document background
    document.addEventListener('touchend', clearOnDocumentTouch, { passive: true });
}
```

---

### Fix 3: Improve scrollIntoView for Mobile Compatibility
Use conservative scroll behavior that won't freeze on mobile.

```javascript
highlightWord(wordId) {
    const wordElement = document.getElementById(wordId);
    if (wordElement) {
        wordElement.classList.add('speaking');

        // Mobile-safe scroll: avoid smooth behavior and excessive centering
        if (isMobileView()) {
            // Simple scroll without smooth animation on mobile
            wordElement.scrollIntoView({
                block: 'nearest',
                inline: 'nearest'
            });
        } else {
            // Desktop can use smooth scrolling
            wordElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }
    }
}
```

---

### Fix 4: Add Mobile Detection and Conditional Hover Behavior
Prevent hover-like styling on mobile devices.

```javascript
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function attachClickHandlers() {
    const lexemes = document.querySelectorAll('.lexeme');
    const isMobile = isMobileDevice();

    lexemes.forEach(lexeme => {
        // ... click/touch handlers ...

        if (!isMobile) {
            // Only add hover effects on desktop
            lexeme.addEventListener('mouseenter', (e) => {
                if (!e.target.classList.contains('speaking')) {
                    e.target.style.background = '#ffd70020';
                }
            });

            lexeme.addEventListener('mouseleave', (e) => {
                if (!e.target.classList.contains('speaking') &&
                    !e.target.classList.contains('selected') &&
                    !e.target.classList.contains('highlighted')) {
                    e.target.style.background = '';
                }
            });
        }
    });
}
```

---

### Fix 5: Update CSS for Better Mobile Support
Add touch-friendly styling and reduce animation complexity on mobile.

```css
/* Mobile-specific styles */
@media (max-width: 768px) {
    .lexeme {
        padding: 8px 4px;
        min-height: 32px;
        /* Disable transform on mobile to prevent jank */
        transform: none !important;
    }

    .lexeme.selected {
        transform: none !important;
    }

    .lexeme.speaking {
        animation: mobile-speaking-pulse 0.3s infinite alternate;
    }

    @keyframes mobile-speaking-pulse {
        from {
            opacity: 1;
        }
        to {
            opacity: 0.9;
        }
    }
}
```

---

## Summary of Changes Needed

| Issue | File | Solution |
|-------|------|----------|
| onboundary unreliability | index.html | Use timer-based word highlighting instead |
| Yellow highlight persists | index.html | Add touchend event to clear highlights |
| Hover doesn't work | index.html | Detect mobile and skip hover setup |
| scrollIntoView janky | index.html | Use 'nearest' for mobile, 'smooth' for desktop |
| Animation performance | index.html (CSS) | Reduce animation complexity on mobile |

---

## Testing Recommendations

1. **Test on Chrome Android v145** with both source language playback and word highlighting
2. **Test touch interactions:** Tap on words, verify yellow highlighting, tap outside to clear
3. **Test TTS playback:** Play text and confirm words are highlighted as they're spoken
4. **Test page navigation:** Swipe between pages, verify highlights clear properly
5. **Test performance:** Monitor for UI lag during rapid highlighting (during fast TTS playback)
