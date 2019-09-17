<script>
    import { onMount } from 'svelte';

    export let min = '12rem';
    export let space = '--s0';

    const id = min + space;

	onMount(() => {
        document.querySelectorAll(`.grid${id}`).forEach(e => {
            e.style.gridGap = `var(${space})`;
            e.style.gridTemplateColumns = `repeat(auto-fit, minmax(${min}, 1fr))`;
        });
	});
</script>

<style>
    [class^="grid"] {
        display: grid;
    }
</style>

<div class={`grid${id}`}>
    <slot></slot>
</div>