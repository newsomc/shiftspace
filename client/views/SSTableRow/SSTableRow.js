var SSTableRow = new Class({
  
  Extends: SSView,
  
  initialize: function(el)
  {
    this.parent(el);
    this.prepareAndSetModel(el);
  },
  
  
  setModel: function(model)
  {
    // prepareModel
    this.__model__ = model;
  },
  
  
  model: function()
  {
    return this.__model__;
  },
  
  
  prepareAndSetModel: function(el)
  {
    this.setModel(this.prepareModel(el));
  },
  
  
  prepareModel: function(model)
  {
    // prepare the model
    return model;
  },
  
  
  modelRowClone: function()
  {
    console.log('))))))))))))))))))))))))))))))))))))))))))))))))))))))) modelRowClone');
    return this.model().clone(true);
  },
  
  
  setDelegate: function(delegate)
  {
    this.parent(delegate);
  },
  
  
  setProperty: function(row, prop, value)
  {
    var propMethod = 'set'+prop.capitalize();
    var cell = row._getElement('> td[name='+prop+']');
    if(this[propMethod])
    {
      this[propMethod](cell, value);
    }
    else
    {
      cell.set('text', value);
    }
  },
  

  getProperty: function(row, prop)
  {
    var propMethod = 'get'+prop.capitalize();
    var cell = row._getElement('> td[name='+prop+']');
    if(this[propMethod])
    {
      return this[propMethod](cell, prop);
    }
    else
    {
      return cell.get('text');
    }
  }
  
});

// add it to the UI object if possible
if($type(ShiftSpace.UI) != 'undefined')
{
  ShiftSpace.UI.SSTableRow = SSTableRow;
}