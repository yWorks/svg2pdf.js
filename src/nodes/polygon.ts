import { Traverse } from './traverse'

export class Polygon extends Traverse {
  addclose(lines: any[]) {
    lines.push({ op: 'h' })
    return lines
  }
}
