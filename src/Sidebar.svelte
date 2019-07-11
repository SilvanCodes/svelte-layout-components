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
    [class^="with-sidebar"] {
        overflow: hidden;
        display: flex;
        flex-direction: column;
        height: 100%;
    }

    [class^="with-sidebar"] > * {
        flex-grow: 1;
        display: flex;
        flex-wrap: wrap;
    }

    .sidebar {
        flex-grow: 1;
        height: 100%;
        background: var(--color-secondary);
        color: white;
    }

    [class^="not-sidebar"] {
        /* ↓ grow from nothing */
        height: 100%;
        flex-basis: 0;
        flex-grow: 999;
    }

    /* for spreading sidebar to full viewport */
    :global(.sidebar > *) {
        height: 100%;
    }

    /* :global([class^="not-sidebar"] > *) {
        height: 100%;
    } */
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