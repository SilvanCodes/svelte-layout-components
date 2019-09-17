<script>
    import { onMount } from 'svelte';

    export let justify = 'center';
    export let align = 'center';
    export let space = '--s0';

    const id = justify + align + space;

    onMount(() => {
        document.querySelectorAll(`.cluster${id} > *`).forEach(e => {
            e.style.justifyContent = justify;
            e.style.alignItems = align;
            e.style.margin = `calc(var(${space}) / 2 * -1)`
        });
        document.querySelectorAll(`.cluster${id} > * > *`).forEach(e => e.style.margin = `calc(var(${space}) / 2)`);
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

<div class={`cluster${id}`}>
    <slot>
    </slot>
</div>

