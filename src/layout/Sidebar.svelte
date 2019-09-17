<script>
    import { onMount } from 'svelte';
    import { cssValue, buildId } from '../lib/helpers';

    export let side = 'left';
    export let sideWidth = '';
    export let contentMin = '50%';
    export let space = 's0';

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

<div class={id}>
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