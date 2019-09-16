<script>
	import Stack from './layout/Stack.svelte';
	import Box from './layout/Box.svelte';
	import Bracket from './layout/Bracket.svelte';
</script>

<Bracket>
	<div slot="left">
		<p>left</p>
	</div>
	<div slot="center">
		<Stack splitAfter="2" recursive="true">
			<p>one</p>
			<Box>
				<ul>
					<Box>
						<li>1</li>
					</Box>			
					<Box>
						<li>2</li>
					</Box>
					<Box>
						<li>3</li>
					</Box>
					<li>4</li>
				</ul>
			</Box>
			<p>two</p>
			<p>three</p>
		</Stack>
	</div>
	<div slot="right">
		<p>right</p>
	</div>
</Bracket>
