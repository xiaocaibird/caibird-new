const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, '../dist/cjs');

const getFullPathname = pathname => path.join(rootDir, pathname);

const task = (dirname = '') => {
    try {
        const fullDirname = getFullPathname(dirname)

        const list = fs.readdirSync(fullDirname);

        list.forEach(filename => {
            try {
                const fullFilename = path.join(fullDirname, filename);

                if (filename.endsWith('.ts')) {
                    fs.renameSync(fullFilename, fullFilename.replace(/\.ts$/, '.cts'));
                } else if (filename.endsWith('.js')) {
                    fs.renameSync(fullFilename, fullFilename.replace(/\.js$/, '.cjs'));
                } else {
                    task(path.join(dirname, filename));
                }
            } catch (e) { }
        });
    } catch (e) { }
};

task();
