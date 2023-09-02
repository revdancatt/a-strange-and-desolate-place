/* global fxrand Line */

const PAPER = { // eslint-disable-line no-unused-vars
  A1: [59.4, 84.1],
  A2: [42.0, 59.4],
  A3: [29.7, 42.0],
  A4: [21.0, 29.7],
  A5: [14.8, 21.0],
  A6: [10.5, 14.8]
}

const page = { // eslint-disable-line no-unused-vars
  translate: (lines, x, y) => {
    lines.forEach((line) => {
      line.points.forEach((point) => {
        point.x += x
        point.y += y
      })
    })
    return lines
  },
  scale: (lines, x, y) => {
    lines.forEach((line) => {
      line.points.forEach((point) => {
        point.x *= x
        point.y *= y
      })
    })
    return lines
  },
  rotate: (lines, angle) => {
    //  Convert the angle from degree to radians
    const adjustedAngle = (-angle * Math.PI / 180)

    //  This will hold our final lines for us
    const newLines = []
    //  Make sure the lines are an array
    if (!Array.isArray(lines)) lines = [lines]

    //  Now rotate all the points
    lines.forEach((line) => {
      const newLine = new Line()
      line.points.forEach((point) => {
        newLine.addPoint((Math.cos(adjustedAngle) * point.x) + (Math.sin(adjustedAngle) * point.y), (Math.cos(adjustedAngle) * point.y) - (Math.sin(adjustedAngle) * point.x), point.z)
      })
      newLines.push(newLine)
    })
    //  Send the lines back
    return newLines
  },
  wobble: (lines, x, y) => {
    lines.forEach((line) => {
      line.points.forEach((point) => {
        point.x += (fxrand() - 0.5) * 0.01 * x
        point.y += (fxrand() - 0.5) * 0.01 * y
      })
    })
    return lines
  },
  decimate: (lines, t = 0.01) => {
    const newLines = []
    lines.forEach((line) => {
      const newLine = new Line(line.getZindex())
      const points = line.getPoints()
      for (let pi = 0; pi < points.length - 1; pi++) {
        const p1 = points[pi]
        const p2 = points[pi + 1]
        const xDiff = p2.x - p1.x
        const yDiff = p2.y - p1.y
        const zDiff = p2.z - p1.z
        const distance = Math.sqrt(xDiff * xDiff + yDiff * yDiff + zDiff * zDiff)
        const times = parseInt(distance / t)
        const percent = 100 / times / 100
        if (times > 0) {
          for (let d = 0; d < times; d++) {
            newLine.addPoint(p1.x + (xDiff * percent * d), p1.y + (yDiff * percent * d), p1.z + (zDiff * percent * d))
          }
        } else {
          newLine.addPoint(p1.x, p1.y, p1.z)
        }
      }
      //  Add the last point
      newLine.addPoint(points[points.length - 1].x, points[points.length - 1].y, points[points.length - 1].z)
      newLines.push(newLine)
    })
    return newLines
  }
}
