<script>
    import { onMount } from 'svelte';

    export let padding = '--s0';
    export let margin = '--s0';
    export let maxOut = false;

    $: id = padding + margin + maxOut;

	onMount(() => {
        document.querySelectorAll(`.cover${id}`).forEach(e => e.style.padding = `var(${padding})`);
        document.querySelectorAll(`.cover${id} > .above`).forEach(e => e.style.marginBottom = `var(${margin})`);
        maxOut ? document.querySelectorAll(`.cover${id} > .center`).forEach(e => e.style.flexGrow = 1) : null;
        maxOut ? document.querySelectorAll(`.cover${id} > .center > *`).forEach(e => e.style.height = '100%') : null;
        document.querySelectorAll(`.cover${id} > .below`).forEach(e => e.style.marginTop = `var(${margin})`);

	});
</script>

<style>
    [class^="cover"] {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
    }

    [class^="cover"] > .center {
        margin-top: auto;
        margin-bottom: auto;
    }

    [class^="cover"] > .above {
        margin-top: 0;
        background: var(--color-primary);
    }

    [class^="cover"] > .below {
        margin-bottom: 0;
        background: var(--color-primary);
    }
</style>

<div class={`cover${id}`}>
    <div class="above">
        <slot name="above"></slot>
    </div>
    <div class="center">
        <slot name="center"></slot>
    </div>
    <div class="below">
        <slot name="below"></slot>
    </div>
</div>