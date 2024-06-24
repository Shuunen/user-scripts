/* eslint-disable no-unused-vars */

/**
 * Get the text content from the node behind a css selector
 * @param {string} selector the css selector
 * @param {HTMLElement} [context] the context
 * @returns {string} the text content
 */
function textFromSelector (selector, context) {
  const element = (context ?? document).querySelector(selector)
  if (!element) return '' // @ts-ignore
  const text = element.textContent || element.value || element.src || ''
  return text.trim().replace(/^\W+/gu, '').replace(/\W+$/gu, '')
}

/**
 * Generate a form to import a release to MusicBrainz
 * @param {{ id:string, title: string }} app the app id and title
 * @param {Function} [callback] a function to call with the data, prevent form submission is used
 * @returns {HTMLFormElement} the form
 */
// eslint-disable-next-line max-statements
function createMbForm (app, callback = () => ({})) {
  const existing = document.querySelector(`#${app.id}`)
  if (existing) existing.remove()
  const form = document.createElement('form')
  form.id = app.id
  form.method = 'post'
  form.target = 'blank'
  form.action = 'https://musicbrainz.org/release/add?tport=8000'
  form.acceptCharset = 'utf8'
  form.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)'
  form.style.position = 'absolute'
  form.style.zIndex = '10000'
  form.style.display = 'flex'
  form.style.flexDirection = 'column'
  form.style.padding = '14px 16px'
  form.style.color = 'rgb(51, 51, 51)'
  form.style.backgroundColor = 'white'
  form.style.top = '60px'
  form.style.right = '20px'
  form.style.borderRadius = '4px'
  const close = document.createElement('button')
  close.textContent = '×'
  close.style.position = 'absolute'
  close.style.top = '4px'
  close.style.right = '4px'
  close.style.border = 'none'
  close.style.backgroundColor = 'transparent'
  close.style.cursor = 'pointer'
  close.style.fontSize = '20px'
  close.addEventListener('click', () => form.remove())
  form.append(close)
  const header = document.createElement('h2')
  header.textContent = app.title
  header.style.textAlign = 'center'
  header.style.padding = '4px 0'
  header.style.fontSize = '24px'
  header.style.margin = '0'
  form.append(header)
  if (callback) form.addEventListener('submit', (event) => {
    event.preventDefault()
    const formData = new FormData(form) // @ts-ignore it exists ^^'
    const values = Object.fromEntries(formData.entries())
    callback(values)
  })
  return form
}

/**
 * Add a field to the form
 * @param {HTMLFormElement} form the form
 * @param {string} name the field name
 * @param {string} value the field value
 * @param {boolean} isHidden if the field should be hidden
 */
// eslint-disable-next-line max-params, max-statements
function addMbField (form, name, value, isHidden = false) {
  const colors = ['darkblue', 'green', 'darkred', 'darkorange', 'teal', 'brown', 'indigo']
  const nbExistingFields = form.querySelectorAll('.mb-field').length
  const color = colors[nbExistingFields % colors.length] ?? 'inherit'
  const line = document.createElement('label')
  line.setAttribute('class', 'mb-field')
  line.style.display = 'flex'
  line.style.flexDirection = 'row'
  line.style.alignItems = 'center'
  line.style.gap = '10px'
  line.style.color = color
  const label = document.createElement('span')
  label.textContent = name
  label.style.width = '70px'
  label.style.fontSize = '14px'
  label.style.textTransform = 'capitalize'
  label.style.textOverflow = 'ellipsis'
  label.style.overflow = 'hidden'
  const field = document.createElement('input')
  field.placeholder = name
  field.name = name
  field.title = name
  field.value = value
  if (isHidden) field.hidden = true
  // field.required = true
  field.style.color = 'inherit'
  field.style.margin = '6px 0 0'
  field.style.padding = '4px 0 4px 10px'
  field.style.fontSize = '14px'
  field.style.border = '1px solid currentColor'
  field.style.borderRadius = '4px'
  field.style.width = '220px'
  line.append(label, field)
  form.append(line)
}

/**
 * Add a submit button to the form
 * @param {HTMLFormElement} form the form
 * @param {string} [label] the button label
 * @returns {void} nothing
 */
// eslint-disable-next-line max-statements
function addMbSubmit (form, label = 'Export to MusicBrainz') {
  const submit = document.createElement('input')
  submit.type = 'submit'
  submit.value = label
  submit.style.borderRadius = '20px'
  submit.style.cursor = 'pointer'
  submit.style.margin = '10px auto 0'
  submit.style.textTransform = 'uppercase'
  submit.style.fontSize = '14px'
  submit.style.padding = '4px 14px 5px'
  submit.style.display = 'block'
  submit.style.backgroundColor = 'steelblue'
  submit.style.color = 'white'
  form.append(submit)
}

/**
 * Insert the form into the page
 * @param {{ app: { id:string, title: string }, title: string, artist: string, date: {day:string, month:string, year: string}, tracks: {number: string, name: string, artist: string, duration: string}[], label: string, url: string, urlType: string }} data the data to insert
 * @returns {void} nothing
 */
// eslint-disable-next-line max-statements
function insertMbForm ({ app, artist, date, label, title, tracks, url, urlType }) {
  // eslint-disable-next-line no-console
  if (!title || !artist) { console.info(app.id, 'cannot work without data, exiting...'); return }
  // eslint-disable-next-line no-console
  console.log(app.id, 'got data :', { artist, date, label, title, tracks, url, urlType })
  const form = createMbForm(app)
  addMbField(form, 'name', title)
  addMbField(form, 'artist_credit.names.0.name', artist)
  addMbField(form, 'status', 'official', true)
  addMbField(form, 'type', 'Album', true)
  addMbField(form, 'country', 'XW', true) // worldwide
  if (date.year) addMbField(form, 'date.year', date.year)
  if (date.month) addMbField(form, 'date.month', date.month)
  if (date.day) addMbField(form, 'date.day', date.day)
  for (const [index, track] of tracks.entries()) {
    addMbField(form, `mediums.0.track.${index}.number`, track.number, true)
    addMbField(form, `mediums.0.track.${index}.name`, track.name, true)
    addMbField(form, `mediums.0.track.${index}.artist_credit.names.0.name`, track.artist || artist, true)
    addMbField(form, `mediums.0.track.${index}.length`, track.duration, true)
  }
  addMbField(form, 'mediums.0.format', 'Digital Media', true)
  addMbField(form, 'labels.0.name', label)
  addMbField(form, 'urls.0.url', url, true)
  addMbField(form, 'urls.0.link_type', urlType, true)
  addMbField(form, 'edit_note', `Release ${url} imported using github.com/Shuunen/user-scripts/blob/master/src/${app.id}.user.js`, true)
  addMbSubmit(form)
  document.body.append(form)
}
