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
</script>

<Cover>
	<div slot="above">
		<Bracket>
			<div slot="center">
				<a href="https://every-layout.dev/" target="blank"><h1>EveryLayout in Svelte</h1></a>
			</div>
		</Bracket>
	</div>
	<div slot="center">
		<Grid min="18rem">
			<Box backgroundColor="white">
				<Bracket>
					<div slot="center">
						<a href="https://every-layout.dev/layouts/stack/" target="blank"><h5>Stack</h5></a>
						<br>
						<Stack recursive="true">
							<ul>
								<li><hr></li>
								<li><hr></li>
								<li><hr></li>
							</ul>
						</Stack>
					</div>
				</Bracket>
			</Box>
			<Box backgroundColor="white">
				<Bracket>
					<div slot="center">
						<a href="https://every-layout.dev/layouts/box/" target="blank"><h5>Box</h5></a>
						<br>
						<Box></Box>
					</div>
				</Bracket>
			</Box>
			<Box backgroundColor="white">
				<Bracket>
					<div slot="center">
						<a href="https://every-layout.dev/layouts/center/" target="blank"><h5>Bracket</h5></a>
						<br>
						<Bracket>
							<div slot="left">
								<Box padding="zero">
									<div style="height:calc(var(--s0) * 2);"></div>
								</Box>
							</div>
							<div slot="center">
								<Box padding="s0"></Box>
							</div>
							<div slot="right">
								<Box padding="zero">
									<div style="height:calc(var(--s0) * 2);"></div>
								</Box>
							</div>
						</Bracket>
					</div>
				</Bracket>
			</Box>
			<Box backgroundColor="white">
				<Bracket>
					<div slot="center">
						<a href="https://every-layout.dev/layouts/cluster/" target="blank"><h5>Cluster</h5></a>
						<br>
						<Cluster>
							<ul style="list-style: none">
								<li>Content</li>
								<li>Content</li>
								<li>Content</li>
								<li>Content</li>
								<li>Content</li>
							</ul>
						</Cluster>
					</div>
				</Bracket>
			</Box>
			<Box backgroundColor="white">
				<Bracket>
					<div slot="center">
						<a href="https://every-layout.dev/layouts/sidebar/" target="blank"><h5>Sidebar</h5></a>
						<br>
						<Sidebar contentMin="73%">
							<div slot="sidebar">
								<Box padding="s-2">
									<ul>
										<li>A</li>
										<li>B</li>
										<li>C</li>
										<li>D</li>
									</ul>
								</Box>
							</div>
							<div slot="not-sidebar">
								<Box>
									<p>Main Content</p>
								</Box>
							</div>
						</Sidebar>
					</div>
				</Bracket>
			</Box>
			<Box backgroundColor="white">
				<Bracket>
					<div slot="center">
						<a href="https://every-layout.dev/layouts/switcher/" target="blank"><h5>Switcher</h5></a>
						<br>
						<Switcher threshold="13rem">
							<Box></Box>
							<Box></Box>
							<Box></Box>
						</Switcher>
					</div>
				</Bracket>
			</Box>
			<Box backgroundColor="white">
				<Bracket>
					<div slot="center">
						<a href="https://every-layout.dev/layouts/cover/" target="blank"><h5>Cover</h5></a>
						<br>
						<Cover minHeight="10vh">
							<div slot="above">
								<hr>
							</div>
							<div slot="center">
								<Box></Box>
							</div>
							<div slot="below">
								<hr>
							</div>
						</Cover>
					</div>
				</Bracket>
			</Box>
			<Box backgroundColor="white">
				<Bracket>
					<div slot="center">
						<a href="https://every-layout.dev/layouts/grid/" target="blank"><h5>&nbsp;&nbsp;&nbsp;&nbsp;Grid&nbsp;&nbsp;&nbsp;&nbsp;</h5></a>
						<br>
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
				</Bracket>
			</Box>
			<Box backgroundColor="white">
				<Bracket>
					<div slot="center">
						<a href="https://every-layout.dev/layouts/frame/" target="blank"><h5>Frame</h5></a>
						<br>
						<Box padding="zero">
							<Frame>
								<img src='favicon.png' alt='favicon'>
							</Frame>
						</Box>
					</div>
				</Bracket>
			</Box>
			<Box backgroundColor="white">
				<Bracket space="zero">
					<div slot="center">
						<a href="https://every-layout.dev/layouts/reel/" target="blank"><h5>Reel</h5></a>
						<br>
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
					</div>
				</Bracket>
			</Box>
		</Grid>
	</div>
	<div slot="below">
		
	</div>
</Cover>
