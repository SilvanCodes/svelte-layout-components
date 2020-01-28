<script>
    import { onMount } from 'svelte';
    import { cssValue } from '../lib/helpers';

    export let threshold = 'measure';
    export let space = 's0';
    /** limit can only be a number (handed as a string), but not a CSS-variable */
    export let limit = '5';

    let switcher;

    onMount(() => {
        switcher.querySelectorAll(`.switcher > *`).forEach(e => e.style.margin = `calc(${cssValue(space)} / 2 * -1)`);
        switcher.querySelectorAll(`.switcher > * > *`).forEach(e => {
            e.style.flexBasis = `calc((${cssValue(threshold)} - 100% + ${cssValue(space)}) * 999)`;
            e.style.margin = `calc(${cssValue(space)} / 2)`;
        });

        if (limit) {
            switcher.querySelectorAll(`.switcher > * > :nth-last-child(n+${limit}), .switcher > * > :nth-last-child(n+${limit}) ~ *`)
                .forEach(e => e.style.flexBasis = '100%');
        }
	});
</script>

<style>
    .switcher > * {
        display: flex;
        flex-wrap: wrap;
        overflow: hidden;
    }

    .switcher > * > :global(*) {
        flex-grow: 1;
    }
</style>

<div bind:this={switcher} class="switcher">
    <div>
        <slot></slot>
    </div>
</div>