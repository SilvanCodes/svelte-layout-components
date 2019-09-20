<script>
    import { onMount } from 'svelte';
    import { cssValue, buildId } from '../lib/helpers';

    export let space = 's0';
    export let minHeight = '100vh';
    export let pad = true;

    const id = buildId('cover', space, minHeight, pad);

	onMount(() => {
        document.querySelectorAll(`.${id}`).forEach(e => {
            e.style.minHeight = cssValue(minHeight);
            pad ? e.style.padding = cssValue(space) : null;
        });
        document.querySelectorAll(`.${id} > .above`).forEach(e => e.style.marginBottom = cssValue(space));
        document.querySelectorAll(`.${id} > .below`).forEach(e => e.style.marginTop = cssValue(space));
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

<div class={id}>
    <div class="above">
        <slot name="above"></slot>
    </div>
    <div class="center">
        <slot></slot>
    </div>
    <div class="below">
        <slot name="below"></slot>
    </div>
</div>