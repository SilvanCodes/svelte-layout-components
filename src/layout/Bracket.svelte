<script>
    import { onMount } from 'svelte';
    import { cssValue } from '../lib/helpers';

    export let maxWidth = 'measure';
    export let andText = true;
    export let space = 'zero';
    export let padding = 'zero';
    export let intrinsic = false;

    let bracket;
    let left;
    let center;
    let right;

	onMount(() => {
        bracket.style.padding = cssValue(padding);

        left.style.marginRight = cssValue(space);
        right.style.marginLeft = cssValue(space);

        center.style.maxWidth = cssValue(maxWidth);
        intrinsic ? center.style.alignItems = 'center' : null;
        andText ? center.style.textAlign = 'center' : null;
	});
</script>

<style>
    .bracket {
        display: flex;
    }

    .bracket > .center {
        margin-left: auto;
        margin-right: auto;
        /* display: flex;
        flex-direction: column; */
    }

    .bracket > .left {
        margin-left: 0;
    }

    .bracket > .right {
        margin-right: 0;
    }
</style>

<div bind:this={bracket} class="bracket">
    <div bind:this={left} class="left">
        <slot name="left"></slot>
    </div>
    <div bind:this={center} class="center">
        <slot></slot>
    </div>
    <div bind:this={right} class="right" style="">
        <slot name="right"></slot>
    </div>
</div>
