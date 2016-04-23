"use babel"

import { CompositeDisposable } from "atom"

export default class IndentationLinesView {
  constructor(editor) {
    this.editor = editor
    this.subscriptions = new CompositeDisposable()

    this.gutter = this.editor.addGutter({ name: "indentation-lines", priority: 1000 })
    atom.views.getView(this.gutter).classList.add("indentation-lines")

    this.subscriptions.add(this.editor.observeCursors((cursor) => this.addLine(cursor)))
  }

  addLine(cursor) {
    const row = cursor.getBufferRow()
    const marker = this.editor.markBufferRange(this.findRange(row), { invalidate: "never" })

    this.gutter.decorateMarker(marker, { class: "indentation-line" })

    cursor.onDidChangePosition(({ newBufferPosition }) => {
      const { row } = newBufferPosition
      marker.setBufferRange(this.findRange(row))
    })

    cursor.onDidDestroy(() => {
      marker.destroy()
    })
  }

  findRange(row) {
    let indent = this.getIndent(row)
    const last = this.editor.getLastBufferRow()

    let prev = Math.max(0, row - 1)
    while (prev > 0 && this.isEmptyRow(prev)) prev -= 1
    const prevIndent = this.getIndent(prev)

    let next = Math.min(last, row + 1)
    while (next < last && this.isEmptyRow(next)) next += 1
    const nextIndent = this.getIndent(next)

    if (prevIndent == 0 && nextIndent == 0) return [[row, 0], [row, 0]]

    if (indent == 0 && prevIndent != 0 && nextIndent != 0) indent = Math.max(prevIndent, nextIndent)

    let start = Math.max(0, row - 1)
    let startIndent = this.getIndent(start)
    const prevLarger = prevIndent > indent
    while (start > 0 && ((prevLarger ? startIndent > indent : startIndent >= indent) || this.isEmptyRow(start))) {
      start -= 1
      startIndent = this.getIndent(start)
    }

    let end = Math.min(last, row + 1)
    let endIndent = this.getIndent(end)
    const nextLarger = nextIndent > indent
    while (end < last && ((nextLarger ? endIndent > indent : endIndent >= indent) || this.isEmptyRow(end))) {
      end += 1
      endIndent = this.getIndent(end)
    }

    if (prevIndent <= indent && nextIndent > indent) return [[row, 0], [end, 0]]
    if (prevIndent > indent && nextIndent <= indent) return [[start], [row, 0]]
    if (prevIndent <= indent && nextIndent <= indent) return [[start, 0], [end, 0]]

    return [[row, 0], [row, 0]]
  }

  getIndent(row) {
    return this.editor.indentationForBufferRow(row)
  }

  isEmptyRow(row) {
    return this.editor.lineTextForBufferRow(row).trim().length == 0
  }

  destroy() {
    this.subscriptions.dispose()
    this.gutter.destroy()
  }
}
