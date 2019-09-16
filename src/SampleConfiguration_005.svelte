<script>
	import Cover from './layout/Cover.svelte';
	import Bracket from './layout/Bracket.svelte';
	import Cluster from './layout/Cluster.svelte';
</script>

<Cover>
	<div slot="center">
		<Bracket intrinsic={true}>
			<div slot="center">
				<p>WIDE CONTENT</p>
				<Cluster>
					<ul>
						<li>A</li>
						<li>B</li>
						<li>C</li>
						<li>D</li>
						<li>E</li>
						<li>F</li>
						<li>G</li>
						<li>H</li>
					</ul>
				</Cluster>
			</div>
		</Bracket>
	</div>
</Cover>
