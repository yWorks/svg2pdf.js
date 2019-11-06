var select  = require("css-select"),
    adapter = require("../"),
    { JSDOM }   = require("jsdom"),
    assert  = require("assert");

var html = "<main><div></div><div class=\"apple\"></div><span class=\"pear potato\"><strong id=\"cheese-burger\">Hello</strong>, <em>World!</em></span></main>";

function getBody(html){
	return new JSDOM(html).window.document.querySelector("body");
}

describe("Adapter API", function(){
	it("should isTag", function(){
		var body = getBody(html);

		assert(adapter.isTag(body));
	});

	it("should existsOne", function(){
		var body = getBody(html);
		var divs = body.querySelectorAll("div");
		var arr = Array.from(divs);

		var hasDiv = adapter.existsOne(function(node){
			return node.classList.contains("apple");
		}, arr);

		assert(hasDiv);
	});

	it("should getAttributeValue", function(){
		var body = getBody(html);
		var div = body.querySelector(".apple");
		var value = adapter.getAttributeValue(div, "class");

		assert.equal(value, "apple");
	});

	it("should getChildren", function(){
		var body = getBody(html);
		var main = body.querySelector("main");
		var children = adapter.getChildren(main);

		assert(Array.isArray(children));
		assert.equal(children.length, 3);
	});

	it("should getName", function(){
		var body = getBody(html);

		assert.equal(adapter.getName(body), "body");
	});

	it("should getParent", function(){
		var body = getBody(html);
		var main = body.querySelector("main");

		assert.equal(body, adapter.getParent(main));
	});

	it("should getSiblings", function(){
		var body = getBody(html);
		var div = body.querySelector("div");

		var siblings = adapter.getSiblings(div);

		assert(Array.isArray(siblings));
		assert.equal(siblings.length, 3);
	});

	it("should getText", function(){
		var body = getBody(html);
		var span = body.querySelector("span");

		var text = adapter.getText(span);

		assert.equal(text, "Hello, World!");
	});

	it("should hasAttrib", function(){
		var body = getBody(html);
		var apple = body.querySelector(".apple");

		assert(adapter.hasAttrib(apple, "class"));
		assert(!adapter.hasAttrib(body, "class"));
	});

	it("should removeSubsets", function(){
		var body = getBody(html);
		var divs = Array.from(body.querySelectorAll("div"));
		var apple = body.querySelector(".apple");
		var span = body.querySelector("span");
		var strong = body.querySelector("strong");

		var nonset = divs.concat([ apple, span, strong ]);

		var set = adapter.removeSubsets(nonset);

		assert.equal(set.length, 3);
	});

	it("should findAll", function(){
		var body = getBody(html);
		var els = body.querySelectorAll("main > *");
		var arr = Array.from(els);

		var classEls = adapter.findAll(function(node){
			return adapter.hasAttrib(node, "class");
		}, arr);

		assert.equal(classEls.length, 2);
	});
});

describe("Adapter Select", function(){
	var options = { adapter };

	it("should universal", function(){
		var body = getBody(html);
		var universal = select("*", body, options);

		assert.equal(universal.length, 6);
	});

	it("should tag", function(){
		var body = getBody(html);
		var tag = select("div", body, options);

		assert.equal(tag.length, 2);
	});

	it("should descendant", function(){
		var body = getBody(html);
		var descendant = select("main div", body, options);

		assert.equal(descendant.length, 2);
	});

	it("should child", function(){
		var body = getBody(html);
		var child = select("main > div", body, options);

		assert.equal(child.length, 2);
	});

	it("should parent", function(){
		var body = getBody(html);
		var parent = select("div < main", body, options);

		assert.equal(parent.length, 1);
	});

	it("should sibling", function(){
		var body = getBody(html);
		var sibling = select("div + span", body, options);

		assert.equal(sibling.length, 1);
	});

	it("should adjacent", function(){
		var body = getBody(html);
		var adjacent = select("strong ~ em", body, options);

		assert.equal(adjacent.length, 1);
	});

	it("should attribute", function(){
		var body = getBody(html);
		var attribute = select("[class]", body, options);

		assert.equal(attribute.length, 2);
	});

	it("should attribute =", function(){
		var body = getBody(html);
		var attribute = select("[class=\"apple\"]", body, options);

		assert.equal(attribute.length, 1);
	});

	it("should attribute ~=", function(){
		var body = getBody(html);
		var attribute = select("[class~=\"potato\"]", body, options);

		assert.equal(attribute.length, 1);
	});

	it("should attribute |=", function(){
		var body = getBody(html);
		var attribute = select("[id|=\"cheese\"]", body, options);

		assert.equal(attribute.length, 1);
	});

	it("should attribute *=", function(){
		var body = getBody(html);
		var attribute = select("[id*=\"ee\"]", body, options);

		assert.equal(attribute.length, 1);
	});

	it("should attribute ^=", function(){
		var body = getBody(html);
		var attribute = select("[id^=\"ch\"]", body, options);

		assert.equal(attribute.length, 1);
	});

	it("should attribute $=", function(){
		var body = getBody(html);
		var attribute = select("[id$=\"burger\"]", body, options);

		assert.equal(attribute.length, 1);
	});

	it("should attribute !=", function(){
		var body = getBody(html);
		var attribute = select("div[class!=\"apple\"]", body, options);

		assert.equal(attribute.length, 1);
	});

	it("should :not", function(){
		var body = getBody(html);
		var pseudo = select("div:not( .apple )", body, options);

		assert.equal(pseudo.length, 1);
	});

	it("should :contains", function(){
		var body = getBody(html);
		var pseudo = select(":contains(Hello)", body, options);

		assert.equal(pseudo.length, 3);
	});

	it("should :icontains", function(){
		var body = getBody(html);
		var pseudo = select(":icontains(HELLO)", body, options);

		assert.equal(pseudo.length, 3);
	});

	it("should :has", function(){
		var body = getBody(html);
		var pseudo = select(":has( em )", body, options);

		assert.equal(pseudo.length, 2);
	});

  //TODO
  /*
  it( 'should :root', function(){
    var body = getBody( html );
    var pseudo = CSSselect( ":root", body, options );

    assert.equal( pseudo.length, 1 );
  });
  */

	it("should :empty", function(){
		var body = getBody(html);
		var pseudo = select("div:empty", body, options);

		assert.equal(pseudo.length, 2);
	});

	it("should :first-child", function(){
		var body = getBody(html);
		var pseudo = select("div:first-child", body, options);

		assert.equal(pseudo.length, 1);
	});
});
