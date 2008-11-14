// ==Builder==
// @required
// @name	            ShiftSpaceElement
// @package           System
// ==/Builder==

/*
  Class: ShiftSpace.Element
    A wrapper around the MooTools Element class that marks each DOM node with the ShiftSpaceElement CSS
    class.  This is required for identifying which elements on the page belong to ShiftSpace.  In the case
    of iFrames this is also used to make sure that iFrame covers get generated so that drag and resize
    operations don't break.
*/
var SSElement = new Class({
  /*
    Function: initialize (private)
      Initialize the element and if necessary add appropiate event handlers.

    Parameters:
      _el - a raw DOM node or a string representing a HTML tag type.
      props - the same list of options that would be passed to the MooTools Element class.

    Returns:
      An ShiftSpace initialized and MooTools wrapped DOM node.
  */
  initialize: function(_el, props)
  {
    var el = (_el == 'iframe') ? new IFrame(props) : new Element(_el, props);

    // ShiftSpaceElement style needs to be first, otherwise it overrides passed in CSS classes - David
    el.setProperty( 'class', 'ShiftSpaceElement ' + el.getProperty('class') );

    // remap makeResizable and makeDraggable - might want to look into this more
    var resizeFunc = el.makeResizable;
    var dragFunc = el.makeDraggable;

    // override the default behavior
    if(SSAddIframeCovers)
    {
      el.makeDraggable = function(options)
      {
        var dragObj;
        if(!dragFunc)
        {
          dragObj = new Drag.Move(el, options);
        }
        else
        {
          dragObj = (dragFunc.bind(el, options))();
        }

        dragObj.addEvent('onStart', function() {
          SSAddIframeCovers();
        });
        dragObj.addEvent('onDrag', SSUpdateIframeCovers);
        dragObj.addEvent('onComplete', SSRemoveIframeCovers);

        return dragObj;
      };

      // override the default behavior
      el.makeResizable = function(options)
      {
        var resizeObj;
        if(!resizeFunc)
        {
          resizeObj = new Drag.Base(el, $merge({modifiers: {x: 'width', y: 'height'}}, options));
        }
        else
        {
          resizeObj = (resizeFunc.bind(el, options))();
        }

        resizeObj.addEvent('onStart', SSAddIframeCovers);
        resizeObj.addEvent('onDrag', SSUpdateIframeCovers);
        resizeObj.addEvent('onComplete', SSRemoveIframeCovers);

        return resizeObj;
      };
    }

    return el;
  }
});

/*
  Class : ShiftSpace.Iframe
    This class allows the creation of iframes with CSS preloaded.  This will eventually
    be deprecated by the the forthcoming MooTools Iframe element which actually loads
    MooTools into the Iframe.  Inherits from <ShiftSpace.Element>.  You shouldn't instantiate
    this class directly, just use <ShiftSpace.Element>.
*/
var SSIframe = new Class({

  Extends: SSElement,

  /*
    Function: initialize (private)
      Initializes the iframe.

    Parameters:
      props - the same properties that would be passed to a MooTools element.

    Returns:
      A ShiftSpace initialized and MooTools wrapped Iframe.
  */
  initialize: function(props)
  {
    // check for the css property
    this.css = props.css;

    // check for cover property to see if we need to add a cover to catch events
    var loadCallBack = props.onload;
    delete props.onload;

    // eliminate the styles, add on load event
    var finalprops = $merge(props, {
      events:
      {
        load : function(_cb) {
          // load the css
          if(this.css)
          {
            SSLoadStyle(this.css, null, this.frame);
          }
          _cb();
        }.bind(this, loadCallBack)
      }
    });

    // store a ref for tricking
    this.frame = this.parent('iframe', finalprops);

    var addCover = true;
    if($type(props.addCover) != 'undefined' && props.addCover == false) addCover = false;

    if(addCover && SSAddCover)
    {
      // let ShiftSpace know about it
      SSAddCover({cover:SSCreateCover(), frame:this.frame});
    }
    else
    {
      SSLog('=========================== No cover to add!');
    }

    // return
    return this.frame;
  }
});

var SSInput = new Class({
  Extends: SSElement
  // Create an iframe
  // Apply the styles
  // Create the requested input field
  // set the input field / textarea to be position absolute, left top right bottom all 0
  // set up event handlers so they get pass up to the developer
});