<script>
	import Cover from './layout/Cover.svelte';
	import Bracket from './layout/Bracket.svelte';
</script>

<Cover>
	<div slot="center">
		<Bracket intrinsic={true}>
			<p slot="center">center</p>
		</Bracket>
	</div>
</Cover>