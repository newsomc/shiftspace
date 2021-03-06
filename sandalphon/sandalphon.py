#!/usr/bin/python

#  Take a HTML file and loads any referenced HTML files as well as CSS files.

import os
import sys
import re
import getopt
import urllib
import xml
import xml.etree.ElementTree as ElementTree # Python >= 2.5
import simplejson as json  # need to install simplejson from here http://pypi.python.org/pypi/simplejson/

class ViewParser:
    def __init__(self, element):
        self.element = element;


class SSTableViewParser(ViewParser):
    def __init__(self, element):
        ViewParser.__init__(self, element)
        pass


class SSCustomTableRowParser(ViewParser):
    def __init__(self, element):
        ViewParser.__init__(self, element)


def elementHasAttribute(element, attrib, value=None):
    """
    Check if an element has an attribute and matches a value
    """
    return ((value != None) and (element.get(attrib) == value)) or (element.get(attrib) != None)


class SandalphonCompiler:

    def __init__(self):
        # store paths to interface files
        self.paths = {}
        self.visitedViews = {}
        # store concatenated CSS file
        self.cssFile = ''
        # regex for template pattern /<\?.+?\?>/g
        self.templatePattern = re.compile('<\?.+?\?>')
        # generate lookup paths
        self.getPaths()


    def getPaths(self):
        """
        Looks into views and builds the paths to the interface files
        """
        viewsDirectory = "../client/views/"
        customViewsDirectory = "../client/customViews/"
        
        # grab the base view classes and filter out .svn files
        views = [f for f in os.listdir(viewsDirectory) if(f != ".svn")]
        # grab the custom views and filter out the .svn files
        customViews = [f for f in os.listdir(customViewsDirectory) if (f != ".svn")]

        self.paths = {}

        # These are bundle directories, .js .css .html
        for f in views:
            parts = os.path.splitext(f)
            base = parts[0]
            self.paths[base] = os.path.join(viewsDirectory, f)

        # These are not, need to look only for the html file, about to change
        for f in customViews:
            parts = os.path.splitext(f)
            base = parts[0]
            self.paths[base] = os.path.join(customViewsDirectory, base)
        

    def validateMarkup(self, markup):
        """
        Make sure the passed in markup checks out.
        """
        try:
            ElementTree.fromstring(markup)
        except xml.parsers.expat.ExpatError:
            raise xml.parsers.expat.ExpatError
        pass


    def parserForView(self, view):
        """
        Return the view parser class object associated with the view element.
        """
        theClass = view.get("uiclass") + "Parser"
        module = sys.modules[ViewParser.__module__]
        if(hasattr(module, theClass)):
            return getattr(module, theClass)
        else:
            return None


    def loadView(self, view, path=None):
        """
        Load a views a view and returns it.
        """
        # check to see if path is none otherwise check member var
        if path == None:
            filePath = self.paths[view]
        else:
            filePath = path

        if filePath != None:
            htmlPath = os.path.join(filePath, view+'.html')
            # load the file
            fileHandle = open(htmlPath)

            # verify that this file is valid mark up
            fileContents = fileHandle.read()
            fileHandle.close()
            
            # add this view's css if necessary
            if self.visitedViews.has_key(view) != True:
                self.addCSSForHTMLPath(os.path.join(filePath, view+'.html'))
                self.visitedViews[view] = True

            return fileContents
        else:
            return None


    def addCSSForHTMLPath(self, filePath):
        cssPath = os.path.splitext(filePath)[0]+".css"
        # load the css file
        try:
            fileHandle = open(cssPath)

            if fileHandle != None:
                self.cssFile = self.cssFile + "\n\n/*========== " + cssPath + " ==========*/\n\n" + fileHandle.read()

            fileHandle.close()
        except IOError:
            pass

    
    def addCSSForUIClasses(self, interfaceFile):
        """
        Loads an uiclass css that hasn't already been included.
        """
        # parse this file
        element = ElementTree.fromstring(interfaceFile)
        uiclasses = [el.get('uiclass') for el in element.findall(".//*") if elementHasAttribute(el, "uiclass")]

        # check the root element as well
        if elementHasAttribute(element, "uiclass"):
            uiclasses.append(element.get('uiclass'))

        seen = {}

        for item in uiclasses:
            seen[item] = True

        viewDirectory = "../client/views/"

        toLoad = seen.keys()
        [self.addCSSForHTMLPath(os.path.join(os.path.join(viewDirectory, item), item+".css")) for item in toLoad]

    
    def getInstruction(self, str):
        """
        Takes a raw template instruction and returns a tuple holding the instruction name and it's parameter.
        """
        temp = str[2:len(str)-2]
        temp = temp.split(':')
        return (temp[0], temp[1])

    
    def handleInstruction(self, instruction, file):
        """
        Takes an instruction tuple and the contents of the file as a string. Returns the file post instruction.
        """
        if instruction[0] == "customView":
            # load this view, will need match that view as well
            theView = self.loadView(instruction[1])
            # replace the match
            return self.templatePattern.sub(theView, file, 1)
        elif instruction[0] == "path":
            theView = self.loadView(os.path.basename(instruction[1]),
                                    os.path.dirname(instruction[1]))
            return self.templatePattern.sub(theView, file, 1)
        
        return file
    

    def compile(self, inputFile=None, outputDirectory=None, jsonOutput=False):
        """
        Compile an interface file down to its parts
        """
        # First regex any dependent files into a master view
        # Parse the file at the path
        fileHandle = open(inputFile)
        interfaceFile = fileHandle.read()
        fileHandle.close()

        # add the css for the main file at this path
        self.addCSSForHTMLPath(inputFile)
        
        hasCustomViews = True
        while hasCustomViews:
            match = self.templatePattern.search(interfaceFile)
            if match:
                # get the span of the match in the file
                span = match.span()
                # grab the instruction
                instruction = self.getInstruction(interfaceFile[span[0]:span[1]])
                # mutate the file based on it
                interfaceFile = self.handleInstruction(instruction, interfaceFile)
            else:
                hasCustomViews = False
                
        # validate it
        ElementTree.fromstring(interfaceFile)
 
        # load any css for references found at this level
        self.addCSSForUIClasses(interfaceFile)

        # output to specified directory or standard out or as json
        if outputDirectory != None:
            fileName = os.path.basename(inputFile)
            fullPath = os.path.join(outputDirectory, fileName)

            fileHandle = open(fullPath, "w")
            fileHandle.write(interfaceFile)
            fileHandle.close()

            cssFileName = os.path.splitext(fileName)[0]+".css"
            cssFilePath = os.path.join(outputDirectory, cssFileName)
            fileHandle = open(cssFilePath, "w")
            fileHandle.write(self.cssFile)
            fileHandle.close()

            # make it pretty 
            # AVITAL - removed call to tidy because of a bug it has that destroys textarea
            #          elements by inserting tabs where they shouldn't belong. 
            #          See http://sourceforge.net/tracker/index.php?func=detail&aid=1532698&group_id=27659&atid=390963
            #          and http://lists.w3.org/Archives/Public/html-tidy/2000OctDec/0341.html
            # return os.system('tidy -i -xml -m %s' % (fullPath))

        elif jsonOutput == True:
            outputJsonDict = {}
            outputJsonDict['interface'] = urllib.quote(interfaceFile)
            outputJsonDict['styles'] = urllib.quote(self.cssFile)
            print json.dumps(outputJsonDict, indent=4)

        else:
            print interfaceFile
            print "\n"
            print self.cssFile


def usage():
    print "sandalphon.py takes the following flags:"
    print "  -h help"
    print "  -i input file, must be an .html file"
    print "  -o output directory."
    print "  -j json output. Sends to standard out."


def main(argv):
    """
    Parse the command line arguments.
    """
    jsonOutput = False
    outputDirectory = None
    inputFile = None

    try:
        opts, args = getopt.getopt(argv, "i:o:jh", ["input=", "output=", "json", "help"])
    except:
        print "Invalid flag\n"
        usage()
        sys.exit(2)

    for opt, arg in opts:
        if opt in ("-h", "--help"):
            usage()
            sys.exit()
        elif opt in ("-i", "--input"):
            inputFile = arg
        elif opt in ("-o", "--output"):
            outputDirectory = arg
        elif opt in ("-j", "--json"):
            jsonOutput = True

    if inputFile == None:
        print "No input file\n"
        usage()
        sys.exit(2)

    compiler = SandalphonCompiler()
    compiler.compile(inputFile, outputDirectory, jsonOutput)


if __name__ == "__main__":
    if len(sys.argv) > 1:
        main(sys.argv[1:])
    else:
        usage()
