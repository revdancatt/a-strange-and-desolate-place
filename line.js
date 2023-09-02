/** Line A line which is represended by am array of points */
class Line { // eslint-disable-line no-unused-vars
  /**
   * Sets up our line
   * @param {number} zIndex The value of the zIndex (used for sorting and occlusion)
   */
  constructor (zIndex) {
    this.points = []
    this.zIndex = zIndex
  }

  /**
   *
   * @param {number} x x co-ord
   * @param {number} y y co-ord
   * @param {number} z z co-ord
   */
  addPoint (x, y, z = 0) {
    this.points.push({
      x,
      y,
      z
    })
  }

  /**
   * Getter method to get the points
   * @returns {array} An array of points
   */
  getPoints () {
    return this.points
  }

  /**
   * Getter method to get the zIndex of the line
   * @returns {number} The value of the zIndex
   */
  getZindex () {
    return this.zIndex
  }

  setZindex (index) {
    this.zIndex = index
  }
}
