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
    path.join('c:\\', 'Users', 'Marcia Cristina', 'Downloads', 'Treinando antigravity', 'frontend', 'src')
];

basePaths.forEach(basePath => {
    walkDir(basePath, function(filePath) {
        if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            let cnt = fs.readFileSync(filePath, 'utf-8');
            let updated = false;
            let orig = cnt;

            // 1. Remove light shadows in dark mode
            cnt = cnt.replace(/(?<!dark:)\bshadow-slate-[12]00(\/\d+)?\b(?! *dark:shadow-)/g, '$& dark:shadow-none');
            
            // 2. Fix light colored backgrounds (fundo clarinho)
            const colors = 'indigo|teal|orange|amber|emerald|blue|rose|cyan|violet|purple|fuchsia';
            
            // For bg-color-50
            const regexBg50 = new RegExp(`(?<!dark:)\\bbg-(${colors})-50\\b(?! *dark:bg-)`, 'g');
            cnt = cnt.replace(regexBg50, 'bg-$1-50 dark:bg-$1-500/10');
            
            // For bg-color-100
            const regexBg100 = new RegExp(`(?<!dark:)\\bbg-(${colors})-100\\b(?! *dark:bg-)`, 'g');
            cnt = cnt.replace(regexBg100, 'bg-$1-100 dark:bg-$1-500/10');

            // 3. Fix colors for text with those backgrounds (text-color-600/700 inside dark mode needs to be lighter)
            const regexText600 = new RegExp(`(?<!dark:)\\btext-(${colors})-600\\b(?! *dark:text-)`, 'g');
            cnt = cnt.replace(regexText600, 'text-$1-600 dark:text-$1-400');
            
            const regexText700 = new RegExp(`(?<!dark:)\\btext-(${colors})-700\\b(?! *dark:text-)`, 'g');
            cnt = cnt.replace(regexText700, 'text-$1-700 dark:text-$1-400');
            
            // 4. Any remaining border-slate-100 / 200 without dark override
            cnt = cnt.replace(/(?<!dark:)\bborder-slate-100\b(?! *dark:border-)/g, 'border-slate-100 dark:border-[#2C2C2E]');
            cnt = cnt.replace(/(?<!dark:)\bborder-slate-200\b(?! *dark:border-)/g, 'border-slate-200 dark:border-[#2C2C2E]');
            cnt = cnt.replace(/(?<!dark:)\bborder-slate-200\/50\b(?! *dark:border-)/g, 'border-slate-200/50 dark:border-[#2C2C2E]/50');
            
            // 5. White lines: border-white/something inside light mode makes no sense, but landing page uses it over colored sections.
            // In dark mode, we might want it subtler.
            // The user explicitly complained about "linha branca".
            cnt = cnt.replace(/border-white\/50(?=.*dark:border-\[\#2C2C2E\])/g, 'border-white/50'); // Prevent mess
            cnt = cnt.replace(/(?<!dark:)\bborder-white\/[1-9]0\b(?! *dark:border-)/g, '$& dark:border-white/5');

            // 6. Fix pure bg-white that might have been missed
            cnt = cnt.replace(/(?<!dark:)\bbg-white\b(?! *dark:bg-)/g, 'bg-white dark:bg-[#121212]');

            // 7. Fix text-slate-800 missed
            cnt = cnt.replace(/(?<!dark:)\btext-slate-800\b(?! *dark:text-)/g, 'text-slate-800 dark:text-[#FFFFFF]');
            cnt = cnt.replace(/(?<!dark:)\btext-slate-500\b(?! *dark:text-)/g, 'text-slate-500 dark:text-[#A1A1AA]');

            if (cnt !== orig) {
                fs.writeFileSync(filePath, cnt, 'utf-8');
                console.log('Fixed', filePath);
            }
        }
    });
});
