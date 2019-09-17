<script>
    import { onMount } from 'svelte';

    export let itemWidth = 'auto';
    export let space = '--s1';
    export let height = 'auto';

    const id = itemWidth + space + height;

	onMount(() => {
        document.querySelectorAll(`.reel${id}`).forEach(e => {
            e.style.height = `var(${height}, ${height})`;
        });
        document.querySelectorAll(`.reel${id} > * + *`).forEach(e => e.style.marginLeft = `var(${space}, ${space})`);
        document.querySelectorAll(`.reel${id} > *`).forEach(e => e.style.flex = `0 0 var(${itemWidth}, ${itemWidth})`);
	});
</script>

<style>
    [class^="reel"] {
        display: flex;
        overflow-x: auto;
        overflow-y: hidden;
    }

    :global([class^="reel"] > img) {
        height: 100%;
        flex-basis: auto;
        width: auto;
    }
</style>

<div class={`reel${id}`}>
    <slot></slot>
</div>