var ConmanDefaultConfig = {
  /** Padding between max width and max font size */
  padding:          128,
  /** Time, in ms, to transition between slides */
  transitionTime:   200,
  /** Time, in ms, that it should take to type each command */
  typingTime:       1000,
  /** Keycodes that advance to the next slide */
  advanceKeycodes: [74,  // j
                    39,  // right arrow
                    34,  // Kensington presenter right arrow
                    32], // space bar
  /** Keycodes that go back to the previous slide */
  backKeycodes:    [75,  // k
                    37,  // left arrow
                    33,  // Kensington presenter left arrow
                    8],  // delete
  startOverKeycodes: [66], // Kensington presenter down/stop
  /** These keycodes, if encountered, will not be sent along
      to the browser.  Useful if there might be some vertical 
      scrolling and 32/33/34 would otherwise scroll */
  keyCodesPreventingDefault: [ 34, 32, 33 ]
};
/** Loads Conman.
 * config: configuration, or ConmanDefaultConfig to get the defaults
 * functions: override helper functions
 */
var ConmanLoader = function(config,functions) {
  var slides = Utils.fOr(functions.slides,function() {
    return $("section");
  });
  var browserWindow = Utils.fOr(functions.browserWindow,function() {
    return {
      width: $(window).width(),
      height: $(window).height()
    };
  });
  var keyboardBindings = Utils.fOr(functions.keyboardBindings,function() {
    return $(window);
  });

  var strikeThroughCode = Utils.fOr(functions.strikeThroughCode,function() {
    $("code").each(function() {
      if ($(this).attr("data-strikeouts")) {
        var strikes = $(this).attr("data-strikeouts").split(",");
        for(var index in strikes) {
          var line = parseInt(strikes[index]) - 1;
          $(this).find(".line-" + line).css("text-decoration","line-through");
        }
      }
    });
  });

  var syntaxHighlighter = Utils.fOr(functions.syntaxHighlighter,function() {
    return {
      highlight: function() {
        hljs.lineNodes = true;
        hljs.initHighlighting();
        strikeThroughCode();
      }
    }
  });
  var bindKeys = Utils.fOr(functions.bindKeys,function(keyCodes,f) {
    $(window).keyup(function(event) {
      if (keyCodes.indexOf(event.which) != -1) {
        f();
      }
    });
  });
  var preventDefaultKeyCodeAction = Utils.fOr(functions.preventDefaultKeyCodeAction,function(keyCodes) {
    $(window).keydown(function(event) {
      if (keyCodes.indexOf(event.which) != -1) {
        event.preventDefault();
      }
    });
  });

  function currentSlide(whichSlide) {
    if (typeof whichSlide === "undefined") {
      whichSlide = Conman.currentSlide;
    }
    return slides().eq(whichSlide);
  };

  function initCurrentSlide() {
    var slideNumber = 0;
    if (document.location.hash !== "") {
      slideNumber = parseInt(document.location.hash.replace("#",""));
      Conman.currentSlide = slideNumber;
    }
    applySlideClassToBody(currentSlide(slideNumber));
  };

  function applySlideClassToBody(slide) {
    $("body").attr("class",slide.attr("class"));
    if (slide.attr("data-background")) {
      $("body").css("background","#" + slide.attr("data-background"));
    }
    else {
      $("body").css("background","");
    }
  }

  function changeSlides(nextSlide,afterChanges) {
    if ((nextSlide != 0) && (nextSlide != Conman.previousSlide)){
      Conman.previousSlide = Conman.currentSlide;
    }
    afterChanges = Utils.f(afterChanges);
    currentSlide().fadeOut(config.transitionTime / 2, function() {
      applySlideClassToBody(currentSlide(nextSlide));
      currentSlide(nextSlide).fadeIn(config.transitionTime / 2, function() {
        Conman.currentSlide = nextSlide;
        window.history.replaceState({},"",document.URL.replace(/#.*$/,"") + "#" + Conman.currentSlide);
        if (currentSlide().hasClass("IMAGE")) {
          var img    = currentSlide().find("img");
          var width  = browserWindow().width  - config.padding;
          var height = browserWindow().height - config.padding;
          var widthDiff = img.width() - width;
          var heightDiff = img.height() - height;
          if ((widthDiff > 0) || (heightDiff > 0)) {
            if (widthDiff > heightDiff) {
              img.width(width);
            }
            else {
              img.height(height);
            }
          }
        }
        afterChanges();
      });
    });
  };

  function sizeAllToFit() {
    slides().each(function(index,element) {
      var sizeToFit = Sizer.sizeFunction(browserWindow().width,browserWindow().height);
      if (!$(element).hasClass("IMAGE")) {
        sizeToFit($(element));
      }
    });
  }


  var bullets = ConmanBullets(currentSlide,config);
  return {
    /** State */
    currentSlide:  0,
    totalSlides:   1,
    previousSlide: 0,

    /** Set everything up for the slideshow */
    load: function() {
      Conman.totalSlides = slides().length;
      initCurrentSlide();
      bindKeys(config.advanceKeycodes,Conman.advance);
      bindKeys(config.backKeycodes,Conman.back);
      bindKeys(config.startOverKeycodes,Conman.startOver);
      preventDefaultKeyCodeAction(config.keyCodesPreventingDefault);
      bindKeys([189],Conman.shrink);   // -
      bindKeys([187],Conman.embiggen); // +
      syntaxHighlighter().highlight();
      sizeAllToFit();
      $("section").css("display","none");
      $("li").css("visibility","hidden");
      $("section.COMMANDLINE .cli-element").css("display","none");
      currentSlide().fadeIn(config.transitionTime / 2);
    },

    /** Reduce the font-size of the current slide slightly */
    shrink: function() {
      var currentSize = parseInt(currentSlide().css("font-size"));
      currentSlide().css("font-size",currentSize - 4);
      if (currentSlide().hasClass("CODE") || currentSlide().hasClass("COMMANDLINE")) {
        currentSlide().css("margin-top",-1 * (currentSize - 4));
      }
    },
    /** Increase the font-size of the current slide slightly */
    embiggen: function() {
      var currentSize = parseInt(currentSlide().css("font-size"));
      currentSlide().css("font-size",currentSize + 4);
      if (currentSlide().hasClass("CODE") || currentSlide().hasClass("COMMANDLINE")) {
        currentSlide().css("margin-top",-1 * (currentSize - 4));
      }
    },

    startOver: function() {
      if (Conman.currentSlide == 0)  {
        changeSlides(Conman.previousSlide, bullets.rehideBullets());
      }
      else {
        changeSlides(0,bullets.rehideBullets());
      }
    },

    /** Move forward one slide */
    advance: function() {
      if (bullets.hasBulletsToAdvanceFirst()) {
        bullets.advanceToNextBullet();
      }
      else {
        var nextSlide = Conman.currentSlide + 1;
        if (nextSlide >= Conman.totalSlides) {
          nextSlide = 0;
        }
        changeSlides(nextSlide, bullets.rehideBullets());
      }
    },

    /** Move back one slide */
    back: function() {
      var nextSlide = Conman.currentSlide - 1;
      if (nextSlide < 0) {
        nextSlide = Conman.totalSlides - 1;
      }
      changeSlides(nextSlide, bullets.rehideBullets());
    }
  };
};
// 66 - Kensington down/stop
// 116 - Kensington up/laser
