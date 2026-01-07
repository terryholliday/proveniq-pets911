const { execSync } = require('child_process');
const fs = require('fs');

try {
    const output = execSync('npx jest -t "should detect active intent" __tests__/counselor-engine.test.ts', { encoding: 'utf8' });
    fs.writeFileSync('test_output_intent.txt', output);
} catch (error) {
    fs.writeFileSync('test_output_intent.txt', error.stdout || error.message);
}
