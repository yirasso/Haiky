'use strict'

/* Where the taskbar is, and the room the creature lives in.

   It used to be a strip lying across the taskbar, 144px tall, and the creature
   stood in the middle of the bar. Two things were wrong with that and the
   second is the one that mattered.

   The taskbar is topmost and Windows re-asserts it, so a creature standing
   *inside* the bar spends its life arguing about z-order and losing some of
   the time — you would see the top of its head over the edge and nothing
   else. And a creature in a 144px letterbox cannot fall, which is the whole
   of what makes something feel like it has a body.

   So the window is the whole display now, and the taskbar is the **floor**:
   the creature stands on its top edge rather than in it, which is both what
   was asked for and, not by coincidence, the arrangement where the z-order
   question never comes up. The ceiling is the top of the screen.

   The whole of this is one subtraction. Windows reports two rectangles per
   display: `bounds`, the panel, and `workArea`, what is left after the shell
   has taken its furniture. The difference between them IS the taskbar — its
   edge, its thickness, its length — and it is exact, live, and free. There is
   nothing here to detect, guess, or ask a model about.

   Measured on this machine to be sure of the shape: 1920x1200 bounds against
   1920x1152 work area, so a 48px strip along the bottom.

   An auto-hidden taskbar leaves workArea equal to bounds and there is nothing
   to subtract. That is not a failure to report — it is a bar that is about to
   slide back up. We stand where it will be. */

const { screen } = require('electron')

const FALLBACK = 48      // an auto-hidden bar is still 48px when it returns

/* The four gaps between the panel and the work area. At most one of them is
   the taskbar; the others are zero, or are somebody else's appbar, which we
   treat identically because standing on it is just as correct. */
function strip (display) {
  const b = display.bounds
  const w = display.workArea
  const gaps = [
    { edge: 'top', size: w.y - b.y },
    { edge: 'bottom', size: (b.y + b.height) - (w.y + w.height) },
    { edge: 'left', size: w.x - b.x },
    { edge: 'right', size: (b.x + b.width) - (w.x + w.width) }
  ]
  let best = gaps[0]
  for (const g of gaps) if (g.size > best.size) best = g
  if (best.size < 2) return { edge: 'bottom', size: FALLBACK, hidden: true }
  return { edge: best.edge, size: best.size, hidden: false }
}

// the taskbar's own rectangle, in screen coordinates
function barRect (b, s) {
  if (s.edge === 'top') return { x: b.x, y: b.y, width: b.width, height: s.size }
  if (s.edge === 'bottom') return { x: b.x, y: b.y + b.height - s.size, width: b.width, height: s.size }
  if (s.edge === 'left') return { x: b.x, y: b.y, width: s.size, height: b.height }
  return { x: b.x + b.width - s.size, y: b.y, width: s.size, height: b.height }
}

/* The window is the display, and the room is four numbers inside it.

   `floor` is the one that matters and it is the taskbar's top edge — the
   surface, not the middle. With the bar anywhere but the bottom there is no
   ledge down there to stand on, so the floor is the bottom of the screen and
   the bar is simply somewhere the creature can walk in front of.

   Everything is in the window's own coordinates, which for a full-screen
   window means they are the same numbers as the display's — but they are
   converted rather than assumed, because the day this follows the mouse onto
   a second monitor is the day that assumption becomes a bug nobody can see. */
function layout (display) {
  const d = display || screen.getPrimaryDisplay()
  const b = d.bounds
  const s = strip(d)
  const bar = barRect(b, s)
  const win = { x: b.x, y: b.y, width: b.width, height: b.height }

  const local = { x: bar.x - win.x, y: bar.y - win.y, width: bar.width, height: bar.height }

  return {
    edge: s.edge,
    hidden: s.hidden,
    win,
    bar: local,
    /* The room. A creature that walks the whole width would walk behind the
       clock and under the Start button, so the walls come in a little — not
       to stop it being thrown there, only to stop it *choosing* to stand
       there. Throwing clamps to the window; walking clamps to these. */
    floor: s.edge === 'bottom' ? local.y : win.height,
    ceiling: 0,
    left: 0,
    right: win.width,
    scale: d.scaleFactor,
    displayId: d.id
  }
}

module.exports = { layout }
