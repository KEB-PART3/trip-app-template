// DEMO BUILD — the Express API replaced by an in-memory stand-in.
// Same function signatures as the real client, so no page needed changing.
// Writes persist for the session and reset on reload; nothing leaves the browser.
import seed from './demo-state.json'
import weather from './demo-weather.json'

let STATE = JSON.parse(JSON.stringify(seed))
const MEMBER_NICKS = ['Alex','Sam','Jordan','Riley','Casey','Morgan','Taylor','Jamie','Drew','Quinn']
const clone = () => JSON.parse(JSON.stringify(STATE))
const ok = () => Promise.resolve(clone())

export async function login() { return { ok: true } }
export async function logout() { }
export async function getState() { return clone() }

export async function updateFlight(identity, member, patch) {
  STATE.flights[member] = { ...(STATE.flights[member] || {}), ...patch }
  return ok()
}

export async function runDraftReveal() {
  const order = [...MEMBER_NICKS]
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  STATE.draftOrder = order
  STATE.draftRevealedAt = Date.now()
  return ok()
}

export async function resetDraft() {
  STATE.draftOrder = null
  STATE.draftRevealedAt = null
  return ok()
}

export async function setPlaylist(url) {
  STATE.playlistUrl = String(url || '').slice(0, 400)
  return ok()
}

export async function addPrediction(nick, question, type) {
  const q = String(question || '').trim().replace(/\s+/g, ' ').slice(0, 140)
  if (q.length < 8) { const e = new Error('Give the prop a real question.'); e.status = 400; throw e }
  STATE.predictions.push({
    id: 'p' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    question: q, type, createdBy: nick, createdAt: Date.now(), votes: {}
  })
  return ok()
}

export async function votePrediction(nick, id, answer) {
  const p = STATE.predictions.find(x => x.id === id)
  if (p) p.votes[nick] = typeof answer === 'number' ? Math.round(answer * 100) / 100 : answer
  return ok()
}

export async function deletePrediction(nick, id) {
  STATE.predictions = STATE.predictions.filter(x => x.id !== id)
  return ok()
}

export async function getWeather() { return weather }
