/**
* Docs View
*
* Displays installation documentation for the selected provider
* and currently chosen OS (mac/linux/windows).
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Docs',

	DefaultRenderable: 'Docs-Content',
	DefaultDestinationAddress: '#RightPanel',
	DefaultTemplateRecordAddress: 'AppData.Tool',

	AutoRender: false,
	AutoInitialize: false,

	Templates:
	[
		{
			Hash: 'Docs-Template',
			Template: ''
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'Docs-Content',
			TemplateHash: 'Docs-Template',
			ContentDestinationAddress: '#RightPanel',
			RenderMethod: 'replace'
		}
	]
};

class DocsView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	render()
	{
		let tmpTool = this.pict.AppData.Tool;
		let tmpKey = tmpTool.SelectedProvider;
		let tmpOS = tmpTool.DocsOS;
		let tmpProv = this.pict.AppData.Providers[tmpKey];

		if (!tmpProv)
		{
			return this;
		}

		let tmpOSLabels = { mac: 'macOS', linux: 'Linux', windows: 'Windows' };
		let tmpOSLabel = tmpOSLabels[tmpOS] || tmpOS;

		let tmpLines = [];
		tmpLines.push(`{bold}{cyan-fg}${tmpProv.Label} - Local Installation Guide (${tmpOSLabel}){/cyan-fg}{/bold}`);
		tmpLines.push(`{gray-fg}Switch OS: [1] macOS  [2] Linux  [3] Windows | Current: ${tmpOSLabel}{/gray-fg}`);
		tmpLines.push('');

		let tmpMarkdown = this.pict.ProcessManager.readDocumentation(tmpKey, tmpOS);

		// Basic markdown to blessed tag conversion
		let tmpConverted = tmpMarkdown
			// Headers
			.replace(/^### (.+)$/gm, '{bold}{underline}$1{/underline}{/bold}')
			.replace(/^## (.+)$/gm, '{bold}{yellow-fg}$1{/yellow-fg}{/bold}')
			.replace(/^# (.+)$/gm, '{bold}{cyan-fg}$1{/cyan-fg}{/bold}')
			// Inline code
			.replace(/`([^`]+)`/g, '{cyan-fg}$1{/cyan-fg}')
			// Bold
			.replace(/\*\*([^*]+)\*\*/g, '{bold}$1{/bold}');

		tmpLines.push(tmpConverted);

		let tmpWidget = this.pict.ContentAssignment.customGetElementFunction('#RightPanel');
		if (tmpWidget && tmpWidget.length > 0)
		{
			tmpWidget[0].setContent(tmpLines.join('\n'));
			tmpWidget[0].setScrollPerc(0);
		}

		return this;
	}
}

module.exports = DocsView;
module.exports.default_configuration = _ViewConfiguration;
