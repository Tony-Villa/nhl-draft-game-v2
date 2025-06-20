<script lang="ts">
	import Card from './Card.svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
</script>


<Card size='md'>
	<div class="prospect-card relative flex flex-col h-full content-between gap-2 pb-4 px-4">
		<!-- Header -->
		<div class="prospect-header flex justify-between mb-[15px] border-black border-b-[3px] pb-[10px]">
			<Skeleton class="h-6 w-16" />
			<Skeleton class="h-10 w-12 border-stone-400 border-[3px] rounded-none" />
		</div>

		<!-- Content -->
		<div class="flex-1 flex flex-col">
			<!-- Name -->
			<div class="prospect-name mb-[5px]">
				<Skeleton class="h-8 w-4/5" />
			</div>

			<!-- Team -->
			<div class="prospect-team mb-[15px] px-2 py-[3px] -skew-x-3">
				<Skeleton class="h-5 w-36 skew-x-3" />
			</div>
			
			<!-- Stats -->
			<div class="prospect-details flex flex-wrap gap-[15px] mt-[15px] border-t-2 border-black border-dashed pt-[15px]">
				<!-- Height -->
				<div class="prospect-stat flex flex-col flex-1 min-w-17">
					<Skeleton class="h-5 w-10 mb-1" />
					<Skeleton class="h-3 w-8" />
				</div>
				<!-- Weight -->
				<div class="prospect-stat flex flex-col flex-1 min-w-17">
					<Skeleton class="h-5 w-12 mb-1" />
					<Skeleton class="h-3 w-8" />
				</div>
				<!-- DOB -->
				<div class="prospect-stat flex flex-col flex-1 min-w-17">
					<Skeleton class="h-5 w-14 mb-1" />
					<Skeleton class="h-3 w-6" />
				</div>
			</div>
		</div>
		
		<!-- Button -->
		<div class="flex justify-center mt-4">
			<Skeleton class="h-12 w-[60%] border-stone-400 border-[3px] rounded-none" />
		</div>
	</div>
</Card>
