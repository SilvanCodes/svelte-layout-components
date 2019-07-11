<script>
    import { onMount } from 'svelte';

    export let scale = '--s0';

	onMount(() => {
        document.querySelectorAll(`.with-sidebar${scale} > *`).forEach(e => e.style.margin = `calc(-1 * var(${scale}) / 2)`);
        document.querySelectorAll(`.with-sidebar${scale} > * > *`).forEach(e => e.style.margin = `calc(var(${scale}) / 2)`);
        document.querySelector(`.not-sidebar${scale}`).style.minWidth = `calc(50% - var(${scale}))`;
	});
</script>

<style>
    /* [class^="with-sidebar"] {
        overflow: hidden;
    } */

    [class^="with-sidebar"] > * {
        display: flex;
        flex-wrap: wrap;
    }

    .sidebar {
        flex-grow: 1;
    }

    [class^="not-sidebar"] {
        /* ↓ grow from nothing */
        flex-basis: 0;
        flex-grow: 999;
        overflow: initial;
    }
</style>

<div class={`with-sidebar${scale}`}>
    <div>
        <div class="sidebar" >
            <slot name="sidebar"></slot>
        </div>
        <div class={`not-sidebar${scale}`}>
            <slot name="not-sidebar"></slot>
        </div>
    </div>
</div>