import stylelint from 'stylelint'

const {
  createPlugin,
  utils: { report, ruleMessages, validateOptions },
} = stylelint

const ruleName = 'portfolio/no-raw-tokens'

const messages = ruleMessages(ruleName, {
  rejected:
    'Raw tokens live only in generated token CSS — use a semantic token (--color-*, --radius-*, --type-*, --density-*, --motion-*, --shadow-*)',
})

const meta = {
  url: new URL('../../app/frontend/ds/tokens/README.md', import.meta.url).href,
}

/** @type {import('stylelint').Rule} */
const rule = (primary) => {
  return (root, result) => {
    const validOptions = validateOptions(result, ruleName, { actual: primary })

    if (!validOptions) return

    root.walkDecls((decl) => {
      if (decl.prop.startsWith('--raw-') || decl.value.includes('--raw-')) {
        report({
          message: messages.rejected,
          node: decl,
          result,
          ruleName,
        })
      }
    })
  }
}

rule.ruleName = ruleName
rule.messages = messages
rule.meta = meta

export default createPlugin(ruleName, rule)
