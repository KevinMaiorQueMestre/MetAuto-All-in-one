const fs = require('fs');
const path = require('path');

const dirs = ['.'];
const basePath = path.join('c:\\', 'Users', 'Marcia Cristina', 'Downloads', 'Treinando antigravity', 'frontend', 'src', 'components', 'dashboard');

console.log('basePath:', basePath, 'Exists?', fs.existsSync(basePath));

const replacements = {
    'bg-white': 'bg-white dark:bg-slate-900',
    'bg-slate-50': 'bg-slate-50 dark:bg-slate-800/50',
    'border-slate-100': 'border-slate-100 dark:border-slate-800',
    'border-slate-200': 'border-slate-200 dark:border-slate-700',
    'text-slate-800': 'text-slate-800 dark:text-slate-100',
    'text-slate-700': 'text-slate-700 dark:text-slate-200',
    'text-slate-500': 'text-slate-500 dark:text-slate-400',
    'text-slate-400': 'text-slate-400 dark:text-slate-500',
    'text-slate-900': 'text-slate-900 dark:text-white',
    'hover:bg-slate-50': 'hover:bg-slate-50 dark:hover:bg-slate-800',
    'hover:border-slate-100': 'hover:border-slate-100 dark:hover:border-slate-700',
};

// We will scan all tsx files in the basePath
const files = fs.readdirSync(basePath).filter(f => f.endsWith('.tsx'));

for (const f of files) {
    const filePath = path.join(basePath, f);
    if (fs.existsSync(filePath)) {
        let content = fs.readFileSync(filePath, 'utf-8');
        
        let newContent = content.split('"').map((part, index) => {
            if (index % 2 === 1) { 
                let classes = part.split(' ');
                classes = classes.map(c => replacements[c] ? replacements[c] : c);
                let finalClasses = [];
                for(let c of classes.join(' ').split(' ')) {
                    if(c.trim() && !finalClasses.includes(c)) finalClasses.push(c);
                }
                return finalClasses.join(' ');
            }
            return part; 
        }).join('"');
        
        // Also do backticks
        newContent = newContent.split('`').map((part, index) => {
            if (index % 2 === 1) {
                let subContent = part;
                for(const [k, v] of Object.entries(replacements)) {
                   const regex = new RegExp(`(?<!dark:)\\b${k}\\b(?! dark:)`, 'g');
                   try { subContent = subContent.replace(regex, v); } catch(e){}
                }
                return subContent;
            }
            return part;
        }).join('`');
        
        fs.writeFileSync(filePath, newContent, 'utf-8');
        console.log('Updated', f);
    }
}
