/**
* Layout View
*
* Master layout that triggers rendering of all child views
* after the initial render.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libPictView = require('pict-view');

const _ViewConfiguration =
{
	ViewIdentifier: 'Layout',

	DefaultRenderable: 'Layout-Content',
	DefaultDestinationAddress: '#Header',

	AutoRender: false,
	AutoInitialize: false,

	Templates:
	[
		{
			Hash: 'Layout-Template',
			Template: ''
		}
	],

	Renderables:
	[
		{
			RenderableHash: 'Layout-Content',
			TemplateHash: 'Layout-Template',
			ContentDestinationAddress: '#Header',
			RenderMethod: 'replace'
		}
	]
};

class LayoutView extends libPictView
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);
	}

	onAfterRender(pRenderable)
	{
		if (this.pict.views['Header'])
		{
			this.pict.views['Header'].render();
		}
		if (this.pict.views['Detail'])
		{
			this.pict.views['Detail'].render();
		}
		if (this.pict.views['StatusBar'])
		{
			this.pict.views['StatusBar'].render();
		}
		return super.onAfterRender(pRenderable);
	}
}

module.exports = LayoutView;
module.exports.default_configuration = _ViewConfiguration;
