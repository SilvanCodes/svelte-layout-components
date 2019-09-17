<script>
	import Switcher from './layout/Switcher.svelte';
	import Cover from './layout/Cover.svelte';
	import Box from './layout/Box.svelte';
</script>

<Cover>
	<div slot="center">
		<Switcher limit="10">
			<Box>
				<Box></Box>
				<Box></Box>
				<Box></Box>
			</Box>
		</Switcher>	
	</div>
</Cover>
