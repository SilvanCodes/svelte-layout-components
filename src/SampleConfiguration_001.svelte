<script>
	import Sidebar from './layout/Sidebar.svelte';
	import Cover from './layout/Cover.svelte';
	import Bracket from './layout/Bracket.svelte';
	import Alternate from './Alternate.svelte';
	import Button from './Button.svelte';
	import Stack from './layout/Stack.svelte';
	
	import { statements } from './staticContent.js'
</script>


<Cover padding="--zero" margin="--zero">
	<div slot="above">
		<Bracket>
			<h1 slot="center">Welcome!</h1>
		</Bracket>
	</div>
	<div slot="center">
		<Sidebar>
			<div slot="sidebar">
				<Bracket padding="--s-1">
					<div slot="center">
						<Stack>
							<p>Sidebar Title</p>
							<Button>Option 1</Button>
							<Button>Option 2</Button>
							<Button>Option 3</Button>
						</Stack>
					</div>
				</Bracket>
			</div>
			<div slot="not-sidebar">
				<Alternate {statements}></Alternate>
			</div>
		</Sidebar>
	</div>
	<div slot="below">
		<Bracket>
			<p slot="center">Footer</p>
		</Bracket>
	</div>
</Cover>
