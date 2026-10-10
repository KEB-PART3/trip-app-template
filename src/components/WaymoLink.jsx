import { HOUSE_DEST, WAYMO_URL } from '../constants.js'
import { copyText } from '../copy.js'

// The Waymo link, shared by the Home card's pill stack and the House page's
// button row. Same behaviour, two different skins — pass whatever className the
// host page's button vocabulary uses and hand in your own children.
//
// Stays an <a> rather than a <button> on purpose: the navigation must happen
// even if the clipboard write throws (Safari only grants clipboard access inside
// a user gesture, and a PWA installed to the home screen has bitten us on
// permissions before). So the copy is a side effect of the click and the href
// does the real work — worst case the rider types the address like it's 2015.
//
// No state, no confirmation, no label flip — it looks identical before the tap,
// during, and after you come back. The copy is silent background work.
//
// Nothing here can delay the hand-off: writeText() returns a promise we never
// await, so the browser follows the href on the same tick it always would. The
// execCommand fallback is synchronous but only runs on browsers with no
// clipboard API at all, which is nobody in this league.
//
// It copies COORDINATES, not the street address. A street address often
// geocodes to the front of a building, which can be the wrong side; the
// coordinates are the dropped pin exactly. Every destination search accepts a
// bare "lat,lng", so this costs nothing in reliability and saves the walk.
export default function WaymoLink({ className, children }) {
  const copyDestination = () => copyText(HOUSE_DEST)

  return (
    <a
      className={className}
      href={WAYMO_URL}
      target="_blank"
      rel="noreferrer"
      onClick={copyDestination}
      title="Opens the Waymo app. Waymo can't accept a destination from a link, so the house coordinates are copied to your clipboard — paste them into the destination box."
    >
      {children}
    </a>
  )
}
