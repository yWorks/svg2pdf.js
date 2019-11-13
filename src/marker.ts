/**
 * @param {string} id
 * @param {[number,number]} anchor
 * @param {number} angle
 */
export default class Marker {
  public id: string
  public anchor: number[]
  public angle: number

  constructor(id: string, anchor: number[], angle: number) {
    this.id = id
    this.anchor = anchor
    this.angle = angle
  }
}
