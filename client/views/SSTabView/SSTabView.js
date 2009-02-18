// ==Builder==
// @uiclass
// @required
// @package           ShiftSpaceCoreUI
// @dependencies      SSView
// ==/Builder==

var SSTabView = new Class({
  
  name: 'SSTabView',
  
  Extends: SSView,
  
  initialize: function(el, options)
  {
    this.setOptions(this.defaults(), options)
    
    this.parent(el, options);
    
    this.__selectedTab__ = -1;
    
    // check for default tab
    var defaultActiveTab = this.element.getElement('> .SSControlView > .SSButton.SSActive');
    
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
  
  
  /*
    Function: eventDispatch (private)
      Selects a tab on button hit.  If a tab    
    
    Paremeters:
      evt - A DOM node event 

    
  */
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
  
  /*
    Function: indexOfTabByName
      Takes the tab's class name and returns its index
    
    Pararmeter:
      name - class name of tab
    
    Return:
      Returns the index of a tab node if a contentView or tabPane name exists
      If a tab name doesn't exist, return -1
    
    See Also: 
      indexOfTab
  
  */
  
  indexOfTabByName: function(name)
  {
    var tab = this.element.getElement('> .SSControlView #'+name);
    
    // return tab index if we have it
    if(tab)
    {
      return this.indexOfTab(tab);
    }
    
    tab = this.element.getElement('> .SSContentView #'+name);
    
    // return content view index if we have it
    if(tab)
    {
      return this.indexOfContentView(tab);
    }
    
    // we couldn't find it
    return -1;
  },
  
  /*
    Funtion: indexOfTab
      Takes the class name of a tab and returns its nodes index 
    
    Parameters:
      tabButton -  SSButton class name of tab button
    
    Returns:
      Index node of tab 
      
    See Also:
      indexOfTabByName 
  */
  indexOfTab: function(tabButton)
  {
    return this.indexOfNode(this.element.getElements('> .SSControlView > .SSButton'), tabButton);
  },
  
  /*
    Funtion: tabButtonForIndex
      Takes the index of tab and returns its DOM node
    
    Parameters:
      idx - index of tab button 
    
    Returns:
      DOM node of tab
      
    See Also: 
      tabButtonForName
      
  */
  tabButtonForIndex: function(idx)
  {
    return this.element.getElements('> .SSControlView > .SSButton')[idx];
  },
  
  /*
    Funtion: tabButtonForName
      Takes the class name of tab and returns its DOM node 
    
    Parameters:
      name - id name of tab button 
    
    Returns:
      DOM node of tab
      
    See Also: 
      tabButtonForIndex
      
  */
  tabButtonForName: function(name)
  {
    return this.element.getElement('> .SSControlView #'+name);
  },
  
  /*
    Funtion: indexOfContentView
      Takes the class name of contentView Div
    
    Parameters:
      contentView - class name of contentView Div
    
    Returns:
      Index of contentView Div
      
    See Also: 
      indexOfTab
      
  */
  indexOfContentView: function(contentView)
  {
    return this.indexOfNode(this.element.getElements('> .SSContentView > .SSTabPane'), contentView);
  },
  
  /*
    Funtion: contentViewForIndex
      Takes the index of a SSContentView Div and returns its DOM node
    
    Parameters:
      idx - index of Tab
    
    Returns:
      DOM node of SSContentView
      
    See Also: 
      indexOfContentView
      
  */
  contentViewForIndex: function(idx)
  {
    return this.element.getElements('> .SSContentView > .SSTabPane')[idx];
  },
  
  /*
    Funtion: selectTabByName
      Selects a tab by its name
      
    Parameters:
      name - class name of Tab 
      
    See Also: 
      selectTab
  */
  selectTabByName: function(name)
  {
    this.selectTab(this.indexOfTabByName(name));
  },
  
  /* */
  selectedContentView: function()
  {
    // grab the DOM node
    var contentView = this.contentViewForIndex(this.__selectedTab__);
    // check for a controller
    var controller = this.controllerForNode(contentView);
    return (controller || contentView);
  },
  
  
  selectedTab: function()
  {
    return this.__selectedTab__;
  },
  

  selectTab: function(idx)
  {
    SSLog(this.element.getProperty('id') + ' selectTab ' + idx);
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
        SSLog('got controller');
        SSLog(lastTabPaneController);

        if(lastTabPaneController)
        {
          lastTabPaneController.hide();
        }
        else
        {
          lastTabPane.removeClass('SSActive');
        }
        
        this.fireEvent('tabDeselected', {tabView:this, tabIndex:this.__selectedTab__});
      }

      // check to see if there is a view controller for the content view
      var controller = this.contentViewControllerForIndex(idx);
      SSLog('>>>>>>>>>>>>>>>>>>>>>>>> getting tab content view controller');
      SSLog(controller);
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
      
      SSLog('Activating tab button');
      SSLog(this.tabButtonForIndex(idx));
      // hide the tab button
      this.tabButtonForIndex(idx).addClass('SSActive');
      
      this.__selectedTab__ = idx;
      
      //SSLog('fire tabSelected');
      this.fireEvent('tabSelected', {tabView:this, tabIndex:this.__selectedTab__});
      //SSLog('exit tabSelected');
    }
    else
    {
      SSLog('Tab already selected');
      this.fireEvent('tabClicked', {tabView:this, tabIndex:idx});
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
    
    tabButton.injectInside(this.element.getElement('> .SSControlView'));
    tabContent.injectInside(this.element.getElement('> .SSContentView'));
  },
  
  
  contentViewControllerForIndex: function(idx)
  {
    return this.controllerForNode(this.contentViewForIndex(idx));
  },
  
  
  activeTab: function()
  {
    return this.indexOfTab(this.element.getElement('> .SSControlView > .SSButton.SSActive'));
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
    var theControlView = this.element.getElement('> .SSControlView');
    var theContentView = this.element.getElement('> .SSContentView');
    
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