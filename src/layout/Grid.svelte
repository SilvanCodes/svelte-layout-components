<script>
    import { onMount } from 'svelte';
    import { cssValue } from '../lib/helpers';

    export let min = '12rem';
    export let space = 's0';

    let grid;

	onMount(() => {
        grid.style.gridGap = `var(--${space}, ${space})`;
        grid.style.gridTemplateColumns = `repeat(auto-fit, minmax(${cssValue(min)}, 1fr))`;
	});
</script>

<style>
    .grid {
        display: grid;
    }
</style>

<div bind:this={grid} class="grid">
    <slot></slot>
</div>
