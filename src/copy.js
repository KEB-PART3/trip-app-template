// Clipboard write, shared by the Waymo link and the arrival card.
//
// Deliberately never throws and never returns a promise the caller has to
// await: WaymoLink calls this on the way out of a click handler that must be
// free to follow its href on the same tick, and a rejected clipboard promise
// (Safari without a user gesture, a locked-down PWA) must not cancel that
// navigation. Callers who want confirmation should assume it worked — a failed
// copy leaves the value on screen to read, which is the same fallback we had
// before the button existed.
export function copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => {})
      return
    }
    // execCommand is synchronous and still the only option on a few old
    // Android WebViews. Nobody in this league is on one, but it costs 8 lines.
    const ta = document.createElement('textarea')
    ta.value = text
    ta.setAttribute('readonly', '')
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  } catch {
    /* No clipboard. The value is on screen; they type it. */
  }
}
