<script>
    import { onMount } from 'svelte';

    export let padding = '--s0';
    export let margin = '--s0';
    export let maxOut = false;

    $: id = padding + margin + maxOut;

	onMount(() => {
        document.querySelectorAll(`.bracket${id}`).forEach(e => e.style.padding = `var(${padding})`);
        document.querySelectorAll(`.bracket${id} > .left`).forEach(e => e.style.marginRight = `var(${margin})`);
        maxOut ? document.querySelectorAll(`.bracket${id} > .center`).forEach(e => e.style.flexGrow = 1) : null;
        document.querySelectorAll(`.bracket${id} > .right`).forEach(e => e.style.marginLeft = `var(${margin})`);
	});
</script>

<style>
    [class^="bracket"] {
        display: flex;
    }

    [class^="bracket"] > .center {
        margin-left: auto;
        margin-right: auto;
    }

    [class^="bracket"] > .left {
        margin-left: 0;
        /* background: var(--color-secondary);
        color: white; */
    }

    [class^="bracket"] > .right {
        margin-right: 0;
        /* background: var(--color-ternary); */
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