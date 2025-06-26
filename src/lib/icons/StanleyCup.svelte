<script lang="ts">
	let { size = 32, color = '#000' }: { size?: number; color?: string } = $props();
</script>

<svg
	viewBox="0 0 200 250"
	width={`${size}px`}
	height={`${size}px`}
	xml:space="preserve"
	fill="none"
	stroke={color}
	stroke-width="4"
	stroke-linejoin="round"
>
	<!-- Cup Bowl - simple semicircle facing UP -->
	<path d="M 70 40 Q 70 70 100 70 Q 130 70 130 40 Z" fill={color} stroke="none" />
	
	<!-- Stepped stem sections -->
	<rect x="85" y="70" width="30" height="12" fill={color} stroke="none" />
	<rect x="80" y="82" width="40" height="10" fill={color} stroke="none" />
	<rect x="75" y="92" width="50" height="12" fill={color} stroke="none" />
	<rect x="70" y="104" width="60" height="15" fill={color} stroke="none" />
	
	<!-- Main cylindrical body - 3 sections instead of 4 -->
	<rect x="50" y="119" width="100" height="90" fill={color} stroke="none" />
	
	<!-- Horizontal dividing lines for 3 sections -->
	<line x1="50" y1="149" x2="150" y2="149" stroke="rgba(255,255,255,0.7)" stroke-width="2" />
	<line x1="50" y1="179" x2="150" y2="179" stroke="rgba(255,255,255,0.7)" stroke-width="2" />
	
	<!-- Base - taller rectangle to close gap -->
	<rect x="45" y="210" width="110" height="25" fill={color} stroke="none" />
	<ellipse cx="100" cy="234" rx="55" ry="12" fill={color} stroke="none" />
	
	<!-- Outer stroke outline -->
	<path d="M 70 40 Q 70 70 100 70 Q 130 70 130 40 
			 L 115 70 L 115 82 L 120 82 L 120 92 L 125 92 L 125 104 L 130 104 L 130 119 
			 L 150 119 L 150 209 L 155 209 L 155 234 L 45 234 L 45 209 L 50 209 L 50 119 L 70 119 L 70 104 
			 L 75 104 L 75 92 L 80 92 L 80 82 L 85 82 L 85 70 L 70 40 Z" 
		  fill="none" stroke={color} stroke-width="4" />
</svg>
