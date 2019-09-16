<script>
    import { onMount } from 'svelte';

    export let gap = null;

    $: id = gap

	onMount(() => {
        if (gap) {
            document.querySelectorAll(`.with-sidebar${id} > *`).forEach(e => e.style.margin = `calc(-1 * var(${gap}) / 2)`);
            document.querySelectorAll(`.with-sidebar${id} > * > *`).forEach(e => e.style.margin = `calc(var(${gap}) / 2)`);
            document.querySelector(`.with-sidebar${id} > * > .not-sidebar`).style.minWidth = `calc(50% - var(${gap}))`;
        }
	});
</script>

<style>
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
        min-width: 70%;
    }
</style>

<div class={`with-sidebar${id}`}>
    <div>
        <div class="sidebar" >
            <slot name="sidebar"></slot>
        </div>
        <div class="not-sidebar">
            <slot name="not-sidebar"></slot>
        </div>
    </div>
</div>