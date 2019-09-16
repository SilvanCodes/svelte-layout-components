<script>
    import { onMount } from 'svelte';

    export let maxWidth = '--measure';
    export let andText = false;
    export let gutters = '--s0';
    export let padding = '--s0';
    export let intrinsic = false;

    const id = maxWidth + andText + gutters + padding + intrinsic;

	onMount(() => {
        document.querySelectorAll(`.bracket${id}`).forEach(e => e.style.padding = `var(${padding})`);
        document.querySelectorAll(`.bracket${id} > .left`).forEach(e => e.style.marginRight = `var(${gutters})`);
        document.querySelectorAll(`.bracket${id} > .right`).forEach(e => e.style.marginLeft = `var(${gutters})`);

        document.querySelectorAll(`.bracket${id} > .center`).forEach(e => e.style.maxWidth = `var(${maxWidth})`);

        if (intrinsic) {
            document.querySelectorAll(`.bracket${id} > .center`).forEach(e => e.style.alignItems = 'center');
        }

        if (andText) {
            document.querySelectorAll(`.bracket${id} > .center`).forEach(e => e.style.textAlign = 'center');
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

<div class={`bracket${id}`}>
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