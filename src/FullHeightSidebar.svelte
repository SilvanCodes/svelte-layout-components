<script>
	import Sidebar from './Sidebar.svelte';
	import Cover from './Cover.svelte';
	import Bracket from './Bracket.svelte';
    import Alternate from './Alternate.svelte';
    import Button from './Button.svelte';
    import Stack from './Stack.svelte';
</script>

<style>
	.full-height {
		height: 100%;
	}

	.full-height > :global([class^="stack"]) {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.full-height > :global([class^="stack"] > [class^="with-sidebar"]) {
		flex-grow: 1;
	}

	.full-height > :global([class^="stack"] > [class^="with-sidebar"] > *) {
		height: 100%;
	}

	.full-height > :global([class^="stack"] > [class^="with-sidebar"] > * > [class^="sidebar"] > *) {
		height: 100%;
	}

	.full-height > :global([class^="stack"] > [class^="with-sidebar"] > * > [class^="sidebar"] > * > *) {
		height: 100%;
	}
</style>

<div class="full-height">
	<Stack scale="--zero">
		<slot name="header"></slot>
		<Sidebar scale="--zero">
			<div slot="sidebar">
				<slot name="sidebar"></slot>
			</div>
			<div slot="not-sidebar">
				<slot name="not-sidebar"></slot>
			</div>
		</Sidebar>
		<slot name="footer"></slot>
	</Stack>
</div>
