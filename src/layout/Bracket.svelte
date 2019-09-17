<script>
    import { onMount } from 'svelte';
    import { cssValue } from '../lib/helpers';

    export let maxWidth = 'measure';
    export let andText = true;
    export let space = 's0';
    export let padding = 's0';
    export let intrinsic = false;

    const id = 'bracket' + maxWidth + andText + space + padding + intrinsic;

	onMount(() => {
        document.querySelectorAll(`.${id}`).forEach(e => e.style.padding = cssValue(padding));
        document.querySelectorAll(`.${id} > .left`).forEach(e => e.style.marginRight = cssValue(space));
        document.querySelectorAll(`.${id} > .right`).forEach(e => e.style.marginLeft = cssValue(space));

        document.querySelectorAll(`.${id} > .center`).forEach(e => e.style.maxWidth = cssValue(maxWidth));

        if (intrinsic) {
            document.querySelectorAll(`.${id} > .center`).forEach(e => e.style.alignItems = 'center');
        }

        if (andText) {
            document.querySelectorAll(`.${id} > .center`).forEach(e => e.style.textAlign = 'center');
        }
	});
</script>

<style>
    [class^="bracket"] {
        display: flex;
    }

    [class^="bracket"] > .center {
        margin-left: auto;
        margin-right: auto;
        display: flex;
        flex-direction: column;
    }

    [class^="bracket"] > .left {
        margin-left: 0;
    }

    [class^="bracket"] > .right {
        margin-right: 0;
    }
</style>

<div class={id}>
    <div class="left">
        <slot name="left"></slot>
    </div>
    <div class="center">
        <slot name="center"></slot>
    </div>
    <div class="right" style="">
        <slot name="right"></slot>
    </div>
</div>