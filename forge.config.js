module.exports = {
    packagerConfig: {
        icon: 'favicon.icns' // use .icns for macOS, .ico for Windows, ensure the file exists
    },
    makers: [
        {
            name: '@electron-forge/maker-zip',
            platforms: ['darwin', 'linux'],
            config: {
                // the config can be an object
            }
        },
        {
            name: '@electron-forge/maker-dmg',
            config: (arch) => ({
                // it can also be a function taking the currently built arch
                // as a parameter and returning a config object, e.g.
            })
        }
  
    ]
};