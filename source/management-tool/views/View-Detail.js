/**
* Detail View
*
* Shows detailed status and actions for the currently selected provider.
* Reads provider state from AppData.Providers[selectedKey] on each render.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Detail',

	DefaultRenderable: 'Detail-Content',
	DefaultDestinationAddress: '#RightPanel',
	DefaultTemplateRecordAddress: 'AppData.Tool',

	AutoRender: false,
	AutoInitialize: false,

	Templates:
	[
		{
			Hash: 'Detail-Template',
			// This will be overridden by onBeforeRender
			Template: ''
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'Detail-Content',
			TemplateHash: 'Detail-Template',
			ContentDestinationAddress: '#RightPanel',
			RenderMethod: 'replace'
		}
	]
};

class DetailView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onBeforeRender()
	{
		let tmpTool = this.pict.AppData.Tool;
		let tmpKey = tmpTool.SelectedProvider;
		let tmpProv = this.pict.AppData.Providers[tmpKey];

		if (!tmpProv)
		{
			return super.onBeforeRender();
		}

		let tmpDockerColor = tmpProv.DockerStatus === 'Running' ? 'green' : 'red';
		let tmpHarnessColor = tmpProv.HarnessStatus === 'Running' ? 'green' : 'red';

		let tmpDockerStatusText = tmpProv.LocalOnly ? '{gray-fg}N/A (file-based){/gray-fg}' : `{${tmpDockerColor}-fg}${tmpProv.DockerStatus}{/${tmpDockerColor}-fg}`;
		let tmpHarnessStatusText = `{${tmpHarnessColor}-fg}${tmpProv.HarnessStatus}{/${tmpHarnessColor}-fg}`;

		let tmpLines = [];

		tmpLines.push(`{bold}{cyan-fg}${tmpProv.Label}{/cyan-fg}{/bold}`);
		tmpLines.push(`${tmpProv.Description}`);
		tmpLines.push('');
		tmpLines.push('{bold}{underline}Status{/underline}{/bold}');
		tmpLines.push(`  Docker Container : ${tmpDockerStatusText}`);
		tmpLines.push(`  Harness Process  : ${tmpHarnessStatusText}`);
		tmpLines.push('');
		tmpLines.push('{bold}{underline}Configuration{/underline}{/bold}');
		tmpLines.push(`  DB Port          : ${tmpProv.DefaultPort}`);
		tmpLines.push(`  Harness API Port : ${tmpProv.HarnessPort}`);
		tmpLines.push(`  Docker Image     : ${tmpProv.DockerImage}`);
		tmpLines.push(`  Container Name   : ${tmpProv.ContainerName || 'N/A'}`);
		tmpLines.push(`  Has Seed Data    : ${tmpProv.HasSeedData ? 'Yes' : 'No'}`);
		tmpLines.push('');
		tmpLines.push('{bold}{underline}Actions{/underline}{/bold}');

		if (tmpProv.LocalOnly)
		{
			tmpLines.push('  {gray-fg}[D] Docker Up   - N/A (file-based provider){/gray-fg}');
			tmpLines.push('  {gray-fg}[S] Docker Stop - N/A{/gray-fg}');
			tmpLines.push('  {gray-fg}[X] Shell       - N/A{/gray-fg}');
		}
		else
		{
			if (tmpProv.DockerStatus === 'Running')
			{
				tmpLines.push('  {gray-fg}[D] Docker Up   - Already running{/gray-fg}');
				tmpLines.push('  {yellow-fg}[S] Docker Stop - Stop the container{/yellow-fg}');
				tmpLines.push('  {yellow-fg}[X] Shell       - Open interactive shell{/yellow-fg}');
			}
			else
			{
				tmpLines.push('  {green-fg}[D] Docker Up   - Start the container{/green-fg}');
				tmpLines.push('  {gray-fg}[S] Docker Stop - Container not running{/gray-fg}');
				tmpLines.push('  {gray-fg}[X] Shell       - Container not running{/gray-fg}');
			}
		}

		if (tmpProv.HarnessStatus === 'Running')
		{
			tmpLines.push('  {gray-fg}[R] Run Harness - Already running{/gray-fg}');
			tmpLines.push(`  {yellow-fg}[H] Halt Harness - Stop process (port ${tmpProv.HarnessPort}){/yellow-fg}`);
		}
		else
		{
			tmpLines.push(`  {green-fg}[R] Run Harness - Launch on port ${tmpProv.HarnessPort}{/green-fg}`);
			tmpLines.push('  {gray-fg}[H] Halt Harness - Not running{/gray-fg}');
		}

		tmpLines.push('');
		tmpLines.push('  {cyan-fg}[L] View Harness Log{/cyan-fg}');
		tmpLines.push('  {cyan-fg}[I] View Installation Docs{/cyan-fg}');

		// Direct content assignment since template data binding can't handle this complexity
		let tmpWidget = this.pict.ContentAssignment.customGetElementFunction('#RightPanel');
		if (tmpWidget && tmpWidget.length > 0)
		{
			tmpWidget[0].setContent(tmpLines.join('\n'));
		}

		// Skip the default template rendering since we set content directly
		return super.onBeforeRender();
	}

	render()
	{
		// We handle rendering in onBeforeRender, so just trigger the lifecycle
		this.onBeforeRender();
		return this;
	}
}

module.exports = DetailView;
module.exports.default_configuration = _ViewConfiguration;
