
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
    function set_data(text, data) {
        data = '' + data;
        if (text.data !== data)
            text.data = data;
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

    /* src/Stack.svelte generated by Svelte v3.6.5 */

    const file = "src/Stack.svelte";

    function create_fragment(ctx) {
    	var div, div_class_value, current;

    	const default_slot_1 = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_1, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", div_class_value = `stack${ctx.scale}`);
    			add_location(div, file, 10, 0, 215);
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

    			if ((!current || changed.scale) && div_class_value !== (div_class_value = `stack${ctx.scale}`)) {
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

    function instance($$self, $$props, $$invalidate) {
    	let { scale = '--s0' } = $$props;

    	onMount(() => {
    		document.querySelectorAll(`.stack${scale} > * + *`).forEach(e => e.style.marginTop = `var(${scale})`);
    	});

    	const writable_props = ['scale'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Stack> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('scale' in $$props) $$invalidate('scale', scale = $$props.scale);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { scale, $$slots, $$scope };
    }

    class Stack extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["scale"]);
    	}

    	get scale() {
    		throw new Error("<Stack>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<Stack>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Sidebar.svelte generated by Svelte v3.6.5 */

    const file$1 = "src/Sidebar.svelte";

    const get_not_sidebar_slot_changes = () => ({});
    const get_not_sidebar_slot_context = () => ({});

    const get_sidebar_slot_changes = () => ({});
    const get_sidebar_slot_context = () => ({});

    function create_fragment$1(ctx) {
    	var div3, div2, div0, t, div1, div1_class_value, div3_class_value, current;

    	const sidebar_slot_1 = ctx.$$slots.sidebar;
    	const sidebar_slot = create_slot(sidebar_slot_1, ctx, get_sidebar_slot_context);

    	const not_sidebar_slot_1 = ctx.$$slots["not-sidebar"];
    	const not_sidebar_slot = create_slot(not_sidebar_slot_1, ctx, get_not_sidebar_slot_context);

    	return {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div0 = element("div");

    			if (sidebar_slot) sidebar_slot.c();
    			t = space();
    			div1 = element("div");

    			if (not_sidebar_slot) not_sidebar_slot.c();

    			attr(div0, "class", "sidebar svelte-c4ub5i");
    			add_location(div0, file$1, 35, 8, 850);

    			attr(div1, "class", div1_class_value = "" + (`not-sidebar${ctx.scale}`) + " svelte-c4ub5i");
    			add_location(div1, file$1, 38, 8, 937);
    			attr(div2, "class", "svelte-c4ub5i");
    			add_location(div2, file$1, 34, 4, 836);
    			attr(div3, "class", div3_class_value = "" + (`with-sidebar${ctx.scale}`) + " svelte-c4ub5i");
    			add_location(div3, file$1, 33, 0, 795);
    		},

    		l: function claim(nodes) {
    			if (sidebar_slot) sidebar_slot.l(div0_nodes);

    			if (not_sidebar_slot) not_sidebar_slot.l(div1_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div3, anchor);
    			append(div3, div2);
    			append(div2, div0);

    			if (sidebar_slot) {
    				sidebar_slot.m(div0, null);
    			}

    			append(div2, t);
    			append(div2, div1);

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

    			if ((!current || changed.scale) && div1_class_value !== (div1_class_value = "" + (`not-sidebar${ctx.scale}`) + " svelte-c4ub5i")) {
    				attr(div1, "class", div1_class_value);
    			}

    			if ((!current || changed.scale) && div3_class_value !== (div3_class_value = "" + (`with-sidebar${ctx.scale}`) + " svelte-c4ub5i")) {
    				attr(div3, "class", div3_class_value);
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
    				detach(div3);
    			}

    			if (sidebar_slot) sidebar_slot.d(detaching);

    			if (not_sidebar_slot) not_sidebar_slot.d(detaching);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { scale = '--s0' } = $$props;

    	onMount(() => {
            document.querySelectorAll(`.with-sidebar${scale} > *`).forEach(e => e.style.margin = `calc(-1 * var(${scale}) / 2)`);
            document.querySelectorAll(`.with-sidebar${scale} > * > *`).forEach(e => e.style.margin = `calc(var(${scale}) / 2)`);
            document.querySelector(`.not-sidebar${scale}`).style.minWidth = `calc(50% - var(${scale}))`;
    	});

    	const writable_props = ['scale'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Sidebar> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('scale' in $$props) $$invalidate('scale', scale = $$props.scale);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { scale, $$slots, $$scope };
    }

    class Sidebar extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["scale"]);
    	}

    	get scale() {
    		throw new Error("<Sidebar>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set scale(value) {
    		throw new Error("<Sidebar>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Cover.svelte generated by Svelte v3.6.5 */

    const file$2 = "src/Cover.svelte";

    const get_below_slot_changes = () => ({});
    const get_below_slot_context = () => ({});

    const get_center_slot_changes = () => ({});
    const get_center_slot_context = () => ({});

    const get_above_slot_changes = () => ({});
    const get_above_slot_context = () => ({});

    function create_fragment$2(ctx) {
    	var div3, div0, t0, div1, t1, div2, div3_class_value, current;

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

    			attr(div0, "class", "above svelte-11jtp0a");
    			set_style(div0, "background", "var(--color-primary)");
    			add_location(div0, file$2, 40, 4, 1035);

    			attr(div1, "class", "center svelte-11jtp0a");
    			add_location(div1, file$2, 43, 4, 1147);

    			attr(div2, "class", "below svelte-11jtp0a");
    			set_style(div2, "background", "var(--color-primary)");
    			add_location(div2, file$2, 46, 4, 1219);
    			attr(div3, "class", div3_class_value = "" + (`cover${ctx.id}`) + " svelte-11jtp0a");
    			add_location(div3, file$2, 39, 0, 1004);
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

    			if ((!current || changed.id) && div3_class_value !== (div3_class_value = "" + (`cover${ctx.id}`) + " svelte-11jtp0a")) {
    				attr(div3, "class", div3_class_value);
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

    function instance$2($$self, $$props, $$invalidate) {
    	let { padding = '--s0', margin = '--s0', maxOut = false } = $$props;

    	onMount(() => {
            document.querySelectorAll(`.cover${id}`).forEach(e => e.style.padding = `var(${padding})`);
            document.querySelectorAll(`.cover${id} > .above`).forEach(e => e.style.marginBottom = `var(${margin})`);
            maxOut ? document.querySelectorAll(`.cover${id} > .center`).forEach(e => e.style.flexGrow = 1) : null;
            document.querySelectorAll(`.cover${id} > .below`).forEach(e => e.style.marginTop = `var(${margin})`);

    	});

    	const writable_props = ['padding', 'margin', 'maxOut'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Cover> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('padding' in $$props) $$invalidate('padding', padding = $$props.padding);
    		if ('margin' in $$props) $$invalidate('margin', margin = $$props.margin);
    		if ('maxOut' in $$props) $$invalidate('maxOut', maxOut = $$props.maxOut);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	let id;

    	$$self.$$.update = ($$dirty = { padding: 1, margin: 1, maxOut: 1 }) => {
    		if ($$dirty.padding || $$dirty.margin || $$dirty.maxOut) { $$invalidate('id', id = padding + margin + maxOut); }
    	};

    	return {
    		padding,
    		margin,
    		maxOut,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Cover extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["padding", "margin", "maxOut"]);
    	}

    	get padding() {
    		throw new Error("<Cover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Cover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get margin() {
    		throw new Error("<Cover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set margin(value) {
    		throw new Error("<Cover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxOut() {
    		throw new Error("<Cover>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxOut(value) {
    		throw new Error("<Cover>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Bracket.svelte generated by Svelte v3.6.5 */

    const file$3 = "src/Bracket.svelte";

    const get_right_slot_changes = () => ({});
    const get_right_slot_context = () => ({});

    const get_center_slot_changes$1 = () => ({});
    const get_center_slot_context$1 = () => ({});

    const get_left_slot_changes = () => ({});
    const get_left_slot_context = () => ({});

    function create_fragment$3(ctx) {
    	var div3, div0, t0, div1, t1, div2, div3_class_value, current;

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

    			attr(div0, "class", "left svelte-1xrb4e3");
    			set_style(div0, "background", "var(--color-secondary)");
    			set_style(div0, "color", "white");
    			add_location(div0, file$3, 39, 4, 1045);

    			attr(div1, "class", "center svelte-1xrb4e3");
    			add_location(div1, file$3, 42, 4, 1171);

    			attr(div2, "class", "right svelte-1xrb4e3");
    			set_style(div2, "background", "var(--color-ternary)");
    			add_location(div2, file$3, 45, 4, 1243);
    			attr(div3, "class", div3_class_value = "" + (`bracket${ctx.id}`) + " svelte-1xrb4e3");
    			add_location(div3, file$3, 38, 0, 1012);
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

    			if ((!current || changed.id) && div3_class_value !== (div3_class_value = "" + (`bracket${ctx.id}`) + " svelte-1xrb4e3")) {
    				attr(div3, "class", div3_class_value);
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

    function instance$3($$self, $$props, $$invalidate) {
    	let { padding = '--s0', margin = '--s0', maxOut = false } = $$props;

    	onMount(() => {
            document.querySelectorAll(`.bracket${id}`).forEach(e => e.style.padding = `var(${padding})`);
            document.querySelectorAll(`.bracket${id} > .left`).forEach(e => e.style.marginRight = `var(${margin})`);
            maxOut ? document.querySelectorAll(`.bracket${id} > .center`).forEach(e => e.style.flexGrow = 1) : null;
            document.querySelectorAll(`.bracket${id} > .right`).forEach(e => e.style.marginLeft = `var(${margin})`);
    	});

    	const writable_props = ['padding', 'margin', 'maxOut'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Bracket> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('padding' in $$props) $$invalidate('padding', padding = $$props.padding);
    		if ('margin' in $$props) $$invalidate('margin', margin = $$props.margin);
    		if ('maxOut' in $$props) $$invalidate('maxOut', maxOut = $$props.maxOut);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	let id;

    	$$self.$$.update = ($$dirty = { padding: 1, margin: 1, maxOut: 1 }) => {
    		if ($$dirty.padding || $$dirty.margin || $$dirty.maxOut) { $$invalidate('id', id = padding + margin + maxOut); }
    	};

    	return {
    		padding,
    		margin,
    		maxOut,
    		id,
    		$$slots,
    		$$scope
    	};
    }

    class Bracket extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["padding", "margin", "maxOut"]);
    	}

    	get padding() {
    		throw new Error("<Bracket>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set padding(value) {
    		throw new Error("<Bracket>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get margin() {
    		throw new Error("<Bracket>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set margin(value) {
    		throw new Error("<Bracket>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get maxOut() {
    		throw new Error("<Bracket>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set maxOut(value) {
    		throw new Error("<Bracket>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Alternate.svelte generated by Svelte v3.6.5 */

    const file$4 = "src/Alternate.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.statement = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (16:16) {:else}
    function create_else_block(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_3],
    		right: [create_right_slot]
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
    			if (changed.$$scope || changed.statements) bracket_changes.$$scope = { changed, ctx };
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

    // (12:16) {#if i%2 == 0}
    function create_if_block(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_2],
    		left: [create_left_slot]
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
    			if (changed.$$scope || changed.statements) bracket_changes.$$scope = { changed, ctx };
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

    // (18:24) <p slot="right">
    function create_right_slot(ctx) {
    	var p, t_value = ctx.statement, t;

    	return {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr(p, "slot", "right");
    			add_location(p, file$4, 17, 24, 494);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.statements) && t_value !== (t_value = ctx.statement)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (17:20) <Bracket>
    function create_default_slot_3(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (14:24) <p slot="left">
    function create_left_slot(ctx) {
    	var p, t_value = ctx.statement, t;

    	return {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr(p, "slot", "left");
    			add_location(p, file$4, 13, 24, 354);
    		},

    		m: function mount(target, anchor) {
    			insert(target, p, anchor);
    			append(p, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.statements) && t_value !== (t_value = ctx.statement)) {
    				set_data(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(p);
    			}
    		}
    	};
    }

    // (13:20) <Bracket>
    function create_default_slot_2(ctx) {
    	var t;

    	return {
    		c: function create() {
    			t = space();
    		},

    		m: function mount(target, anchor) {
    			insert(target, t, anchor);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(t);
    			}
    		}
    	};
    }

    // (11:12) {#each statements as statement, i}
    function create_each_block(ctx) {
    	var current_block_type_index, if_block, if_block_anchor, current;

    	var if_block_creators = [
    		create_if_block,
    		create_else_block
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
    function create_default_slot_1(ctx) {
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

    // (9:4) <div slot="center">
    function create_center_slot(ctx) {
    	var div, current;

    	var stack = new Stack({
    		props: {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			stack.$$.fragment.c();
    			attr(div, "slot", "center");
    			add_location(div, file$4, 8, 4, 186);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(stack, div, null);
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
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(stack, );
    		}
    	};
    }

    // (8:0) <Bracket maxOut={true}>
    function create_default_slot(ctx) {

    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		i: noop,
    		o: noop,
    		d: noop
    	};
    }

    function create_fragment$4(ctx) {
    	var current;

    	var bracket = new Bracket({
    		props: {
    		maxOut: true,
    		$$slots: {
    		default: [create_default_slot],
    		center: [create_center_slot]
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
    			if (changed.$$scope || changed.statements) bracket_changes.$$scope = { changed, ctx };
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

    function instance$4($$self, $$props, $$invalidate) {
    	
        
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
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, ["statements"]);
    	}

    	get statements() {
    		throw new Error("<Alternate>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set statements(value) {
    		throw new Error("<Alternate>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/App.svelte generated by Svelte v3.6.5 */

    const file$5 = "src/App.svelte";

    // (13:3) <p slot="center">
    function create_center_slot_2(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Welcome!";
    			attr(p, "slot", "center");
    			add_location(p, file$5, 12, 3, 312);
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

    // (12:2) <Bracket>
    function create_default_slot_4(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		d: noop
    	};
    }

    // (11:1) <div slot="above">
    function create_above_slot(ctx) {
    	var div, current;

    	var bracket = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_4],
    		center: [create_center_slot_2]
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
    			add_location(div, file$5, 10, 1, 278);
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

    // (20:5) <p slot="center">
    function create_center_slot_1(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Sidebar Title";
    			attr(p, "slot", "center");
    			add_location(p, file$5, 19, 5, 470);
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

    // (19:4) <Bracket padding="--s-1">
    function create_default_slot_3$1(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		d: noop
    	};
    }

    // (23:5) <p slot="left">
    function create_left_slot$1(ctx) {
    	var p;

    	return {
    		c: function create() {
    			p = element("p");
    			p.textContent = "Option 1";
    			attr(p, "slot", "left");
    			add_location(p, file$5, 22, 5, 539);
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

    // (22:4) <Bracket>
    function create_default_slot_2$1(ctx) {
    	return {
    		c: noop,
    		m: noop,
    		p: noop,
    		d: noop
    	};
    }

    // (18:3) <div slot="sidebar">
    function create_sidebar_slot(ctx) {
    	var div, t, current;

    	var bracket0 = new Bracket({
    		props: {
    		padding: "--s-1",
    		$$slots: {
    		default: [create_default_slot_3$1],
    		center: [create_center_slot_1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var bracket1 = new Bracket({
    		props: {
    		$$slots: {
    		default: [create_default_slot_2$1],
    		left: [create_left_slot$1]
    	},
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			bracket0.$$.fragment.c();
    			t = space();
    			bracket1.$$.fragment.c();
    			attr(div, "slot", "sidebar");
    			add_location(div, file$5, 17, 3, 414);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(bracket0, div, null);
    			append(div, t);
    			mount_component(bracket1, div, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var bracket0_changes = {};
    			if (changed.$$scope) bracket0_changes.$$scope = { changed, ctx };
    			bracket0.$set(bracket0_changes);

    			var bracket1_changes = {};
    			if (changed.$$scope) bracket1_changes.$$scope = { changed, ctx };
    			bracket1.$set(bracket1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(bracket0.$$.fragment, local);

    			transition_in(bracket1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(bracket0.$$.fragment, local);
    			transition_out(bracket1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_component(bracket0, );

    			destroy_component(bracket1, );
    		}
    	};
    }

    // (26:3) <div slot="not-sidebar">
    function create_not_sidebar_slot(ctx) {
    	var div, current;

    	var alternate = new Alternate({
    		props: { statements: ["This website is an experiment to learn webdesign.", "It is layouted according to the ideas of https://every-layout.dev/", "The color schema comes from https://colorsupplyyy.com/app"] },
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div = element("div");
    			alternate.$$.fragment.c();
    			attr(div, "slot", "not-sidebar");
    			add_location(div, file$5, 25, 3, 595);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			mount_component(alternate, div, null);
    			current = true;
    		},

    		p: noop,

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

    // (17:2) <Sidebar scale="--zero">
    function create_default_slot_1$1(ctx) {
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

    // (16:1) <div slot="center">
    function create_center_slot$1(ctx) {
    	var div, current;

    	var sidebar = new Sidebar({
    		props: {
    		scale: "--zero",
    		$$slots: {
    		default: [create_default_slot_1$1],
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
    			sidebar.$$.fragment.c();
    			attr(div, "slot", "center");
    			add_location(div, file$5, 15, 1, 364);
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

    // (10:0) <Cover padding="--zero" margin="--zero" maxOut={true}>
    function create_default_slot$1(ctx) {
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

    function create_fragment$5(ctx) {
    	var current;

    	var cover = new Cover({
    		props: {
    		padding: "--zero",
    		margin: "--zero",
    		maxOut: true,
    		$$slots: {
    		default: [create_default_slot$1],
    		center: [create_center_slot$1],
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
    		init(this, options, null, create_fragment$5, safe_not_equal, []);
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
