<script>
    import { onMount } from 'svelte';
    import { cssValue } from '../lib/helpers';

    export let justify = 'center';
    export let align = 'center';
    export let space = 's0';

    let cluster;

    onMount(() => {
        cluster.querySelectorAll(`.cluster > *`).forEach(e => {
            e.style.justifyContent = cssValue(justify);
            e.style.alignItems = cssValue(align);
            e.style.margin = `calc(${cssValue(space)} / 2 * -1)`
        });
        cluster.querySelectorAll(`.cluster > * > *`).forEach(e => e.style.margin = `calc(${cssValue(space)} / 2)`);
	});
</script>

<style>
    .cluster {
        overflow: hidden;
    }

    .cluster > :global(*) {
        display: flex;
        flex-wrap: wrap;
    }
</style>

<div bind:this={cluster} class="cluster">
    <slot>
    </slot>
</div>
