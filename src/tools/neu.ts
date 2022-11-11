declare global {
  interface Window {
    Neutralino: {
      app: {
        exit: (code?: boolean) => Promise<{code: boolean}>
        killProcess: () => Promise<void>
        restartProcess: () => Promise<void>
        getConfig: () => Promise<void>
        broadcast: () => Promise<{event: void; data: void}>
      }
      clipboard: {
        readText: () => Promise<void> // ", { key: e, data: t });
        writeText: () => Promise<void> // ", { data: e });
      }
      computer: {
        getMemoryInfo: () => Promise<void>
        getArch: () => Promise<void>
        getKernelInfo: () => Promise<void>
        getOSInfo: () => Promise<void>
        getCPUInfo: () => Promise<void>
        getDisplays: () => Promise<void>
        getMousePosition: () => Promise<void>
      }
      debug: {
        log: () => Promise<void> // ", { message: e, type: t });
      }
      events: {
        on: () => Promise<void>
        off: () => Promise<void>
        dispatch: () => Promise<void>
        broadcast: () => Promise<void>
      }
      extensions: {
        dispatch: () => Promise<void>
        broadcast: () => Promise<void>
        getStats: () => Promise<void>
      }
      filesystem: {
        createDirectory: () => Promise<void> // ", { path: e });
        removeDirectory: () => Promise<void> // ", { path: e });
        writeFile: () => Promise<void> // ", { path: e, data: t });
        appendFile: () => Promise<void> // ", { path: e, data: t });
        writeBinaryFile: () => Promise<void> // ", { path: e, data: d(t) });
        appendBinaryFile: () => Promise<void> // ", { path: e, data: d(t) });
        readFile: () => Promise<void> // ", { path: e });
        readBinaryFile: () => Promise<void>
        removeFile: () => Promise<void> // ", { path: e });
        readDirectory: () => Promise<void> // ", { path: e });
        copyFile: () => Promise<void> // ", { source: e, destination: t });
        moveFile: () => Promise<void> // ", { source: e, destination: t });
        getStats: () => Promise<void> // ", { path: e });
      }
      init: () => void
      os: {
        execCommand: () => Promise<void> // ", Object.assign({ command: e }, t));
        spawnProcess: () => Promise<void> // ", { command: e });
        updateSpawnedProcess: () => Promise<void> // ", { id: e, event: t, data: n });
        getSpawnedProcesses: () => Promise<void>
        getEnv: () => Promise<void> // ", { key: e });
        showOpenDialog: () => Promise<void> // ", Object.assign({ title: e }, t));
        showFolderDialog: () => Promise<void> // ", Object.assign({ title: e }, t));
        showSaveDialog: () => Promise<void> // ", Object.assign({ title: e }, t));
        showNotification: () => Promise<void> // ", { title: e, content: t, icon: n });
        showMessageBox: () => Promise<void> // ", {
        setTray: () => Promise<void> // ", e);
        open: () => Promise<void> // ", { url: e });
        getPath: () => Promise<void> // ", { name: e });
      }
      storage: {
        setData: () => Promise<void> // ", { key: e, data: t });
        getData: () => Promise<void> // ", { key: e });
      }
      updater: {
        checkForUpdates: () => Promise<void>
        install: () => Promise<void>
      }
      window: {
        setTitle: () => Promise<void> // ", { title: e });
        getTitle: () => Promise<void>
        maximize: () => Promise<void>
        unmaximize: () => Promise<void>
        isMaximized: () => Promise<void>
        minimize: () => Promise<void>
        setFullScreen: () => Promise<void>
        exitFullScreen: () => Promise<void>
        isFullScreen: () => Promise<void>
        show: () => Promise<void>
        hide: () => Promise<void>
        isVisible: () => Promise<void>
        focus: () => Promise<void>
        setIcon: () => Promise<void> // ", { icon: e });
        move: () => Promise<void> // ", { x: e, y: t });
        getSize: () => Promise<void>
        setSize: () => Promise<void> // ",
        getPosition: () => Promise<void>
        setDraggableRegion: () => Promise<void>
        unsetDraggableRegion: () => Promise<void>
        setAlwaysOnTop: () => Promise<void> // ", { onTop: e });
        create: () => Promise<void>
      }
    }
  }
}

const {
  app,
  clipboard,
  computer,
  debug,
  events,
  extensions,
  filesystem,
  init,
  os,
  storage,
  updater,
  window: nwindow,
} = window.Neutralino

export {app, clipboard, computer, debug, events, extensions, filesystem, init, os, storage, updater, nwindow}
export default window.Neutralino