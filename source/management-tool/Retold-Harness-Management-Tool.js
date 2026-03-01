#!/usr/bin/env node
/**
* Retold Harness Management Tool
*
* Terminal UI application for launching, monitoring, shelling into,
* and stopping retold-harness database providers.  Supports both
* Docker and local installations.
*
* @author Steven Velozo <steven@velozo.com>
*/

// Suppress blessed terminfo stderr noise
const _OrigStderrWrite = process.stderr.write.bind(process.stderr);
process.stderr.write = function (pChunk)
{
	if (typeof pChunk === 'string' && pChunk.indexOf('Setulc') !== -1)
	{
		return true;
	}
	return _OrigStderrWrite(pChunk);
};

const blessed = require('blessed');
const libPict = require('pict');
const libPictApplication = require('pict-application');
const libPictTerminalUI = require('pict-terminalui');
const libOS = require('os');
const libPath = require('path');
const libFS = require('fs');

const libProviderDefinitions = require('./Provider-Definitions.js');
const libProcessManager = require('./Service-ProcessManager.js');

// Views
const libViewLayout = require('./views/View-Layout.js');
const libViewHeader = require('./views/View-Header.js');
const libViewDashboard = require('./views/View-Dashboard.js');
const libViewDetail = require('./views/View-Detail.js');
const libViewLog = require('./views/View-Log.js');
const libViewDocs = require('./views/View-Docs.js');
const libViewStatusBar = require('./views/View-StatusBar.js');

const PROVIDER_KEYS = Object.keys(libProviderDefinitions);

// Detect current OS for documentation
function detectOS()
{
	let tmpPlatform = libOS.platform();
	if (tmpPlatform === 'darwin') return 'mac';
	if (tmpPlatform === 'win32') return 'windows';
	return 'linux';
}

class RetoldHarnessManagementTool extends libPictApplication
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.terminalUI = null;
		this._Screen = null;
		this._ProviderList = null;

		// Register views
		this.pict.addView('Layout', libViewLayout.default_configuration, libViewLayout);
		this.pict.addView('Header', libViewHeader.default_configuration, libViewHeader);
		this.pict.addView('Dashboard', libViewDashboard.default_configuration, libViewDashboard);
		this.pict.addView('Detail', libViewDetail.default_configuration, libViewDetail);
		this.pict.addView('Log', libViewLog.default_configuration, libViewLog);
		this.pict.addView('Docs', libViewDocs.default_configuration, libViewDocs);
		this.pict.addView('StatusBar', libViewStatusBar.default_configuration, libViewStatusBar);
	}

	onAfterInitializeAsync(fCallback)
	{
		// Initialize the process manager as a Fable service
		this.pict.serviceManager.addServiceType('ProcessManager', libProcessManager);
		this.pict.serviceManager.instantiateServiceProvider('ProcessManager',
			{
				HarnessPath: this.options.HarnessPath
			});

		// Build initial application state
		let tmpBasePort = 8086;
		let tmpProviders = {};

		PROVIDER_KEYS.forEach(
			(pKey, pIndex) =>
			{
				let tmpDef = libProviderDefinitions[pKey];
				tmpProviders[pKey] =
				{
					Key: pKey,
					Label: tmpDef.Label,
					Description: tmpDef.Description,
					DockerService: tmpDef.DockerService,
					ContainerName: tmpDef.ContainerName,
					DefaultPort: tmpDef.DefaultPort,
					DockerImage: tmpDef.DockerImage,
					LocalOnly: tmpDef.LocalOnly,
					HasSeedData: tmpDef.HasSeedData,

					// Runtime state
					DockerStatus: 'Unknown',
					HarnessStatus: 'Stopped',
					HarnessPort: tmpBasePort + pIndex,
					Mode: '-'
				};
			});

		let tmpStatusMessage = 'Ready. Use arrow keys to navigate, see header for commands.';
		if (!this.options.HarnessDetected)
		{
			tmpStatusMessage = '{yellow-fg}Warning: retold-harness not found. Run from the harness directory or pass --harness-path.{/yellow-fg}';
		}

		this.pict.AppData.Tool =
		{
			AppName: 'Retold Harness Management Tool',
			AppVersion: '1.0.0',
			CurrentRoute: 'Dashboard',
			SelectedProvider: PROVIDER_KEYS[0],
			SelectedIndex: 0,
			DetectedOS: detectOS(),
			DocsOS: detectOS(),
			StatusMessage: tmpStatusMessage,
			HarnessPath: this.options.HarnessPath,
			HarnessDetected: this.options.HarnessDetected,
			ProviderKeys: PROVIDER_KEYS
		};
		this.pict.AppData.Providers = tmpProviders;

		// Create the terminal UI
		this.terminalUI = new libPictTerminalUI(this.pict,
			{
				Title: 'Retold Harness Management Tool'
			});

		this._Screen = this.terminalUI.createScreen();

		// Override quit to clean up processes
		this.terminalUI.onBeforeQuit = () =>
		{
			this.pict.ProcessManager.stopAll(
				() =>
				{
					process.exit(0);
				});
			// Return true to delay the default exit; stopAll will call process.exit
			return true;
		};

		// Build the blessed layout
		this._createLayout(this._Screen);

		// Bind navigation keys
		this._bindKeys(this._Screen);

		// Render views
		this.pict.views['Layout'].render();

		// Initial status refresh
		this._refreshAllStatuses();

		// Set up periodic status polling (every 5 seconds)
		this._StatusInterval = setInterval(() =>
		{
			this._refreshAllStatuses();
		}, 5000);

		this._Screen.render();

		return super.onAfterInitializeAsync(fCallback);
	}

	_createLayout(pScreen)
	{
		// Header (3 lines)
		let tmpHeader = blessed.box(
			{
				parent: pScreen,
				top: 0,
				left: 0,
				width: '100%',
				height: 3,
				tags: true,
				style: { fg: 'white', bg: 'blue', bold: true }
			});
		this.terminalUI.registerWidget('#Header', tmpHeader);

		// Provider list (left panel)
		let tmpProviderList = blessed.list(
			{
				parent: pScreen,
				top: 3,
				left: 0,
				width: '35%',
				bottom: 1,
				tags: true,
				keys: true,
				vi: true,
				mouse: true,
				border: { type: 'line' },
				label: ' Providers ',
				scrollbar: { style: { bg: 'cyan' } },
				style:
				{
					border: { fg: 'cyan' },
					selected: { fg: 'black', bg: 'cyan', bold: true },
					item: { fg: 'white' }
				},
				items: this._buildProviderListItems()
			});
		this.terminalUI.registerWidget('#ProviderList', tmpProviderList);
		this._ProviderList = tmpProviderList;

		// Right panel (detail / docs / log)
		let tmpRightPanel = blessed.box(
			{
				parent: pScreen,
				top: 3,
				left: '35%',
				width: '65%',
				bottom: 1,
				tags: true,
				scrollable: true,
				mouse: true,
				keys: true,
				vi: true,
				alwaysScroll: true,
				scrollbar: { style: { bg: 'cyan' } },
				border: { type: 'line' },
				label: ' Detail ',
				style: { border: { fg: 'cyan' } },
				padding: { left: 1, right: 1 }
			});
		this.terminalUI.registerWidget('#RightPanel', tmpRightPanel);

		// Status bar (bottom)
		let tmpStatusBar = blessed.box(
			{
				parent: pScreen,
				bottom: 0,
				left: 0,
				width: '100%',
				height: 1,
				tags: true,
				style: { fg: 'white', bg: 'gray' }
			});
		this.terminalUI.registerWidget('#StatusBar', tmpStatusBar);

		// Wire up list selection
		tmpProviderList.on('select item', (pItem, pIndex) =>
		{
			this._selectProvider(pIndex);
		});

		// Focus the provider list
		tmpProviderList.focus();
	}

	_buildProviderListItems()
	{
		let tmpProviders = this.pict.AppData.Providers;

		return PROVIDER_KEYS.map(
			(pKey) =>
			{
				let tmpProv = tmpProviders[pKey];
				let tmpDockerIcon = ' ';
				let tmpHarnessIcon = ' ';

				if (tmpProv.DockerStatus === 'Running')
				{
					tmpDockerIcon = '{green-fg}D{/green-fg}';
				}
				else if (tmpProv.DockerStatus === 'Stopped')
				{
					tmpDockerIcon = '{red-fg}D{/red-fg}';
				}
				else if (tmpProv.LocalOnly)
				{
					tmpDockerIcon = '{gray-fg}-{/gray-fg}';
				}

				if (tmpProv.HarnessStatus === 'Running')
				{
					tmpHarnessIcon = '{green-fg}H{/green-fg}';
				}
				else
				{
					tmpHarnessIcon = '{red-fg}H{/red-fg}';
				}

				let tmpPort = tmpProv.DefaultPort;
				let tmpPad = tmpProv.Label.padEnd(12);
				return ` ${tmpPad} [${tmpDockerIcon}${tmpHarnessIcon}] :${tmpPort}`;
			});
	}

	_refreshProviderList()
	{
		if (this._ProviderList)
		{
			let tmpItems = this._buildProviderListItems();
			this._ProviderList.setItems(tmpItems);
			this._ProviderList.select(this.pict.AppData.Tool.SelectedIndex);
			this._Screen.render();
		}
	}

	_selectProvider(pIndex)
	{
		if (pIndex < 0 || pIndex >= PROVIDER_KEYS.length) return;

		this.pict.AppData.Tool.SelectedIndex = pIndex;
		this.pict.AppData.Tool.SelectedProvider = PROVIDER_KEYS[pIndex];

		let tmpRoute = this.pict.AppData.Tool.CurrentRoute;

		if (tmpRoute === 'Dashboard' || tmpRoute === 'Detail')
		{
			this.pict.AppData.Tool.CurrentRoute = 'Detail';
			this.pict.views['Detail'].render();
		}
		else if (tmpRoute === 'Log')
		{
			this.pict.views['Log'].render();
		}
		else if (tmpRoute === 'Docs')
		{
			this.pict.views['Docs'].render();
		}

		this.pict.views['StatusBar'].render();
		this._Screen.render();
	}

	_refreshAllStatuses()
	{
		let tmpProviders = this.pict.AppData.Providers;
		let tmpKeys = PROVIDER_KEYS.slice();
		let tmpIndex = 0;

		let tmpCheckNext = () =>
		{
			if (tmpIndex >= tmpKeys.length)
			{
				this._refreshProviderList();

				// Re-render current view
				let tmpRoute = this.pict.AppData.Tool.CurrentRoute;
				if (tmpRoute === 'Detail')
				{
					this.pict.views['Detail'].render();
				}
				this._Screen.render();
				return;
			}

			let tmpKey = tmpKeys[tmpIndex];
			let tmpProv = tmpProviders[tmpKey];

			// Update harness status from process manager
			tmpProv.HarnessStatus = this.pict.ProcessManager.isHarnessRunning(tmpKey) ? 'Running' : 'Stopped';

			if (tmpProv.LocalOnly)
			{
				tmpProv.DockerStatus = 'N/A';
				tmpIndex++;
				return tmpCheckNext();
			}

			// Check Docker container status
			this.pict.ProcessManager.checkDockerContainer(tmpProv.ContainerName,
				(pError, pRunning) =>
				{
					tmpProv.DockerStatus = pRunning ? 'Running' : 'Stopped';
					tmpIndex++;
					return tmpCheckNext();
				});
		};

		tmpCheckNext();
	}

	_setStatus(pMessage)
	{
		this.pict.AppData.Tool.StatusMessage = pMessage;
		this.pict.views['StatusBar'].render();
		this._Screen.render();
	}

	_bindKeys(pScreen)
	{
		let tmpSelf = this;

		// Navigation: show detail
		pScreen.key(['enter', 'return'], () =>
		{
			tmpSelf.pict.AppData.Tool.CurrentRoute = 'Detail';
			let tmpWidget = tmpSelf.terminalUI.getWidget('#RightPanel');
			if (tmpWidget) tmpWidget.setLabel(' Detail ');
			tmpSelf.pict.views['Detail'].render();
			tmpSelf.pict.views['StatusBar'].render();
			pScreen.render();
		});

		// d - Start Docker container
		pScreen.key(['d'], () =>
		{
			let tmpKey = tmpSelf.pict.AppData.Tool.SelectedProvider;
			let tmpProv = tmpSelf.pict.AppData.Providers[tmpKey];

			if (tmpProv.LocalOnly)
			{
				tmpSelf._setStatus(`${tmpProv.Label} does not use Docker.`);
				return;
			}

			if (tmpProv.DockerStatus === 'Running')
			{
				tmpSelf._setStatus(`${tmpProv.Label} Docker container is already running.`);
				return;
			}

			tmpSelf._setStatus(`Starting Docker for ${tmpProv.Label}...`);
			tmpSelf.pict.ProcessManager.startDocker(tmpProv.DockerService,
				(pError, pOutput) =>
				{
					if (pError)
					{
						tmpSelf._setStatus(`Error: ${pError}`);
						return;
					}
					tmpProv.DockerStatus = 'Running';
					tmpProv.Mode = 'Docker';
					tmpSelf._setStatus(`${tmpProv.Label} Docker container started.`);
					tmpSelf._refreshProviderList();
					if (tmpSelf.pict.AppData.Tool.CurrentRoute === 'Detail')
					{
						tmpSelf.pict.views['Detail'].render();
					}
					pScreen.render();
				});
		});

		// s - Stop Docker container
		pScreen.key(['s'], () =>
		{
			let tmpKey = tmpSelf.pict.AppData.Tool.SelectedProvider;
			let tmpProv = tmpSelf.pict.AppData.Providers[tmpKey];

			if (tmpProv.LocalOnly || !tmpProv.DockerService)
			{
				tmpSelf._setStatus(`${tmpProv.Label} does not use Docker.`);
				return;
			}

			if (tmpProv.DockerStatus !== 'Running')
			{
				tmpSelf._setStatus(`${tmpProv.Label} Docker container is not running.`);
				return;
			}

			tmpSelf._setStatus(`Stopping Docker for ${tmpProv.Label}...`);
			tmpSelf.pict.ProcessManager.stopDocker(tmpProv.DockerService,
				(pError) =>
				{
					if (pError)
					{
						tmpSelf._setStatus(`Error: ${pError}`);
						return;
					}
					tmpProv.DockerStatus = 'Stopped';
					tmpProv.Mode = '-';
					tmpSelf._setStatus(`${tmpProv.Label} Docker container stopped.`);
					tmpSelf._refreshProviderList();
					if (tmpSelf.pict.AppData.Tool.CurrentRoute === 'Detail')
					{
						tmpSelf.pict.views['Detail'].render();
					}
					pScreen.render();
				});
		});

		// r - Run harness
		pScreen.key(['r'], () =>
		{
			let tmpKey = tmpSelf.pict.AppData.Tool.SelectedProvider;
			let tmpProv = tmpSelf.pict.AppData.Providers[tmpKey];

			if (tmpProv.HarnessStatus === 'Running')
			{
				tmpSelf._setStatus(`Harness for ${tmpProv.Label} is already running on port ${tmpProv.HarnessPort}.`);
				return;
			}

			tmpSelf._setStatus(`Launching harness for ${tmpProv.Label} on port ${tmpProv.HarnessPort}...`);
			tmpSelf.pict.ProcessManager.launchHarness(tmpKey, tmpProv.HarnessPort,
				(pError) =>
				{
					if (pError)
					{
						tmpSelf._setStatus(`Error: ${pError}`);
						return;
					}
					tmpProv.HarnessStatus = 'Running';
					tmpSelf._setStatus(`Harness running for ${tmpProv.Label} on port ${tmpProv.HarnessPort}.`);
					tmpSelf._refreshProviderList();
					if (tmpSelf.pict.AppData.Tool.CurrentRoute === 'Detail')
					{
						tmpSelf.pict.views['Detail'].render();
					}
					pScreen.render();
				});
		});

		// h - Stop harness
		pScreen.key(['h'], () =>
		{
			let tmpKey = tmpSelf.pict.AppData.Tool.SelectedProvider;
			let tmpProv = tmpSelf.pict.AppData.Providers[tmpKey];

			if (tmpProv.HarnessStatus !== 'Running')
			{
				tmpSelf._setStatus(`Harness for ${tmpProv.Label} is not running.`);
				return;
			}

			tmpSelf._setStatus(`Stopping harness for ${tmpProv.Label}...`);
			tmpSelf.pict.ProcessManager.stopHarness(tmpKey,
				(pError) =>
				{
					if (pError)
					{
						tmpSelf._setStatus(`Error: ${pError}`);
						return;
					}
					tmpProv.HarnessStatus = 'Stopped';
					tmpSelf._setStatus(`Harness for ${tmpProv.Label} stopped.`);
					tmpSelf._refreshProviderList();
					if (tmpSelf.pict.AppData.Tool.CurrentRoute === 'Detail')
					{
						tmpSelf.pict.views['Detail'].render();
					}
					pScreen.render();
				});
		});

		// p - Toggle consistency proxy
		pScreen.key(['p'], () =>
		{
			let tmpProcessManager = tmpSelf.pict.ProcessManager;

			if (tmpProcessManager.isProxyRunning())
			{
				// Stop the proxy
				tmpSelf._setStatus('Stopping consistency proxy...');
				tmpProcessManager.stopProxy(
					(pError) =>
					{
						if (pError)
						{
							tmpSelf._setStatus(`Error: ${pError}`);
							return;
						}
						tmpSelf._setStatus('Consistency proxy stopped.');
						pScreen.render();
					});
				return;
			}

			// Collect running harness backends
			let tmpRunningBackends = {};
			let tmpProviders = tmpSelf.pict.AppData.Providers;
			let tmpKeys = tmpSelf.pict.AppData.Tool.ProviderKeys;

			for (let i = 0; i < tmpKeys.length; i++)
			{
				let tmpKey = tmpKeys[i];
				if (tmpProviders[tmpKey].HarnessStatus === 'Running')
				{
					tmpRunningBackends[tmpKey] = tmpProviders[tmpKey].HarnessPort;
				}
			}

			let tmpRunningCount = Object.keys(tmpRunningBackends).length;

			if (tmpRunningCount < 2)
			{
				tmpSelf._setStatus(`Need at least 2 running harnesses for consistency proxy (have ${tmpRunningCount}).`);
				return;
			}

			let tmpProxyPort = 9090;
			let tmpBackendSummary = Object.keys(tmpRunningBackends).map(
				(pKey) => `${pKey}:${tmpRunningBackends[pKey]}`).join(', ');

			tmpSelf._setStatus(`Starting consistency proxy on :${tmpProxyPort} → ${tmpBackendSummary}...`);
			tmpProcessManager.launchProxy(tmpRunningBackends, tmpProxyPort,
				(pError) =>
				{
					if (pError)
					{
						tmpSelf._setStatus(`Error: ${pError}`);
						return;
					}
					tmpSelf._setStatus(`Consistency proxy on :${tmpProxyPort} → ${tmpBackendSummary}`);
					pScreen.render();
				});
		});

		// x - Shell into Docker container
		pScreen.key(['x'], () =>
		{
			let tmpKey = tmpSelf.pict.AppData.Tool.SelectedProvider;
			let tmpProv = tmpSelf.pict.AppData.Providers[tmpKey];

			if (tmpProv.LocalOnly || !tmpProv.ContainerName)
			{
				tmpSelf._setStatus(`${tmpProv.Label} does not have a Docker container.`);
				return;
			}

			if (tmpProv.DockerStatus !== 'Running')
			{
				tmpSelf._setStatus(`${tmpProv.Label} Docker container is not running. Start it first with [d].`);
				return;
			}

			// Temporarily leave blessed to open the interactive shell
			tmpSelf._Screen.destroy();

			console.log(`\nOpening shell to ${tmpProv.ContainerName}...`);
			console.log('Type "exit" to return to the management tool.\n');

			tmpSelf.pict.ProcessManager.shellDocker(tmpProv.ContainerName,
				(pError) =>
				{
					if (pError)
					{
						console.log(`Shell error: ${pError}`);
					}

					// Recreate the screen
					tmpSelf._Screen = tmpSelf.terminalUI.createScreen();
					tmpSelf._createLayout(tmpSelf._Screen);
					tmpSelf._bindKeys(tmpSelf._Screen);

					// Re-render everything
					tmpSelf.pict.views['Layout'].render();
					tmpSelf._refreshAllStatuses();
					tmpSelf._Screen.render();
				});
		});

		// l - Show log for selected provider harness
		pScreen.key(['l'], () =>
		{
			tmpSelf.pict.AppData.Tool.CurrentRoute = 'Log';
			let tmpWidget = tmpSelf.terminalUI.getWidget('#RightPanel');
			if (tmpWidget) tmpWidget.setLabel(' Harness Log ');
			tmpSelf.pict.views['Log'].render();
			tmpSelf.pict.views['StatusBar'].render();
			pScreen.render();
		});

		// i - Show documentation
		pScreen.key(['i'], () =>
		{
			tmpSelf.pict.AppData.Tool.CurrentRoute = 'Docs';
			let tmpWidget = tmpSelf.terminalUI.getWidget('#RightPanel');
			if (tmpWidget) tmpWidget.setLabel(' Documentation ');
			tmpSelf.pict.views['Docs'].render();
			tmpSelf.pict.views['StatusBar'].render();
			pScreen.render();
		});

		// 1/2/3 - Switch doc OS
		pScreen.key(['1'], () =>
		{
			tmpSelf.pict.AppData.Tool.DocsOS = 'mac';
			if (tmpSelf.pict.AppData.Tool.CurrentRoute === 'Docs')
			{
				tmpSelf.pict.views['Docs'].render();
				pScreen.render();
			}
		});
		pScreen.key(['2'], () =>
		{
			tmpSelf.pict.AppData.Tool.DocsOS = 'linux';
			if (tmpSelf.pict.AppData.Tool.CurrentRoute === 'Docs')
			{
				tmpSelf.pict.views['Docs'].render();
				pScreen.render();
			}
		});
		pScreen.key(['3'], () =>
		{
			tmpSelf.pict.AppData.Tool.DocsOS = 'windows';
			if (tmpSelf.pict.AppData.Tool.CurrentRoute === 'Docs')
			{
				tmpSelf.pict.views['Docs'].render();
				pScreen.render();
			}
		});

		// Tab - cycle focus between list and right panel
		pScreen.key(['tab'], () =>
		{
			let tmpRight = tmpSelf.terminalUI.getWidget('#RightPanel');
			if (tmpSelf._ProviderList.focused)
			{
				tmpRight.focus();
			}
			else
			{
				tmpSelf._ProviderList.focus();
			}
			pScreen.render();
		});
	}
}

// ─────────────────────────────────────────────
//  Harness Path Resolution
// ─────────────────────────────────────────────

/**
* Validate whether a candidate path looks like a retold-harness checkout.
*
* @param {string} pCandidate - Absolute path to check
* @returns {boolean}
*/
function isValidHarnessPath(pCandidate)
{
	try
	{
		return libFS.existsSync(libPath.join(pCandidate, 'source', 'Retold-Harness.js'));
	}
	catch (pError)
	{
		return false;
	}
}

/**
* Parse process.argv for --harness-path or --path value.
*
* @returns {string|null}
*/
function parseArgvHarnessPath()
{
	let tmpArgs = process.argv.slice(2);

	for (let i = 0; i < tmpArgs.length; i++)
	{
		if ((tmpArgs[i] === '--harness-path' || tmpArgs[i] === '--path') && tmpArgs[i + 1])
		{
			return libPath.resolve(tmpArgs[i + 1]);
		}
		// Also support --harness-path=/some/path
		if (tmpArgs[i].startsWith('--harness-path='))
		{
			return libPath.resolve(tmpArgs[i].split('=').slice(1).join('='));
		}
		if (tmpArgs[i].startsWith('--path='))
		{
			return libPath.resolve(tmpArgs[i].split('=').slice(1).join('='));
		}
	}

	return null;
}

/**
* Resolve the retold-harness directory using a priority chain:
*
*   1. --harness-path CLI argument
*   2. Current working directory (if it IS the harness)
*   3. ./retold-harness child of CWD (running from parent directory)
*   4. Parent of this source directory (management tool lives inside the harness)
*
* @returns {string|null}
*/
function resolveHarnessPath()
{
	// 1. Explicit CLI argument
	let tmpArgvPath = parseArgvHarnessPath();
	if (tmpArgvPath && isValidHarnessPath(tmpArgvPath))
	{
		return tmpArgvPath;
	}

	// 2. CWD is the harness itself
	let tmpCwd = process.cwd();
	if (isValidHarnessPath(tmpCwd))
	{
		return tmpCwd;
	}

	// 3. CWD contains a retold-harness child
	let tmpCwdChild = libPath.join(tmpCwd, 'retold-harness');
	if (isValidHarnessPath(tmpCwdChild))
	{
		return tmpCwdChild;
	}

	// 4. Parent of this source directory (management tool lives inside retold-harness/source/management-tool/)
	let tmpParent = libPath.resolve(__dirname, '..');
	if (isValidHarnessPath(tmpParent))
	{
		return tmpParent;
	}

	// Nothing found
	return null;
}

// ─────────────────────────────────────────────
//  Bootstrap
// ─────────────────────────────────────────────
let _ResolvedHarnessPath = resolveHarnessPath();

let _Pict = new libPict(
	{
		Product: 'RetoldHarnessManagementTool',
		ProductVersion: '1.0.0',
		LogNoisiness: 0
	});

let _AppOptions =
{
	Name: 'HarnessManager',
	HarnessPath: _ResolvedHarnessPath || libPath.resolve(__dirname, '..'),
	HarnessDetected: !!_ResolvedHarnessPath,
	MainViewportViewIdentifier: 'Layout',
	AutoRenderMainViewportViewAfterInitialize: false,
	AutoSolveAfterInitialize: false
};

let _App = _Pict.addApplication('HarnessManager', _AppOptions, RetoldHarnessManagementTool);

_App.initializeAsync(
	(pError) =>
	{
		if (pError)
		{
			console.error('Initialization failed:', pError);
			process.exit(1);
		}
	});
