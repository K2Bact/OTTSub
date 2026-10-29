// Test coverage follows the actual UI inventory; independent order/copy tests remain explicit.
const {loadInput}=require('../../scripts/audit-l10n.cjs');
const supportedUILocales=()=>[...loadInput().requiredLocales];
module.exports={supportedUILocales};
