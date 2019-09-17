<script>
    import { onMount } from 'svelte';
    import { cssValue, buildId } from '../lib/helpers';

    export let itemWidth = 'auto';
    export let space = 's1';
    export let height = 'auto';

    const id = buildId('reel', itemWidth, space, height);

	onMount(() => {
        document.querySelectorAll(`.${id}`).forEach(e => {
            e.style.height = cssValue(height);
        });
        document.querySelectorAll(`.${id} > * + *`).forEach(e => e.style.marginLeft = cssValue(space));
        document.querySelectorAll(`.${id} > *`).forEach(e => e.style.flex = `0 0 ${cssValue(itemWidth)}`);
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

<div class={id}>
    <slot></slot>
</div>