<script>
    import { onMount } from 'svelte';

    export let side = 'left';
    export let sideWidth = '';
    export let contentMin = '50%';
    export let space = '--s0';

    $: id = side + sideWidth + contentMin + space;

	onMount(() => {
        if (sideWidth) {
            document.querySelector(`.with-sidebar${id} > * > .sidebar`).forEach(e => e.style.flexBasis = sideWidth);
        }

        if (contentMin) {
            document.querySelectorAll(`.with-sidebar${id} > * > .not-sidebar`).forEach(e => e.style.minWidth = contentMin);
        }

        if (space) {
            document.querySelectorAll(`.with-sidebar${id} > *`).forEach(e => e.style.margin = `calc(var(${space}) / 2 * -1)`);
            document.querySelectorAll(`.with-sidebar${id} > * > *`).forEach(e => e.style.margin = `calc(var(${space}) / 2)`);
            document.querySelectorAll(`.with-sidebar${id} > * > .not-sidebar`).forEach(e => e.style.minWidth = `calc(${contentMin} - var(${space}))`);
        }
	});
</script>

<style>
    [class^="with-sidebar"] {
        overflow: hidden;
    }

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
    }
</style>

<div class={`with-sidebar${id}`}>
    <div>
        {#if side === 'left'}
            <div class="sidebar">
                <slot name="sidebar"></slot>
            </div>
            <div class="not-sidebar">
                <slot name="not-sidebar"></slot>
            </div>
        {:else}
            <div class="not-sidebar">
                <slot name="not-sidebar"></slot>
            </div>
            <div class="sidebar">
                <slot name="sidebar"></slot>
            </div>
        {/if}
    </div>
</div>