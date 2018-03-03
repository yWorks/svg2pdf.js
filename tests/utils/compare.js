/*
This file was taken from https://github.com/MrRio/jsPDF and slightly modified.

Copyright (c) 2010-2018 James Hall, https://github.com/MrRio/jsPDF
          (c) 2018 yWorks GmbH, https://yworks.com

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/


/* global XMLHttpRequest, expect */

function loadBinaryResource (url, unicodeCleanUp) {
  const req = new XMLHttpRequest()
  req.open('GET', url, false)
   // XHR binary charset opt by Marcus Granado 2006 [http://mgran.blogspot.com]
  req.overrideMimeType('text\/plain; charset=x-user-defined');
  req.send(null)
  if (req.status !== 200) {
    throw new Error('Unable to load file');
  }

  var responseText = req.responseText;
  var responseTextLen = req.responseText.length;
  var StringFromCharCode = String.fromCharCode;
  if (unicodeCleanUp === true) {    
    var i = 0;
    for (i = 0; i < responseText.length; i += 1) {
      byteArray.push(StringFromCharCode(responseText.charCodeAt(i) & 0xff))
    }
    return byteArray.join("");
  }
  return req.responseText;
}

function sendReference (filename, data) {
  const req = new XMLHttpRequest()
  req.open('POST', `http://localhost:9090/${filename}`, true)
  req.onload = e => {
    //console.log(e)
  }
  req.send(data)
}

const resetCreationDate = input =>
  input.replace(
    /\/CreationDate \(D:(.*?)\)/,
    '/CreationDate (D:19871210000000+00\'00\'\)'
  )

/**
 * Find a better way to set this
 * @type {Boolean}
 */
window.comparePdf = (actual, expectedFile, alwaysCreateReferences = false) => {
  let reference

  if (alwaysCreateReferences) {
    sendReference(expectedFile, resetCreationDate(actual))
    reference = actual
  } else {
    try {
      reference = loadBinaryResource("/base" + expectedFile, false)
    } catch (error) {
      sendReference(expectedFile, resetCreationDate(actual))
      reference = actual
    }
  }

  const expected = resetCreationDate(reference).trim()
  actual = resetCreationDate(actual.trim())

  expect(actual).toEqual(expected)
}
