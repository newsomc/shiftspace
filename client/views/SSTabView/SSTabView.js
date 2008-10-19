var SSTabView = new Class({
  
  name: 'SSTabView',
  
  Extends: SSView,

  initialize: function(el, options)
  {
    this.parent(el);
    
    this.__selectedTab__ = -1;

    // check for default tab
    var defaultActiveTab = this.element._getElement('> .SSControlView .SSButton.SSActive');
    
    if(defaultActiveTab)
    {
      var idx = this.indexOfTab(defaultActiveTab);
      // force selection of default tab
      this.selectTab(idx);
      this.__selectedTab__ = idx;
    }
    
    // if none select the first
    if(this.__selectedTab__ == -1)
    {
      this.selectTab(0);
    }

    this.element.addEvent('click', this.eventDispatch.bind(this));
    
    //SSLog('refresh SSTabView');
    // refresh the dimensions
    this.refresh();
    //SSLog('SSTabView initialized');
  },
  
  
  eventDispatch: function(evt)
  {
    //SSLog('eventDispatch');

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
    
    // return tab index if we have it
    if(tab)
    {
      return this.indexOfTab(tab);
    }
    
    tab = this.element._getElement('> .SSContentView #'+name);
    
    // return content view index if we have it
    if(tab)
    {
      return this.indexOfContentView(tab);
    }
    
    // we couldn't find it
    return -1;
  },
  
  
  indexOfTab: function(tabButton)
  {
    return this.indexOfNode(this.element._getElements('> .SSControlView > .SSButton'), tabButton);
  },
  
  
  tabButtonForIndex: function(idx)
  {
    return this.element._getElements('> .SSControlView > .SSButton')[idx];
  },
  
  
  tabButtonForName: function(name)
  {
    return this.element._getElement('> .SSControlView #'+name);
  },
  
  
  indexOfContentView: function(contentView)
  {
    return this.indexOfNode(this.element._getElements('> .SSContentView > .SSTabPane'), contentView);
  },
  
  
  contentViewForIndex: function(idx)
  {
    return this.element._getElements('> .SSContentView > .SSTabPane')[idx];
  },
  

  selectTabByName: function(name)
  {
    this.selectTab(this.indexOfTabByName(name));
  },
  
  
  selectedContentView: function()
  {
    // grab the DOM node
    var contentView = this.contentViewForIndex(this.__selectedTab__);
    // check for a controller
    var controller = this.controllerForNode(contentView);
    return (controller || contentView);
  },
  

  selectTab: function(idx)
  {
    SSLog(this.element.getProperty('id') + ' selectTab ' + idx, SSLogForce);
    if(this.__selectedTab__ != idx)
    {
      // hide the last tab button and tab pane only if there was a last selected tab
      if(this.__selectedTab__ != -1)
      {
        this.tabButtonForIndex(this.__selectedTab__).removeClass('SSActive');

        // hide the last tab pane
        var lastTabPane = this.contentViewForIndex(this.__selectedTab__);
        //SSLog('controller for last tab ' + lastTabPane + ' ' + $uid(lastTabPane));
        var lastTabPaneController = this.controllerForNode(lastTabPane);
        SSLog('got controller', SSLogForce);
        SSLog(lastTabPaneController, SSLogForce);

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
      SSLog('>>>>>>>>>>>>>>>>>>>>>>>> getting tab content view controller', SSLogForce);
      SSLog(controller, SSLogForce);
      if(controller)
      {
        //SSLog('showing controller');
        controller.show();
        //SSLog('refreshing controller');
        controller.refresh();
      }
      else
      {
        this.contentViewForIndex(idx).addClass('SSActive');
      }
      
      SSLog('Activating tab button', SSLogForce);
      SSLog(this.tabButtonForIndex(idx), SSLogForce);
      // hide the tab button
      this.tabButtonForIndex(idx).addClass('SSActive');
      
      this.__selectedTab__ = idx;
      
      //SSLog('fire tabSelected');
      this.fireEvent('tabSelected', {tabView:this, tabIndex:this.__selectedTab__});
      //SSLog('exit tabSelected');
    }
    else
    {
      SSLog('Tab already selected', SSLogForce);
    }
  },
  
  
  addTab: function(name)
  {
    var tabButton = new Element('div', {
      'id': name,
      'class': "SSButton"
    });
    tabButton.set('text', name);
    var tabContent = new Element('div', {
      'class': 'SSTabPane'
    });
    
    tabButton.injectInside(this.element._getElement('> .SSControlView'));
    tabContent.injectInside(this.element._getElement('> .SSContentView'));
  },
  
  
  contentViewControllerForIndex: function(idx)
  {
    //SSLog('contentViewControllerForIndex ' + idx + ' ' + this.contentViewForIndex(idx));
    return this.controllerForNode(this.contentViewForIndex(idx));
  },
  
  
  activeTab: function()
  {
    return this.indexOfTab(this.element._getElement('> .SSControlView > .SSActive'));
  },
  
  
  hideTabByName: function(name)
  {
    this.hideTab(this.indexOfTabByName(name));
  },
  
  
  hideTab: function(index)
  {
    this.tabButtonForIndex(index).addClass('SSDisplayNone');
    this.contentViewForIndex(index).addClass('SSDisplayNone');
  },
  
  
  revealTabByName: function(name)
  {
    this.revealTab(this.indexOfTabByName(name));
  },
  
  
  revealTab: function(index)
  {
    this.tabButtonForIndex(index).removeClass('SSDisplayNone');
    this.contentViewForIndex(index).removeClass('SSDisplayNone');
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
    
    // refresh the selected content view as well
    var contentView = this.selectedContentView();
    if(contentView.refresh) contentView.refresh();
  }
  
});

// add it to the UI object if possible
if($type(ShiftSpace.UI) != 'undefined')
{
  ShiftSpace.UI.SSTabView = SSTabView;
}
