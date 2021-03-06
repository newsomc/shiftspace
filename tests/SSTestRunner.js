var SSTestRunnerClass = new Class({
  
  Implements: [Events, Options],
  
  initialize: function()
  {
  },
  
  
  createMouseEventForNode: function(eventType, node)
  {
    var evt = document.createEvent("MouseEvents");
    evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
    node.dispatchEvent(evt);
  },

  
  loadTest: function(path)
  {
    // first look for the file in the package json
    
    // notify if we don't find it
    
    // if we do find it, we need to first load any dependencies
    
    // look for the file in the local directory

    // split the path components
    var components = path.split("/");
    var testname = components.getLast();
    var base = testname.split('.')[0];
    
    new Request({
      url: "../builder/build_test.php?test=" + base,
      method: "get",
      onComplete: function(responseText, responseXML)
      {
        // reset the SSUnitTest
        SSUnitTest.reset();
        
        // evaluate test
        var result = eval(responseText);
        
        if(result && result.error)
        {
          alert(result.error);
          return;
        }
        
        // load the TestCase or TestSuite instance
        var testInstance = eval(base);
        
        // david, you are such a hacker.
        // the initialize method in SSUnitTest.TestCase adds itself to the list of testcases
        new testInstance();
        
        $('SSTestRunnerOutput').empty();
        
        // run all the tests

        SSUnitTest.setFormatter(new SSUnitTest.ResultFormatter.BasicDOM($('SSTestRunnerOutput')));
        SSUnitTest.main({interactive:true});
        
      }.bind(this),
      onFailure: function(responseText, responseXML)
      {
        
      }.bind(this)
    }).send();
  },
  
  
  run: function()
  {
    
  }
  
});

var SSTestRunner = new SSTestRunnerClass();