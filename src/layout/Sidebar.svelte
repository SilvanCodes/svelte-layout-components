<script>
    import { onMount } from 'svelte';
    import { cssValue } from '../lib/helpers';

    export let side = 'left';
    export let sideWidth = '';
    export let contentMin = '50%';
    export let space = 's0';

    let withSidebar;
    let notSidebar;
    let sidebar;

	onMount(() => {
        notSidebar.style.minWidth = cssValue(contentMin);

        if (sideWidth) {
            sidebar.style.flexBasis = cssValue(sideWidth);
        }

        if (space) {
            withSidebar.querySelectorAll(`.with-sidebar > *`).forEach(e => e.style.margin = `calc(${cssValue(space)} / 2 * -1)`);
            withSidebar.querySelectorAll(`.with-sidebar > * > *`).forEach(e => e.style.margin = `calc(${cssValue(space)} / 2)`);
            notSidebar.style.minWidth = `calc(${cssValue(contentMin)} - ${cssValue(space)})`;
        }
	});
</script>

<style>
    .with-sidebar {
        overflow: hidden;
    }

    .with-sidebar > * {
        display: flex;
        flex-wrap: wrap;
    }

    .sidebar {
        flex-grow: 1;
    }

    .not-sidebar {
        /* ↓ grow from nothing */
        flex-basis: 0;
        flex-grow: 999;
    }
</style>

<div bind:this={withSidebar} class="with-sidebar">
    <div>
        {#if side === 'left'}
            <div bind:this={sidebar} class="sidebar">
                <slot name="sidebar"></slot>
            </div>
            <div bind:this={notSidebar} class="not-sidebar">
                <slot name="not-sidebar"></slot>
            </div>
        {:else}
            <div bind:this={notSidebar} class="not-sidebar">
                <slot name="not-sidebar"></slot>
            </div>
            <div bind:this={sidebar} class="sidebar">
                <slot name="sidebar"></slot>
            </div>
        {/if}
    </div>
</div>
