(function( window, document ){
  
  var html = document.documentElement,
    head = document.getElementsByTagName('head')[0],
    stylesheet = document.createElement("style"),
    xtag,
    i;

  head.appendChild(stylesheet);
  stylesheet.title = "xtag";
  i = document.styleSheets.length;
  while ( i-- ) {
    if ( document.styleSheets[i].title == "xtag" ) {
      stylesheet = document.styleSheets[i];
      break;
    }
  }

  /**
  * Stores the value of `current` in `source` using the key specified in
  * `key`.
  *
  * @param {object} source The object to store the value of the third
  * parameter.
  * @param {string} key The key under which to store the value.
  * @param {object|array} current The value to store in the object
  * specified in the `source` parameter.
  * @return {object}
  */
  function mergeOne(source, key, current){
    switch (xtag.typeOf(current)){
      case 'object':
        if (xtag.typeOf(source[key]) == 'object'){
          xtag.merge(source[key], current);
        } else source[key] = xtag.clone(current);
      break;
      case 'array': source[key] = xtag.toArray(current); break;
      default: source[key] = current;
    }
    return source;
  }

  function className( elem, verb, name ) {
    var originalClassName = elem.className,
      replacedClassName = originalClassName.replace( RegExp( " *\\b" + name + "\\b", "g" ), "" );

    switch ( verb ) {
      case "has":
        return replacedClassName != originalClassName;
      case "add":
        if ( replacedClassName == originalClassName ) {
          elem.className = replacedClassName + " " + name;
        }
        break;
      case "remove":
        if ( replacedClassName != originalClassName ) {
          elem.className = replacedClassName;
        }
        break;
      case "toggle":
        elem.className = replacedClassName == originalClassName ?
          replacedClassName + " " + name :
          replacedClassName;
    }
  }

  xtag = {
    tags: {},
    tagList: [],
    callbacks: {},
    //prefix: prefix,
    anchor: document.createElement('a'),
    /*mutation: win.MutationObserver || 
      win.WebKitMutationObserver || 
      win.MozMutationObserver,
    _matchSelector: document.documentElement.matchesSelector ||
      document.documentElement.mozMatchesSelector ||
      document.documentElement.webkitMatchesSelector,*/
    tagOptions: {
      content: '',
      mixins: [],
      events: {},
      methods: {},
      getters: {},
      setters: {},
      onCreate: function(){},
      onInsert: function(){}
    },
    behaviorUrl: "x-tag.htc",

    /**
    * Object containing various mixins that can be used when creating
    * custom tags.
    *
    * When registering a new tag you can specify these mixins as
    * following:
    *
    * xtag.register('tag-name', {
    * mixins: ['mixin1', 'mixin2', 'etc']
    * });
    */
    mixins: {

    },

    /**
    * Returns a lowercased string containing the type of the object.
    *
    * @param {object} obj The object of which to retrieve the type.
    * @return {string}
    */
    typeOf: function(obj) {
      return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    },

    /**
    * Converts the given object to an array.
    *
    * @param {object} obj The object to convert.
    * @return {array}
    */
    toArray: function(obj){
      var sliced = Array.prototype.slice.call(obj, 0);
      return sliced.hasOwnProperty ? sliced : [obj];
    },

    /**
    * Returns a boolean that indicates if the element has the specified
    * class.
    *
    * @param {element} element The element for which to check the class.
    * @param {string} name The name of the class to check for.
    * @return {boolean}
    */
    hasClass: function(element, name){
      return className( element, "has", name );
    },

    /**
    * Adds the class to the specified element, existing classes will not
    * be overwritten.
    *
    * @param {element} element The element to add the class to.
    * @param {string} name The class to add.
    * @return {element}
    */
    addClass: function(element, name){
      className( element, "add", name );
      return element;
    },

    /**
    * Removes the given class from the element.
    *
    * @param {element} element The element from which to remove the class.
    * @param {string} name The class to remove.
    * @return {element}
    */
    removeClass: function(element, name){
      className( element, "remove", name );
      return element;
    },

    /**
    * Toggles the class on the element. If the class is added it's
    * removed, if not it will be added instead.
    *
    * @param {element} element The element for which to toggle the class.
    * @param {string} name The class to toggle.
    * @return {element}
    */
    toggleClass: function(element, name){
      className( element, "toggle", name );
      return element;
    },

    /**
    * matchSelector helper
    *
    * @param {element} element The element to test.
    * @param {string} selector The CSS selector to use for the test.
    * @return {boolean}
    */
    matchSelector: function(element, selector){
      var nodes = xtag.queryChildren( element.parentNode, selector ),
        i = -1,
        l = nodes.length;
      
      while ( ++i < l ) {
        if ( nodes[i] == element ) {
          return true;
        }
      }

      return false;
    },
    
    /**
    * Queries a set of child elements using a CSS selector.
    *
    * @param {element} element The element to query.
    * @param {string} selector The CSS selector to use for the query.
    * @return {array}
    */
    query: function(element, selector){
      return xtag.toArray(element.querySelectorAll(selector));
    },
    
    queryChildren: function( element, selector ) {
      // special case
      if ( element == document ) {
        return element.querySelector( selector || "*" ) == html ?
          [ html ] :
          [];
      }

      var tempId,
        id = element.id || ( element.id = tempId = "t-" + new Date() ),
        result = element.parentNode.querySelectorAll(
          ( selector || "*" ).replace( rchildren, "$0" + id + " > " )
        );

      if ( tempId ) {
        element.id = "";
      }

      return result;
    },

    merge: function(source, k, v){
      if (xtag.typeOf(k) == 'string') return mergeOne(source, k, v);
      for (var i = 1, l = arguments.length; i < l; i++){
        var object = arguments[i];
        for (var key in object) mergeOne(source, key, object[key]);
      }
      return source;
    },

    /**
    * Registers a new x-tag object.
    *
    * @param {string} tag The name of the tag.
    * @param {object} options An object containing custom configuration
    * options to use for the tag.
    */
    register: function(tag, options){
      xtag.tagList.push(tag);
      xtag.tags[tag] = xtag.merge({ tagName: tag }, xtag.tagOptions, 
        xtag.applyMixins(options || {}));

      if ( options.onInsert ) {
        document.createElement( tag );
        stylesheet.addRule( tag, "-ms-behavior:url(" + xtag.behaviorUrl + ");" );
        //stylesheet.innerHTML = stylesheet.innerHTML + tag + "{-ms-behavior:url(" + xtag.behaviorUrl + ");}\n";
        //console.log(stylesheet.innerHTML); console.log("zob");
      }
console.log("registered 2");
    },

    wrap: function(original, fn){
      return function(){
        var args = xtag.toArray(arguments);
        original.apply(this, args);
        fn.apply(this, args);
      };
    },

    /**
    * Checks if the specified element is an x-tag element or a regular
    * element.
    *
    * @param {element} element The element to check.
    * @return {boolean}
    */    
    tagCheck: function(element){
      return element.nodeName ? xtag.tags[element.nodeName.toLowerCase()] : false;
    },
    
    /**
    * Returns an object containing the options of an element.
    *
    * @param {element} element The element for which to retrieve the
    * options.
    * @return {object}
    */
    getOptions: function(element){
      return xtag.tagCheck(element) || xtag.tagOptions;
    },

    applyMixins: function(options){
      if (options.mixins){
        for (var name in mixins){
          var mixin = xtag.mixins[name];
          for (var z in mixin) {
            switch (xtag.typeOf(mixin[z])){
              case 'function': 
                options[z] = options[z] ? 
                  xtag.wrap(options[z], mixin[z]) : mixin[z];
                break;
              case 'object': 
                options[z] = xtag.merge({}, mixin[z], options[z]);
                break;
              default: 
                options[z] = mixin[z];
            }
          }
        }
      }
      return options;
    }
  };

  if (typeof define == 'function' && define.amd) {
      define(xtag);
  } 
  else {
      window.xtag = xtag;
  }

})(window,document);