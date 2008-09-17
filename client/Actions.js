var Actions = new Class({
  
  initialize: function() {
    this.selected = [];
    this.menuBuilt = false;
    
    /*
    ShiftSpace.User.addEvent('onUserLogin', this.updateMenu.bind(this));
    ShiftSpace.User.addEvent('onUserLogout', this.updateMenu.bind(this));
    */
  },
  
  buildMenu: function() {
    this.doc = ShiftSpace.Console.frame.contentWindow.document;
    this.el = this.doc.getElementById('actions');
    this.el.innerHTML = 
      '<div class="group">' +
        '<a id="SSFavoriteShiftButton" href="#" class="first button favorite"></a>' +
        '<a id="SSLinkToShiftButton" href="#" class="button link"></a>' +
        '<a id="SSTrailShiftButton" href="#" class="button trails"></a>' +
        '<br class="clear" />' +
      '</div>' +
      '<div class="group">' +
        '<div id="SSPrivacyButtons" class="dropdown first">' +
          '<a id="SSMakeShiftPublicButton" href="#" class="first option public">Public</a>' +
          '<a id="SSMakeShiftPrivateButton" href="#" class="option private selected">Private</a>' +
        '</div>' +
        '<a id="SSEditShiftButton" href="#" class="button edit"></a>' +
        '<a id="SSDeleteShiftButton" href="#" class="button delete"></a>' +
        '<br class="clear" />' +
      '</div>' +
      '<br class="clear" />';

    this.favoriteButton = $(this.doc.getElementById('SSFavoriteShiftButton'));
    this.linkButton = $(this.doc.getElementById('SSLinkToShiftButton'));
    this.trailButton = $(this.doc.getElementById('SSTrailShiftButton'));
    this.publicButton = $(this.doc.getElementById('SSMakeShiftPublicButton'));
    this.privateButton = $(this.doc.getElementById('SSMakeShiftPrivateButton'));
    this.privacyButtons = $(this.doc.getElementById('SSPrivacyButtons'));
    this.editButton = $(this.doc.getElementById('SSEditShiftButton'));
    this.deleteButton = $(this.doc.getElementById('SSDeleteShiftButton'));
    
    this.dropdown = ShiftSpace._$(this.el).getElementsByClassName('dropdown')[0];
    this.dropdown = $(this.dropdown);
    this.dropdown.addEvent('click', this.clickPrivacy.bind(this));
    
    this.attachEvents();
  },
  
  
  attachEvents: function()
  {
    this.favoriteButton.addEvent('click', function(_evt) {
      var evt = new Event(_evt);
      if(!evt.target.hasClass('disabled'))
      {
        //SSFavoriteShif(this.selected.getFirst());
      }
    }.bind(this));
    
    this.linkButton.addEvent('click', function(_evt) {
      var evt = new Event(_evt);
      if(!evt.target.hasClass('disabled'))
      {
        window.open(ShiftSpace.info().server + 'sandbox?id=' + this.selected[0]);
      }
    });
    
    this.editButton.addEvent('click', function(_evt) {
      var evt = new Event(_evt);
      if(!evt.target.hasClass('disabled'))
      {
        ShiftSpace.SSEditShift(this.selected[0]);
      }
    }.bind(this));
    
    this.deleteButton.addEvent('click', function(_evt) {
      var evt = new Event(_evt);
      if(!evt.target.hasClass('disabled'))
      {
        var str = 'this shift';
        if(this.selected.length > 1)
        {
          str = 'these shifts';
        }
        if(confirm('Are you sure want to delete ' + str + '? There is no undo'))
        {
          this.selected.each(ShiftSpace.SSDeleteShift);
          this.selected = [];
          
          this.updateMenu();
          this.hideMenu();
        }
      }
    }.bind(this));
  },

  
  setIsVisible: function(val) {
    this.__visible__ = val;
  },
  

  isVisible: function() {
    return this.__visible__;
  },
  

  select: function(shiftId) {
    this.selected.push(shiftId);
    if(!this.isVisible())
    {
      this.setIsVisible(true);
      this.showMenu();
    }
    this.updateMenu();
  },
  

  deselect: function(shiftId) {
    this.selected.remove(shiftId);
    if (this.selected.length == 0) 
    {
      this.setIsVisible(false);
      this.hideMenu();
    }
    else
    {
      this.updateMenu();
    }
  },
  

  showMenu: function() {
    if (!this.menuBuilt) {
      this.buildMenu();
      this.menuBuilt = true;
    }
    this.el.setStyle('display', 'block');
  },

  
  updateMenu: function() {
    if(this.isVisible())
    {
      // update the contents of the menu based on the current selections
      var selectedShifts = ShiftSpace.SSGetPageShifts(this.selected);
      if(selectedShifts && selectedShifts.length > 0)
      {
        var notTheLoggedInUser = function(x) {
          return x.username != ShiftSpace.User.getUsername();        
        };

        var usernames = selectedShifts.filter(notTheLoggedInUser);      
        if(usernames.length > 0)
        {
          this.disablePrivelegedButton();
        }
        else
        {
          this.enablePrivelegedButtons();
        }
        
        if(selectedShifts.length > 1)
        {
          this.linkButton.addClass('disabled')
          this.trailButton.addClass('disabled');
          this.editButton.addClass('disabled');
        }
        else
        {
          this.linkButton.removeClass('disabled');
          this.trailButton.removeClass('disabled');
          this.editButton.removeClass('disabled');
        }
      }
    }
  },
  

  enablePrivelegedButtons: function()
  {
    this.setDisabledPrivilegedButtons(false);
  },
  
  
  disablePrivelegedButton: function()
  {
    this.setDisabledPrivilegedButtons(true);
  },
  

  setDisabledPrivilegedButtons: function(disabled)
  {
    var method = (disabled == true && 'addClass') || (disabled == false  && 'removeClass') || null;
    
    if(!method) return;
    
    // logged in and owns all the selected shifts
    this.editButton[method]('disabled');
    this.deleteButton[method]('disabled');
    this.privacyButtons[method]('disabled');
    this.publicButton[method]('disabled');
    this.privateButton[method]('disabled');
  },
  

  hideMenu: function() {
    this.el.setStyle('display', 'none');
  },
  

  clickPrivacy: function() {
    this.dropdown.toggleClass('dropdown-open');
  }
  
});

ShiftSpace.Actions = new Actions();
