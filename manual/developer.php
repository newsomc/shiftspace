<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
	"http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">

<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
	<title>The ShiftSpace Manual &mdash; Developer Guide</title>
    <link rel="stylesheet" href="manual.css" type="text/css" />
    <script src="mootools.js" type="text/javascript"></script>
    <script src="manual.js" type="text/javascript"></script>
</head>
<body>
    <div id="container">
        <div id="top">
            <a href="http://www.shiftspace.org/" id="logo"><img src="images/shiftspace_logo.png" class="noborder"/></a>
            <div id="tagline">an open source layer above any website</div>
        </div>
        <?php include("nav.html");?>
        <div id="main">
            <h1>Developer Guide</h1>
            <h2 id="introduction">Introduction</h2>
            <div class="content">
                <p>
                  This section presents a broad overview of the concepts and technologies that compose the ShiftSpace platform. The ShiftSpace client software is written entirely in JavaScript, but depends on the Greasemonkey API (not Greasemonkey) and MooTools frameworks, which are described below. A tutorial is also provided here to help illustrate the initial stages of developing a new Space.
                </p>
            </div>
            <br />
            <div class="section">
                <h3>About ShiftSpace</h3>
                <div class="content">
                    <p>While the Internet's design is widely understood to be open and distributed, control over how users interact online has given us largely centralized and closed systems. The web is undergoing a transformation whose promise is user empowerment—but who controls the terms of this new read/write web? The web has followed the physical movement of the city's social center from the (public) town square to the (private) mall. ShiftSpace attempts to subvert this trend by providing a new public space on the web.</p>
                </div>
                <br />
            </div>
            <div class="section">
                <h3>User scenario</h3>
                <div class="content">
                    <p>ShiftSpace is a browser extension that provides its users tools (Spaces) with which to create content (Shifts) on top of any web page. Once a user has installed the software and signed in, they can browse Shifts that have been left on the page previously or create new Shifts of their own.</p>
                    <p>If Shifts are available on the page a small notifier will peak into the page in the lower-left corner of the browser. Clicking on the notifier or pressing [shift] + [space] launches the ShiftSpace Console along the bottom edge of the screen. The Console allows the user to browse through a list of available Shifts, then show and hide them as desired.</p>
                    <p>If the user clicks on a Shift in the Console, that Shift's Space will launch and the selected Shift will be displayed.  Spaces provide the environment in which to view and modify a specific kind of Shift.  For example the Highlights space presents the interface needed to select a highlight color, mark a portion of the page, and save the result.</p>
                    <p>The user can also create Shifts by holding down the [shift] key, which reveals a small [+] icon next to their cursor. By holding down the [shift] key and hovering over the icon, a menu of icons allow the user to choose from each installed Space to create a new Shift of that type. Upon creating a Shift, that Shift's Space will be invoked (if it's not already open) and a new empty Shift for that Space will be displayed.</p>
                    <p>The user can also use Trails (a kind of ShiftSpace plug-in), which allows the user to connect different Shifts across the web.  From the Console the user may delete their own Shifts, modify the private/public status of their Shifts, notify the development team of bugs, collapse the Console and logout.</p>
                </div>
                <br />
            </div>
            <div class="section">
                <h3>Browser technology</h3>
                <div class="content">
                    <p>Firefox is pretty much the de facto development environment you should be using if you're going to write Spaces for ShiftSpace.  The first thing you should do is <a href="https://addons.mozilla.org/en-US/firefox/addon/1843">install the Firebug</a> extension.  Firebug provides tools for inspecting the page, doing line-by-line debugging, and a slew of other features.</p>
                    <p>ShiftSpace's architecture is based on the <a href="http://greasespot.net/">Greasemonkey</a> Firefox extension, which allows us to easily and securely inject JavaScript code into any page. Please install the latest release of Greasemonkey before using or developing for ShiftSpace.</p>
                    <p>The Greasemonkey model of injecting user-installed JavaScript is catching on in other browsers beyond Firefox. There are a number of Greasemonkey clones available for other browsers, most noteworthy of which are:</p>
                    <ul>
                        <li><a href="http://8-p.info/greasekit/">GreaseKit for Safari</a></li>
                        <li><a href="http://www.gm4ie.com/">gm4ie: Greasemonkey for Internet Explorer</a></li>
                    </ul>
                    <p>While we don't currently support these other browsers officially, we are trying to keep our code as compatible as possible so that we might support them in the future.</p>
                </div>
                <br />
            </div>
            <h2 id="javascript">JavaScript</h2>
            <div class="content">
                <p>ShiftSpace is written almost entirely in JavaScript. A lightweight server back-end is written in PHP, but most of the functionality of ShiftSpace happens in JavaScript on the client-side. <strong>JavaScript is the only language you need to know to hack on ShiftSpace</strong>. Even if you aren't very familiar with JavaScript, the ShiftSpace platform might offer a gentle introduction to hacking your web experience.</p>
            </div>
            <br />
            <div class="section">
                <h3>Hacking tips</h3>
                <div class="content">
                    <p>JavaScript is a very flexible language and can be used (and misused) in a variety of ways. Here are some general guidelines you might want to keep in mind before diving into creating your own Space for ShiftSpace:</p>
                    <ol>
                        <li>
                            <p>Use the <tt>var</tt> keyword when defining variables. While code may continue to work without including it, it will define your variable in the global scope which may lead to unexpected results.</p>
                            <pre>var goodVariable = "foo"; // Good
badVariable = "bar";      // Potentially harmful</pre>
                        </li>
                        <li>
                            <p>Be descriptive with your naming conventions. Don't call things <tt>x</tt> or <tt>data</tt>, except in the case of simple iterators or temporary variables.</p>
                        </li>
                        <li>
                            <p>Use the Firebug JavaScript console to try things out.</p>
                        </li>
                        <li>
                            <p>Be consistent how you indent things. This will make debugging much easier! We don't advocate for a single style (you may notice a variety of different styles in the ShiftSpace codebase), but for your own sake choose a style that will allow you to look at your code in the distant future and understand what it does.</p>
                        </li>
                        <li>Comment your code both so you can later remember what you wanted it to do, so others can access it if you need some help, and so others might learn from you a trick or two.</li>
                        <li>
                            <p>Don't be afraid to ask for help on the <a href="http://community.shiftspace.org/">ShiftSpace developer list</a>.</p>
                        </li>
                    </ol>
                </div>
                <br />
            </div>
            <div class="section">
                <h3>Reference links</h3>
                <div class="content">
                    <p>JavaScript is very easy to learn, but covering it meaningfully is outside the scope of what this guide can offer. However there are many good JavaScript references out there already. The following links may be useful for learning more about the language:</p>
                    <ul>
                        <li><a href="http://developer.mozilla.org/en/docs/JavaScript">Mozilla Developer Center</a></li>
                        <li><a href="http://www.oreilly.com/catalog/jscript5/">JavaScript: The Definitive Guide</a></li>
                        <li><a href="http://www.quirksmode.org/">QuirksMode, a good reference on browser quirks</a></li>
                        <li><a href="http://simonwillison.net/2006/Mar/7/etech/">Simon Willison's presentation <em>A (Re)-Introduction to JavaScript</em></a> (which is also available in HTML form in the Mozilla Dev Center linked above)</li>
                    </ul>
                </div>
                <br />
            </div>
            <h2 id="greasemonkey">Greasemonkey</h2>
            <div class="content">
                <p>
                  <a href="http://greasespot.net/">Greasemonkey</a> is a browser extension for Firefox that allows you to augment your browsing experience through a variety of installable "userscripts". These are similar to <a href="http://en.wikipedia.org/wiki/Bookmarklet">bookmarklets</a> (or "favelets"), except that they execute automatically instead of being initiated by the user. In both cases they are composed of JavaScript code that is invoked by the user's browser and not the original webpage itself. Greasemonkey is deployment method for the canonical ShiftSpace userscript.  It must be made clear that this is in <i>NO WAY</i> a requirement.  It is quite possible to host ShiftSpace so that it is available to visitors to your website.  This version of ShiftSpace could connect to your database, or it could connect back to ours.  It's entirely up to you.
                </p>
            </div>
            <br />
            <div class="section">
                <h3>How it works</h3>
                <div class="content">
                    <p>Once a page finishes loading, Greasemonkey looks through all the installed userscripts and executes those whose pattern matching rules include the page's URL. ShiftSpace's userscript matches on the pattern "*" by default, meaning it will execute on every page regardless of URL. Greasemonkey allows you to customize when userscripts execute (and are prevented from executing) through the window accessed from Tools &rarr; Greasemonkey &rarr; Manage User Scripts...</p>
                    <p>This window also allows you to disable ShiftSpace, or any other userscript. You can also enable and disable userscripts by right-clicking (ctrl-clicking for Mac users) on the Greasemonkey icon in the status bar. Left-clicking on that same icon will allow you to toggle Greasemonkey on and off entirely.</p>
                </div>
                <br />
            </div>
            <div class="section">
                <h3>Programming implications</h3>
                <div class="content">
                    <p>Greasemonkey operates almost as if it were included in a &lt;script&gt; element in the page's source code, except for some important exceptions. One of the most convenient features of Greasemonkey is its ability to load files dynamically with its own <tt>GM_xmlhttpRequest</tt> method, which isn't bound to the same-domain security policy as JavaScript.</p>
                    <p>The other important distinction is that Greasemonkey executes its scripts within a special sandbox that wraps each DOM node in a wrapper to prevent the page's scripts from mucking with Greasemonkey's scripts. This second difference makes it important that you avoid certain coding practices.</p>
                    <p>For instance, the <tt>onclick</tt> style of attaching events is not allowed through the sandbox, while the W3C style of adding event listeners does work:</p>
                    <pre>var link = document.getElementById('myLink');

// This won't work
link.onload = myHandler;

// This will work
link.addEventListener('click', myHandler, false);</pre>
                    <p>The reason the latter, but not the former, works is that the sandbox wrapper object only implements a subset of the interfaces offered by the actual DOM nodes. This might seem more limiting than it actually is, especially once you rely on JavaScript frameworks like MooTools to abstract these kinds of differences away.</p>  
                    <p>For more details about these differences, and the historical reasons they exist, take a look at the <a href="http://wiki.greasespot.net/Security">security page</a> of the Greasemonkey wiki.</p>
                </div>
                <br />
            </div>
            <div class="section">
                <h3>Reference links</h3>
                <div class="content">
                    <p>For more information about coding for Greasemonkey, check out the following:</p>
                    <ul>
                        <li><a href="http://wiki.greasespot.net/">Greasemonkey documentation</a></li>
                        <li><a href="http://diveintogreasemonkey.org/">Dive Into Greasemonkey</a></li>
                        <li><a href="http://www.oreilly.com/catalog/greasemonkeyhks/">Greasemonkey Hacks</a></li>
                        <li><a href="http://userscripts.org/">Userscript repository</a></li>
                        <li>Greasemonkey presentation slides from <a href="http://youngpup.net/gmtalk/presentation.html">Aaron Boodman</a> and <a href="http://diveintogreasemonkey.org/etech2006/">Mark Pilgrim</a></li>
                    </ul>
                </div>
                <br />
            </div>
            <h2 id="shiftspace-architecture">ShiftSpace architecture</h2>
            <div class="content">
                <p>The ShiftSpace platform seeks to provide a simple, extensible set of tools for users and developers to add additional meta content to the web. The following diagram should help illustrate how various components in the system relate to each other.</p>
                <img src="images/architecture.png" alt="ShiftSpace architecture" />
            </div>
            <br />
            <div class="section">
                <h3>Debug mode</h3>
                <div class="content">
                    <p>
                      <b>About the new debugging sandbox.</b>
                    </p>
                    <p>The debugging sandbox is a convenient place to build and test your Spaces.  Normally ShiftSpace runs entirely in the GreaseMonkey sandbox.  This prevents GreaseMonkey user scripts from interfering with scripts on the page and vice versa.  However this poses a problem when developing code for a Space- when an error occurs in your code you will almost certainly get a line number and message that is not useful.  To make debugging Spaces more pleasant we have a provided a special sandbox which can be reached by pointing your browser to http://ShiftSpaceInstallURL/sandbox/.</p>
                    <p>While in the debugging sandbox, ShiftSpace injects any installed Spaces as script tags directly onto the page as well as any css files.  This allows Firebug to give you precise line errors as well as the ability to set breakpoints, view the function stack, analyze objects, and run performance tests.  When writing complex Spaces this level of debugging control becomes very important and time-saving.</p>
                    <p>One handy trick is to make sure that ShiftSpace doesn't run on the sandbox URL via the Greasemonkey Preferences.   Then you can keep a second tab open in Firefox with ShiftSpace running on a real site.</p>
                </div>
                <br />
            </div>
            <h2 id="mootools">MooTools</h2>
            <div class="content">
                <p>ShiftSpace makes use of the <a href="http://www.mootools.net/">MooTools JavaScript framework</a>. You may be asking, "why MooTools instead of one of the wildly popular frameworks like Prototype or jQuery?" While these choices often boil down to matters of religion or personal taste, we think there is some objective justification for our choice.</p>
                <p>Firstly, MooTools is actually very similar to Prototype and intentionally immitates common patterns found in other frameworks. But the main reason we chose MooTools is for its Object Oriented code support. MooTools's inheritance model is simply better documented, and is designed to encourage programmers to extend the framework rather than just reuse prefab code.</p>
                <p>This difference focus can be observed by comparing the inheritance-oriented of <a href="http://docs.mootools.net/">MooTools's documentation</a> versus the subject-oriented nature of <a href="http://docs.jquery.com/">jQuery's</a> or <a href="http://www.prototypejs.org/api">Prototype's</a>. We opted for MooTools because the design of the framework is uniform and because it was designed with Object Orientation in mind from the very beginning. This design closely matches our goal of making ShiftSpace an easily extensible meta-layer over the web.</p>
            </div>
            <br />
            <div class="section">
                <h3>Classes</h3>
                <div class="content">
                    <p>One of the basic constructs of Object Oriented Programming (OOP) is the Class.  A Class wraps data and methods (functions) that act on this data into one nice little package.  Back in the old days of C programming, you had your data structures in structs and a whole bunch of independent functions for operating on them.  At some point someone realized the pattern and decided it would be more efficient to join these together through the design of the language itself.</p>
                    <p>If you have ever written code in Python, C++, Java, or Ruby the Object-Oriented model of programming should be familiar to you. MooTools makes it easy to write Classes and extend from those of others. Initially you can simply extend from the base classes, <a href="reference.html?shiftspace.space">ShiftSpace.Space</a> and <a href="reference.html?shiftspace.shift">ShiftSpace.Shift</a>, which handle much of the complexity of extending the platform while allowing their methods to be redefined and customized.</p>
                    <p>JavaScript, while imminently flexible, lacks many of the Object Oriented features that allow for code reuse through extension and inheritance. In MooTools, this is how you create a new Class:</p>
                    <pre>var MyClass = new MyClass({
    initialize: function() {
        // initialize your class here
    }
});</pre>
                    <p>The process of building a Space begins by extending from the ShiftSpace base classes. Extending a class, also known as subclassing, looks like the following:</p>
                    <pre>var MySubClass = new MyClass.extend({
    initialize: function() {
        // initialize your subclass here
    }
});</pre>
                    <p>The examples above only define the Class, they do not create instances of the Class. To make an instance of MySubClass you would do the following:</p>
                    <pre>var anInstance = new MySubClass();</pre>
                    <p>Voilà! You now have an instance of MySubClass, which also includes the functionality included with MyClass.</p>
                    <p>You can find more documentation of the MooTools Class construct in  the <a href="http://docs.mootools.net/Class/Class.js">their documentation</a> or in <a href="http://clientside.cnet.com/wiki/howtowriteamootoolsclass">the tutorial on the subject</a> hosted by CNET.</p>
                </div>
                <br/>
            </div>
            <div class="section">
                <h3>Elements</h3>
                <div class="content">
                    <p>Learning a new code framework is never trivial, but fortunately almost all of the convenience operations provided in the other popular frameworks exist in  MooTools (and then some). There are a few programming patterns unique to MooTools that you should become familiar with. First is the creation of Elements. The following example illustrates how you might create a link in MooTools vs standard DOM manipulation.</p>
                    <pre>// Standard DOM manipulations
var link = document.createElement('a');
link.setAttribute('href', 'http://shiftspace.org/');
link.appendChild(document.createTextNode('ShiftSpace'));

// The same code, but using MooTools
var link = new Element('a', {
    'href': 'http://shiftspace.org/'
});
link.appendText('ShiftSpace');</pre>
                    <p>ShiftSpace offers an extended version of MooTools's Element object, which addresses the problem of CSS from the page effecting your markup. Instead, use ShiftSpace.Element, which may also include other features in the future.</p>
                    <pre>// Instead of this...
var unpredictableDiv = new Element('div');

// ... use this:
var safeDiv = new ShiftSpace.Element('div');</pre>
                    <p>If your Space requires the use of a div element and is invoked on a page that defines a specific set of margins, padding or other styles for divs, <tt>safeDiv</tt> will reset them back to their default settings, while <tt>unpredictableDiv</tt> will be different depending on each page's CSS.</p>
                    <p>The <tt>ShiftSpace.Element</tt> class offers all of the same functionality as the regular <tt>Element</tt>, so you can still use everything offered by MooTools.</p>
                    <p>For more information about the MooTools Element construct, check out <a href="http://docs.mootools.net/Native/Element.js">its documentation page</a>.</p>
                </div>
                <br />
            </div>
            <div class="section">
                <h3>Styles</h3>
                <div class="content">
                    <p>While ShiftSpace does allow you to use separate CSS files for your Spaces and load them dynamically, MooTools offers convenient helpers, setStyle and setStyles, to set the styles of your elements inline.</p>
                    <pre>$('myDiv').setStyles({
    'position': 'absolute',
    'left': 80, // No need to specify 'px'
    'top': 150,
    'background-color': '#FC0' // Instead of "backgroundColor"
});</pre>
                </div>
                <br />
            </div>
            <div class="section">
                <h3>DOM</h3>
                <div class="content">
                    <p>As with other JavaScript frameworks you can access nodes in the DOM with the special $() function.  This function takes as it's only parameter the element's id attribute and returns its DOM node with additinional helper methods attached.</p>
                    <p>MooTools also provides a $$() function which <a href="http://docs.mootools.net/Native/Element.js#$$">takes a CSS selector string</a> and returns an array of elements.  This is a special array which can be acted upon as if it was a single Element.  All Elements in this list will be affected by a method call as if it were contained within an <tt>each</tt> iterator.  For more about <tt>each</tt> and other Array conveniences refer to the <a href="http://docs.mootools.net/Native/Array.js">MooTools documentation</a>.</p>
                    <p>When adding new DOM nodes to the page, you can use one of the MooTools methods for appending dynamically generated DOM nodes to the document. The most common is <tt>injectInside</tt>, as in the following:</p>
                    <pre>var myDiv = new Element('div');
myDiv.injectInside(document.body);</pre>
                    <p>Other variations include <tt>injectTop</tt>, <tt>injectBefore</tt> and <tt>injectAfter</tt>. You can find out more about these functions in the MooTools documentation on the <a href="http://docs.mootools.net/Native/Element.js">Element class</a>.</p>
                </div>
                <br />
            </div>
            <div class="section">
                <h3 id="mootools-events">Events</h3>
                <div class="content">
                    <p>To build the interface for your Space, you'll need to hook up your JavaScript methods to buttons and other user interface elements. The pattern for this is the following:</p>
                    <pre>$('myButton').addEvent('click', function() {
    alert('Hello!');
});</pre>
                    <p>Often, when building the interface for your Space or your Shift, you'll want user interactions to affect instances of your class. Normally events occur in the context of the DOM element where the event originated. This allows for the following to work:</p>
                    <pre>$('myButton').addEvent('click', function() {
    alert(this.getAttribute('id')); // Alerts "myButton"
});</pre>
                    <p>Even when object methods are attached to events, <tt>this</tt> still refers to the object that received the event (in this case, the button), not the object where the  method originates.</p>
                    <pre>var myClass = new Class({
    initialize: function() {
        this.message = 'Hello';
        $('myButton').addEvent('click', this.myMethod);
    }
    myMethod: function() {
        alert(this.message); // Won't work
    }
});</pre>
                    <p>When the event fires, <tt>this</tt> refers to the element that generated the event instead of the object with the <tt>message</tt> property. MooTools provides a function called <tt>bind</tt> to address this issue. If you have used jQuery or Prototype extensively you may have seen this pattern already. Using <tt>bind</tt> creates a closure so that the function will be called with <tt>this</tt> assigned to the object that makes most sense to you. In the second example, the event handler has been bound to the object with the message property.</p>
                    <pre>var myClass = new Class({
    initialize: function() {
        this.message = 'Hello';
        $('myButton').addEvent('click', this.myMethod.bind(this));
    }
    myMethod: function() {
        alert(this.message); // Will alert "Hello"
    }
});</pre>
                </div>
                <br/>
            </div>
            <div class="section">
                <h3>Reference links</h3>
                <div class="content">
                    <p>This summary is far from comprehensive, but MooTools provides much <a href="http://docs.mootools.net/">excellent documentation</a> that you can use to familiarize yourself with the platform. The <a href="http://demos.mootools.net/">animation effects</a> in MooTool are particularly powerful and well designed.  We use this feature throughout ShiftSpace and heavily in the Trails feature of ShiftSpace.</p>
                    <p>If you run into problems getting MooTools to work, you may try <a href="http://forum.mootools.net/search.php">searching</a> the <a href="http://forum.mootools.net/">MooTools forums</a> in case your problem has come up before.</p>
                </div>
                <br />
            </div>
            <h1 class="footer">Next section: <a href="tutorial.html">Tutorial</a></h1>
        </div>
        <br />
    </div>
</body>
</html>
