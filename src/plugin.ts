import * as PACKAGE from '../package.json'

BBPlugin.register(PACKAGE.name, {
	title: PACKAGE.title,
	author: PACKAGE.author.name,
	description: PACKAGE.description,
	icon: 'icon.svg',
	variant: 'both',
	version: PACKAGE.version,
	min_version: PACKAGE.min_blockbench_version,
	tags: PACKAGE.tags as [string, string, string],
	repository: PACKAGE.repository.url,
	bug_tracker: PACKAGE.repository.url + '/issues',
	has_changelog: true,
	onload() {},
	onunload() {},
	oninstall() {},
	onuninstall() {},
	await_loading: true,
})
