<script lang="ts">
	import { getDraftSystem } from '$lib/global-state/prospect-state.svelte';
	import { getCurrentUser } from '$lib/global-state/user-state.svelte';
	import Button from './Button.svelte';
	import * as Dialog from "$lib/components/ui/dialog/index.js";
	// @ts-ignore - dom-to-image-more doesn't have types
	import * as domtoimage from 'dom-to-image-more';
	import { toast } from 'svelte-french-toast';
	import { buttonOptions } from './Button.options';

	const draftSystem = getDraftSystem();
	const currentUser = getCurrentUser();

	let shareDialogOpen = $state(false);
	let isGeneratingImage = $state(false);
	let generatedImageUrl = $state<string | null>(null);
	let shareImageRef: HTMLDivElement;

	// Get top 10 drafted picks
	const top10Picks = $derived(() => {
		if (!draftSystem?.draftBoard) return [];
		
		return draftSystem.draftBoard
			.filter(pick => pick.prospect !== null)
			.slice(0, 10)
			.map(pick => ({
				position: pick.draftPosition,
				name: pick.prospect?.name || 'Unknown',
				team: pick.prospect?.team || '',
				position_played: pick.prospect?.position || '',
				teamName: pick.teamName || '',
				teamLogo: pick.teamLogo ? `/api/proxy-team-logo?url=${encodeURIComponent(pick.teamLogo)}` : ''
			}));
	});

	// Split top 10 into left (1-5) and right (6-10)
	const leftColumn = $derived(() => top10Picks().slice(0, 5));
	const rightColumn = $derived(() => top10Picks().slice(5, 10));

	async function generateShareImage() {
		isGeneratingImage = true;
		try {
			// First try: VPS service (highest priority)
			try {
				console.log('Attempting VPS service generation...');
				const vpsResponse = await fetch('/api/generate-share-image', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						picks: top10Picks().map(pick => ({
							position: pick.position,
							name: pick.name,
							team: pick.team,
							position_played: pick.position_played,
							// Extract the original NHL logo URL from the proxy URL
							teamLogo: pick.teamLogo ? decodeURIComponent(pick.teamLogo.replace('/api/proxy-team-logo?url=', '')) : ''
						}))
					})
				});

				console.log('VPS service response status:', vpsResponse.status);

				if (vpsResponse.ok) {
					const imageBlob = await vpsResponse.blob();
					generatedImageUrl = URL.createObjectURL(imageBlob);
					toast.success('Perfect quality image generated with VPS service! 🏒✨');
					console.log('VPS service generation successful - perfect quality with shadows and logos!');
					return;
				} else {
					const errorText = await vpsResponse.text();
					console.error('VPS service generation failed:', vpsResponse.status, errorText);
					toast.error(`VPS service failed (${vpsResponse.status}). Trying Vercel backup...`);
				}
			} catch (vpsError) {
				console.error('VPS service generation error:', vpsError);
				toast.error('VPS service unavailable. Trying Vercel backup...');
			}

			// Second try: Vercel server-side generation (backup)
			try {
				console.log('Attempting Vercel server-side generation...');
				const response = await fetch('/api/backup-generate-share-image', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify({
						picks: top10Picks().map(pick => ({
							position: pick.position,
							name: pick.name,
							team: pick.team,
							position_played: pick.position_played,
							// Extract the original NHL logo URL from the proxy URL
							teamLogo: pick.teamLogo ? decodeURIComponent(pick.teamLogo.replace('/api/proxy-team-logo?url=', '')) : ''
						}))
					})
				});

				console.log('Vercel response status:', response.status);

				if (response.ok) {
					const imageBlob = await response.blob();
					generatedImageUrl = URL.createObjectURL(imageBlob);
					toast.success('Perfect quality image generated with Vercel backup! 🏒✨');
					console.log('Vercel server-side generation successful');
					return;
				} else {
					const errorText = await response.text();
					console.error('Vercel server-side generation failed:', response.status, errorText);
					if (response.status === 429) {
						toast.error('Rate limit reached. Trying client-side fallback...');
					} else {
						toast.error(`Vercel generation failed (${response.status}). Trying client-side fallback...`);
					}
				}
			} catch (serverError) {
				console.error('Vercel server-side generation error:', serverError);
				toast.error('Vercel server unavailable. Trying client-side fallback...');
			}

			// Fallback: Client-side generation
			if (!shareImageRef) {
				toast.error('Unable to generate image. Please try again.');
				return;
			}

			// Wait for images to load before capturing
			const images = shareImageRef.querySelectorAll('img');
			await Promise.all(Array.from(images).map(img => {
				return new Promise((resolve) => {
					if (img.complete) {
						resolve(true);
					} else {
						img.onload = () => resolve(true);
						img.onerror = () => resolve(true); // Continue even if image fails
					}
				});
			}));

			let dataUrl: string;
			
			// Try different approaches to get the best quality with shadows
			try {
				// First try: SVG generation (often preserves shadows better)
				dataUrl = await domtoimage.toSvg(shareImageRef, {
					bgcolor: '#ffffff',
					style: {
						'font-family': 'Courier New, monospace',
						'box-shadow': 'inherit',
						'filter': 'inherit',
						'-webkit-font-smoothing': 'antialiased'
					},
					filter: (node: any) => {
						// Include everything since logos now work
						return true;
					}
				});
				
				// Convert SVG to high-res PNG
				const svgImg = new Image();
				await new Promise((resolve, reject) => {
					svgImg.onload = resolve;
					svgImg.onerror = reject;
					svgImg.src = dataUrl;
				});
				
				const canvas = document.createElement('canvas');
				const ctx = canvas.getContext('2d');
				if (!ctx) throw new Error('Canvas context not available');
				
				// High resolution canvas
				const scale = 2;
				canvas.width = 800 * scale;
				canvas.height = 600 * scale;
				
				// Scale the context to ensure crisp rendering
				ctx.scale(scale, scale);
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = 'high';
				
				// Draw the SVG onto canvas
				ctx.drawImage(svgImg, 0, 0, 800, 600);
				
				dataUrl = canvas.toDataURL('image/png', 1.0);
				
			} catch (svgError) {
				console.warn('SVG approach failed, trying PNG direct:', svgError);
				
				// Fallback: Direct PNG with optimized settings
				dataUrl = await domtoimage.toPng(shareImageRef, {
					quality: 1.0,
					bgcolor: '#ffffff',
					pixelRatio: 2,
					style: {
						'font-family': 'Courier New, monospace !important',
						'box-shadow': 'inherit !important',
						'filter': 'inherit !important',
						'-webkit-font-smoothing': 'antialiased !important',
						'text-rendering': 'optimizeLegibility !important'
					},
					// Use cacheBust to avoid rendering issues
					cacheBust: true,
					filter: (node: any) => {
						return true;
					}
				});
			}

			generatedImageUrl = dataUrl;
			toast.success('Share image generated using client-side fallback 📸');
			console.log('Client-side generation used - image quality may be limited compared to server-side');
			
		} catch (error) {
			console.error('Error generating image:', error);
			toast.error('Failed to generate share image. Please try again.');
		} finally {
			isGeneratingImage = false;
		}
	}

	function downloadImage() {
		if (!generatedImageUrl) return;

		const link = document.createElement('a');
		link.download = `my-nhl-draft-top10-${new Date().getTime()}.png`;
		link.href = generatedImageUrl;
		link.click();
	}

	async function shareToTwitter() {
		if (!generatedImageUrl) {
			toast.error('Please generate an image first!');
			return;
		}
		
		// Copy image to clipboard first
		await copyToClipboard();
		
		// Small delay to ensure clipboard operation completes
		setTimeout(() => {
			// Then open Twitter with text
			const text = `Check out my NHL Draft Top 10 picks! 🏒 #NHLDraft #HockeyDraftShowdown\n\nPlay at: https://hockeydraftshowdown.com`;
			const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
			window.open(url, '_blank');
			
			// Show instruction toast
			toast('📋 Image copied! Paste it in your tweet.', { duration: 6000 });
		}, 100);
	}

	async function shareToBluesky() {
		if (!generatedImageUrl) {
			toast.error('Please generate an image first!');
			return;
		}
		
		// Copy image to clipboard first
		await copyToClipboard();
		
		// Small delay to ensure clipboard operation completes
		setTimeout(() => {
			// Then open Bluesky with text
			const text = `Check out my NHL Draft Top 10 picks! 🏒 #NHLDraft #HockeyDraftShowdown\n\nPlay at: https://hockeydraftshowdown.com`;
			const url = `https://bsky.app/intent/compose?text=${encodeURIComponent(text)}`;
			window.open(url, '_blank');
			
			// Show instruction toast
			toast('📋 Image copied! Paste it in your Bluesky post.', { duration: 6000 });
		}, 100);
	}

	async function copyToClipboard() {
		if (!generatedImageUrl) return;
		
		try {
			// Convert data URL to blob and copy to clipboard
			const response = await fetch(generatedImageUrl);
			const blob = await response.blob();
			
			// Check if clipboard API is supported
			if (navigator.clipboard && window.ClipboardItem) {
				await navigator.clipboard.write([
					new ClipboardItem({ 'image/png': blob })
				]);
				toast.success('Image copied to clipboard!');
			} else {
				// Fallback: try to copy the image URL
				await navigator.clipboard.writeText('Image ready for download - use the Download button');
				toast('Clipboard not supported - use Download button instead', { duration: 4000 });
			}
		} catch (error) {
			console.error('Clipboard error:', error);
			toast.error('Failed to copy image - try the Download button instead');
		}
	}

	// Check if user has completed their top 10 picks
	const canShare = $derived(() => top10Picks().length >= 10);
  const triggerStyles = $derived.by(() => {
    return canShare() ? buttonOptions({ variant: 'outline' }) : buttonOptions({ variant: 'disabled' });
  })
</script>

<Dialog.Root bind:open={shareDialogOpen}>
	<!-- {#if canShare()} -->
		<Dialog.Trigger  class={triggerStyles} disabled={!canShare()}>
				Share My Top 10 🔥
		</Dialog.Trigger>
	<!-- {/if} -->

	<Dialog.Content class="max-w-[98%] w-full md:max-w-[900px] max-h-[95vh] overflow-y-auto rounded-none shadow-section-shadow">
		<Dialog.Header>
			<Dialog.Title class="text-xl md:text-2xl font-extrabold uppercase text-center mb-2 md:mb-4">
				Share Your Draft Picks
			</Dialog.Title>
		</Dialog.Header>

		<div class="space-y-4 md:space-y-6">
			<!-- Preview of the shareable image -->
			<div class="border-[3px] border-black p-2 md:p-4 bg-gray-50">
				<h3 class="font-bold mb-2 md:mb-4 text-center text-sm md:text-base">Preview (this is what gets shared):</h3>
				
				<!-- This is the component that gets rendered as an image -->
				<div class="w-full overflow-x-auto">
					<div bind:this={shareImageRef} class="share-image-container mx-auto" style="width: 800px; min-height: 600px;">
						<div class="bg-white p-8 border-[5px] border-black shadow-section-shadow" style="width: 800px; min-height: 600px; box-sizing: border-box;">
							<!-- Header -->
							<div class="text-center mb-8">
								<h1 class="text-4xl font-extrabold uppercase tracking-tight text-black mb-2">
									My NHL Draft Top 10
								</h1>
								<div class="w-full h-[5px] bg-primary mb-4"></div>
								<p class="text-lg font-bold text-gray-700">
									🏒 HockeyDraftShowdown.com 🏒
								</p>
							</div>

							<!-- Two column layout -->
							<div class="grid grid-cols-2 gap-8" style="min-height: 400px;">
								<!-- Left column (1-5) -->
								<div class="space-y-4">
									{#each leftColumn() as pick}
										<div class="flex items-center gap-3 p-4 border-[3px] border-black bg-white shadow-brut-shadow">
											<span class="text-black font-extrabold text-xl z-10">{pick.position}</span>
											{#if pick.teamLogo}
												<img 
													class="h-[50px] w-[50px] object-contain" 
													src={pick.teamLogo} 
													alt="{pick.teamName} logo"
													loading="eager"
												/>
											{/if}
											<div class="flex-1 min-w-0">
												<p class="font-extrabold text-lg text-black truncate">{pick.name}</p>
												<p class="text-sm font-bold text-gray-700 uppercase">{pick.team} • {pick.position_played}</p>
											</div>
										</div>
									{/each}
								</div>

								<!-- Right column (6-10) -->
								<div class="space-y-4">
									{#each rightColumn() as pick}
										<div class="flex items-center gap-3 p-4 border-[3px] border-black bg-white shadow-brut-shadow">
											<span class="text-black font-extrabold text-xl z-10">{pick.position}</span>
											{#if pick.teamLogo}
												<img 
													class="h-[50px] w-[50px] object-contain" 
													src={pick.teamLogo} 
													alt="{pick.teamName} logo"
													loading="eager"
												/>
											{/if}
											<div class="flex-1 min-w-0">
												<p class="font-extrabold text-lg text-black truncate">{pick.name}</p>
												<p class="text-sm font-bold text-gray-700 uppercase">{pick.team} • {pick.position_played}</p>
											</div>
										</div>
									{/each}
								</div>
							</div>

							<!-- Footer -->
							<div class="text-center mt-8 pt-6 border-t-[3px] border-black border-dashed">
								<p class="text-sm font-bold text-gray-600 uppercase tracking-wide">
									🏒 Play at HockeyDraftShowdown.com 🏒
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Action buttons -->
			<div class="flex flex-wrap gap-2 md:gap-4 justify-center px-1 md:px-2">
				{#if !generatedImageUrl}
					<Button
						variant="primary"
						onclick={generateShareImage}
						disabled={isGeneratingImage}
					>
						{isGeneratingImage ? 'Generating...' : 'Generate Image'}
					</Button>
				{:else}
					<Button variant="primary" onclick={shareToBluesky}>
						📤 Bluesky + Copy Image
					</Button>
					
					<Button variant="primary" onclick={shareToTwitter}>
						📤 Twitter + Copy Image
					</Button>

					<Button variant="info" onclick={copyToClipboard}>
						Copy to Clipboard
					</Button>
					
					<Button variant="outline" onclick={downloadImage}>
						Download Image
					</Button>
				{/if}
			</div>

			{#if generatedImageUrl}
				<div class="border-[3px] border-black p-2 md:p-4 bg-accent/20 mx-1 md:mx-2">
					<h4 class="font-bold mb-2 text-sm md:text-base">✅ Image Generated!</h4>
					<p class="text-xs md:text-sm">
						<strong>How to share:</strong><br>
						• <strong>Download:</strong> Save image to your device<br>
						• <strong>Copy to Clipboard:</strong> Paste directly into Discord/Slack<br>
						• <strong>Twitter/Bluesky:</strong> Opens compose window + copies image - just paste!<br><br>
						<strong>Social sharing includes a link to HockeyDraftShowdown.com!</strong>
					</p>
				</div>
			{/if}

			{#if !canShare()}
				<div class="border-[3px] border-black p-2 md:p-4 bg-red-100 mx-1 md:mx-2">
					<p class="font-bold text-red-800 text-sm md:text-base">
						You need to complete your top 10 draft picks before you can share them!
					</p>
				</div>
			{/if}
		</div>
	</Dialog.Content>
</Dialog.Root>

<style>
	/* Ensure the share image renders consistently */
	:global(.share-image-container) {
		font-family: "Courier New", monospace;
		width: 800px;
		min-height: 600px;
		overflow: visible !important;
		position: relative;
	}

	/* Hide scrollbars in the share image */
	:global(.share-image-container *) {
		scrollbar-width: none;
		-ms-overflow-style: none;
	}
	
	:global(.share-image-container *::-webkit-scrollbar) {
		display: none;
	}

	/* Ensure images load properly for html2canvas */
	:global(.share-image-container img) {
		display: block;
		max-width: none;
		height: auto;
		-webkit-user-drag: none;
		user-select: none;
	}

	/* Ensure consistent rendering */
	:global(.share-image-container) {
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		font-feature-settings: "kern" 1;
		text-rendering: optimizeLegibility;
	}

	/* Force proper layout for the grid */
	:global(.share-image-container .grid) {
		display: grid !important;
		grid-template-columns: 1fr 1fr !important;
		gap: 2rem !important;
		min-height: 400px !important;
	}

	/* Ensure proper spacing */
	:global(.share-image-container .space-y-4 > *) {
		margin-bottom: 1rem !important;
	}
</style>
