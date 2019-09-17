<script>
	import Cover from './layout/Cover.svelte';
	import Grid from './layout/Grid.svelte';
	import Box from './layout/Box.svelte';
	import Stack from './layout/Stack.svelte';
	import Bracket from './layout/Bracket.svelte';
	import Cluster from './layout/Cluster.svelte';
	import Sidebar from './layout/Sidebar.svelte';
	import Switcher from './layout/Switcher.svelte';
	import Frame from './layout/Frame.svelte';
	import Reel from './layout/Reel.svelte';
	import Presentation from './Presentation.svelte';
</script>

<Cover>
	<div slot="above">
		<Bracket>
			<a id="top" href="https://every-layout.dev/" target="blank"><h1>EveryLayout in Svelte</h1></a>
		</Bracket>
	</div>
	<Grid min="18rem">

		<Presentation>
			<a slot="title" href="https://every-layout.dev/layouts/stack/" target="blank"><h5>Stack</h5></a>
			<Stack recursive="true">
				<ul>
					<li><hr></li>
					<li><hr></li>
					<li><hr></li>
				</ul>
			</Stack>
		</Presentation>

		<Presentation>
			<a slot="title" href="https://every-layout.dev/layouts/box/" target="blank"><h5>Box</h5></a>
			<Box></Box>
		</Presentation>

		<Presentation>
			<a slot="title" href="https://every-layout.dev/layouts/center/" target="blank"><h5>Bracket</h5></a>
			<Bracket space="s0">
				<div slot="left">
					<Box padding="zero">
						<div style="height:calc(var(--s1) * 2);"></div>
					</Box>
				</div>
				<Box padding="s1"></Box>
				<div slot="right">
					<Box padding="zero">
						<div style="height:calc(var(--s1) * 2);"></div>
					</Box>
				</div>
			</Bracket>
		</Presentation>

		<Presentation>
			<a slot="title" href="https://every-layout.dev/layouts/cluster/" target="blank"><h5>Cluster</h5></a>
			<Cluster>
				<ul style="list-style: none">
					<li>Content</li>
					<li>Content</li>
					<li>Content</li>
					<li>Content</li>
					<li>Content</li>
				</ul>
			</Cluster>
		</Presentation>

		<Presentation>
			<a slot="title" href="https://every-layout.dev/layouts/sidebar/" target="blank"><h5>Sidebar</h5></a>
			<Sidebar contentMin="70%">
				<div slot="sidebar">
					<Box padding="s-2">
						<p>A</p>
						<p>B</p>
						<p>C</p>
					</Box>
				</div>
				<div slot="not-sidebar">
					<Box>
						<p>Main Content</p>
					</Box>
				</div>
			</Sidebar>
		</Presentation>

		<Presentation>
			<a slot="title" href="https://every-layout.dev/layouts/switcher/" target="blank"><h5>Switcher</h5></a>
			<Switcher threshold="13rem">
				<Box padding="s0"></Box>
				<Box padding="s0"></Box>
				<Box padding="s0"></Box>
			</Switcher>
		</Presentation>

		<Presentation>
			<a slot="title" href="https://every-layout.dev/layouts/cover/" target="blank"><h5>Cover</h5></a>
			<Cover minHeight="10vh">
				<div slot="above">
					<hr>
				</div>
				<Box></Box>
				<div slot="below">
					<hr>
				</div>
			</Cover>
		</Presentation>

		<Presentation>
			<a slot="title" href="https://every-layout.dev/layouts/grid/" target="blank"><h5>Grid</h5></a>
			<div style="min-width: 8rem;">
				<Grid min="s1" space="s0">
					<Box padding="s-3">X</Box>
					<Box padding="s-3">o</Box>
					<Box padding="s-3">o</Box>
					<Box padding="s-3">o</Box>
					<Box padding="s-3">X</Box>
					<Box padding="s-3">o</Box>
					<Box padding="s-3">o</Box>
					<Box padding="s-3">o</Box>
					<Box padding="s-3">X</Box>
				</Grid>
			</div>
		</Presentation>

		<Presentation>
			<a slot="title" href="https://every-layout.dev/layouts/frame/" target="blank"><h5>Frame</h5></a>
			<Box padding="zero">
				<Frame>
					<img src='favicon.png' alt='favicon'>
				</Frame>
			</Box>
		</Presentation>

		<Presentation>
			<a slot="title" href="https://every-layout.dev/layouts/reel/" target="blank"><h5>Reel</h5></a>
			<Box padding="zero" backgroundColor="white">
				<div style="max-width: 12rem;">
					<Reel itemWidth="s2">
						<img src='favicon.png' alt='favicon'>
						<img src='favicon.png' alt='favicon'>
						<img src='favicon.png' alt='favicon'>
						<img src='favicon.png' alt='favicon'>
						<img src='favicon.png' alt='favicon'>
						<img src='favicon.png' alt='favicon'>
						<img src='favicon.png' alt='favicon'>
						<img src='favicon.png' alt='favicon'>
						<img src='favicon.png' alt='favicon'>
						<img src='favicon.png' alt='favicon'>
					</Reel>
				</div>
			</Box>
		</Presentation>
	</Grid>
	<div slot="below">
		<Bracket>
			<a href="#top"><p>Back to top</p></a>
		</Bracket>
	</div>
</Cover>
