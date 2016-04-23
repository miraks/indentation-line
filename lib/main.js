"use babel"

import { CompositeDisposable } from "atom"
import IndentationLinesView from "./indentation-lines-view"

export default {
  activate() {
    this.subscriptions = new CompositeDisposable()

    this.subscriptions.add(atom.workspace.observeTextEditors((editor) => {
      new IndentationLinesView(editor)
    }))
  },

  deactivate() {
    this.subscriptions.dispose()
  }
}
