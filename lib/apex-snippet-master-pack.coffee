CoffeeView = require './apex-snippet-master-pack-view'
{CompositeDisposable} = require 'atom'
fs = require 'fs'

module.exports =
  CoffeeView: null
  modalPanel: null
  subscriptions: null

  activate: (state) ->
    @CoffeeView = new CoffeeView(state.CoffeeViewState)
    @modalPanel = atom.workspace.addModalPanel(item: @CoffeeView.getElement(), visible: false)
    # Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    @subscriptions = new CompositeDisposable

    # Register command that toggles this view
    @subscriptions.add atom.commands.add 'atom-workspace',
      'apex-snippet-master-pack:preComma': => @preComma()
    @subscriptions.add atom.commands.add 'atom-workspace',
      'apex-snippet-master-pack:postComma': => @postComma()
    @subscriptions.add atom.commands.add 'atom-workspace',
      'apex-snippet-master-pack:preCommaCaps': => @preCommaCaps()
    @subscriptions.add atom.commands.add 'atom-workspace',
      'apex-snippet-master-pack:postCommaCaps': => @postCommaCaps()
    @subscriptions.add atom.commands.add 'atom-workspace',
      'CoffeeView:toggle': => @toggle()

  deactivate: ->
    @subscriptions.dispose()
    @modalPanel.destroy()
    @CoffeeView.destroy()

  serialize: ->
    # CoffeeViewState: @CoffeeView.serialize()

  toggle: ->
    console.log('View was toggled!')
    if @modalPanel.isVisible()
      @modalPanel.hide()
    else
      @modalPanel.show()

  preComma: ->
    console.log('Convert text!')
    data = fs.readFileSync(process.env.ATOM_HOME+'\\packages\\apex-snippet-master-pack\\lib\\scrapedsnippets.cson')
    fs.writeFileSync(process.env.ATOM_HOME + '\\packages\\apex-snippet-master-pack\\snippets\\snippets.cson', "")
    fs.writeFileSync(process.env.ATOM_HOME + '\\packages\\apex-snippet-master-pack\\snippets\\snippets.cson', data)
    console.log('wrote preComma to snippets/snippets.cson')
    @toggle()

  postComma: ->
    console.log('Convert text!')
    data = fs.readFileSync(process.env.ATOM_HOME+'\\packages\\apex-snippet-master-pack\\lib\\scrapedSnippetCommaEnds.cson')
    fs.writeFileSync(process.env.ATOM_HOME + '\\packages\\apex-snippet-master-pack\\snippets\\snippets.cson', "")
    fs.writeFileSync(process.env.ATOM_HOME + '\\packages\\apex-snippet-master-pack\\snippets\\snippets.cson', data)
    console.log('wrote postComma to snippets/snippets.cson')
    @toggle()

  preCommaCaps: ->
    console.log('Convert text!')
    data = fs.readFileSync(process.env.ATOM_HOME+'\\packages\\apex-snippet-master-pack\\lib\\scrapedSnippetUpperCases.cson')
    fs.writeFileSync(process.env.ATOM_HOME + '\\packages\\apex-snippet-master-pack\\snippets\\snippets.cson', "")
    fs.writeFileSync(process.env.ATOM_HOME + '\\packages\\apex-snippet-master-pack\\snippets\\snippets.cson', data)
    console.log('wrote preCommaCaps to snippets/snippets.cson')
    @toggle()

  postCommaCaps: ->
    console.log('Convert text!')
    data = fs.readFileSync(process.env.ATOM_HOME+'\\packages\\apex-snippet-master-pack\\lib\\scrapedSnippetUpperCaseCommaEnds.cson')
    fs.writeFileSync(process.env.ATOM_HOME + '\\packages\\apex-snippet-master-pack\\snippets\\snippets.cson', "")
    fs.writeFileSync(process.env.ATOM_HOME + '\\packages\\apex-snippet-master-pack\\snippets\\snippets.cson', data)
    console.log('wrote postCommaCaps to snippets/snippets.cson')
    @toggle()
