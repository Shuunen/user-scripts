/* eslint-disable @typescript-eslint/naming-convention */
// eslint-disable-next-line no-undef
const { createValidator } = require('eslint-plugin-userscripts/dist/utils/createValidator')

const enforceDownloadUrl = createValidator({
  fixable: false,
  messages: { specifyDownloadURL: 'You must specify a \'downloadURL\'' },
  name: 'name',
  validator: ({ attrVal, context, metadata }) => {
    if (!metadata.downloadURL) context.report({
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
