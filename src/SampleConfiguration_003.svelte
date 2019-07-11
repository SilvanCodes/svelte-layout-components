<script>
	import Cover from './Cover.svelte';
	import Bracket from './Bracket.svelte';
    import Alternate from './Alternate.svelte';
    import Button from './Button.svelte';
	import Stack from './Stack.svelte';
	import FullHeightSidebar from './FullHeightSidebar.svelte';

	import { statements } from './staticContent.js'
</script>

<FullHeightSidebar>

	<div slot="sidebar" style="background: var(--color-secondary); color: white;">
		<Bracket padding="--s-1">
			<p slot="center">Sidebar Title</p>
		</Bracket>
		<Bracket padding="--s-1">
			<div slot="center">
				<Stack>
					<Button priority="ternary">Option 1</Button>
					<Button priority="ternary">Option 2</Button>
					<Button priority="ternary">Option 3</Button>
				</Stack>
			</div>
		</Bracket>
	</div>

	<div slot="not-sidebar">
		<Cover padding="--zero">
			<div slot="above">
				<Bracket style="background: var(--color-primary);">
					<h1 slot="center">Welcome!</h1>
				</Bracket>
			</div>

			<div slot="center">
				<Alternate {statements}></Alternate>
			</div>

			<div slot="below">
				<Bracket style="background: var(--color-primary);">
					<p slot="center">Footer</p>
				</Bracket>
			</div>
		</Cover>
	</div>

</FullHeightSidebar>
