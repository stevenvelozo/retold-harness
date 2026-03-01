/**
* Header View
*
* Displays the application title and key bindings.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Header',

	DefaultRenderable: 'Header-Content',
	DefaultDestinationAddress: '#Header',
	DefaultTemplateRecordAddress: 'AppData.Tool',

	AutoRender: false,
	AutoInitialize: false,

	Templates:
	[
		{
			Hash: 'Header-Template',
			Template: '{center}{bold}Retold Harness Management Tool{/bold}{/center}\n{center}[D]ocker Up  [S]top Docker  [R]un Harness  [H]alt Harness  [P]roxy  [X] Shell  [L]og  [I]nfo  [Tab] Focus  [Ctrl-C] Quit{/center}'
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'Header-Content',
			TemplateHash: 'Header-Template',
			ContentDestinationAddress: '#Header',
			RenderMethod: 'replace'
		}
	]
};

class HeaderView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}
}

module.exports = HeaderView;
module.exports.default_configuration = _ViewConfiguration;
