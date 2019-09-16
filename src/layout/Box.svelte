<script>
    import { onMount } from 'svelte';

    export let padding = '--s1';
    export let color = '--color-primary';
    export let backgroundColor = '--color-secondary';
    export let borderWidth = '--border-medium';
    export let borderStyle = 'solid';
    export let borderColor = '--color-primary';

    const id = padding + color + backgroundColor + borderWidth + borderStyle + borderColor;

    onMount(() => {
        document.querySelectorAll(`.box${id}`).forEach(e => e.style.padding = `var(${padding})`);
        document.querySelectorAll(`.box${id}`).forEach(e => e.style.color = `var(${color})`);
        document.querySelectorAll(`.box${id}`).forEach(e => e.style.backgroundColor = `var(${backgroundColor})`);

        if (borderWidth) {
            document.querySelectorAll(`.box${id}`).forEach(e => e.style.border = `var(${borderWidth}) ${borderStyle} var(${borderColor})`);
        } else {
            document.querySelectorAll(`.box${id}`).forEach(e => e.style.outline = '0.125rem solid transparent');
            document.querySelectorAll(`.box${id}`).forEach(e => e.style.outlineOffset = '-0.125rem');
        }
	});
</script>

<style>
    [class^="box"] * {
        color: inherit;
    }
</style>

<div class={`box${id}`}>
    <slot>
    </slot>
</div>