/**
* Dashboard View
*
* Placeholder dashboard view.  In practice the blessed list widget
* serves as the interactive dashboard; this view provides a fallback
* content panel when no provider is selected.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Dashboard',

	DefaultRenderable: 'Dashboard-Content',
	DefaultDestinationAddress: '#RightPanel',
	DefaultTemplateRecordAddress: 'AppData.Tool',

	AutoRender: false,
	AutoInitialize: false,

	Templates:
	[
		{
			Hash: 'Dashboard-Template',
			Template: [
				'{bold}{cyan-fg}Retold Harness Management Tool{/cyan-fg}{/bold}',
				'',
				'Select a provider from the list on the left.',
				'',
				'{bold}Quick Actions:{/bold}',
				'  [D]  Start Docker container for selected provider',
				'  [S]  Stop Docker container',
				'  [R]  Run retold-harness with selected provider',
				'  [H]  Halt (stop) the running harness',
				'  [X]  Open a shell into the Docker container',
				'  [L]  View harness process log output',
				'  [I]  View local installation documentation',
				'',
				'{bold}Documentation OS:{/bold}',
				'  [1] macOS  [2] Linux  [3] Windows',
				'',
				'{yellow-fg}Detected OS: {~D:Record.DetectedOS~}{/yellow-fg}'
			].join('\n')
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'Dashboard-Content',
			TemplateHash: 'Dashboard-Template',
			ContentDestinationAddress: '#RightPanel',
			RenderMethod: 'replace'
		}
	]
};

class DashboardView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}
}

module.exports = DashboardView;
module.exports.default_configuration = _ViewConfiguration;
