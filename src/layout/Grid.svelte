<script>
    import { onMount } from 'svelte';
    import { cssValue, buildId } from '../lib/helpers';

    export let min = '12rem';
    export let space = 's0';

    const id = buildId('grid', min, space);

	onMount(() => {
        document.querySelectorAll(`.${id}`).forEach(e => {
            e.style.gridGap = `var(--${space}, ${space})`;
            e.style.gridTemplateColumns = `repeat(auto-fit, minmax(${cssValue(min)}, 1fr))`;
        });
	});
</script>

<style>
    [class^="grid"] {
        display: grid;
    }
</style>

<div class={id}>
    <slot></slot>
</div>