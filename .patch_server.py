import sys

with open('server.js', 'rb') as f:
    content = f.read()

changes = []

# ─── 1. Remove 0.0.0.0 fallback in checkAiHealth ───────────────────────────
old1 = (
    b"    return _probeAi('127.0.0.1').then(ok => {\n"
    b"        if (ok) return true;\n"
    b"        return _probeAi('0.0.0.0');\n"
    b"    });\n"
    b"}\n"
    b"\n"
    b"\n"
    b"function checkHttpHealth"
)
new1 = (
    b"    return _probeAi('127.0.0.1');\n"
    b"}\n"
    b"\n"
    b"\n"
    b"function checkHttpHealth"
)
changes.append(('Remove 0.0.0.0 in checkAiHealth', old1, new1))

# ─── 2. Remove 0.0.0.0 fallback in checkHttpHealth ─────────────────────────
old2 = (
    b"    // Probe 127.0.0.1 first; if refused try 0.0.0.0\n"
    b"    return _probeHost('127.0.0.1').then(ok => {\n"
    b"        if (ok) return true;\n"
    b"        return _probeHost('0.0.0.0');\n"
    b"    });\n"
    b"}\n"
)
new2 = (
    b"    // Probe loopback only (0.0.0.0 is a bind wildcard, not a probe target)\n"
    b"    return _probeHost('127.0.0.1');\n"
    b"}\n"
)
changes.append(('Remove 0.0.0.0 in checkHttpHealth', old2, new2))

# ─── 3. Enrich dumpOpenPorts ────────────────────────────────────────────────
old3 = (
    b"function dumpOpenPorts() {\n"
    b"    try {\n"
    b"        const tcp = fs.existsSync('/proc/net/tcp') ? fs.readFileSync('/proc/net/tcp', 'utf8') : '';\n"
    b"        const tcp6 = fs.existsSync('/proc/net/tcp6') ? fs.readFileSync('/proc/net/tcp6', 'utf8') : '';\n"
    b"        const parsePorts = (content) => {\n"
    b"            const ports = [];\n"
    b"            for (const line of content.split('\\n')) {\n"
    b"                const parts = line.trim().split(/\\s+/);\n"
    b"                if (parts.length > 3 && parts[3] === '0A') { // 0A = TCP_LISTEN\n"
    b"                    const [ipHex, portHex] = parts[1].split(':');\n"
    b"                    const ip = ipHex === '0100007F' ? '127.0.0.1' : ipHex === '00000000' ? '0.0.0.0' : ipHex;\n"
    b"                    ports.push(`${parseInt(portHex, 16)} (${ip})`);\n"
    b"                }\n"
    b"            }\n"
    b"            return ports;\n"
    b"        };\n"
    b"        const openIpv4 = parsePorts(tcp);\n"
    b"        const openIpv6 = parsePorts(tcp6);\n"
    b"        log(`\xf0\x9f\x93\x8a Open listening ports in container: IPv4=[${openIpv4.join(', ')}], IPv6=[${openIpv6.join(', ')}]`);\n"
    b"    } catch (e) {\n"
    b"        log(`\xf0\x9f\x93\x8a Could not inspect /proc/net/tcp: ${e.message}`);\n"
    b"    }\n"
    b"}\n"
)
new3 = (
    b"function dumpOpenPorts(label) {\n"
    b"    try {\n"
    b"        const tcp  = fs.existsSync('/proc/net/tcp')  ? fs.readFileSync('/proc/net/tcp',  'utf8') : '';\n"
    b"        const tcp6 = fs.existsSync('/proc/net/tcp6') ? fs.readFileSync('/proc/net/tcp6', 'utf8') : '';\n"
    b"        const parsePorts = (content, proto) => {\n"
    b"            const ports = [];\n"
    b"            for (const line of content.split('\\n')) {\n"
    b"                const parts = line.trim().split(/\\s+/);\n"
    b"                if (parts.length > 3 && parts[3] === '0A') { // 0A = TCP_LISTEN\n"
    b"                    const colonIdx = parts[1].lastIndexOf(':');\n"
    b"                    const ipHex   = parts[1].slice(0, colonIdx);\n"
    b"                    const portHex = parts[1].slice(colonIdx + 1);\n"
    b"                    let ip;\n"
    b"                    if (proto === 4) {\n"
    b"                        ip = ipHex === '0100007F' ? '127.0.0.1'\n"
    b"                           : ipHex === '00000000' ? '0.0.0.0'\n"
    b"                           : ipHex;\n"
    b"                    } else {\n"
    b"                        ip = ipHex === '00000000000000000000000000000000' ? '::'\n"
    b"                           : ipHex === '00000000000000000000000001000000' ? '::1'\n"
    b"                           : ipHex;\n"
    b"                    }\n"
    b"                    ports.push(`${parseInt(portHex, 16)}@${ip}`);\n"
    b"                }\n"
    b"            }\n"
    b"            return ports;\n"
    b"        };\n"
    b"        const v4  = parsePorts(tcp,  4);\n"
    b"        const v6  = parsePorts(tcp6, 6);\n"
    b"        const tag = label ? ` [${label}]` : '';\n"
    b"        log(`\xf0\x9f\x93\x8a [Worker ${process.pid}]${tag} TCP listeners: v4=[${v4.join(', ')}] v6=[${v6.join(', ')}]`);\n"
    b"    } catch (e) {\n"
    b"        log(`\xf0\x9f\x93\x8a Could not inspect /proc/net/tcp: ${e.message}`);\n"
    b"    }\n"
    b"}\n"
)
changes.append(('Enrich dumpOpenPorts', old3, new3))

# ─── 4. Log WHY lock is stolen in watchdog ──────────────────────────────────
old4 = (
    b"        // If the managing worker died, this worker acquires the lock and restores engines\n"
    b"        if (!isManagerAlive) {\n"
    b"            log(`\xe2\x9a\xa0\xef\xb8\x8f Engine manager (PID ${holderPid || 'none'}) heartbeat stale/gone. Worker PID ${process.pid} claiming boot lock.`);\n"
    b"            try { fs.unlinkSync(BOOT_LOCK_FILE); } catch (_) {}\n"
    b"            if (tryAcquireBootLock()) {\n"
    b"                bootStarted = false;\n"
    b"                await bootEngines();\n"
    b"                return;\n"
    b"            }\n"
    b"        }\n"
)
new4 = (
    b"        // If the managing worker died, this worker acquires the lock and restores engines\n"
    b"        if (!isManagerAlive) {\n"
    b"            const _lockAge = lockPayload ? Math.round((Date.now() - lockPayload.ts) / 1000) : 'n/a';\n"
    b"            let _procStatus = 'no-pid';\n"
    b"            if (holderPid) {\n"
    b"                try { process.kill(holderPid, 0); _procStatus = 'alive'; }\n"
    b"                catch (e2) { _procStatus = e2.code; } // ESRCH=gone, EPERM=alive-other-ns\n"
    b"            }\n"
    b"            log(`\xe2\x9a\xa0\xef\xb8\x8f Boot lock takeover: holder=${holderPid} age=${_lockAge}s proc=${_procStatus} LOCK_STALE_MS=${LOCK_STALE_MS}. Worker ${process.pid} attempting claim.`);\n"
    b"            try { fs.unlinkSync(BOOT_LOCK_FILE); } catch (_) {}\n"
    b"            if (tryAcquireBootLock()) {\n"
    b"                log(`\xf0\x9f\x94\x92 Worker ${process.pid} acquired boot lock. Starting new engine boot sequence.`);\n"
    b"                bootStarted = false;\n"
    b"                await bootEngines();\n"
    b"                return;\n"
    b"            } else {\n"
    b"                log(`\xe2\x9d\x8c Worker ${process.pid} lost lock race (another worker won).`);\n"
    b"            }\n"
    b"        } else {\n"
    b"            // Healthy lock: log who holds it so we know which worker is the manager\n"
    b"            if (holderPid && holderPid !== process.pid) {\n"
    b"                const _age = lockPayload ? Math.round((Date.now() - lockPayload.ts) / 1000) : '?';\n"
    b"                log(`\xf0\x9f\x94\x92 [Worker ${process.pid}] Lock held by PID ${holderPid} (age ${_age}s) -- proxy-only.`);\n"
    b"            }\n"
    b"        }\n"
)
changes.append(('Log lock takeover reason in watchdog', old4, new4))

# ─── 5. PID in child exit log ───────────────────────────────────────────────
old5 = (
    b"            child.on(\n"
    b"                'exit',\n"
    b"                async (code, signal) => {\n"
    b"\n"
    b"                    if (name === 'Dashboard') isDashboardReady = false;\n"
    b"                    if (name === 'Backend') isBackendReady = false;\n"
    b"                    if (name === 'AI Engine') isAiReady = false;\n"
    b"                    updateEngineState();\n"
)
new5 = (
    b"            child.on(\n"
    b"                'exit',\n"
    b"                async (code, signal) => {\n"
    b"\n"
    b"                    log(`\xf0\x9f\x94\xb4 [Worker ${process.pid}] ${name} child PID=${child.pid} exited code=${code} signal=${signal}`);\n"
    b"                    if (name === 'Dashboard') isDashboardReady = false;\n"
    b"                    if (name === 'Backend') isBackendReady = false;\n"
    b"                    if (name === 'AI Engine') isAiReady = false;\n"
    b"                    updateEngineState();\n"
)
changes.append(('PID in child exit log', old5, new5))

# ─── 6. TCP probe + dumpOpenPorts in proxyRequest ECONNREFUSED ──────────────
old6 = (
    b"    proxyReq.on('error', (error) => {\n"
    b"        if (error.code === 'ECONNREFUSED') {\n"
    b"            if (targetPort === DASH_PORT) isDashboardReady = false;\n"
    b"            if (targetPort === BACK_PORT) isBackendReady = false;\n"
    b"            log(`\xe2\x84\xb9\xef\xb8\x8f Target port ${targetPort} temporarily unavailable (${error.code}).`);\n"
    b"        } else {\n"
    b"            log(`\xe2\x9a\xa0\xef\xb8\x8f Proxy error \xe2\x86\x92 ${error.message}`);\n"
    b"        }\n"
)
new6 = (
    b"    proxyReq.on('error', (error) => {\n"
    b"        if (error.code === 'ECONNREFUSED') {\n"
    b"            if (targetPort === DASH_PORT) isDashboardReady = false;\n"
    b"            if (targetPort === BACK_PORT) isBackendReady = false;\n"
    b"            log(`\xe2\x84\xb9\xef\xb8\x8f [Worker ${process.pid}] Proxy ECONNREFUSED on 127.0.0.1:${targetPort}`);\n"
    b"            // Raw TCP check + port snapshot from this exact proxy worker\n"
    b"            checkTcpConnect(targetPort, '127.0.0.1', 500).then(tcpOk => {\n"
    b"                log(`\xf0\x9f\x94\x8c [Worker ${process.pid}] TCP probe 127.0.0.1:${targetPort} = ${tcpOk ? 'OPEN' : 'REFUSED'}`);\n"
    b"                dumpOpenPorts(`proxy-worker ECONNREFUSED :${targetPort}`);\n"
    b"            });\n"
    b"        } else {\n"
    b"            log(`\xe2\x9a\xa0\xef\xb8\x8f Proxy error \xe2\x86\x92 ${error.message}`);\n"
    b"        }\n"
)
changes.append(('TCP probe in proxyRequest ECONNREFUSED', old6, new6))

# ─── Apply ───────────────────────────────────────────────────────────────────
errors = []
for (desc, old, new) in changes:
    count = content.count(old)
    if count == 1:
        content = content.replace(old, new)
        print(f'  [OK] {desc}')
    else:
        errors.append(f'  [MISS x{count}] {desc}')

for e in errors:
    print(e)

if not errors:
    with open('server.js', 'wb') as f:
        f.write(content)
    print('\nAll changes written.')
    sys.exit(0)
else:
    print('\nFile NOT written.')
    sys.exit(1)
