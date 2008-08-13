var SSTabView = new Class({
  
  name: 'SSTabView',
  
  Extends: SSView,

  initialize: function(el)
  {
    this.parent(el);
    
    this.__selectedTab__ = -1;

    // check for default tab
    var defaultActiveTab = this.element._getElement('> .SSControlView .SSButton.SSActive');
    
    if(defaultActiveTab)
    {
      this.__selectedTab__ = this.indexOfTab(defaultActiveTab);
      this.selectTab(this.__selectedTab__);
    }
    
    // if none select the first
    if(this.__selectedTab__ == -1)
    {
      this.selectTab(0);
    }

    this.element.addEvent('click', this.eventDispatch.bind(this));
    
    // refresh the dimensions
    this.refresh();
  },
  
  
  eventDispatch: function(evt)
  {
    var theEvent = new Event(evt);
    var theTarget = $(evt.target);
    
    switch(true)
    {
      case (this.hitTest(theTarget, '> .SSControlView') != null):
        var hit = this.hitTest(theTarget, '> .SSControlView .SSButton');
        if(hit) this.selectTab(this.indexOfTab(hit));
      break;
      
      default:
      break;
    }
  },
  
  
  indexOfTabByName: function(name)
  {
    var tab = this.element._getElement('> .SSControlView #'+name);
    if(tab) 
    {
      return this.element._getElements('> .SSControlView > .SSButton').indexOf(tab);
    }
    else
    {
      return -1;
    }
  },
  
  
  indexOfTab: function(tabButton)
  {
    return this.element._getElements('> .SSControlView > .SSButton').indexOf(tabButton);
  },
  
  
  tabButtonForIndex: function(idx)
  {
    return this.element._getElements('> .SSControlView > .SSButton')[idx];
  },
  
  
  tabButtonForName: function(name)
  {
    return this.element._getElement('> .SSControlView #'+name);
  },
  
  
  contentViewForIndex: function(idx)
  {
    return this.element._getElements('> .SSContentView > div')[idx];
  },
  

  selectTabByName: function(name)
  {
    this.selectTab(this.indexOfTabByName(name));
  },
  

  selectTab: function(idx)
  {
    if(this.__selectedTab__ != idx)
    {
      // hide the last tab button and tab pane only if there was a last selected tab
      if(this.__selectedTab__ != -1)
      {
        this.tabButtonForIndex(this.__selectedTab__).removeClass('SSActive');

        // hide the last tab pane
        var lastTabPane = this.contentViewForIndex(this.__selectedTab__);
        var lastTabPaneController = this.controllerForNode(lastTabPane);

        if(lastTabPaneController)
        {
          lastTabPaneController.hide();
        }
        else
        {
          lastTabPane.removeClass('SSActive');
        }
      }

      // check to see if there is a view controller for the content view
      var controller = this.contentViewControllerForIndex(idx);
      if(controller)
      {
        controller.show();
        controller.refresh();
      }
      else
      {
        this.contentViewForIndex(idx).addClass('SSActive');
      }
      
      // hide the tab button
      this.tabButtonForIndex(idx).addClass('SSActive');
      
      this.__selectedTab__ = idx;
    }
  },
  
  
  addTab: function(name)
  {
    var tabButton = new Element('div', {
      'id': name,
      'class': "SSButton"
    });
    tabButton.set('text', name);
    var tabContent = new Element('div');
    
    tabButton.injectInside(this.element._getElement('> .SSControlView'));
    tabContent.injectInside(this.element._getElement('> .SSContentView'));
  },
  
  
  contentViewControllerForIndex: function(idx)
  {
    return this.controllerForNode(this.contentViewForIndex(idx));
  },
  
  
  activeTab: function()
  {
    return this.indexOfTab(this.element._getElement('> .SSControlView > .SSActive'));
  },
  
  
  removeTabByName: function(name)
  {
    this.removeTab(this.indexOfTabByName(name));
  },


  removeTab: function(idx)
  {
    // if removing selected tab, highlight a different tab
    if(this.activeTab() == idx)
    {
      this.selectTab(0);
    }
    
    // remove tab button
    this.tabButtonForIndex(idx).dispose();

    // Remove the controller
    var contentView = this.contentViewForIndex(idx);
    var controller = this.controllerForNode(contentView);
    
    if(controller)
    {
      // destroy the controller
      controller.destroy();
    }
    else
    {
      // remove the DOM element
      contentView.dispose();
    }
  },
  

  refresh: function()
  {
    var theControlView = this.element._getElement('> .SSControlView');
    var theContentView = this.element._getElement('> .SSContentView');
    
    // resize content view if it's supposed to autoresize
    if(theContentView.getProperty('autoresize'))
    {
      var size = this.element.getSize();
      var controlSize = theControlView.getSize();
    
      /*
      theContentView.setStyles({
        width: size.x-controlSize.x
      });
      */
    }
  }
  
});

// add it to the UI object if possible
if($type(ShiftSpace.UI) != 'undefined')
{
  ShiftSpace.UI.SSTabView = SSTabView;
}
