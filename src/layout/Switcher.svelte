<script>
    import { onMount } from 'svelte';

    export let threshold = '--measure';
    export let space = '--s0';
    export let limit = '5';

    const id = threshold + space + limit;

    onMount(() => {
        document.querySelectorAll(`.switcher${id} > *`).forEach(e => e.style.margin = `calc(var(${space}) / 2 * -1)`);
        document.querySelectorAll(`.switcher${id} > * > *`).forEach(e => {
            e.style.flexBasis = `calc((var(${threshold}) - 100% + var(${space})) * 999)`;
            e.style.margin = `calc(var(${space}) / 2)`;
        });

        if (limit) {
            document.querySelectorAll(`.switcher${id} > * > :nth-last-child(n+${limit}), .switcher${id} > * > :nth-last-child(n+${limit}) ~ *`)
                .forEach(e => e.style.flexBasis = '100%');
        }
	});
</script>

<style>
    :global([class^="switcher"] > *) {
        display: flex;
        flex-wrap: wrap;
        overflow: hidden;
    }

    :global([class^="switcher"] > * > *) {
        flex-grow: 1;
    }
</style>

<div class={`switcher${id}`}>
    <slot></slot>
</div>