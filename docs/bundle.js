
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value) {
        node.style.setProperty(key, value);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            remaining: 0,
            callbacks: []
        };
    }
    function check_outros() {
        if (!outros.remaining) {
            run_all(outros.callbacks);
        }
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.callbacks.push(() => {
                outroing.delete(block);
                if (callback) {
                    block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /**
     * Function to turn props of components into css variables or values.
     */
    function cssValue(...values) {
        return values.map(v => `var(--${v.replace(/[^a-zA-Z0-9-_]/g, '')}, ${v})`).join(' ');
    }

    function buildId(...values) {
        return values.map(v => typeof v === 'string' ? v.replace(/[^a-zA-Z0-9-_]/g, '_') : String(v)).join('-');
    }

    /* src/layout/Cover.svelte generated by Svelte v3.6.5 */

    const file = "src/layout/Cover.svelte";

    const get_below_slot_changes = () => ({});
    const get_below_slot_context = () => ({});

    const get_above_slot_changes = () => ({});
    const get_above_slot_context = () => ({});

    function create_fragment(ctx) {
    	var div3, div0, t0, div1, t1, div2, current;

    	const above_slot_1 = ctx.$$slots.above;
    	const above_slot = create_slot(above_slot_1, ctx, get_above_slot_context);

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	const below_slot_1 = ctx.$$slots.below;
    	const below_slot = create_slot(below_slot_1, ctx, get_below_slot_context);

    	return {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");

    			if (above_slot) above_slot.c();
    			t0 = space();
    			div1 = element("div");

    			if (default_slot) default_slot.c();
    			t1 = space();
    			div2 = element("div");

    			if (below_slot) below_slot.c();

    			attr(div0, "class", "above svelte-e60axm");
    			add_location(div0, file, 42, 4, 1069);

    			attr(div1, "class", "center svelte-e60axm");
    			add_location(div1, file, 45, 4, 1139);

    			attr(div2, "class", "below svelte-e60axm");
    			add_location(div2, file, 48, 4, 1197);
    			attr(div3, "class", "" + ctx.id + " svelte-e60axm");
    			add_location(div3, file, 41, 0, 1048);
    		},

    		l: function claim(nodes) {
    			if (above_slot) above_slot.l(div0_nodes);

    			if (default_slot) default_slot.l(div1_nodes);

    			if (below_slot) below_slot.l(div2_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div0);

    			if (above_slot) {
    				above_slot.m(div0, null);
    			}

    			append(div3, t0);
    			append(div3, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			append(div3, t1);
    			append(div3, div2);

    			if (below_slot) {
    				below_slot.m(div2, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (above_slot && above_slot.p && changed.$$scope) {
    				above_slot.p(get_slot_changes(above_slot_1, ctx, changed, get_above_slot_changes), get_slot_context(above_slot_1, ctx, get_above_slot_context));
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}

    			if (below_slot && below_slot.p && changed.$$scope) {
    				below_slot.p(get_slot_changes(below_slot_1, ctx, changed, get_below_slot_changes), get_slot_context(below_slot_1, ctx, get_below_slot_context));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(above_slot, local);
    			transition_in(default_slot, local);
    			transition_in(below_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(above_slot, local);
    			transition_out(default_slot, local);
    			transition_out(below_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div3);
    			}

    			if (above_slot) above_slot.d(detaching);

    			if (default_slot) default_slot.d(detaching);

    			if (below_slot) below_slot.d(detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	

        let { space = 's0', minHeight = '100vh', pad = true } = $$props;

        const id = buildId('cover', space, minHeight, pad);

    	onMount(() => {
            document.querySelectorAll(`.${id}`).forEach(e => e.style.minHeight = cssValue(minHeight));
            document.querySelectorAll(`.${id} > .above`).forEach(e => e.style.marginBottom = cssValue(space));
            document.querySelectorAll(`.${id} > .below`).forEach(e => e.style.marginTop = cssValue(space));

            if (pad) {
               document.querySelectorAll(`.${id}`).forEach(e => e.style.padding = cssValue(space)); 
            }
    	});

    	const writable_props = ['space', 'minHeight', 'pad'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Cover> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('space' in $$props) $$invalidate('space', space = $$props.space);
    		if ('minHeight' in $$props) $$invalidate('minHeight', minHeight = $$props.minHeight);
    		if ('pad' in $$props) $$invalidate('pad', pad = $$props.pad);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		space,
    		minHeight,
    		pad,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Cover extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["space", "minHeight", "pad"]);
    	}

    	get space() {
    		throw new Error("<Cover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set space(value) {
    		throw new Error("<Cover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get minHeight() {
    		throw new Error("<Cover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set minHeight(value) {
    		throw new Error("<Cover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get pad() {
    		throw new Error("<Cover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set pad(value) {
    		throw new Error("<Cover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/Grid.svelte generated by Svelte v3.6.5 */

    const file$1 = "src/layout/Grid.svelte";

    function create_fragment$1(ctx) {
    	var div, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", "" + ctx.id + " svelte-y482uv");
    			add_location(div, file$1, 23, 0, 534);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	

        let { min = '12rem', space = 's0' } = $$props;

        const id = buildId('grid', min, space);

    	onMount(() => {
            document.querySelectorAll(`.${id}`).forEach(e => {
                e.style.gridGap = `var(--${space}, ${space})`;
                e.style.gridTemplateColumns = `repeat(auto-fit, minmax(${cssValue(min)}, 1fr))`;
            });
    	});

    	const writable_props = ['min', 'space'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Grid> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('min' in $$props) $$invalidate('min', min = $$props.min);
    		if ('space' in $$props) $$invalidate('space', space = $$props.space);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { min, space, id, $$slots, $$scope };
    }

    class Grid extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["min", "space"]);
    	}

    	get min() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set min(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get space() {
    		throw new Error("<Grid>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set space(value) {
    		throw new Error("<Grid>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/Box.svelte generated by Svelte v3.6.5 */

    const file$2 = "src/layout/Box.svelte";

    function create_fragment$2(ctx) {
    	var div, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", "" + ctx.id + " svelte-1vdjooe");
    			add_location(div, file$2, 33, 0, 1258);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

        let { padding = 's1', color = 'color-primary', backgroundColor = 'color-secondary', borderWidth = 'border-medium', borderStyle = 'solid', borderColor = 'color-primary' } = $$props;

        const id = buildId('box', padding, color, backgroundColor, borderWidth, borderStyle, borderColor);

        onMount(() => {
            document.querySelectorAll(`.${id}`).forEach(e => e.style.padding = cssValue(padding));
            document.querySelectorAll(`.${id}`).forEach(e => e.style.color = cssValue(color));
            document.querySelectorAll(`.${id}`).forEach(e => e.style.backgroundColor = cssValue(backgroundColor));

            if (borderWidth) {
                document.querySelectorAll(`.${id}`).forEach(e => e.style.border = cssValue(borderWidth, borderStyle, borderColor));
            } else {
                document.querySelectorAll(`.${id}`).forEach(e => e.style.outline = '0.125rem solid transparent');
                document.querySelectorAll(`.${id}`).forEach(e => e.style.outlineOffset = '-0.125rem');
            }
    	});

    	const writable_props = ['padding', 'color', 'backgroundColor', 'borderWidth', 'borderStyle', 'borderColor'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Box> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('padding' in $$props) $$invalidate('padding', padding = $$props.padding);
    		if ('color' in $$props) $$invalidate('color', color = $$props.color);
    		if ('backgroundColor' in $$props) $$invalidate('backgroundColor', backgroundColor = $$props.backgroundColor);
    		if ('borderWidth' in $$props) $$invalidate('borderWidth', borderWidth = $$props.borderWidth);
    		if ('borderStyle' in $$props) $$invalidate('borderStyle', borderStyle = $$props.borderStyle);
    		if ('borderColor' in $$props) $$invalidate('borderColor', borderColor = $$props.borderColor);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		padding,
    		color,
    		backgroundColor,
    		borderWidth,
    		borderStyle,
    		borderColor,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Box extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["padding", "color", "backgroundColor", "borderWidth", "borderStyle", "borderColor"]);
    	}

    	get padding() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get color() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set color(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get backgroundColor() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set backgroundColor(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderWidth() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderWidth(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderStyle() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderStyle(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get borderColor() {
    		throw new Error("<Box>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set borderColor(value) {
    		throw new Error("<Box>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/Stack.svelte generated by Svelte v3.6.5 */

    const file$3 = "src/layout/Stack.svelte";

    function create_fragment$3(ctx) {
    	var div, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", "" + ctx.id + " svelte-wr42n8");
    			add_location(div, file$3, 37, 0, 987);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

    	let { space = 's0', recursive = false, splitAfter = '' } = $$props;

    	const id = buildId('stack', space, recursive, splitAfter);

    	onMount(() => {
    		if (recursive) {
    			document.querySelectorAll(`.${id} * + *`).forEach(e => e.style.marginTop = cssValue(space));
    		} else {
    			document.querySelectorAll(`.${id} > * + *`).forEach(e => e.style.marginTop = cssValue(space));
    		}

    		if (splitAfter) {
    			document.querySelectorAll(`.${id} > :nth-child(${splitAfter})`).forEach(e => e.style.marginBottom = 'auto');
    		}
    	});

    	const writable_props = ['space', 'recursive', 'splitAfter'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Stack> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('space' in $$props) $$invalidate('space', space = $$props.space);
    		if ('recursive' in $$props) $$invalidate('recursive', recursive = $$props.recursive);
    		if ('splitAfter' in $$props) $$invalidate('splitAfter', splitAfter = $$props.splitAfter);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		space,
    		recursive,
    		splitAfter,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Stack extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["space", "recursive", "splitAfter"]);
    	}

    	get space() {
    		throw new Error("<Stack>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set space(value) {
    		throw new Error("<Stack>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get recursive() {
    		throw new Error("<Stack>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set recursive(value) {
    		throw new Error("<Stack>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get splitAfter() {
    		throw new Error("<Stack>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set splitAfter(value) {
    		throw new Error("<Stack>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/Bracket.svelte generated by Svelte v3.6.5 */

    const file$4 = "src/layout/Bracket.svelte";

    const get_right_slot_changes = () => ({});
    const get_right_slot_context = () => ({});

    const get_left_slot_changes = () => ({});
    const get_left_slot_context = () => ({});

    function create_fragment$4(ctx) {
    	var div3, div0, t0, div1, t1, div2, current;

    	const left_slot_1 = ctx.$$slots.left;
    	const left_slot = create_slot(left_slot_1, ctx, get_left_slot_context);

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	const right_slot_1 = ctx.$$slots.right;
    	const right_slot = create_slot(right_slot_1, ctx, get_right_slot_context);

    	return {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");

    			if (left_slot) left_slot.c();
    			t0 = space();
    			div1 = element("div");

    			if (default_slot) default_slot.c();
    			t1 = space();
    			div2 = element("div");

    			if (right_slot) right_slot.c();

    			attr(div0, "class", "left svelte-1mln3ll");
    			add_location(div0, file$4, 51, 4, 1447);

    			attr(div1, "class", "center svelte-1mln3ll");
    			add_location(div1, file$4, 54, 4, 1515);

    			attr(div2, "class", "right svelte-1mln3ll");
    			add_location(div2, file$4, 57, 4, 1573);
    			attr(div3, "class", "" + ctx.id + " svelte-1mln3ll");
    			add_location(div3, file$4, 50, 0, 1426);
    		},

    		l: function claim(nodes) {
    			if (left_slot) left_slot.l(div0_nodes);

    			if (default_slot) default_slot.l(div1_nodes);

    			if (right_slot) right_slot.l(div2_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div0);

    			if (left_slot) {
    				left_slot.m(div0, null);
    			}

    			append(div3, t0);
    			append(div3, div1);

    			if (default_slot) {
    				default_slot.m(div1, null);
    			}

    			append(div3, t1);
    			append(div3, div2);

    			if (right_slot) {
    				right_slot.m(div2, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (left_slot && left_slot.p && changed.$$scope) {
    				left_slot.p(get_slot_changes(left_slot_1, ctx, changed, get_left_slot_changes), get_slot_context(left_slot_1, ctx, get_left_slot_context));
    			}

    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}

    			if (right_slot && right_slot.p && changed.$$scope) {
    				right_slot.p(get_slot_changes(right_slot_1, ctx, changed, get_right_slot_changes), get_slot_context(right_slot_1, ctx, get_right_slot_context));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(left_slot, local);
    			transition_in(default_slot, local);
    			transition_in(right_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(left_slot, local);
    			transition_out(default_slot, local);
    			transition_out(right_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div3);
    			}

    			if (left_slot) left_slot.d(detaching);

    			if (default_slot) default_slot.d(detaching);

    			if (right_slot) right_slot.d(detaching);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	

        let { maxWidth = 'measure', andText = true, space = 'zero', padding = 's0', intrinsic = false } = $$props;

        const id = buildId('bracket', maxWidth, andText, space, padding, intrinsic);

    	onMount(() => {
            document.querySelectorAll(`.${id}`).forEach(e => e.style.padding = cssValue(padding));
            document.querySelectorAll(`.${id} > .left`).forEach(e => e.style.marginRight = cssValue(space));
            document.querySelectorAll(`.${id} > .right`).forEach(e => e.style.marginLeft = cssValue(space));

            document.querySelectorAll(`.${id} > .center`).forEach(e => e.style.maxWidth = cssValue(maxWidth));

            if (intrinsic) {
                document.querySelectorAll(`.${id} > .center`).forEach(e => e.style.alignItems = 'center');
            }

            if (andText) {
                document.querySelectorAll(`.${id} > .center`).forEach(e => e.style.textAlign = 'center');
            }
    	});

    	const writable_props = ['maxWidth', 'andText', 'space', 'padding', 'intrinsic'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Bracket> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('maxWidth' in $$props) $$invalidate('maxWidth', maxWidth = $$props.maxWidth);
    		if ('andText' in $$props) $$invalidate('andText', andText = $$props.andText);
    		if ('space' in $$props) $$invalidate('space', space = $$props.space);
    		if ('padding' in $$props) $$invalidate('padding', padding = $$props.padding);
    		if ('intrinsic' in $$props) $$invalidate('intrinsic', intrinsic = $$props.intrinsic);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		maxWidth,
    		andText,
    		space,
    		padding,
    		intrinsic,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Bracket extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["maxWidth", "andText", "space", "padding", "intrinsic"]);
    	}

    	get maxWidth() {
    		throw new Error("<Bracket>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxWidth(value) {
    		throw new Error("<Bracket>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get andText() {
    		throw new Error("<Bracket>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set andText(value) {
    		throw new Error("<Bracket>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get space() {
    		throw new Error("<Bracket>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set space(value) {
    		throw new Error("<Bracket>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get padding() {
    		throw new Error("<Bracket>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Bracket>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get intrinsic() {
    		throw new Error("<Bracket>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set intrinsic(value) {
    		throw new Error("<Bracket>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/Cluster.svelte generated by Svelte v3.6.5 */

    const file$5 = "src/layout/Cluster.svelte";

    function create_fragment$5(ctx) {
    	var div, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", "" + ctx.id + " svelte-w9oxpl");
    			add_location(div, file$5, 31, 0, 830);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$5($$self, $$props, $$invalidate) {
    	

        let { justify = 'center', align = 'center', space = 's0' } = $$props;

        const id = buildId('cluster', justify, align, space);

        onMount(() => {
            document.querySelectorAll(`.${id} > *`).forEach(e => {
                e.style.justifyContent = cssValue(justify);
                e.style.alignItems = cssValue(align);
                e.style.margin = `calc(${cssValue(space)} / 2 * -1)`;
            });
            document.querySelectorAll(`.${id} > * > *`).forEach(e => e.style.margin = `calc(${cssValue(space)} / 2)`);
    	});

    	const writable_props = ['justify', 'align', 'space'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Cluster> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('justify' in $$props) $$invalidate('justify', justify = $$props.justify);
    		if ('align' in $$props) $$invalidate('align', align = $$props.align);
    		if ('space' in $$props) $$invalidate('space', space = $$props.space);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		justify,
    		align,
    		space,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Cluster extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, ["justify", "align", "space"]);
    	}

    	get justify() {
    		throw new Error("<Cluster>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set justify(value) {
    		throw new Error("<Cluster>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get align() {
    		throw new Error("<Cluster>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set align(value) {
    		throw new Error("<Cluster>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get space() {
    		throw new Error("<Cluster>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set space(value) {
    		throw new Error("<Cluster>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/Sidebar.svelte generated by Svelte v3.6.5 */

    const file$6 = "src/layout/Sidebar.svelte";

    const get_sidebar_slot_changes_1 = () => ({});
    const get_sidebar_slot_context_1 = () => ({});

    const get_not_sidebar_slot_changes_1 = () => ({});
    const get_not_sidebar_slot_context_1 = () => ({});

    const get_not_sidebar_slot_changes = () => ({});
    const get_not_sidebar_slot_context = () => ({});

    const get_sidebar_slot_changes = () => ({});
    const get_sidebar_slot_context = () => ({});

    // (59:8) {:else}
    function create_else_block(ctx) {
    	var div0, t, div1, current;

    	const not_sidebar_slot_1 = ctx.$$slots["not-sidebar"];
    	const not_sidebar_slot = create_slot(not_sidebar_slot_1, ctx, get_not_sidebar_slot_context_1);

    	const sidebar_slot_1 = ctx.$$slots.sidebar;
    	const sidebar_slot = create_slot(sidebar_slot_1, ctx, get_sidebar_slot_context_1);

    	return {
    		c: function create() {
    			div0 = element("div");

    			if (not_sidebar_slot) not_sidebar_slot.c();
    			t = space();
    			div1 = element("div");

    			if (sidebar_slot) sidebar_slot.c();

    			attr(div0, "class", "not-sidebar svelte-c4ub5i");
    			add_location(div0, file$6, 59, 12, 1693);

    			attr(div1, "class", "sidebar svelte-c4ub5i");
    			add_location(div1, file$6, 62, 12, 1799);
    		},

    		l: function claim(nodes) {
    			if (not_sidebar_slot) not_sidebar_slot.l(div0_nodes);

    			if (sidebar_slot) sidebar_slot.l(div1_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);

    			if (not_sidebar_slot) {
    				not_sidebar_slot.m(div0, null);
    			}

    			insert(target, t, anchor);
    			insert(target, div1, anchor);

    			if (sidebar_slot) {
    				sidebar_slot.m(div1, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (not_sidebar_slot && not_sidebar_slot.p && changed.$$scope) {
    				not_sidebar_slot.p(get_slot_changes(not_sidebar_slot_1, ctx, changed, get_not_sidebar_slot_changes_1), get_slot_context(not_sidebar_slot_1, ctx, get_not_sidebar_slot_context_1));
    			}

    			if (sidebar_slot && sidebar_slot.p && changed.$$scope) {
    				sidebar_slot.p(get_slot_changes(sidebar_slot_1, ctx, changed, get_sidebar_slot_changes_1), get_slot_context(sidebar_slot_1, ctx, get_sidebar_slot_context_1));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(not_sidebar_slot, local);
    			transition_in(sidebar_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(not_sidebar_slot, local);
    			transition_out(sidebar_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    			}

    			if (not_sidebar_slot) not_sidebar_slot.d(detaching);

    			if (detaching) {
    				detach(t);
    				detach(div1);
    			}

    			if (sidebar_slot) sidebar_slot.d(detaching);
    		}
    	};
    }

    // (52:8) {#if side === 'left'}
    function create_if_block(ctx) {
    	var div0, t, div1, current;

    	const sidebar_slot_1 = ctx.$$slots.sidebar;
    	const sidebar_slot = create_slot(sidebar_slot_1, ctx, get_sidebar_slot_context);

    	const not_sidebar_slot_1 = ctx.$$slots["not-sidebar"];
    	const not_sidebar_slot = create_slot(not_sidebar_slot_1, ctx, get_not_sidebar_slot_context);

    	return {
    		c: function create() {
    			div0 = element("div");

    			if (sidebar_slot) sidebar_slot.c();
    			t = space();
    			div1 = element("div");

    			if (not_sidebar_slot) not_sidebar_slot.c();

    			attr(div0, "class", "sidebar svelte-c4ub5i");
    			add_location(div0, file$6, 52, 12, 1473);

    			attr(div1, "class", "not-sidebar svelte-c4ub5i");
    			add_location(div1, file$6, 55, 12, 1571);
    		},

    		l: function claim(nodes) {
    			if (sidebar_slot) sidebar_slot.l(div0_nodes);

    			if (not_sidebar_slot) not_sidebar_slot.l(div1_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);

    			if (sidebar_slot) {
    				sidebar_slot.m(div0, null);
    			}

    			insert(target, t, anchor);
    			insert(target, div1, anchor);

    			if (not_sidebar_slot) {
    				not_sidebar_slot.m(div1, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (sidebar_slot && sidebar_slot.p && changed.$$scope) {
    				sidebar_slot.p(get_slot_changes(sidebar_slot_1, ctx, changed, get_sidebar_slot_changes), get_slot_context(sidebar_slot_1, ctx, get_sidebar_slot_context));
    			}

    			if (not_sidebar_slot && not_sidebar_slot.p && changed.$$scope) {
    				not_sidebar_slot.p(get_slot_changes(not_sidebar_slot_1, ctx, changed, get_not_sidebar_slot_changes), get_slot_context(not_sidebar_slot_1, ctx, get_not_sidebar_slot_context));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar_slot, local);
    			transition_in(not_sidebar_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(sidebar_slot, local);
    			transition_out(not_sidebar_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div0);
    			}

    			if (sidebar_slot) sidebar_slot.d(detaching);

    			if (detaching) {
    				detach(t);
    				detach(div1);
    			}

    			if (not_sidebar_slot) not_sidebar_slot.d(detaching);
    		}
    	};
    }

    function create_fragment$6(ctx) {
    	var div1, div0, current_block_type_index, if_block, current;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.side === 'left') return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			if_block.c();
    			attr(div0, "class", "svelte-c4ub5i");
    			add_location(div0, file$6, 50, 4, 1425);
    			attr(div1, "class", "" + ctx.id + " svelte-c4ub5i");
    			add_location(div1, file$6, 49, 0, 1404);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);
    			if_blocks[current_block_type_index].m(div0, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(div0, null);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			if_blocks[current_block_type_index].d();
    		}
    	};
    }

    function instance$6($$self, $$props, $$invalidate) {
    	

        let { side = 'left', sideWidth = '', contentMin = '50%', space = 's0' } = $$props;

        const id = buildId('with-sidebar', side, sideWidth, contentMin, space);

    	onMount(() => {
            if (sideWidth) {
                document.querySelector(`.${id} > * > .sidebar`).forEach(e => e.style.flexBasis = cssValue(sideWidth));
            }

            if (contentMin) {
                document.querySelectorAll(`.${id} > * > .not-sidebar`).forEach(e => e.style.minWidth = cssValue(contentMin));
            }

            if (space) {
                document.querySelectorAll(`.${id} > *`).forEach(e => e.style.margin = `calc(${cssValue(space)} / 2 * -1)`);
                document.querySelectorAll(`.${id} > * > *`).forEach(e => e.style.margin = `calc(${cssValue(space)} / 2)`);
                document.querySelectorAll(`.${id} > * > .not-sidebar`).forEach(e => e.style.minWidth = `calc(${cssValue(contentMin)} - ${cssValue(space)})`);
            }
    	});

    	const writable_props = ['side', 'sideWidth', 'contentMin', 'space'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('side' in $$props) $$invalidate('side', side = $$props.side);
    		if ('sideWidth' in $$props) $$invalidate('sideWidth', sideWidth = $$props.sideWidth);
    		if ('contentMin' in $$props) $$invalidate('contentMin', contentMin = $$props.contentMin);
    		if ('space' in $$props) $$invalidate('space', space = $$props.space);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		side,
    		sideWidth,
    		contentMin,
    		space,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, ["side", "sideWidth", "contentMin", "space"]);
    	}

    	get side() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set side(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get sideWidth() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set sideWidth(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get contentMin() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set contentMin(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get space() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set space(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/Switcher.svelte generated by Svelte v3.6.5 */

    const file$7 = "src/layout/Switcher.svelte";

    function create_fragment$7(ctx) {
    	var div1, div0, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");

    			if (default_slot) default_slot.c();

    			add_location(div0, file$7, 38, 4, 1186);
    			attr(div1, "class", ctx.id);
    			add_location(div1, file$7, 37, 0, 1165);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div0_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div1, anchor);
    			append(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div1);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$7($$self, $$props, $$invalidate) {
    	

        let { threshold = 'measure', space = 's0', limit = '5' } = $$props;

        const id = buildId('switcher', threshold, space, limit);

        onMount(() => {
            document.querySelectorAll(`.${id} > *`).forEach(e => e.style.margin = `calc(${cssValue(space)} / 2 * -1)`);
            document.querySelectorAll(`.${id} > * > *`).forEach(e => {
                e.style.flexBasis = `calc((${cssValue(threshold)} - 100% + ${cssValue(space)}) * 999)`;
                e.style.margin = `calc(${cssValue(space)} / 2)`;
            });

            if (limit) {
                document.querySelectorAll(`.${id} > * > :nth-last-child(n+${limit}), .${id} > * > :nth-last-child(n+${limit}) ~ *`)
                    .forEach(e => e.style.flexBasis = '100%');
            }
    	});

    	const writable_props = ['threshold', 'space', 'limit'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Switcher> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('threshold' in $$props) $$invalidate('threshold', threshold = $$props.threshold);
    		if ('space' in $$props) $$invalidate('space', space = $$props.space);
    		if ('limit' in $$props) $$invalidate('limit', limit = $$props.limit);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		threshold,
    		space,
    		limit,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Switcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, ["threshold", "space", "limit"]);
    	}

    	get threshold() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set threshold(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get space() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set space(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get limit() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set limit(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/Frame.svelte generated by Svelte v3.6.5 */

    const file$8 = "src/layout/Frame.svelte";

    function create_fragment$8(ctx) {
    	var div, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", "" + ctx.id + " svelte-1y2uvsw");
    			add_location(div, file$8, 38, 0, 824);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$8($$self, $$props, $$invalidate) {
    	

        let { n = '6', d = '9' } = $$props;

        const id = buildId('frame', n, d);

    	onMount(() => {
            document.querySelectorAll(`.${id}`).forEach(e => e.style.paddingBottom = `calc(${cssValue(n)} / ${cssValue(d)} * 100%)`);
    	});

    	const writable_props = ['n', 'd'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Frame> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('n' in $$props) $$invalidate('n', n = $$props.n);
    		if ('d' in $$props) $$invalidate('d', d = $$props.d);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { n, d, id, $$slots, $$scope };
    }

    class Frame extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, ["n", "d"]);
    	}

    	get n() {
    		throw new Error("<Frame>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set n(value) {
    		throw new Error("<Frame>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get d() {
    		throw new Error("<Frame>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set d(value) {
    		throw new Error("<Frame>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/layout/Reel.svelte generated by Svelte v3.6.5 */

    const file$9 = "src/layout/Reel.svelte";

    function create_fragment$9(ctx) {
    	var div, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", "" + ctx.id + " svelte-1ebaim2");
    			add_location(div, file$9, 33, 0, 858);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$9($$self, $$props, $$invalidate) {
    	

        let { itemWidth = 'auto', space = 's1', height = 'auto' } = $$props;

        const id = buildId('reel', itemWidth, space, height);

    	onMount(() => {
            document.querySelectorAll(`.${id}`).forEach(e => {
                e.style.height = cssValue(height);
            });
            document.querySelectorAll(`.${id} > * + *`).forEach(e => e.style.marginLeft = cssValue(space));
            document.querySelectorAll(`.${id} > *`).forEach(e => e.style.flex = `0 0 ${cssValue(itemWidth)}`);
    	});

    	const writable_props = ['itemWidth', 'space', 'height'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Reel> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('itemWidth' in $$props) $$invalidate('itemWidth', itemWidth = $$props.itemWidth);
    		if ('space' in $$props) $$invalidate('space', space = $$props.space);
    		if ('height' in $$props) $$invalidate('height', height = $$props.height);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return {
    		itemWidth,
    		space,
    		height,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Reel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, ["itemWidth", "space", "height"]);
    	}

    	get itemWidth() {
    		throw new Error("<Reel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set itemWidth(value) {
    		throw new Error("<Reel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get space() {
    		throw new Error("<Reel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set space(value) {
    		throw new Error("<Reel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get height() {
    		throw new Error("<Reel>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set height(value) {
    		throw new Error("<Reel>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Presentation.svelte generated by Svelte v3.6.5 */

    const file$a = "src/Presentation.svelte";

    const get_title_slot_changes = () => ({});
    const get_title_slot_context = () => ({});

    // (10:12) <div slot="above">
    function create_above_slot(ctx) {
    	var div, current;

    	const title_slot_1 = ctx.$$slots.title;
    	const title_slot = create_slot(title_slot_1, ctx, get_title_slot_context);

    	return {
    		c: function create() {
    			div = element("div");

    			if (title_slot) title_slot.c();

    			attr(div, "slot", "above");
    			add_location(div, file$a, 9, 12, 244);
    		},

    		l: function claim(nodes) {
    			if (title_slot) title_slot.l(div_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (title_slot) {
    				title_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (title_slot && title_slot.p && changed.$$scope) {
    				title_slot.p(get_slot_changes(title_slot_1, ctx, changed, get_title_slot_changes), get_slot_context(title_slot_1, ctx, get_title_slot_context));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(title_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(title_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (title_slot) title_slot.d(detaching);
    		}
    	};
    }

    // (9:8) <Cover minHeight="1rem">
    function create_default_slot_2(ctx) {
    	var t, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			t = space();

    			if (default_slot) default_slot.c();
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);

    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(get_slot_changes(default_slot_1, ctx, changed, null), get_slot_context(default_slot_1, ctx, null));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    // (8:4) <Bracket>
    function create_default_slot_1(ctx) {
    	var current;

    	var cover = new Cover({
    		props: {
    		minHeight: "1rem",
    		$$slots: {
    		default: [create_default_slot_2],
    		above: [create_above_slot]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			cover.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(cover, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var cover_changes = {};
    			if (changed.$$scope) cover_changes.$$scope = { changed, ctx };
    			cover.$set(cover_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(cover.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(cover.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(cover, detaching);
    		}
    	};
    }

    // (7:0) <Box backgroundColor="white">
    function create_default_slot(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			bracket.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(bracket, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var bracket_changes = {};
    			if (changed.$$scope) bracket_changes.$$scope = { changed, ctx };
    			bracket.$set(bracket_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(bracket.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(bracket.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(bracket, detaching);
    		}
    	};
    }

    function create_fragment$a(ctx) {
    	var current;

    	var box = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			box.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(box, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var box_changes = {};
    			if (changed.$$scope) box_changes.$$scope = { changed, ctx };
    			box.$set(box_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(box, detaching);
    		}
    	};
    }

    function instance$a($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { $$slots, $$scope };
    }

    class Presentation extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.6.5 */

    const file$b = "src/App.svelte";

    // (17:2) <Bracket>
    function create_default_slot_37(ctx) {
    	var a, h1;

    	return {
    		c: function create() {
    			a = element("a");
    			h1 = element("h1");
    			h1.textContent = "EveryLayout in Svelte";
    			add_location(h1, file$b, 17, 63, 624);
    			attr(a, "id", "top");
    			attr(a, "href", "https://every-layout.dev/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 17, 3, 564);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h1);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (16:1) <div slot="above">
    function create_above_slot_1(ctx) {
    	var div, current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: { default: [create_default_slot_37] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			bracket.$$.fragment.c();
    			attr(div, "slot", "above");
    			add_location(div, file$b, 15, 1, 530);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(bracket, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var bracket_changes = {};
    			if (changed.$$scope) bracket_changes.$$scope = { changed, ctx };
    			bracket.$set(bracket_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(bracket.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(bracket.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(bracket, );
    		}
    	};
    }

    // (24:3) <a slot="title" href="https://every-layout.dev/layouts/stack/" target="blank">
    function create_title_slot_9(ctx) {
    	var a, h5;

    	return {
    		c: function create() {
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Stack";
    			add_location(h5, file$b, 23, 81, 799);
    			attr(a, "slot", "title");
    			attr(a, "href", "https://every-layout.dev/layouts/stack/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 23, 3, 721);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (25:3) <Stack recursive="true">
    function create_default_slot_36(ctx) {
    	var ul, li0, hr0, t0, li1, hr1, t1, li2, hr2;

    	return {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			hr0 = element("hr");
    			t0 = space();
    			li1 = element("li");
    			hr1 = element("hr");
    			t1 = space();
    			li2 = element("li");
    			hr2 = element("hr");
    			add_location(hr0, file$b, 26, 9, 864);
    			add_location(li0, file$b, 26, 5, 860);
    			add_location(hr1, file$b, 27, 9, 883);
    			add_location(li1, file$b, 27, 5, 879);
    			add_location(hr2, file$b, 28, 9, 902);
    			add_location(li2, file$b, 28, 5, 898);
    			add_location(ul, file$b, 25, 4, 850);
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);
    			append(ul, li0);
    			append(li0, hr0);
    			append(ul, t0);
    			append(ul, li1);
    			append(li1, hr1);
    			append(ul, t1);
    			append(ul, li2);
    			append(li2, hr2);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(ul);
    			}
    		}
    	};
    }

    // (23:2) <Presentation>
    function create_default_slot_35(ctx) {
    	var t, current;

    	var stack = new Stack({
    		props: {
    		recursive: "true",
    		$$slots: { default: [create_default_slot_36] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			t = space();
    			stack.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(stack, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var stack_changes = {};
    			if (changed.$$scope) stack_changes.$$scope = { changed, ctx };
    			stack.$set(stack_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(stack.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(stack.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(stack, detaching);
    		}
    	};
    }

    // (35:3) <a slot="title" href="https://every-layout.dev/layouts/box/" target="blank">
    function create_title_slot_8(ctx) {
    	var a, h5;

    	return {
    		c: function create() {
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Box";
    			add_location(h5, file$b, 34, 79, 1049);
    			attr(a, "slot", "title");
    			attr(a, "href", "https://every-layout.dev/layouts/box/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 34, 3, 973);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (34:2) <Presentation>
    function create_default_slot_34(ctx) {
    	var t, current;

    	var box = new Box({ $$inline: true });

    	return {
    		c: function create() {
    			t = space();
    			box.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(box, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(box, detaching);
    		}
    	};
    }

    // (40:3) <a slot="title" href="https://every-layout.dev/layouts/center/" target="blank">
    function create_title_slot_7(ctx) {
    	var a, h5;

    	return {
    		c: function create() {
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Bracket";
    			add_location(h5, file$b, 39, 82, 1199);
    			attr(a, "slot", "title");
    			attr(a, "href", "https://every-layout.dev/layouts/center/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 39, 3, 1120);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (43:5) <Box padding="zero">
    function create_default_slot_33(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			set_style(div, "height", "calc(var(--s1) * 2)");
    			add_location(div, file$b, 43, 6, 1298);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (42:4) <div slot="left">
    function create_left_slot(ctx) {
    	var div, current;

    	var box = new Box({
    		props: {
    		padding: "zero",
    		$$slots: { default: [create_default_slot_33] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "left");
    			add_location(div, file$b, 41, 4, 1248);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(box, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var box_changes = {};
    			if (changed.$$scope) box_changes.$$scope = { changed, ctx };
    			box.$set(box_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(box, );
    		}
    	};
    }

    // (49:5) <Box padding="zero">
    function create_default_slot_32(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			set_style(div, "height", "calc(var(--s1) * 2)");
    			add_location(div, file$b, 49, 6, 1453);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (48:4) <div slot="right">
    function create_right_slot(ctx) {
    	var div, current;

    	var box = new Box({
    		props: {
    		padding: "zero",
    		$$slots: { default: [create_default_slot_32] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "right");
    			add_location(div, file$b, 47, 4, 1402);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(box, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var box_changes = {};
    			if (changed.$$scope) box_changes.$$scope = { changed, ctx };
    			box.$set(box_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(box, );
    		}
    	};
    }

    // (41:3) <Bracket space="s0">
    function create_default_slot_31(ctx) {
    	var t0, t1, current;

    	var box = new Box({ props: { padding: "s1" }, $$inline: true });

    	return {
    		c: function create() {
    			t0 = space();
    			box.$$.fragment.c();
    			t1 = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			mount_component(box, target, anchor);
    			insert(target, t1, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(box, detaching);

    			if (detaching) {
    				detach(t1);
    			}
    		}
    	};
    }

    // (39:2) <Presentation>
    function create_default_slot_30(ctx) {
    	var t, current;

    	var bracket = new Bracket({
    		props: {
    		space: "s0",
    		$$slots: {
    		default: [create_default_slot_31],
    		right: [create_right_slot],
    		left: [create_left_slot]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			t = space();
    			bracket.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(bracket, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var bracket_changes = {};
    			if (changed.$$scope) bracket_changes.$$scope = { changed, ctx };
    			bracket.$set(bracket_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(bracket.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(bracket.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(bracket, detaching);
    		}
    	};
    }

    // (57:3) <a slot="title" href="https://every-layout.dev/layouts/cluster/" target="blank">
    function create_title_slot_6(ctx) {
    	var a, h5;

    	return {
    		c: function create() {
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Cluster";
    			add_location(h5, file$b, 56, 83, 1657);
    			attr(a, "slot", "title");
    			attr(a, "href", "https://every-layout.dev/layouts/cluster/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 56, 3, 1577);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (58:3) <Cluster>
    function create_default_slot_29(ctx) {
    	var ul, li0, t1, li1, t3, li2, t5, li3, t7, li4;

    	return {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "Content";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "Content";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "Content";
    			t5 = space();
    			li3 = element("li");
    			li3.textContent = "Content";
    			t7 = space();
    			li4 = element("li");
    			li4.textContent = "Content";
    			add_location(li0, file$b, 59, 5, 1730);
    			add_location(li1, file$b, 60, 5, 1752);
    			add_location(li2, file$b, 61, 5, 1774);
    			add_location(li3, file$b, 62, 5, 1796);
    			add_location(li4, file$b, 63, 5, 1818);
    			set_style(ul, "list-style", "none");
    			add_location(ul, file$b, 58, 4, 1695);
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);
    			append(ul, li0);
    			append(ul, t1);
    			append(ul, li1);
    			append(ul, t3);
    			append(ul, li2);
    			append(ul, t5);
    			append(ul, li3);
    			append(ul, t7);
    			append(ul, li4);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(ul);
    			}
    		}
    	};
    }

    // (56:2) <Presentation>
    function create_default_slot_28(ctx) {
    	var t, current;

    	var cluster = new Cluster({
    		props: {
    		$$slots: { default: [create_default_slot_29] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			t = space();
    			cluster.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(cluster, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var cluster_changes = {};
    			if (changed.$$scope) cluster_changes.$$scope = { changed, ctx };
    			cluster.$set(cluster_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(cluster.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(cluster.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(cluster, detaching);
    		}
    	};
    }

    // (70:3) <a slot="title" href="https://every-layout.dev/layouts/sidebar/" target="blank">
    function create_title_slot_5(ctx) {
    	var a, h5;

    	return {
    		c: function create() {
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Sidebar";
    			add_location(h5, file$b, 69, 83, 1978);
    			attr(a, "slot", "title");
    			attr(a, "href", "https://every-layout.dev/layouts/sidebar/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 69, 3, 1898);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (73:5) <Box padding="s-2">
    function create_default_slot_27(ctx) {
    	var p0, t1, p1, t3, p2;

    	return {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "A";
    			t1 = space();
    			p1 = element("p");
    			p1.textContent = "B";
    			t3 = space();
    			p2 = element("p");
    			p2.textContent = "C";
    			add_location(p0, file$b, 73, 6, 2085);
    			add_location(p1, file$b, 74, 6, 2100);
    			add_location(p2, file$b, 75, 6, 2115);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p0, anchor);
    			insert(target, t1, anchor);
    			insert(target, p1, anchor);
    			insert(target, t3, anchor);
    			insert(target, p2, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p0);
    				detach(t1);
    				detach(p1);
    				detach(t3);
    				detach(p2);
    			}
    		}
    	};
    }

    // (72:4) <div slot="sidebar">
    function create_sidebar_slot(ctx) {
    	var div, current;

    	var box = new Box({
    		props: {
    		padding: "s-2",
    		$$slots: { default: [create_default_slot_27] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "sidebar");
    			add_location(div, file$b, 71, 4, 2033);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(box, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var box_changes = {};
    			if (changed.$$scope) box_changes.$$scope = { changed, ctx };
    			box.$set(box_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(box, );
    		}
    	};
    }

    // (80:5) <Box>
    function create_default_slot_26(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Main Content";
    			add_location(p, file$b, 80, 6, 2193);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (79:4) <div slot="not-sidebar">
    function create_not_sidebar_slot(ctx) {
    	var div, current;

    	var box = new Box({
    		props: {
    		$$slots: { default: [create_default_slot_26] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "not-sidebar");
    			add_location(div, file$b, 78, 4, 2151);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(box, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var box_changes = {};
    			if (changed.$$scope) box_changes.$$scope = { changed, ctx };
    			box.$set(box_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(box, );
    		}
    	};
    }

    // (71:3) <Sidebar contentMin="70%">
    function create_default_slot_25(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (69:2) <Presentation>
    function create_default_slot_24(ctx) {
    	var t, current;

    	var sidebar = new Sidebar({
    		props: {
    		contentMin: "70%",
    		$$slots: {
    		default: [create_default_slot_25],
    		"not-sidebar": [create_not_sidebar_slot],
    		sidebar: [create_sidebar_slot]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			t = space();
    			sidebar.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(sidebar, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var sidebar_changes = {};
    			if (changed.$$scope) sidebar_changes.$$scope = { changed, ctx };
    			sidebar.$set(sidebar_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(sidebar.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(sidebar.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(sidebar, detaching);
    		}
    	};
    }

    // (88:3) <a slot="title" href="https://every-layout.dev/layouts/switcher/" target="blank">
    function create_title_slot_4(ctx) {
    	var a, h5;

    	return {
    		c: function create() {
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Switcher";
    			add_location(h5, file$b, 87, 84, 2370);
    			attr(a, "slot", "title");
    			attr(a, "href", "https://every-layout.dev/layouts/switcher/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 87, 3, 2289);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (89:3) <Switcher threshold="13rem">
    function create_default_slot_23(ctx) {
    	var t0, t1, current;

    	var box0 = new Box({ props: { padding: "s0" }, $$inline: true });

    	var box1 = new Box({ props: { padding: "s0" }, $$inline: true });

    	var box2 = new Box({ props: { padding: "s0" }, $$inline: true });

    	return {
    		c: function create() {
    			box0.$$.fragment.c();
    			t0 = space();
    			box1.$$.fragment.c();
    			t1 = space();
    			box2.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(box0, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(box1, target, anchor);
    			insert(target, t1, anchor);
    			mount_component(box2, target, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box0.$$.fragment, local);

    			transition_in(box1.$$.fragment, local);

    			transition_in(box2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box0.$$.fragment, local);
    			transition_out(box1.$$.fragment, local);
    			transition_out(box2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(box0, detaching);

    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(box1, detaching);

    			if (detaching) {
    				detach(t1);
    			}

    			destroy_component(box2, detaching);
    		}
    	};
    }

    // (87:2) <Presentation>
    function create_default_slot_22(ctx) {
    	var t, current;

    	var switcher = new Switcher({
    		props: {
    		threshold: "13rem",
    		$$slots: { default: [create_default_slot_23] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			t = space();
    			switcher.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(switcher, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var switcher_changes = {};
    			if (changed.$$scope) switcher_changes.$$scope = { changed, ctx };
    			switcher.$set(switcher_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(switcher.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(switcher.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(switcher, detaching);
    		}
    	};
    }

    // (97:3) <a slot="title" href="https://every-layout.dev/layouts/cover/" target="blank">
    function create_title_slot_3(ctx) {
    	var a, h5;

    	return {
    		c: function create() {
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Cover";
    			add_location(h5, file$b, 96, 81, 2643);
    			attr(a, "slot", "title");
    			attr(a, "href", "https://every-layout.dev/layouts/cover/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 96, 3, 2565);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (99:4) <div slot="above">
    function create_above_slot$1(ctx) {
    	var div, hr;

    	return {
    		c: function create() {
    			div = element("div");
    			hr = element("hr");
    			add_location(hr, file$b, 99, 5, 2718);
    			attr(div, "slot", "above");
    			add_location(div, file$b, 98, 4, 2694);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, hr);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (103:4) <div slot="below">
    function create_below_slot_1(ctx) {
    	var div, hr;

    	return {
    		c: function create() {
    			div = element("div");
    			hr = element("hr");
    			add_location(hr, file$b, 103, 5, 2778);
    			attr(div, "slot", "below");
    			add_location(div, file$b, 102, 4, 2754);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, hr);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (98:3) <Cover minHeight="10vh">
    function create_default_slot_21(ctx) {
    	var t0, t1, current;

    	var box = new Box({ $$inline: true });

    	return {
    		c: function create() {
    			t0 = space();
    			box.$$.fragment.c();
    			t1 = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			mount_component(box, target, anchor);
    			insert(target, t1, anchor);
    			current = true;
    		},

    		p: noop,

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(box, detaching);

    			if (detaching) {
    				detach(t1);
    			}
    		}
    	};
    }

    // (96:2) <Presentation>
    function create_default_slot_20(ctx) {
    	var t, current;

    	var cover = new Cover({
    		props: {
    		minHeight: "10vh",
    		$$slots: {
    		default: [create_default_slot_21],
    		below: [create_below_slot_1],
    		above: [create_above_slot$1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			t = space();
    			cover.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(cover, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var cover_changes = {};
    			if (changed.$$scope) cover_changes.$$scope = { changed, ctx };
    			cover.$set(cover_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(cover.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(cover.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(cover, detaching);
    		}
    	};
    }

    // (110:3) <a slot="title" href="https://every-layout.dev/layouts/grid/" target="blank">
    function create_title_slot_2(ctx) {
    	var a, h5;

    	return {
    		c: function create() {
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Grid";
    			add_location(h5, file$b, 109, 80, 2922);
    			attr(a, "slot", "title");
    			attr(a, "href", "https://every-layout.dev/layouts/grid/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 109, 3, 2845);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (113:5) <Box padding="s-3">
    function create_default_slot_19(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("X");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (114:5) <Box padding="s-3">
    function create_default_slot_18(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("o");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (115:5) <Box padding="s-3">
    function create_default_slot_17(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("o");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (116:5) <Box padding="s-3">
    function create_default_slot_16(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("o");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (117:5) <Box padding="s-3">
    function create_default_slot_15(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("X");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (118:5) <Box padding="s-3">
    function create_default_slot_14(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("o");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (119:5) <Box padding="s-3">
    function create_default_slot_13(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("o");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (120:5) <Box padding="s-3">
    function create_default_slot_12(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("o");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (121:5) <Box padding="s-3">
    function create_default_slot_11(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("X");
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (112:4) <Grid min="s1" space="s0">
    function create_default_slot_10(ctx) {
    	var t0, t1, t2, t3, t4, t5, t6, t7, current;

    	var box0 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_19] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box1 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_18] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box2 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_17] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box3 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_16] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box4 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_15] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box5 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_14] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box6 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_13] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box7 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_12] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box8 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_11] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			box0.$$.fragment.c();
    			t0 = space();
    			box1.$$.fragment.c();
    			t1 = space();
    			box2.$$.fragment.c();
    			t2 = space();
    			box3.$$.fragment.c();
    			t3 = space();
    			box4.$$.fragment.c();
    			t4 = space();
    			box5.$$.fragment.c();
    			t5 = space();
    			box6.$$.fragment.c();
    			t6 = space();
    			box7.$$.fragment.c();
    			t7 = space();
    			box8.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(box0, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(box1, target, anchor);
    			insert(target, t1, anchor);
    			mount_component(box2, target, anchor);
    			insert(target, t2, anchor);
    			mount_component(box3, target, anchor);
    			insert(target, t3, anchor);
    			mount_component(box4, target, anchor);
    			insert(target, t4, anchor);
    			mount_component(box5, target, anchor);
    			insert(target, t5, anchor);
    			mount_component(box6, target, anchor);
    			insert(target, t6, anchor);
    			mount_component(box7, target, anchor);
    			insert(target, t7, anchor);
    			mount_component(box8, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var box0_changes = {};
    			if (changed.$$scope) box0_changes.$$scope = { changed, ctx };
    			box0.$set(box0_changes);

    			var box1_changes = {};
    			if (changed.$$scope) box1_changes.$$scope = { changed, ctx };
    			box1.$set(box1_changes);

    			var box2_changes = {};
    			if (changed.$$scope) box2_changes.$$scope = { changed, ctx };
    			box2.$set(box2_changes);

    			var box3_changes = {};
    			if (changed.$$scope) box3_changes.$$scope = { changed, ctx };
    			box3.$set(box3_changes);

    			var box4_changes = {};
    			if (changed.$$scope) box4_changes.$$scope = { changed, ctx };
    			box4.$set(box4_changes);

    			var box5_changes = {};
    			if (changed.$$scope) box5_changes.$$scope = { changed, ctx };
    			box5.$set(box5_changes);

    			var box6_changes = {};
    			if (changed.$$scope) box6_changes.$$scope = { changed, ctx };
    			box6.$set(box6_changes);

    			var box7_changes = {};
    			if (changed.$$scope) box7_changes.$$scope = { changed, ctx };
    			box7.$set(box7_changes);

    			var box8_changes = {};
    			if (changed.$$scope) box8_changes.$$scope = { changed, ctx };
    			box8.$set(box8_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box0.$$.fragment, local);

    			transition_in(box1.$$.fragment, local);

    			transition_in(box2.$$.fragment, local);

    			transition_in(box3.$$.fragment, local);

    			transition_in(box4.$$.fragment, local);

    			transition_in(box5.$$.fragment, local);

    			transition_in(box6.$$.fragment, local);

    			transition_in(box7.$$.fragment, local);

    			transition_in(box8.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box0.$$.fragment, local);
    			transition_out(box1.$$.fragment, local);
    			transition_out(box2.$$.fragment, local);
    			transition_out(box3.$$.fragment, local);
    			transition_out(box4.$$.fragment, local);
    			transition_out(box5.$$.fragment, local);
    			transition_out(box6.$$.fragment, local);
    			transition_out(box7.$$.fragment, local);
    			transition_out(box8.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(box0, detaching);

    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(box1, detaching);

    			if (detaching) {
    				detach(t1);
    			}

    			destroy_component(box2, detaching);

    			if (detaching) {
    				detach(t2);
    			}

    			destroy_component(box3, detaching);

    			if (detaching) {
    				detach(t3);
    			}

    			destroy_component(box4, detaching);

    			if (detaching) {
    				detach(t4);
    			}

    			destroy_component(box5, detaching);

    			if (detaching) {
    				detach(t5);
    			}

    			destroy_component(box6, detaching);

    			if (detaching) {
    				detach(t6);
    			}

    			destroy_component(box7, detaching);

    			if (detaching) {
    				detach(t7);
    			}

    			destroy_component(box8, detaching);
    		}
    	};
    }

    // (109:2) <Presentation>
    function create_default_slot_9(ctx) {
    	var t, div, current;

    	var grid = new Grid({
    		props: {
    		min: "s1",
    		space: "s0",
    		$$slots: { default: [create_default_slot_10] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			t = space();
    			div = element("div");
    			grid.$$.fragment.c();
    			set_style(div, "min-width", "8rem");
    			add_location(div, file$b, 110, 3, 2943);
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			insert(target, div, anchor);
    			mount_component(grid, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var grid_changes = {};
    			if (changed.$$scope) grid_changes.$$scope = { changed, ctx };
    			grid.$set(grid_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    				detach(div);
    			}

    			destroy_component(grid, );
    		}
    	};
    }

    // (127:3) <a slot="title" href="https://every-layout.dev/layouts/frame/" target="blank">
    function create_title_slot_1(ctx) {
    	var a, h5;

    	return {
    		c: function create() {
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Frame";
    			add_location(h5, file$b, 126, 81, 3432);
    			attr(a, "slot", "title");
    			attr(a, "href", "https://every-layout.dev/layouts/frame/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 126, 3, 3354);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (129:4) <Frame>
    function create_default_slot_8(ctx) {
    	var img;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", "favicon.png");
    			attr(img, "alt", "favicon");
    			add_location(img, file$b, 129, 5, 3492);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}
    		}
    	};
    }

    // (128:3) <Box padding="zero">
    function create_default_slot_7(ctx) {
    	var current;

    	var frame = new Frame({
    		props: {
    		$$slots: { default: [create_default_slot_8] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			frame.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(frame, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var frame_changes = {};
    			if (changed.$$scope) frame_changes.$$scope = { changed, ctx };
    			frame.$set(frame_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(frame.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(frame.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(frame, detaching);
    		}
    	};
    }

    // (126:2) <Presentation>
    function create_default_slot_6(ctx) {
    	var t, current;

    	var box = new Box({
    		props: {
    		padding: "zero",
    		$$slots: { default: [create_default_slot_7] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			t = space();
    			box.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(box, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var box_changes = {};
    			if (changed.$$scope) box_changes.$$scope = { changed, ctx };
    			box.$set(box_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(box, detaching);
    		}
    	};
    }

    // (136:3) <a slot="title" href="https://every-layout.dev/layouts/reel/" target="blank">
    function create_title_slot(ctx) {
    	var a, h5;

    	return {
    		c: function create() {
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Reel";
    			add_location(h5, file$b, 135, 80, 3669);
    			attr(a, "slot", "title");
    			attr(a, "href", "https://every-layout.dev/layouts/reel/");
    			attr(a, "target", "blank");
    			add_location(a, file$b, 135, 3, 3592);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, h5);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (139:5) <Reel itemWidth="s2">
    function create_default_slot_5(ctx) {
    	var img0, t0, img1, t1, img2, t2, img3, t3, img4, t4, img5, t5, img6, t6, img7, t7, img8, t8, img9;

    	return {
    		c: function create() {
    			img0 = element("img");
    			t0 = space();
    			img1 = element("img");
    			t1 = space();
    			img2 = element("img");
    			t2 = space();
    			img3 = element("img");
    			t3 = space();
    			img4 = element("img");
    			t4 = space();
    			img5 = element("img");
    			t5 = space();
    			img6 = element("img");
    			t6 = space();
    			img7 = element("img");
    			t7 = space();
    			img8 = element("img");
    			t8 = space();
    			img9 = element("img");
    			attr(img0, "src", "favicon.png");
    			attr(img0, "alt", "favicon");
    			add_location(img0, file$b, 139, 6, 3804);
    			attr(img1, "src", "favicon.png");
    			attr(img1, "alt", "favicon");
    			add_location(img1, file$b, 140, 6, 3848);
    			attr(img2, "src", "favicon.png");
    			attr(img2, "alt", "favicon");
    			add_location(img2, file$b, 141, 6, 3892);
    			attr(img3, "src", "favicon.png");
    			attr(img3, "alt", "favicon");
    			add_location(img3, file$b, 142, 6, 3936);
    			attr(img4, "src", "favicon.png");
    			attr(img4, "alt", "favicon");
    			add_location(img4, file$b, 143, 6, 3980);
    			attr(img5, "src", "favicon.png");
    			attr(img5, "alt", "favicon");
    			add_location(img5, file$b, 144, 6, 4024);
    			attr(img6, "src", "favicon.png");
    			attr(img6, "alt", "favicon");
    			add_location(img6, file$b, 145, 6, 4068);
    			attr(img7, "src", "favicon.png");
    			attr(img7, "alt", "favicon");
    			add_location(img7, file$b, 146, 6, 4112);
    			attr(img8, "src", "favicon.png");
    			attr(img8, "alt", "favicon");
    			add_location(img8, file$b, 147, 6, 4156);
    			attr(img9, "src", "favicon.png");
    			attr(img9, "alt", "favicon");
    			add_location(img9, file$b, 148, 6, 4200);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img0, anchor);
    			insert(target, t0, anchor);
    			insert(target, img1, anchor);
    			insert(target, t1, anchor);
    			insert(target, img2, anchor);
    			insert(target, t2, anchor);
    			insert(target, img3, anchor);
    			insert(target, t3, anchor);
    			insert(target, img4, anchor);
    			insert(target, t4, anchor);
    			insert(target, img5, anchor);
    			insert(target, t5, anchor);
    			insert(target, img6, anchor);
    			insert(target, t6, anchor);
    			insert(target, img7, anchor);
    			insert(target, t7, anchor);
    			insert(target, img8, anchor);
    			insert(target, t8, anchor);
    			insert(target, img9, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img0);
    				detach(t0);
    				detach(img1);
    				detach(t1);
    				detach(img2);
    				detach(t2);
    				detach(img3);
    				detach(t3);
    				detach(img4);
    				detach(t4);
    				detach(img5);
    				detach(t5);
    				detach(img6);
    				detach(t6);
    				detach(img7);
    				detach(t7);
    				detach(img8);
    				detach(t8);
    				detach(img9);
    			}
    		}
    	};
    }

    // (137:3) <Box padding="zero" backgroundColor="white">
    function create_default_slot_4(ctx) {
    	var div, current;

    	var reel = new Reel({
    		props: {
    		itemWidth: "s2",
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			reel.$$.fragment.c();
    			set_style(div, "max-width", "12rem");
    			add_location(div, file$b, 137, 4, 3739);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(reel, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var reel_changes = {};
    			if (changed.$$scope) reel_changes.$$scope = { changed, ctx };
    			reel.$set(reel_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(reel.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(reel.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(reel, );
    		}
    	};
    }

    // (135:2) <Presentation>
    function create_default_slot_3(ctx) {
    	var t, current;

    	var box = new Box({
    		props: {
    		padding: "zero",
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			t = space();
    			box.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    			mount_component(box, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var box_changes = {};
    			if (changed.$$scope) box_changes.$$scope = { changed, ctx };
    			box.$set(box_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(box.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(box.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}

    			destroy_component(box, detaching);
    		}
    	};
    }

    // (21:1) <Grid min="18rem">
    function create_default_slot_2$1(ctx) {
    	var t0, t1, t2, t3, t4, t5, t6, t7, t8, current;

    	var presentation0 = new Presentation({
    		props: {
    		$$slots: {
    		default: [create_default_slot_35],
    		title: [create_title_slot_9]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var presentation1 = new Presentation({
    		props: {
    		$$slots: {
    		default: [create_default_slot_34],
    		title: [create_title_slot_8]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var presentation2 = new Presentation({
    		props: {
    		$$slots: {
    		default: [create_default_slot_30],
    		title: [create_title_slot_7]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var presentation3 = new Presentation({
    		props: {
    		$$slots: {
    		default: [create_default_slot_28],
    		title: [create_title_slot_6]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var presentation4 = new Presentation({
    		props: {
    		$$slots: {
    		default: [create_default_slot_24],
    		title: [create_title_slot_5]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var presentation5 = new Presentation({
    		props: {
    		$$slots: {
    		default: [create_default_slot_22],
    		title: [create_title_slot_4]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var presentation6 = new Presentation({
    		props: {
    		$$slots: {
    		default: [create_default_slot_20],
    		title: [create_title_slot_3]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var presentation7 = new Presentation({
    		props: {
    		$$slots: {
    		default: [create_default_slot_9],
    		title: [create_title_slot_2]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var presentation8 = new Presentation({
    		props: {
    		$$slots: {
    		default: [create_default_slot_6],
    		title: [create_title_slot_1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var presentation9 = new Presentation({
    		props: {
    		$$slots: {
    		default: [create_default_slot_3],
    		title: [create_title_slot]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			presentation0.$$.fragment.c();
    			t0 = space();
    			presentation1.$$.fragment.c();
    			t1 = space();
    			presentation2.$$.fragment.c();
    			t2 = space();
    			presentation3.$$.fragment.c();
    			t3 = space();
    			presentation4.$$.fragment.c();
    			t4 = space();
    			presentation5.$$.fragment.c();
    			t5 = space();
    			presentation6.$$.fragment.c();
    			t6 = space();
    			presentation7.$$.fragment.c();
    			t7 = space();
    			presentation8.$$.fragment.c();
    			t8 = space();
    			presentation9.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(presentation0, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(presentation1, target, anchor);
    			insert(target, t1, anchor);
    			mount_component(presentation2, target, anchor);
    			insert(target, t2, anchor);
    			mount_component(presentation3, target, anchor);
    			insert(target, t3, anchor);
    			mount_component(presentation4, target, anchor);
    			insert(target, t4, anchor);
    			mount_component(presentation5, target, anchor);
    			insert(target, t5, anchor);
    			mount_component(presentation6, target, anchor);
    			insert(target, t6, anchor);
    			mount_component(presentation7, target, anchor);
    			insert(target, t7, anchor);
    			mount_component(presentation8, target, anchor);
    			insert(target, t8, anchor);
    			mount_component(presentation9, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var presentation0_changes = {};
    			if (changed.$$scope) presentation0_changes.$$scope = { changed, ctx };
    			presentation0.$set(presentation0_changes);

    			var presentation1_changes = {};
    			if (changed.$$scope) presentation1_changes.$$scope = { changed, ctx };
    			presentation1.$set(presentation1_changes);

    			var presentation2_changes = {};
    			if (changed.$$scope) presentation2_changes.$$scope = { changed, ctx };
    			presentation2.$set(presentation2_changes);

    			var presentation3_changes = {};
    			if (changed.$$scope) presentation3_changes.$$scope = { changed, ctx };
    			presentation3.$set(presentation3_changes);

    			var presentation4_changes = {};
    			if (changed.$$scope) presentation4_changes.$$scope = { changed, ctx };
    			presentation4.$set(presentation4_changes);

    			var presentation5_changes = {};
    			if (changed.$$scope) presentation5_changes.$$scope = { changed, ctx };
    			presentation5.$set(presentation5_changes);

    			var presentation6_changes = {};
    			if (changed.$$scope) presentation6_changes.$$scope = { changed, ctx };
    			presentation6.$set(presentation6_changes);

    			var presentation7_changes = {};
    			if (changed.$$scope) presentation7_changes.$$scope = { changed, ctx };
    			presentation7.$set(presentation7_changes);

    			var presentation8_changes = {};
    			if (changed.$$scope) presentation8_changes.$$scope = { changed, ctx };
    			presentation8.$set(presentation8_changes);

    			var presentation9_changes = {};
    			if (changed.$$scope) presentation9_changes.$$scope = { changed, ctx };
    			presentation9.$set(presentation9_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(presentation0.$$.fragment, local);

    			transition_in(presentation1.$$.fragment, local);

    			transition_in(presentation2.$$.fragment, local);

    			transition_in(presentation3.$$.fragment, local);

    			transition_in(presentation4.$$.fragment, local);

    			transition_in(presentation5.$$.fragment, local);

    			transition_in(presentation6.$$.fragment, local);

    			transition_in(presentation7.$$.fragment, local);

    			transition_in(presentation8.$$.fragment, local);

    			transition_in(presentation9.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(presentation0.$$.fragment, local);
    			transition_out(presentation1.$$.fragment, local);
    			transition_out(presentation2.$$.fragment, local);
    			transition_out(presentation3.$$.fragment, local);
    			transition_out(presentation4.$$.fragment, local);
    			transition_out(presentation5.$$.fragment, local);
    			transition_out(presentation6.$$.fragment, local);
    			transition_out(presentation7.$$.fragment, local);
    			transition_out(presentation8.$$.fragment, local);
    			transition_out(presentation9.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(presentation0, detaching);

    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(presentation1, detaching);

    			if (detaching) {
    				detach(t1);
    			}

    			destroy_component(presentation2, detaching);

    			if (detaching) {
    				detach(t2);
    			}

    			destroy_component(presentation3, detaching);

    			if (detaching) {
    				detach(t3);
    			}

    			destroy_component(presentation4, detaching);

    			if (detaching) {
    				detach(t4);
    			}

    			destroy_component(presentation5, detaching);

    			if (detaching) {
    				detach(t5);
    			}

    			destroy_component(presentation6, detaching);

    			if (detaching) {
    				detach(t6);
    			}

    			destroy_component(presentation7, detaching);

    			if (detaching) {
    				detach(t7);
    			}

    			destroy_component(presentation8, detaching);

    			if (detaching) {
    				detach(t8);
    			}

    			destroy_component(presentation9, detaching);
    		}
    	};
    }

    // (156:2) <Bracket>
    function create_default_slot_1$1(ctx) {
    	var a, p;

    	return {
    		c: function create() {
    			a = element("a");
    			p = element("p");
    			p.textContent = "Back to top";
    			add_location(p, file$b, 156, 18, 4349);
    			attr(a, "href", "#top");
    			add_location(a, file$b, 156, 3, 4334);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);
    			append(a, p);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}
    		}
    	};
    }

    // (155:1) <div slot="below">
    function create_below_slot(ctx) {
    	var div, current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			bracket.$$.fragment.c();
    			attr(div, "slot", "below");
    			add_location(div, file$b, 154, 1, 4300);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(bracket, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var bracket_changes = {};
    			if (changed.$$scope) bracket_changes.$$scope = { changed, ctx };
    			bracket.$set(bracket_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(bracket.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(bracket.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(bracket, );
    		}
    	};
    }

    // (15:0) <Cover>
    function create_default_slot$1(ctx) {
    	var t0, t1, current;

    	var grid = new Grid({
    		props: {
    		min: "18rem",
    		$$slots: { default: [create_default_slot_2$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			t0 = space();
    			grid.$$.fragment.c();
    			t1 = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			mount_component(grid, target, anchor);
    			insert(target, t1, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var grid_changes = {};
    			if (changed.$$scope) grid_changes.$$scope = { changed, ctx };
    			grid.$set(grid_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(grid.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(grid.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(grid, detaching);

    			if (detaching) {
    				detach(t1);
    			}
    		}
    	};
    }

    function create_fragment$b(ctx) {
    	var current;

    	var cover = new Cover({
    		props: {
    		$$slots: {
    		default: [create_default_slot$1],
    		below: [create_below_slot],
    		above: [create_above_slot_1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			cover.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			mount_component(cover, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var cover_changes = {};
    			if (changed.$$scope) cover_changes.$$scope = { changed, ctx };
    			cover.$set(cover_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(cover.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(cover.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(cover, detaching);
    		}
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$b, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
