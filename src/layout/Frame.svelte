<script>
    import { onMount } from 'svelte';
    import { cssValue } from '../lib/helpers';

    export let n = '6';
    export let d = '9';

    const id = 'frame' + n + d;

	onMount(() => {
        document.querySelectorAll(`.${id}`).forEach(e => e.style.paddingBottom = `calc(${cssValue(n)} / ${cssValue(d)} * 100%)`);
	});
</script>

<style>
    [class^="frame"] {
        position: relative;
    }

    :global([class^="frame"] > *) {
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden;
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
    }

    :global([class^="frame"] > img, [class^="frame"] > video) {
        height: 100%;
        width: 100%;
        object-fit: cover;
    }
</style>

<div class={id}>
    <slot></slot>
</div>