/**
* Log View
*
* Displays the stdout/stderr log output from a running harness process.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Log',

	DefaultRenderable: 'Log-Content',
	DefaultDestinationAddress: '#RightPanel',
	DefaultTemplateRecordAddress: 'AppData.Tool',

	AutoRender: false,
	AutoInitialize: false,

	Templates:
	[
		{
			Hash: 'Log-Template',
			Template: ''
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'Log-Content',
			TemplateHash: 'Log-Template',
			ContentDestinationAddress: '#RightPanel',
			RenderMethod: 'replace'
		}
	]
};

class LogView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	render()
	{
		let tmpKey = this.pict.AppData.Tool.SelectedProvider;
		let tmpProv = this.pict.AppData.Providers[tmpKey];

		if (!tmpProv)
		{
			return this;
		}

		let tmpLog = this.pict.ProcessManager.getHarnessLog(tmpKey);
		let tmpLines = [];

		tmpLines.push(`{bold}{cyan-fg}Harness Log: ${tmpProv.Label}{/cyan-fg}{/bold}`);
		tmpLines.push(`{gray-fg}Harness port: ${tmpProv.HarnessPort} | Status: ${tmpProv.HarnessStatus}{/gray-fg}`);
		tmpLines.push('');

		if (!tmpLog || tmpLog.length === 0)
		{
			if (tmpProv.HarnessStatus === 'Running')
			{
				tmpLines.push('{yellow-fg}Waiting for output...{/yellow-fg}');
			}
			else
			{
				tmpLines.push('{gray-fg}No log output. Start the harness with [R] to see output here.{/gray-fg}');
			}
		}
		else
		{
			// Strip ANSI color codes that blessed can't render
			let tmpClean = tmpLog.replace(/\x1b\[[0-9;]*m/g, '');
			tmpLines.push(tmpClean);
		}

		let tmpWidget = this.pict.ContentAssignment.customGetElementFunction('#RightPanel');
		if (tmpWidget && tmpWidget.length > 0)
		{
			tmpWidget[0].setContent(tmpLines.join('\n'));
			// Scroll to bottom
			tmpWidget[0].setScrollPerc(100);
		}

		return this;
	}
}

module.exports = LogView;
module.exports.default_configuration = _ViewConfiguration;
