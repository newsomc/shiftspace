// ==Builder==
// @optional
// @package           ShiftSpaceCore
// ==/Builder==

// ==============
// = Exceptions =
// ==============

var SSCollectionError = SSException;

SSCollectionError.NoName = new Class({
  name:"SSCollectionError.NoName",
  Extends: SSCollectionError,
  Implements: SSExceptionPrinter
});

// =========================
// = Collection Management =
// =========================

var SSCollections = $H()

function SSCollectionForName(name)
{
  return SSCollections.get(name);
}

function SSSetCollectionForName(collection, name)
{
  SSCollections.set(name, collection);
}

function SSClearCollections()
{
  SSCollections.empty();
}

// ====================
// = Class Definition =
// ====================

var SSCollection = new Class({

  Implements: [Events, Options],

  name: "SSCollection",
  
  defaults: function()
  {
    return {
      table: null,
      fields: {}
    }
  },
  
  initialize: function(name, options)
  {
    this.setOptions(this.defaults(), options);
    this.setArray(this.options.array || []);
    
    if(name == null)
    {
      throw new SSCollectionError.NoName(new Error(), "collection instantiated without name.");
    }
    
    // a new collection
    this.setName(name);
    SSSetCollectionForName(this, name);
  },
  
  
  setName: function(name)
  {
    this.__name = name;
  },
  
  
  name: function()
  {
    return this.__name;
  },
  
  
  transact: function(action, options)
  {
    var payload = {
      action: action,
      table: this.table(),
      properties: this.options.properties,
      contrainsts: this.options.contraints,
      orderby: this.options.orderby,
      startIndex: this.options.startIndex,
      range: this.options.range
    };
    
    new Request({
      url: this.provider(),
      data: {desc: JSON.encode(payload)},
      onComplete: function(responseText, responseXml)
      {
        
      }.bind(this),
      onFailure: function(responseText, responseXml)
      {
        
      }.bind(this)
    }).send();
  },
  
  
  setProvider: function(url)
  {
    this.__provider = url;
  },
  
  
  provider: function()
  {
    return this.__provider;
  },
  
  
  setTable: function(table)
  {
    this.__table = table;
  },
  
  
  table: function()
  {
    return this.__table;
  },
  
  
  setArray: function(array)
  {
    this.__array = array;
  },
  
  
  getArray: function()
  {
    return this.__array;
  },
  
  
  get: function(index)
  {
    return this.__array[index];
  },
  
  
  push: function(object)
  {
    this.__array.push(object);
  },
  
  
  setMetadata: function(metadata)
  {
    this.__metadata = metadata;
  },
  
  
  metadata: function()
  {
    return this.__metadata;
  },
  
  
  length: function()
  {
    return this.__array.length;
  },
  
  
  add: function(obj)
  {
    this.__array.push(obj);
    
    this.fireEvent('onAdd');
    this.fireEvent('onChange');
  },
  
  
  remove: function(idx)
  {
    this.__array.splice(idx, 1);
    
    this.fireEvent('onRemove', idx);
    this.fireEvent('onChange');
  },
  
  
  insert: function(obj, idx)
  {
    this.__array.splice(idx, 0, obj);
    
    this.fireEvent('onInsert', {object:obj, index:idx});
    this.fireEvent('onChange');
  },
  
  
  move: function(fromIndex, toIndex)
  {
    
    this.fireEvent('onMove', {from:fromIndex, to:toIndex});
  },
  
  
  update: function(index, newValues)
  {
    this.__array[index] = $merge(this.__array[index], newValues);
    
    this.fireEvent('onUpdate');
  },
  
  
  set: function(obj, index)
  {
    this.__array[index] = obj;
  },
  
  
  load: function(index, count)
  {
    // actually load content
  },
  
  
  each: function(fn)
  {
    this.__array.each(fn);
  }

});