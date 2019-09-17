<script>
    import { onMount } from 'svelte';
    import { cssValue } from '../lib/helpers';

    export let threshold = 'measure';
    export let space = 's0';
    /** limit can only be a number (handed as a string), but not a CSS-variable */
    export let limit = '5';

    const id = 'switcher' + threshold + space + limit;

    onMount(() => {
        document.querySelectorAll(`.${id} > *`).forEach(e => e.style.margin = `calc(${cssValue(space)} / 2 * -1)`);
        document.querySelectorAll(`.${id} > * > *`).forEach(e => {
            e.style.flexBasis = `calc((${cssValue(threshold)} - 100% + ${cssValue(space)}) * 999)`;
            e.style.margin = `calc(${cssValue(space)} / 2)`;
        });

        if (limit) {
            document.querySelectorAll(`.${id} > * > :nth-last-child(n+${limit}), .${id} > * > :nth-last-child(n+${limit}) ~ *`)
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

<div class={id}>
    <div>
        <slot></slot>
    </div>
</div>