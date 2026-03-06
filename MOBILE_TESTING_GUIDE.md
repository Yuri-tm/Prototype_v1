# Mobile Chrome (Android) Testing Guide

## Testing Environment
- **Device:** Android phone/tablet
- **Browser:** Chrome for Android, v145+
- **Network:** Both WiFi and cellular (for consistency)

---

## Test Cases

### Test 1: TTS Word Highlighting During Playback
**Objective:** Verify that each word is highlighted as it's spoken by the synthesizer

**Steps:**
1. Load the app with the demo data
2. Click the **Play** button on the mobile bottom bar
3. Watch the source language (English) text area
4. Observe as the TTS reads: "Once upon a time I was six years old..."

**Expected Behavior:**
- ✅ Each word should be highlighted with a **green background** (#48bb78) as it's spoken
- ✅ The highlighting should move from word to word smoothly
- ✅ The aligned target language words should also be highlighted in **blue** (#90cdf4)
- ✅ When speech finishes, all highlights should disappear

**Failure Indicators:**
- ❌ No highlighting appears while words are being spoken
- ❌ Highlighting is stuck on the first word
- ❌ Highlighting doesn't update or jumps erratically
- ❌ Aligned words in the other language don't highlight

**Troubleshooting:**
- If highlighting doesn't work, the fallback timer-based system should activate. The app will estimate word duration and highlight accordingly.
- Adjust speech rate in settings to test with different speeds

---

### Test 2: Yellow Highlight Persistence on Click
**Objective:** Verify that yellow highlighting from clicking a word disappears when tapping elsewhere

**Steps:**
1. On the source language text, tap any word (e.g., "time")
2. Observe the word and its aligned translations get highlighted
3. The selected word should have a **yellow background** (#ffd700)
4. Tap somewhere else in the text (not on another word)
5. Tap on the background area or divider between languages

**Expected Behavior:**
- ✅ When you tap a word, it gets yellow highlighting (#ffd700)
- ✅ Aligned words in the target language get blue highlighting (#90cdf4)
- ✅ When you tap outside any word, all highlights disappear
- ✅ The yellow highlighting should NOT persist after tapping elsewhere

**Failure Indicators:**
- ❌ Yellow highlighting remains visible even after tapping outside
- ❌ Highlights don't clear when you tap the background
- ❌ Tapping outside doesn't trigger the clear function

**Troubleshooting:**
- The app now uses both `click` and `touchend` events to detect when to clear highlights
- If highlights persist, try tapping on a different area (not just the text area)
- Check that you're tapping "outside" the lexeme span elements

---

### Test 3: Multiple Word Selection
**Objective:** Verify that highlighting works correctly when selecting different words

**Steps:**
1. Tap on the word "Once" - it should highlight with yellow and its aligned translations in blue
2. Tap on the word "upon" - previous highlights should clear, new word highlights with yellow
3. Tap on another language's word - that word and its alignments should highlight
4. Tap multiple times in sequence

**Expected Behavior:**
- ✅ Previous highlights are cleared before new ones are applied
- ✅ Each new word selection shows fresh highlighting
- ✅ No mixing or overlapping of old and new highlights
- ✅ The app remains responsive during rapid tapping

**Failure Indicators:**
- ❌ Old highlights overlap with new ones
- ❌ Some words remain yellow after selecting a new word
- ❌ App becomes unresponsive or freezes

---

### Test 4: Page Navigation and Highlighting
**Objective:** Verify that highlighting is cleared properly when changing pages (mobile view)

**Steps:**
1. In mobile view, tap a word to select it (it should be highlighted yellow)
2. Swipe left or right to change pages
3. Observe what happens to the previous page's highlighting

**Expected Behavior:**
- ✅ Highlights are cleared when navigating to a new page
- ✅ New page loads without any highlighted words initially
- ✅ You can tap and highlight words on the new page without issues

**Failure Indicators:**
- ❌ Previous page's highlights remain visible on new page
- ❌ Highlights from old page interfere with new page interaction
- ❌ Visual glitches or overlapping text when changing pages

---

### Test 5: TTS Playback Range and Segment Navigation
**Objective:** Verify that TTS correctly navigates through segments and highlights work between pages

**Steps:**
1. Load demo data
2. Play audio from the start
3. Let it read through the first segment
4. Observe: does it automatically move to the next segment/page?
5. Check that highlighting updates on new pages

**Expected Behavior:**
- ✅ TTS reads the first segment and highlights words progressively
- ✅ After finishing a segment, there's a small pause
- ✅ TTS then starts the next segment
- ✅ If on mobile, page changes automatically to show the segment being read
- ✅ Highlighting continues to work on each new page

**Failure Indicators:**
- ❌ TTS stops after the first segment
- ❌ Page doesn't change even though TTS is reading the next segment
- ❌ Highlighting doesn't work on the second segment

---

### Test 6: Pause and Resume
**Objective:** Verify that highlighting behaves correctly during pause/resume

**Steps:**
1. Start TTS playback
2. Wait a few words
3. Press Pause
4. Observe the highlighting state
5. Press Play to resume

**Expected Behavior:**
- ✅ When paused, current highlighting remains visible
- ✅ Resume continues from where it paused
- ✅ Highlighting updates correctly as speech resumes

**Failure Indicators:**
- ❌ Highlights disappear when paused
- ❌ Resuming doesn't highlight words correctly
- ❌ Jump to wrong position or words

---

### Test 7: Performance and Responsiveness
**Objective:** Verify that the app doesn't lag or freeze during highlighting

**Steps:**
1. Play TTS with speed set to 2.0x (fastest)
2. Rapidly tap words while TTS is playing
3. Change pages while TTS is playing
4. Observe frame rate and responsiveness

**Expected Behavior:**
- ✅ UI remains responsive during fast TTS playback
- ✅ No visible lag or stuttering when highlighting updates
- ✅ Taps are registered even during rapid word highlighting
- ✅ Page navigation is smooth

**Failure Indicators:**
- ❌ UI freezes or becomes sluggish
- ❌ Tap events are delayed or missed
- ❌ Animations are choppy or laggy
- ❌ Highlighting causes visual glitches

---

### Test 8: Browser Console Errors
**Objective:** Verify no JavaScript errors occur during normal use

**Steps:**
1. Open Chrome DevTools (F12 on Android: chrome://inspect)
2. Open the Console tab
3. Perform all the above tests
4. Watch for any error messages

**Expected Behavior:**
- ✅ Console should be clean with no error messages
- ✅ No warnings about undefined functions or methods
- ✅ Console logs should show smooth operation

**Failure Indicators:**
- ❌ Red error messages appear
- ❌ Messages about `clearHighlights is not defined`
- ❌ Errors about event handling or DOM manipulation

---

## Quick Checklist

- [ ] Word highlighting works during TTS playback
- [ ] Yellow highlighting disappears when tapping outside
- [ ] Multiple word selections work correctly
- [ ] Page navigation clears highlights
- [ ] TTS reads through multiple segments
- [ ] Pause/resume works with proper highlighting
- [ ] No lag or freezing during playback
- [ ] No JavaScript errors in console
- [ ] Touch events are handled properly (not just clicks)
- [ ] Aligned word highlighting works in both languages

---

## Reporting Issues

If any test fails, please note:
1. **Which test failed** (use the test number from above)
2. **Steps to reproduce**
3. **What you expected to happen**
4. **What actually happened**
5. **Device info** (Android version, Chrome version)
6. **Browser console errors** (if any)
7. **Screenshots or video** (if helpful)

---

## Additional Notes

- The app now uses both `onboundary` events (for desktop) and a fallback timer-based system (for mobile)
- Touch events (`touchstart`/`touchend`) are now handled separately from click events
- Mobile styling should reduce animation complexity to improve performance
- The `scrollIntoView` behavior is now optimized differently for mobile vs desktop
