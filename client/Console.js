/*
  Class: Console
    Singleton object representing the ShiftSpace Console.  The single can be access via ShiftSpace.Console.
*/
var Console = new Class({
  
  initialize: function(options) {
    this.shiftCount = 0;
    
    //SSLog('Console buildFrame');
    this.buildFrame();
    
    // add a window resize event, so the resizer is in the right place
    window.addEvent('resize', function() {
      // refresh if ShiftSpace isn't in fullscreen mode
      if(!ShiftSpaceIsHidden()) this.refresh();
    }.bind(this));
    
    // Attach some events that we care about
    SSAddEvent('onSpaceInstall', this.onSpaceInstall.bind(this));
    SSAddEvent('onSpaceUninstall', this.onSpaceUninstall.bind(this));
    
    SSAddEvent('onShiftEdit', this.editShift.bind(this));
    
    SSAddEvent('onUserLogin', this.handleLogin.bind(this));
    SSAddEvent('onUserLogout', this.handleLogout.bind(this));
    
    SSAddEvent('onShiftUpdate', this.updateShiftPrivacy.bind(this));
    
    SSAddEvent('onPluginStatusChange', this.updatePluginIconForShift.bind(this));

  },
  
  /*
  
  Function: buildFrame
  Build the iframe that will hold the console.
  
  */
  buildFrame: function() {
    var consoleHeight = Math.min(getValue('console.height', 150), 150);
    
    this.frameWrapper = new ShiftSpace.Element('div', {
      id: "SSConsoleFrameWrapper",
      styles:
      {
        height: 150,
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        overflow: 'hidden',
        'z-index': '1000001',
        opacity: 0.9,
        height: '150px'
      }
    });
    
    this.frame = new ShiftSpace.Iframe({
      id: 'ShiftSpaceConsole',
      addCover: false,
      /* set the styles here so that users doesn't see the console because of css load delay */
      styles:
      {
        /*
        height: 150,
        display: 'none',
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        overflow: 'hidden',
        'z-index': '1000001',
        opacity: 0.9,
        height: '150px'
        */
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      },
      onload: function() 
      {
        //SSLog('>>>>>>>>>>>>>>>>>>>>>>>>>> frame loaded');
        // store a ref for convenience
        this.doc = this.frame.contentDocument;
        
        //SSLog('createShiftEntryModel');
        // create the model shift
        this.createShiftEntryModel();
        //SSLog('done createShiftEntryModel');

        // load the style for document
        //SSLog('load console frame style');
        this.loadStyle();

        this.doc.addEventListener('keydown',  keyDownHandler.bind(ShiftSpace), false);
        this.doc.addEventListener('keyup',    keyUpHandler.bind(ShiftSpace), false);
        this.doc.addEventListener('keypress', keyPressHandler.bind(ShiftSpace), false);

      }.bind(this)
    });
    //SSLog('frame injecting');
    
    this.frameWrapper.injectInside(document.body);
    this.frame.injectInside(this.frameWrapper);
    //SSLog('finished frame injecting');
    
    //SSLog('creating resizer');
    this.resizer = new ShiftSpace.Element('div', {
      'id': 'SSConsoleResizer',
      'style': 
      {
        'bottom': consoleHeight - 5
      }
    });
    
    //SSLog('injecting resizer');
    this.resizer.injectInside(document.body);
    //SSLog('done injecting resizer');
    
    //SSLog('test resizer getStyle top: ' + this.resizer.getStyle('top'));

    // to prevent things from dropping into the iframe.
    this.resizeMask = new ShiftSpace.Element('div', {
      id: 'SSConsoleResizeMask'
    });

    //SSLog('making resizer draggable');
    this.resizer.makeDraggable({
      limit: 
      {
        x: [25, 25]
      },
      
      onStart: function() 
      {
        this.startDrag = this.resizer.getPosition().y;
        this.startHeight = this.getHeight();
        this.resizeMask.injectInside(document.body);
      }.bind(this),
      
      onDrag: function() 
      {
        var dy = this.resizer.getPosition().y - this.startDrag;
        this.setHeight(this.startHeight - dy);
        this.refresh();
      }.bind(this),
      
      onComplete: function() {
        this.resizeMask.remove();
        setValue('console.height', this.getHeight());
      }.bind(this)
      
    });
    
    this.resizer.setStyle('position', 'fixed');
    //SSLog('frame built');
  },
    
  buildNotifier: function() 
  {
    this.notifier = new ShiftSpace.Element('div', {
      'class': 'SSConsoleNotifier',
      styles : 
      {
        display: 'none'
      }
    });
        
    var img = new ShiftSpace.Element('img', {
      src: server + 'images/Console/notifier-icon.png',
      alt: 'ShiftSpace',
      styles: {
        cursor: 'pointer'
      }
    });
    img.injectInside(this.notifier);
    this.notifier.injectInside(document.body);
    
    img.addEvent('click', function() {
      if (!this.isVisible()) 
      {
        this.show();
      } 
      else if (this.getHeight() == 0) 
      {
        //this.frame.setStyle('height', getValue('console.height', 150));
        this.setHeight(150);
        this.refresh();
      } 
      else 
      {
        this.hide()
      }
    }.bind(this));
    
    this.notifierFx = new Fx.Style(this.notifier, 'bottom', {
      duration: 800,
      transition: Fx.Transitions.Quad.easeOut
    });
    
    // Call private console is ready function
    SSConsoleIsReady();
  },
  
  
  /*
  
  Function: buildPluginMenu
  Builds the plug-in menu for the console.
  
  */
  buildPluginMenu: function()
  {
    // the tab connecting the icon to the menu
    this.pluginMenuTab = new ShiftSpace.Element('div');
    this.pluginMenuTab.setStyle('display', 'none');
    this.pluginMenuTab.setProperty('id', "SSConsolePluginMenuTab");

    this.pluginMenuTabIcon = new ShiftSpace.Element('div');
    this.pluginMenuTabIcon.addClass('SSPluginMenuTabIcon SSUserSelectNone');
    this.pluginMenuTabIcon.injectInside(this.pluginMenuTab);
    
    this.pluginMenu = new ShiftSpace.Element('div');
    this.pluginMenu.setStyle('display', 'none');
    this.pluginMenu.setProperty('id', 'SSConsolePluginMenu');
    this.pluginMenu.addClass('SSMenu SSUserSelectNone');

    this.topItem = new ShiftSpace.Element('div');
    this.topItem.addClass('SSMenuTopItem');
    this.topItem.addClass('item');
    this.topItem.setHTML("<div class='SSLeft'><span>Top Item</span></div><div class='SSRight'></div>");
    
    this.middleItem = new ShiftSpace.Element('div');
    this.middleItem.addClass('SSMenuItem');
    this.middleItem.addClass('item');
    this.middleItem.setHTML("<div class='SSLeft'><span>Middle Item</span></div><div class='SSRight'></div>");
    
    this.menuItemModel = this.middleItem.clone(true);
    
    this.bottomItem = new ShiftSpace.Element('div');
    this.bottomItem.addClass('SSMenuBottomItem');
    this.bottomItem.addClass('item');
    this.bottomItem.setHTML("<div class='SSLeft'><span>Bottom Item</span></div><div class='SSRight'></div>");
    
    this.topItem.injectInside(this.pluginMenu);
    this.middleItem.injectInside(this.pluginMenu);
    this.bottomItem.injectInside(this.pluginMenu);
    
    this.pluginMenuTab.addClass('SSDisplayNone');
    this.pluginMenu.addClass('SSDisplayNone');

    this.pluginMenuTab.injectInside(document.body);
    this.pluginMenu.injectInside(document.body);
    
    // handle closing the plugin menu if anything else gets clicked
    $(this.doc.body).addEvent('click', function(_evt) {
      var evt = new Event(_evt);
      var target = $(evt.target);
      
      if(!target.hasClass('plugin') &&
         !$(this.pluginMenu).hasChild(target))
      {
        this.hidePluginMenu();
      }
    }.bind(this));
    
    loadStyle('styles/ShiftSpace.css', null, this.frame );
  },
  
  /*
    Function: setPluginMenuItems
      Set the items for the plugin menu.
  */
  setPluginMenuItems: function(shiftId, _itemsAndActions)
  {
    var itemsAndActions = _itemsAndActions;
    
    SSLog('itemsAndActions');
    SSLog(itemsAndActions);
    
    if(!itemsAndActions.delayed)
    {
      // remove all the menu items
      $(this.pluginMenu).getElements('.SSMenuItem').each(function(x) {x.remove();});

      for(var i = 0; i < itemsAndActions.length; i++)
      {
        // default enabled to true
        var cia = $merge({enabled:true}, itemsAndActions[i]);
        
        var txt = cia.text;
        var cb = cia.callback;
        var enabled = cia.enabled;
      
        var span;
        if(i == 0)
        {
          span = this.pluginMenu.getElement('.SSMenuTopItem span');
          
          this.topItem.removeEvents();
          this.topItem.addEvent('click', cb.bind(null, shiftId));
        }
        else if(i == itemsAndActions.length-1)
        {
          span = this.pluginMenu.getElement('.SSMenuBottomItem span');

          this.bottomItem.removeEvents();
          this.bottomItem.addEvent('click', cb.bind(null, shiftId));
        }
        else
        {
          var newItem = this.menuItemModel.clone(true);
        
          span = newItem.getElement('span');

          newItem.removeEvents();
          newItem.addEvent('click', cb.bind(null, shiftId));
          newItem.injectBefore(this.pluginMenu.getElement('.SSMenuBottomItem'));
        }
        
        span.setText(txt);
        if(!enabled) 
        {
          span.addClass('SSDisabledMenuItem');
        }
        else
        {
          span.removeClass('SSDisabledMenuItem');
        }
      }
    }
    else
    {
      // remove all the menu items
      $(this.pluginMenu).getElements('.SSMenuItem').each(function(x) {x.remove();});
      
      // show a loading menu
      this.pluginMenu.getElement('.SSMenuTopItem span').setText("One moment");
      this.topItem.removeEvents();
      this.pluginMenu.getElement('.SSMenuBottomItem span').setText("loading...");
      this.bottomItem.removeEvents();
    }
  },
  
  pluginLoaded: function(plugin)
  {
    // better
  },
  
  plugInActionForItem: function(item)
  {
    // better
  },
  
  /*
    Function: showPluginMenu
      Show the plugin menu.
  */
  showPluginMenu: function(plugin, anchor)
  {
    var pos = $(anchor).getPosition([$(this.doc.getElementById('scroller'))]);
    //var framePos = this.frame.getPosition();
    var framePos = this.frameWrapper.getPosition();
    var size = $(anchor).getSize().size;
    
    var pluginMenu = $(this.pluginMenu);
    var pluginMenuTab = $(this.pluginMenuTab);
    var pluginMenuTabIcon = $(this.pluginMenuTabIcon)
    
    // clear out the display none styles
    pluginMenu.setStyle('display', '');
    pluginMenuTab.setStyle('display', '');
    
    pluginMenuTabIcon.addClass(plugin.menuIcon());

    pluginMenuTab.setStyles({
      left: pos.x-6,
      /*top: pos.y-3+framePos.y*/
      bottom: this.getHeight()-pos.y-19
    });
    pluginMenu.setStyles({
      left: pos.x-15, 
      bottom: this.getHeight()-pos.y+2
    });
    
    pluginMenu.removeClass('SSDisplayNone');
    pluginMenuTab.removeClass('SSDisplayNone');
  },
  
  showPluginMenuForShift: function(plugin, shiftId)
  {
    var target = _$(this.doc.getElementById(shiftId)).getElementByClassName('pg' + plugin);
    // in case it's delayed
    var cb = function(menuItems) {
      this.setPluginMenuItems(shiftId, menuItems);
    }.bind(this);
    this.setPluginMenuItems(shiftId, plugins[plugin].menuForShift(shiftId, cb));
    this.showPluginMenu(plugins[plugin], target);
  },
  
  /*
    Function: hidePluginMenu
      Hide the plugin menu.
  */
  hidePluginMenu: function()
  {
    if(this.pluginMenu) this.pluginMenu.addClass('SSDisplayNone');
    if(this.pluginMenuTab) this.pluginMenuTab.addClass('SSDisplayNone');
  },
  

  showNotifier: function() 
  {
    if(!this.isVisible())
    {
      if (this.cancelNotifier) 
      {
        this.loadShifts();
      } 
      else 
      {
        this.notifier.setStyle('display', '');
        this.notifier.removeClass('SSDisplayNone');

        //SSLog('start animation for notifier');
        this.notifierFx.start(-32, 0).chain(function() {
          this.loadShifts();
          this.hideNotifier.delay(3000, this);
        }.bind(this));
      }
      this.hideNotifier.delay(3000, this);
    }
  },
  
  
  hideNotifier: function() 
  {
    if (!this.cancelNotifier) 
    {
      this.cancelNotifier = true;
      this.notifierFx.start(0, -32);
    }
  },
  
  
  /*
    Function : loadStyle
      Load the style for console.
  */
  loadStyle: function() {
    /* Load console styles */
    loadStyle('styles/Console.css', function() {
      this.buildNotifier();
      this.buildContents();
      /* Load all plugin styles */
      for(var plugin in installedPlugins)
      {
        // FIXME: erg style bug - David
        //loadStyle('plugins/'+plugin+'/'+plugin+'.css', null, this.frame );
        loadStyle('plugins/'+plugin+'/Console.css', null, this.frame);
      }
      loadStyle('styles/ShiftSpace.css', this.buildPluginMenu.bind(this), this.frame );
    }.bind(this), this.frame );
  },
  
  /*
  
  Function: buildContents
  Builds the console area.
  
  */
  buildContents: function() {
    //SSLog('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< LOADED BUILD CONTENTS');

    var content = $(this.doc.createElement('div'));
    content.setAttribute('id', 'console');
    content.setHTML('<div class="outer"><div class="inner">' +
                    '<div id="top"><div id="tabs" class="SSUserSelectNone">' +
                    '<div id="controls">' +
                    '<div id="loginStatus">You are not logged in</div>' +
                    '<div id="auth" class="button auth"><div class="image"></div></div>' +
                    '<div id="bugs" class="button bugs"><div class="image" title="File a bug report"></div></div>' +
                    '<div id="hide" class="button hide"><div class="image" title="Minimize console"></div></div>' +
                    '<br class="clear" />' +
                    '</div>' +
                    '<br class="clear" />' +
                    '</div></div></div></div>' +
                    '<div class="left"><div class="right">' +
                    '<div id="bottom">' +
                    '<div id="actions"></div>' +
                    '<div id="scroller"></div>' +
                    '</div></div></div>');
    content.injectInside(this.doc.body);
    
    //SSLog('<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< BASICS DONE');
    
    var controls = $(this.doc.getElementById('controls'));
    //SSLog('got controls');
    
    var auth = $(this.doc.getElementById('auth'));
    auth.addEvent('mouseover', function() {
      auth.addClass('hover');
    });
    auth.addEvent('mouseout', function() {
      auth.removeClass('hover');
    });
    auth.addEvent('click', function(_evt) {
      if (ShiftSpace.User.getUsername()) 
      {
        ShiftSpace.User.logout();
      } 
      else 
      {
        SSLog('SHOW TAB LOGIN');
        this.showTab('login');
      }
      //SSLog('setup auth control');
      this.setupAuthControl();
    }.bind(this));
    //SSLog("auth init'ed");
    this.setupAuthControl();
    //SSLog('auth setup');
    
    var bugReport = $(this.doc.getElementById('bugs'));
    bugReport.addEvent('mouseover', function() {
      bugReport.addClass('hover');
    });
    bugReport.addEvent('mouseout', function() {
      bugReport.removeClass('hover');
    });
    bugReport.addEvent('click', function() {
      window.open('http://metatron.shiftspace.org/trac/newticket');
    });
    
    var hide = $(this.doc.getElementById('hide'));
    hide.addEvent('mouseover', function() {
      hide.addClass('hover');
    });
    hide.addEvent('mouseout', function() {
      hide.removeClass('hover');
    });
    hide.addEvent('click', function() {
      hide.removeClass('hover');
      this.hide();
    }.bind(this));
    
    //SSLog('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> TABS');
    this.addTab('shifts', '0 shifts');
    this.addTab('settings', 'Settings', 'icon-settings.gif');
    
    if (!ShiftSpace.User.isLoggedIn()) {
      this.addTab('login', 'Login');
    }
    
    //SSLog('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> LOGIN');
    this.buildLogin();
    //SSLog('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SETTINGS');
    this.buildSettings();
    //SSLog('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> SHOW TAB');
    this.showTab('shifts');
    
    //SSLog('contents built');
  },
  
  
  setupAuthControl: function() {
    SSLog('setupAuthControl');
    var auth = $(this.doc.getElementById('auth'));
    if (!auth) {
      return;
    }
    //SSLog('auth setup');
    var loginStatus = $(this.doc.getElementById('loginStatus'));
    if (ShiftSpace.User.isLoggedIn()) 
    {
      auth.removeClass('login');
      auth.addClass('logout');
      auth.setAttribute('title', 'Logout');
      loginStatus.setHTML('Logged in as <b>' + ShiftSpace.User.getUsername() + '</b>');
      // TODO: Bad place for this a hack - David
      this.updateDefaultShiftStatus();
    } 
    else 
    {
      auth.removeClass('logout');
      auth.addClass('login');
      auth.setAttribute('title', 'Login');
      loginStatus.setText('You are not logged in');
    }
    //SSLog('auth setup done');
  },
  
  
  buildSettings: function() 
  {
    var sections = this.createSubSections('settings', ['General', 'Spaces', 'Account']);
    if (!ShiftSpace.User.isLoggedIn()) {
      this.hideSubTab('settings', 2);
    }
    
    /*
      WARNING: THE USER MIGHT NOT HAVE BEEN LOGGED IN YET SO GRABBING PREFS WILL FAIL, APPROPIATE METHODS
               MUST BE CALLED FROM handleLogin - DAVID
    */
    
    var default_shift_status = SSGetDefaultShiftStatus(true);

    if (default_shift_status == 1) {
      default_shift_status = ' checked';
    } else {
      default_shift_status = '';
    }
    
    var defaultEmailComments = ShiftSpace.User.getEmailCommentsDefault();


    if (defaultEmailComments == 1) 
    {
      defaultEmailComments = ' checked';
    } 
    else 
    {
      defaultEmailComments = '';
    }
    
    $(sections[0]).setHTML('<div class="form-column">' +
                        '<div class="input"><div id="default_privacy" class="checkbox' + default_shift_status + '"></div>' +
                        '<div class="label">Set my shifts public by default</div>' +
                        '<br class="clear" /></div>' +
                        '<div class="input"><div id="default_comments" class="checkbox' + defaultEmailComments + '"></div>' +
                        '<div class="label">Email me when someone comments my shifts</div>' +
                        '<br class="clear" /></div>' +
                        '<div class="input"><label for="server-input">Server address:</label>' +
                        '<input type="text" name="server" value="' + server + '" id="server-input" size="40" class="text" />' +
                        '</div><br class="clear" />');
                        
    //SSLog('buildSettings - done setting html');
    
    $(SSGetElementByClass('form-column', sections[0])).setStyle('padding-top', 20);
    
    var default_privacy = $(this.doc.getElementById('default_privacy'))

    default_privacy.addEvent('click', function(_evt) {
      var init_privacy = $(this.doc.getElementById('init_privacy'));
      if (!default_privacy.hasClass('checked')) 
      {
        default_privacy.addClass('checked');
        SSSetDefaultShiftStatus(1);
        if (init_privacy) 
        {
          init_privacy.addClass('checked');
        }
      } 
      else 
      {
        default_privacy.removeClass('checked');
        SSSetDefaultShiftStatus(2);
        if (init_privacy) 
        {
          init_privacy.removeClass('checked');
        }
      }
    }.bind(this));
    
    var defaultEmailCommentCheckBox = $(this.doc.getElementById('default_comments'));
    defaultEmailCommentCheckBox.addEvent('click', function(_evt) {
      if (!defaultEmailCommentCheckBox.hasClass('checked')) 
      {
        defaultEmailCommentCheckBox.addClass('checked');
        ShiftSpace.User.setEmailCommentsDefault(1);
      } 
      else 
      {
        defaultEmailCommentCheckBox.removeClass('checked');
        ShiftSpace.User.setEmailCommentsDefault(0);
      }
    }.bind(this));
    
    //SSLog('form style set');
    
    var serverInput = $(this.doc.getElementById('server-input'));
    serverInput.addEvent('change', function() {
      var newServer = serverInput.value;
      if (newServer.substr(newServer.length - 2, 1) != '/') {
        newServer = newServer + '/';
      }
      if (newServer.substr(0, 7) != 'http://' &&
          newServer.substr(0, 8) != 'https://') {
        newServer = 'http://' + newServer;
      }
      serverInput.value = newServer;
      GM_xmlhttpRequest({
        method: 'GET',
        url: serverInput.value + 'method=version',
        onload: function(rx) {
          if (rx.responseText == version) {
            setValue('server', serverInput.value);
          } else {
            alert('Sorry, that server address returned an invalid response.');
            serverInput.value = server;
            SSLog(rx.responseText);
          }
        }
      });
    });
    
    $(sections[1]).setHTML('<form action="' + server + '">' +
                        '<label for="install-space">Install a space</label>' +
                        '<input style="float:left" type="text" name="space" id="install-space" class="text" size="40" />' +
                        '<input style="float:right" type="submit" value="Install" class="submit" />' +
                        '</form>');
    $(sections[1]).setStyles({
      padding: '10px 20px'
    });
    var form = sections[1].getElementsByTagName('form')[0];
    form.id = 'installedSpacesForm';
    
    //SSLog('buildSettings - done with form ' + form);
    
    for (var space in installed) 
    {
      var newSpace = this.installedSpace(space);
      //SSLog('newSpace ' + newSpace);
      $(newSpace).injectAfter(form);
    }
    
    //SSLog('buildSettings - added spaces');
    
    form.addEvent('submit', function(e) {
      new Event(e).preventDefault();
      var spaceInput = this.doc.getElementById('install-space');
      var space = spaceInput.value;
      if (space == '') return;

      SSInstallSpace(space);
      
    }.bind(this));
    
    $(sections[2]).setHTML(
      '<form action="' + server + 'server/" style="padding-top: 15px;" id="settings-account">' +
        '<div class="form-column">' +
          '<label for="account-password">Change your password</label>' +
          '<input type="password" name="account-password" id="account-password" class="text" />' +
          '<label for="account-password">Type your new password again</label>' +
          '<input type="password" name="account-passwordagain" id="account-passwordagain" class="text float-left" />' +
          '<label for="account-password">Change your email</label>' +
          '<input type="text" name="account-email" id="account-email" class="text" />' +
          '<label for="account-name">Change your display name</label>' +
          '<input type="text" name="account-name" id="account-name" class="text float-left" />' +
          '<br class="clear" />' +
          '<input type="submit" value="Save" class="clear" />' +
          '<br class="clear" />' +
        '</div>' +
        '<br class="clear" />' +
        '<div id="account-response" class="response"></div>' +
      '</form>'
    );
    
    $(this.doc.getElementById('settings-account')).addEvent('submit', function(e) {
      new Event(e).preventDefault();
      
      var info = {};
      
      var password = this.doc.getElementById('account-password').value;
      var passwordAgain = this.doc.getElementById('account-passwordagain').value;
      var email = this.doc.getElementById('account-email').value;
      var username = this.doc.getElementById('account-name').value;
      
      if(password)
      {
        info.password = password;
        info.password_again = passwordAgain;
      }
      
      if(email) info.email = email;
      if(username) info.username = username;
      
      ShiftSpace.User.update(info, this.handleAccountUpdate.bind(this));
      
    }.bind(this));
  },
  
  showSubTab: function(section, num) {
    SSLog('show ' + 'subtab-' + section + num);
    var subtab = $(this.doc.getElementById('subtab-' + section + num));
    subtab.setStyle('display', 'block');
  },
  
  hideSubTab: function(section, num) {
    SSLog('hide ' + 'subtab-' + section + num);
    var subtab = $(this.doc.getElementById('subtab-' + section + num));
    subtab.setStyle('display', 'none');
  },
  
  onSpaceInstall: function(spaceName)
  {
    var newSpace = $(this.installedSpace(spaceName));
    newSpace.injectAfter(this.doc.getElementById('installedSpacesForm'));
    var spaceInput = this.doc.getElementById('install-space');
    spaceInput.value = '';
    this.updateIconsForSpace(spaceName);
  },
  
  
  onSpaceUninstall: function(spaceName)
  {
    var spaceDiv = $(this.doc.getElementById('installed' + spaceName));
    spaceDiv.remove();
    this.updateIconsForSpace(spaceName);
  },
  
  
  updateIconsForSpace: function(spaceName)
  {
    // update any unknown shift
    var spaceShifts = $A(_$(this.doc).getElementsByClassName(spaceName));
    spaceShifts.each(function(entry) {
      var icon = ShiftSpace.info(spaceName).icon;
      $(_$(entry).getElementByClassName('spaceTitle')).setStyle('background', 'transparent url(' + icon + ') no-repeat 3px 1px');
    });    
  },
  
  
  installedSpace: function(id) 
  {
    var div = this.doc.createElement('div');
    div.setAttribute('id', 'installed' + id);
    div.setAttribute('class', 'installedSpace');

    var isChecked = (SSGetPrefForSpace(id, 'autolaunch')) ? 'checked' : '';
    div.innerHTML = '<div class="installedTitleCol"><img src="' + server + 'spaces/' + id + '/' + id + '.png" width="32" height="32" /> ' +
                '<div class="info"><a href="http://www.shiftspace.org/spaces/' + id.toLowerCase() + '" target="_blank">' + id + '</a>' +
                '</div></div>' +
                '<div class="autolaunchCol"><div class="autolaunchToggle checkbox '+ isChecked + '"></div>' +
                '<div class="label">Automatically show shifts</div></div>' +
                '<input type="button" value="Uninstall" class="submit uninstall" id="uninstall' + id + '" />' +
                '<br class="clear" /></div>';
                
    //SSLog('func installedSpace - uninstall ' + _$(div).getElementByClassName('uninstall'));            
    var uninstallButton = _$(div).getElementByClassName('uninstall');
    
    $(uninstallButton).addEvent('click', function() {
      if (confirm('Are you sure you want to uninstall ' + id + '?')) {
        SSUninstallSpace(id);
      }
    });

    if(!ShiftSpace.User.isLoggedIn())
    {
      $(_$(div).getElementByClassName('autolaunchCol')).addClass('SSDisplayNone');
    }

    // add events to the autolaunch feature
    var autolaunchToggle = _$(div).getElementByClassName('autolaunchToggle');
    $(autolaunchToggle).addEvent('click', function(_evt) {
      var evt = new Event(_evt);
      var value = this.value;
      
      var spaceName = $(this).getParent().getParent().getProperty('id');
      
      if($(this).hasClass('checked'))
      {
        $(this).removeClass('checked');
        SSSetPrefForSpace(id, 'autolaunch', false);
      }
      else
      {
        $(this).addClass('checked');
        SSSetPrefForSpace(id, 'autolaunch', true);
      }
      SSLog('autolaunch toggle for ' + spaceName);
    });
    
    return div;
  },
  
  
  addTab: function(id, label, icon) {
    var br = this.doc.getElementById('tabs').getElementsByTagName('br')[1];
    var tab = $(this.doc.createElement('div'));
    tab.setAttribute('id', 'tab-' + id);
    tab.className = 'tab';
    var inner = $(this.doc.createElement('div'));
    inner.className = 'tab-inner';
    
    if (typeof icon != 'undefined') {
      var labelNode = $(this.doc.createElement('div'));
      labelNode.setHTML(label);
      labelNode.setStyles({
        background: 'transparent url(' + server + 'images/Console/' + icon + ') no-repeat 0 3px',
        padding: '0 0 0 18px'
      });
      labelNode.injectInside(inner);
    } else {
      inner.setHTML(label);
    }
    
    inner.injectInside(tab);
    tab.injectBefore(br);
    tab.addEvent('click', this.clickTab.bind(this));
    
    return this.addPane(id);
  },
  
  
  addPane: function(id) {
    if (!this.doc.getElementById(id)) {
      var content = $(this.doc.createElement('div'));
      content.setAttribute('id', id);
      content.className = 'content';
      content.injectInside(this.doc.getElementById('scroller'));
      return content;
    }
    return $(this.doc.getElementById(id));
  },
  
  
  getTab: function(tabname) {
    return $(this.doc.getElementById(tabname));
  },
  
  
  clickTab: function(e) {
    var id = e.currentTarget.getAttribute('id').substr(4);
    this.showTab(id);
  },
  
  
  showTab: function(id) {
    SSLog('showTab ' + id);
    if(id != 'settings') this.clearAccountInfo();
    
    this.currTab = id;
    
    // close the plugin menu if open
    if(this.pluginMenu && !$(this.pluginMenu).hasClass('SSDisplayNone')) this.pluginMenu.addClass('SSDisplayNone');

    // get the current selected tab
    var lastTab = _$(this.doc.getElementById('tabs')).getElementsByClassName('active')[0];

    // if previous active tab deselect the tab and hide the tab content
    if(lastTab)
    {
      var lastTabContentId = lastTab.id.split('-').getLast();

      // deselect
      if (lastTab) 
      {
        $(lastTab).removeClass('active');
      }

      // hide the content pane
      var lastTabContent = _$(this.doc.getElementById(lastTabContentId));
      if (lastTabContent) 
      {
        $(lastTabContent).removeClass('active');
      }
    }
    
    // make the new tab and tab content active
    $(this.doc.getElementById('tab-' + id)).addClass('active');
    $(this.doc.getElementById(id)).addClass('active');
    
    if (id == 'shifts' && _$(this.doc.getElementById('shifts')).getElementsByClassName('checked').length > 0) {
      $(this.doc.getElementById('actions')).setStyle('display', 'block');
    } else {
      $(this.doc.getElementById('actions')).setStyle('display', 'none');
    }
  },
  
  
  removeTab: function(id) 
  {
    SSLog('>>>>>>>>>>>>>>>>>>>>> REMOVE TAB ' + id);

    var tab = $(this.doc.getElementById('tab-' + id));
    if (tab) {
      tab.remove();
    }
  },
  
  
  buildLogin: function() 
  {
    this.addPane('login');
    //SSLog('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> CREATE SUBSECTIONS');
    var sections = this.createSubSections('login', ['Login', 'Sign up', 'Password']);
    /*
    SSLog('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> DONE CREATING SUBSECTIONS');
    SSLog('build sections');
    SSLog('sections: ' + sections);
    */
    $(sections[0]).setHTML(
      '<form id="loginForm" action="http://shiftspace.org/login" method="post" class="form-column">' +
        '<label for="username">Username</label>' +
        '<input type="text" name="username" id="username" class="text" />' +
        '<label for="password">Password</label>' +
        '<input type="password" name="password" id="password" class="text float-left" />' +
        '<input type="submit" value="Login" class="button float-left" />' +
        '<a href="#password" id="passwordResetLink" class="float-left">Forget your password?</a>' +
        '<br class="clear" />' +
        '<div id="login_response" class="response"></div>' +
      '</form>'
    );
    //SSLog('built sections[0]');
    $(sections[0]).setStyle('padding-top', 15);
    $(this.doc.getElementById('loginForm')).addEvent('submit', function(e) {
      new Event(e).preventDefault();
      var credentials = {
        username: this.doc.getElementById('username').value,
        password: this.doc.getElementById('password').value
      };
      ShiftSpace.User.login(credentials, this.handleLogin.bind(this));
    }.bind(this));
    
    $(this.doc.getElementById('passwordResetLink')).addEvent('click', function(e) {
      new Event(e).preventDefault();
      this.showSubSection('login', 2);
    }.bind(this));
    $(sections[1]).setHTML('<form id="registerForm" action="http://shiftspace.org/join" method="post">' +
                        '<div class="form-column">' +
                        '<label for="join_username">Username</label>' +
                        '<input type="text" name="username" id="join_username" class="text" />' +
                        '<label for="email">E-mail address</label>' +
                        '<input type="text" name="email" id="email" class="text" />' +
                        '</div><div class="form-column">' +
                        '<label for="join_password">Password</label>' +
                        '<input type="password" name="password" id="join_password" class="text" />' +
                        '<label for="password_again">Password again</label>' +
                        '<input type="password" name="password_again" id="password_again" class="text float-left" />' +
                        '<input type="submit" value="Sign up" class="button float-left" />' +
                        '<br class="clear" />' +
                        '</div>' +
                        '<br class="clear" />' +
                        '<div id="join_response" class="response"></div>' +
                        '</form>');
    $(sections[1]).setStyle('padding-top', 15);
    $(this.doc.getElementById('registerForm')).addEvent('submit', function(e) {
      //SSLog('submit');
      new Event(e).preventDefault();
      var joinInput = {
        username: this.doc.getElementById('join_username').value,
        email: this.doc.getElementById('email').value,
        password: this.doc.getElementById('join_password').value,
        password_again: this.doc.getElementById('password_again').value
      };
      ShiftSpace.User.join(joinInput, this.handleJoin.bind(this));
    }.bind(this));
    
    $(sections[2]).setHTML(
      '<form id="passwordForm" action="http://shiftspace.org/password" method="post" class="form-column">' +
        '<h2>Reset your password</h2>' +
        '<label for="password-email">Your email address</label>' +
        '<input type="text" name="password-email" id="password-email" class="text" size="25" />' +
        '<input type="submit" value="Submit" class="button" />' +
      '</form>' +
      '<br class="clear" />' +
      '<div id="password-response" class="response"></div>'
    );
    $(this.doc.getElementById('passwordForm')).addEvent('submit', function(e) {
      new Event(e).preventDefault();
      var info = {
        email: $(this.doc.getElementById('password-email')).value
      };
      ShiftSpace.User.resetPassword(info, this.handlePasswordReset.bind(this));
    }.bind(this));
  },
  
  
  buildWelcome: function() 
  {
    // add temporary welcome tab
    var pane = this.addTab('welcome', 'Welcome');
    this.setHeight(200);
    this.refresh();
    
    pane.setHTML(
      '<div class="welcome-intro">' +
        '<h2>Welcome to ShiftSpace!</h2>' +
        '<p>Please take a moment to watch a short introductory screencast and set your default privacy setting.</p>' +
        '<div class="input"><div id="init_privacy" class="checkbox checked"></div>' +
        '<div class="label">Set my shifts public by default</div>' +
        '<br class="clear" /></div>' +
        '<p><a href="http://www.shiftspace.org/about/user-manual/#managing" target="_top">Read more about content privacy</a></p>' +
      '</div>' +
      '<div class="welcome-screencast">' +
        '<a href="#screencast" id="screencast-link"><img src="' + server + 'images/Console/intro-screencast-thumb.gif" alt="Intro screencast" />' +
      '</div>' +
      '<br class="clear" />'
    );
    
    var init_privacy = $(this.doc.getElementById('init_privacy'));
    var default_privacy = $(this.doc.getElementById('default_privacy'));

    SSSetDefaultShiftStatus(1);
    
    // set default to checked
    default_privacy.addClass('checked');

    init_privacy.addEvent('click', function() {
      if (!init_privacy.hasClass('checked')) 
      {
        SSSetDefaultShiftStatus(1);
        init_privacy.addClass('checked');
        default_privacy.addClass('checked');
      } 
      else 
      {
        SSSetDefaultShiftStatus(2);
        init_privacy.removeClass('checked');
        default_privacy.removeClass('checked');
      }
    }.bind(this));
    
    loadStyle('styles/Videobox.css', function() {
      $(this.doc.getElementById('screencast-link')).addEvent('click', function(e) {
        new Event(e).preventDefault();
        SSLog('hide shiftspace');
        ShiftSpaceHide();
        SSLog('new videobox');
        var vb = new Videobox();
        vb.addEvent('onClose', ShiftSpaceShow);
        SSLog('open video box');
        vb.open("http://blip.tv/play/23eWlyOElCw","your caption","vidbox 624 498");
      }.bind(this));
    }.bind(this));
    
  },
  
  
  handleLogin: function(json) 
  {
    if (json.status) 
    {
      this.setupAuthControl();
      this.showTab('shifts');
      this.resetLogin();
      this.removeTab('login');
      this.updateDefaultShiftStatus();
      this.updateDefaultEmailComments();
      
      // Hide the Account subtab
      this.showSubTab('settings', 2);
      
      // update the controls
      this.updateControlsForUsersShifts();
      
      // show the autolaunch checkboxes
      $A(_$(this.doc.getElementsByClassName('autolaunchCol'))).each(function(x) {
        $(x).removeClass('SSDisplayNone');
      });
    } 
    else 
    {
      this.showResponse('login_response', json.message);
    }
  },
  
  
  updateDefaultShiftStatus: function()
  {
    var defaultPrivacy = $(this.doc.getElementById('default_privacy'));
    if(defaultPrivacy)
    {
      if(SSGetDefaultShiftStatus(true) == 2)
      {
        defaultPrivacy.removeClass('checked');
      }
      else
      {
        defaultPrivacy.addClass('checked');
      }
    }
  },
  
  
  updateDefaultEmailComments: function()
  {
    var defaultComments = $(this.doc.getElementById('default_comments'));
    if(defaultComments)
    {
      if(ShiftSpace.User.getEmailCommentsDefault() == 0)
      {
        defaultComments.removeClass('checked');
      }
      else
      {
        defaultComments.addClass('checked');
      }
    }
  },
  
  
  handleLogout: function()
  {
    this.updateControlsForUsersShifts();
    
    this.showResponse('login_response', 'You have been logged out.');
    this.addTab('login', 'Login');
    this.showTab('login');
    this.hideSubTab('settings', 2);
    this.showSubSection('settings', 0);
    
    this.removeTab('welcome');
    
    // remove the autolaunch checkboxes
    $A(_$(this.doc.getElementsByClassName('autolaunchCol'))).each(function(x) {
      $(x).addClass('SSDisplayNone');
    });
  },
  
  
  handleJoin: function(json) 
  {
    if (json.status) 
    {
      this.buildWelcome();
      this.showTab('welcome');
      this.removeTab('login');
      this.setupAuthControl();
      this.resetJoin();
      
      // Hide the Account subtab
      this.showSubTab('settings', 2);
      this.showSubSection('settings', 0);
    } 
    else 
    {
      this.showResponse('join_response', json.message);
    }
  },

  
  showAccountInfo: function()
  {
    this.doc.getElementById('account-email').value = ShiftSpace.User.email() || '';
    this.doc.getElementById('account-name').value = ShiftSpace.User.getUsername();
  },
  
  
  clearAccountInfo: function()
  {
    this.doc.getElementById('account-email').value = '';
    this.doc.getElementById('account-name').value = '';
  },

  
  handleAccountUpdate: function(json) 
  {
    this.showResponse('account-response', json.message);
    if (json.status) {
      $(this.doc.getElementById('account-password')).value = '';
      $(this.doc.getElementById('account-passwordagain')).value = '';
    }
  },
  
  
  handlePasswordReset: function(json) 
  {
    this.showResponse('password-response', json.message);
  },
  
  
  resetLogin: function() 
  {
    $(this.doc.getElementById('username')).value = '';
    $(this.doc.getElementById('password')).value = '';
    $(this.doc.getElementById('login_response')).setHTML('');
  },
  
  
  resetJoin: function() 
  {
    $(this.doc.getElementById('join_username')).value = '';
    $(this.doc.getElementById('email')).value = '';
    $(this.doc.getElementById('join_password')).value = '';
    $(this.doc.getElementById('password_again')).value = '';
    $(this.doc.getElementById('join_response')).setHTML('');
  },
  
  
  showResponse: function(target, message) 
  {
    if (this.getHeight() < 175) 
    {
      this.setHeight(175);
      this.refresh();
    }
    
    var targetNode = $(this.doc.getElementById(target));
    if(targetNode) targetNode.setHTML(message);
  },
  
  
  createSubSections: function(target, sections) {
    var tabs = '';
    var content = '';
    
    //SSLog('sections length ' + sections.length);
    for (var i = 0; i < sections.length; i++) {
      var activeTab = (i == 0) ? ' subtab-active' : '';
      var activeSection = (i == 0) ? ' subsection-active' : '';
      tabs += '<div id="subtab-' + target + i + '" class="subtab' + activeTab + '">' + sections[i] + '</div>';
      content += '<div id="subsection-' + target + i + '" class="subsection' + activeSection + '"></div>';
    }
    
    var holder = _$(this.doc.getElementById(target));
    holder.innerHTML = '<div class="subtabs">' +
        '<div class="subtabs-inner">' + tabs + '</div>' +
        '</div>' +
        '<div class="subsections">' + content + '</div>' +
        '<br class="clear" />';
    
    $A(holder.getElementsByClassName('subtab')).each(function(subtab) {
      $(subtab).addEvent('click', function(e) {
        var id = e.target.getAttribute('id');
        var num = id.substr(7 + target.length);
        this.showSubSection(target, num);
      }.bind(this));
    }.bind(this));
    
    return holder.getElementsByClassName('subsection')
  },
  
  
  showSubSection: function(target, num) 
  {
    if(target != 'settings' && num != 2) this.clearAccountInfo();
    
    var holder = _$(this.doc.getElementById(target));
    var active = holder.getElementByClassName('subtab-active');
    if (active) {
      $(active).removeClass('subtab-active');
    }
    var above = holder.getElementByClassName('subtab-above');
    if (above) {
      $(above).removeClass('subtab-above');
    }
    var subsection = holder.getElementByClassName('subsection-active');
    if (subsection) {
      $(subsection).removeClass('subsection-active');
    }
    
    var subtab = $(this.doc.getElementById('subtab-' + target + num));
    var subsection = $(this.doc.getElementById('subsection-' + target + num));
    subtab.addClass('subtab-active');
    if (subtab.previousSibling) {
      $(subtab.previousSibling).addClass('subtab-above');
    }
    subsection.addClass('subsection-active'); 
    
    if(target == 'settings' && num == 2)
    {
      this.showAccountInfo();
    }
  },
  
  
  /*
  
  Function: refresh
  Resize the content area.
  
  */
  refresh: function() 
  {
    if (!this.doc || !this.doc.getElementById('top')) 
    {
      // Need to wait a moment longer while things are being built
      if(this.resize) setTimeout(this.resize.bind(this), 50);
    }
    else 
    {
      var top = $(this.doc.getElementById('top')).getParent();
      var bottom = $(this.doc.getElementById('bottom'));
      bottom.setStyle('height', this.getHeight() - top.getSize().size.y);
    }
    //SSLog('cleaning up');
    this.resizer.setStyle('width', window.getWidth() - 50);
    //this.resizer.setStyle('top', this.frame.getStyle('top'));
    this.resizer.setStyle('top', this.frameWrapper.getStyle('top'));
    
    if(this.isVisible())
    {
      if(this.getHeight() > 0)
      {
        this.notifier.setStyle('bottom', this.getHeight() - 4);      
      }
      else
      {
        this.notifier.setStyle('bottom', 150);
      }
    }

    //SSLog('cleaned');
    if(this.notifierFx && this.isVisible())
    {
      //SSLog('stop notifier');
      this.notifierFx.stop();
      //SSLog('set');
      this.notifierFx.set(Math.max(0, this.getHeight() - 4));
    }
    //SSLog('exiting refresh');
  },
  
  
  /*
  
  Function: show
  Show the console.
  
  */
  show: function() 
  {
    this.__isVisible__ = true;

    this.cancelNotifier = true;

    this.notifier.setStyle('display', '');
    this.notifier.removeClass('SSDisplayNone');
    //this.frame.setStyle('display', 'block');
    this.frameWrapper.setStyle('display', 'block');

    this.notifierFx.stop();
    this.refresh();

    this.loadShifts();
  },
  
  
  /*
  
  Function: hide
  Hide the console.
  
  */
  hide: function() 
  {
    this.__isVisible__ = false;

    this.notifier.addClass('SSDisplayNone');
    
    //this.frame.setStyle('display', 'none');
    this.frameWrapper.setStyle('display', 'none');
    this.notifierFx.set(-32);
    this.hidePluginMenu();
    
    // fire a hide event
    this.fireEvent('onHide', this);
  },
  
  
  isVisible: function() 
  {
    return this.__isVisible__;
  },
  
  
  /*
  
  Function: loadShifts
  Adds a collection of shifts to the console
      
  Parameters:
      shifts - An object containing the shifts to be added, keyed by shiftId
  
  */
  addShifts: function(shifts) {
    //SSLog('++++++++++++++++++++++++++++++++++++++++++ ADD SHIFTS');
    for (var shiftId in shifts) {
      var shift = shifts[shiftId];
      try
      {
        this.addShift(shift);
      }
      catch(exc)
      {
        console.error('Exception adding shift ' + shiftId + ' to console: ' + SSDescribeException(exc));
      }
    }
  },
  
  showShift: function(id) {
    SSLog('>>>>>>>>>>>>>>>>>>>>>>> SHOW SHIFT ' + id);
    var el = $(this.doc.getElementById(id));
    if(el)
    {
      el.addClass('active');
      el.addClass('SSUserSelectNone');
      this.hideEditTitleField(id);
    }
    SSLog('exit SHOW SHIFT');
  },
  
  editShift: function(id) {
    SSLog('>>>>>>>>>>>>>>>>>>>>>>> EDIT SHIFT ' + id);
    var el = $(this.doc.getElementById(id));
    if(el)
    {
      this.showShift(id);
      el.removeClass('SSUserSelectNone');
      this.showEditTitleField(id);
    }
  },
  
  blurShift: function(id) {
    //SSLog('CONSOLE BLLLLLLLLLLLLLLLLLLLLLLUR ' + id);
    this.hideEditTitleField(id);
    //SSLog('EXIT');
  },
  
  focusShift: function(id) {
  },

  hideShift: function(id) {
    var el = $(this.doc.getElementById(id));
    if(el)
    {
      el.removeClass('active');
      el.addClass('SSUserSelectNone');
      this.hideEditTitleField(id);
    }
  },
  
  showEditTitleField: function(id) {
    var el = _$(this.doc.getElementById(id));
    if(el)
    {
      $(el.getElementByClassName('summaryEdit')).removeClass('SSDisplayNone');
      $(el.getElementByClassName('summaryView')).addClass('SSDisplayNone');
    }
  },
  
  hideEditTitleField: function(id) {
    var el = _$(this.doc.getElementById(id));
    if(el)
    {
      $(el.getElementByClassName('summaryEdit')).addClass('SSDisplayNone');
      $(el.getElementByClassName('summaryView')).removeClass('SSDisplayNone');
    }
  },
  

  setTitleForShift: function(id, title) {
    var el = _$(this.doc.getElementById(id));
    if(el)
    {
      $(el.getElementByClassName('summaryView')).setText(title);
    }
  },
  
  
  updateShift: function(shiftJson) 
  {
    var entry = _$(this.doc.getElementById(shiftJson.id));
    
    // update the summary
    var summaryView = $(entry.getElementByClassName('summary').getElementByClassName('summaryView'));
    this.updateSummary(summaryView, shiftJson.summary);
    
    // HUH: not sure why we need to update the username - David
    $(entry.getElementByClassName('user')).getFirst().setHTML(shiftJson.username);
  },
  
  
  updateSummary: function(summaryView, summary)
  {
    var atReference = summary.match(/@[A-Za-z0-9._]*\b/);
    if(atReference && atReference.length > 0)
    {
      atReference = atReference[0];
      var username = atReference.substr(1, atReference.length-1);
      var refLink = "<a title=\"Browse "+username+"\'s shifts on the ShiftSpace Public Square\" target=\"new\" href=\"http://www.shiftspace.org/shifts/?filter=by&filterBy="+username+"\">"+atReference+"</a>";
      $(summaryView).setHTML(summary.replace(atReference, refLink));
    }
    else
    {
      $(summaryView).setText(summary);
    }
  },
  
  
  updatePluginIconForShift: function(data)
  {
    data.plugin.menuIconForShift(data.shiftId, function(icon) {
      var entry = _$(this.doc.getElementById(data.shiftId));
      var pluginName = data.plugin.attributes.name;
      var pluginIcon = $(entry.getElementByClassName('pg'+pluginName));
      var classNames = pluginIcon.getProperty('class').split(' ');
      
      // remove all other status icons
      classNames = classNames.filter(function(className) {
        return (className.search('SS'+pluginName) != -1);
      });
      classNames.each(function(x) {pluginIcon.removeClass(x);});
      
      pluginIcon.addClass(icon);
    }.bind(this));
  },
  
  
  updateShiftControl: function(shiftId, userOwnsShift)
  {
    var entry = _$(this.doc.getElementById(shiftId));
    
    if(entry)
    {
      var privacySpan = $(entry.getElementByClassName('privacySpan'));
      var editSpan = $(entry.getElementByClassName('editSpan'));
      var deleteSpan = $(entry.getElementByClassName('deleteSpan'));
      var username = $(entry.getElementByClassName('user'));
      
      if(userOwnsShift)
      {
        privacySpan.removeClass('SSDisplayNone');
        editSpan.removeClass('SSDisplayNone');
        deleteSpan.removeClass('SSDisplayNone');
        username.addClass('loggedIn');
      }
      else
      {
        privacySpan.addClass('SSDisplayNone');
        editSpan.addClass('SSDisplayNone');
        deleteSpan.addClass('SSDisplayNone');
      }
      this.updateShiftPrivacy(shiftId);
    }
  },
  
  updateShiftPrivacy: function(shiftId) {
    var entry = _$(this.doc.getElementById(shiftId));
    if(entry)
    {
      var shiftId = entry.getAttribute('id');
      var shiftStatus = parseInt(SSGetShift(shiftId).status);
      var statusIconsDiv = $(entry.getElementByClassName('statusIcons'));
      var privacyIcon = $(entry.getElementByClassName('privacyIcon'));
    
      if (shiftStatus == 1) 
      {
        if(privacyIcon) privacyIcon.addClass('SSDisplayNone');
      } 
      else 
      {
        if(privacyIcon) privacyIcon.removeClass('SSDisplayNone');
      }
    }
  },
  
  updateControlsForUsersShifts: function()
  {
    var shiftIds = SSGetPageShiftIdsForUser();
    
    // user is logged out hide all controls
    if(shiftIds.length == 0)
    {
      $A(_$(this.doc).getElementsByClassName('editSpan')).each(function(editSpan) {
        $(editSpan).addClass('SSDisplayNone');
      });
      $A(_$(this.doc).getElementsByClassName('deleteSpan')).each(function(deleteSpan) {
        $(deleteSpan).addClass('SSDisplayNone');
      });
      $A(_$(this.doc).getElementsByClassName('privacySpan')).each(function(privacySpan) {
        $(privacySpan).addClass('SSDisplayNone');
      });
      $A(_$(this.doc).getElementsByClassName('loggedIn')).each(function(x) {
        $(x).removeClass('loggedIn');
      });
      return;
    }
    
    // user has just logged in update the controls of the user's shifts
    /*shiftIds.each(function(shiftId) {
      this.updateShiftControl(shiftId, true);
    }.bind(this));*/
  },
  
  
  /*
  
  Function: addShift
  Adds a shift to the console.
  
  */
  addShift: function(aShift, options) {
    // make sure this shift doesn't already exist in the DOM
    var el = $(this.doc.getElementById(aShift.id));
    if(el) return;

    //SSLog('adding - ' + aShift.id);
    // clone a model shift
    var newEntry = _$(this.modelShiftEntry.clone(true));
    
    newEntry.className += ' ' + aShift.space;
    
    //SSLog(newEntry);
    
    var icon = ShiftSpace.info(aShift.space).icon;
    var img = newEntry.getElementByClassName('expander').getElementsByTagName('img')[0];
    
    if(SSUserOwnsShift(aShift.id))
    {
      $(newEntry.getElementByClassName('user')).addClass('loggedIn');
    }
    
    //SSLog('image and icon grabbed');
    
    newEntry.setAttribute('id', aShift.id);
    
    //SSLog('set id');

    newEntry.getElementByClassName('spaceTitle').innerHTML = aShift.space;
    $(newEntry.getElementByClassName('spaceTitle')).setStyle('background', 'transparent url(' + icon + ') no-repeat 3px 1px');
    
    if(aShift.broken)
    {
      newEntry.getElementByClassName('brokenIcon').removeClass('SSDisplayNone');
    }
    
    // remove the delete and hide the edit link if necessary
    if(!SSUserCanEditShift(aShift.id))
    {
      var privacySpan = $(newEntry.getElementByClassName('privacySpan'));
      if(privacySpan) privacySpan.addClass('SSDisplayNone');
      var editSpan = $(newEntry.getElementByClassName('editSpan'));
      if(editSpan) editSpan.addClass('SSDisplayNone');
      var deleteSpan = $(newEntry.getElementByClassName('deleteSpan'));
      if(deleteSpan) deleteSpan.addClass('SSDisplayNone');
    }
    
    // grab the summary div
    var summary = newEntry.getElementByClassName('summary');
    
    // udpate the summary view
    var summaryView = summary.getElementByClassName('summaryView');
    this.updateSummary(summaryView, aShift.summary);
    
    // update the summary input fiedl
    var summaryEdit = summary.getElementByClassName('summaryEdit');
    summaryEdit.setAttribute('value', aShift.summary);
    
    // upate user name and created date
    var userLink = $(newEntry.getElementByClassName('user')).getFirst();
    userLink.setHTML(aShift.username);
    userLink.setProperty('href', 'http://www.shiftspace.org/shifts/?filter=by&filterBy='+aShift.username);
    userLink.setProperty('title', "Browse "+aShift.username+"'s shifts on the ShiftSpace Public Square");

    newEntry.getElementByClassName('posted').innerHTML = aShift.created; 
    
    //SSLog('main props set');
    
    // Add hover behavior, this can probably be handle via css - David
    newEntry.addEvent('mouseover', function() {
      if (!newEntry.hasClass('active') && !newEntry.hasClass('expanded')) 
      {
        newEntry.addClass('hover');
      }
    });
    
    newEntry.addEvent('mouseout', function() {
        newEntry.removeClass('hover');
    });
    
    // Show this shift on click
    newEntry.addEvent('click', function() {
      if (!newEntry.hasClass('active')) 
      {
        newEntry.addClass('active');
        
        // tell ShiftSpace to show the shift
        showShift(aShift.id);
      } 
      else 
      {
        // tell ShiftSpace to hide the shift
        newEntry.removeClass('active');
        hideShift(aShift.id);
        this.hideEditTitleField(aShift.id);
      }
    }.bind(this));
    
    //SSLog('mouse behaviors set');
    
    //SSLog('slide fx');
    
    var toggle = newEntry.getElementByClassName('expander');
    var checkbox = $(toggle.getElementByClassName('checkbox'));
    
    checkbox.addEvent('click', function(e) {
      var event = new Event(e);
      event.stopPropagation();
      if (!checkbox.hasClass('checked')) {
        checkbox.addClass('checked');
        ShiftSpace.Actions.select(aShift.id);
      } else {
        checkbox.removeClass('checked');
        ShiftSpace.Actions.deselect(aShift.id);
      }
    });
    
    checkbox.addEvent('mouseover', function(e) {
      if (checkbox.hasClass('checked')) {
        checkbox.addClass('checked-hover');
      } else {
        checkbox.addClass('checkbox-hover');
      }
    });
    
    checkbox.addEvent('mouseout', function(e) {
      if (checkbox.hasClass('checked')) {
        checkbox.removeClass('checked-hover');
      } else {
        checkbox.removeClass('checkbox-hover');
      }
    });
    
    //SSLog('expando set');
    
    //SSLog('override click behavior, delete node below');
    
    //SSLog('summary edit key events');
    
    // Event for the title edit input field
    $(summaryEdit).addEvent('keyup', function(_evt) {
      var evt = new Event(_evt);
      if(evt.key == 'enter')
      {
        var newTitle = $(evt.target).getProperty('value');
        $(SSGetElementByClass('summaryView', newEntry)).setHTML(newTitle);
        this.showShift(aShift.id);
        // defined in Core - David
        updateTitleOfShift(aShift.id, newTitle);
      }
    }.bind(this));
    
    //SSLog('add summary field click event');
    
    $(summaryEdit).addEvent('click', function(_evt) {
      var evt = new Event(_evt);
      evt.stop();
    });
    
    //SSLog('--------------------------------- about to inject');
    //SSLog(this.doc);
    
    // add it
    if (options && options.isActive) 
    {
      $(newEntry).injectTop($(this.doc.getElementById('shifts')));
      $(newEntry).addClass('active');
    } 
    else 
    {
      //SSLog($(this.doc.getElementById('shifts')));
      $(newEntry).injectInside($(this.doc.getElementById('shifts')));
    }
    
    this.updateShiftPrivacy(aShift.id);
    
    //SSLog('--------------------------------- adding plugin icons');
    this.addPluginIconForShift(aShift.id);
    //SSLog('--------------------------------- done adding plugin icons');
    var comments = newEntry.getElementByClassName('SSCommentsIcon');
    
    $(comments).addEvent('click', function(_evt) {
      var evt = new Event(_evt);
      evt.stopPropagation();
      SSLog('click!');
      if($(comments).hasClass('Reply') && !ShiftSpace.User.isLoggedIn())
      {
        alert("You must be signed in to comment on a shift.");
      }
      else
      {
        this.showCommentsForShift.bindResource(this, {
          type: 'plugin',
          name: 'Comments',
          args: [aShift.id]
        })();
      }
    }.bind(this));
    
    if(SSPluginDataForShift('Comments', aShift.id))
    {
      var commentCount = SSPluginDataForShift('Comments', aShift.id).count;
      if(commentCount > 0)
      {
        comments.removeClass('Reply');
        comments.addClass('Basic');
        comments.setText(commentCount);
      }
    }
    
    this.shiftCount++;
    this.updateCount();
    
    //SSLog('------------------------------------ ADDED');
  },
  
  
  showCommentsForShift: function(shiftId)
  {
    SSGetPlugin('Comments').showCommentsForShift(shiftId);
  },

  
  addPluginIconForShift: function(shiftId)
  {
    for(var plugin in installedPlugins)
    {
      this.initPluginIconForShift(plugin, shiftId);
    }
  },
  
  
  initPluginIconForShift: function(plugin, shiftId)
  {
    var el = this.doc.getElementById(shiftId);
    el = _$(el);
    var pluginDiv = $(this.doc.createElement('div'));
    
    if(SSGetPluginType(plugin) == 'menu')
    {
      pluginDiv.addClass('plugin');
      pluginDiv.addClass('pg'+plugin); // tag with plugin name
      
      // if the icon isn't immediately available need to use a callback
      var icon = SSPlugInMenuIconForShift(plugin, shiftId, function(icon) {
        pluginDiv.addClass(icon);
      });
      if(icon) pluginDiv.addClass(icon);
      
      pluginDiv.addEvent('click', function(_evt) {
        var evt = new Event(_evt);
        evt.stop();

        // wacky stuff
        this.showPluginMenuForShift.bindResource(this, {
          type: 'plugin',
          name: plugin, 
          args: [plugin, shiftId] 
        })();

      }.bind(this));

      pluginDiv.inject(el.getElementByClassName('pluginIcons'));
    }
  },
  
  
  updateCount : function()
  {
    var doc = this.frame.contentDocument;
    var shiftTab = _$(doc.getElementById('tab-shifts')).getElementByClassName('tab-inner');
    shiftTab.innerHTML = this.shiftCount + " shifts";
  },
  
  removeShift: function(shiftId) {
    $(this.doc.getElementById(shiftId)).remove();
    this.shiftCount--;
    this.updateCount();
  },
  
  createShiftEntryModel: function() {
    //SSLog('create entry div');
    var shiftEntry = $(this.doc.createElement('div'));
    //SSLog('done create entry div');
    shiftEntry.className = 'entry SSUserSelectNone';
    //SSLog('set class name');
    
    // ---------------- Expander ----------------------- //
    var expanderDiv = $(this.doc.createElement('div'));
    expanderDiv.className = 'expander column';
    //SSLog('expander made');

    var selectCheckbox = $(this.doc.createElement('div'));
    selectCheckbox.className = 'checkbox';
    selectCheckbox.injectInside(expanderDiv);
    
    // ------------------ Space ------------------------- //
    //SSLog('create space div');
    var spaceDiv = $(this.doc.createElement('div'));
    spaceDiv.className = 'space column';
    
    //SSLog('create spacetitle');
    var spaceTitle = $(this.doc.createElement('div'));
    spaceTitle.className = 'spaceTitle';
    spaceTitle.injectInside(spaceDiv);
    
    //SSLog('space added');
    
    // ------------------- Plugins ------------------------- //
    var plugins = $(this.doc.createElement('div'));
    plugins.addClass('pluginIcons');
    plugins.injectInside(spaceDiv);
    
    //SSLog('plugins added');
    
    // ------------------- Summary ------------------------- //
    var summaryDiv = $(this.doc.createElement('div'));
    summaryDiv.className = 'summary column';

    var summaryView = $(this.doc.createElement('span'));
    summaryView.setProperty('type', 'text');
    summaryView.setProperty('class', 'summaryView');
    summaryView.injectInside(summaryDiv);

    var summaryEdit = $(this.doc.createElement('input'));
    summaryEdit.setProperty('type', 'text');
    summaryEdit.addClass('summaryEdit');
    summaryEdit.addClass('SSDisplayNone');
    summaryEdit.injectInside(summaryDiv);
    
    //SSLog('summary added');
    // ------------------- Status Icons -------------------- //
    var statusIconsDiv = $(this.doc.createElement('div'));
    statusIconsDiv.className = 'statusIcons column';
    
    var privacyIcon = $(this.doc.createElement('div'));
    privacyIcon.className = 'privacyIcon SSDisplayNone';
    privacyIcon.injectInside(statusIconsDiv);
    
    var brokenIcon = $(this.doc.createElement('div'));
    brokenIcon.className = 'brokenIcon SSDisplayNone';
    brokenIcon.injectInside(statusIconsDiv);
    
    // ------------------- User ---------------------------- //
    var userLink = $(this.doc.createElement('a'));
    userLink.setProperty('target', 'new');
    var userDiv = $(this.doc.createElement('div'));

    userDiv.className = 'user column';
    userLink.injectInside(userDiv);
    
    //SSLog('user div added');
    
    // ------------------- Posted -------------------------- //
    var postedDiv = $(this.doc.createElement('div'));
    postedDiv.className = 'posted column';
    //SSLog('setHTML');
    postedDiv.setHTML('Just posted');
    //SSLog('posted div added');
    
    // ------------------- Clear --------------------------- //
    var clear = $(this.doc.createElement('div'));
    clear.className = 'clear';
    
    //SSLog('clear added');

    // -------------------- Comments ----------------------- //
    var comments = $(this.doc.createElement('div'));
    comments.className = 'SSCommentsIcon Reply';
    comments.setProperty('title', 'Leave a comment');
    
    //SSLog('controls added');
    
    // -------------------- Build the entry ---------------- //
    //SSLog('injecting');
    expanderDiv.injectInside(shiftEntry);
    spaceDiv.injectInside(shiftEntry);
    summaryDiv.injectInside(shiftEntry);
    statusIconsDiv.injectInside(shiftEntry);
    userDiv.injectInside(shiftEntry);
    postedDiv.injectInside(shiftEntry);
    comments.injectInside(shiftEntry);
    clear.injectInside(shiftEntry);
    
    // store the model
    this.modelShiftEntry = shiftEntry;
  },
  

  createLogInForm : function()
  {
    
  },
  
  
  loadShifts: function()
  {
    if(!this.__shiftsLoaded__)
    {
      this.__shiftsLoaded__ = true;
      loadShifts();
    }
  },
  
  
  halfMode: function(callback)
  {
    var resizeFx = this.frameWrapper.effects({
      duration: 300,
      Transition: Fx.Transitions.Cubic.easeIn,
      onComplete: function()
      {
        if(callback && typeof callback == 'function') callback();
      }.bind(this)
    });

    resizeFx.start({
      right: [0, 365]
    });

    var innerFrameConsoleDiv = _$(this.doc.getElementById('console'));
    innerFrameConsoleDiv.getElementsByClassName('summary').each(function(x) {
      $(x).setStyle('width', '35%');
    });
  },


  fullMode: function()
  {
    var resizeFx = this.frameWrapper.effects({
      duration: 300,
      Transition: Fx.Transitions.Cubic.easeIn,
      onComplete: function()
      {
        var innerFrameConsoleDiv = _$(this.doc.getElementById('console'));
        innerFrameConsoleDiv.getElementsByClassName('summary').each(function(x) {
          $(x).setStyle('width', '45%');
        });

      }.bind(this)
    });

    resizeFx.start({
      right: [365, 0]
    });
  },
  
  
  setHeight: function(newHeight)
  {
    //this.frame.setStyle('height', newHeight);
    this.frameWrapper.setStyle('height', newHeight);
  },
  
  
  getHeight: function()
  {
    //return parseInt(this.frame.getStyle('height'));
    return parseInt(this.frameWrapper.getStyle('height'));
  },
  
  // TODO: Total hack, fix this at some point - David
  addCommentToShift: function(shiftId)
  {
    var el = _$(this.doc.getElementById(shiftId));
    var comments = $(el.getElementByClassName('SSCommentsIcon'));
    var count = 1;
    
    if(!comments.hasClass('Basic'))
    {
      comments.removeClass('Reply');
      comments.addClass('Basic');
    }
    else
    {
      count = parseInt(comments.getText()) + 1;
    }
    
    comments.setText(count);
  },
  
  
  clearSelections: function()
  {
    $A(_$(this.doc.getElementById('shifts')).getElementsByClassName('checkbox')).each(function(checkbox) {
      $(checkbox).removeClass('checked');
      $(checkbox).removeClass('checkbox-hover');
    });
  }
  
});

// add events to the console
Console.implement(new Events);

ShiftSpace.Console = new Console();