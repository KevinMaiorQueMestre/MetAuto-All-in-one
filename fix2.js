const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        if (f === 'node_modules' || f.startsWith('.')) return;
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

const basePaths = [
    path.join('c:\\', 'Users', 'Marcia Cristina', 'Downloads', 'Treinando antigravity', 'frontend', 'src', 'app', '(sistema)'),
    path.join('c:\\', 'Users', 'Marcia Cristina', 'Downloads', 'Treinando antigravity', 'frontend', 'src', 'components'),
];

const replacements = {
    'dark:bg-slate-900': 'dark:bg-[#1C1C1E]',
    'dark:bg-slate-800/50': 'dark:bg-[#2C2C2E]',
    'dark:bg-slate-800': 'dark:bg-[#2C2C2E]',
    'dark:border-slate-800': 'dark:border-[#2C2C2E]',
    'dark:border-slate-700': 'dark:border-[#3A3A3C]',
    'dark:hover:bg-slate-800': 'dark:hover:bg-[#2C2C2E]',
    'dark:hover:border-slate-700': 'dark:hover:border-[#3A3A3C]',
    'dark:text-slate-100': 'dark:text-[#FFFFFF]',
    'dark:text-slate-200': 'dark:text-[#F4F4F5]',
    'dark:text-slate-400': 'dark:text-[#A1A1AA]',
    'dark:text-slate-500': 'dark:text-[#71717A]',
    'dark:text-white': 'dark:text-[#FFFFFF]',
};

basePaths.forEach(basePath => {
    walkDir(basePath, function(filePath) {
        if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            let content = fs.readFileSync(filePath, 'utf-8');
            let updated = false;

            // Simple string replacement using split/join to avoid regex boundary issues with class names
            for (const [k, v] of Object.entries(replacements)) {
                if (content.includes(k)) {
                    // split by token precisely (in react className strings)
                    // We'll trust that these specific classes don't accidentally match prefixes because they are full tailwind classes.
                    content = content.split(k).join(v);
                    updated = true;
                }
            }

            if (updated) {
                fs.writeFileSync(filePath, content, 'utf-8');
                console.log('Updated', filePath);
            }
        }
    });
});

// Also manually update layout.tsx
const layoutPath = path.join('c:\\', 'Users', 'Marcia Cristina', 'Downloads', 'Treinando antigravity', 'frontend', 'src', 'app', 'layout.tsx');
if (fs.existsSync(layoutPath)) {
    let layoutContent = fs.readFileSync(layoutPath, 'utf-8');
    if (layoutContent.includes('dark:bg-[#0a0a0a]')) {
        layoutContent = layoutContent.replace('dark:bg-[#0a0a0a]', 'dark:bg-[#121212]');
        fs.writeFileSync(layoutPath, layoutContent, 'utf-8');
        console.log('Updated', layoutPath);
    }
}

console.log('Colors replaced!');
