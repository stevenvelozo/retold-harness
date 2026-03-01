/**
* Process Manager Service
*
* Fable service that manages Docker containers and harness Node.js processes
* for each retold-harness database provider.
*
* @author Steven Velozo <steven@velozo.com>
*/
const libFableServiceProviderBase = require('fable-serviceproviderbase');
const libChildProcess = require('child_process');
const libPath = require('path');
const libFS = require('fs');

class ProcessManager extends libFableServiceProviderBase
{
	constructor(pFable, pOptions, pServiceHash)
	{
		super(pFable, pOptions, pServiceHash);

		this.serviceType = 'ProcessManager';

		// Track running harness processes by provider key
		this._HarnessProcesses = {};
		// Track harness output logs by provider key
		this._HarnessLogs = {};

		// Consistency proxy state
		this._ProxyProcess = null;
		this._ProxyPort = null;

		// Resolve the retold-harness path
		this._HarnessPath = pOptions.HarnessPath || libPath.resolve(__dirname, '..');
		this._DockerComposePath = libPath.join(this._HarnessPath, 'docker-compose.yml');
	}

	/**
	* Check if the docker-compose file exists.
	* @returns {boolean}
	*/
	hasDockerCompose()
	{
		return libFS.existsSync(this._DockerComposePath);
	}

	/**
	* Get the log buffer for a provider's harness process.
	*
	* @param {string} pProviderKey
	* @returns {string}
	*/
	getHarnessLog(pProviderKey)
	{
		return this._HarnessLogs[pProviderKey] || '';
	}

	/**
	* Clear the log buffer for a provider.
	*
	* @param {string} pProviderKey
	*/
	clearHarnessLog(pProviderKey)
	{
		this._HarnessLogs[pProviderKey] = '';
	}

	/**
	* Append to a provider's log buffer (capped at ~8000 chars).
	*
	* @param {string} pProviderKey
	* @param {string} pText
	*/
	_appendLog(pProviderKey, pText)
	{
		if (!this._HarnessLogs[pProviderKey])
		{
			this._HarnessLogs[pProviderKey] = '';
		}
		this._HarnessLogs[pProviderKey] += pText;
		// Keep last 8000 chars
		if (this._HarnessLogs[pProviderKey].length > 8000)
		{
			this._HarnessLogs[pProviderKey] = this._HarnessLogs[pProviderKey].slice(-8000);
		}
	}

	/**
	* Check if a Docker container is running.
	*
	* @param {string} pContainerName
	* @param {function} fCallback - (pError, pIsRunning)
	*/
	checkDockerContainer(pContainerName, fCallback)
	{
		if (!pContainerName)
		{
			return fCallback(null, false);
		}

		libChildProcess.exec(
			`docker inspect --format='{{.State.Running}}' ${pContainerName} 2>/dev/null`,
			(pError, pStdout) =>
			{
				if (pError)
				{
					return fCallback(null, false);
				}
				let tmpRunning = pStdout.trim() === 'true';
				return fCallback(null, tmpRunning);
			});
	}

	/**
	* Start a Docker service via docker compose.
	*
	* @param {string} pServiceName - The service name in docker-compose.yml
	* @param {function} fCallback - (pError, pOutput)
	*/
	startDocker(pServiceName, fCallback)
	{
		if (!this.hasDockerCompose())
		{
			return fCallback(`docker-compose.yml not found at ${this._DockerComposePath}`);
		}

		let tmpCmd = `docker compose -f "${this._DockerComposePath}" up ${pServiceName} -d`;
		this.log.info(`Starting Docker service: ${tmpCmd}`);

		libChildProcess.exec(tmpCmd, { timeout: 60000, cwd: this._HarnessPath },
			(pError, pStdout, pStderr) =>
			{
				if (pError)
				{
					return fCallback(`Docker start error: ${pError.message}`);
				}
				return fCallback(null, (pStdout + pStderr).trim());
			});
	}

	/**
	* Stop a Docker service via docker compose.
	*
	* @param {string} pServiceName - The service name in docker-compose.yml
	* @param {function} fCallback - (pError, pOutput)
	*/
	stopDocker(pServiceName, fCallback)
	{
		if (!this.hasDockerCompose())
		{
			return fCallback(`docker-compose.yml not found at ${this._DockerComposePath}`);
		}

		let tmpCmd = `docker compose -f "${this._DockerComposePath}" stop ${pServiceName}`;
		this.log.info(`Stopping Docker service: ${tmpCmd}`);

		libChildProcess.exec(tmpCmd, { timeout: 30000, cwd: this._HarnessPath },
			(pError, pStdout, pStderr) =>
			{
				if (pError)
				{
					return fCallback(`Docker stop error: ${pError.message}`);
				}
				return fCallback(null, (pStdout + pStderr).trim());
			});
	}

	/**
	* Open an interactive shell into a Docker container.
	* This requires temporarily leaving the blessed screen.
	*
	* @param {string} pContainerName
	* @param {function} fCallback - Called when the shell session ends
	*/
	shellDocker(pContainerName, fCallback)
	{
		if (!pContainerName)
		{
			return fCallback('No container name specified');
		}

		let tmpShellCmd = 'bash';
		// MSSQL containers may not have bash
		if (pContainerName.indexOf('mssql') !== -1)
		{
			tmpShellCmd = '/bin/bash';
		}

		let tmpChild = libChildProcess.spawn('docker',
			['exec', '-it', pContainerName, tmpShellCmd],
			{
				stdio: 'inherit'
			});

		tmpChild.on('close', () =>
		{
			return fCallback();
		});

		tmpChild.on('error', (pError) =>
		{
			return fCallback(`Shell error: ${pError.message}`);
		});
	}

	/**
	* Launch the retold-harness with a specific provider.
	*
	* @param {string} pProviderKey
	* @param {number} pPort - API server port
	* @param {function} fCallback - (pError)
	*/
	launchHarness(pProviderKey, pPort, fCallback)
	{
		if (this._HarnessProcesses[pProviderKey])
		{
			return fCallback(`Harness already running for ${pProviderKey}`);
		}

		let tmpEnv = Object.assign({}, process.env,
			{
				HARNESS_PROVIDER: pProviderKey,
				PORT: String(pPort)
			});

		let tmpChild = libChildProcess.spawn('node',
			[libPath.join(this._HarnessPath, 'source', 'Retold-Harness.js')],
			{
				cwd: this._HarnessPath,
				env: tmpEnv,
				stdio: ['ignore', 'pipe', 'pipe']
			});

		this._HarnessProcesses[pProviderKey] = tmpChild;
		this._HarnessLogs[pProviderKey] = '';

		tmpChild.stdout.on('data', (pData) =>
		{
			this._appendLog(pProviderKey, pData.toString());
		});

		tmpChild.stderr.on('data', (pData) =>
		{
			this._appendLog(pProviderKey, pData.toString());
		});

		tmpChild.on('close', (pCode) =>
		{
			this._appendLog(pProviderKey, `\n--- Process exited with code ${pCode} ---\n`);
			delete this._HarnessProcesses[pProviderKey];
		});

		tmpChild.on('error', (pError) =>
		{
			this._appendLog(pProviderKey, `\n--- Process error: ${pError.message} ---\n`);
			delete this._HarnessProcesses[pProviderKey];
		});

		this.log.info(`Harness launched for ${pProviderKey} on port ${pPort}`);
		return fCallback();
	}

	/**
	* Stop a running harness process.
	*
	* @param {string} pProviderKey
	* @param {function} fCallback - (pError)
	*/
	stopHarness(pProviderKey, fCallback)
	{
		let tmpChild = this._HarnessProcesses[pProviderKey];

		if (!tmpChild)
		{
			return fCallback(`No harness running for ${pProviderKey}`);
		}

		tmpChild.kill('SIGTERM');

		// Give it 3 seconds, then SIGKILL
		let tmpKillTimer = setTimeout(() =>
		{
			if (this._HarnessProcesses[pProviderKey])
			{
				tmpChild.kill('SIGKILL');
			}
		}, 3000);

		tmpChild.on('close', () =>
		{
			clearTimeout(tmpKillTimer);
			delete this._HarnessProcesses[pProviderKey];
			return fCallback();
		});
	}

	/**
	* Check if a harness process is running for a provider.
	*
	* @param {string} pProviderKey
	* @returns {boolean}
	*/
	isHarnessRunning(pProviderKey)
	{
		return !!this._HarnessProcesses[pProviderKey];
	}

	/**
	* Get the assigned port for a running harness.
	*
	* @param {string} pProviderKey
	* @returns {number|false}
	*/
	getHarnessPort(pProviderKey)
	{
		// We assign ports based on provider index: 8086, 8087, 8088, ...
		// Or use the configured port
		return this.fable.AppData.Providers[pProviderKey] &&
			this.fable.AppData.Providers[pProviderKey].HarnessPort || false;
	}

	/**
	* Stop all running harness processes and Docker containers (for clean exit).
	*
	* @param {function} fCallback
	*/
	stopAll(fCallback)
	{
		let tmpKeys = Object.keys(this._HarnessProcesses);
		let tmpIndex = 0;

		let tmpStopNext = () =>
		{
			if (tmpIndex >= tmpKeys.length)
			{
				// After all harnesses, stop the proxy if running
				if (this._ProxyProcess)
				{
					return this.stopProxy(
						() =>
						{
							return fCallback();
						});
				}
				return fCallback();
			}

			this.stopHarness(tmpKeys[tmpIndex],
				() =>
				{
					tmpIndex++;
					return tmpStopNext();
				});
		};

		return tmpStopNext();
	}

	// ─────────────────────────────────────────────
	//  Consistency Proxy Management
	// ─────────────────────────────────────────────

	/**
	* Launch the consistency proxy, pointing it at all running harness backends.
	*
	* @param {object} pRunningBackends - Map of { providerKey: port }
	* @param {number} pProxyPort - Port for the proxy to listen on
	* @param {function} fCallback - (pError)
	*/
	launchProxy(pRunningBackends, pProxyPort, fCallback)
	{
		if (this._ProxyProcess)
		{
			return fCallback('Consistency proxy is already running');
		}

		let tmpBackendsList = Object.keys(pRunningBackends).map(
			(pKey) => `${pKey}:${pRunningBackends[pKey]}`).join(',');

		let tmpProxyPath = libPath.resolve(__dirname, '..', '..', '..', 'retold-harness-consistency-proxy',
			'source', 'Retold-Harness-Consistency-Proxy.js');

		if (!libFS.existsSync(tmpProxyPath))
		{
			return fCallback(`Consistency proxy not found at ${tmpProxyPath}`);
		}

		let tmpChild = libChildProcess.spawn('node',
			[tmpProxyPath, '--backends', tmpBackendsList, '--port', String(pProxyPort)],
			{
				stdio: ['ignore', 'pipe', 'pipe']
			});

		this._ProxyProcess = tmpChild;
		this._ProxyPort = pProxyPort;

		tmpChild.stdout.on('data', (pData) =>
		{
			this._appendLog('_proxy', pData.toString());
		});

		tmpChild.stderr.on('data', (pData) =>
		{
			this._appendLog('_proxy', pData.toString());
		});

		tmpChild.on('close', () =>
		{
			this._ProxyProcess = null;
			this._ProxyPort = null;
		});

		tmpChild.on('error', (pError) =>
		{
			this._appendLog('_proxy', `Proxy error: ${pError.message}\n`);
			this._ProxyProcess = null;
			this._ProxyPort = null;
		});

		this.log.info(`Consistency proxy launched on port ${pProxyPort} → ${tmpBackendsList}`);
		return fCallback(null);
	}

	/**
	* Stop the running consistency proxy.
	*
	* @param {function} fCallback - (pError)
	*/
	stopProxy(fCallback)
	{
		if (!this._ProxyProcess)
		{
			return fCallback('No consistency proxy running');
		}

		this._ProxyProcess.kill('SIGTERM');

		let tmpKillTimer = setTimeout(() =>
		{
			if (this._ProxyProcess)
			{
				this._ProxyProcess.kill('SIGKILL');
			}
		}, 3000);

		this._ProxyProcess.on('close', () =>
		{
			clearTimeout(tmpKillTimer);
			this._ProxyProcess = null;
			this._ProxyPort = null;
			return fCallback();
		});
	}

	/**
	* Check if the consistency proxy is running.
	*
	* @returns {boolean}
	*/
	isProxyRunning()
	{
		return !!this._ProxyProcess;
	}

	/**
	* Get the consistency proxy port.
	*
	* @returns {number|null}
	*/
	getProxyPort()
	{
		return this._ProxyPort || null;
	}

	/**
	* Read a documentation markdown file.
	*
	* @param {string} pProviderKey
	* @param {string} pOS - 'mac', 'linux', or 'windows'
	* @returns {string} - The markdown content or an error message
	*/
	readDocumentation(pProviderKey, pOS)
	{
		let tmpDocsPath = libPath.resolve(__dirname, 'docs', pProviderKey, `${pOS}.md`);

		if (!libFS.existsSync(tmpDocsPath))
		{
			return `Documentation not found: ${tmpDocsPath}`;
		}

		return libFS.readFileSync(tmpDocsPath, 'utf8');
	}
}

module.exports = ProcessManager;
