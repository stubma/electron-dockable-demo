const { app, BrowserWindow, Menu, MenuItem, ipcMain } = require('electron')
const windowStateKeeper = require('electron-window-state')
const path = require('path')
const url = require('url')
const EDock = require('electron-dockable')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
	// Load the previous state with fallback to defaults
	let mainWindowState = windowStateKeeper({
		defaultWidth : 1000,
		defaultHeight : 800
	})

	// Create the browser window.
	mainWindow = new BrowserWindow({
		'x': mainWindowState.x,
		'y': mainWindowState.y,
		'width': mainWindowState.width,
		'height': mainWindowState.height,
		'show': false
	})

	// Let us register listeners on the window, so we can update the state
	// automatically (the listeners will be removed when the window is closed)
	// and restore the maximized or full screen state
	mainWindowState.manage(mainWindow)

	// now make main window dockable
	EDock.makeWindowDockable(mainWindow)

	// append debug menu into application menu
	if(EDock.isDebug()) {
		installDebugMenu()
	}

	// and load the index.html of the app.
	mainWindow.loadURL(url.format({
		pathname : path.join(__dirname, 'index.html'),
		protocol : 'file:',
		slashes : true
	}))

	// Open the DevTools.
	mainWindow.webContents.openDevTools()

	// show window when it is ready
	mainWindow.once('ready-to-show', () => {
		mainWindow.show()
	})

	// Emitted when the window is closed.
	mainWindow.on('closed', function() {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow.edock.rootWin = null
		mainWindow = null
	})
}

function installDebugMenu() {
	let menu = Menu.getApplicationMenu()
	menu.append(new MenuItem({
		label: 'Debug',
		submenu : [
			{
				label: 'Dock Panel (Project) - CENTER',
				click() {
					mainWindow.webContents.send('edock:debug-dock-panel', 'Project', 'CENTER')
				}
			},
			{
				label: 'Dock Panel (Project) - EAST',
				click() {
					mainWindow.webContents.send('edock:debug-dock-panel', 'Project', 'EAST')
				}
			},
			{
				label: 'Dock Panel (Project) - WEST',
				click() {
					mainWindow.webContents.send('edock:debug-dock-panel', 'Project', 'WEST')
				}
			},
			{
				label: 'Dock Panel (Project) - SOUTH',
				click() {
					mainWindow.webContents.send('edock:debug-dock-panel', 'Project', 'SOUTH')
				}
			},
			{
				label: 'Dock Panel (Project) - NORTH',
				click() {
					mainWindow.webContents.send('edock:debug-dock-panel', 'Project', 'NORTH')
				}
			}
		]
	}))
	Menu.setApplicationMenu(menu)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function() {
	// On OS X it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if(process.platform !== 'darwin') {
		app.quit()
	}
})

app.on('activate', function() {
	// On OS X it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if(mainWindow === null) {
		createWindow()
	}
})