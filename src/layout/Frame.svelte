<script>
    import { onMount } from 'svelte';

    export let n = '6';
    export let d = '9';

    const id = n + d;

	onMount(() => {
        document.querySelectorAll(`.frame${id}`).forEach(e => e.style.paddingBottom = `calc(${n} / ${d} * 100%)`);
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

<div class={`frame${id}`}>
    <slot></slot>
</div>