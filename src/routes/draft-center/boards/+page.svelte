<script lang="ts">
	import { ArrowLeft, Pencil, Trash2 } from '@lucide/svelte';
	import Card from '$lib/components/Card.svelte';
	import { buttonOptions } from '$lib/components/Button.options';
	import { renameDraftBoardForm } from '$lib/remote/boards.remote';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { PendingForm } from '$lib/forms/pending-form.svelte';

	let { data, form } = $props();
	let boards = $derived(data.boards);
	let renameUnexpectedErrors = $state<Record<number, string>>({});
	const pageActions = new PendingForm();

	function enhanceDelete(draftBoardId: number, boardName: string): SubmitFunction {
		const submit = pageActions.enhance(`delete-${draftBoardId}`);

		return (input) => {
			if (
				!confirm(
					`Delete "${boardName}"? This removes every pick on this board and cannot be undone.`
				)
			) {
				input.cancel();
				return;
			}

			return submit(input);
		};
	}

	function enhanceRenameForm(draftBoardId: number) {
		const renameForm = renameDraftBoardForm.for(draftBoardId);

		return renameForm.enhance(async ({ submit }) => {
			renameUnexpectedErrors[draftBoardId] = '';

			if (renameForm.pending > 1) {
				return;
			}

			try {
				const succeeded = await submit();
				const result = renameForm.result;

				if (succeeded && result) {
					boards = boards.map((board) =>
						board.id === draftBoardId ? { ...board, name: result.name } : board
					);
				}
			} catch {
				renameUnexpectedErrors[draftBoardId] =
					'Unable to rename this board right now. Your previous name is still saved.';
			}
		});
	}
</script>

<svelte:head>
	<title>Draft Boards | Hockey Draft Showdown</title>
</svelte:head>

<div class="bg-offWhite min-h-svh px-4 pb-16">
	<div class="mx-auto flex max-w-screen-xl flex-col gap-8">
		<nav
			aria-label="Draft board navigation"
			class="flex flex-wrap items-center justify-between gap-3"
		>
			<a href="/draft-center" class={buttonOptions({ variant: 'secondary', size: 'md' })}>
				<ArrowLeft class="mr-2 inline size-4" aria-hidden="true" />
				Back to Draft Center
			</a>
			<a href="/draft-center/leagues" class={buttonOptions({ variant: 'outline', size: 'md' })}
				>Leagues</a
			>
		</nav>

		<section class="shadow-section-shadow border-[5px] border-black bg-white p-5 md:p-8">
			<div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
				<div>
					<p
						class="bg-primary mb-2 inline-block border-[3px] border-black px-3 py-1 text-sm font-black text-white uppercase"
					>
						Draft Boards
					</p>
					<h1 class="text-4xl leading-none font-black uppercase md:text-6xl">Manage your boards</h1>
					<p class="mt-3 max-w-2xl text-lg font-semibold text-gray-700">
						Create multiple predictions, submit them before lock, and choose which board enters
						global or private leagues.
					</p>
				</div>
			</div>
		</section>

		<section class="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
			<form
				method="post"
				action="?/create"
				class="shadow-section-shadow flex flex-col gap-4 border-[5px] border-black bg-white p-5"
				use:enhance={pageActions.enhance('create')}
				aria-busy={pageActions.is('create')}
			>
				<h2 class="text-2xl font-black uppercase">New Board</h2>
				<label class="flex flex-col gap-2 font-bold">
					<span class="uppercase">Board name</span>
					<input
						name="name"
						value={form?.name || ''}
						class="border-[3px] border-black px-3 py-2"
						placeholder="Upside Swing Board"
					/>
				</label>
				{#if form?.createError}
					<p class="font-bold text-red-700">{form.createError}</p>
				{/if}
				<button
					class={buttonOptions({
						variant: 'primary',
						size: 'lg',
						class: pageActions.is('create') ? 'pending-control' : ''
					})}
					type="submit"
					disabled={pageActions.current !== null}
				>
					{pageActions.is('create') ? 'Creating Board...' : 'Create Board'}
				</button>
			</form>

			<div class="flex flex-col gap-4">
				<div>
					<h2 class="text-3xl font-black uppercase">My Boards</h2>
				</div>

				{#if form?.duplicateError}
					<p class="border-[3px] border-black bg-red-100 p-3 font-bold text-red-700">
						{form.duplicateError}
					</p>
				{/if}
				{#if form?.setGlobalError}
					<p class="border-[3px] border-black bg-red-100 p-3 font-bold text-red-700">
						{form.setGlobalError}
					</p>
				{/if}
				{#if form?.deleteError}
					<p class="border-[3px] border-black bg-red-100 p-3 font-bold text-red-700">
						{form.deleteError}
					</p>
				{/if}

				{#if boards.length === 0}
					<div class="border-[4px] border-dashed border-black bg-white p-6 text-center font-bold">
						No boards yet. Create one to get started.
					</div>
				{:else}
					<div class="grid gap-4">
						{#each boards as board}
							{@const renameForm = renameDraftBoardForm.for(board.id)}
							<Card class="shadow-brut-shadow-sm bg-white">
								<div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
									<div>
										<div class="flex flex-wrap items-center gap-2">
											<h3 class="text-2xl font-black">{board.name}</h3>
											{#if board.id === data.selectedGlobalBoardId}
												<span
													class="bg-accent border-[3px] border-black px-2 py-1 text-xs font-black uppercase"
													>Global</span
												>
											{/if}
											<span class="border-[3px] border-black px-2 py-1 text-xs font-black uppercase"
												>{board.status}</span
											>
										</div>
										<p class="mt-1 font-semibold text-gray-700">
											{board.pickCount} pick{board.pickCount === 1 ? '' : 's'}
											{#if board.leagueEntryCount > 0}
												· Used in {board.leagueEntryCount} league{board.leagueEntryCount === 1
													? ''
													: 's'}
											{/if}
										</p>
									</div>
									<div class="flex flex-wrap items-center gap-2">
										<a
											class={buttonOptions({ variant: 'secondary', size: 'sm' })}
											href={`/draft-center?board=${board.id}`}
										>
											<Pencil class="mr-1 inline size-4" aria-hidden="true" />
											Edit Picks
										</a>
										<form
											method="post"
											action="?/duplicate"
											class="flex gap-2"
											use:enhance={pageActions.enhance(`duplicate-${board.id}`)}
											aria-busy={pageActions.is(`duplicate-${board.id}`)}
										>
											<input type="hidden" name="sourceDraftBoardId" value={board.id} />
											<input type="hidden" name="name" value={`Copy of ${board.name}`} />
											<button
												class={buttonOptions({
													variant: 'outline',
													size: 'sm',
													class: pageActions.is(`duplicate-${board.id}`) ? 'pending-control' : ''
												})}
												type="submit"
												disabled={pageActions.current !== null}
											>
												{pageActions.is(`duplicate-${board.id}`) ? 'Duplicating...' : 'Duplicate'}
											</button>
										</form>
										<form
											method="post"
											action="?/setGlobal"
											use:enhance={pageActions.enhance(`global-${board.id}`)}
											aria-busy={pageActions.is(`global-${board.id}`)}
										>
											<input type="hidden" name="draftBoardId" value={board.id} />
											<button
												class={buttonOptions({
													variant: 'primary',
													size: 'sm',
													class: pageActions.is(`global-${board.id}`) ? 'pending-control' : ''
												})}
												type="submit"
												disabled={board.status !== 'submitted' ||
													board.id === data.selectedGlobalBoardId ||
													pageActions.current !== null}
											>
												{pageActions.is(`global-${board.id}`) ? 'Updating...' : 'Use Global'}
											</button>
										</form>
									</div>
								</div>

								<div
									class="mt-5 grid gap-3 border-t-[3px] border-black pt-4 md:grid-cols-[1fr_auto]"
								>
									<form
										{...enhanceRenameForm(board.id)}
										class="flex min-w-0 flex-col gap-2 sm:flex-row"
										aria-busy={renameForm.pending > 0}
									>
										<label class="sr-only" for={`board-name-${board.id}`}>Rename {board.name}</label
										>
										<input
											{...renameForm.fields.name.as('text')}
											id={`board-name-${board.id}`}
											value={board.name}
											maxlength="60"
											class="min-w-0 flex-1 border-[3px] border-black px-3 py-2 font-bold"
										/>
										<button
											class={buttonOptions({
												variant: 'outline',
												size: 'sm',
												shadow: 'none',
												class: renameForm.pending > 0 ? 'pending-control' : ''
											})}
											type="submit"
											disabled={renameForm.pending > 0}
										>
											{renameForm.pending > 0 ? 'Renaming...' : 'Rename'}
										</button>
									</form>

									<form
										method="post"
										action="?/delete"
										use:enhance={enhanceDelete(board.id, board.name)}
										aria-busy={pageActions.is(`delete-${board.id}`)}
									>
										<input type="hidden" name="draftBoardId" value={board.id} />
										<button
											class={buttonOptions({
												variant:
													board.isDefault ||
													board.globalEntryCount > 0 ||
													board.leagueEntryCount > 0 ||
													boards.length === 1
														? 'disabled'
														: 'danger',
												size: 'sm',
												shadow: 'none',
												class: pageActions.is(`delete-${board.id}`) ? 'pending-control' : ''
											})}
											type="submit"
											disabled={board.isDefault ||
												board.globalEntryCount > 0 ||
												board.leagueEntryCount > 0 ||
												boards.length === 1 ||
												pageActions.current !== null}
											title={boards.length === 1
												? 'You must keep at least one board'
												: board.isDefault || board.globalEntryCount > 0
													? 'Choose another global board first'
													: board.leagueEntryCount > 0
														? 'Choose another board in each league first'
														: 'Delete this board'}
										>
											<Trash2 class="mr-1 inline size-4" aria-hidden="true" />
											{pageActions.is(`delete-${board.id}`) ? 'Deleting...' : 'Delete Board'}
										</button>
									</form>

									<div class="md:col-span-2" aria-live="polite">
										{#each renameForm.fields.allIssues() as issue}
											<p class="font-bold text-red-700">{issue.message}</p>
										{/each}
										{#if renameUnexpectedErrors[board.id]}
											<p class="font-bold text-red-700">{renameUnexpectedErrors[board.id]}</p>
										{:else if renameForm.result}
											<p class="font-bold text-green-700">Board renamed.</p>
										{/if}
									</div>
								</div>

								{#if form?.renameError && form.renameBoardId === board.id}
									<p class="mt-3 font-bold text-red-700">{form.renameError}</p>
								{/if}
							</Card>
						{/each}
					</div>
				{/if}
			</div>
		</section>
	</div>
</div>
