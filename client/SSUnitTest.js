// ==Builder==
// @optional
// @name              SSUnitTest
// @package           Testing
// @dependencies      SSException
// ==/Builder==

// =============
// = NameSpace =
// =============

var SSUnitTestClass = new Class({

  initialize: function()
  {
    this.__tests = [];
  },
  

  tests: function()
  {
    return this.__tests;
  },


  addTest: function(caseName, theCase)
  {
    console.log('Adding ' + caseName)
    this.tests().push($H({name:caseName || 'UntitledTest', 'test':theCase}));
  },
  
  
  main: function()
  {
    this.tests().each(function(caseHash) {
      console.log(caseHash)
      caseHash.get('test').run();
    });
  }
  
});
var SSUnitTest = new SSUnitTestClass()

// ==============
// = Exceptions =
// ==============

SSUnitTest.Error = new Class({
  Extends: SSException,
  
  initialize: function(_error, message)
  {
    this.parent(_error);
    this.setMessage(message);
  }
});

SSUnitTest.AssertError = new Class({Extends: SSUnitTest.Error});
SSUnitTest.AssertEqualError = new Class({Extends: SSUnitTest.Error});
SSUnitTest.AssertNotEqualError = new Class({Extends: SSUnitTest.Extends});

// =======================
// = SSUnitTest.TestCase =
// =======================

SSUnitTest.TestCase = new Class({
  name: 'SSUnitTest.TestCase',
  
  
  initialize: function(dummy)
  {
    this.__tests = $H();   
    
    // to skip any properties defined on base class
    if(!dummy) 
    {
      this.__dummy = new SSUnitTest.TestCase(true);
      // add this instance to SSUnitTest
      SSUnitTest.addTest(this.name, this);
    }
  },
  
  /*
    Function: setup (abstract)
      Called before each test.  Do any initialization here.
  */
  setup: function() 
  {
  },
  
  /*
    Function: tearDown (abstract)
      Called after each test. Do any cleanup here.
  */
  tearDown: function() 
  {
  },
  
  
  results: function()
  {
    // returns a SSUnitTest.TestResult object
  },

  /*
    Function: run
      Runs the teset case.
  */
  run: function()
  {
    // collect all the tests and build metadata
    this.__collectTests__();
    this.__runTests__();
    this.__reportResults__();
  },
  
  /*
    Function: assertThrows
      Assert that a particular exception is throw.  This function is named
      so that we can access its caller property.
       
    Parameters:
      exception - an exception class.
      fn - a function to call. Remember to bind if passing in a method of an object.
      
    Example:
      testSomeMethod: function()
      {
        this.assertThrows(MyException, this.someMethod.bind(this), arg1, arg2, ...)
      }
  */
  assertThrows: function assertThrows(exception, fn)
  {
    // convert the argument list into an array
    var varargs = $A(arguments);
    // grab the remaining arguments
    var testArgs = varargs.slice(2, varargs.length);
    var caller = assertThrows.caller;
    
    try
    {
      fn.apply(null, testArgs);
    }
    catch(err)
    {
      if(err instanceof exception)
      {
        this.__setTestSuccess__(caller);
      }
      else
      {
        this.__setTestFail__(caller);
        throw err;
      }
    }
  },

  /*
    Function: assert
      Assert that a value is truthy.  This function is named so that we can access its
      caller property.
      
    Parameters:
      value - a value.
      
    Example:
      testSomeMethod: function()
      {
        this.assert(aFunction());
      }
  */
  assert: function assert(value)
  {
    if(arguments.length < 1) throw SSUnitTest.AssertError(new Error(), 'assert expects 1 arguments.')

    var caller = assert.caller;
    
    if(value == true)
    {
      this.__setTestSuccess__(caller);
    }
    else
    {
      this.__setTestFail__(caller);
    }
  },  
  
  /*
    Function: assertEqual
      Assert that two value match. This method is named so that we can
      access the caller property inside the method.
      
    Parameters:
      a - a value.
      b - a value.
      
    Example:
      testSomeMethod: function()
      {
        var correctValue = x;
        this.assertEqual(correctValue, this.someMethod());
      }
      
    See Also:
        assertNotEqual
  */
  assertEqual: function assertEqual(a, b)
  {
    if(arguments.length < 2) throw SSUnitTest.AssertEqualError(new Error(), 'assertEqual expects 2 arguments.')

    var caller = assertEqual.caller;
    
    if(a == b)
    {
      this.__setTestSuccess__(caller);
    }
    else
    {
      this.__setTestFail__(caller);
    }
  },
  
  /*
    Function: assertNotEqual
      Assert that two value match. This method is named so we can called the
      caller property inside the method.
      
    Parameters:
      a - a value.
      b - a value.
      
    Example:
      testSomeMethod: function()
      {
        var aValue = x;
        this.assertNotEqual(correctValue, this.someMethod());
      }
      
    See Also:
        assertEqual
  */
  assertNotEqual: function assertNotEqual(a, b)
  {
    if(arguments.length < 2) throw SSUnitTest.AssertNotEqualError(new Error(), 'assertNotEqual expects 2 arguments.')

    var caller = assertNotEqual.caller;
    
    if(a != b)
    {
      this.__setTestSuccess__(caller);
    }
    else
    {
      this.__setTestFail__(caller);
    }
  },
  
  
  __nameForTest__: function(fn)
  {
    return fn.name
  },
  
  
  __setNameForTest__: function(fn, name)
  {
    fn.name = name;
  },
  
  
  __collectTests__: function()
  {
    // collect all object properties that have 'test' as the first four characters
    for(var propertyName in this)
    {
      // don't consider any methods that are a part of SSUnitTest.TestCase
      if(!this.__dummy[propertyName])
      {
        var property = this[propertyName];
      
        if(propertyName.search("test") == 0 && 
           $type(property) == 'function') 
        {
          var theTest = property,
              testName = propertyName;
                    
          // add it to the testing data
          var testData = $H();
          // add a new hash for this test
          this.__tests.set(testName, testData);
          // set the name of the original function
          this.__setNameForTest__(theTest, testName);
          // set a bound function with the name set
          var boundTest = theTest.bind(this);
          this.__setNameForTest__(boundTest, testName);
          testData.set('function', boundTest);
        }
      }
    }
  },
  
  
  __runTests__: function()
  {
    this.__tests.each(function(testData, testName){
      try
      {
        this.setup();
      }
      catch(err)
      {
        throw SSUnitTest.Error(err, "Uncaught exception in setup.");
      }
      
      try
      {
        testData.function();
      }
      catch(err)
      {
        throw SSUnitTest.Error(err, "Uncaught exception in test.");
      }
      
      // default to success, if the test failed this won't do anything
      this.__setTestSuccess__(testData.function);
      
      try
      {
        this.tearDown();
      }
      catch(err)
      {
        throw SSUnitTest.Error(err, "Uncaught exception in tearDwon.");
      }
    }.bind(this));
  },
  
  
  __dataForTest__: function(aTest)
  {
    return this.__tests.get(this.__nameForTest__(aTest));
  },
  
  
  __setTestSuccess__: function(aTest)
  {
    var data = this.__dataForTest__(aTest);
    var success = data.get('success');
    
    // only set success if there isn't an existing value
    if(success == null)
    {
      data.set('success', true)
    }
  },
  
  
  __setTestFail__: function(aTest)
  {
    this.__dataForTest__(aTest).set('success', false);
  },
  
  
  __reportResults__: function()
  {
    var passed = this.__tests.getValues().filter(function(x){return x.success});
    var passedTests = passed.map(function(x){return this.__nameForTest__(x.function)}.bind(this));
    var failed = this.__tests.getValues().filter(function(x){return !x.success});
    var failedTests = failed.map(function(x){return this.__nameForTest__(x.function)}.bind(this));
    
    // create a report json object
    
    console.log(passed.length + " tests passed.");
    console.log(passedTests.toString())
    console.log(failed.length + " tests failed.");
    console.log(failedTests.toString())
    console.log(this.__tests.getLength() + " tests.");
  }
  
});


// =========================
// = SSUnitTest.TestResult =
// =========================

SSUnitTest.TestResult = new Class({
  
  initialize: function()
  {
    
  }
  
});


// ========================
// = SSUnitTest.TestSuite =
// ========================

SSUnitTest.TestSuite = new Class({
  
  initialize: function()
  {
    this.__tests =[];
  },

  
  tests: function()
  {
    return this.__tests();
  },

  
  addTest: function(aTest)
  {
    this.tests().push(aTest);
  },

  
  addTests: function(tests)
  {
    this.tests().extend(tests);
  },
  
  
  run: function()
  {
    this.tests().each(function(aTest) {
      aTest.run();
    });
  }
  
});

var TestCaseTestDivideByZeroException = new Class({
  Extends: SSException
});

function TestCaseDivide(x, y)
{
  if(y == 0) throw new TestCaseTestDivideByZeroException(new Error());
}

var SSTestCaseTest = new Class({
  name: 'SSTestCaseTest',
  
  Extends: SSUnitTest.TestCase,
  
  testAdd: function()
  {
    this.assertEqual(2+3, 5);
  },
  
  testDivide: function()
  {
    this.assertThrows(TestCaseTestDivideByZeroException, TestCaseDivide, 5, 0);
  },
  
  testSubstract: function()
  {
    var x = 5;
    this.assertNotEqual(x-2, 5);
  },
  
  testShouldFail: function()
  {
    var x = 5;
    this.assertNotEqual(x, 5);
  },
  
  testMultiply: function()
  {
    this.assert((3*3) == 9);
  }
});

function go()
{
  new SSTestCaseTest();
  SSUnitTest.main();
}
