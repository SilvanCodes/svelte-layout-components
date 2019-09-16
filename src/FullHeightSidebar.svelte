<script>
	import Sidebar from './layout/Sidebar.svelte';
    import Stack from './layout/Stack.svelte';
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
		display: flex;
	}

	.full-height > :global([class^="stack"] > [class^="with-sidebar"] > *) {
		flex-grow: 1;
		/* height: 100%; */
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
		<Sidebar>
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
