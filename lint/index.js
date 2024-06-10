/* eslint-disable @typescript-eslint/naming-convention */
// eslint-disable-next-line no-undef
const { createValidator } = require('eslint-plugin-userscripts/dist/utils/createValidator')

const enforceDownloadUrl = createValidator({
  fixable: true,
  messages: { specifyDownloadURL: 'You must specify a \'downloadURL\'' },
  name: 'name',
  validator: ({ attrVal, context, metadata }) => {
    if (!metadata.downloadURL) context.report({ // @ts-ignore
      fix (fixer) {
        const filename = context.filename ?? context.getFilename()
        const line = context.sourceCode.lines[attrVal.comment.loc.start.line - 1]
        const from = attrVal.val
        const to = `https://github.com/Shuunen/user-scripts/raw/master/src/${filename.split('\\').reverse()[0]}`
        const value = `\n${line.replace(/@\S+/u, '@downloadURL').replace(from, to)}`
        return fixer.insertTextAfterRange(attrVal.comment.range, value)
      },
      loc: attrVal.loc,
      messageId: 'specifyDownloadURL',
    })
  },
})

module.exports = {
  rules: {
    'enforce-download-url': enforceDownloadUrl,
  },
}
