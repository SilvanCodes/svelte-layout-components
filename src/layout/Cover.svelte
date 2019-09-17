<script>
    import { onMount } from 'svelte';

    export let space = '--s0';
    export let minHeight = '100vh';
    export let pad = true;

    const id = space + minHeight + pad;

	onMount(() => {
        document.querySelectorAll(`.cover${id}`).forEach(e => e.style.minHeight = minHeight);
        document.querySelectorAll(`.cover${id} > .above`).forEach(e => e.style.spaceBottom = `var(${space})`);
        document.querySelectorAll(`.cover${id} > .below`).forEach(e => e.style.marginTop = `var(${space})`);

        if (pad) {
           document.querySelectorAll(`.cover${id}`).forEach(e => e.style.padding = `var(${space})`); 
        }
	});
</script>

<style>
    [class^="cover"] {
        display: flex;
        flex-direction: column;
    }

    [class^="cover"] > .center {
        margin-top: auto;
        margin-bottom: auto;
    }

    [class^="cover"] > .above {
        margin-top: 0;
    }

    [class^="cover"] > .below {
        margin-bottom: 0;
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