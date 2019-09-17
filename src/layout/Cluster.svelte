<script>
    import { onMount } from 'svelte';
    import { cssValue } from '../lib/helpers';

    export let justify = 'center';
    export let align = 'center';
    export let space = 's0';

    const id = 'cluster' + justify + align + space;

    onMount(() => {
        document.querySelectorAll(`.${id} > *`).forEach(e => {
            e.style.justifyContent = cssValue(justify);
            e.style.alignItems = cssValue(align);
            e.style.margin = `calc(${cssValue(space)} / 2 * -1)`
        });
        document.querySelectorAll(`.${id} > * > *`).forEach(e => e.style.margin = `calc(${cssValue(space)} / 2)`);
	});
</script>

<style>
    [class^="cluster"] {
        overflow: hidden;
    }
    
    :global([class^="cluster"] > *) {
        display: flex;
        flex-wrap: wrap;
    }
</style>

<div class={id}>
    <slot>
    </slot>
</div>

