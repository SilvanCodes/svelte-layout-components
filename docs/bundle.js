
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
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
    function empty() {
        return text('');
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

    /* src/layout/Cover.svelte generated by Svelte v3.6.5 */

    const file = "src/layout/Cover.svelte";

    const get_below_slot_changes = () => ({});
    const get_below_slot_context = () => ({});

    const get_center_slot_changes = () => ({});
    const get_center_slot_context = () => ({});

    const get_above_slot_changes = () => ({});
    const get_above_slot_context = () => ({});

    function create_fragment(ctx) {
    	var div3, div0, t0, div1, t1, div2, current;

    	const above_slot_1 = ctx.$$slots.above;
    	const above_slot = create_slot(above_slot_1, ctx, get_above_slot_context);

    	const center_slot_1 = ctx.$$slots.center;
    	const center_slot = create_slot(center_slot_1, ctx, get_center_slot_context);

    	const below_slot_1 = ctx.$$slots.below;
    	const below_slot = create_slot(below_slot_1, ctx, get_below_slot_context);

    	return {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");

    			if (above_slot) above_slot.c();
    			t0 = space();
    			div1 = element("div");

    			if (center_slot) center_slot.c();
    			t1 = space();
    			div2 = element("div");

    			if (below_slot) below_slot.c();

    			attr(div0, "class", "above svelte-e60axm");
    			add_location(div0, file, 42, 4, 1054);

    			attr(div1, "class", "center svelte-e60axm");
    			add_location(div1, file, 45, 4, 1124);

    			attr(div2, "class", "below svelte-e60axm");
    			add_location(div2, file, 48, 4, 1196);
    			attr(div3, "class", "" + ctx.id + " svelte-e60axm");
    			add_location(div3, file, 41, 0, 1033);
    		},

    		l: function claim(nodes) {
    			if (above_slot) above_slot.l(div0_nodes);

    			if (center_slot) center_slot.l(div1_nodes);

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

    			if (center_slot) {
    				center_slot.m(div1, null);
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

    			if (center_slot && center_slot.p && changed.$$scope) {
    				center_slot.p(get_slot_changes(center_slot_1, ctx, changed, get_center_slot_changes), get_slot_context(center_slot_1, ctx, get_center_slot_context));
    			}

    			if (below_slot && below_slot.p && changed.$$scope) {
    				below_slot.p(get_slot_changes(below_slot_1, ctx, changed, get_below_slot_changes), get_slot_context(below_slot_1, ctx, get_below_slot_context));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(above_slot, local);
    			transition_in(center_slot, local);
    			transition_in(below_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(above_slot, local);
    			transition_out(center_slot, local);
    			transition_out(below_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div3);
    			}

    			if (above_slot) above_slot.d(detaching);

    			if (center_slot) center_slot.d(detaching);

    			if (below_slot) below_slot.d(detaching);
    		}
    	};
    }

    function instance($$self, $$props, $$invalidate) {
    	

        let { space = 's0', minHeight = '100vh', pad = true } = $$props;

        const id = 'cover' + space + minHeight + pad;

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
    			add_location(div, file$1, 23, 0, 518);
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

        const id = 'grid' + min + space;

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
    			add_location(div, file$2, 33, 0, 1246);
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

        const id = 'box' + padding + color + backgroundColor + borderWidth + borderStyle + borderColor;

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
    			add_location(div, file$3, 37, 0, 972);
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

    	const id = 'stack' + space + recursive + splitAfter;

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

    const get_center_slot_changes$1 = () => ({});
    const get_center_slot_context$1 = () => ({});

    const get_left_slot_changes = () => ({});
    const get_left_slot_context = () => ({});

    function create_fragment$4(ctx) {
    	var div3, div0, t0, div1, t1, div2, current;

    	const left_slot_1 = ctx.$$slots.left;
    	const left_slot = create_slot(left_slot_1, ctx, get_left_slot_context);

    	const center_slot_1 = ctx.$$slots.center;
    	const center_slot = create_slot(center_slot_1, ctx, get_center_slot_context$1);

    	const right_slot_1 = ctx.$$slots.right;
    	const right_slot = create_slot(right_slot_1, ctx, get_right_slot_context);

    	return {
    		c: function create() {
    			div3 = element("div");
    			div0 = element("div");

    			if (left_slot) left_slot.c();
    			t0 = space();
    			div1 = element("div");

    			if (center_slot) center_slot.c();
    			t1 = space();
    			div2 = element("div");

    			if (right_slot) right_slot.c();

    			attr(div0, "class", "left svelte-1mln3ll");
    			add_location(div0, file$4, 51, 4, 1432);

    			attr(div1, "class", "center svelte-1mln3ll");
    			add_location(div1, file$4, 54, 4, 1500);

    			attr(div2, "class", "right svelte-1mln3ll");
    			add_location(div2, file$4, 57, 4, 1572);
    			attr(div3, "class", "" + ctx.id + " svelte-1mln3ll");
    			add_location(div3, file$4, 50, 0, 1411);
    		},

    		l: function claim(nodes) {
    			if (left_slot) left_slot.l(div0_nodes);

    			if (center_slot) center_slot.l(div1_nodes);

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

    			if (center_slot) {
    				center_slot.m(div1, null);
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

    			if (center_slot && center_slot.p && changed.$$scope) {
    				center_slot.p(get_slot_changes(center_slot_1, ctx, changed, get_center_slot_changes$1), get_slot_context(center_slot_1, ctx, get_center_slot_context$1));
    			}

    			if (right_slot && right_slot.p && changed.$$scope) {
    				right_slot.p(get_slot_changes(right_slot_1, ctx, changed, get_right_slot_changes), get_slot_context(right_slot_1, ctx, get_right_slot_context));
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(left_slot, local);
    			transition_in(center_slot, local);
    			transition_in(right_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(left_slot, local);
    			transition_out(center_slot, local);
    			transition_out(right_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div3);
    			}

    			if (left_slot) left_slot.d(detaching);

    			if (center_slot) center_slot.d(detaching);

    			if (right_slot) right_slot.d(detaching);
    		}
    	};
    }

    function instance$4($$self, $$props, $$invalidate) {
    	

        let { maxWidth = 'measure', andText = true, space = 's0', padding = 's0', intrinsic = false } = $$props;

        const id = 'bracket' + maxWidth + andText + space + padding + intrinsic;

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
    			add_location(div, file$5, 31, 0, 815);
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

        const id = 'cluster' + justify + align + space;

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
    			add_location(div0, file$6, 59, 12, 1696);

    			attr(div1, "class", "sidebar svelte-c4ub5i");
    			add_location(div1, file$6, 62, 12, 1802);
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
    			add_location(div0, file$6, 52, 12, 1476);

    			attr(div1, "class", "not-sidebar svelte-c4ub5i");
    			add_location(div1, file$6, 55, 12, 1574);
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
    			add_location(div0, file$6, 50, 4, 1428);
    			attr(div1, "class", "" + ctx.id + " svelte-c4ub5i");
    			add_location(div1, file$6, 49, 0, 1407);
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

        const id = 'with-sidebar' + side + sideWidth + contentMin.replace('%', '') + space;

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

    			add_location(div0, file$7, 38, 4, 1171);
    			attr(div1, "class", ctx.id);
    			add_location(div1, file$7, 37, 0, 1150);
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

        const id = 'switcher' + threshold + space + limit;

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
    			add_location(div, file$8, 38, 0, 808);
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

        const id = 'frame' + n + d;

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
    			add_location(div, file$9, 33, 0, 843);
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

        const id = 'reel' + itemWidth + space + height;

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

    /* src/SampleConfiguration_000.svelte generated by Svelte v3.6.5 */

    const file$a = "src/SampleConfiguration_000.svelte";

    // (17:3) <div slot="center">
    function create_center_slot_13(ctx) {
    	var div, a, h1;

    	return {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h1 = element("h1");
    			h1.textContent = "EveryLayout in Svelte";
    			add_location(h1, file$a, 17, 55, 588);
    			attr(a, "href", "https://every-layout.dev/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 17, 4, 537);
    			attr(div, "slot", "center");
    			add_location(div, file$a, 16, 3, 513);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, h1);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (16:2) <Bracket>
    function create_default_slot_45(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		d: noop
    	};
    }

    // (15:1) <div slot="above">
    function create_above_slot_1(ctx) {
    	var div, current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_45],
    		center: [create_center_slot_13]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			bracket.$$.fragment.c();
    			attr(div, "slot", "above");
    			add_location(div, file$a, 14, 1, 479);
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

    // (29:6) <Stack recursive="true">
    function create_default_slot_44(ctx) {
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
    			add_location(hr0, file$a, 30, 12, 924);
    			add_location(li0, file$a, 30, 8, 920);
    			add_location(hr1, file$a, 31, 12, 946);
    			add_location(li1, file$a, 31, 8, 942);
    			add_location(hr2, file$a, 32, 12, 968);
    			add_location(li2, file$a, 32, 8, 964);
    			add_location(ul, file$a, 29, 7, 907);
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

    // (26:5) <div slot="center">
    function create_center_slot_12(ctx) {
    	var div, a, h5, t1, br, t2, current;

    	var stack = new Stack({
    		props: {
    		recursive: "true",
    		$$slots: { default: [create_default_slot_44] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Stack";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			stack.$$.fragment.c();
    			add_location(h5, file$a, 26, 71, 839);
    			attr(a, "href", "https://every-layout.dev/layouts/stack/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 26, 6, 774);
    			add_location(br, file$a, 27, 6, 864);
    			attr(div, "slot", "center");
    			add_location(div, file$a, 25, 5, 748);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, h5);
    			append(div, t1);
    			append(div, br);
    			append(div, t2);
    			mount_component(stack, div, null);
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
    				detach(div);
    			}

    			destroy_component(stack, );
    		}
    	};
    }

    // (25:4) <Bracket>
    function create_default_slot_43(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (24:3) <Box backgroundColor="white">
    function create_default_slot_42(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_43],
    		center: [create_center_slot_12]
    	},
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

    // (41:5) <div slot="center">
    function create_center_slot_11(ctx) {
    	var div, a, h5, t1, br, t2, current;

    	var box = new Box({ $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Box";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			box.$$.fragment.c();
    			add_location(h5, file$a, 41, 69, 1184);
    			attr(a, "href", "https://every-layout.dev/layouts/box/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 41, 6, 1121);
    			add_location(br, file$a, 42, 6, 1207);
    			attr(div, "slot", "center");
    			add_location(div, file$a, 40, 5, 1095);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, h5);
    			append(div, t1);
    			append(div, br);
    			append(div, t2);
    			mount_component(box, div, null);
    			current = true;
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

    // (40:4) <Bracket>
    function create_default_slot_41(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (39:3) <Box backgroundColor="white">
    function create_default_slot_40(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_41],
    		center: [create_center_slot_11]
    	},
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

    // (55:8) <Box padding="zero">
    function create_default_slot_39(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			set_style(div, "height", "calc(var(--s0) * 2)");
    			add_location(div, file$a, 55, 9, 1522);
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

    // (54:7) <div slot="left">
    function create_left_slot(ctx) {
    	var div, current;

    	var box = new Box({
    		props: {
    		padding: "zero",
    		$$slots: { default: [create_default_slot_39] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "left");
    			add_location(div, file$a, 53, 7, 1466);
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

    // (59:7) <div slot="center">
    function create_center_slot_10(ctx) {
    	var div, current;

    	var box = new Box({ props: { padding: "s0" }, $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "center");
    			add_location(div, file$a, 58, 7, 1606);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(box, div, null);
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
    				detach(div);
    			}

    			destroy_component(box, );
    		}
    	};
    }

    // (63:8) <Box padding="zero">
    function create_default_slot_38(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			set_style(div, "height", "calc(var(--s0) * 2)");
    			add_location(div, file$a, 63, 9, 1737);
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

    // (62:7) <div slot="right">
    function create_right_slot(ctx) {
    	var div, current;

    	var box = new Box({
    		props: {
    		padding: "zero",
    		$$slots: { default: [create_default_slot_38] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "right");
    			add_location(div, file$a, 61, 7, 1680);
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

    // (53:6) <Bracket>
    function create_default_slot_37(ctx) {
    	var t0, t1;

    	return {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    			}
    		}
    	};
    }

    // (50:5) <div slot="center">
    function create_center_slot_9(ctx) {
    	var div, a, h5, t1, br, t2, current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_37],
    		right: [create_right_slot],
    		center: [create_center_slot_10],
    		left: [create_left_slot]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Bracket";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			bracket.$$.fragment.c();
    			add_location(h5, file$a, 50, 72, 1411);
    			attr(a, "href", "https://every-layout.dev/layouts/center/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 50, 6, 1345);
    			add_location(br, file$a, 51, 6, 1438);
    			attr(div, "slot", "center");
    			add_location(div, file$a, 49, 5, 1319);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, h5);
    			append(div, t1);
    			append(div, br);
    			append(div, t2);
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

    // (49:4) <Bracket>
    function create_default_slot_36(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (48:3) <Box backgroundColor="white">
    function create_default_slot_35(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_36],
    		center: [create_center_slot_9]
    	},
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

    // (76:6) <Cluster>
    function create_default_slot_34(ctx) {
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
    			add_location(li0, file$a, 77, 8, 2106);
    			add_location(li1, file$a, 78, 8, 2131);
    			add_location(li2, file$a, 79, 8, 2156);
    			add_location(li3, file$a, 80, 8, 2181);
    			add_location(li4, file$a, 81, 8, 2206);
    			set_style(ul, "list-style", "none");
    			add_location(ul, file$a, 76, 7, 2068);
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

    // (73:5) <div slot="center">
    function create_center_slot_8(ctx) {
    	var div, a, h5, t1, br, t2, current;

    	var cluster = new Cluster({
    		props: {
    		$$slots: { default: [create_default_slot_34] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Cluster";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			cluster.$$.fragment.c();
    			add_location(h5, file$a, 73, 73, 2013);
    			attr(a, "href", "https://every-layout.dev/layouts/cluster/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 73, 6, 1946);
    			add_location(br, file$a, 74, 6, 2040);
    			attr(div, "slot", "center");
    			add_location(div, file$a, 72, 5, 1920);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, h5);
    			append(div, t1);
    			append(div, br);
    			append(div, t2);
    			mount_component(cluster, div, null);
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
    				detach(div);
    			}

    			destroy_component(cluster, );
    		}
    	};
    }

    // (72:4) <Bracket>
    function create_default_slot_33(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (71:3) <Box backgroundColor="white">
    function create_default_slot_32(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_33],
    		center: [create_center_slot_8]
    	},
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

    // (95:8) <Box padding="s-2">
    function create_default_slot_31(ctx) {
    	var ul, li0, t1, li1, t3, li2, t5, li3;

    	return {
    		c: function create() {
    			ul = element("ul");
    			li0 = element("li");
    			li0.textContent = "A";
    			t1 = space();
    			li1 = element("li");
    			li1.textContent = "B";
    			t3 = space();
    			li2 = element("li");
    			li2.textContent = "C";
    			t5 = space();
    			li3 = element("li");
    			li3.textContent = "D";
    			add_location(li0, file$a, 96, 10, 2580);
    			add_location(li1, file$a, 97, 10, 2601);
    			add_location(li2, file$a, 98, 10, 2622);
    			add_location(li3, file$a, 99, 10, 2643);
    			add_location(ul, file$a, 95, 9, 2565);
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
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(ul);
    			}
    		}
    	};
    }

    // (94:7) <div slot="sidebar">
    function create_sidebar_slot(ctx) {
    	var div, current;

    	var box = new Box({
    		props: {
    		padding: "s-2",
    		$$slots: { default: [create_default_slot_31] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "sidebar");
    			add_location(div, file$a, 93, 7, 2507);
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

    // (105:8) <Box>
    function create_default_slot_30(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Main Content";
    			add_location(p, file$a, 105, 9, 2753);
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

    // (104:7) <div slot="not-sidebar">
    function create_not_sidebar_slot(ctx) {
    	var div, current;

    	var box = new Box({
    		props: {
    		$$slots: { default: [create_default_slot_30] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "not-sidebar");
    			add_location(div, file$a, 103, 7, 2705);
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

    // (93:6) <Sidebar contentMin="73%">
    function create_default_slot_29(ctx) {
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

    // (90:5) <div slot="center">
    function create_center_slot_7(ctx) {
    	var div, a, h5, t1, br, t2, current;

    	var sidebar = new Sidebar({
    		props: {
    		contentMin: "73%",
    		$$slots: {
    		default: [create_default_slot_29],
    		"not-sidebar": [create_not_sidebar_slot],
    		sidebar: [create_sidebar_slot]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Sidebar";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			sidebar.$$.fragment.c();
    			add_location(h5, file$a, 90, 73, 2435);
    			attr(a, "href", "https://every-layout.dev/layouts/sidebar/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 90, 6, 2368);
    			add_location(br, file$a, 91, 6, 2462);
    			attr(div, "slot", "center");
    			add_location(div, file$a, 89, 5, 2342);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, h5);
    			append(div, t1);
    			append(div, br);
    			append(div, t2);
    			mount_component(sidebar, div, null);
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
    				detach(div);
    			}

    			destroy_component(sidebar, );
    		}
    	};
    }

    // (89:4) <Bracket>
    function create_default_slot_28(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (88:3) <Box backgroundColor="white">
    function create_default_slot_27(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_28],
    		center: [create_center_slot_7]
    	},
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

    // (118:6) <Switcher threshold="13rem">
    function create_default_slot_26(ctx) {
    	var t0, t1, current;

    	var box0 = new Box({ $$inline: true });

    	var box1 = new Box({ $$inline: true });

    	var box2 = new Box({ $$inline: true });

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

    // (115:5) <div slot="center">
    function create_center_slot_6(ctx) {
    	var div, a, h5, t1, br, t2, current;

    	var switcher = new Switcher({
    		props: {
    		threshold: "13rem",
    		$$slots: { default: [create_default_slot_26] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Switcher";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			switcher.$$.fragment.c();
    			add_location(h5, file$a, 115, 74, 3002);
    			attr(a, "href", "https://every-layout.dev/layouts/switcher/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 115, 6, 2934);
    			add_location(br, file$a, 116, 6, 3030);
    			attr(div, "slot", "center");
    			add_location(div, file$a, 114, 5, 2908);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, h5);
    			append(div, t1);
    			append(div, br);
    			append(div, t2);
    			mount_component(switcher, div, null);
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
    				detach(div);
    			}

    			destroy_component(switcher, );
    		}
    	};
    }

    // (114:4) <Bracket>
    function create_default_slot_25(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (113:3) <Box backgroundColor="white">
    function create_default_slot_24(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_25],
    		center: [create_center_slot_6]
    	},
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

    // (132:7) <div slot="above">
    function create_above_slot(ctx) {
    	var div, hr;

    	return {
    		c: function create() {
    			div = element("div");
    			hr = element("hr");
    			add_location(hr, file$a, 132, 8, 3420);
    			attr(div, "slot", "above");
    			add_location(div, file$a, 131, 7, 3393);
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

    // (135:7) <div slot="center">
    function create_center_slot_5(ctx) {
    	var div, current;

    	var box = new Box({ $$inline: true });

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "center");
    			add_location(div, file$a, 134, 7, 3446);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(box, div, null);
    			current = true;
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

    // (138:7) <div slot="below">
    function create_below_slot_1(ctx) {
    	var div, hr;

    	return {
    		c: function create() {
    			div = element("div");
    			hr = element("hr");
    			add_location(hr, file$a, 138, 8, 3534);
    			attr(div, "slot", "below");
    			add_location(div, file$a, 137, 7, 3507);
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

    // (131:6) <Cover minHeight="10vh">
    function create_default_slot_23(ctx) {
    	var t0, t1;

    	return {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    			}
    		}
    	};
    }

    // (128:5) <div slot="center">
    function create_center_slot_4(ctx) {
    	var div, a, h5, t1, br, t2, current;

    	var cover = new Cover({
    		props: {
    		minHeight: "10vh",
    		$$slots: {
    		default: [create_default_slot_23],
    		below: [create_below_slot_1],
    		center: [create_center_slot_5],
    		above: [create_above_slot]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Cover";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			cover.$$.fragment.c();
    			add_location(h5, file$a, 128, 71, 3325);
    			attr(a, "href", "https://every-layout.dev/layouts/cover/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 128, 6, 3260);
    			add_location(br, file$a, 129, 6, 3350);
    			attr(div, "slot", "center");
    			add_location(div, file$a, 127, 5, 3234);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, h5);
    			append(div, t1);
    			append(div, br);
    			append(div, t2);
    			mount_component(cover, div, null);
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
    				detach(div);
    			}

    			destroy_component(cover, );
    		}
    	};
    }

    // (127:4) <Bracket>
    function create_default_slot_22(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (126:3) <Box backgroundColor="white">
    function create_default_slot_21(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_22],
    		center: [create_center_slot_4]
    	},
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

    // (151:7) <Box padding="s-3">
    function create_default_slot_20(ctx) {
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

    // (152:7) <Box padding="s-3">
    function create_default_slot_19(ctx) {
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

    // (153:7) <Box padding="s-3">
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

    // (154:7) <Box padding="s-3">
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

    // (155:7) <Box padding="s-3">
    function create_default_slot_16(ctx) {
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

    // (156:7) <Box padding="s-3">
    function create_default_slot_15(ctx) {
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

    // (157:7) <Box padding="s-3">
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

    // (158:7) <Box padding="s-3">
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

    // (159:7) <Box padding="s-3">
    function create_default_slot_12(ctx) {
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

    // (150:6) <Grid min="s1" space="s0">
    function create_default_slot_11(ctx) {
    	var t0, t1, t2, t3, t4, t5, t6, t7, current;

    	var box0 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_20] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box1 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_19] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box2 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_18] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box3 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_17] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box4 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_16] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box5 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_15] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box6 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_14] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box7 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_13] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box8 = new Box({
    		props: {
    		padding: "s-3",
    		$$slots: { default: [create_default_slot_12] },
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

    // (147:5) <div slot="center">
    function create_center_slot_3(ctx) {
    	var div, a, h5, t1, br, t2, current;

    	var grid = new Grid({
    		props: {
    		min: "s1",
    		space: "s0",
    		$$slots: { default: [create_default_slot_11] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "    Grid    ";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			grid.$$.fragment.c();
    			add_location(h5, file$a, 147, 70, 3747);
    			attr(a, "href", "https://every-layout.dev/layouts/grid/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 147, 6, 3683);
    			add_location(br, file$a, 148, 6, 3819);
    			attr(div, "slot", "center");
    			add_location(div, file$a, 146, 5, 3657);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, h5);
    			append(div, t1);
    			append(div, br);
    			append(div, t2);
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
    				detach(div);
    			}

    			destroy_component(grid, );
    		}
    	};
    }

    // (146:4) <Bracket>
    function create_default_slot_10(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (145:3) <Box backgroundColor="white">
    function create_default_slot_9(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_10],
    		center: [create_center_slot_3]
    	},
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

    // (170:7) <Frame>
    function create_default_slot_8(ctx) {
    	var img;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", "favicon.png");
    			attr(img, "alt", "favicon");
    			add_location(img, file$a, 170, 8, 4437);
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

    // (169:6) <Box padding="zero">
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

    // (166:5) <div slot="center">
    function create_center_slot_2(ctx) {
    	var div, a, h5, t1, br, t2, current;

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
    			div = element("div");
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Frame";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			box.$$.fragment.c();
    			add_location(h5, file$a, 166, 71, 4357);
    			attr(a, "href", "https://every-layout.dev/layouts/frame/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 166, 6, 4292);
    			add_location(br, file$a, 167, 6, 4382);
    			attr(div, "slot", "center");
    			add_location(div, file$a, 165, 5, 4266);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, a);
    			append(a, h5);
    			append(div, t1);
    			append(div, br);
    			append(div, t2);
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

    // (165:4) <Bracket>
    function create_default_slot_6(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (164:3) <Box backgroundColor="white">
    function create_default_slot_5(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_6],
    		center: [create_center_slot_2]
    	},
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

    // (183:7) <Reel itemWidth="s2">
    function create_default_slot_4(ctx) {
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
    			add_location(img0, file$a, 183, 8, 4800);
    			attr(img1, "src", "favicon.png");
    			attr(img1, "alt", "favicon");
    			add_location(img1, file$a, 184, 8, 4846);
    			attr(img2, "src", "favicon.png");
    			attr(img2, "alt", "favicon");
    			add_location(img2, file$a, 185, 8, 4892);
    			attr(img3, "src", "favicon.png");
    			attr(img3, "alt", "favicon");
    			add_location(img3, file$a, 186, 8, 4938);
    			attr(img4, "src", "favicon.png");
    			attr(img4, "alt", "favicon");
    			add_location(img4, file$a, 187, 8, 4984);
    			attr(img5, "src", "favicon.png");
    			attr(img5, "alt", "favicon");
    			add_location(img5, file$a, 188, 8, 5030);
    			attr(img6, "src", "favicon.png");
    			attr(img6, "alt", "favicon");
    			add_location(img6, file$a, 189, 8, 5076);
    			attr(img7, "src", "favicon.png");
    			attr(img7, "alt", "favicon");
    			add_location(img7, file$a, 190, 8, 5122);
    			attr(img8, "src", "favicon.png");
    			attr(img8, "alt", "favicon");
    			add_location(img8, file$a, 191, 8, 5168);
    			attr(img9, "src", "favicon.png");
    			attr(img9, "alt", "favicon");
    			add_location(img9, file$a, 192, 8, 5214);
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

    // (179:5) <div slot="center">
    function create_center_slot_1(ctx) {
    	var div0, a, h5, t1, br, t2, div1, current;

    	var reel = new Reel({
    		props: {
    		itemWidth: "s2",
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div0 = element("div");
    			a = element("a");
    			h5 = element("h5");
    			h5.textContent = "Reel";
    			t1 = space();
    			br = element("br");
    			t2 = space();
    			div1 = element("div");
    			reel.$$.fragment.c();
    			add_location(h5, file$a, 179, 70, 4696);
    			attr(a, "href", "https://every-layout.dev/layouts/reel/");
    			attr(a, "target", "blank");
    			add_location(a, file$a, 179, 6, 4632);
    			add_location(br, file$a, 180, 6, 4720);
    			set_style(div1, "max-width", "12rem");
    			add_location(div1, file$a, 181, 6, 4731);
    			attr(div0, "slot", "center");
    			add_location(div0, file$a, 178, 5, 4606);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div0, anchor);
    			append(div0, a);
    			append(a, h5);
    			append(div0, t1);
    			append(div0, br);
    			append(div0, t2);
    			append(div0, div1);
    			mount_component(reel, div1, null);
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
    				detach(div0);
    			}

    			destroy_component(reel, );
    		}
    	};
    }

    // (178:4) <Bracket space="zero">
    function create_default_slot_3(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (177:3) <Box backgroundColor="white">
    function create_default_slot_2(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		space: "zero",
    		$$slots: {
    		default: [create_default_slot_3],
    		center: [create_center_slot_1]
    	},
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

    // (23:2) <Grid min="18rem">
    function create_default_slot_1(ctx) {
    	var t0, t1, t2, t3, t4, t5, t6, t7, t8, current;

    	var box0 = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_42] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box1 = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_40] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box2 = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_35] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box3 = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_32] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box4 = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_27] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box5 = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_24] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box6 = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_21] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box7 = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_9] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box8 = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box9 = new Box({
    		props: {
    		backgroundColor: "white",
    		$$slots: { default: [create_default_slot_2] },
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
    			t8 = space();
    			box9.$$.fragment.c();
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
    			insert(target, t8, anchor);
    			mount_component(box9, target, anchor);
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

    			var box9_changes = {};
    			if (changed.$$scope) box9_changes.$$scope = { changed, ctx };
    			box9.$set(box9_changes);
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

    			transition_in(box9.$$.fragment, local);

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
    			transition_out(box9.$$.fragment, local);
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

    			if (detaching) {
    				detach(t8);
    			}

    			destroy_component(box9, detaching);
    		}
    	};
    }

    // (22:1) <div slot="center">
    function create_center_slot(ctx) {
    	var div, current;

    	var grid = new Grid({
    		props: {
    		min: "18rem",
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			grid.$$.fragment.c();
    			attr(div, "slot", "center");
    			add_location(div, file$a, 21, 1, 655);
    		},

    		m: function mount(target, anchor) {
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
    				detach(div);
    			}

    			destroy_component(grid, );
    		}
    	};
    }

    // (201:1) <div slot="below">
    function create_below_slot(ctx) {
    	var div;

    	return {
    		c: function create() {
    			div = element("div");
    			attr(div, "slot", "below");
    			add_location(div, file$a, 200, 1, 5336);
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

    // (14:0) <Cover>
    function create_default_slot(ctx) {
    	var t0, t1;

    	return {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    			}
    		}
    	};
    }

    function create_fragment$a(ctx) {
    	var current;

    	var cover = new Cover({
    		props: {
    		$$slots: {
    		default: [create_default_slot],
    		below: [create_below_slot],
    		center: [create_center_slot],
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

    class SampleConfiguration_000 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$a, safe_not_equal, []);
    	}
    }

    /* src/Alternate.svelte generated by Svelte v3.6.5 */

    const file$b = "src/Alternate.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.statement = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (18:16) {:else}
    function create_else_block$1(ctx) {
    	var current;

    	var cluster = new Cluster({
    		props: {
    		space: "s3",
    		justify: "flex-end",
    		$$slots: { default: [create_default_slot_3$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			cluster.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(cluster, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var cluster_changes = {};
    			if (changed.$$scope || changed.statements) cluster_changes.$$scope = { changed, ctx };
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
    			destroy_component(cluster, detaching);
    		}
    	};
    }

    // (12:16) {#if i%2 == 0}
    function create_if_block$1(ctx) {
    	var current;

    	var cluster = new Cluster({
    		props: {
    		space: "s3",
    		justify: "flex-start",
    		$$slots: { default: [create_default_slot_2$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			cluster.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(cluster, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var cluster_changes = {};
    			if (changed.$$scope || changed.statements) cluster_changes.$$scope = { changed, ctx };
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
    			destroy_component(cluster, detaching);
    		}
    	};
    }

    // (19:20) <Cluster space="s3" justify="flex-end">
    function create_default_slot_3$1(ctx) {
    	var div, p, raw_value = ctx.statement, t;

    	return {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = space();
    			add_location(p, file$b, 20, 28, 677);
    			add_location(div, file$b, 19, 24, 643);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p);
    			p.innerHTML = raw_value;
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.statements) && raw_value !== (raw_value = ctx.statement)) {
    				p.innerHTML = raw_value;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    				detach(t);
    			}
    		}
    	};
    }

    // (13:20) <Cluster space="s3" justify="flex-start">
    function create_default_slot_2$1(ctx) {
    	var div, p, raw_value = ctx.statement, t;

    	return {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			t = space();
    			add_location(p, file$b, 14, 28, 448);
    			add_location(div, file$b, 13, 24, 414);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p);
    			p.innerHTML = raw_value;
    			insert(target, t, anchor);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.statements) && raw_value !== (raw_value = ctx.statement)) {
    				p.innerHTML = raw_value;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    				detach(t);
    			}
    		}
    	};
    }

    // (11:12) {#each statements as statement, i}
    function create_each_block(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block$1,
    		create_else_block$1
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.i%2 == 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
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
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
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
    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}
    		}
    	};
    }

    // (10:8) <Stack>
    function create_default_slot_1$1(ctx) {
    	var each_1_anchor, current;

    	var each_value = ctx.statements;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, () => {
    		each_blocks[i] = null;
    	});

    	return {
    		c: function create() {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},

    		m: function mount(target, anchor) {
    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert(target, each_1_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (changed.statements) {
    				each_value = ctx.statements;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();
    				for (i = each_value.length; i < each_blocks.length; i += 1) out(i);
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			for (var i = 0; i < each_value.length; i += 1) transition_in(each_blocks[i]);

    			current = true;
    		},

    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);
    			for (let i = 0; i < each_blocks.length; i += 1) transition_out(each_blocks[i]);

    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);

    			if (detaching) {
    				detach(each_1_anchor);
    			}
    		}
    	};
    }

    // (9:0) <Box padding="s2">
    function create_default_slot$1(ctx) {
    	var current;

    	var stack = new Stack({
    		props: {
    		$$slots: { default: [create_default_slot_1$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			stack.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(stack, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var stack_changes = {};
    			if (changed.$$scope || changed.statements) stack_changes.$$scope = { changed, ctx };
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
    			destroy_component(stack, detaching);
    		}
    	};
    }

    function create_fragment$b(ctx) {
    	var current;

    	var box = new Box({
    		props: {
    		padding: "s2",
    		$$slots: { default: [create_default_slot$1] },
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
    			if (changed.$$scope || changed.statements) box_changes.$$scope = { changed, ctx };
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
    	
        
        let { statements = ["Hello", "World!"] } = $$props;

    	const writable_props = ['statements'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Alternate> was created with unknown prop '${key}'`);
    	});

    	$$self.$set = $$props => {
    		if ('statements' in $$props) $$invalidate('statements', statements = $$props.statements);
    	};

    	return { statements };
    }

    class Alternate extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$b, safe_not_equal, ["statements"]);
    	}

    	get statements() {
    		throw new Error("<Alternate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set statements(value) {
    		throw new Error("<Alternate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Button.svelte generated by Svelte v3.6.5 */

    const file$c = "src/Button.svelte";

    function create_fragment$c(ctx) {
    	var div, div_class_value, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", div_class_value = "" + (`button${ctx.id}`) + " svelte-vp67cq");
    			add_location(div, file$c, 40, 0, 1126);
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

    			if ((!current || changed.id) && div_class_value !== (div_class_value = "" + (`button${ctx.id}`) + " svelte-vp67cq")) {
    				attr(div, "class", div_class_value);
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

    function instance$b($$self, $$props, $$invalidate) {
    	let { priority = 'primary' } = $$props;

    	onMount(() => {
            switch (priority) {
                case 'primary':
                    document.querySelectorAll(`.button${id}`).forEach(e => {
                        e.style.background = `var(--color-primary)`;
                        e.style.color = `black`;
                    });
                    break;
                case 'secondary':
                    document.querySelectorAll(`.button${id}`).forEach(e => {
                        e.style.background = `var(--color-secondary)`;
                        e.style.color = `white`;
                    });
                    break;
                case 'ternary':
                    document.querySelectorAll(`.button${id}`).forEach(e => {
                        e.style.background = `var(--color-ternary)`;
                        e.style.color = `white`;
                    });
                    break;
            }
    	});

    	const writable_props = ['priority'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Button> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('priority' in $$props) $$invalidate('priority', priority = $$props.priority);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	let id;

    	$$self.$$.update = ($$dirty = { priority: 1 }) => {
    		if ($$dirty.priority) { $$invalidate('id', id = priority); }
    	};

    	return { priority, id, $$slots, $$scope };
    }

    class Button extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$c, safe_not_equal, ["priority"]);
    	}

    	get priority() {
    		throw new Error("<Button>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set priority(value) {
    		throw new Error("<Button>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const statements = [
        "This website is an experiment to learn webdesign.",
        `It is layouted according to the ideas of <a href="https://every-layout.dev/" target="blank">https://every-layout.dev/</a>.`,
        `The color schema comes from <a href="https://colorsupplyyy.com/app" target="blank">https://colorsupplyyy.com/app</a>.`,
        "Press spacebar or swipe to cycle some layouts.",
        "More content to come."
    ];

    /* src/SampleConfiguration_001.svelte generated by Svelte v3.6.5 */

    const file$d = "src/SampleConfiguration_001.svelte";

    // (16:3) <h1 slot="center">
    function create_center_slot_3$1(ctx) {
    	var h1;

    	return {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Welcome!";
    			attr(h1, "slot", "center");
    			add_location(h1, file$d, 15, 3, 396);
    		},

    		m: function mount(target, anchor) {
    			insert(target, h1, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(h1);
    			}
    		}
    	};
    }

    // (15:2) <Bracket>
    function create_default_slot_8$1(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		d: noop
    	};
    }

    // (14:1) <div slot="above">
    function create_above_slot$1(ctx) {
    	var div, current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_8$1],
    		center: [create_center_slot_3$1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			bracket.$$.fragment.c();
    			attr(div, "slot", "above");
    			add_location(div, file$d, 13, 1, 362);
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

    // (26:7) <Button>
    function create_default_slot_7$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Option 1");
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

    // (27:7) <Button>
    function create_default_slot_6$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Option 2");
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

    // (28:7) <Button>
    function create_default_slot_5$1(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Option 3");
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

    // (24:6) <Stack>
    function create_default_slot_4$1(ctx) {
    	var p, t1, t2, t3, current;

    	var button0 = new Button({
    		props: {
    		$$slots: { default: [create_default_slot_7$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button1 = new Button({
    		props: {
    		$$slots: { default: [create_default_slot_6$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var button2 = new Button({
    		props: {
    		$$slots: { default: [create_default_slot_5$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Sidebar Title";
    			t1 = space();
    			button0.$$.fragment.c();
    			t2 = space();
    			button1.$$.fragment.c();
    			t3 = space();
    			button2.$$.fragment.c();
    			add_location(p, file$d, 24, 7, 597);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			insert(target, t1, anchor);
    			mount_component(button0, target, anchor);
    			insert(target, t2, anchor);
    			mount_component(button1, target, anchor);
    			insert(target, t3, anchor);
    			mount_component(button2, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var button0_changes = {};
    			if (changed.$$scope) button0_changes.$$scope = { changed, ctx };
    			button0.$set(button0_changes);

    			var button1_changes = {};
    			if (changed.$$scope) button1_changes.$$scope = { changed, ctx };
    			button1.$set(button1_changes);

    			var button2_changes = {};
    			if (changed.$$scope) button2_changes.$$scope = { changed, ctx };
    			button2.$set(button2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(button0.$$.fragment, local);

    			transition_in(button1.$$.fragment, local);

    			transition_in(button2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(button0.$$.fragment, local);
    			transition_out(button1.$$.fragment, local);
    			transition_out(button2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    				detach(t1);
    			}

    			destroy_component(button0, detaching);

    			if (detaching) {
    				detach(t2);
    			}

    			destroy_component(button1, detaching);

    			if (detaching) {
    				detach(t3);
    			}

    			destroy_component(button2, detaching);
    		}
    	};
    }

    // (23:5) <div slot="center">
    function create_center_slot_2$1(ctx) {
    	var div, current;

    	var stack = new Stack({
    		props: {
    		$$slots: { default: [create_default_slot_4$1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			stack.$$.fragment.c();
    			attr(div, "slot", "center");
    			add_location(div, file$d, 22, 5, 556);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(stack, div, null);
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
    				detach(div);
    			}

    			destroy_component(stack, );
    		}
    	};
    }

    // (22:4) <Bracket padding="s-1">
    function create_default_slot_3$2(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    // (21:3) <div slot="sidebar">
    function create_sidebar_slot$1(ctx) {
    	var div, current;

    	var bracket = new Bracket({
    		props: {
    		padding: "s-1",
    		$$slots: {
    		default: [create_default_slot_3$2],
    		center: [create_center_slot_2$1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			bracket.$$.fragment.c();
    			attr(div, "slot", "sidebar");
    			add_location(div, file$d, 20, 3, 502);
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

    // (33:3) <div slot="not-sidebar">
    function create_not_sidebar_slot$1(ctx) {
    	var div, current;

    	var alternate = new Alternate({
    		props: { statements: statements },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			alternate.$$.fragment.c();
    			attr(div, "slot", "not-sidebar");
    			add_location(div, file$d, 32, 3, 772);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(alternate, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var alternate_changes = {};
    			if (changed.statements) alternate_changes.statements = statements;
    			alternate.$set(alternate_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(alternate.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(alternate.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(alternate, );
    		}
    	};
    }

    // (20:2) <Sidebar contentMin="70%">
    function create_default_slot_2$2(ctx) {
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

    // (19:1) <div slot="center">
    function create_center_slot_1$1(ctx) {
    	var div, current;

    	var sidebar = new Sidebar({
    		props: {
    		contentMin: "70%",
    		$$slots: {
    		default: [create_default_slot_2$2],
    		"not-sidebar": [create_not_sidebar_slot$1],
    		sidebar: [create_sidebar_slot$1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			sidebar.$$.fragment.c();
    			attr(div, "slot", "center");
    			add_location(div, file$d, 18, 1, 450);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(sidebar, div, null);
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
    				detach(div);
    			}

    			destroy_component(sidebar, );
    		}
    	};
    }

    // (40:3) <p slot="center">
    function create_center_slot$1(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Footer";
    			attr(p, "slot", "center");
    			add_location(p, file$d, 39, 3, 904);
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

    // (39:2) <Bracket>
    function create_default_slot_1$2(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		d: noop
    	};
    }

    // (38:1) <div slot="below">
    function create_below_slot$1(ctx) {
    	var div, current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_1$2],
    		center: [create_center_slot$1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			bracket.$$.fragment.c();
    			attr(div, "slot", "below");
    			add_location(div, file$d, 37, 1, 870);
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

    // (13:0) <Cover space="zero">
    function create_default_slot$2(ctx) {
    	var t0, t1;

    	return {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    			}
    		}
    	};
    }

    function create_fragment$d(ctx) {
    	var current;

    	var cover = new Cover({
    		props: {
    		space: "zero",
    		$$slots: {
    		default: [create_default_slot$2],
    		below: [create_below_slot$1],
    		center: [create_center_slot_1$1],
    		above: [create_above_slot$1]
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

    class SampleConfiguration_001 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$d, safe_not_equal, []);
    	}
    }

    /* src/SampleConfiguration_002.svelte generated by Svelte v3.6.5 */

    const file$e = "src/SampleConfiguration_002.svelte";

    // (9:1) <div slot="left">
    function create_left_slot$1(ctx) {
    	var div, p;

    	return {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "left";
    			add_location(p, file$e, 9, 2, 227);
    			attr(div, "slot", "left");
    			add_location(div, file$e, 8, 1, 207);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (17:5) <Box>
    function create_default_slot_5$2(ctx) {
    	var li;

    	return {
    		c: function create() {
    			li = element("li");
    			li.textContent = "1";
    			add_location(li, file$e, 17, 6, 359);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}
    		}
    	};
    }

    // (20:5) <Box>
    function create_default_slot_4$2(ctx) {
    	var li;

    	return {
    		c: function create() {
    			li = element("li");
    			li.textContent = "2";
    			add_location(li, file$e, 20, 6, 402);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}
    		}
    	};
    }

    // (23:5) <Box>
    function create_default_slot_3$3(ctx) {
    	var li;

    	return {
    		c: function create() {
    			li = element("li");
    			li.textContent = "3";
    			add_location(li, file$e, 23, 6, 442);
    		},

    		m: function mount(target, anchor) {
    			insert(target, li, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(li);
    			}
    		}
    	};
    }

    // (15:3) <Box>
    function create_default_slot_2$3(ctx) {
    	var ul, t0, t1, t2, li, current;

    	var box0 = new Box({
    		props: {
    		$$slots: { default: [create_default_slot_5$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box1 = new Box({
    		props: {
    		$$slots: { default: [create_default_slot_4$2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box2 = new Box({
    		props: {
    		$$slots: { default: [create_default_slot_3$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			ul = element("ul");
    			box0.$$.fragment.c();
    			t0 = space();
    			box1.$$.fragment.c();
    			t1 = space();
    			box2.$$.fragment.c();
    			t2 = space();
    			li = element("li");
    			li.textContent = "4";
    			add_location(li, file$e, 25, 5, 470);
    			add_location(ul, file$e, 15, 4, 337);
    		},

    		m: function mount(target, anchor) {
    			insert(target, ul, anchor);
    			mount_component(box0, ul, null);
    			append(ul, t0);
    			mount_component(box1, ul, null);
    			append(ul, t1);
    			mount_component(box2, ul, null);
    			append(ul, t2);
    			append(ul, li);
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
    		},

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
    			if (detaching) {
    				detach(ul);
    			}

    			destroy_component(box0, );

    			destroy_component(box1, );

    			destroy_component(box2, );
    		}
    	};
    }

    // (13:2) <Stack splitAfter="2" recursive="true">
    function create_default_slot_1$3(ctx) {
    	var p0, t1, t2, p1, t4, p2, current;

    	var box = new Box({
    		props: {
    		$$slots: { default: [create_default_slot_2$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			p0 = element("p");
    			p0.textContent = "one";
    			t1 = space();
    			box.$$.fragment.c();
    			t2 = space();
    			p1 = element("p");
    			p1.textContent = "two";
    			t4 = space();
    			p2 = element("p");
    			p2.textContent = "three";
    			add_location(p0, file$e, 13, 3, 313);
    			add_location(p1, file$e, 28, 3, 504);
    			add_location(p2, file$e, 29, 3, 518);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p0, anchor);
    			insert(target, t1, anchor);
    			mount_component(box, target, anchor);
    			insert(target, t2, anchor);
    			insert(target, p1, anchor);
    			insert(target, t4, anchor);
    			insert(target, p2, anchor);
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
    				detach(p0);
    				detach(t1);
    			}

    			destroy_component(box, detaching);

    			if (detaching) {
    				detach(t2);
    				detach(p1);
    				detach(t4);
    				detach(p2);
    			}
    		}
    	};
    }

    // (12:1) <div slot="center">
    function create_center_slot$2(ctx) {
    	var div, current;

    	var stack = new Stack({
    		props: {
    		splitAfter: "2",
    		recursive: "true",
    		$$slots: { default: [create_default_slot_1$3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			stack.$$.fragment.c();
    			attr(div, "slot", "center");
    			add_location(div, file$e, 11, 1, 248);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(stack, div, null);
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
    				detach(div);
    			}

    			destroy_component(stack, );
    		}
    	};
    }

    // (33:1) <div slot="right">
    function create_right_slot$1(ctx) {
    	var div, p;

    	return {
    		c: function create() {
    			div = element("div");
    			p = element("p");
    			p.textContent = "right";
    			add_location(p, file$e, 33, 2, 572);
    			attr(div, "slot", "right");
    			add_location(div, file$e, 32, 1, 551);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, p);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}
    		}
    	};
    }

    // (8:0) <Bracket>
    function create_default_slot$3(ctx) {
    	var t0, t1;

    	return {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t0, anchor);
    			insert(target, t1, anchor);
    		},

    		p: noop,
    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t0);
    				detach(t1);
    			}
    		}
    	};
    }

    function create_fragment$e(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot$3],
    		right: [create_right_slot$1],
    		center: [create_center_slot$2],
    		left: [create_left_slot$1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			bracket.$$.fragment.c();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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

    class SampleConfiguration_002 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$e, safe_not_equal, []);
    	}
    }

    /* src/SampleConfiguration_003.svelte generated by Svelte v3.6.5 */

    const file$f = "src/SampleConfiguration_003.svelte";

    // (10:3) <Box>
    function create_default_slot_3$4(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("Hello, this is a test. Here come a lot of text that I wrote myself. Interesting right?");
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

    // (11:3) <Box>
    function create_default_slot_2$4(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = text("B");
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

    // (9:2) <Grid>
    function create_default_slot_1$4(ctx) {
    	var t0, t1, t2, t3, t4, t5, t6, t7, t8, current;

    	var box0 = new Box({
    		props: {
    		$$slots: { default: [create_default_slot_3$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box1 = new Box({
    		props: {
    		$$slots: { default: [create_default_slot_2$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var box2 = new Box({ $$inline: true });

    	var box3 = new Box({ $$inline: true });

    	var box4 = new Box({ $$inline: true });

    	var box5 = new Box({ $$inline: true });

    	var box6 = new Box({ $$inline: true });

    	var box7 = new Box({ $$inline: true });

    	var box8 = new Box({ $$inline: true });

    	var box9 = new Box({ $$inline: true });

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
    			t8 = space();
    			box9.$$.fragment.c();
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
    			insert(target, t8, anchor);
    			mount_component(box9, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var box0_changes = {};
    			if (changed.$$scope) box0_changes.$$scope = { changed, ctx };
    			box0.$set(box0_changes);

    			var box1_changes = {};
    			if (changed.$$scope) box1_changes.$$scope = { changed, ctx };
    			box1.$set(box1_changes);
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

    			transition_in(box9.$$.fragment, local);

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
    			transition_out(box9.$$.fragment, local);
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

    			if (detaching) {
    				detach(t8);
    			}

    			destroy_component(box9, detaching);
    		}
    	};
    }

    // (8:1) <div slot="center">
    function create_center_slot$3(ctx) {
    	var div, current;

    	var grid = new Grid({
    		props: {
    		$$slots: { default: [create_default_slot_1$4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			grid.$$.fragment.c();
    			attr(div, "slot", "center");
    			add_location(div, file$f, 7, 1, 155);
    		},

    		m: function mount(target, anchor) {
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
    				detach(div);
    			}

    			destroy_component(grid, );
    		}
    	};
    }

    // (7:0) <Cover>
    function create_default_slot$4(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    function create_fragment$f(ctx) {
    	var current;

    	var cover = new Cover({
    		props: {
    		$$slots: {
    		default: [create_default_slot$4],
    		center: [create_center_slot$3]
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

    class SampleConfiguration_003 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$f, safe_not_equal, []);
    	}
    }

    /* src/SampleConfiguration_004.svelte generated by Svelte v3.6.5 */

    const file$g = "src/SampleConfiguration_004.svelte";

    // (10:2) <Reel itemWidth="s3">
    function create_default_slot_3$5(ctx) {
    	var img0, t0, img1, t1, img2, t2, img3, t3, img4, t4, img5, t5, img6, t6, img7, t7, img8, t8, img9, t9, img10, t10, img11, t11, img12, t12, img13, t13, img14, t14, img15, t15, img16, t16, img17, t17, img18, t18, img19, t19, img20, t20, img21, t21, img22, t22, img23, t23, img24;

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
    			t9 = space();
    			img10 = element("img");
    			t10 = space();
    			img11 = element("img");
    			t11 = space();
    			img12 = element("img");
    			t12 = space();
    			img13 = element("img");
    			t13 = space();
    			img14 = element("img");
    			t14 = space();
    			img15 = element("img");
    			t15 = space();
    			img16 = element("img");
    			t16 = space();
    			img17 = element("img");
    			t17 = space();
    			img18 = element("img");
    			t18 = space();
    			img19 = element("img");
    			t19 = space();
    			img20 = element("img");
    			t20 = space();
    			img21 = element("img");
    			t21 = space();
    			img22 = element("img");
    			t22 = space();
    			img23 = element("img");
    			t23 = space();
    			img24 = element("img");
    			attr(img0, "src", "favicon.png");
    			attr(img0, "alt", "favicon");
    			add_location(img0, file$g, 10, 3, 251);
    			attr(img1, "src", "favicon.png");
    			attr(img1, "alt", "favicon");
    			add_location(img1, file$g, 11, 3, 292);
    			attr(img2, "src", "favicon.png");
    			attr(img2, "alt", "favicon");
    			add_location(img2, file$g, 12, 3, 333);
    			attr(img3, "src", "favicon.png");
    			attr(img3, "alt", "favicon");
    			add_location(img3, file$g, 13, 3, 374);
    			attr(img4, "src", "favicon.png");
    			attr(img4, "alt", "favicon");
    			add_location(img4, file$g, 14, 3, 415);
    			attr(img5, "src", "favicon.png");
    			attr(img5, "alt", "favicon");
    			add_location(img5, file$g, 15, 3, 456);
    			attr(img6, "src", "favicon.png");
    			attr(img6, "alt", "favicon");
    			add_location(img6, file$g, 16, 3, 497);
    			attr(img7, "src", "favicon.png");
    			attr(img7, "alt", "favicon");
    			add_location(img7, file$g, 17, 3, 538);
    			attr(img8, "src", "favicon.png");
    			attr(img8, "alt", "favicon");
    			add_location(img8, file$g, 18, 3, 579);
    			attr(img9, "src", "favicon.png");
    			attr(img9, "alt", "favicon");
    			add_location(img9, file$g, 19, 3, 620);
    			attr(img10, "src", "favicon.png");
    			attr(img10, "alt", "favicon");
    			add_location(img10, file$g, 20, 3, 661);
    			attr(img11, "src", "favicon.png");
    			attr(img11, "alt", "favicon");
    			add_location(img11, file$g, 21, 3, 702);
    			attr(img12, "src", "favicon.png");
    			attr(img12, "alt", "favicon");
    			add_location(img12, file$g, 22, 3, 743);
    			attr(img13, "src", "favicon.png");
    			attr(img13, "alt", "favicon");
    			add_location(img13, file$g, 23, 3, 784);
    			attr(img14, "src", "favicon.png");
    			attr(img14, "alt", "favicon");
    			add_location(img14, file$g, 24, 3, 825);
    			attr(img15, "src", "favicon.png");
    			attr(img15, "alt", "favicon");
    			add_location(img15, file$g, 25, 3, 866);
    			attr(img16, "src", "favicon.png");
    			attr(img16, "alt", "favicon");
    			add_location(img16, file$g, 26, 3, 907);
    			attr(img17, "src", "favicon.png");
    			attr(img17, "alt", "favicon");
    			add_location(img17, file$g, 27, 3, 948);
    			attr(img18, "src", "favicon.png");
    			attr(img18, "alt", "favicon");
    			add_location(img18, file$g, 28, 3, 989);
    			attr(img19, "src", "favicon.png");
    			attr(img19, "alt", "favicon");
    			add_location(img19, file$g, 29, 3, 1030);
    			attr(img20, "src", "favicon.png");
    			attr(img20, "alt", "favicon");
    			add_location(img20, file$g, 30, 3, 1071);
    			attr(img21, "src", "favicon.png");
    			attr(img21, "alt", "favicon");
    			add_location(img21, file$g, 31, 3, 1112);
    			attr(img22, "src", "favicon.png");
    			attr(img22, "alt", "favicon");
    			add_location(img22, file$g, 32, 3, 1153);
    			attr(img23, "src", "favicon.png");
    			attr(img23, "alt", "favicon");
    			add_location(img23, file$g, 33, 3, 1194);
    			attr(img24, "src", "favicon.png");
    			attr(img24, "alt", "favicon");
    			add_location(img24, file$g, 34, 3, 1235);
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
    			insert(target, t9, anchor);
    			insert(target, img10, anchor);
    			insert(target, t10, anchor);
    			insert(target, img11, anchor);
    			insert(target, t11, anchor);
    			insert(target, img12, anchor);
    			insert(target, t12, anchor);
    			insert(target, img13, anchor);
    			insert(target, t13, anchor);
    			insert(target, img14, anchor);
    			insert(target, t14, anchor);
    			insert(target, img15, anchor);
    			insert(target, t15, anchor);
    			insert(target, img16, anchor);
    			insert(target, t16, anchor);
    			insert(target, img17, anchor);
    			insert(target, t17, anchor);
    			insert(target, img18, anchor);
    			insert(target, t18, anchor);
    			insert(target, img19, anchor);
    			insert(target, t19, anchor);
    			insert(target, img20, anchor);
    			insert(target, t20, anchor);
    			insert(target, img21, anchor);
    			insert(target, t21, anchor);
    			insert(target, img22, anchor);
    			insert(target, t22, anchor);
    			insert(target, img23, anchor);
    			insert(target, t23, anchor);
    			insert(target, img24, anchor);
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
    				detach(t9);
    				detach(img10);
    				detach(t10);
    				detach(img11);
    				detach(t11);
    				detach(img12);
    				detach(t12);
    				detach(img13);
    				detach(t13);
    				detach(img14);
    				detach(t14);
    				detach(img15);
    				detach(t15);
    				detach(img16);
    				detach(t16);
    				detach(img17);
    				detach(t17);
    				detach(img18);
    				detach(t18);
    				detach(img19);
    				detach(t19);
    				detach(img20);
    				detach(t20);
    				detach(img21);
    				detach(t21);
    				detach(img22);
    				detach(t22);
    				detach(img23);
    				detach(t23);
    				detach(img24);
    			}
    		}
    	};
    }

    // (9:1) <div slot="above">
    function create_above_slot$2(ctx) {
    	var div, current;

    	var reel = new Reel({
    		props: {
    		itemWidth: "s3",
    		$$slots: { default: [create_default_slot_3$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			reel.$$.fragment.c();
    			attr(div, "slot", "above");
    			add_location(div, file$g, 8, 1, 205);
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

    // (40:3) <Switcher limit="10">
    function create_default_slot_2$5(ctx) {
    	var t0, t1, current;

    	var box0 = new Box({ $$inline: true });

    	var box1 = new Box({ $$inline: true });

    	var box2 = new Box({ $$inline: true });

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

    // (39:2) <Box>
    function create_default_slot_1$5(ctx) {
    	var current;

    	var switcher = new Switcher({
    		props: {
    		limit: "10",
    		$$slots: { default: [create_default_slot_2$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			switcher.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
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
    			destroy_component(switcher, detaching);
    		}
    	};
    }

    // (38:1) <div slot="center">
    function create_center_slot$4(ctx) {
    	var div, current;

    	var box = new Box({
    		props: {
    		$$slots: { default: [create_default_slot_1$5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			box.$$.fragment.c();
    			attr(div, "slot", "center");
    			add_location(div, file$g, 37, 1, 1292);
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

    // (8:0) <Cover>
    function create_default_slot$5(ctx) {
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

    function create_fragment$g(ctx) {
    	var current;

    	var cover = new Cover({
    		props: {
    		$$slots: {
    		default: [create_default_slot$5],
    		center: [create_center_slot$4],
    		above: [create_above_slot$2]
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

    class SampleConfiguration_004 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$g, safe_not_equal, []);
    	}
    }

    /* src/SampleConfiguration_005.svelte generated by Svelte v3.6.5 */

    const file$h = "src/SampleConfiguration_005.svelte";

    // (9:1) <Frame>
    function create_default_slot_1$6(ctx) {
    	var img;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", "favicon.png");
    			attr(img, "alt", "favicon");
    			add_location(img, file$h, 9, 2, 213);
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

    // (8:0) <Box>
    function create_default_slot$6(ctx) {
    	var current;

    	var frame = new Frame({
    		props: {
    		$$slots: { default: [create_default_slot_1$6] },
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

    function create_fragment$h(ctx) {
    	var current;

    	var box = new Box({
    		props: {
    		$$slots: { default: [create_default_slot$6] },
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

    class SampleConfiguration_005 extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, null, create_fragment$h, safe_not_equal, []);
    	}
    }

    /* src/App.svelte generated by Svelte v3.6.5 */

    const file$i = "src/App.svelte";

    // (70:31) 
    function create_if_block_5(ctx) {
    	var current;

    	var sampleconfiguration_005 = new SampleConfiguration_005({ $$inline: true });

    	return {
    		c: function create() {
    			sampleconfiguration_005.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(sampleconfiguration_005, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(sampleconfiguration_005.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(sampleconfiguration_005.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(sampleconfiguration_005, detaching);
    		}
    	};
    }

    // (68:31) 
    function create_if_block_4(ctx) {
    	var current;

    	var sampleconfiguration_004 = new SampleConfiguration_004({ $$inline: true });

    	return {
    		c: function create() {
    			sampleconfiguration_004.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(sampleconfiguration_004, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(sampleconfiguration_004.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(sampleconfiguration_004.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(sampleconfiguration_004, detaching);
    		}
    	};
    }

    // (66:31) 
    function create_if_block_3(ctx) {
    	var current;

    	var sampleconfiguration_003 = new SampleConfiguration_003({ $$inline: true });

    	return {
    		c: function create() {
    			sampleconfiguration_003.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(sampleconfiguration_003, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(sampleconfiguration_003.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(sampleconfiguration_003.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(sampleconfiguration_003, detaching);
    		}
    	};
    }

    // (64:31) 
    function create_if_block_2(ctx) {
    	var current;

    	var sampleconfiguration_002 = new SampleConfiguration_002({ $$inline: true });

    	return {
    		c: function create() {
    			sampleconfiguration_002.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(sampleconfiguration_002, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(sampleconfiguration_002.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(sampleconfiguration_002.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(sampleconfiguration_002, detaching);
    		}
    	};
    }

    // (62:31) 
    function create_if_block_1(ctx) {
    	var current;

    	var sampleconfiguration_001 = new SampleConfiguration_001({ $$inline: true });

    	return {
    		c: function create() {
    			sampleconfiguration_001.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(sampleconfiguration_001, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(sampleconfiguration_001.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(sampleconfiguration_001.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(sampleconfiguration_001, detaching);
    		}
    	};
    }

    // (60:1) {#if configuration === 0}
    function create_if_block$2(ctx) {
    	var current;

    	var sampleconfiguration_000 = new SampleConfiguration_000({ $$inline: true });

    	return {
    		c: function create() {
    			sampleconfiguration_000.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(sampleconfiguration_000, target, anchor);
    			current = true;
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(sampleconfiguration_000.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(sampleconfiguration_000.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(sampleconfiguration_000, detaching);
    		}
    	};
    }

    function create_fragment$i(ctx) {
    	var main, current_block_type_index, if_block, current;

    	var if_block_creators = [
    		create_if_block$2,
    		create_if_block_1,
    		create_if_block_2,
    		create_if_block_3,
    		create_if_block_4,
    		create_if_block_5
    	];

    	var if_blocks = [];

    	function select_block_type(ctx) {
    		if (ctx.configuration === 0) return 0;
    		if (ctx.configuration === 1) return 1;
    		if (ctx.configuration === 1) return 2;
    		if (ctx.configuration === 2) return 3;
    		if (ctx.configuration === 3) return 4;
    		if (ctx.configuration === 4) return 5;
    		return -1;
    	}

    	if (~(current_block_type_index = select_block_type(ctx))) {
    		if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    	}

    	return {
    		c: function create() {
    			main = element("main");
    			if (if_block) if_block.c();
    			add_location(main, file$i, 58, 0, 1621);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, main, anchor);
    			if (~current_block_type_index) if_blocks[current_block_type_index].m(main, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);
    			if (current_block_type_index !== previous_block_index) {
    				if (if_block) {
    					group_outros();
    					transition_out(if_blocks[previous_block_index], 1, () => {
    						if_blocks[previous_block_index] = null;
    					});
    					check_outros();
    				}

    				if (~current_block_type_index) {
    					if_block = if_blocks[current_block_type_index];
    					if (!if_block) {
    						if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    						if_block.c();
    					}
    					transition_in(if_block, 1);
    					if_block.m(main, null);
    				} else {
    					if_block = null;
    				}
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
    				detach(main);
    			}

    			if (~current_block_type_index) if_blocks[current_block_type_index].d();
    		}
    	};
    }

    const PAGES = 5;

    function unify(e) { return e.changedTouches ? e.changedTouches[0] : e }

    function instance$c($$self, $$props, $$invalidate) {
    	

    	let configuration = 0;
    	let x0 = null;

    	/* spacebar press */
    	document.body.onkeyup = function(e){
    		if(e.keyCode === 32){
    			$$invalidate('configuration', configuration = (configuration + 1) % PAGES);
    		}
    	};

    	function lock(e) {
    		x0 = unify(e).clientX;
    	}

    	function move(e) {
    		if(x0 || x0 === 0) {
    			let dx = unify(e).clientX - x0, s = Math.sign(dx);

    			/* trigger only if more the 20 percent of screen are swiped */
    			let threshold = Math.abs(dx) > document.body.getBoundingClientRect().width * 0.2;

    			if (!threshold) return;

    			if (s > 0) {
    				$$invalidate('configuration', configuration = (configuration + 1) % PAGES);
    			} else {
    				$$invalidate('configuration', configuration = (configuration + 2) % PAGES);
    			}
    			
    			x0 = null;
    		}
    	}

    	/* swipe with touch */
    	document.body.addEventListener('touchstart', lock, false);
    	document.body.addEventListener('touchend', move, false);

    	/* swipe with mouse */
    	// document.body.addEventListener('mousedown', lock, false);
    	// document.body.addEventListener('mouseup', move, false);

    	/* prevent default action */
    	document.body.addEventListener('touchmove', e => { e.preventDefault(); }, false);

    	return { configuration };
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$c, create_fragment$i, safe_not_equal, []);
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
