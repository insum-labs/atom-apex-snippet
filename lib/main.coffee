'use babel';

require('./atom-apex-snippet');

const OracleProvider = require('./provider.js');
let completionProvider;
class Provider {


    activate(){
        this.completionProvider = new OracleProvider();
        completionProvider = this.completionProvider;
        atom.commands.add('atom-text-editor', 'autocomplete-oracle:test', function() {
          completionProvider.expandSnippet();
        })

    }

    getProvider(){
        return this.completionProvider;
    }
}



//module.exports = new Provider();


module.exports =
  CoffeeView: null
  modalPanel: null
  subscriptions: null
  config:
    commaPlacement:
      title: 'Comma Preference'
      description: 'Commas appear before/after parameters'
      type: 'string'
      default: 'Before'
      enum: ['Before','After']
      order: 10
