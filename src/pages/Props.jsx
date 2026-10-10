import { useState } from 'react'
import { MEMBERS, ORGANIZER } from '../constants.js'
import { addPrediction, votePrediction, deletePrediction } from '../api.js'

// Props — party prop bets. Instant submissions (3/day each, server-enforced),
// Organiser-or-author delete, votes changeable any time, no scoring: the picks
// ARE the product; the arguing happens in person.
export default function Props({ state, onRefresh, nick }) {
  const props = [...(state?.predictions || [])].reverse() // newest first
  const [adding, setAdding] = useState(false)
  // 'all' | 'todo' | 'mine' — todo = props this phone hasn't answered yet (a
  // voted card leaves the list immediately); mine = props you wrote, for
  // checking how the league is responding to them.
  const [filter, setFilter] = useState('all')
  const todo = props.filter(p => p.votes[nick] === undefined)
  const mine = props.filter(p => p.createdBy === nick)
  const shown = filter === 'todo' ? todo : filter === 'mine' ? mine : props
  const [q, setQ] = useState('')
  const [type, setType] = useState('yesno')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true); setErr('')
    try {
      await addPrediction(nick, q.trim(), type)
      await onRefresh()
      setQ(''); setAdding(false)
    } catch (e) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <div className="props">
      <h1 className="page-title">Props</h1>
      {/* Identity is picked once and that's that — the switch link is gone: a
          fat-fingered name isn't the end of the world, and a self-service
          identity swap was more invitation than safety net. */}
      {/* The 3/day cap LEADS — it's the one sentence people must not skim past;
          the flavor line follows. A rule you knew going in feels like a game. */}
      <p className="page-sub">
        <b>Three props a day</b> — choose wisely. Lock your picks, argue in person.{' '}
        <span className="props-you">You are <b>{nick}</b></span>
      </p>

      {/* One control row: filter dropdown left, add right. Three views made a
          dropdown the right control — three pills plus Add wouldn't breathe on
          a phone. Native select so each platform brings its own picker UI. */}
      <div className="props-bar">
        <select
          className="props-filter"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          aria-label="Filter props"
        >
          <option value="all">All props ({props.length})</option>
          <option value="todo">To vote ({todo.length})</option>
          <option value="mine">My props ({mine.length})</option>
        </select>
        {!adding && (
          <button className="btn btn-primary props-add" onClick={() => { setErr(''); setAdding(true) }}>
            ➕ Add a prop
          </button>
        )}
      </div>
      {adding && (
        <div className="card props-form">
          <label className="lf-label" htmlFor="prop-q">The prop</label>
          <input
            id="prop-q" className="lf-input" maxLength={140}
            placeholder="e.g. Does anyone nap before 9 PM on Friday?"
            value={q} onChange={e => setQ(e.target.value)}
          />
          <div className="props-type">
            <button className={'btn props-type-btn' + (type === 'yesno' ? ' selected' : '')} onClick={() => setType('yesno')}>
              Yes / No
            </button>
            <button className={'btn props-type-btn' + (type === 'number' ? ' selected' : '')} onClick={() => setType('number')}>
              Number
            </button>
          </div>
          {err && <div className="lf-err">{err}</div>}
          <div className="props-form-actions">
            <button className="btn btn-primary" disabled={busy || q.trim().length < 8} onClick={submit}>
              {busy ? 'Posting…' : 'Post it'}
            </button>
            <button className="btn" disabled={busy} onClick={() => setAdding(false)}>Cancel</button>
          </div>
          <p className="jb-hint">Goes live instantly. 3 per day each — make them count. The organiser can delete slop.</p>
        </div>
      )}

      {shown.map(p => (
        <PropCard key={p.id} p={p} nick={nick} onRefresh={onRefresh} />
      ))}
      {filter === 'todo' && shown.length === 0 && (
        <div className="card props-done">✅ All caught up — every prop has your pick.</div>
      )}
      {filter === 'mine' && shown.length === 0 && (
        <div className="card props-done">Nothing yet — hit ➕ Add and stir the pot.</div>
      )}
    </div>
  )
}

export function PropCard({ p, nick, onRefresh, showBy = true }) {
  const [confirmDel, setConfirmDel] = useState(false)
  const [numVal, setNumVal] = useState('')
  const [busy, setBusy] = useState(false)
  const mine = p.votes[nick]
  const canDelete = nick === ORGANIZER || nick === p.createdBy

  async function vote(answer) {
    setBusy(true)
    try { await votePrediction(nick, p.id, answer); await onRefresh() }
    catch { /* re-render shows old state */ }
    finally { setBusy(false) }
  }
  async function remove() {
    setBusy(true)
    try { await deletePrediction(nick, p.id); await onRefresh() }
    finally { setBusy(false) }
  }

  const entries = Object.entries(p.votes)

  return (
    <div className="card prop-card">
      <div className="prop-head">
        <div className="prop-q">{p.question}</div>
        {canDelete && (
          confirmDel
            ? <span className="prop-del-confirm">
                <button className="prop-del-yes" disabled={busy} onClick={remove}>delete</button>
                <button className="prop-del-no" onClick={() => setConfirmDel(false)}>keep</button>
              </span>
            : <button className="prop-del" title="Delete this prop" onClick={() => setConfirmDel(true)}>✕</button>
        )}
      </div>
      {/* Every prop wears its author — including your own (tested with a
          sample prop; the author expects to see their name). Only the Morning
          After hides bylines (showBy): awards belong to the league. */}
      {showBy && <div className="prop-by">by {p.createdBy}</div>}

      {p.type === 'person' ? (
        <div className="sup-people">
          {MEMBERS.map(m => {
            const voters = entries.filter(([, v]) => v === m.nick).map(([n]) => n)
            return (
              <button
                key={m.nick}
                className={'sup-chip' + (mine === m.nick ? ' sup-chip-mine' : '') + (voters.length ? ' sup-chip-has' : '')}
                disabled={busy}
                onClick={() => vote(m.nick)}
                title={voters.length ? `Votes: ${voters.join(', ')}` : undefined}
              >
                {m.nick}{voters.length > 0 && <b>{voters.length}</b>}
              </button>
            )
          })}
        </div>
      ) : p.type === 'text' ? (
        <TextVote p={p} mine={mine} busy={busy} vote={vote} entries={entries} nick={nick} />
      ) : p.type === 'yesno' ? (
        <>
          <div className="prop-yn">
            {['yes', 'no'].map(a => {
              const voters = entries.filter(([, v]) => v === a).map(([n]) => n)
              return (
                <button
                  key={a}
                  className={'btn prop-yn-btn' + (mine === a ? ' selected' : '')}
                  disabled={busy}
                  onClick={() => vote(a)}
                >
                  <span className="prop-yn-label">{a === 'yes' ? '👍 Yes' : '👎 No'}</span>
                  <span className="prop-yn-count">{voters.length}</span>
                </button>
              )
            })}
          </div>
          {entries.length > 0 && (
            <div className="prop-voters">
              {['yes', 'no'].map(a => {
                const voters = entries.filter(([, v]) => v === a).map(([n]) => n)
                return voters.length ? (
                  <div key={a} className="prop-voters-row">
                    <b>{a === 'yes' ? 'Yes' : 'No'}:</b> {voters.join(', ')}
                  </div>
                ) : null
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="prop-num-entry">
            <input
              className="lf-input prop-num-input"
              type="number" inputMode="decimal"
              placeholder={mine != null ? String(mine) : 'your number'}
              value={numVal}
              onChange={e => setNumVal(e.target.value)}
            />
            <button
              className="btn btn-primary"
              disabled={busy || numVal.trim() === ''}
              onClick={() => { vote(Number(numVal)); setNumVal('') }}
            >
              {mine != null ? 'Update' : 'Lock it'}
            </button>
          </div>
          {entries.length > 0 && (
            <div className="prop-guesses">
              {entries
                .sort((a, b) => b[1] - a[1])
                .map(([n, v]) => (
                  <span key={n} className={'prop-guess' + (n === nick ? ' prop-guess-mine' : '')}>
                    {n} <b>{v}</b>
                  </span>
                ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

// Write-in vote (e.g. Song of the Fest): lock any answer, chips group the room's picks.
function TextVote({ p, mine, busy, vote, entries }) {
  const [val, setVal] = useState('')
  const groups = {}
  for (const [voter, v] of entries) {
    const key = String(v).toLowerCase()
    if (!groups[key]) groups[key] = { label: String(v), voters: [] }
    groups[key].voters.push(voter)
  }
  const ranked = Object.values(groups).sort((a, b) => b.voters.length - a.voters.length)
  return (
    <>
      <div className="prop-num-entry">
        <input
          className="lf-input prop-num-input"
          maxLength={60}
          placeholder={mine != null ? String(mine) : 'your pick'}
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        <button
          className="btn btn-primary"
          disabled={busy || val.trim().length < 1}
          onClick={() => { vote(val.trim()); setVal('') }}
        >
          {mine != null ? 'Update' : 'Lock it'}
        </button>
      </div>
      {ranked.length > 0 && (
        <div className="sup-people">
          {ranked.map(g => (
            <span
              key={g.label.toLowerCase()}
              className={'sup-chip sup-chip-has' + (mine != null && String(mine).toLowerCase() === g.label.toLowerCase() ? ' sup-chip-mine' : '')}
              title={`Votes: ${g.voters.join(', ')}`}
            >
              {g.label}<b>{g.voters.length}</b>
            </span>
          ))}
        </div>
      )}
    </>
  )
}

// After the passphrase, every phone picks who it belongs to. Honor system —
// same trust model as the rest of the league.
export function NickPicker({ onPick }) {
  return (
    <div className="login-wrap">
      <div className="login">
        <div className="login-header">
          <h1>WHO ARE YOU?</h1>
          <p className="login-sub">Picks, props, and blame need a name.</p>
        </div>
        {/* Alphabetical by nick, filling left-to-right then down — ten names with
            no natural order, so scanning beats hunting. Sorted here only; MEMBERS
            keeps its league order for Lore and everywhere else. */}
        <div className="member-grid">
          {[...MEMBERS].sort((a, b) => a.nick.localeCompare(b.nick)).map(m => (
            <button key={m.nick} className="member-btn" onClick={() => onPick(m.nick)}>
              <div className="mb-nick">{m.nick}</div>
              <div className="mb-team">{m.team}</div>
            </button>
          ))}
        </div>
        {/* nb keeps "handle it" welded together so a lone "it" can never land on
            its own line; text-wrap: balance evens the two lines out. */}
        <p className="login-hint">Honor system. Pick someone else and the room will <span className="nb">handle it</span>.</p>
      </div>
    </div>
  )
}
