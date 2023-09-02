/* global preloadImagesTmr $fx fxpreview paperLoaded Line fxhash fxrand page PAPER Blob */

//
//  a strange and desolate place - revdancatt 17/03/2022
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

// Global values, because today I'm being an artist not an engineer!
// These are the generally common values we'll use across our projects
const ratio = 1.41 // canvas ratio
const features = {} // A global object to hold all the features we'll use in the draw stage
const nextFrame = null // requestAnimationFrame, and the ability to clear it
let resizeTmr = null // a timer to make sure we don't resize too often
let highRes = false // display high or low res
let drawStarted = false // Flag if we have kicked off the draw loop
let thumbnailTaken = false // have we taken a thumbnail yet, so we don't take another
let forceDownloaded = false // are we forcing a download?
const urlSearchParams = new URLSearchParams(window.location.search)
const urlParams = Object.fromEntries(urlSearchParams.entries())
const prefix = 'a-strange-and-desolate-place'
// dumpOutputs will be set to false unless we have ?dumpOutputs=true in the URL
const dumpOutputs = urlParams.dumpOutputs === 'true'

// These are custom values for this project
let redLines = []
let blackLines = []
let backgroundTexture = true
const startTime = new Date().getTime() // so we can figure out how long since the scene started

//  We need this to display features in fxhash
window.$fxhashFeatures = {}

const makeHex = (density, radius) => {
  const step = 2 / density
  const offset = step / 2
  const start = -radius
  const first = -radius / 2
  const last = radius / 2
  const end = radius
  const lines = []
  const ym = 0.866
  for (let s = 0; s < density; s++) {
    const x = -1 + (s * step) + offset
    if (x > start && x < end) {
      const line = new Line()
      let diff = radius + x
      if (x < first) {
        line.addPoint(x, -radius * diff * ym * 2 / radius)
        line.addPoint(x, radius * diff * ym * 2 / radius)
      }
      if (x >= first && x <= last) {
        line.addPoint(x, -radius * ym)
        line.addPoint(x, radius * ym)
      }
      if (x > last) {
        diff = radius - x
        line.addPoint(x, -radius * diff * ym * 2 / radius)
        line.addPoint(x, radius * diff * ym * 2 / radius)
      }
      lines.push(line)
    }
  }
  return lines
}

// This is where we decide what everything is going to look like and where it's all going
// to go. We run this once at the start and then never again, all the random number generation
// happens in here, after this we don't touch random numbers again.
const makeFeatures = () => {
  //  Work out what colour background we are going to have (if any)
  features.background = null
  window.$fxhashFeatures.background = 'desolate'
  if (fxrand() < 0.2) {
    features.background = Math.floor(fxrand() * 6) * 60
    if (features.background === 0) window.$fxhashFeatures.background = 'England'
    if (features.background === 60) window.$fxhashFeatures.background = 'Wales'
    if (features.background === 120) window.$fxhashFeatures.background = 'Ireland'
    if (features.background === 180) window.$fxhashFeatures.background = 'Ice'
    if (features.background === 240) window.$fxhashFeatures.background = 'Scotland'
    if (features.background === 300) window.$fxhashFeatures.background = 'Vapor'
  }

  //  We are going to work out how many lands we have at the bottom
  const lands = 3
  const started = []
  const ended = []
  features.land = []
  const landLines = 80
  const step = 1 / (landLines - 1)

  for (let l = 0; l < lands; l++) {
    const curve = {
      mode: 'full',
      start: Math.floor(fxrand() * 5) * 0.25,
      end: Math.floor(fxrand() * 5) * 0.25,
      tops: []
    }
    //  The end can't match the start
    while (curve.start === curve.end) curve.end = Math.floor(fxrand() * 5) * 0.25
    //  Now do it all over again, until we know we've used points that
    //  haven't already been used
    while (started.includes(curve.start) || ended.includes(curve.end)) {
      curve.start = Math.floor(fxrand() * 5) * 0.25
      curve.end = curve.start
      while (curve.start === curve.end) curve.end = Math.floor(fxrand() * 5) * 0.25
    }
    //  Record the start and end point so we don't use them again
    started.push(curve.start)
    ended.push(curve.end)
    let cmodmod = 1
    if (fxrand() < 0.2) {
      curve.mode = 'half'
      curve.middle = curve.start // left side flat
      if (fxrand() < 0.5) curve.middle = curve.end // 50% of the time right side flat
      cmodmod = 2
    }

    //  Now work out the position of the tops, based on 0 to 1
    for (let tl = 0; tl < landLines; tl++) {
      //  Work out how far we are from 0 to 1
      const x = tl * step
      //  Now calculate the top position (again 0 to 1)
      const cmod = (Math.sin(((180 * x * cmodmod) + 90) * (Math.PI / 180)) + 1) / 2
      let y = 0
      if (curve.mode === 'full') {
        y = curve.end - ((curve.end - curve.start) * cmod)
      } else {
        //  Otherwise we have to draw the first half of the land first and then
        //  the second half
        if (curve.start !== curve.middle) {
          if (x <= 0.5) {
            y = curve.middle - ((curve.middle - curve.start) * cmod)
          } else {
            y = curve.end
          }
        }
        if (curve.middle !== curve.end) {
          if (x <= 0.5) {
            y = curve.middle
          } else {
            y = curve.middle - ((curve.middle - curve.end) * cmod)
          }
        }
      }
      curve.tops.push(y)
      curve.lines = []
      for (const i in curve.tops) {
        const top = curve.tops[i]
        const line = new Line()
        line.addPoint((i * step) + (step / lands * l), 0)
        line.addPoint((i * step) + (step / lands * l), top)
        curve.lines.push(line)
      }
      curve.lines = page.decimate(curve.lines, 0.05)
      curve.lines = page.wobble(curve.lines, 0.2, 0)
    }
    features.land.push(curve)
  }

  //  Now do the sea
  const seaLines = 50
  const seaStep = 1 / (seaLines - 1)
  features.seaLines = []
  for (let s = 0; s < seaLines; s++) {
    let seaLine = new Line()
    seaLine.addPoint(0, s * seaStep)
    seaLine.addPoint(1, s * seaStep)
    seaLine = page.decimate([seaLine], 0.2)
    seaLine = page.wobble(seaLine, 0, 8 * (s / seaLines))
    seaLine = page.decimate(seaLine, 0.01)
    seaLine = page.wobble(seaLine, 0, 1 * (s / seaLines))
    features.seaLines.push(seaLine)
  }

  //  Decide where to put the hexagon
  features.hexagon = {
    lines1: page.wobble(page.decimate(makeHex(40, 1), 0.1), 1.5, 1),
    lines2: page.wobble(page.decimate(makeHex(40, fxrand() * 0.6 + 0.2), 0.1), 1.5, 1),
    lines3: page.wobble(page.decimate(makeHex(40, fxrand() * 0.6 + 0.2), 0.1), 1.5, 1),
    col: Math.floor(fxrand() * 3) + 1,
    row: Math.floor(fxrand() * 3) + 1
  }

  //  Do across rows
  window.$fxhashFeatures.planets = 0
  if (features.hexagon.row === 1 || features.hexagon.row === 3) {
    features.dots = []
    //  We may now add _possibly_ five dots
    for (let d = 0; d < 5; d++) {
      if (fxrand() < 0.5) {
        features.dots.push((0.25 * Math.ceil(fxrand() * 4)) * 0.8)
      } else {
        features.dots.push(null)
      }
    }
    features.allDots = []
    features.dots.forEach((dot) => {
      if (dot) {
        const dotLines = []
        //  We are doing a horizonal line, which means we need to squish
        const step = 0.08
        const maxRadius = 1
        const thisRadius = maxRadius * dot
        const roundRadius = Math.floor(thisRadius / step) * step

        for (let y = -roundRadius; y < roundRadius; y += step) {
          const x = Math.sqrt((roundRadius * roundRadius) - (y * y))
          const startX = -x
          const endX = x
          const line = new Line()
          line.addPoint(startX, y)
          line.addPoint(endX, y)
          dotLines.push(line)
        }

        for (let x = -roundRadius; x < roundRadius; x += step) {
          const y = Math.sqrt((roundRadius * roundRadius) - (x * x))
          const startY = -y
          const endY = y
          const line = new Line()
          line.addPoint(x, startY)
          line.addPoint(x, endY)
          dotLines.push(line)
        }
        features.allDots.push(page.wobble(page.decimate(dotLines, 0.1), 1.5, 1.5))
        window.$fxhashFeatures.planets++
      } else {
        features.allDots.push(null)
      }
    })
  }

  //  Do down rows
  if (features.hexagon.row === 2 && features.hexagon.col !== 2) {
    features.hdots = []
    //  We may now add _possibly_ five dots
    for (let d = 0; d < 3; d++) {
      if (fxrand() < 0.8) {
        features.hdots.push((0.25 * Math.ceil(fxrand() * 4)) * 0.8)
        window.$fxhashFeatures.planets++
      } else {
        features.hdots.push(null)
      }
    }

    features.allhDots = []
    features.hdots.forEach((dot) => {
      if (dot) {
        const dotLines = []
        //  We are doing a horizonal line, which means we need to squish
        const step = 0.08
        const maxRadius = 1
        const thisRadius = maxRadius * dot
        const roundRadius = Math.floor(thisRadius / step) * step

        for (let y = -roundRadius; y < roundRadius; y += step) {
          const x = Math.sqrt((roundRadius * roundRadius) - (y * y))
          const startX = -x
          const endX = x
          const line = new Line()
          line.addPoint(startX, y)
          line.addPoint(endX, y)
          dotLines.push(line)
        }

        for (let x = -roundRadius; x < roundRadius; x += step) {
          const y = Math.sqrt((roundRadius * roundRadius) - (x * x))
          const startY = -y
          const endY = y
          const line = new Line()
          line.addPoint(x, startY)
          line.addPoint(x, endY)
          dotLines.push(line)
        }
        features.allhDots.push(page.wobble(page.decimate(dotLines, 0.1), 1.5, 1.5))
      } else {
        features.allhDots.push(null)
      }
    })
  }

  window.$fxhashFeatures.hexagone = 'arrived'
  if (features.hexagon.row === 2 && features.hexagon.col === 2) {
    window.$fxhashFeatures.hexagone = 'focused'
  }
}
// Call makeFeatures() right away, because we want to do this as soon as possible
makeFeatures()
console.table(window.$fxhashFeatures)

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
//
// Custom drawing code goes here. By this point everything that will be drawn
// has been decided, so we just need to draw it.
//
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
const drawCanvas = async () => {
  drawStarted = true
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  redLines = []
  blackLines = []

  ctx.fillStyle = 'rgb(245, 245, 245)'
  if (backgroundTexture) ctx.fillStyle = features.paperPattern

  ctx.fillRect(0, 0, w, h)
  if (features.background !== null) {
    ctx.globalCompositeOperation = 'screen'
    ctx.fillStyle = `hsla(${features.background}, 100%, 50%, 1)`
    ctx.fillRect(0, 0, w, h)
    ctx.globalCompositeOperation = 'source-over'
  }
  /*
  ctx.fillStyle = 'rgba(32, 32, 32, 0.2)'
  ctx.fillRect(0, 0, w - 42, h - 42)
  ctx.fillRect(42, 42, w - 42, h - 42)
  */
  ctx.lineCap = 'round'
  ctx.strokeStyle = 'black'
  //  Okay, now we are going to go through the lands drawing them all
  ctx.lineWidth = w / 80 / 3 / 2
  for (const land of features.land) {
    for (const line of land.lines) {
      //  Only draw if we aren't off the right hand side
      if (line.points[0].x <= 1) {
        const x = line.points[0].x * w
        const y = h - (line.points[0].y * h / 4) - (h / 4)
        ctx.beginPath()
        ctx.moveTo(x, y)
        const newBlackLine = [{
          x,
          y
        }]
        for (let p = 1; p < line.points.length; p++) {
          const x = line.points[p].x * w
          const y = h - (line.points[p].y * h / 4) - (h / 4)
          ctx.lineTo(x, y)
          newBlackLine.push({
            x,
            y
          })
        }
        ctx.stroke()
        blackLines.push(newBlackLine)
      }
    }
  }

  for (const seaLine of features.seaLines) {
    for (const line of seaLine) {
      const x = line.points[0].x * w
      const y = (line.points[0].y * h / 4.2) + (h / 4 * 3)
      ctx.beginPath()
      ctx.moveTo(x, y)
      const newBlackLine = [{
        x,
        y
      }]
      for (let p = 1; p < line.points.length; p++) {
        const x = line.points[p].x * w
        const y = (line.points[p].y * h / 4.2) + (h / 4 * 3)
        ctx.lineTo(x, y)
        newBlackLine.push({
          x,
          y
        })
      }
      ctx.stroke()
      blackLines.push(newBlackLine)
    }
  }

  //  Draw the hexagon
  let scaleWMod = w / (7 - (2 - features.hexagon.row))
  let scaleHMod = h / (7 - (2 - features.hexagon.row)) / ratio
  if (features.hexagon.col === 2 && features.hexagon.row === 2) scaleWMod *= 1.3
  if (features.hexagon.col === 2 && features.hexagon.row === 2) scaleHMod *= 1.3

  //  The first set of lines
  let newLines1 = page.rotate(JSON.parse(JSON.stringify(features.hexagon.lines1)), 0)
  newLines1 = page.scale(newLines1, scaleWMod, scaleHMod)
  newLines1 = page.translate(newLines1, w / 4 * features.hexagon.col, h / 2 / 4 * features.hexagon.row)
  for (const line of newLines1) {
    const x = line.points[0].x
    const y = line.points[0].y
    ctx.beginPath()
    ctx.moveTo(x, y)
    const newBlackLine = [{
      x,
      y
    }]
    for (let p = 1; p < line.points.length; p++) {
      const x = line.points[p].x
      const y = line.points[p].y
      ctx.lineTo(x, y)
      newBlackLine.push({
        x,
        y
      })
    }
    ctx.stroke()
    blackLines.push(newBlackLine)
  }

  //  The second set of lines
  let newLines2 = page.rotate(JSON.parse(JSON.stringify(features.hexagon.lines2)), 120)
  newLines2 = page.scale(newLines2, scaleWMod, scaleHMod)
  newLines2 = page.translate(newLines2, w / 4 * features.hexagon.col, h / 2 / 4 * features.hexagon.row)
  for (const line of newLines2) {
    const x = line.points[0].x
    const y = line.points[0].y
    ctx.beginPath()
    ctx.moveTo(x, y)
    const newBlackLine = [{
      x,
      y
    }]
    for (let p = 1; p < line.points.length; p++) {
      const x = line.points[p].x
      const y = line.points[p].y
      ctx.lineTo(x, y)
      newBlackLine.push({
        x,
        y
      })
    }
    ctx.stroke()
    blackLines.push(newBlackLine)
  }
  //  The third set of lines
  let newLines3 = page.rotate(JSON.parse(JSON.stringify(features.hexagon.lines3)), 240)
  newLines3 = page.scale(newLines3, scaleWMod, scaleHMod)
  newLines3 = page.translate(newLines3, w / 4 * features.hexagon.col, h / 2 / 4 * features.hexagon.row)
  for (const line of newLines3) {
    const x = line.points[0].x
    const y = line.points[0].y
    ctx.beginPath()
    ctx.moveTo(x, y)
    const newBlackLine = [{
      x,
      y
    }]
    for (let p = 1; p < line.points.length; p++) {
      const x = line.points[p].x
      const y = line.points[p].y
      ctx.lineTo(x, y)
      newBlackLine.push({
        x,
        y
      })
    }
    ctx.stroke()
    blackLines.push(newBlackLine)
  }

  //  Now we draw the dots
  let dotsYOffset = 0
  if (features.hexagon.row === 3) dotsYOffset = h / 8
  if (features.hexagon.row === 1) dotsYOffset = h / 8 * 3
  let dotsXOffset = 0
  if (features.hexagon.col === 1) dotsXOffset = w / 4 * 3
  if (features.hexagon.col === 3) dotsXOffset = w / 4

  ctx.strokeStyle = '#D72A0C'
  if (features.allDots) {
    for (let d in features.allDots) {
      d = parseInt(d, 10)
      const dot = features.allDots[d]
      if (dot !== null) {
        let dotLines = JSON.parse(JSON.stringify(dot))
        dotLines = page.scale(dotLines, w / 10, h / 10 / ratio)
        dotLines = page.translate(dotLines, (w / 6) * (d + 1), dotsYOffset)
        for (const line of dotLines) {
          const x = line.points[0].x
          const y = line.points[0].y
          ctx.beginPath()
          ctx.moveTo(x, y)
          const newRedLine = [{
            x,
            y
          }]
          for (let p = 1; p < line.points.length; p++) {
            const x = line.points[p].x
            const y = line.points[p].y
            ctx.lineTo(x, y)
            newRedLine.push({
              x,
              y
            })
          }
          ctx.stroke()
          redLines.push(newRedLine)
        }
      }
    }
  }
  //  Draw the horizonal dots if we have any
  if (features.allhDots) {
    for (let d in features.allhDots) {
      d = parseInt(d, 10)
      const dot = features.allhDots[d]
      if (dot !== null) {
        let dotLines = JSON.parse(JSON.stringify(dot))
        dotLines = page.scale(dotLines, w / 10, h / 10 / ratio)
        dotLines = page.translate(dotLines, dotsXOffset, h / 2 / 4 * (d + 1))
        for (const line of dotLines) {
          const x = line.points[0].x
          const y = line.points[0].y
          ctx.beginPath()
          ctx.moveTo(x, y)
          const newRedLine = [{
            x,
            y
          }]
          for (let p = 1; p < line.points.length; p++) {
            const x = line.points[p].x
            const y = line.points[p].y
            ctx.lineTo(x, y)
            newRedLine.push({
              x,
              y
            })
          }
          ctx.stroke()
          redLines.push(newRedLine)
        }
      }
    }
  }

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Below is code that is common to all the projects, there may be some
  // customisation for animated work or special cases

  // Try various methods to tell the parent window that we've drawn something
  if (!thumbnailTaken) {
    try {
      $fx.preview()
    } catch (e) {
      try {
        fxpreview()
      } catch (e) {
      }
    }
    thumbnailTaken = true
  }

  // If we are forcing download, then do that now
  if (dumpOutputs || ('forceDownload' in urlParams && forceDownloaded === false)) {
    forceDownloaded = 'forceDownload' in urlParams
    await autoDownloadCanvas()
    // Tell the parent window that we have downloaded
    window.parent.postMessage('forceDownloaded', '*')
  } else {
    //  We should wait for the next animation frame here
    // nextFrame = window.requestAnimationFrame(drawCanvas)
  }
  //
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
//
// These are the common functions that are used by the canvas that we use
// across all the projects, init sets up the resize event and kicks off the
// layoutCanvas function.
//
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=

//  Call this to start everything off
const init = async () => {
  // Resize the canvas when the window resizes, but only after 100ms of no resizing
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    clearTimeout(resizeTmr)
    resizeTmr = setTimeout(async () => {
      await layoutCanvas()
    }, 100)
  })

  //  Now layout the canvas
  await layoutCanvas()
}

/*
  This function will set up the canvas to be the correct size and then place it onto the page.
  It gets called whenever the canvas is resized. The end of this function then calls the
  drawCanvas function. We should never call the drawCanvas function directly.
*/
const layoutCanvas = async (windowObj = window, urlParamsObj = urlParams) => {
  //  Kill the next animation frame (note, this isn't always used, only if we're animating)
  windowObj.cancelAnimationFrame(nextFrame)

  //  Get the window size, and devicePixelRatio
  const { innerWidth: wWidth, innerHeight: wHeight, devicePixelRatio = 1 } = windowObj
  let dpr = devicePixelRatio
  let cWidth = wWidth
  let cHeight = cWidth * ratio

  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }

  // Grab any canvas elements so we can delete them
  const canvases = document.getElementsByTagName('canvas')
  Array.from(canvases).forEach(canvas => canvas.remove())

  // Now set the target width and height
  let targetHeight = highRes ? 4096 : cHeight
  let targetWidth = targetHeight / ratio

  //  If the alba params are forcing the width, then use that (only relevant for Alba)
  if (windowObj.alba?.params?.width) {
    targetWidth = window.alba.params.width
    targetHeight = Math.floor(targetWidth * ratio)
  }

  // If *I* am forcing the width, then use that, and set the dpr to 1
  // (as we want to render at the exact size)
  if ('forceWidth' in urlParams) {
    targetWidth = parseInt(urlParams.forceWidth)
    targetHeight = Math.floor(targetWidth * ratio)
    dpr = 1
  }

  // Update based on the dpr
  targetWidth *= dpr
  targetHeight *= dpr

  //  Set the canvas width and height
  const canvas = document.createElement('canvas')
  canvas.id = 'target'
  canvas.width = targetWidth
  canvas.height = targetHeight
  document.body.appendChild(canvas)

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  // >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
  //
  // Custom code (for defining textures and buffer canvas goes here) if needed
  //

  //  Create the paper pattern
  features.paper = document.createElement('canvas')
  features.paper.id = 'cloud1src'
  features.paper.width = canvas.width / 2
  features.paper.height = canvas.width / 2
  const paperCtx = features.paper.getContext('2d')
  paperCtx.drawImage(features.paperimg, 0, 0, 1920, 1920, 0, 0, features.paper.width, features.paper.height)
  features.paperPattern = paperCtx.createPattern(features.paper, 'repeat')

  //
  // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<

  //  And draw it!!
  drawCanvas()
}

//  This allows us to download the canvas as a PNG
// If we are forcing the id then we add that to the filename
const autoDownloadCanvas = async () => {
  const canvas = document.getElementById('target')

  // Create a download link
  const element = document.createElement('a')
  const filename = 'forceId' in urlParams
    ? `${prefix}_${urlParams.forceId.toString().padStart(4, '0')}_${fxhash}`
    : `${prefix}_${fxhash}`
  element.setAttribute('download', filename)

  // Hide the link element
  element.style.display = 'none'
  document.body.appendChild(element)

  // Convert canvas to Blob and set it as the link's href
  const imageBlob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob))

  // Trigger the download
  element.click()

  // Clean up by removing the link element
  document.body.removeChild(element)

  // Reload the page if dumpOutputs is true
  if (dumpOutputs) {
    window.location.reload()
  }
}

const wrapSVG = async (lines, size, filename) => {
  let output = `<?xml version="1.0" standalone="no" ?>
  <!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" 
      "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
      <svg version="1.1" id="lines" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      x="0" y="0"
      viewBox="0 0 ${size[0]} ${size[1]}"
      width="${size[0]}cm"
      height="${size[1]}cm" 
      xml:space="preserve">`

  output += `
      <g>
      <path d="`
  lines.forEach((line) => {
    const points = line.getPoints()
    output += `M ${points[0].x * size[0]} ${points[0].y * size[1]} `
    for (let p = 1; p < points.length; p++) {
      output += `L ${points[p].x * size[0]} ${points[p].y * size[1]} `
    }
  })
  output += `"  fill="none" stroke="black" stroke-width="0.05"/>
    </g>`
  output += '</svg>'

  const element = document.createElement('a')
  element.setAttribute('download', `${filename}.svg`)
  element.style.display = 'none'
  document.body.appendChild(element)
  element.setAttribute('href', window.URL.createObjectURL(new Blob([output], {
    type: 'text/plain;charset=utf-8'
  })))
  element.click()
  document.body.removeChild(element)
}

const downloadSVG = async (s) => {
  const canvas = document.getElementById('target')
  const w = canvas.width
  const h = canvas.height
  const size = PAPER[`A${s}`]
  let scaledBlackLines = blackLines.map((line) => {
    const newLine = new Line()
    line.forEach((p) => {
      newLine.addPoint(p.x / w, p.y / h)
    })
    return newLine
  })
  scaledBlackLines = page.translate(scaledBlackLines, -0.5, -0.5)
  scaledBlackLines = page.scale(scaledBlackLines, 0.95, 0.95)
  scaledBlackLines = page.translate(scaledBlackLines, 0.5, 0.5)
  await wrapSVG(scaledBlackLines, size, `${prefix}_${fxhash}_black-lines`)

  if (redLines.length) {
    let scaledRedLines = redLines.map((line) => {
      const newLine = new Line()
      line.forEach((p) => {
        newLine.addPoint(p.x / w, p.y / h)
      })
      return newLine
    })
    scaledRedLines = page.translate(scaledRedLines, -0.5, -0.5)
    scaledRedLines = page.scale(scaledRedLines, 0.95, 0.95)
    scaledRedLines = page.translate(scaledRedLines, 0.5, 0.5)
    await wrapSVG(scaledRedLines, size, `${prefix}_${fxhash}_red-lines`)
  }
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // == Common controls ==
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    console.log('Highres mode is now', highRes)
    await layoutCanvas()
  }

  // == Custom controls ==
  //   Toggle texture mode
  if (e.key === 't') {
    backgroundTexture = !backgroundTexture
    console.log('Background texture mode is now', backgroundTexture)
    await layoutCanvas()
  }

  // If the numbers 1 to 6 are pressed, then download the SVGs
  if (e.key === '1') downloadSVG(1)
  if (e.key === '2') downloadSVG(2)
  if (e.key === '3') downloadSVG(3)
  if (e.key === '4') downloadSVG(4)
  if (e.key === '5') downloadSVG(5)
  if (e.key === '6') downloadSVG(6)
})

//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  let paperimg = document.getElementById('paperImg')
  if (!paperimg) {
    paperimg = document.createElement('img')
    paperimg.id = 'paperImg'
    paperimg.style.width = '1920px'
    paperimg.style.height = '1920px'
    paperimg.addEventListener('load', () => {
      // eslint-disable-next-line
      paperLoaded = true
    })
    paperimg.src = 'data:image/jpeg;base64,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'
    features.paperimg = paperimg
  }

  if (paperLoaded && !drawStarted) {
    clearInterval(preloadImagesTmr)
    init()
  }

  //  If, for some reason things haven't fired after 3.333 seconds, then just draw the stuff anyway
  //  without the textures
  if (new Date().getTime() - startTime > 3333 && !drawStarted) {
    clearInterval(preloadImagesTmr)
    init()
  }
}
