/*
The MIT License (MIT)

Copyright (c) 2015-2017 yWorks GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

/**
 * Renders an svg element to a jsPDF document.
 * For accurate results a DOM document is required (mainly used for text size measurement and image format conversion)
 * @param element {HTMLElement} The svg element, which will be cloned, so the original stays unchanged.
 * @param pdf {jsPDF} The jsPDF object.
 * @param options {object} An object that may contain render options. Currently supported are:
 *                         scale: The global factor by which everything is scaled.
 *                         xOffset, yOffset: Offsets that are added to every coordinate AFTER scaling (They are not
 *                            influenced by the scale attribute).
 */
(function (global) {
  var RGBColor;
  var SvgPath;
  var FontFamily;
  var cssEsc;

  var _pdf; // jsPDF pdf-document

  var cToQ = 2 / 3; // ratio to convert quadratic bezier curves to cubic ones

  var iriReference = /url\(["']?#([^"']+)["']?\)/;

  // groups: 1: mime-type (+ charset), 2: mime-type (w/o charset), 3: charset, 4: base64?, 5: body
  var dataUrlRegex = /^\s*data:(([^/,;]+\/[^/,;]+)(?:;([^,;=]+=[^,;=]+))?)?(?:;(base64))?,(.*\s*)$/i;

  var svgNamespaceURI = "http://www.w3.org/2000/svg";


  // pathSegList is marked deprecated in chrome, so parse the d attribute manually if necessary
  var getPathSegList = function (node) {
    var d = getAttribute(node, "d");

    // Replace arcs before path segment list is handled
    if (SvgPath) {
      d = SvgPath(d).unshort().unarc().abs().toString();
      node.setAttribute('d', d);
    }

    var pathSegList = node.pathSegList;
    
    if (pathSegList) {
      return pathSegList;
    }

    pathSegList = [];

    var regex = /([a-df-zA-DF-Z])([^a-df-zA-DF-Z]*)/g,
        match;
    while (match = regex.exec(d)) {
      var coords = parseFloats(match[2]);

      var type = match[1];
      var length = "zZ".indexOf(type) >= 0 ? 0 :
          "hHvV".indexOf(type) >= 0  ? 1 :
          "mMlLtT".indexOf(type) >= 0  ? 2 :
          "sSqQ".indexOf(type) >= 0  ? 4 :
          "aA".indexOf(type) >= 0  ? 7 :
          "cC".indexOf(type) >= 0  ? 6 : -1;

      var i = 0;
      do {
        var pathSeg = {pathSegTypeAsLetter: type};
        switch (type) {
          case "h":
          case "H":
            pathSeg.x = coords[i];
            break;

          case "v":
          case "V":
            pathSeg.y = coords[i];
            break;

          case "c":
          case "C":
            pathSeg.x1 = coords[i + length - 6];
            pathSeg.y1 = coords[i + length - 5];
          case "s":
          case "S":
            pathSeg.x2 = coords[i + length - 4];
            pathSeg.y2 = coords[i + length - 3];
          case "t":
          case "T":
          case "l":
          case "L":
          case "m":
          case "M":
            pathSeg.x = coords[i + length - 2];
            pathSeg.y = coords[i + length - 1];
            break;

          case "q":
          case "Q":
            pathSeg.x1 = coords[i];
            pathSeg.y1 = coords[i + 1];
            pathSeg.x = coords[i + 2];
            pathSeg.y = coords[i + 3];
            break;
          case "a":
          case "A":
            throw new Error("Cannot convert Arcs without SvgPath package");
        }

        pathSegList.push(pathSeg);

        // "If a moveto is followed by multiple pairs of coordinates, the subsequent pairs are treated as implicit
        // lineto commands"
        if (type === "m") {
          type = "l";
        } else if (type === "M") {
          type = "L";
        }

        i += length;
      } while(i < coords.length);
    }

    pathSegList.getItem = function (i) {
      return this[i]
    };
    pathSegList.numberOfItems = pathSegList.length;

    return pathSegList;
  };

  // returns an attribute of a node, either from the node directly or from css
  var getAttribute = function (node, propertyNode, propertyCss) {
    propertyCss = propertyCss || propertyNode;
    var attribute = node.style[propertyCss];
    if (attribute) {
      return attribute;
    } else if (node.hasAttribute(propertyNode)) {
      return node.getAttribute(propertyNode);
    } else {
      return void 0
    }
  };

  /**
   * @param {Element} node
   * @param {string} tagsString
   * @return {boolean}
   */
  var nodeIs = function (node, tagsString) {
    return tagsString.split(",").indexOf(node.tagName.toLowerCase()) >= 0;
  };

  var forEachChild = function (node, fn) {
    // copy list of children, as the original might be modified
    var children = [];
    for (var i = 0; i < node.childNodes.length; i++) {
      var childNode = node.childNodes[i];
      if (childNode.nodeName.charAt(0) !== "#")
        children.push(childNode);
    }
    for (i = 0; i < children.length; i++) {
      fn(i, children[i]);
    }
  };

  var getAngle = function (from, to) {
    return Math.atan2(to[1] - from[1], to[0] - from[0]);
  };

  function normalize(v) {
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1]);
    return [v[0] / length, v[1] / length];
  }

  function getDirectionVector(from, to) {
    var v = [to[0] - from[0], to[1] - from[1]];
    return normalize(v);
  }

  function addVectors(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1]];
  }

  // mirrors p1 at p2
  var mirrorPoint = function (p1, p2) {
    var dx = p2[0] - p1[0];
    var dy = p2[1] - p1[1];

    return [p1[0] + 2 * dx, p1[1] + 2 * dy];
  };

  // transforms a cubic bezier control point to a quadratic one: returns from + (2/3) * (to - from)
  var toCubic = function (from, to) {
    return [cToQ * (to[0] - from[0]) + from[0], cToQ * (to[1] - from[1]) + from[1]];
  };

  // extracts a control point from a previous path segment (for t,T,s,S segments)
  var getControlPointFromPrevious = function (i, from, list, prevX, prevY) {
    var prev = list.getItem(i - 1);
    var p2;
    if (i > 0 && (prev.pathSegTypeAsLetter === "C" || prev.pathSegTypeAsLetter === "S")) {
      p2 = mirrorPoint([prev.x2, prev.y2], from);
    } else if (i > 0 && (prev.pathSegTypeAsLetter === "c" || prev.pathSegTypeAsLetter === "s")) {
      p2 = mirrorPoint([prev.x2 + prevX, prev.y2 + prevY], from);
    } else {
      p2 = [from[0], from[1]];
    }
    return p2;
  };

  /**
   * @param {Element} rootSvg
   * @constructor
   * @property {Object.<String,Element>} renderedElements
   * @property {Element} rootSvg
   */
  function ReferencesHandler(rootSvg) {
    this.renderedElements = {};
    this.rootSvg = rootSvg;
  }

  /**
   * @param {string} id
   * @return {*}
   */
  ReferencesHandler.prototype.getRendered = function (id) {
    if (this.renderedElements.hasOwnProperty(id)) {
      return this.renderedElements[id];
    }

    var node = this.rootSvg.querySelector("#" + cssEsc(id, {isIdentifier: true}));

    if (nodeIs(node, "lineargradient")) {
      putGradient(node, "axial", [
        node.getAttribute("x1") || 0,
        node.getAttribute("y1") || 0,
        node.getAttribute("x2") || 1,
        node.getAttribute("y2") || 0
      ]);
    } else if (nodeIs(node, "radialgradient")) {
      putGradient(node, "radial", [
        node.getAttribute("fx") || node.getAttribute("cx") || 0.5,
        node.getAttribute("fy") || node.getAttribute("cy") || 0.5,
        0,
        node.getAttribute("cx") || 0.5,
        node.getAttribute("cy") || 0.5,
        node.getAttribute("r") || 0.5
      ]);
    } else if (nodeIs(node, "pattern")) {
      pattern(node, this, AttributeState.default())
    } else if (nodeIs(node, "marker")) {
      // the transformations directly at the node are written to the pdf form object transformation matrix
      var tfMatrix = computeNodeTransform(node);
      var bBox = getUntransformedBBox(node);

      _pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], tfMatrix);
      renderChildren(node, _pdf.unitMatrix, this, false, false, AttributeState.default());
      _pdf.endFormObject(node.getAttribute("id"));
    } else if (!nodeIs(node, "clippath")) {
      // all other nodes will be rendered as PDF form object
      renderNode(node, _pdf.unitMatrix, this, true, false, AttributeState.default());
    }

    this.renderedElements[id] = node;
    return node;
  };

  var AttributeState = function () {
    this.xmlSpace = null;
    this.color = null;
    this.fill = null;
    this.fillOpacity = 1.0;
    // this.fillRule = null;
    this.fontFamily = null;
    this.fontSize = 16;
    this.fontStyle = null;
    // this.fontVariant = null;
    this.fontWeight = null;
    this.opacity = 1.0;
    this.stroke = null;
    this.strokeDasharray = null;
    this.strokeDashoffset = null;
    this.strokeLinecap = null;
    this.strokeLinejoin = null;
    this.strokeMiterlimit = 4.0;
    this.strokeOpacity = 1.0;
    this.strokeWidth = 1.0;
    // this.textAlign = null;
    this.textAnchor = null;
    this.visibility = null;
  };

  AttributeState.default = function () {
    var attributeState = new AttributeState();

    attributeState.xmlSpace = "default";
    attributeState.fill = new RGBColor("rgb(0, 0, 0)");
    attributeState.fillOpacity = 1.0;
    // attributeState.fillRule = "nonzero";
    attributeState.fontFamily = "times";
    attributeState.fontSize = 16;
    attributeState.fontStyle = "normal";
    // attributeState.fontVariant = "normal";
    attributeState.fontWeight = "normal";
    attributeState.opacity = 1.0;
    attributeState.stroke = null;
    attributeState.strokeDasharray = null;
    attributeState.strokeDashoffset = null;
    attributeState.strokeLinecap = "butt";
    attributeState.strokeLinejoin = "miter";
    attributeState.strokeMiterlimit = 4.0;
    attributeState.strokeOpacity = 1.0;
    attributeState.strokeWidth = 1.0;
    // attributeState.textAlign = "start";
    attributeState.textAnchor = "start";
    attributeState.visibility = "visible";

    return attributeState;
  };

  AttributeState.prototype.clone = function () {
    var clone = new AttributeState();

    clone.xmlSpace = this.xmlSpace;
    clone.fill = this.fill;
    clone.fillOpacity = this.fillOpacity;
    // clone.fillRule = this.fillRule;
    clone.fontFamily = this.fontFamily;
    clone.fontSize = this.fontSize;
    clone.fontStyle = this.fontStyle;
    // clone.fontVariant = this.fontVariant;
    clone.fontWeight = this.fontWeight;
    clone.opacity = this.opacity;
    clone.stroke = this.stroke;
    clone.strokeDasharray = this.strokeDasharray;
    clone.strokeDashoffset = this.strokeDashoffset;
    clone.strokeLinecap = this.strokeLinecap;
    clone.strokeLinejoin = this.strokeLinejoin;
    clone.strokeMiterlimit = this.strokeMiterlimit;
    clone.strokeOpacity = this.strokeOpacity;
    clone.strokeWidth = this.strokeWidth;
    // clone.textAlign = this.textAlign;
    clone.textAnchor = this.textAnchor;
    clone.visibility = this.visibility;

    return clone;
  };

  /**
   * @constructor
   * @property {Marker[]} markers
   */
  function MarkerList() {
    this.markers = [];
  }

  /**
   * @param {Marker} marker
   */
  MarkerList.prototype.addMarker = function addMarker(marker) {
    this.markers.push(marker);
  };

  MarkerList.prototype.draw = function (tfMatrix, refsHandler, attributeState) {
    for (var i = 0; i < this.markers.length; i++) {
      var marker = this.markers[i];

      var tf;
      var angle = marker.angle, anchor = marker.anchor;
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);
      // position at and rotate around anchor
      tf = new _pdf.Matrix(cos, sin, -sin, cos, anchor[0], anchor[1]);
      // scale with stroke-width
      tf = _pdf.matrixMult(new _pdf.Matrix(attributeState.strokeWidth, 0, 0, attributeState.strokeWidth, 0, 0), tf);

      tf = _pdf.matrixMult(tf, tfMatrix);

      // as the marker is already scaled by the current line width we must not apply the line width twice!
      _pdf.saveGraphicsState();
      _pdf.setLineWidth(1.0);
      refsHandler.getRendered(marker.id);
      _pdf.doFormObject(marker.id, tf);
      _pdf.restoreGraphicsState();
    }
  };

  /**
   * @param {string} id
   * @param {[number,number]} anchor
   * @param {number} angle
   */
  function Marker(id, anchor, angle) {
    this.id = id;
    this.anchor = anchor;
    this.angle = angle;
  }

  function removeNewlines(str) {
    return str.replace(/[\n\r]/g, "");
  }

  function replaceTabsBySpace(str) {
    return str.replace(/[\t]/g, " ");
  }

  function consolidateSpaces(str) {
    return str.replace(/ +/g, " ");
  }

  function trimLeft(str) {
    return str.replace(/^\s+/,"");
  }

  function trimRight(str) {
    return str.replace(/\s+$/,"");
  }

  function computeViewBoxTransform(node, viewBox, eX, eY, eWidth, eHeight) {
    var vbX = viewBox[0];
    var vbY = viewBox[1];
    var vbWidth = viewBox[2];
    var vbHeight = viewBox[3];

    var scaleX = eWidth / vbWidth;
    var scaleY = eHeight / vbHeight;

    var align, meetOrSlice;
    var preserveAspectRatio = node.getAttribute("preserveAspectRatio");
    if (preserveAspectRatio) {
      var alignAndMeetOrSlice = preserveAspectRatio.split(" ");
      if (alignAndMeetOrSlice[0] === "defer") {
        alignAndMeetOrSlice = alignAndMeetOrSlice.slice(1);
      }

      align = alignAndMeetOrSlice[0];
      meetOrSlice = alignAndMeetOrSlice[1] || "meet";
    } else {
      align = "xMidYMid";
      meetOrSlice = "meet"
    }

    if (align !== "none") {
      if (meetOrSlice === "meet") {
        // uniform scaling with min scale
        scaleX = scaleY = Math.min(scaleX, scaleY);
      } else if (meetOrSlice === "slice") {
        // uniform scaling with max scale
        scaleX = scaleY = Math.max(scaleX, scaleY);
      }
    }

    var translateX = eX - (vbX * scaleX);
    var translateY = eY - (vbY * scaleY);

    if (align.indexOf("xMid") >= 0) {
      translateX += (eWidth - vbWidth * scaleX) / 2;
    } else if (align.indexOf("xMax") >= 0) {
      translateX += eWidth - vbWidth * scaleX;
    }

    if (align.indexOf("yMid") >= 0) {
      translateY += (eHeight - vbHeight * scaleY) / 2;
    } else if (align.indexOf("yMax") >= 0) {
      translateY += (eHeight - vbHeight * scaleY);
    }

    var translate = new _pdf.Matrix(1, 0, 0, 1, translateX, translateY);
    var scale = new _pdf.Matrix(scaleX, 0, 0, scaleY, 0, 0);

    return _pdf.matrixMult(scale, translate);
  }

  // computes the transform directly applied at the node (such as viewbox scaling and the "transform" atrribute)
  // x,y,cx,cy,r,... are omitted
  var computeNodeTransform = function (node) {
    var viewBox, x, y;
    var nodeTransform = _pdf.unitMatrix;
    if (nodeIs(node, "svg,g")) {
      x = parseFloat(getAttribute(node, "x")) || 0;
      y = parseFloat(getAttribute(node, "y")) || 0;

      viewBox = node.getAttribute("viewBox");
      if (viewBox) {
        var box = parseFloats(viewBox);
        var width = parseFloat(getAttribute(node, "width")) || box[2];
        var height = parseFloat(getAttribute(node, "height")) || box[3];
        nodeTransform = computeViewBoxTransform(node, box, x, y, width, height)
      } else {
        nodeTransform = new _pdf.Matrix(1, 0, 0, 1, x, y);
      }
    } else if (nodeIs(node, "marker")) {
      x = parseFloat(node.getAttribute("refX")) || 0;
      y = parseFloat(node.getAttribute("refY")) || 0;

      viewBox = node.getAttribute("viewBox");
      if (viewBox) {
        var bounds = parseFloats(viewBox);
        bounds[0] = bounds[1] = 0; // for some reason vbX anc vbY seem to be ignored for markers
        nodeTransform = computeViewBoxTransform(node,
            bounds,
            0,
            0,
            parseFloat(node.getAttribute("markerWidth")) || 3,
            parseFloat(node.getAttribute("markerHeight")) || 3
        );
        nodeTransform = _pdf.matrixMult(new _pdf.Matrix(1, 0, 0, 1, -x, -y), nodeTransform);
      } else {
        nodeTransform = new _pdf.Matrix(1, 0, 0, 1, -x, -y);
      }
    }

    var transformString = getAttribute(node, "transform");
    if (!transformString)
      return nodeTransform;
    else
      return _pdf.matrixMult(nodeTransform, parseTransform(transformString));
  };

  // parses the "points" string used by polygons and returns an array of points
  var parsePointsString = function (string) {
    var floats = parseFloats(string);
    var result = [];
    for (var i = 0; i < floats.length - 1; i += 2) {
      var x = floats[i];
      var y = floats[i + 1];
      result.push([x, y]);
    }
    return result;
  };

  // parses the "transform" string
  var parseTransform = function (transformString) {
    if (!transformString || transformString === "none")
      return _pdf.unitMatrix;

    var mRegex = /^\s*matrix\(([^\)]+)\)\s*/,
        tRegex = /^\s*translate\(([^\)]+)\)\s*/,
        rRegex = /^\s*rotate\(([^\)]+)\)\s*/,
        sRegex = /^\s*scale\(([^\)]+)\)\s*/,
        sXRegex = /^\s*skewX\(([^\)]+)\)\s*/,
        sYRegex = /^\s*skewY\(([^\)]+)\)\s*/;

    var resultMatrix = _pdf.unitMatrix, m;

    while (transformString.length > 0) {
      var match = mRegex.exec(transformString);
      if (match) {
        m = parseFloats(match[1]);
        resultMatrix = _pdf.matrixMult(new _pdf.Matrix(m[0], m[1], m[2], m[3], m[4], m[5]), resultMatrix);
        transformString = transformString.substr(match[0].length);
      }
      match = rRegex.exec(transformString);
      if (match) {
        m = parseFloats(match[1]);
        var a = Math.PI * m[0] / 180;
        resultMatrix = _pdf.matrixMult(new _pdf.Matrix(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0), resultMatrix);
        if (m[1] && m[2]) {
          var t1 = new _pdf.Matrix(1, 0, 0, 1, m[1], m[2]);
          var t2 = new _pdf.Matrix(1, 0, 0, 1, -m[1], -m[2]);
          resultMatrix = _pdf.matrixMult(t2, _pdf.matrixMult(resultMatrix, t1));
        }
        transformString = transformString.substr(match[0].length);
      }
      match = tRegex.exec(transformString);
      if (match) {
        m = parseFloats(match[1]);
        resultMatrix = _pdf.matrixMult(new _pdf.Matrix(1, 0, 0, 1, m[0], m[1] || 0), resultMatrix);
        transformString = transformString.substr(match[0].length);
      }
      match = sRegex.exec(transformString);
      if (match) {
        m = parseFloats(match[1]);
        if (!m[1])
          m[1] = m[0];
        resultMatrix = _pdf.matrixMult(new _pdf.Matrix(m[0], 0, 0, m[1], 0, 0), resultMatrix);
        transformString = transformString.substr(match[0].length);
      }
      match = sXRegex.exec(transformString);
      if (match) {
        m = parseFloat(match[1]);
        resultMatrix = _pdf.matrixMult(new _pdf.Matrix(1, 0, Math.tan(m), 1, 0, 0), resultMatrix);
        transformString = transformString.substr(match[0].length);
      }
      match = sYRegex.exec(transformString);
      if (match) {
        m = parseFloat(match[1]);
        resultMatrix = _pdf.matrixMult(new _pdf.Matrix(1, Math.tan(m), 0, 1, 0, 0), resultMatrix);
        transformString = transformString.substr(match[0].length);
      }
    }
    return resultMatrix;
  };

  // parses a comma, sign and/or whitespace separated string of floats and returns the single floats in an array
  var parseFloats = function (str) {
    var floats = [], match,
        regex = /[+-]?(?:(?:\d+\.?\d*)|(?:\d*\.?\d+))(?:[eE][+-]?\d+)?/g;
    while(match = regex.exec(str)) {
      floats.push(parseFloat(match[0]));
    }
    return floats;
  };

  // extends RGBColor by rgba colors as RGBColor is not capable of it
  var parseColor = function (colorString) {
    if (colorString === "transparent") {
      var transparent = new RGBColor("rgb(0,0,0)");
      transparent.a = 0;
      return transparent
    }

    var match = /\s*rgba\(((?:[^,\)]*,){3}[^,\)]*)\)\s*/.exec(colorString);
    if (match) {
      var floats = parseFloats(match[1]);
      var color = new RGBColor("rgb(" + floats.slice(0,3).join(",") + ")");
      color.a = floats[3];
      return color;
    } else {
      return new RGBColor(colorString);
    }
  };

  // multiplies a vector with a matrix: vec' = vec * matrix
  var multVecMatrix = function (vec, matrix) {
    var x = vec[0];
    var y = vec[1];
    return [
      matrix.a * x + matrix.c * y + matrix.e,
      matrix.b * x + matrix.d * y + matrix.f
    ];
  };

  // returns the untransformed bounding box [x, y, width, height] of an svg element (quite expensive for path and polygon objects, as
  // the whole points/d-string has to be processed)
  var getUntransformedBBox = function (node) {
    if (getAttribute(node, "display") === "none") {
      return [0, 0, 0, 0];
    }

    var i, minX, minY, maxX, maxY, viewBox, vb, boundingBox;
    var pf = parseFloat;

    if (nodeIs(node, "polygon,polyline")) {
      var points = parsePointsString(node.getAttribute("points"));
      minX = Number.POSITIVE_INFINITY;
      minY = Number.POSITIVE_INFINITY;
      maxX = Number.NEGATIVE_INFINITY;
      maxY = Number.NEGATIVE_INFINITY;
      for (i = 0; i < points.length; i++) {
        var point = points[i];
        minX = Math.min(minX, point[0]);
        maxX = Math.max(maxX, point[0]);
        minY = Math.min(minY, point[1]);
        maxY = Math.max(maxY, point[1]);
      }
      boundingBox = [
        minX,
        minY,
        maxX - minX,
        maxY - minY
      ];
    } else if (nodeIs(node, "path")) {
      var list = getPathSegList(node);
      minX = Number.POSITIVE_INFINITY;
      minY = Number.POSITIVE_INFINITY;
      maxX = Number.NEGATIVE_INFINITY;
      maxY = Number.NEGATIVE_INFINITY;
      var x = 0, y = 0;
      var prevX, prevY, newX, newY;
      var p2, p3, to;
      for (i = 0; i < list.numberOfItems; i++) {
        var seg = list.getItem(i);
        var cmd = seg.pathSegTypeAsLetter;
        switch (cmd) {
          case "H":
            newX = seg.x;
            newY = y;
            break;
          case "h":
            newX = seg.x + x;
            newY = y;
            break;
          case "V":
            newX = x;
            newY = seg.y;
            break;
          case "v":
            newX = x;
            newY = seg.y + y;
            break;
          case "C":
            p2 = [seg.x1, seg.y1];
            p3 = [seg.x2, seg.y2];
            to = [seg.x, seg.y];
            break;
          case "c":
            p2 = [seg.x1 + x, seg.y1 + y];
            p3 = [seg.x2 + x, seg.y2 + y];
            to = [seg.x + x, seg.y + y];
            break;
          case "S":
            p2 = getControlPointFromPrevious(i, [x, y], list, prevX, prevY);
            p3 = [seg.x2, seg.y2];
            to = [seg.x, seg.y];
            break;
          case "s":
            p2 = getControlPointFromPrevious(i, [x, y], list, prevX, prevY);
            p3 = [seg.x2 + x, seg.y2 + y];
            to = [seg.x + x, seg.y + y];
            break;
          case "Q":
            pf = [seg.x1, seg.y1];
            p2 = toCubic([x, y], pf);
            p3 = toCubic([seg.x, seg.y], pf);
            to = [seg.x, seg.y];
            break;
          case "q":
            pf = [seg.x1 + x, seg.y1 + y];
            p2 = toCubic([x, y], pf);
            p3 = toCubic([x + seg.x, y + seg.y], pf);
            to = [seg.x + x, seg.y + y];
            break;
          case "T":
            p2 = getControlPointFromPrevious(i, [x, y], list, prevX, prevY);
            p2 = toCubic([x, y], pf);
            p3 = toCubic([seg.x, seg.y], pf);
            to = [seg.x, seg.y];
            break;
          case "t":
            pf = getControlPointFromPrevious(i, [x, y], list, prevX, prevY);
            p2 = toCubic([x, y], pf);
            p3 = toCubic([x + seg.x, y + seg.y], pf);
            to = [seg.x + x, seg.y + y];
            break;
          // TODO: A,a
        }
        if ("sScCqQtT".indexOf(cmd) >= 0) {
          prevX = x;
          prevY = y;
        }
        if ("MLCSQT".indexOf(cmd) >= 0) {
          x = seg.x;
          y = seg.y;
        } else if ("mlcsqt".indexOf(cmd) >= 0) {
          x = seg.x + x;
          y = seg.y + y;
        } else if ("zZ".indexOf(cmd) < 0) {
          x = newX;
          y = newY;
        }
        if ("CSQTcsqt".indexOf(cmd) >= 0) {
          minX = Math.min(minX, x, p2[0], p3[0], to[0]);
          maxX = Math.max(maxX, x, p2[0], p3[0], to[0]);
          minY = Math.min(minY, y, p2[1], p3[1], to[1]);
          maxY = Math.max(maxY, y, p2[1], p3[1], to[1]);
        } else {
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
        }
      }
      boundingBox = [
        minX,
        minY,
        maxX - minX,
        maxY - minY
      ];
    } else if (nodeIs(node, "svg")) {
      viewBox = node.getAttribute("viewBox");
      if (viewBox) {
        vb = parseFloats(viewBox);
      }
      return [
        pf(getAttribute(node, "x")) || (vb && vb[0]) || 0,
        pf(getAttribute(node, "y")) || (vb && vb[1]) || 0,
        pf(getAttribute(node, "width")) || (vb && vb[2]) || 0,
        pf(getAttribute(node, "height")) || (vb && vb[3]) || 0
      ];
    } else if (nodeIs(node, "g,clippath")) {
      boundingBox = [0, 0, 0, 0];
      forEachChild(node, function (i, node) {
        var nodeBox = getUntransformedBBox(node);
        boundingBox = [
            Math.min(boundingBox[0], nodeBox[0]),
            Math.min(boundingBox[1], nodeBox[1]),
            Math.max(boundingBox[0] + boundingBox[2], nodeBox[0] + nodeBox[2]) - Math.min(boundingBox[0], nodeBox[0]),
            Math.max(boundingBox[1] + boundingBox[3], nodeBox[1] + nodeBox[3]) - Math.min(boundingBox[1], nodeBox[1])
        ];
      });
    } else if (nodeIs(node, "marker")) {
      viewBox = node.getAttribute("viewBox");
      if (viewBox) {
        vb = parseFloats(viewBox);
      }
      return [
        (vb && vb[0]) || 0,
        (vb && vb[1]) || 0,
        (vb && vb[2]) || pf(node.getAttribute("marker-width")) || 0,
        (vb && vb[3]) || pf(node.getAttribute("marker-height")) || 0
      ];
    } else if (nodeIs(node, "pattern")) {
      return [
          pf(node.getAttribute("x")) || 0,
          pf(node.getAttribute("y")) || 0,
          pf(node.getAttribute("width")) || 0,
          pf(node.getAttribute("height")) || 0
      ]
    } else {
      // TODO: check if there are other possible coordinate attributes
      var x1 = pf(node.getAttribute("x1")) || pf(getAttribute(node, "x")) || pf((getAttribute(node, "cx")) - pf(getAttribute(node, "r"))) || 0;
      var x2 = pf(node.getAttribute("x2")) || (x1 + pf(getAttribute(node, "width"))) || (pf(getAttribute(node, "cx")) + pf(getAttribute(node, "r"))) || 0;
      var y1 = pf(node.getAttribute("y1")) || pf(getAttribute(node, "y")) || (pf(getAttribute(node, "cy")) - pf(getAttribute(node, "r"))) || 0;
      var y2 = pf(node.getAttribute("y2")) || (y1 + pf(getAttribute(node, "height"))) || (pf(getAttribute(node, "cy")) + pf(getAttribute(node, "r"))) || 0;
      boundingBox = [
        Math.min(x1, x2),
        Math.min(y1, y2),
        Math.max(x1, x2) - Math.min(x1, x2),
        Math.max(y1, y2) - Math.min(y1, y2)
      ];
    }

    if (!nodeIs(node, "marker,svg,g")) {
      // add line-width
      var lineWidth = getAttribute(node, "stroke-width") || 1;
      var miterLimit = getAttribute(node, "stroke-miterlimit");
      // miterLength / lineWidth = 1 / sin(phi / 2)
      miterLimit && (lineWidth *= 0.5 / (Math.sin(Math.PI / 12)));
      return [
          boundingBox[0] - lineWidth,
          boundingBox[1] - lineWidth,
          boundingBox[2] + 2 * lineWidth,
          boundingBox[3] + 2 * lineWidth
      ];
    }

    return boundingBox;
  };

  // transforms a bounding box and returns a new rect that contains it
  var transformBBox = function (box, matrix) {
    var bl = multVecMatrix([box[0], box[1]], matrix);
    var br = multVecMatrix([box[0] + box[2], box[1]], matrix);
    var tl = multVecMatrix([box[0], box[1] + box[3]], matrix);
    var tr = multVecMatrix([box[0] + box[2], box[1] + box[3]], matrix);

    var bottom = Math.min(bl[1], br[1], tl[1], tr[1]);
    var left = Math.min(bl[0], br[0], tl[0], tr[0]);
    var top = Math.max(bl[1], br[1], tl[1], tr[1]);
    var right = Math.max(bl[0], br[0], tl[0], tr[0]);

    return [
      left,
      bottom,
      right - left,
      top - bottom
    ]
  };

  // draws a polygon
  var polygon = function (node, refsHandler, attributeState, closed) {
    if (!node.hasAttribute("points") || node.getAttribute("points") === "") {
      return;
    }

    var points = parsePointsString(node.getAttribute("points"));
    var lines = [{op: "m", c: points[0]}];
    var i, angle;
    for (i = 1; i < points.length; i++) {
      lines.push({op: "l", c: points[i]});
    }

    if (closed) {
      lines.push({op: "h"});
    }

    _pdf.path(lines);

    var markerEnd = getAttribute(node, "marker-end"),
        markerStart = getAttribute(node, "marker-start"),
        markerMid = getAttribute(node, "marker-mid");

    if (markerStart || markerMid || markerEnd) {
      var length = lines.length;
      var markers = new MarkerList();
      if (markerStart) {
        markerStart = iriReference.exec(markerStart)[1];
        angle = addVectors(getDirectionVector(lines[0].c, lines[1].c), getDirectionVector(lines[length - 2].c, lines[0].c));
        markers.addMarker(new Marker(markerStart, lines[0].c, Math.atan2(angle[1], angle[0])));
      }

      if (markerMid) {
        markerMid = iriReference.exec(markerMid)[1];
        var prevAngle = getDirectionVector(lines[0].c, lines[1].c), curAngle;
        for (i = 1; i < lines.length - 2; i++) {
          curAngle = getDirectionVector(lines[i].c, lines[i + 1].c);
          angle = addVectors(prevAngle, curAngle);
          markers.addMarker(new Marker(markerMid, lines[i].c, Math.atan2(angle[1], angle[0])));
          prevAngle = curAngle;
        }

        curAngle = getDirectionVector(lines[length - 2].c, lines[0].c);
        angle = addVectors(prevAngle, curAngle);
        markers.addMarker(new Marker(markerMid, lines[length - 2].c, Math.atan2(angle[1], angle[0])));
      }

      if (markerEnd) {
        markerEnd = iriReference.exec(markerEnd)[1];
        angle = addVectors(getDirectionVector(lines[0].c, lines[1].c), getDirectionVector(lines[length - 2].c, lines[0].c));
        markers.addMarker(new Marker(markerEnd, lines[0].c, Math.atan2(angle[1], angle[0])));
      }

      markers.draw(_pdf.unitMatrix, refsHandler, attributeState);
    }
  };

  // draws an image
  var image = function (node) {
    var width = parseFloat(getAttribute(node, "width")),
        height = parseFloat(getAttribute(node, "height")),
        x = parseFloat(getAttribute(node, "x") || 0),
        y = parseFloat(getAttribute(node, "y") || 0);


    var imageUrl = node.getAttribute("xlink:href") || node.getAttribute("href");

    var dataUrl = imageUrl.match(dataUrlRegex);
    if (dataUrl && dataUrl[2] === "image/svg+xml") {
      var svgText = dataUrl[5];
      if (dataUrl[4] === "base64") {
        svgText = atob(svgText);
      } else {
        svgText = decodeURIComponent(svgText);
      }

      var parser = new DOMParser();
      var svgElement = parser.parseFromString(svgText, "image/svg+xml").firstElementChild;

      // unless preserveAspectRatio starts with "defer", the preserveAspectRatio attribute of the svg is ignored
      var preserveAspectRatio = node.getAttribute("preserveAspectRatio");
      if (!preserveAspectRatio
          || preserveAspectRatio.indexOf("defer") < 0
          || !svgElement.getAttribute("preserveAspectRatio")) {
        svgElement.setAttribute("preserveAspectRatio", preserveAspectRatio);
      }

      svgElement.setAttribute("x", String(x));
      svgElement.setAttribute("y", String(y));
      svgElement.setAttribute("width", String(width));
      svgElement.setAttribute("height", String(height));

      renderNode(svgElement, _pdf.unitMatrix, new ReferencesHandler(svgElement), false, false, AttributeState.default());
      return;
    }

    try {
      _pdf.addImage(
          imageUrl,
          "", // will be ignored anyways if imageUrl is a data url
          x,
          y,
          width,
          height
      );
    } catch (e) {
      (typeof console === "object"
          && console.warn
          && console.warn('svg2pdfjs: Images with external resource link are not supported! ("' + imageUrl + '")'));
    }
  };

  // draws a path
  var path = function (node, tfMatrix, refsHandler, withinClipPath, attributeState) {
    var list = getPathSegList(node);
    var markerEnd = getAttribute(node, "marker-end"),
        markerStart = getAttribute(node, "marker-start"),
        markerMid = getAttribute(node, "marker-mid");

    markerEnd && (markerEnd = iriReference.exec(markerEnd)[1]);
    markerStart && (markerStart = iriReference.exec(markerStart)[1]);
    markerMid && (markerMid = iriReference.exec(markerMid)[1]);

    var getLinesFromPath = function () {
      var x = 0, y = 0;
      var x0 = x, y0 = y;
      var prevX, prevY, newX, newY;
      var to, p, p2, p3;
      var lines = [];
      var markers = new MarkerList();
      var op;
      var prevAngle = [0, 0], curAngle;

      for (var i = 0; i < list.numberOfItems; i++) {
        var seg = list.getItem(i);
        var cmd = seg.pathSegTypeAsLetter;
        switch (cmd) {
          case "M":
            x0 = x;
            y0 = y;
            to = [seg.x, seg.y];
            op = "m";
            break;
          case "m":
            x0 = x;
            y0 = y;
            to = [seg.x + x, seg.y + y];
            op = "m";
            break;
          case "L":
            to = [seg.x, seg.y];
            op = "l";
            break;
          case "l":
            to = [seg.x + x, seg.y + y];
            op = "l";
            break;
          case "H":
            to = [seg.x, y];
            op = "l";
            newX = seg.x;
            newY = y;
            break;
          case "h":
            to = [seg.x + x, y];
            op = "l";
            newX = seg.x + x;
            newY = y;
            break;
          case "V":
            to = [x, seg.y];
            op = "l";
            newX = x;
            newY = seg.y;
            break;
          case "v":
            to = [x, seg.y + y];
            op = "l";
            newX = x;
            newY = seg.y + y;
            break;
          case "C":
            p2 = [seg.x1, seg.y1];
            p3 = [seg.x2, seg.y2];
            to = [seg.x, seg.y];
            break;
          case "c":
            p2 = [seg.x1 + x, seg.y1 + y];
            p3 = [seg.x2 + x, seg.y2 + y];
            to = [seg.x + x, seg.y + y];
            break;
          case "S":
            p2 = getControlPointFromPrevious(i, [x, y], list, prevX, prevY);
            p3 = [seg.x2, seg.y2];
            to = [seg.x, seg.y];
            break;
          case "s":
            p2 = getControlPointFromPrevious(i, [x, y], list, prevX, prevY);
            p3 = [seg.x2 + x, seg.y2 + y];
            to = [seg.x + x, seg.y + y];
            break;
          case "Q":
            p = [seg.x1, seg.y1];
            p2 = toCubic([x, y], p);
            p3 = toCubic([seg.x, seg.y], p);
            to = [seg.x, seg.y];
            break;
          case "q":
            p = [seg.x1 + x, seg.y1 + y];
            p2 = toCubic([x, y], p);
            p3 = toCubic([x + seg.x, y + seg.y], p);
            to = [seg.x + x, seg.y + y];
            break;
          case "T":
            p = getControlPointFromPrevious(i, [x, y], list, prevX, prevY);
            p2 = toCubic([x, y], p);
            p3 = toCubic([seg.x, seg.y], p);
            to = [seg.x, seg.y];
            break;
          case "t":
            p = getControlPointFromPrevious(i, [x, y], list, prevX, prevY);
            p2 = toCubic([x, y], p);
            p3 = toCubic([x + seg.x, y + seg.y], p);
            to = [seg.x + x, seg.y + y];
            break;
          // TODO: A,a
          case "Z":
          case "z":
            x = x0;
            y = y0;
            lines.push({op: "h"});
            break;
        }

        var hasStartMarker = markerStart
            && (i === 1
            || ("mM".indexOf(cmd) < 0 && "mM".indexOf(list.getItem(i - 1).pathSegTypeAsLetter) >= 0));
        var hasEndMarker = markerEnd
            && (i === list.numberOfItems - 1
            || ("mM".indexOf(cmd) < 0 && "mM".indexOf(list.getItem(i + 1).pathSegTypeAsLetter) >= 0));
        var hasMidMarker = markerMid
            && i > 0
            && !(i === 1 && "mM".indexOf(list.getItem(i - 1).pathSegTypeAsLetter) >= 0);

        if ("sScCqQtT".indexOf(cmd) >= 0) {
          hasStartMarker && markers.addMarker(new Marker(markerStart, [x, y], getAngle([x, y], p2)));
          hasEndMarker && markers.addMarker(new Marker(markerEnd, to, getAngle(p3, to)));
          if (hasMidMarker) {
            curAngle = getDirectionVector([x, y], p2);
            curAngle = "mM".indexOf(list.getItem(i - 1).pathSegTypeAsLetter) >= 0 ?
                curAngle : normalize(addVectors(prevAngle, curAngle));
            markers.addMarker(new Marker(markerMid, [x, y], Math.atan2(curAngle[1], curAngle[0])));
          }

          prevAngle = getDirectionVector(p3, to);

          prevX = x;
          prevY = y;

          if (withinClipPath) {
            p2 = multVecMatrix(p2, tfMatrix);
            p3 = multVecMatrix(p3, tfMatrix);
            to = multVecMatrix(to, tfMatrix);
          }

          lines.push({
            op: "c", c: [
              p2[0], p2[1],
              p3[0], p3[1],
              to[0], to[1]
            ]
          });
        } else if ("lLhHvVmM".indexOf(cmd) >= 0) {
          curAngle = getDirectionVector([x, y], to);
          hasStartMarker && markers.addMarker(new Marker(markerStart, [x, y], Math.atan2(curAngle[1], curAngle[0])));
          hasEndMarker && markers.addMarker(new Marker(markerEnd, to, Math.atan2(curAngle[1], curAngle[0])));
          if (hasMidMarker) {
            var angle = "mM".indexOf(cmd) >= 0 ?
                prevAngle : "mM".indexOf(list.getItem(i - 1).pathSegTypeAsLetter) >= 0 ?
                curAngle : normalize(addVectors(prevAngle, curAngle));
            markers.addMarker(new Marker(markerMid, [x, y], Math.atan2(angle[1], angle[0])));
          }
          prevAngle = curAngle;

          if (withinClipPath) {
            to = multVecMatrix(to, tfMatrix);
          }

          lines.push({op: op, c: to});
        }

        if ("MLCSQT".indexOf(cmd) >= 0) {
          x = seg.x;
          y = seg.y;
        } else if ("mlcsqt".indexOf(cmd) >= 0) {
          x = seg.x + x;
          y = seg.y + y;
        } else if ("zZ".indexOf(cmd) < 0) {
          x = newX;
          y = newY;
        }
      }

      return {lines: lines, markers: markers};
    };
    var lines = getLinesFromPath();

    if (lines.lines.length > 0) {
      _pdf.path(lines.lines);
    }

    if (markerEnd || markerStart || markerMid) {
      lines.markers.draw(_pdf.unitMatrix, refsHandler, attributeState);
    }
  };

  // draws the element referenced by a use node, makes use of pdf's XObjects/FormObjects so nodes are only written once
  // to the pdf document. This highly reduces the file size and computation time.
  var use = function (node, tfMatrix, refsHandler) {
    var url = (node.getAttribute("href") || node.getAttribute("xlink:href"));
    // just in case someone has the idea to use empty use-tags, wtf???
    if (!url)
      return;

    // get the size of the referenced form object (to apply the correct scaling)
    var id = url.substring(1);
    refsHandler.getRendered(id);
    var formObject = _pdf.getFormObject(id);

    // scale and position it right
    var x = getAttribute(node, "x") || 0;
    var y = getAttribute(node, "y") || 0;
    var width = getAttribute(node, "width") || formObject.width;
    var height = getAttribute(node, "height") || formObject.height;
    var t = new _pdf.Matrix(width / formObject.width || 0, 0, 0, height / formObject.height || 0, x, y);
    t = _pdf.matrixMult(t, tfMatrix);
    _pdf.doFormObject(id, t);
  };

  // draws a line
  var line = function (node, refsHandler, attributeState) {
    var p1 = [parseFloat(node.getAttribute('x1') || 0), parseFloat(node.getAttribute('y1') || 0)];
    var p2 = [parseFloat(node.getAttribute('x2') || 0), parseFloat(node.getAttribute('y2') || 0)];

    if (attributeState.stroke !== null){
      _pdf.line(p1[0], p1[1], p2[0], p2[1]);
    }

    var markerStart = getAttribute(node, "marker-start"),
        markerEnd = getAttribute(node, "marker-end");

    if (markerStart || markerEnd) {
      var markers = new MarkerList();
      var angle = getAngle(p1, p2);
      if (markerStart) {
        markers.addMarker(new Marker(iriReference.exec(markerStart)[1], p1, angle));
      }
      if (markerEnd) {
        markers.addMarker(new Marker(iriReference.exec(markerEnd)[1], p2, angle));
      }
      markers.draw(_pdf.unitMatrix, refsHandler, attributeState);
    }
  };

  // draws a rect
  var rect = function (node) {
    _pdf.roundedRect(
        parseFloat(getAttribute(node, 'x')) || 0,
        parseFloat(getAttribute(node, 'y')) || 0,
        parseFloat(getAttribute(node, 'width')),
        parseFloat(getAttribute(node, 'height')),
        parseFloat(getAttribute(node, 'rx')) || 0,
        parseFloat(getAttribute(node, 'ry')) || 0
    );
  };

  // draws an ellipse
  var ellipse = function (node) {
    _pdf.ellipse(
        parseFloat(getAttribute(node, 'cx')) || 0,
        parseFloat(getAttribute(node, 'cy')) || 0,
        parseFloat(getAttribute(node, 'rx')),
        parseFloat(getAttribute(node, 'ry'))
    );
  };

  // draws a circle
  var circle = function (node) {
    var radius = parseFloat(getAttribute(node, 'r')) || 0;
    _pdf.ellipse(
        parseFloat(getAttribute(node, 'cx')) || 0,
        parseFloat(getAttribute(node, 'cy')) || 0,
        radius,
        radius
    );
  };

  // applies text transformations to a text node
  var transformText = function (node, text) {
    var textTransform = getAttribute(node, "text-transform");
    switch (textTransform) {
      case "uppercase": return text.toUpperCase();
      case "lowercase": return text.toLowerCase();
      default: return text;
      // TODO: capitalize, full-width
    }
  };

  /**
   * Canvas text measuring is a lot faster than svg measuring. However, it is inaccurate for some fonts. So test each
   * font once and decide if canvas is accurate enough.
   * @param {string} text
   * @param {string} fontFamily
   * @returns {function(string, string, string, string, string)}
   */
  var getMeasureFunction = (function getMeasureFunction() {
    /**
     * @param {string} text
     * @param {string} fontFamily
     * @param {string} fontSize
     * @param {string} fontStyle
     * @param {string} fontWeight
     */
    function canvasTextMeasure(text, fontFamily, fontSize, fontStyle, fontWeight) {
      var canvas = document.createElement("canvas");
      var context = canvas.getContext("2d");

      context.font = [fontStyle, fontWeight, fontSize, fontFamily].join(" ");
      return context.measureText(text).width;
    }

    /**
     * @param {string} text
     * @param {string} fontFamily
     * @param {string} fontSize
     * @param {string} fontStyle
     * @param {string} fontWeight
     */
    function svgTextMeasure(text, fontFamily, fontSize, fontStyle, fontWeight) {
      var textNode = document.createElementNS(svgNamespaceURI, "text");
      textNode.setAttribute("font-family", fontFamily);
      textNode.setAttribute("font-size", fontSize);
      textNode.setAttribute("font-style", fontStyle);
      textNode.setAttribute("font-weight", fontWeight);
      textNode.setAttributeNS("http://www.w3.org/XML/1998/namespace", "xml:space", "preserve");
      textNode.appendChild(document.createTextNode(text));

      var svg = document.createElementNS(svgNamespaceURI, "svg");
      svg.appendChild(textNode);
      svg.setAttribute("visibility", "hidden");
      document.body.appendChild(svg);

      var width = textNode.getBBox().width;

      document.body.removeChild(svg);

      return width;
    }

    var testString = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ 0123456789!\"$%&/()=?'\\+*-_.:,;^}][{#~|<>";
    var epsilon = 0.1;
    var measureMethods = {};

    return function getMeasureFunction(fontFamily) {
      var method = measureMethods[fontFamily];
      if (!method) {
        var fontSize = "16px";
        var fontStyle = "normal";
        var fontWeight = "normal";
        var canvasWidth = canvasTextMeasure(testString, fontFamily, fontSize, fontStyle, fontWeight);
        var svgWidth = svgTextMeasure(testString, fontFamily, fontSize, fontStyle, fontWeight);

        method = Math.abs(canvasWidth - svgWidth) < epsilon ? canvasTextMeasure : svgTextMeasure;

        measureMethods[fontFamily] = method;
      }

      return method;
    }
  })();

  /**
   * @param {string} text
   * @param {AttributeState} attributeState
   * @returns {number}
   */
  function measureTextWidth(text, attributeState) {
    if (text.length === 0) {
      return 0;
    }

    var fontFamily = attributeState.fontFamily;
    var measure = getMeasureFunction(fontFamily);

    return measure(text, attributeState.fontFamily, attributeState.fontSize + "px", attributeState.fontStyle, attributeState.fontWeight);
  }

  /**
   * @param {string} text
   * @param {AttributeState} attributeState
   * @returns {number}
   */
  function getTextOffset(text, attributeState) {
    var textAnchor = attributeState.textAnchor;
    if (textAnchor === "start") {
      return 0;
    }

    var width = measureTextWidth(text, attributeState);

    var xOffset = 0;
    switch (textAnchor) {
      case "end":
        xOffset = width;
        break;
      case "middle":
        xOffset = width / 2;
        break;
    }

    return xOffset;
  }

  /**
   * @param {string} textAnchor
   * @param {number} originX
   * @param {number} originY
   * @constructor
   */
  function TextChunk(textAnchor, originX, originY) {
    this.texts = [];
    this.textNodes = [];
    this.textAnchor = textAnchor;
    this.originX = originX;
    this.originY = originY;
  }

  /**
   * @param {SVGElement} tSpan
   * @param {string} text
   */
  TextChunk.prototype.add = function(tSpan, text) {
    this.texts.push(text);
    this.textNodes.push(tSpan);
  };
  /**
   * Outputs the chunk to pdf.
   * @param {jsPDF.Matrix} transform
   * @param {AttributeState} attributeState
   * @returns {[number, number]} The last current text position.
   */
  TextChunk.prototype.put = function (transform, attributeState) {
    var i, textNode;

    var xs = [], ys = [], attributeStates = [];
    var currentTextX = this.originX, currentTextY = this.originY;
    var minX = currentTextX, maxX = currentTextX;
    for (i = 0; i < this.textNodes.length; i++) {
      textNode = this.textNodes[i];

      var x = currentTextX;
      var y = currentTextY;

      if (textNode.nodeName === "#text") {
        textNodeAttributeState = attributeState
      } else {
        var textNodeAttributeState = attributeState.clone();
        var tSpanColor = getAttribute(textNode, "fill");
        setTextProperties(textNode, tSpanColor && new RGBColor(tSpanColor), textNodeAttributeState);

        var tSpanDx = textNode.getAttribute("dx");
        if (tSpanDx !== null) {
          x += toPixels(tSpanDx, textNodeAttributeState.fontSize);
        }

        var tSpanDy = textNode.getAttribute("dy");
        if (tSpanDy !== null) {
          y += toPixels(tSpanDy, textNodeAttributeState.fontSize);
        }
      }

      attributeStates[i] = textNodeAttributeState;

      xs[i] = x;
      ys[i] = y;

      currentTextX = x + measureTextWidth(this.texts[i], textNodeAttributeState);

      currentTextY = y;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, currentTextX);
    }

    var textOffset;
    switch (this.textAnchor) {
      case "start": textOffset = 0; break;
      case "middle": textOffset = (maxX - minX) / 2; break;
      case "end": textOffset = maxX - minX; break;
    }

    for (i = 0; i < this.textNodes.length; i++) {
      textNode = this.textNodes[i];

      if (textNode.nodeName !== "#text") {
        var tSpanVisibility = getAttribute(textNode, "visibility") || attributeState.visibility;
        if (tSpanVisibility === "hidden") {
          continue;
        }
      }

      _pdf.saveGraphicsState();
      putTextProperties(attributeStates[i], attributeState);

      _pdf.text(xs[i] - textOffset, ys[i], this.texts[i], void 0, transform);

      _pdf.restoreGraphicsState();
    }

    return [currentTextX, currentTextY];
  };

  /**
   * Convert em, px and bare number attributes to pixel values
   * @param {string} value
   * @param {number} pdfFontSize
   */
  function toPixels(value, pdfFontSize) {
    var match;

    // em
    match = value && value.toString().match(/^([\-0-9.]+)em$/);
    if (match) {
      return parseFloat(match[1]) * pdfFontSize;
    }

    // pixels
    match = value && value.toString().match(/^([\-0-9.]+)(px|)$/);
    if (match) {
      return parseFloat(match[1]);
    }
    return 0;
  }


  function transformXmlSpace(trimmedText, attributeState) {
    trimmedText = removeNewlines(trimmedText);
    trimmedText = replaceTabsBySpace(trimmedText);

    if (attributeState.xmlSpace === "default") {
      trimmedText = trimmedText.trim();
      trimmedText = consolidateSpaces(trimmedText);
    }

    return trimmedText;
  }

  /**
   * Draws a text element and its tspan children.
   * @param {SVGElement} node
   * @param {jsPDF.Matrix} tfMatrix
   * @param {boolean} hasFillColor
   * @param {RGBColor} fillRGB
   * @param {AttributeState} attributeState
   */
  var text = function (node, tfMatrix, hasFillColor, fillRGB, attributeState) {
    _pdf.saveGraphicsState();

    var dx, dy, xOffset = 0;

    var pdfFontSize = _pdf.getFontSize();
    var textX = toPixels(node.getAttribute('x'), pdfFontSize);
    var textY = toPixels(node.getAttribute('y'), pdfFontSize);

    dx = toPixels(node.getAttribute("dx"), pdfFontSize);
    dy = toPixels(node.getAttribute("dy"), pdfFontSize);

    var visibility = attributeState.visibility;
    // when there are no tspans draw the text directly
    var tSpanCount = node.childElementCount;
    if (tSpanCount === 0) {
      var trimmedText = transformXmlSpace(node.textContent, attributeState);
      var transformedText = transformText(node, trimmedText);
      xOffset = getTextOffset(transformedText, attributeState);

      if (visibility === "visible") {
        _pdf.text(
            textX + dx - xOffset,
            textY + dy,
            transformedText,
            void 0,
            tfMatrix
        );
      }
    } else {
      // otherwise loop over tspans and position each relative to the previous one
      var currentTextSegment = new TextChunk(attributeState.textAnchor, textX + dx, textY + dy);

      for (var i = 0; i < node.childNodes.length; i++) {
        var textNode = node.childNodes[i];
        if (!textNode.textContent) {
          continue;
        }

        var xmlSpace = attributeState.xmlSpace;
        var textContent = textNode.textContent;

        if (textNode.nodeName === "#text") {

        } else if (nodeIs(textNode, "title")) {
          continue;
        } else if (nodeIs(textNode, "tspan")) {
          var tSpan = textNode;

          if (tSpan.childElementCount > 0) {
            // filter <title> elements...
            textContent = "";
            for (var j = 0; j < tSpan.childNodes.length; j++) {
              if (tSpan.childNodes[j].nodeName === "#text") {
                textContent += tSpan.childNodes[j].textContent;
              }
            }
          }

          var lastPositions;

          var tSpanAbsX = tSpan.getAttribute("x");
          if (tSpanAbsX !== null) {
            var x = toPixels(tSpanAbsX, pdfFontSize);

            lastPositions = currentTextSegment.put(tfMatrix, attributeState);
            currentTextSegment = new TextChunk(getAttribute(tSpan, "text-anchor") || attributeState.textAnchor, x, lastPositions[1]);
          }

          var tSpanAbsY = tSpan.getAttribute("y");
          if (tSpanAbsY !== null) {
            var y = toPixels(tSpanAbsY, pdfFontSize);

            lastPositions = currentTextSegment.put(tfMatrix, attributeState);
            currentTextSegment = new TextChunk(getAttribute(tSpan, "text-anchor") || attributeState.textAnchor, lastPositions[0], y);
          }

          var tSpanXmlSpace = tSpan.getAttribute("xml:space");
          if (tSpanXmlSpace) {
            xmlSpace = tSpanXmlSpace;
          }
        }

        trimmedText = removeNewlines(textContent);
        trimmedText = replaceTabsBySpace(trimmedText);

        if (xmlSpace === "default") {
          if (i === 0) {
            trimmedText = trimLeft(trimmedText);
          }
          if (i === tSpanCount - 1) {
            trimmedText = trimRight(trimmedText);
          }

          trimmedText = consolidateSpaces(trimmedText);
        }

        transformedText = transformText(node, trimmedText);
        currentTextSegment.add(textNode, transformedText);
      }

      currentTextSegment.put(tfMatrix, attributeState);
    }

    _pdf.restoreGraphicsState();
  };

  // renders all children of a node
  var renderChildren = function (node, tfMatrix, refsHandler, withinDefs, withinClipPath, attributeState) {
    forEachChild(node, function (i, node) {
      renderNode(node, tfMatrix, refsHandler, withinDefs, withinClipPath, attributeState);
    });
  };

  /**
   * Convert percentage to decimal
   * @param {string} value
   */
  function parseGradientOffset(value) {
    var parsedValue = parseFloat(value);
    if (!isNaN(parsedValue) && value.indexOf("%") >= 0) {
      return parsedValue / 100;
    }
    return parsedValue;
  }

  // adds a gradient to defs and the pdf document for later use, type is either "axial" or "radial"
  // opacity is only supported rudimentary by averaging over all stops
  // transforms are applied on use
  var putGradient = function (node, type, coords) {
    var colors = [];
    var opacitySum = 0;
    var hasOpacity = false;
    var gState;
    forEachChild(node, function (i, element) {
      // since opacity gradients are hard to realize, average the opacity over the control points
      if (element.tagName.toLowerCase() === "stop") {
        var color = new RGBColor(getAttribute(element, "stop-color"));
        colors.push({
          offset: parseGradientOffset(element.getAttribute("offset")),
          color: [color.r, color.g, color.b]
        });
        var opacity = getAttribute(element, "stop-opacity");
        if (opacity && opacity != 1) {
          opacitySum += parseFloat(opacity);
          hasOpacity = true;
        }
      }
    });

    if (hasOpacity) {
      gState = new _pdf.GState({opacity: opacitySum / colors.length});
    }

    var pattern = new _pdf.ShadingPattern(type, coords, colors, gState);
    var id = node.getAttribute("id");
    _pdf.addShadingPattern(id, pattern);
  };

  var pattern = function (node, refsHandler, attributeState) {
    var id = node.getAttribute("id");

    // the transformations directly at the node are written to the pattern transformation matrix
    var bBox = getUntransformedBBox(node);
    var pattern = new _pdf.TilingPattern([bBox[0], bBox[1], bBox[0] + bBox[2], bBox[1] + bBox[3]], bBox[2], bBox[3],
        null, _pdf.unitMatrix /* this parameter is ignored !*/);

    _pdf.beginTilingPattern(pattern);
    // continue without transformation
    renderChildren(node, _pdf.unitMatrix, refsHandler, false, false, attributeState);
    _pdf.endTilingPattern(id, pattern);
  };

  var fontAliases = {
    "sans-serif": "helvetica",
    "verdana": "helvetica",
    "arial": "helvetica",

    "fixed": "courier",
    "monospace": "courier",
    "terminal": "courier",

    "serif": "times",
    "cursive": "times",
    "fantasy": "times"
  };

  /**
   * @param {AttributeState} attributeState
   * @param {string[]} fontFamilies
   * @return {string}
   */
  function findFirstAvailableFontFamily(attributeState, fontFamilies) {
    var fontType = "";
    if (attributeState.fontWeight === "bold") {
      fontType = "bold";
    }
    if (attributeState.fontStyle === "italic") {
      fontType += "italic";
    }
    if (fontType === "") {
      fontType = "normal";
    }

    var availableFonts = _pdf.getFontList();
    var firstAvailable = "";
    var fontIsAvailable = fontFamilies.some(function (font) {
      var availableStyles = availableFonts[font];
      if (availableStyles && availableStyles.indexOf(fontType) >= 0) {
        firstAvailable = font;
        return true;
      }

      font = font.toLowerCase();
      if (fontAliases.hasOwnProperty(font)) {
        firstAvailable = font;
        return true;
      }

      return false;
    });

    if (!fontIsAvailable) {
      firstAvailable = "times";
    }

    return firstAvailable;
  }

  function setTextProperties(node, fillRGB, attributeState) {
    if (fillRGB && fillRGB.ok) {
      attributeState.fill = fillRGB;
    }

    var fontWeight = getAttribute(node, "font-weight");
    if (fontWeight) {
      attributeState.fontWeight = fontWeight;
    }

    var fontStyle = getAttribute(node, "font-style");
    if (fontStyle) {
      attributeState.fontStyle = fontStyle;
    }

    var fontFamily = getAttribute(node, "font-family");
    if (fontFamily) {
      var fontFamilies = FontFamily.parse(fontFamily);
      attributeState.fontFamily = findFirstAvailableFontFamily(attributeState, fontFamilies);
    }

    var fontSize = getAttribute(node, "font-size");
    if (fontSize) {
      attributeState.fontSize = parseFloat(fontSize);
    }

    var textAnchor = getAttribute(node, "text-anchor");
    if (textAnchor) {
      attributeState.textAnchor = textAnchor;
    }
  }

  /**
   * @param {AttributeState} attributeState
   * @param {AttributeState} parentAttributeState
   */
  function putTextProperties(attributeState, parentAttributeState) {
    if (attributeState.fontFamily !== parentAttributeState.fontFamily) {
      if (fontAliases.hasOwnProperty(attributeState.fontFamily)) {
        _pdf.setFont(fontAliases[attributeState.fontFamily]);
      } else {
        _pdf.setFont(attributeState.fontFamily);
      }
    }

    if (attributeState.fill !== parentAttributeState.fill && attributeState.fill.ok) {
      var fillRGB = attributeState.fill;
      _pdf.setTextColor(fillRGB.r, fillRGB.g, fillRGB.b);
    }

    if (attributeState.fontWeight !== parentAttributeState.fontWeight
        || attributeState.fontStyle !== parentAttributeState.fontStyle) {
      var fontType = "";
      if (attributeState.fontWeight === "bold") {
        fontType = "bold";
      }
      if (attributeState.fontStyle === "italic") {
        fontType += "italic";
      }

      if (fontType === "") {
        fontType = "normal";
      }

      _pdf.setFontType(fontType);
    }

    if (attributeState.fontSize !== parentAttributeState.fontSize) {
      _pdf.setFontSize(attributeState.fontSize);
    }
  }


  function isPartlyVisible(node, parentHidden) {
    if (getAttribute(node, "display") === "none") {
      return false;
    }

    var visible = !parentHidden;

    var visibility = getAttribute(node,"visibility");
    if (visibility) {
      visible = visibility !== "hidden";
    }

    if (nodeIs(node, "svg,g,marker,a,pattern,defs,text,clippath")) {
      var hasChildren = false;
      forEachChild(node, function(i, child) {
        hasChildren = true;
        if (isPartlyVisible(child, !visible)) {
          visible = true;
        }
      });
      if (!hasChildren) {
        return false;
      }
    }

    return visible;
  }

  /**
   * Renders a svg node.
   * @param node The svg element
   * @param contextTransform The current transformation matrix
   * @param refsHandler The handler that will render references on demand
   * @param withinDefs True iff we are top-level within a defs node, so the target can be switched to an pdf form object
   * @param {boolean} withinClipPath
   * @param {AttributeState} attributeState Keeps track of parent attributes that are inherited automatically
   */
  var renderNode = function (node, contextTransform, refsHandler, withinDefs, withinClipPath, attributeState) {
    var parentAttributeState = attributeState;
    attributeState = attributeState.clone();

    if (nodeIs(node, "defs,clippath,pattern,lineargradient,radialgradient,marker")) {
      // we will only render them on demand
      return;
    }

    if (getAttribute(node, "display") === "none") {
      return;
    }

    var visibility = attributeState.visibility = getAttribute(node, "visibility") || attributeState.visibility;
    if (visibility === "hidden" && !nodeIs(node, "svg,g,marker,a,pattern,defs,text")) {
      return;
    }

    var tfMatrix,
        hasFillColor = false,
        fillRGB = null,
        fill = "inherit",
        stroke = "inherit",
        patternOrGradient = undefined,
        bBox;

    //
    // Decide about the render target and set the correct transformation
    //

    // if we are within a defs node, start a new pdf form object and draw this node and all children on that instead
    // of the top-level page
    var targetIsFormObject = withinDefs && !nodeIs(node, "lineargradient,radialgradient,pattern,clippath");
    if (targetIsFormObject) {

      // the transformations directly at the node are written to the pdf form object transformation matrix
      tfMatrix = computeNodeTransform(node);
      bBox = getUntransformedBBox(node);

      _pdf.beginFormObject(bBox[0], bBox[1], bBox[2], bBox[3], tfMatrix);

      // continue without transformation and set withinDefs to false to prevent child nodes from starting new form objects
      tfMatrix = _pdf.unitMatrix;
      withinDefs = false;

    } else {
      tfMatrix = _pdf.matrixMult(computeNodeTransform(node), contextTransform);

      if (!withinClipPath) {
        _pdf.saveGraphicsState();
      }
    }

    var hasClipPath = node.hasAttribute("clip-path") && getAttribute(node, "clip-path") !== "none";
    if (hasClipPath) {
      var clipPathId = iriReference.exec(getAttribute(node, "clip-path"));
      var clipPathNode = refsHandler.getRendered(clipPathId[1]);

      if (!isPartlyVisible(clipPathNode)) {
        return;
      }

      var clipPathMatrix = tfMatrix;
      if (clipPathNode.hasAttribute("clipPathUnits")
          && clipPathNode.getAttribute("clipPathUnits").toLowerCase() === "objectboundingbox") {
        bBox = getUntransformedBBox(node);
        clipPathMatrix = _pdf.matrixMult(new _pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1]), clipPathMatrix);
      }

      // here, browsers show different results for a "transform" attribute on the clipPath element itself:
      // IE/Edge considers it, Chrome and Firefox ignore it. However, the specification lists "transform" as a valid
      // attribute for clipPath elements, although not explicitly explaining its behavior. This implementation follows
      // IE/Edge and considers the "transform" attribute as additional transformation within the coordinate system
      // established by the "clipPathUnits" attribute.
      clipPathMatrix = _pdf.matrixMult(computeNodeTransform(clipPathNode), clipPathMatrix);

      _pdf.saveGraphicsState();
      _pdf.setCurrentTransformationMatrix(clipPathMatrix);

      renderChildren(clipPathNode, _pdf.unitMatrix, refsHandler, false, true, AttributeState.default());
      _pdf.clip().discardPath();

      // as we cannot use restoreGraphicsState() to reset the transform (this would reset the clipping path, as well),
      // we must append the inverse instead
      _pdf.setCurrentTransformationMatrix(clipPathMatrix.inversed());
    }

    //
    // extract fill and stroke mode
    //

    // fill mode
    if (nodeIs(node, "g,path,rect,text,ellipse,line,circle,polygon,polyline")) {
      function setDefaultColor() {
        fillRGB = new RGBColor("rgb(0, 0, 0)");
        hasFillColor = true;
        fill = true;
      }

      var fillColor = getAttribute(node, "fill");
      if (fillColor) {
        var url = iriReference.exec(fillColor);
        if (url) {
          // probably a gradient or pattern (or something unsupported)
          var fillUrl = url[1];
          var fillNode = refsHandler.getRendered(fillUrl);
          if (fillNode && nodeIs(fillNode, "lineargradient,radialgradient")) {

            // matrix to convert between gradient space and user space
            // for "userSpaceOnUse" this is the current transformation: tfMatrix
            // for "objectBoundingBox" or default, the gradient gets scaled and transformed to the bounding box
            var gradientUnitsMatrix;
            if (!fillNode.hasAttribute("gradientUnits")
                || fillNode.getAttribute("gradientUnits").toLowerCase() === "objectboundingbox") {
              bBox || (bBox = getUntransformedBBox(node));
              gradientUnitsMatrix = new _pdf.Matrix(bBox[2], 0, 0, bBox[3], bBox[0], bBox[1]);
            } else {
              gradientUnitsMatrix = _pdf.unitMatrix;
            }

            // matrix that is applied to the gradient before any other transformations
            var gradientTransform = parseTransform(getAttribute(fillNode, "gradientTransform", "transform"));

            patternOrGradient = {
              key: fillUrl,
              matrix: _pdf.matrixMult(gradientTransform, gradientUnitsMatrix)
            };

            fill = true;
          } else if (fillNode && nodeIs(fillNode, "pattern")) {
            var fillBBox, y, width, height, x;
            patternOrGradient = { key: fillUrl };

            var patternUnitsMatrix = _pdf.unitMatrix;
            if (!fillNode.hasAttribute("patternUnits")
                || fillNode.getAttribute("patternUnits").toLowerCase() === "objectboundingbox") {
              bBox || (bBox = getUntransformedBBox(node));
              patternUnitsMatrix = new _pdf.Matrix(1, 0, 0, 1, bBox[0], bBox[1]);

              // TODO: slightly inaccurate (rounding errors? line width bBoxes?)
              fillBBox = getUntransformedBBox(fillNode);
              x = fillBBox[0] * bBox[0];
              y = fillBBox[1] * bBox[1];
              width = fillBBox[2] * bBox[2];
              height = fillBBox[3] * bBox[3];
              patternOrGradient.boundingBox = [x, y, x + width, y + height];
              patternOrGradient.xStep = width;
              patternOrGradient.yStep = height;
            }

            var patternContentUnitsMatrix = _pdf.unitMatrix;
            if (fillNode.hasAttribute("patternContentUnits")
                && fillNode.getAttribute("patternContentUnits").toLowerCase() === "objectboundingbox") {
              bBox || (bBox = getUntransformedBBox(node));
              patternContentUnitsMatrix = new _pdf.Matrix(bBox[2], 0, 0, bBox[3], 0, 0);

              fillBBox = patternOrGradient.boundingBox || getUntransformedBBox(fillNode);
              x = fillBBox[0] / bBox[0];
              y = fillBBox[1] / bBox[1];
              width = fillBBox[2] / bBox[2];
              height = fillBBox[3] / bBox[3];
              patternOrGradient.boundingBox = [x, y, x + width, y + height];
              patternOrGradient.xStep = width;
              patternOrGradient.yStep = height;
            }

            var patternTransformMatrix = _pdf.unitMatrix;
            if (fillNode.hasAttribute("patternTransform")) {
              patternTransformMatrix = parseTransform(getAttribute(fillNode, "patternTransform", "transform"));
            }

            var matrix = patternContentUnitsMatrix;
            matrix = _pdf.matrixMult(matrix, patternUnitsMatrix);
            matrix = _pdf.matrixMult(matrix, patternTransformMatrix);
            matrix = _pdf.matrixMult(matrix, tfMatrix);

            patternOrGradient.matrix = matrix;

            fill = true;
          } else {
            // unsupported fill argument -> fill black
            setDefaultColor();
          }
        } else {
          // plain color
          fillRGB = parseColor(fillColor);
          if (fillRGB.ok) {
            hasFillColor = true;
            fill = true;
          } else {
            fill = false;
          }
        }
      }

      // opacity is realized via a pdf graphics state
      var fillOpacity = 1.0, strokeOpacity = 1.0;
      var nodeFillOpacity = getAttribute(node, "fill-opacity");
      if (nodeFillOpacity) {
        fillOpacity *= parseFloat(nodeFillOpacity);
      }
      if (fillRGB && typeof fillRGB.a === "number") {
        fillOpacity *= fillRGB.a;
      }

      var nodeStrokeOpacity = getAttribute(node, "stroke-opacity");
      if (nodeStrokeOpacity) {
        strokeOpacity *= parseFloat(nodeStrokeOpacity);
      }
      if (strokeRGB && typeof strokeRGB.a === "number") {
        strokeOpacity *= strokeRGB.a;
      }

      var nodeOpacity = getAttribute(node, "opacity");
      if (nodeOpacity) {
        var opacity = parseFloat(nodeOpacity);
        strokeOpacity *= opacity;
        fillOpacity *= opacity;
      }

      var hasFillOpacity = fillOpacity < 1.0;
      var hasStrokeOpacity = strokeOpacity < 1.0;
      if (hasFillOpacity || hasStrokeOpacity) {
        var gState = {};
        hasFillOpacity && (gState["opacity"] = fillOpacity);
        hasStrokeOpacity && (gState["stroke-opacity"] = strokeOpacity);
        _pdf.setGState(new _pdf.GState(gState));
      }

    }

    if (nodeIs(node, "g,path,rect,ellipse,line,circle,polygon,polyline")) {
      // text has no fill color, so don't apply it until here
      if (hasFillColor) {
        attributeState.fill = fillRGB;
        _pdf.setFillColor(fillRGB.r, fillRGB.g, fillRGB.b);
      }

      // stroke mode
      var strokeColor = getAttribute(node, "stroke");
      if (strokeColor) {
        var strokeWidth = getAttribute(node, "stroke-width");
        if (strokeWidth !== void 0 && strokeWidth !== "") {
          strokeWidth = Math.abs(parseFloat(strokeWidth));
          attributeState.strokeWidth = strokeWidth;
          _pdf.setLineWidth(strokeWidth);
        } else {
          // needed for inherited zero width strokes
          strokeWidth = attributeState.strokeWidth
        }
        var strokeRGB = new RGBColor(strokeColor);
        if (strokeRGB.ok) {
          attributeState.stroke = strokeRGB;
          _pdf.setDrawColor(strokeRGB.r, strokeRGB.g, strokeRGB.b);

          // pdf spec states: "A line width of 0 denotes the thinnest line that can be rendered at device resolution:
          // 1 device pixel wide". SVG, however, does not draw zero width lines.
          stroke = strokeWidth !== 0;
        }
        var lineCap = getAttribute(node, "stroke-linecap");
        if (lineCap) {
          _pdf.setLineCap(attributeState.strokeLinecap = lineCap);
        }
        var lineJoin = getAttribute(node, "stroke-linejoin");
        if (lineJoin) {
          _pdf.setLineJoin(attributeState.strokeLinejoin = lineJoin);
        }
        var dashArray = getAttribute(node, "stroke-dasharray");
        if (dashArray) {
          dashArray = parseFloats(dashArray);
          var dashOffset = parseInt(getAttribute(node, "stroke-dashoffset")) || 0;
          attributeState.strokeDasharray = dashArray;
          attributeState.strokeDashoffset = dashOffset;
          _pdf.setLineDashPattern(dashArray, dashOffset);
        }
        var miterLimit = getAttribute(node, "stroke-miterlimit");
        if (miterLimit !== void 0 && miterLimit !== "") {
          _pdf.setLineMiterLimit(attributeState.strokeMiterlimit = parseFloat(miterLimit));
        }
      }
    }

    // inherit fill and stroke mode if not specified at this node
    if (fill === "inherit") {
      fill = attributeState.fill !== null;
    }
    if (stroke === "inherit") {
      stroke = attributeState.stroke !== null;
    }

    var xmlSpace = node.getAttribute("xml:space");
    if (xmlSpace) {
      attributeState.xmlSpace = xmlSpace;
    }

    setTextProperties(node, fillRGB, attributeState);
    putTextProperties(attributeState, parentAttributeState);

    // do the actual drawing
    switch (node.tagName.toLowerCase()) {
      case 'svg':
      case 'g':
      case 'a':
        renderChildren(node, tfMatrix, refsHandler, withinDefs, false, attributeState);
        break;

      case 'use':
        use(node, tfMatrix, refsHandler);
        break;

      case 'line':
        if (!withinClipPath) {
          _pdf.setCurrentTransformationMatrix(tfMatrix);
          line(node, refsHandler, attributeState);
        }
        break;

      case 'rect':
        if (!withinClipPath) {
          _pdf.setCurrentTransformationMatrix(tfMatrix);
        }
        rect(node);
        break;

      case 'ellipse':
        if (!withinClipPath) {
          _pdf.setCurrentTransformationMatrix(tfMatrix);
        }
        ellipse(node);
        break;

      case 'circle':
        if (!withinClipPath) {
          _pdf.setCurrentTransformationMatrix(tfMatrix);
        }
        circle(node);
        break;
      case 'text':
        text(node, tfMatrix, hasFillColor, fillRGB, attributeState);
        break;

      case 'path':
        if (!withinClipPath) {
          _pdf.setCurrentTransformationMatrix(tfMatrix);
        }
        path(node, tfMatrix, refsHandler, withinClipPath, attributeState);
        break;

      case 'polygon':
      case 'polyline':
        if (!withinClipPath) {
          _pdf.setCurrentTransformationMatrix(tfMatrix);
        }
        polygon(node, refsHandler, attributeState, node.tagName.toLowerCase() === "polygon");
        break;

      case 'image':
        _pdf.setCurrentTransformationMatrix(tfMatrix);
        image(node);
        break;
    }

    if (nodeIs(node, "path,rect,ellipse,circle,polygon,polyline") && !withinClipPath) {
      if (fill && stroke) {
        _pdf.fillStroke(patternOrGradient);
      } else if (fill) {
        _pdf.fill(patternOrGradient);
      } else if (stroke) {
        _pdf.stroke();
      } else {
        _pdf.discardPath();
      }
    }

    // close either the formObject or the graphics context
    if (targetIsFormObject) {
      _pdf.endFormObject(node.getAttribute("id"));
    } else if (!withinClipPath) {
      _pdf.restoreGraphicsState();
    }

    if (hasClipPath) {
      _pdf.restoreGraphicsState();
    }
  };

  // the actual svgToPdf function (see above)
  var svg2pdf = function (element, pdf, options) {
    _pdf = pdf;

    var k = options.scale || 1.0,
        xOffset = options.xOffset || 0.0,
        yOffset = options.yOffset || 0.0;


    _pdf.advancedAPI(function () {

      // set offsets and scale everything by k
      _pdf.saveGraphicsState();
      _pdf.setCurrentTransformationMatrix(new _pdf.Matrix(k, 0, 0, k, xOffset, yOffset));

      // set default values that differ from pdf defaults
      var attributeState = AttributeState.default();
      _pdf.setLineWidth(attributeState.strokeWidth);
      var fill = attributeState.fill;
      _pdf.setFillColor(fill.r, fill.g, fill.b);
      _pdf.setFont(attributeState.fontFamily);
      _pdf.setFontSize(attributeState.fontSize);


      var refsHandler = new ReferencesHandler(element);
      renderNode(element.cloneNode(true), _pdf.unitMatrix, refsHandler, false, false, attributeState);

      _pdf.restoreGraphicsState();

    });

    return _pdf;
  };

  if (typeof define === "function" && define.amd) {
    define(["./rgbcolor", "SvgPath", "font-family-papandreou", "cssesc"], function (rgbcolor, svgpath, fontFamily, cssesc) {
      RGBColor = rgbcolor;
      SvgPath = svgpath;
      FontFamily = fontFamily;
      cssEsc = cssesc;
      return svg2pdf;
    });
  } else if (typeof module !== "undefined" && module.exports) {
    RGBColor = require("./rgbcolor.js");
    SvgPath = require("SvgPath");
    FontFamily = require("font-family-papandreou");
    cssEsc = require("cssesc");
    module.exports = svg2pdf;
  } else {
    SvgPath = global.SvgPath;
    RGBColor = global.RGBColor;
    FontFamily = global.FontFamily;
    cssEsc = global.cssesc;
    global.svg2pdf = svg2pdf;
    // for compatibility reasons
    global.svgElementToPdf = svg2pdf;
  }
  return svg2pdf;
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this));
