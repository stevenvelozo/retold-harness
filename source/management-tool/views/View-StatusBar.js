/**
* Status Bar View
*
* Renders a single-line status bar at the bottom of the screen.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'StatusBar',

	DefaultRenderable: 'StatusBar-Content',
	DefaultDestinationAddress: '#StatusBar',
	DefaultTemplateRecordAddress: 'AppData.Tool',

	AutoRender: false,
	AutoInitialize: false,

	Templates:
	[
		{
			Hash: 'StatusBar-Template',
			Template: ' {bold}{~D:Record.SelectedProvider~}{/bold} | {~D:Record.CurrentRoute~} | {~D:Record.ProxyStatus~}{~D:Record.StatusMessage~}'
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'StatusBar-Content',
			TemplateHash: 'StatusBar-Template',
			ContentDestinationAddress: '#StatusBar',
			RenderMethod: 'replace'
		}
	]
};

class StatusBarView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onBeforeRender()
	{
		// Update proxy status in the status message area
		let tmpProcessManager = this.pict.ProcessManager;

		if (tmpProcessManager && tmpProcessManager.isProxyRunning())
		{
			this.pict.AppData.Tool.ProxyStatus = `{green-fg}Proxy :${tmpProcessManager.getProxyPort()}{/green-fg} | `;
		}
		else
		{
			this.pict.AppData.Tool.ProxyStatus = '';
		}

		return super.onBeforeRender();
	}
}

module.exports = StatusBarView;
module.exports.default_configuration = _ViewConfiguration;
