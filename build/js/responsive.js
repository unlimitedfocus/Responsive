/*  ==|== Responsive =============================================================
    Author: James South
    twitter : http://twitter.com/James_M_South
    github : https://github.com/ResponsiveBP/Responsive
    Copyright (c),  James South.
    Licensed under the MIT License.
    ============================================================================== */

/*! Responsive v3.0.0 | MIT License | responsivebp.com */

/*
 * Responsive Core
 */

/*global jQuery*/
/*jshint forin:false, expr:true*/
(function ($, w, d) {

    "use strict";

    $.pseudoUnique = function (length) {
        /// <summary>Returns a pseudo unique alpha-numeric string of the given length.</summary>
        /// <param name="length" type="Number">The length of the string to return. Defaults to 8.</param>
        /// <returns type="String">The pseudo unique alpha-numeric string.</returns>

        var len = length || 8,
            text = "",
            possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
            max = possible.length;

        if (len > max) {
            len = max;
        }

        for (var i = 0; i < len; i += 1) {
            text += possible.charAt(Math.floor(Math.random() * max));
        }

        return text;
    };

    $.support.currentGrid = (function () {
        /// <summary>Returns a value indicating what grid range the current browser width is within.</summary>
        /// <returns type="String">Either xs, s, m, or l.</returns>

        var $div = $("<div/>").addClass("grid-state-indicator").prependTo("body");

        return function () {

            // These numbers match values in the css
            var grids = {
                1: "xs",
                2: "s",
                3: "m",
                4: "l"
            };

            return grids[parseInt($div.width(), 10)];
        };
    }());

    $.support.transition = (function () {
        /// <summary>Returns a value indicating whether the browser supports CSS transitions.</summary>
        /// <returns type="Boolean">True if the current browser supports css transitions.</returns>

        var transitionEnd = function () {
            /// <summary>Gets transition end event for the current browser.</summary>
            /// <returns type="Object">The transition end event for the current browser.</returns>

            var div = d.createElement("div"),
                transEndEventNames = {
                    "transition": "transitionend",
                    "WebkitTransition": "webkitTransitionEnd",
                    "MozTransition": "transitionend",
                    "OTransition": "oTransitionEnd otransitionend"
                };

            // Could use the other method but I'm intentionally keeping them
            // separate for now.
            for (var name in transEndEventNames) {
                if (div.style[name] !== undefined) {
                    return { end: transEndEventNames[name] };
                }
            }

            return false;
        };

        return transitionEnd();

    }());

    $.fn.redraw = function () {
        /// <summary>Forces the browser to redraw by measuring the given target.</summary>
        /// <returns type="jQuery">The jQuery object for chaining.</returns>
        var redraw;
        return this.each(function () {
            redraw = this.offsetWidth;
        });
    };

    $.fn.ensureTransitionEnd = function (duration) {
        /// <summary>
        /// Ensures that the transition end callback is triggered.
        /// http://blog.alexmaccaw.com/css-transitions
        ///</summary>
        var called = false,
            $this = $(this),
            callback = function () { if (!called) { $this.trigger($.support.transition.end); } };

        $this.one($.support.transition.end, function () { called = true; });
        w.setTimeout(callback, duration);
        return this;
    };

    $.fn.onTransitionEnd = function (callback) {
        /// <summary>Performs the given callback at the end of a css transition.</summary>
        /// <param name="callback" type="Function">The function to call on transition end.</param>
        /// <returns type="jQuery">The jQuery object for chaining.</returns>
        var supportTransition = $.support.transition;

        return this.each(function () {

            if (!$.isFunction(callback)) {
                return;
            }

            var $this = $(this).redraw(),
                rtransition = /\d+(.\d+)/;

            supportTransition ? $this.one(supportTransition.end, callback)
                                     .ensureTransitionEnd((rtransition.test($this.css("transition-duration")) ? $this.css("transition-duration").match(rtransition)[0] : 0) * 1000)
                              : callback();
        });
    };

    $.support.touchEvents = (function () {
        return ("ontouchstart" in w) || (w.DocumentTouch && d instanceof w.DocumentTouch);
    }());

    $.support.pointerEvents = (function () {
        return (w.PointerEvent || w.MSPointerEvent);
    }());

    (function () {
        var supportTouch = $.support.touchEvents,
            supportPointer = $.support.pointerEvents;

        var pointerStart = ["pointerdown", "MSPointerDown"],
            pointerMove = ["pointermove", "MSPointerMove"],
            pointerEnd = ["pointerup", "pointerout", "pointercancel", "pointerleave",
                          "MSPointerUp", "MSPointerOut", "MSPointerCancel", "MSPointerLeave"];

        var touchStart = "touchstart",
            touchMove = "touchmove",
            touchEnd = ["touchend", "touchleave", "touchcancel"];

        var mouseStart = "mousedown",
            mouseMove = "mousemove",
            mouseEnd = ["mouseup", "mouseleave"];

        var getEvents = function () {
            var estart,
                emove,
                eend;

            // Keep the events separate since support could be crazy.
            if (supportTouch) {
                estart = touchStart;
                emove = touchMove;
                eend = (touchEnd.join(" "));
            }
            else if (supportPointer) {
                estart = (pointerStart.join(" "));
                emove = (pointerMove.join(" "));
                eend = (pointerEnd.join(" "));

            } else {
                estart = mouseStart;
                emove = mouseMove;
                eend = (mouseEnd.join(" "));
            }

            return {
                start: estart,
                move: emove,
                end: eend
            };
        };

        var addSwipe = function ($elem, handler) {
            /// <summary>Adds swiping functionality to the given element.</summary>
            /// <param name="$elem" type="Object">
            ///      The jQuery object representing the given node(s).
            /// </param>
            /// <returns type="jQuery">The jQuery object for chaining.</returns>

            var eswipestart = "swipestart",
                eswipemove = "swipemove",
                eswipeend = "swipeend",
                etouch = getEvents();

            // Set the touchaction variable for move.
            var touchAction = handler.data && handler.data.touchAction || "none";

            if (supportPointer) {
                // Enable extended touch events on supported browsers before any touch events.
                $elem.css({ "-ms-touch-action": "" + touchAction + "", "touch-action": "" + touchAction + "" });
            }

            return $elem.each(function () {
                var $this = $(this);

                var start = {},
                    delta = {},
                    isScrolling,
                    onMove = function (event) {

                        // Normalize the variables.
                        var isMouse = event.type === "mousemove",
                            isPointer = event.type !== "touchmove" && !isMouse,
                            original = event.originalEvent,
                            moveEvent;

                        // Only left click allowed.
                        if (isMouse && event.which !== 1) {
                            return;
                        }

                        // One touch allowed.
                        if (original.touches && original.touches.length > 1) {
                            return;
                        }

                        // Ensure swiping with one touch and not pinching.
                        if (event.scale && event.scale !== 1) {
                            return;
                        }

                        var dx = (isMouse ? original.pageX : isPointer ? original.clientX : original.touches[0].pageX) - start.x,
                            dy = (isMouse ? original.pageY : isPointer ? original.clientY : original.touches[0].pageY) - start.y;

                        // Mimic touch action on iProducts.
                        // Should also prevent bounce.
                        if (!isPointer) {
                            switch (touchAction) {
                                case "pan-x":
                                case "pan-y":

                                    isScrolling = touchAction === "pan-x" ?
                                                  Math.abs(dy) < Math.abs(dx) :
                                                  Math.abs(dx) < Math.abs(dy);

                                    if (!isScrolling) {
                                        event.preventDefault();
                                    } else {
                                        event.stopPropagation();
                                        return;
                                    }

                                    break;
                                default:
                                    event.preventDefault();
                                    break;
                            }
                        }

                        moveEvent = $.Event(eswipemove, { delta: { x: dx, y: dy } });
                        $this.trigger(moveEvent);

                        if (moveEvent.isDefaultPrevented()) {
                            return;
                        }

                        // Measure change in x and y.
                        delta = {
                            x: dx,
                            y: dy
                        };
                    },
                    onEnd = function () {

                        // Measure duration
                        var duration = +new Date() - start.time,
                            endEvent;

                        // Determine if slide attempt triggers slide.
                        if (Math.abs(delta.x) > 1 || Math.abs(delta.y) > 1) {

                            // Set the direction and return it.
                            var horizontal = delta.x < 0 ? "left" : "right",
                                vertical = delta.y < 0 ? "up" : "down",
                                direction = Math.abs(delta.x) > Math.abs(delta.y) ? horizontal : vertical;

                            endEvent = $.Event(eswipeend, { delta: delta, direction: direction, duration: duration });

                            $this.trigger(endEvent);
                        }

                        // Disable the touch events till next time.
                        $this.off(etouch.move).off(etouch.end);
                    };

                $this.off(etouch.start).on(etouch.start, function (event) {

                    // Normalize the variables.
                    var isMouse = event.type === "mousedown",
                        isPointer = event.type !== "touchstart" && !isMouse,
                        original = event.originalEvent,
                        startEvent;

                    if ((isPointer || isMouse) && $(event.target).is("img")) {
                        event.preventDefault();
                    }

                    // Used for testing first move event
                    isScrolling = undefined;

                    // Measure start values.
                    start = {
                        // Get initial touch coordinates.
                        x: isMouse ? original.pageX : isPointer ? original.clientX : original.touches[0].pageX,
                        y: isMouse ? original.pageY : isPointer ? original.clientY : original.touches[0].pageY,

                        // Store time to determine touch duration.
                        time: +new Date()
                    };

                    startEvent = $.Event(eswipestart, { start: start });

                    $this.trigger(startEvent);

                    if (startEvent.isDefaultPrevented()) {
                        return;
                    }

                    // Reset delta and end measurements.
                    delta = { x: 0, y: 0 };

                    // Attach touchmove and touchend listeners.
                    $this.on(etouch.move, onMove)
                         .on(etouch.end, onEnd);
                });
            });
        };

        var removeSwipe = function ($elem) {
            /// <summary>Removes swiping functionality from the given element.</summary>
            var etouch = getEvents();
            return $elem.each(function () {

                // Disable extended touch events on ie.
                // Unbind events.
                $(this).css({ "-ms-touch-action": "", "touch-action": "" })
                       .off(etouch.start).off(etouch.move).off(etouch.end);
            });
        };

        // Create special events so we can use on/off.
        $.event.special.swipe = {
            add: function (handler) {
                addSwipe($(this), handler);
            },
            remove: function () {
                removeSwipe($(this));
            }
        };
    }());

    $.extend($.expr[":"], {
        attrStart: function (el, i, props) {
            /// <summary>Custom selector extension to allow attribute starts with selection.</summary>
            /// <param name="el" type="DOM">The element to test against.</param>
            /// <param name="i" type="Number">The index of the element in the stack.</param>
            /// <param name="props" type="Object">Metadata for the element.</param>
            /// <returns type="Boolean">True if the element is a match; otherwise, false.</returns>
            var hasAttribute = false;

            $.each(el.attributes, function () {
                if (this.name.indexOf(props[3]) === 0) {
                    hasAttribute = true;
                    return false;  // Exit the iteration.
                }
                return true;
            });

            return hasAttribute;
        }
    });

    $.buildDataOptions = function ($elem, options, prefix, namespace) {
        /// <summary>Creates an object containing options populated from an elements data attributes.</summary>
        /// <param name="$elem" type="jQuery">The object representing the DOM element.</param>
        /// <param name="options" type="Object">The object to extend</param>
        /// <param name="prefix" type="String">The prefix with which to identify the data attribute.</param>
        /// <param name="namespace" type="String">The namespace with which to segregate the data attribute.</param>
        /// <returns type="Object">The extended object.</returns>
        $.each($elem.data(), function (key, val) {

            if (key.indexOf(prefix) === 0 && key.length > prefix.length) {

                // Build a key with the correct format.
                var length = prefix.length,
                    newKey = key.charAt(length).toLowerCase() + key.substring(length + 1);

                options[newKey] = val;

                // Clean up.
                $elem.removeData(key);
            }

        });

        if (namespace) {
            $elem.data(namespace + "." + prefix + "Options", options);
        } else {
            $elem.data(prefix + "Options", options);
        }

        return options;
    };
}(jQuery, window, document));
/*
 * Responsive AutoSize
 */

/*global jQuery*/
/*jshint expr:true*/
(function ($, w, ns) {

    "use strict";

    if (w.RESPONSIVE_AUTOSIZE) {
        return;
    }

    // General variables and methods.
    var resisizeTimer,
        eready = "ready" + ns,
        eresize = "resize orientationchange",
        ekeyup = "keyup",
        epaste = "paste",
        ecut = "cut",
        esize = "size" + ns,
        esized = "sized" + ns;

    // Private methods.
    var createClone = function () {

            var self = this,
                attributes = this.options.removeAttributes,
                classes = this.options.removeClasses,
                $element = this.$element,
                clone = function () {

                    // Create a clone and offset it removing all specified attributes classes and data.
                    self.$clone = self.$element.clone()
                                      .attr({ "tabindex": -1, "rows": 2, "aria-hidden": true })
                                      .removeAttr("id name data-autosize " + attributes)
                                      .removeClass(classes)
                                      .removeClass(classes)
                                      .addClass("autosize-clone")
                                      .insertAfter($element);

                    // jQuery goes spare if you try to remove null data.
                    if (classes) {
                        self.$clone.removeData(classes);
                    }
                };

            $.when(clone()).then(this.size());
        };

    // AutoSize class definition
    var AutoSize = function (element, options) {

        this.$element = $(element);
        this.defaults = {
            removeAttributes: null,
            removeClasses: null
        };
        this.options = $.extend({}, this.defaults, options);
        this.$clone = null;
        this.sizing = null;

        // Initial setup.
        createClone.call(this);

        // Bind events
        this.$element.on([ekeyup, epaste, ecut].join(" "), $.proxy(this.change, this));
    };

    AutoSize.prototype.size = function () {

        var self = this,
            $element = this.$element,
            element = this.$element[0],
            $clone = this.$clone,
            clone = $clone[0],
            heightComparer = 0,
            startHeight,
            endHeight,
            sizeEvent = $.Event(esize),
            complete = function () {
                self.sizing = false;
                $element.trigger($.Event(esized));
            };

        // Set the width of the clone to match.
        $clone.width($element.width());

        // Copy the text across.
        $clone.val($element.val());

        // Set the height so animation will work.
        startHeight = $clone.height();
        $element.height(startHeight);

        // Shrink
        while (clone.rows > 1 && clone.scrollHeight < clone.offsetHeight) {
            clone.rows -= 1;
        }

        // Grow
        while (clone.scrollHeight > clone.offsetHeight && heightComparer !== clone.offsetHeight) {
            heightComparer = element.offsetHeight;
            clone.rows += 1;
        }
        clone.rows += 1;

        endHeight = $clone.height();

        if (startHeight !== endHeight) {

            $element.trigger($.Event(esize));

            if (this.sizing || sizeEvent.isDefaultPrevented()) {
                return;
            }

            this.sizing = true;

            // Reset the height
            $element.height($clone.height());

            // Do our callback
            $element.onTransitionEnd(complete);
        }
    };

    AutoSize.prototype.change = function (event) {

        var self = this,
            delay = 0;

        if (event.type === "paste" || event.type === "cut") {
            delay = 5;
        }

        w.setTimeout(function () {

            // Run the size method.
            self.size();

        }, delay);
    };

    // Plug-in definition 
    $.fn.autoSize = function (options) {

        return this.each(function () {

            var $this = $(this),
                data = $this.data("r.autosize"),
                opts = typeof options === "object" ? options : null;

            if (!data) {
                // Check the data and reassign if not present.
                $this.data("r.autosize", (data = new AutoSize(this, opts)));
            }

            if (options === "size") {
                data.size();
            }
        });
    };

    // Set the public constructor.
    $.fn.autoSize.Constructor = AutoSize;

    // No conflict.
    var old = $.fn.autoSize;
    $.fn.autoSize.noConflict = function () {
        $.fn.autoSize = old;
        return this;
    };

    $(w).on(eresize, function () {

        if (resisizeTimer) {
            w.clearTimeout(resisizeTimer);
        }

        var resize = function () {

            $("textarea.autosize").each(function () {

                var autosize = $(this).data("r.autosize");

                if (autosize) { autosize.size(); }
            });
        };

        resisizeTimer = w.setTimeout(resize, 5);
    });

    // Data API
    $(document).on(eready, function () {

        $("textarea[data-autosize]").each(function () {

            var $this = $(this).addClass("autosize"),
                data = $this.data("r.autosizeOptions"),
                options = data || $.buildDataOptions($this, {}, "autosize", "r");

            // Run the autosize method.
            $this.autoSize(options);
        });
    });

    w.RESPONSIVE_AUTOSIZE = true;

}(jQuery, window, ".r.autosize"));
/*
 * Responsive Carousel
 */

/*global jQuery*/
/*jshint expr:true*/
(function ($, w, ns) {

    "use strict";

    if (w.RESPONSIVE_CAROUSEL) {
        return;
    }

    // General variables.
    var supportTransition = $.support.transition,
        emouseenter = "mouseenter",
        emouseleave = "mouseleave",
        ekeydown = "keydown",
        eclick = "click",
        eready = "ready" + ns,
        eslide = "slide" + ns,
        eslid = "slid" + ns;

    var keys = {
        SPACE: 32,
        LEFT: 37,
        RIGHT: 39
    };

    // Private methods.
    var getActiveIndex = function () {

        var $activeItem = this.$element.find(".carousel-active");
        this.$items = $activeItem.parent().children("figure");

        return this.$items.index($activeItem);
    };

    // Carousel class definition
    var Carousel = function (element, options) {

        this.$element = $(element);
        this.defaults = {
            interval: 0, // Better for a11y
            mode: "slide",
            pause: "hover",
            wrap: true,
            keyboard: true,
            touch: true,
            lazyImages: true,
            lazyOnDemand: true,
            nextTrigger: null,
            nextHint: "Next (Right Arrow)",
            previousTrigger: null,
            previousHint: "Previous (Left Arrow)",
            indicators: null
        };
        this.options = $.extend({}, this.defaults, options);
        this.paused = null;
        this.interval = null;
        this.sliding = null;
        this.$items = null;
        this.translationDuration = null;
        this.$nextTrigger = this.options.nextTrigger ? $(this.nextTrigger) : this.$element.find(".carousel-control.right");
        this.$previousTrigger = this.options.previousTrigger ? $(this.previousTrigger) : this.$element.find(".carousel-control.left");
        this.$indicators = this.options.indicators ? $(this.indicators) : this.$element.find("ol > li");
        this.id = this.$element.attr("id") || "carousel-" + $.pseudoUnique();

        var self = this,
            defaultTriggers = !this.options.nextTrigger && !this.options.previousTrigger;

        // Add the css class to support fade.
        this.options.mode === "fade" && this.$element.addClass("carousel-fade");

        if (this.options.lazyImages && !this.options.lazyOnDemand) {
            $(w).on("load", $.proxy(this.lazyimages), this);
        }

        // Add a11y features.
        this.$element.attr({ "role": "listbox", "id": this.id });
        this.$element.children("figure").each(function () {
            var $this = $(this),
                active = $this.hasClass("carousel-active");

            $this.attr({
                "role": "option",
                "aria-selected": active,
                "tabindex": active ? 0 : -1
            });
        });

        // Find and add a11y to controls.
        var $controls = this.$nextTrigger.add(this.$previousTrigger);
        $controls.each(function () {
            var $this = $(this).attr({ "tabindex": defaultTriggers ? -1 : 0, "aria-controls": self.id });
            !$this.is("button") ? $this.attr({ "role": "button" }) : $this.attr({ "type": "button" });
            if (!$this.find(".visuallyhidden").length) {
                $("<span/>").addClass("visuallyhidden")
                            .html($this.is(self.$nextTrigger.selector) ? self.options.nextHint : self.options.previousHint)
                            .appendTo($this);
            }
        });

        // Find and a11y indicators.
        this.$indicators.attr({ "role": "button", "aria-controls": self.id });

        // Bind events
        // Not namespaced as we want to keep behaviour when not using data api.
        if (this.options.pause === "hover") {
            // Bind the mouse enter/leave events.
            if (!$.support.touchEvents && $.support.pointerEvents) {
                this.$element.on(emouseenter, $.proxy(this.pause, this))
                    .on(emouseleave, $.proxy(this.cycle, this));
            }
        }

        if (this.options.touch) {
            // You always have to pass the third parameter if setting data.
            this.$element.on("swipe.carousel", { touchAction: "pan-y" }, true)
                         .on("swipemove.carousel", $.proxy(this.swipemove, this))
                         .on("swipeend.carousel", $.proxy(this.swipeend, this));
        }

        if (this.options.keyboard) {
            this.$element.on(ekeydown, $.proxy(this.keydown, this));
        }

        $(document).on(eclick, "[aria-controls=" + this.id + "]", $.proxy(this.click, this));
    };

    Carousel.prototype.cycle = function (event) {

        if (!event) {
            // Flag false when there's no event.
            this.paused = false;
        }

        if (this.interval) {
            w.clearInterval(this.interval);
        }

        if (this.options.interval && !this.paused) {

            // Cycle to the next item on the set interval
            this.interval = w.setInterval($.proxy(this.next, this), this.options.interval);
        }

        // Return the carousel for chaining.
        return this;
    };

    Carousel.prototype.to = function (position) {

        var activePosition = getActiveIndex.call(this),
            self = this;

        if (position > (this.$items.length - 1) || position < 0) {

            return false;
        }

        if (this.sliding) {

            // Fire the slid event.
            return this.$element.one(eslid, function () {
                // Reset the position.
                self.to(position);

            });
        }

        if (activePosition === position) {
            return this.pause().cycle();
        }

        return this.slide(position > activePosition ? "next" : "prev", $(this.$items[position]));

    };

    Carousel.prototype.pause = function (event) {

        if (!event) {
            // Mark as paused
            this.paused = true;
        }

        // Ensure that transition end is triggered.
        if (this.$element.find(".next, .prev").length && $.support.transition) {
            this.$element.trigger($.support.transition.end);
            this.cycle(true);
        }

        // Clear the interval and return the carousel for chaining.
        this.interval = w.clearInterval(this.interval);

        return this;
    };

    Carousel.prototype.next = function () {

        if (this.sliding) {
            return false;
        }

        return this.slide("next");
    };

    Carousel.prototype.prev = function () {

        if (this.sliding) {
            return false;
        }

        return this.slide("prev");
    };

    Carousel.prototype.slide = function (type, next) {

        var $activeItem = this.$element.children("figure.carousel-active"),
            $nextItem = next || $activeItem[type]("figure"),
            isCycling = this.interval,
            isNext = type === "next",
            direction = isNext ? "left" : "right",
            fallback = isNext ? "first" : "last",
            self = this,
            slideEvent,
            slidEvent;

        if (isCycling) {
            // Pause if cycling.
            this.pause();
        }

        // Work out which item to slide to.
        if (!$nextItem.length) {

            if (!this.options.wrap) {
                return false;
            }

            $nextItem = this.$element.children("figure")[fallback]();
        }

        if ($nextItem.hasClass("carousel-active")) {
            return (this.sliding = false);
        }

        // Trigger the slide event with positional data.
        slideEvent = $.Event(eslide, { relatedTarget: $nextItem[0], direction: direction });
        this.$element.trigger(slideEvent);

        if (slideEvent.isDefaultPrevented()) {
            return false;
        }

        if (this.options.lazyImages && this.options.lazyOnDemand) {
            // Load the next image.
            this.lazyimages.call($nextItem);
        }

        // Good to go? Then let's slide.
        this.sliding = true;

        if (isCycling) {
            this.pause();
        }

        // Highlight the correct indicator.
        this.$element.one(eslid, function () {
            self.$indicators.removeClass("active")
                .eq(getActiveIndex.call(self)).addClass("active");
        });

        var complete = function () {

            if (self.$items) {
                // Clear the transition properties if set.
                self.$items.each(function () {
                    $(this).css({ "transition-duration": "" });
                });
            }

            $activeItem.removeClass(["carousel-active", direction].join(" "))
                       .attr({ "aria-selected": false, "tabIndex": -1 });
            $nextItem.removeClass([type, direction].join(" ")).addClass("carousel-active")
                     .attr({ "aria-selected": true, "tabIndex": 0 });

            self.sliding = false;
            slidEvent = $.Event(eslid, { relatedTarget: $nextItem[0], direction: direction });
            self.$element.trigger(slidEvent);
        };

        // Force reflow.
        $nextItem.addClass(type).redraw();

        // Do the slide.
        $activeItem.addClass(direction);
        $nextItem.addClass(direction);

        // Clear the added css.
        if (this.$items) {
            this.$items.each(function () {
                $(this).removeClass("swipe").css({ "left": "", "opacity": "" });
            });
        }

        $activeItem.onTransitionEnd(complete);

        // Restart the cycle.
        if (isCycling) {

            this.cycle();
        }

        return this;
    };

    Carousel.prototype.keydown = function (event) {

        var which = event && event.which;

        if (which === keys.LEFT || which === keys.RIGHT) {

            event.preventDefault();
            event.stopPropagation();

            // Seek out the correct direction indicator, shift, and focus.
            switch (which) {
                case keys.LEFT:
                    this.prev();
                    this.$previousTrigger.focus();
                    break;
                case keys.RIGHT:
                    this.next();
                    this.$nextTrigger.focus();
                    break;
            }
        }
    };

    Carousel.prototype.click = function (event) {

        if (!event) {
            return;
        }

        event.preventDefault();
        event.stopPropagation();
        var $this = $(event.target),
            indicator = $this.is(this.$indicators.selector);

        if (indicator) {
            this.to($this.index());
        } else if ($this.is(this.$nextTrigger.selector)) {
            this.next();
        }
        else if ($this.is(this.$previousTrigger.selector)) {
            this.prev();
        }
    };

    Carousel.prototype.swipemove = function (event) {

        if (this.sliding) {
            return;
        }

        this.pause();

        // Left is next.
        var isNext = event.delta.x < 0,
            type = isNext ? "next" : "prev",
            fallback = isNext ? "first" : "last",
            activePosition = getActiveIndex.call(this),
            $activeItem = this.$items.eq(activePosition),
            $nextItem = $activeItem[type]("figure");

        if (this.$items.length === 1) {
            return;
        }

        if (!$nextItem.length) {

            if (!this.options.wrap) {
                return;
            }

            $nextItem = this.$element.children("figure")[fallback]();
        }

        if ($nextItem.hasClass("carousel-active")) {
            return;
        }

        if (this.options.lazyImages && this.options.lazyOnDemand) {
            // Load the next image.
            this.lazyimages.call($nextItem);
        }

        // Get the distance swiped as a percentage.
        var width = $activeItem.width(),
            percent = parseFloat((event.delta.x / width) * 100),
            diff = isNext ? 100 : -100;

        // Shift the items but put a limit on sensitivity.
        if (Math.abs(percent) < 100 && Math.abs(percent) > 5) {
            this.$element.addClass("no-transition");
            if (this.options.mode === "slide") {
                $activeItem.css({ "left": percent + "%" });
                $nextItem.addClass("swipe").css({ "left": (percent + diff) + "%" });
            } else {
                $activeItem.addClass("swipe").css({ "opacity": 1 - Math.abs((percent / 100)) });
                $nextItem.addClass("swipe");
            }
        }
    };

    Carousel.prototype.swipeend = function (event) {

        if (this.sliding || !this.$element.hasClass("no-transition")) {
            return;
        }

        var direction = event.direction,
            method = "next";

        if (direction === "right") {
            method = "prev";
        }

        // Re-enable the transitions.
        this.$element.removeClass("no-transition");

        if (supportTransition) {

            // Trim the animation duration based on the current position.
            var activePosition = getActiveIndex.call(this),
                $activeItem = this.$items.eq(activePosition);

            if (!this.translationDuration) {
                this.translationDuration = parseFloat($activeItem.css("transition-duration"));
            }

            // Get the distance and turn it into into a percentage
            // to calculate the duration. Whichever is lowest is used.
            var width = $activeItem.width(),
                percentageTravelled = parseInt((Math.abs(event.delta.x) / width) * 100, 10),
                swipeDuration = (((event.duration / 1000) * 100) / percentageTravelled),
                newDuration = (((100 - percentageTravelled) / 100) * (Math.min(this.translationDuration, swipeDuration)));

            // Set the new temporary duration.
            this.$items.each(function () {
                $(this).css({ "transition-duration": newDuration + "s" });
            });
        }

        this.cycle();
        this[method]();
    };

    Carousel.prototype.lazyimages = function () {
        if (!this.data("lazyLoaded")) {

            this.find("img[data-src]").each(function () {
                if (this.src.length === 0) {
                    this.src = this.getAttribute("data-src");
                }
            });

            this.data("lazyLoaded", true);
        }
    };

    // Plug-in definition 
    $.fn.carousel = function (options) {

        return this.each(function () {

            var $this = $(this),
                data = $this.data("r.carousel"),
                opts = typeof options === "object" ? options : null;

            if (!data) {
                // Check the data and reassign if not present.
                $this.data("r.carousel", (data = new Carousel(this, opts)));
            }

            if (typeof options === "number") {
                // Cycle to the given number.
                data.to(options);

            } else if (typeof options === "string" && /(cycle|pause|next|prev)/.test(options) || (options = opts.slide)) {

                data[options]();

            } else if (data.options.interval) {
                data.pause().cycle();
            }
        });
    };

    // Set the public constructor.
    $.fn.carousel.Constructor = Carousel;

    // No conflict.
    var old = $.fn.carousel;
    $.fn.carousel.noConflict = function () {
        $.fn.carousel = old;
        return this;
    };

    // Data API
    $(document).on(eready, function () {

        $(".carousel").each(function () {

            var $this = $(this),
                data = $this.data("r.carouselOptions"),
                options = data || $.buildDataOptions($this, {}, "carousel", "r");

            $this.carousel(options);
        });
    });

    w.RESPONSIVE_CAROUSEL = true;

}(jQuery, window, ".r.carousel"));
/*
 * Responsive Dismiss 
 */

/*global jQuery*/
/*jshint expr:true*/
(function ($, w, ns) {

    "use strict";

    if (w.RESPONSIVE_DISMISS) {
        return;
    }

    // General variables.
    var eready = "ready" + ns,
        eclick = "click",
        edismiss = "dismiss" + ns,
        edismissed = "dismissed" + ns;

    // Dismiss class definition
    var Dismiss = function (element, options) {

        this.defaults = {
            closeHint: "Click to close"
        };

        this.options = $.extend({}, this.defaults, options);

        this.$element = $(element).attr({ "type": "button" });
        this.$target = this.$element.closest(options.target);
        this.dismissing = null;

        // A11y goodness.
        if (this.$element.is("button")) {
            $(element).attr({ "type": "button" });
        }

        if (this.$target.hasClass("alert")) {
            this.$target.attr({ "aria-live": "assertive" });
        }

        if (!this.$element.find(".visuallyhidden").length) {
            $("<span/>").addClass("visuallyhidden")
                        .html(this.options.closeHint)
                        .appendTo(this.$element);
        }

        // Bind events
        this.$element.on(eclick, $.proxy(this.click, this));
    };

    Dismiss.prototype.close = function () {

        var dismissEvent = $.Event(edismiss),
            $target = this.$target,
            self = this,
            complete = function () {
                self.dismissing = false;
                $target.addClass("hidden").attr({ "aria-hidden": true, "tabindex": -1 }).trigger($.Event(edismissed));
            };

        $target.trigger(dismissEvent);

        if (this.dismissing || dismissEvent.isDefaultPrevented()) {
            return;
        }

        this.dismissing = true;

        $target.addClass("fade-in fade-out")
               .redraw()
               .removeClass("fade-in");

        // Do our callback
        this.$target.onTransitionEnd(complete);
    };

    Dismiss.prototype.click = function (event) {
        event.preventDefault();
        this.close();
    };

    // Plug-in definition 
    $.fn.dismiss = function (options) {

        return this.each(function () {

            var $this = $(this),
                data = $this.data("dismiss");

            if (!data) {
                // Check the data and reassign if not present.
                $this.data("dismiss", (data = new Dismiss(this, options)));
            }

            // Close the element.
            if (options === "close") {
                data.close();
            }
        });
    };

    // Set the public constructor.
    $.fn.dismiss.Constructor = Dismiss;

    // No conflict.
    var old = $.fn.dismiss;
    $.fn.dismiss.noConflict = function () {
        $.fn.dismiss = old;
        return this;
    };

    // Data API
    $(document).on(eready, function () {

        $("button[data-dismiss-target]").each(function () {

            var $this = $(this),
                data = $this.data("r.dismissOptions"),
                options = data || $.buildDataOptions($this, {}, "dismiss", "r");

            // Run the dismiss method.
            $this.dismiss(options);
        });

    });

    w.RESPONSIVE_DISMISS = true;

}(jQuery, window, ".r.dismiss"));
/*
 * Responsive Dropdown 
 */
/*jshint expr:true*/
/*global jQuery*/
(function ($, w, ns) {

    "use strict";

    if (w.RESPONSIVE_DROPDOWN) {
        return;
    }

    // General variables.
    var supportTransition = w.getComputedStyle && $.support.transition,
        eready = "ready" + ns,
        eclick = "click",
        ekeydown = "keydown",
        eshow = "show" + ns,
        eshown = "shown" + ns,
        ehide = "hide" + ns,
        ehidden = "hidden" + ns;

    var keys = {
        SPACE: 32,
        LEFT: 37,
        RIGHT: 39
    };

    // Private methods.
    var transition = function (method, startEvent, completeEvent) {

        var self = this,
            doShow = method === "removeClass",
            complete = function () {

                // The event to expose.
                var eventToTrigger = $.Event(completeEvent);

                // Ensure the height/width is set to auto.
                self.$target.removeClass("trans")[self.options.dimension]("");

                self.transitioning = false;

                // Set the correct aria attributes.
                self.$target.attr({
                    "aria-hidden": !doShow,
                    "tabindex": doShow ? 0 : -1,
                });

                $("#" + self.$target.attr("aria-labelledby")).attr({
                    "aria-selected": doShow,
                    "aria-expanded": doShow,
                    "tabindex": self.options.parent ? doShow ? 0 : -1 : 0
                });

                self.$target.trigger(eventToTrigger);
            };

        if (this.transitioning || startEvent.isDefaultPrevented()) {
            return;
        }

        this.transitioning = true;

        // Remove or add the expand classes.
        this.$target.trigger(startEvent)[method]("collapse");
        this.$target[startEvent.type === "show" ? "addClass" : "removeClass"]("expand trans");

        this.$target.onTransitionEnd(complete);
    };

    // The Dropdown class definition
    var Dropdown = function (element, options) {

        this.$element = $(element);
        this.$target = $(options.target);
        this.defaults = {
            dimension: "height"
        };
        this.options = $.extend({}, this.defaults, options);
        this.$parent = null;
        this.transitioning = null;
        this.endSize = null;

        if (this.options.parent) {
            this.$parent = this.$target.closest(this.options.parent);
        }

        // Add accessibility features.
        if (this.$parent) {
            this.$parent.attr({ "role": "tablist", "aria-multiselectable": "true" })
                .find("div:not(.collapse,.accordion-body)").attr("role", "presentation");
        } else {
            $(".accordion").find("div:not(.collapse,.accordion-body)").addBack().attr("role", "presentation");
        }

        var $tab = $("[href=" + this.options.target + "], [data-dropdown-target=" + this.options.target + "]"),
            tabId = $tab.attr("id") || "dropdown-" + $.pseudoUnique(),
            paneId = this.$target.attr("id") || "dropdown-" + $.pseudoUnique(),
            active = !this.$target.hasClass("collapse");

        $tab.attr({
            "id": tabId,
            "role": "tab",
            "aria-controls": paneId,
            "aria-selected": active,
            "aria-expanded": active,
            "tabindex": this.options.parent ? active ? 0 : -1 : 0
        });

        this.$target.attr({
            "id": paneId,
            "role": "tabpanel",
            "aria-labelledby": tabId,
            "aria-hidden": !active,
            "tabindex": active ? 0 : -1
        });

        // Bind events.
        this.$element.on(eclick, $.proxy(this.click, this));
        this.$element.on(ekeydown, $.proxy(this.keydown, this));
    };

    Dropdown.prototype.show = function () {

        if (this.transitioning || this.$target.hasClass("expand")) {
            return;
        }

        var self = this,
            dimension = this.options.dimension,
            $actives = [];

        if (this.$parent) {
            // Get all the related open panes.
            $actives = this.$parent.find("[role=tab]");

            $actives = $.grep($actives, function (a) {
                var data = $(a).data("r.dropdown"),
                    $target = data && data.$target;

                return $target && $target.hasClass("dropdown-group") && !$target.hasClass("collapse") && data.$parent[0] === self.$parent[0];
            });
        }

        // Set the height/width to zero then to the height/width
        // so animation can take place.
        this.$target[dimension](0);
            
        if (supportTransition) {

            // Calculate the height/width.
            this.$target[dimension]("auto");
            this.endSize = w.getComputedStyle(this.$target[0])[dimension];

            // Reset to zero and force repaint.
            this.$target[dimension](0).redraw();
        }

        this.$target[dimension](this.endSize || "");

        transition.call(this, "removeClass", $.Event(eshow), eshown);

        if ($actives && $actives.length) {
            $.each($actives, function () {
                $(this).dropdown("hide");
            });
        }
    };

    Dropdown.prototype.hide = function () {

        if (this.transitioning || this.$target.hasClass("collapse")) {
            return;
        }

        if (this.$parent) {

            var actives = this.$parent.find(".dropdown-group:not(.collapse)").not(this.$target);

            if (!actives.length) {
                return;
            }
        }

        // Reset the height/width and then reduce to zero.
        var dimension = this.options.dimension,
            size;

        if (supportTransition) {

            // Set the height to auto, calculate the height/width and reset.
            size = w.getComputedStyle(this.$target[0])[dimension];

            // Reset the size and force repaint.
            this.$target[dimension](size).redraw(); // Force reflow ;
        }

        this.$target.removeClass("expand");
        this.$target[dimension](0);
        transition.call(this, "addClass", $.Event(ehide), ehidden);
    };

    Dropdown.prototype.toggle = function () {
        // Run the correct command based on the presence of the class "collapse".
        this[this.$target.hasClass("collapse") ? "show" : "hide"]();
    };

    Dropdown.prototype.click = function (event) {
        event.preventDefault();
        event.stopPropagation();
        this.toggle();
    };

    Dropdown.prototype.keydown = function (event) {

        var which = event.which;

        if (which === keys.SPACE || which === keys.LEFT || which === keys.RIGHT) {

            event.preventDefault();
            event.stopPropagation();

            var $this = $(event.target),
                $parent = this.options.parent ? $this.closest("[role=tablist]") : $this.closest(".accordion"),
                $items = $parent.find("[role=tab]"),
                index = $items.index($items.filter(":focus")),
                length = $items.length;

            if (which === keys.SPACE) {
                $("#" + $items.eq(index).attr("aria-controls")).data("r.dropdown").toggle();
            }

            if (which === keys.LEFT) {
                index -= 1;
            } else if (which === keys.RIGHT) {
                index += 1;
            }

            // Ensure that the index stays within bounds.
            if (index === length) {
                index = 0;
            }

            if (index < 0) {
                index = length - 1;
            }

            $items.eq(index).focus();
        }
    };

    // Plug-in definition 
    $.fn.dropdown = function (options) {
        return this.each(function () {
            var $this = $(this),
                data = $this.data("r.dropdown"),
                opts = typeof options === "object" ? options : null;

            if (!data) {
                // Check the data and reassign if not present.
                $this.data("r.dropdown", (data = new Dropdown(this, opts)));
            }

            // Run the appropriate function if a string is passed.
            if (typeof options === "string") {
                data[options]();
            }
        });
    };

    // Set the public constructor.
    $.fn.dropdown.Constructor = Dropdown;

    // No conflict.
    var old = $.fn.dropdown;
    $.fn.dropdown.noConflict = function () {
        $.fn.dropdown = old;
        return this;
    };

    // Dropdown data api initialization.
    $(document).on(eready, function () {
        $(":attrStart(data-dropdown)").each(function () {
            var $this = $(this),
                data = $this.data("r.dropdownOptions"),
                options = data || $.buildDataOptions($this, {}, "dropdown", "r");

            options.target || (options.target = $this.attr("href"));
            // Run the dropdown method.
            $this.dropdown(options);
        });
    });

    w.RESPONSIVE_DROPDOWN = true;

}(jQuery, window, ".r.dropdown"));
(function ($, w, ns) {

    "use strict";

    var $window = $(w),
        $html = $("html"),
        $body = $("body"),
        $overlay = $("<div/>").attr({ "role": "document" }).addClass("modal-overlay modal-loader fade-out"),
        $modal = $("<div/>").addClass("modal fade-out").appendTo($overlay),
        $header = $("<div/>").addClass("modal-header fade-out"),
        $footer = $("<div/>").addClass("modal-footer fade-out"),
        $close = $("<button/>").attr({ "type": "button" }).addClass("modal-close fade-out"),
        $previous = $("<button/>").attr({ "type": "button" }).addClass("modal-direction left hidden"),
        $next = $("<button/>").attr({ "type": "button" }).addClass("modal-direction right hidden"),
        $placeholder = $("<div/>").addClass("modal-placeholder"),
        // Events
        eready = "ready" + ns,
        eresize = ["resize", " orientationchange"].join(".modal "),
        eclick = "click",
        ekeydown = "keydown",
        efocusin = "focusin",
        eshow = "show" + ns,
        eshown = "shown" + ns,
        ehide = "hide" + ns,
        ehidden = "hidden" + ns,
        supportTransition = $.support.transition,
        keys = {
            ESCAPE: 27,
            LEFT: 37,
            RIGHT: 39
        },
        lastScroll = 0,
        protocol = w.location.protocol.indexOf("http") === 0 ? w.location.protocol : "http:",
        // Regular expression.
        rexternalHost = new RegExp("//" + w.location.host + "($|/)"),
        rimage = /(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|ti(ff|f)|webp|svg)((\?|#).*)?$)/i,
        // Taken from jQuery.
        rhash = /^#.*$/, // Altered to only match beginning.
        rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,
        rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/;

    var Modal = function (element, options) {
        this.$element = $(element);
        this.defaults = {
            modal: false,
            external: false,
            group: null,
            iframe: false,
            iframeScroll: false,
            keyboard: true,
            touch: true,
            next: ">",
            nextHint: "Next (Right Arrow)",
            previous: "<",
            previousHint: "Previous (Left Arrow)",
            closeHint: "Close (Esc)",
            mobileTarget: null,
            mobileViewportWidth: 480,
            fitViewport: true
        };
        this.options = $.extend({}, this.defaults, options);
        this.title = null;
        this.description = null;
        this.isShown = null;
        this.$group = null;

        // Make a list of grouped modal targets.
        if (this.options.group) {
            this.$group = $(this.options.group);
        }

        // Bind events.
        this.$element.on(eclick, $.proxy(this.click, this));
        $(w).off(eresize).on(eresize, $.proxy(this.resize, this));
    };

    Modal.prototype.show = function () {

        if (this.isShown) {
            return;
        }

        var self = this,
            showEvent = $.Event(eshow),
            shownEvent = $.Event(eshown),
            complete = function () {

                $modal.focus();

                $body.children().not($overlay).attr("tabindex", -1);

                // Ensure that focus is maintained within the modal.
                $(document).on(efocusin, function (event) {
                    if (event.target !== $overlay[0] && !$.contains($overlay[0], event.target)) {
                        var $newTarget = $modal.find("input, select, a, iframe, img, div, button").first();
                        $newTarget.length ? $newTarget.focus() : ((!self.options.modal && $close.focus()) || $overlay.focus());
                        return false;
                    }

                    return true;
                });

                // Bind the keyboard actions.
                if (self.options.keyboard) {
                    $(document).on(ekeydown, $.proxy(self.keydown, self));
                }

                if (self.options.group) {
                    if (self.options.touch) {
                        //  manageTouch.call(self);
                    } else {
                        //   manageTouch.call(self, "off");
                    }
                }

                self.$element.trigger(shownEvent);
            };

        this.$element.trigger(showEvent);

        if (showEvent.isDefaultPrevented()) {
            return;
        }

        this.isShown = true;
        this.overlay();
        this.create();

        // Call the callback.
        $modal.onTransitionEnd(complete);
    };

    Modal.prototype.hide = function (preserveOverlay, callback) {

        if (!this.isShown) {
            return;
        }

        var self = this,
            hideEvent = $.Event(ehide),
            hiddenEvent = $.Event(ehidden),
            complete = function () {
                self.$element.trigger(hiddenEvent);
            };

        this.$element.trigger(hideEvent);

        if (hideEvent.isDefaultPrevented()) {
            return;
        }

        this.isShown = false;

        this.destroy(callback);

        if (!preserveOverlay) {
            this.overlay(true);
        }

        $modal.onTransitionEnd(complete);
    };

    Modal.prototype.overlay = function (hide) {

        // TODO: Add hide method.
        var fade = hide ? "removeClass" : "addClass",
            self = this,
            complete = function () {
                if (hide) {
                    // Put scroll position etc back as before.
                    $overlay.addClass("hidden");
                    $html.removeClass("modal-on")
                         .css("margin-right", "");

                    if ($html.hasClass("modal-lock")) {
                        $html.removeClass("modal-lock");
                        if (lastScroll !== $window.scrollTop()) {
                            $window.scrollTop(lastScroll);
                            lastScroll = 0;
                        }
                    }

                    return;
                }

                // Bind click events to handle hide.
                $overlay.off(eclick).on(eclick, function (event) {

                    if (self.options.modal) {
                        return;
                    }

                    var closeTarget = $close[0],
                        eventTarget = event.target;

                    if (eventTarget === closeTarget) {
                        event.preventDefault();
                        event.stopPropagation();
                        self.hide();
                    }

                    if (eventTarget === $overlay[0]) {
                        self.hide();
                    }
                });
            };

        // Show the overlay.
        var getScrollbarWidth = function () {
            var $scroll = $("<div/>").css({ width: 99, height: 99, overflow: "scroll", position: "absolute", top: -9999 });
            $body.append($scroll);
            var scrollbarWidth = $scroll[0].offsetWidth - $scroll[0].clientWidth;
            $scroll.remove();
            return scrollbarWidth;
        };

        // Add the overlay to the body if not done already.
        if (!$(".modal-overlay").length) {
            $body.append($overlay);
        }

        if (!hide) {
            // Take note of the current scroll position then remove the scrollbar.
            if (lastScroll === 0) {
                lastScroll = $window.scrollTop();
            }

            $html.addClass("modal-on")
                 .css("margin-right", getScrollbarWidth());
        }

        $overlay.removeClass("hidden").redraw()[fade]("fade-in").redraw();
        $overlay.onTransitionEnd(complete);
    };

    Modal.prototype.create = function () {

        $overlay.addClass("modal-loader");

        // Calculate whether this is an external request and set the value.
        this.options.external = !rhash.test(this.options.target);

        var isExternalUrl = function (url) {
            // Handle different host types.
            // Split the url into it's various parts.
            var locationParts = rurl.exec(url) || rurl.exec(protocol + url);

            if (locationParts === undefined || rhash.test(url)) {
                return false;
            }

            // Target is a local protocol.
            if (!locationParts || !locationParts[2] || rlocalProtocol.test(locationParts[1])) {
                return false;
            }

            // If the regex doesn't match return true . 
            return !rexternalHost.test(locationParts[2]);
        };

        var fadeIn = function () {
            self.resize();

            $.each([$header, $footer, $close, $modal], function () {

                this.addClass("fade-in")
                    .redraw();
            });

            // self.overlay();
            $overlay.removeClass("modal-loader");
        };

        var self = this,
            title = this.options.title,
            description = this.options.description,
            modal = this.options.modal,
            target = this.options.target,
            external = isExternalUrl(target),
            local = !this.options.external && !external,
            $group = this.$group,
            nextText = this.options.next + "<span class=\"visuallyhidden\">" + this.options.nextHint + "</span>",
            previousText = this.options.previous + "<span class=\"visuallyhidden\">" + this.options.previousHint + "</span>",
            iframeScroll = this.options.iframeScroll,
            iframe = this.options.iframe || !local ? external && !rimage.test(target) : false,
            $iframeWrap = $("<div/>").addClass(iframeScroll ? "media media-scroll" : "media"),
            $content = $("<div/>").addClass("modal-content");

        // 1: Build the header
        if (title || !modal) {

            if (title) {
                var id = "modal-label-" + $.pseudoUnique();
                $header.html("<div class=\"container\"><h2 id=\"" + id + "\">" + title + "</h2></div>")
                       .appendTo($overlay.attr({ "aria-labelledby": id }));
            }

            if (!modal) {
                $close.html("x <span class=\"visuallyhidden\">" + this.options.closeHint + "</span>").appendTo($overlay);
            }
        }

        // 2: Build the footer
        if (description) {

            // Add footer text if necessary
            $footer.html("<div class=\"container\">" + description + "</div>")
                   .appendTo($overlay);
        }

        // 3: Build the content
        if (local) {
            var $target = $(target);
            this.isLocalHidden = $target.is(":hidden");
            $modal.addClass(this.options.fitViewport ? "container" : "");
            $placeholder.detach().insertAfter($target);
            $target.detach().appendTo($content).removeClass("hidden");
            $content.appendTo($modal);
            // Fade in.
            fadeIn();
        } else {
            if (iframe) {

                $modal.addClass("modal-iframe");

                // Normalize the src.
                var src = target.indexOf("http") !== 0 ? protocol + target : target,
                    getMediaProvider = function (url) {
                        var providers = {
                            youtube: /youtu(be\.com|be\.googleapis\.com|\.be)/i,
                            vimeo: /vimeo/i,
                            vine: /vine/i,
                            instagram: /instagram|instagr\.am/i,
                            getty: /embed\.gettyimages\.com/i
                        };

                        for (var p in providers) {
                            if (providers.hasOwnProperty(p) && providers[p].test(url)) {
                                return p;
                            }
                        }

                        return false;
                    };

                // Have to add inline styles for older browsers.
                $("<iframe/>").attr({
                    "scrolling": iframeScroll ? "yes" : "no",
                    "allowTransparency": true,
                    "frameborder": 0,
                    "hspace": 0,
                    "vspace": 0,
                    "webkitallowfullscreen": "",
                    "mozallowfullscreen": "",
                    "allowfullscreen": ""
                }).one("load error", function () {
                    // Fade in. Can be slow but ensures concurrency.
                    fadeIn();
                }).appendTo($iframeWrap).attr("src", src);

                // Test and add additional media classes.
                var mediaClasses = getMediaProvider(target) || "";
                $iframeWrap.addClass(mediaClasses).appendTo($modal);

            } else {
                if (rimage.test(target)) {

                    $modal.addClass("modal-image");

                    $("<img/>").one("load error", function () {
                        // Fade in.
                        fadeIn();
                    }).appendTo($modal).attr("src", target);
                } else {
                    $modal.addClass("modal-ajax");
                    // Standard ajax load.
                    $content.load(target, function () {
                        $content.appendTo($modal);
                        // Fade in.
                        fadeIn();
                    });
                }
            }
        }

        if ($group) {
            // Test to see if the grouped target have data.
            var $filtered = $group.filter(function () {
                return $(this).data("r.modal");
            });

            if ($filtered.length) {
                // Need to show next/previous.
                $next.html(nextText).prependTo($modal).removeClass("hidden");
                $previous.html(previousText).prependTo($modal).removeClass("hidden");
            }
        }

        // Bind the next/previous events.
        $modal.off(eclick).on(eclick, $.proxy(function (event) {
            var next = $next[0],
                previous = $previous[0],
                eventTarget = event.target;

            if (eventTarget === next || eventTarget === previous) {
                event.preventDefault();
                event.stopPropagation();
                this[eventTarget === next ? "next" : "previous"]();
            }

        }, this));
    };

    Modal.prototype.destroy = function (callback) {
        var self = this,
            cleanUp = function () {

                if (!self.options.external) {
                    // Put that kid back where it came from or so help me.
                    $(self.options.target).addClass(self.isLocalHidden ? "hidden" : "").detach().insertAfter($placeholder);
                    $placeholder.detach().insertAfter($overlay);
                }

                // Clean up the header/footer.
                $header.empty().detach();
                $footer.empty().detach();
                $close.detach();

                // Remove label.
                $overlay.removeAttr("aria-labelledby");

                // Clean up the next/previous.
                $next.detach();
                $previous.detach();

                $.each([$header, $footer, $close, $modal], function () {
                    this.removeClass("fade-in")
                        .redraw();
                });

                // Fix __flash__removeCallback' is undefined error.
                $.when($modal.find("iframe").attr("src", "")).then(w.setTimeout(function () {

                    $modal.removeClass("modal-iframe modal-ajax modal-image container").css({
                        "max-height": "",
                        "max-width": ""
                    }).empty();

                    // Return focus events back to normal.
                    $(document).off(efocusin);

                    // Unbind the keyboard actions.
                    if (self.options.keyboard) {
                        $(document).off(ekeydown);
                    }

                    // Handle callback passed from direction.
                    callback && callback.call(self);
                }, 100));

                // $modal.removeData("currentmodal");
            };

        $modal.onTransitionEnd(cleanUp);
    };

    Modal.prototype.click = function (event) {
        event.preventDefault();
        this.show();
    };

    Modal.prototype.keydown = function (event) {

        // Bind the escape key.
        if (event.which === keys.ESCAPE) {
            this.hide();
        }

        // Bind the next/previous keys.
        if (this.options.group) {
            // Bind the left arrow key.
            if (event.which === keys.LEFT) {
                this.previous();
            }

            // Bind the right arrow key.
            if (event.which === keys.RIGHT) {
                this.next();
            }
        }
    };

    Modal.prototype.resize = function () {

        var windowHeight = parseInt($window.height(), 10),
            headerHeight = $header.length && parseInt($header.height(), 10) || 0,
            closeHeight = $close.length && parseInt($close.outerHeight(), 10) || 0,
            topHeight = closeHeight > headerHeight ? closeHeight : headerHeight,
            footerHeight = $footer.length && parseInt($footer.height(), 10) || 0;

        $(".modal-overlay").css({ "padding-top": topHeight, "padding-bottom": footerHeight });

        if ($modal.hasClass("modal-image")) {

            $modal.children("img").css("max-height", windowHeight - (topHeight + footerHeight));
        } else if ($modal.hasClass("modal-iframe")) {

            // Calculate the ratio.
            var $iframe = $modal.find(".media > iframe"),
                iframeWidth = parseInt($iframe.width(), 10),
                maxHeight = windowHeight - (topHeight + footerHeight),
                iframeHeight = parseInt($iframe.height(), 10),
                ratio = iframeWidth / iframeHeight,
                maxWidth = maxHeight * ratio;
            // Set both to ensure there is no overflow.
            $.each([$modal, $iframe], function () {
                this.css({
                    "max-height": maxHeight,
                    "max-width": maxWidth
                });
            });
        }
    };

    Modal.prototype.direction = function (course) {
        if (!this.isShown) {
            return;
        }

        if (this.options.group) {
            var self = this,
                index = this.$group.index(this.$element),
                length = this.$group.length,
                position = course === "next" ? index + 1 : index - 1,
                complete = function () {
                    if (self.$sibling && self.$sibling.data("r.modal")) {
                        if (supportTransition) {
                            self.$sibling.data("r.modal").show();
                        } else {
                            w.setTimeout(function () {
                                self.$sibling.data("r.modal").show();
                            }, 300);
                        }
                    }
                };

            if (course === "next") {

                if (position >= length || position < 0) {

                    position = 0;
                }
            } else {

                if (position >= length) {

                    position = 0;
                }

                if (position < 0) {
                    position = length - 1;
                }
            }

            this.$sibling = $(this.$group[position]);
            this.hide(true, complete);

            //$modal.onTransitionEnd(complete);
        }
    };

    Modal.prototype.next = function () {
        this.direction("next");
    };

    Modal.prototype.previous = function () {
        this.direction("previous");
    };

    // Plug-in definition 
    $.fn.modal = function (options) {

        return this.each(function () {
            var $this = $(this),
                data = $this.data("r.modal"),
                opts = typeof options === "object" ? options : {};

            if (!opts.target) {
                opts.target = $this.attr("href");
            }

            if (!data) {
                // Check the data and reassign if not present.
                $this.data("r.modal", (data = new Modal(this, opts)));
            }

            // Run the appropriate function if a string is passed.
            if (typeof options === "string") {
                data[options]();
            }
        });
    };

    // Set the public constructor.
    $.fn.modal.Constructor = Modal;

    // No conflict.
    var old = $.fn.modal;
    $.fn.modal.noConflict = function () {
        $.fn.modal = old;
        return this;
    };

    $(document).on(eready, function () {

        $(":attrStart(data-modal)").each(function () {

            var $this = $(this),
                data = $this.data("r.modalOptions"),
                options = data || $.buildDataOptions($this, {}, "modal", "r");

            // Run the modal method.
            $this.modal(options);
        });
    });

}(jQuery, window, ".r.modal"));
/*
 * Responsive Lightbox
 */

/*global jQuery*/
/*jshint expr:true*/

(function ($, w, ns) {

    "use strict";

    if (w.RESPONSIVE_LIGHTBOX) {
        return;
    }

    // General variables.
    var $window = $(w),
        $html = $("html"),
        $body = $("body"),
        $overlay = $("<div/>").attr({ "role": "document" }).addClass("lightbox-overlay lightbox-loader fade-out"),
        $lightbox = $("<div/>").addClass("lightbox fade-out").appendTo($overlay),
        $header = $("<div/>").addClass("lightbox-header fade-out"),
        $footer = $("<div/>").addClass("lightbox-footer fade-out"),
        $img = null,
        $iframe = null,
        $content = null,
        $close = $("<button/>").attr({ "type": "button" }).addClass("lightbox-close fade-out"),
        $previous = $("<button/>").attr({ "type": "button" }).addClass("lightbox-direction left hidden"),
        $next = $("<button/>").attr({ "type": "button" }).addClass("lightbox-direction right hidden"),
        $placeholder = $("<div/>").addClass("lightbox-placeholder"),
        scrollbarWidth = 0,
        lastScroll = 0,
        supportTransition = $.support.transition,
        keys = {
            ESCAPE: 27,
            LEFT: 37,
            RIGHT: 39
        },
        protocol = w.location.protocol.indexOf("http") === 0 ? w.location.protocol : "http:",
        // Regular expression.
        rexternalHost = new RegExp("//" + w.location.host + "($|/)"),
        rimage = /(^data:image\/.*,)|(\.(jp(e|g|eg)|gif|png|bmp|ti(ff|f)|webp|svg)((\?|#).*)?$)/i,
        // Taken from jQuery.
        rhash = /^#.*$/, // Altered to only match beginning.
        rurl = /^([\w.+-]+:)(?:\/\/([^\/?#:]*)(?::(\d+)|)|)/,
        rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
        // Events
        eclick = "click" + ns,
        ekeydown = "keydown",
        eshow = "show" + ns,
        eshown = "shown" + ns,
        ehide = "hide" + ns,
        ehidden = "hidden" + ns,
        eresize = ["resize", " orientationchange"].join(" "),
        efocusin = "focusin";

    // Private methods.
    var isExternalUrl = function (url) {
        // Handle different host types.
        // Split the url into it's various parts.
        var locationParts = rurl.exec(url) || rurl.exec(protocol + url);

        if (locationParts === undefined || rhash.test(url)) {
            return false;
        }

        // Target is a local protocol.
        if (!locationParts || !locationParts[2] || rlocalProtocol.test(locationParts[1])) {
            return false;
        }

        // If the regex doesn't match return true . 
        return !rexternalHost.test(locationParts[2]);
    },

    getMediaProvider = function (url) {
        var providers = {
            youtube: /youtu(be\.com|be\.googleapis\.com|\.be)/i,
            vimeo: /vimeo/i,
            vine: /vine/i,
            instagram: /instagram|instagr\.am/i,
            getty: /embed\.gettyimages\.com/i
        };

        for (var p in providers) {
            if (providers.hasOwnProperty(p) && providers[p].test(url)) {
                return p;
            }
        }

        return false;
    },

    create = function () {

        // Calculate whether this is an external request and set the value.
        this.options.external = !rhash.test(this.options.target);

        var self = this,
            title = this.options.title,
            description = this.options.description,
            modal = this.options.modal,
            target = this.options.target,
            local = !this.options.external && !isExternalUrl(target),
            group = this.options.group,
            nextText = this.options.next + "<span class=\"visuallyhidden\">" + this.options.nextHint + "</span>",
            previousText = this.options.previous + "<span class=\"visuallyhidden\">" + this.options.previousHint + "</span>",
            iframeScroll = this.options.iframeScroll,
            iframe = this.options.iframe || !local ? isExternalUrl(target) && !rimage.test(target) : false,
            $iframeWrap = $("<div/>").addClass(iframeScroll ? "media media-scroll" : "media");

        $content = $("<div/>").addClass("lightbox-content");
        $iframe = $("<iframe/>"); // This needs to be assigned then unassigned or ie8 won't test against it.
        $img = $("<img/>"); // ditto.

        // 1: Build the header
        if (title || !modal) {

            if (title) {
                var id = "modal-label-" + $.pseudoUnique();
                $header.html("<div class=\"container\"><h2 id=\"" + id + "\">" + title + "</h2></div>")
                       .appendTo($overlay.attr({ "aria-labelledby": id }));
            }

            if (!modal) {
                $close.html("x <span class=\"visuallyhidden\">" + this.options.closeHint + "</span>").appendTo($overlay);
            }
        }

        // 2: Build the footer
        if (description) {

            // Add footer text if necessary
            $footer.html("<div class=\"container\">" + description + "</div>")
                   .appendTo($overlay);
        }

        // 3: Build the content
        if (local) {
            $img = null;
            $iframe = null;
            var $target = $(target);
            this.isLocalHidden = $target.is(":hidden");
            $lightbox.addClass(this.options.fitViewport ? "container" : "");
            $placeholder.detach().insertAfter($target);
            $target.detach().appendTo($content).removeClass("hidden");
            $content.appendTo($lightbox);
            toggleFade.call(this);
        } else {
            if (iframe) {

                $img = null;
                $content = null;
                $lightbox.addClass("lightbox-iframe");

                // Normalize the src.
                var src = target.indexOf("http") !== 0 ? protocol + target : target;

                // Have to add inline styles for older browsers.
                $iframe.attr({
                    "scrolling": iframeScroll ? "yes" : "no",
                    "allowTransparency": true,
                    "frameborder": 0,
                    "hspace": 0,
                    "vspace": 0,
                    "webkitallowfullscreen": "",
                    "mozallowfullscreen": "",
                    "allowfullscreen": "",
                    "src": src
                }).appendTo($iframeWrap);

                // Test and add additional media classes.
                var mediaClasses = getMediaProvider(target) || "";

                $iframeWrap.addClass(mediaClasses).appendTo($lightbox);

                // Not on load as can take forever.
                toggleFade.call(this);

            } else {

                if (rimage.test(target)) {

                    $iframe = null;
                    $content = null;
                    $lightbox.addClass("lightbox-image");

                    $img.one("load error", function () {
                        toggleFade.call(self);
                    }).attr("src", target)
                        .appendTo($lightbox);
                } else {

                    $img = null;
                    $iframe = null;
                    $lightbox.addClass("lightbox-ajax");

                    // Standard ajax load.
                    $content.load(target, function () {
                        $content.appendTo($lightbox);
                        toggleFade.call(self);
                    });
                }
            }
        }

        if (group) {
            // Need to show next/previous.
            $next.html(nextText).prependTo($lightbox).removeClass("hidden");
            $previous.html(previousText).prependTo($lightbox).removeClass("hidden");
        }

        // Bind the click events.
        $lightbox.off(eclick).on(eclick, $.proxy(function (event) {

            var next = $next[0],
                previous = $previous[0],
                eventTarget = event.target;

            if (eventTarget === next || eventTarget === previous) {
                event.preventDefault();
                event.stopPropagation();
                this[eventTarget === next ? "next" : "previous"]();
            }

            if ($img) {
                if (eventTarget === $img[0] && this.options.group) {
                    this.next();
                }
            }
        }, this));
    },

    destroy = function (callback) {
        var self = this,
            empty = function () {
                $lightbox.removeClass("lightbox-iframe lightbox-ajax lightbox-image container").css({
                    "max-height": "",
                    "max-width": "",
                    "margin-top": "",
                    "margin-bottom": ""
                }).empty();

                manageFocus("hide");

                // Unbind the keyboard actions.
                if (self.options.keyboard) {

                    manageKeyboard.call(self, "hide");
                }

                callback && callback();

            }, cleanUp = function () {

                if (!self.options.external) {
                    // Put that kid back where it came from or so help me.
                    $(self.options.target).addClass(self.isLocalHidden ? "hidden" : "").detach().insertAfter($placeholder);
                    $placeholder.detach().insertAfter($overlay);
                }

                // Clean up the header/footer.
                $header.empty().detach();
                $footer.empty().detach();
                $close.detach();

                // Remove label.
                $overlay.removeAttr("aria-labelledby");

                // Clean up the lightbox.
                $next.detach();
                $previous.detach();

                // Fix __flash__removeCallback' is undefined error.
                $.when($lightbox.find("iframe").attr("src", "")).then(w.setTimeout(empty, 100));

                $lightbox.removeData("currentLightbox");
            };

        toggleFade.call(this);

        $lightbox.onTransitionEnd(cleanUp);
    },

    resize = function () {
        // Bind the resize event and fade in.
        var maxWidth = parseInt($lightbox.css("max-width"), 10),
            onResize = function () {

                var windowHeight = $window.height(),
                    headerHeight,
                    footerHeight,
                    closeHeight,
                    childHeight,
                    topHeight,
                    bottomHeight,
                    diff,
                    $child = $iframe || $img || $content;

                if ($child) {

                    // Defaulting to 1px on the footer prevents the address bar from
                    // covering the lightbox on windows phone.
                    headerHeight = $header.height() || 0;
                    footerHeight = $footer.height() || 0;
                    closeHeight = $close.outerHeight() || 0;
                    topHeight = (headerHeight > closeHeight ? headerHeight : closeHeight);
                    bottomHeight = footerHeight > 0 ? footerHeight : 1;
                    diff = topHeight + bottomHeight;
                    childHeight = windowHeight - diff;
                    var ieMobile = navigator.userAgent.match(/IEMobile\//);

                    if ($img) {
                        // IE8 doesn't change the width as max-width will cause the 
                        // The image width to be set to zero.
                        $img.css({
                            "max-height": childHeight,
                            "max-width": "100%"
                        });
                    } else if ($content) {
                        $lightbox.css("max-height", childHeight);
                        $content.css("max-height", childHeight);

                        // Prevent IEMobile10 scrolling when content overflows the lightbox.
                        // This causes the content to jump behind the model but it's all I can
                        // find for now.
                        if (ieMobile) {
                            if ($content.children("*:first")[0].scrollHeight > $content.height()) {
                                $html.addClass("lightbox-lock");
                            }
                        }
                    } else {

                        var iframeWidth = $iframe.width(),
                            iframeHeight = $iframe.height(),
                            ratio = iframeWidth / iframeHeight,
                            childWidth = childHeight * ratio;
                        // Set both to ensure there is no overflow.
                        $.each([$lightbox, $iframe], function () {

                            this.css({
                                "max-height": childHeight,
                                "max-width": childWidth > maxWidth ? maxWidth : childWidth
                            });
                        });
                    }

                    // Adjust the vertically aligned position if necessary to account for
                    // overflow into the footer.
                    var margin = topHeight,
                        top,
                        bottom;

                    $overlay.css({
                        "padding-top": topHeight > 0 ? topHeight : ""
                    });

                    top = parseInt($lightbox.offset().top, 10);

                    // Thaaanks IE8!
                    if (top < 0) {
                        $lightbox.css({ "margin-top": 1 });
                        top = parseInt($lightbox.offset().top, 10);
                    }

                    var fallback = footerHeight > 1 ? -((topHeight + bottomHeight) / 2) : "";

                    bottom = top + $child.height();

                    var getTopMargin = function () {
                        if (bottomHeight > 1 && top > margin && windowHeight - bottom < bottomHeight) {
                            var newMargin = ((top - margin) * -2) + 4;

                            if ((newMargin * -1) + childHeight < windowHeight - bottom) {
                                return newMargin;
                            }
                        }

                        return fallback;
                    };

                    $lightbox.css({
                        "margin-top": getTopMargin()
                    });
                }
            };

        $window.off(eresize).on(eresize, onResize);

        onResize();
    },

    toggleFade = function () {

        // Resize the lightbox content.
        if (this.isShown) {
            resize();
        }

        $.each([$header, $footer, $close, $lightbox], function () {

            this.toggleClass("fade-in")
                .redraw();
        });

        $overlay.toggleClass("lightbox-loader");
    },

    toggleOverlay = function (event) {

        var fade = event === "show" ? "addClass" : "removeClass",
            self = this,
            getScrollbarWidth = function () {
                var $scroll = $("<div/>").css({ width: 99, height: 99, overflow: "scroll", position: "absolute", top: -9999 });
                $body.append($scroll);
                scrollbarWidth = $scroll[0].offsetWidth - $scroll[0].clientWidth;
                $scroll.remove();

                return scrollbarWidth;
            },
            complete = function () {

                if (event === "hide") {
                    $overlay.addClass("hidden");
                    $html.removeClass("lightbox-on")
                         .css("margin-right", "");

                    if ($html.hasClass("lightbox-lock")) {

                        $html.removeClass("lightbox-lock");
                        if (lastScroll !== $window.scrollTop()) {
                            $window.scrollTop(lastScroll);
                            lastScroll = 0;
                        }
                    }
                    return;
                }

                $overlay.off(eclick).on(eclick, function (e) {

                    if (self.options.modal) {
                        return;
                    }

                    var closeTarget = $close[0],
                        eventTarget = e.target;

                    if (eventTarget === closeTarget) {
                        e.preventDefault();
                        e.stopPropagation();
                        self.hide();
                    }

                    if (eventTarget === $overlay[0]) {
                        self.hide();
                    }
                });
            };

        // Add the overlay to the body if not done already.
        if (!$("div.lightbox-overlay").length) {

            $body.append($overlay);
        }

        if (lastScroll === 0) {
            lastScroll = $window.scrollTop();
        }

        // Remove the scrollbar.
        $html.addClass("lightbox-on")
             .css("margin-right", getScrollbarWidth());

        $overlay.removeClass("hidden")
            .redraw()[fade]("fade-in")
            .redraw();

        $overlay.onTransitionEnd(complete);
    },

    direction = function (course) {

        if (!this.isShown) {
            return;
        }

        if (this.options.group) {
            var self = this,
                index = this.$group.index(this.$element),
                length = this.$group.length,
                position = course === "next" ? index + 1 : index - 1,
                complete = function () {
                    if (self.$sibling) {

                        if (supportTransition) {
                            self.$sibling.trigger(eclick);
                        } else {
                            w.setTimeout(function () {
                                self.$sibling.trigger(eclick);
                            }, 300);
                        }
                    }
                };

            if (course === "next") {

                if (position >= length || position < 0) {

                    position = 0;
                }
            } else {

                if (position >= length) {

                    position = 0;
                }

                if (position < 0) {
                    position = length - 1;
                }
            }

            this.$sibling = $(this.$group[position]);

            destroy.call(this, complete);

            this.isShown = false;
        }
    },

    manageKeyboard = function (event) {
        if (this.options.keyboard) {

            if (event === "hide") {
                $body.off(ekeydown);
                return;
            }

            if (this.options.modal) {
                return;
            }

            $body.off(ekeydown).on(ekeydown, $.proxy(function (e) {

                // Bind the escape key.
                if (e.which === keys.ESCAPE) {
                    this.hide();
                }

                // Bind the next/previous keys.
                if (this.options.group) {
                    // Bind the left arrow key.
                    if (e.which === keys.LEFT) {
                        this.previous();
                    }

                    // Bind the right arrow key.
                    if (e.which === keys.RIGHT) {
                        this.next();
                    }
                }
            }, this));
        }
    },

    manageTouch = function (off) {

        if (off) {
           // $lightbox.removeSwipe("r.lightbox");
            return;
        }

        //$lightbox.swipe({ namespace: "r.lightbox" }).on("swipeend.r.lightbox", $.proxy(function (event) {

        //    var eventDirection = event.direction,
        //        method = (eventDirection === "up" || eventDirection === "right") ? "next" : "previous";

        //    this[method]();

        //}, this));
    },

    manageFocus = function (off) {

        if (off) {
            $(document).off(efocusin);
            return;
        }

        $(document).off(efocusin).on(efocusin, function (event) {
            if (!$.contains($overlay[0], event.target)) {
                var newTarget = $lightbox.find("input, select, a, iframe, img, button").first();
                newTarget.length ? newTarget.focus() : $close.focus();
                return false;
            }
            return true;
        });

    };

    // Lightbox class definition
    var LightBox = function (element, options) {

        this.$element = $(element);
        this.defaults = {
            modal: false,
            external: false,
            group: null,
            iframe: false,
            iframeScroll: false,
            keyboard: true,
            touch: true,
            next: ">",
            nextHint: "Next (Right Arrow)",
            previous: "<",
            previousHint: "Previous (Left Arrow)",
            closeHint: "Close (Esc)",
            mobileTarget: null,
            mobileViewportWidth: 480,
            fitViewport: true
        };
        this.options = $.extend({}, this.defaults, options);
        this.title = null;
        this.description = null;
        this.isShown = null;
        this.$group = null;
        this.isLocalHidden = false;

        // Make a list of grouped lightbox targets.
        if (this.options.group) {
            this.$group = $("[data-lightbox-group=" + this.options.group + "]");
        }

        this.toggle();
    };

    LightBox.prototype.show = function () {

        if (this.isShown) {
            return;
        }

        // If the trigger has a mobile target and the viewport is smaller than the mobile limit
        // then redirect to that page instead.
        if (this.options.mobileTarget && this.options.mobileViewportWidth >= parseInt($window.width(), 10)) {
            w.location.href = this.options.mobileTarget;
            return;
        }

        var self = this,
            showEvent = $.Event(eshow),
            shownEvent = $.Event(eshown),
            complete = function () {

                $lightbox.focus();
                manageFocus();

                // Bind the keyboard actions.
                if (self.options.keyboard) {
                    manageKeyboard.call(self, "show");
                }

                if (self.options.group) {
                    if (self.options.touch) {
                        manageTouch.call(self);
                    } else {
                        manageTouch.call(self, "off");
                    }
                }

                self.$element.trigger(shownEvent);
            };

        this.$element.trigger(showEvent);

        if (showEvent.isDefaultPrevented()) {
            return;
        }

        this.isShown = true;
        $lightbox.data("currentLightbox", this.$element);

        toggleOverlay.call(this, "show");
        create.call(this);

        // Call the callback.
        $lightbox.onTransitionEnd(complete);
    };

    LightBox.prototype.hide = function () {

        if (!this.isShown) {
            return;
        }

        var self = this,
            hideEvent = $.Event(ehide),
            hiddenEvent = $.Event(ehidden),
            complete = function () {
                self.$element.trigger(hiddenEvent);
            };

        this.$element.trigger(hideEvent);

        if (hideEvent.isDefaultPrevented()) {
            return;
        }

        this.isShown = false;

        toggleOverlay.call(this, "hide");
        destroy.call(this);

        $lightbox.onTransitionEnd(complete);
    };

    LightBox.prototype.next = function () {
        direction.call(this, "next");
    };

    LightBox.prototype.previous = function () {
        direction.call(this, "previous");
    };

    LightBox.prototype.toggle = function () {

        // Check to see if there is a current instance running. Useful for 
        // nested triggers.
        var $currentLightbox = $lightbox.data("currentLightbox");

        if ($currentLightbox && $currentLightbox[0] !== this.element) {
            var data = $currentLightbox.data("r.lightbox"),
                self = this,
                complete = function () {
                    data.isShown = false;
                    if (supportTransition) {
                        return self[!self.isShown ? "show" : "hide"]();
                    } else {
                        return w.setTimeout(function () {
                            return self[!self.isShown ? "show" : "hide"]();
                        }, 300);
                    }
                };

            if (data) {
                destroy.call(data, complete);
                return true;
            }
        }

        return this[!this.isShown ? "show" : "hide"]();
    };

    // Plug-in definition 
    $.fn.lightbox = function (options) {

        return this.each(function () {
            var $this = $(this),
                data = $this.data("r.lightbox"),
                opts = typeof options === "object" ? options : {};

            if (!opts.target) {
                opts.target = $this.attr("href");
            }

            if (!data) {
                // Check the data and reassign if not present.
                $this.data("r.lightbox", (data = new LightBox(this, opts)));
            }

            // Run the appropriate function if a string is passed.
            if (typeof options === "string") {
                data[options]();
            }

        });
    };

    // Set the public constructor.
    $.fn.lightbox.Constructor = LightBox;

    // No conflict.
    var old = $.fn.lightbox;
    $.fn.lightbox.noConflict = function () {
        $.fn.lightbox = old;
        return this;
    };

    // Data API
    $body.on(eclick, ":attrStart(data-lightbox)", function (event) {

        event.preventDefault();

        // Handle close events.
        var $this = $(this);

        // If it's a modal close instruction we want to ignore it.
        if ($this.is("[data-lightbox-modal-trigger]")) {
            return;
        }

        var data = $this.data("r.lightboxOptions"),
            options = data || $.buildDataOptions($this, {}, "lightbox", "r"),
            params = $this.data("r.lightbox") ? "toggle" : options;

        // Run the lightbox method.
        $this.lightbox(params);

    }).on(eclick, "[data-lightbox-modal-trigger]", function (event) {

        event.preventDefault();

        // Handle close events.
        var $this = $(this),
            data = $this.data("r.lightboxOptions"),
            options = data || $.buildDataOptions($this, {}, "lightbox", "r"),
            $closeTarget = $(options.modalTrigger || (options.modalTrigger = $this.attr("href")));

        $closeTarget.each(function () {

            var lightbox = $(this).data("r.lightbox");

            if (lightbox) {
                // Compare the elements.
                if (lightbox.$element[0] === this) {
                    lightbox.hide();
                    return true;
                }
            }

            return false;
        });
    });

    w.RESPONSIVE_LIGHTBOX = true;

}(jQuery, window, ".r.lightbox"));
/*
 * Responsive Tables
 */

/*global jQuery*/
/*jshint expr:true*/
(function ($, w, ns) {

    "use strict";

    if (w.RESPONSIVE_TABLE) {
        return;
    }

    // General variables and methods.
    var eready = "ready" + ns,
        eadd = "add" + ns,
        eadded = "added" + ns;

    // Table class definition.
    var Table = function (element) {

        this.$element = $(element);
        this.$thead = this.$element.find("thead");
        this.$tfoot = this.$element.find("tfoot");
        this.$tbody = this.$element.find("tbody");
        this.$headerColumns = this.$thead.find("th");
        this.$footerColumns = this.$tfoot.find("th");
        this.$bodyRows = this.$tbody.find("tr");
        this.isAdded = null;

        this.add();
    };

    Table.prototype.add = function () {

        if (this.isAdded) {
            return;
        }

        var self = this,
            addEvent = $.Event(eadd),
            complete = function () {
                self.$element.trigger($.Event(eadded));
            };

        this.$element.trigger(addEvent);

        if (addEvent.isDefaultPrevented()) {

            return;
        }

        this.isAdded = true;

        $.each(this.$bodyRows, function () {

            $(this).find("th, td").each(function (index) {
                var $this = $(this),
                    theadAttribute = $(self.$headerColumns[index]).text();

                $this.attr("data-thead", theadAttribute);

                if (self.$tfoot.length) {

                    var tfootAttribute = $(self.$footerColumns[index]).text();
                    $this.attr("data-tfoot", tfootAttribute);
                }
            });
        });

        this.$element.redraw().addClass("fade-in");

        // Do our callback
        this.$element.onTransitionEnd(complete);
    };

    // Plug-in definition 
    $.fn.table = function (options) {

        return this.each(function () {

            var $this = $(this),
                data = $this.data("r.table"),
                opts = typeof options === "object" ? options : null;

            if (!data) {
                // Check the data and reassign if not present.
                $this.data("r.table", (data = new Table(this, opts)));
            }

            // Run the appropriate function is a string is passed.
            if (typeof options === "string") {
                data[options]();
            }
        });
    };

    // Set the public constructor.
    $.fn.table.Constructor = Table;

    // No conflict.
    var old = $.fn.table;
    $.fn.table.noConflict = function () {
        $.fn.table = old;
        return this;
    };

    // Data API
    $(document).on(eready, function () {

        $("table[data-table-list]").each(function () {

            var $this = $(this),
                data = $this.data("r.tableOptions"),
                options = data || $.buildDataOptions($this, {}, "table", "r");

            // Run the table method.
            $this.table(options);
        });
    });

    w.RESPONSIVE_TABLE = true;

}(jQuery, window, ".r.table"));
/*
 * Responsive tabs
 */

/*global jQuery*/
/*jshint expr:true*/
(function ($, w, ns) {

    "use strict";

    if (w.RESPONSIVE_TABS) {
        return;
    }

    // General variables.
    var eready = "ready" + ns,
        eclick = "click",
        ekeydown = "keydown",
        eshow = "show" + ns,
        eshown = "shown" + ns;

    var keys = {
        LEFT: 37,
        RIGHT: 39
    };

    // Private methods.
    var tab = function (activePosition, postion, callback) {

        var showEvent = $.Event(eshow),
            $element = this.$element,
            $childTabs = $element.children("ul").children("li"),
            $childPanes = $element.children(":not(ul)"),
            $nextTab = $childTabs.eq(postion),
            $currentPane = $childPanes.eq(activePosition),
            $nextPane = $childPanes.eq(postion);

        $element.trigger(showEvent);

        if (this.tabbing || showEvent.isDefaultPrevented()) {
            return;
        }

        this.tabbing = true;

        $childTabs.removeClass("tab-active").children("a").attr({ "aria-selected": false, "tabIndex": -1 });
        $nextTab.addClass("tab-active").children("a").attr({ "aria-selected": true, "tabIndex": 0 }).focus();

        // Do some class shuffling to allow the transition.
        $currentPane.addClass("fade-out fade-in");
        $nextPane.attr({ "tabIndex": 0 }).addClass("tab-pane-active fade-out");
        $childPanes.filter(".fade-in").attr({ "tabIndex": -1 }).removeClass("tab-pane-active fade-in");

        // Force redraw.
        $nextPane.redraw().addClass("fade-in");

        // Do the callback
        callback.call(this, $nextPane);

    };

    // Tabs class definition
    var Tabs = function (element) {

        this.$element = $(element);
        this.tabbing = null;

        // Add accessibility features.
        var $tablist = this.$element.children("ul:first").attr("role", "tablist"),
            $triggers = $tablist.children().attr("role", "presentation"),
            $panes = this.$element.children(":not(ul)"),
            id = $.pseudoUnique();

        $triggers.each(function (index) {
            var $this = $(this),
                $tab = $this.children("a");

            $tab.attr({
                "role": "tab",
                "id": "tab-" + id + "-" + index,
                "aria-controls": "pane-" + id + "-" + index,
                "aria-selected": $this.hasClass("tab-active") ? true : false,
                "tabIndex": $this.hasClass("tab-active") ? 0 : -1
            });

            $panes.eq(index).attr({
                "role": "tabpanel",
                "id": "pane-" + id + "-" + index,
                "aria-labelledby": "tab-" + id + "-" + index,
                "tabIndex": $this.hasClass("tab-active") ? 0 : -1
            });
        });

        // Bind events.
        $(this.$element).on(eclick, "ul[role=tablist] > li > [role=tab]", $.proxy(this.click, this))
                        .on(ekeydown, "ul[role=tablist] > li > [role=tab]", $.proxy(this.keydown, this));
    };

    Tabs.prototype.show = function (position) {

        var $activeItem = this.$element.children("ul").children(".tab-active"),
            $children = $activeItem.parent().children(),
            activePosition = $children.index($activeItem),
            self = this;

        if (position > ($children.length - 1) || position < 0) {

            return false;
        }

        if (activePosition === position) {
            return false;
        }

        // Call the function with the callback
        return tab.call(this, activePosition, position, function ($item) {

            var complete = function () {
                self.tabbing = false;
                self.$element.trigger($.Event(eshown));
            };

            // Do our callback
            $item.onTransitionEnd(complete);
        });
    };

    Tabs.prototype.click = function (event) {

        event.preventDefault();
        event.stopPropagation();

        var $this = $(event.target),
            $li = $this.parent(),
            index = $li.index();

        this.show(index);
    };

    Tabs.prototype.keydown = function (event) {

        var which = event.which;
        // Ignore anything but left and right.
        if (which === keys.LEFT || which === keys.RIGHT) {

            event.stopPropagation();

            var $this = $(event.target),
                $li = $this.parent(),
                $all = $li.siblings().addBack(),
                length = $all.length,
                index = $li.index();

            // Ensure that the index stays within bounds.
            index = which === keys.LEFT ? index - 1 : index + 1;

            if (index === length) {
                index = 0;
            }

            if (index < 0) {
                index = length - 1;
            }

            this.show(index);
        }
    };

    // Plug-in definition 
    $.fn.tabs = function (options) {

        return this.each(function () {

            var $this = $(this),
                data = $this.data("r.tabs");

            if (!data) {
                // Check the data and reassign if not present.
                $this.data("r.tabs", (data = new Tabs(this)));
            }

            // Show the given number.
            if (typeof options === "number") {
                data.show(options);
            }
        });
    };

    // Set the public constructor.
    $.fn.tabs.Constructor = Tabs;

    // No conflict.
    var old = $.fn.tabs;
    $.fn.tabs.noConflict = function () {
        $.fn.tabs = old;
        return this;
    };

    // Data API
    $(document).on(eready, function () {
        $("[data-tabs]").tabs();
    });

    w.RESPONSIVE_TABS = true;

}(jQuery, window, ".r.tabs"));