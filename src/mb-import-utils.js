/* eslint-disable unused-imports/no-unused-vars */

/**
 * Get the text content from the node behind a css selector
 * @param {string} selector the css selector
 * @param {HTMLElement} context the context
 * @returns {string} the text content
 */
function textFromSelector (selector, context) {
  const element = (context || document).querySelector(selector)
  if (!element) return ''
  return element.textContent?.trim() || ''
}

/**
 * Generate a form to import a release to MusicBrainz
 * @param {{ id:string, title: string }} app
 * @returns
 */
// eslint-disable-next-line max-statements
function createMbForm (app) {
  const existing = document.querySelector(`#${app.id}`)
  if (existing) existing.remove()
  const form = document.createElement('form')
  form.id = app.id
  form.method = 'post'
  form.target = 'blank'
  form.action = 'https://musicbrainz.org/release/add?tport=8000'
  form.acceptCharset = 'utf8'
  form.style.position = 'absolute'
  form.style.zIndex = '1000'
  form.style.display = 'flex'
  form.style.flexDirection = 'column'
  form.style.padding = '0.7rem 0.8rem'
  form.style.color = 'rgb(51, 51, 51)'
  form.style.backgroundColor = 'white'
  form.style.top = '60px'
  form.style.right = '1rem'
  form.style.borderRadius = '0.2rem'
  const header = document.createElement('h2')
  header.textContent = app.title
  header.style.textAlign = 'center'
  header.style.padding = '0.2rem 0'
  header.style.fontSize = '1.2rem'
  header.style.margin = '0'
  form.append(header)
  return form
}

/**
 * Add a field to the form
 * @param {HTMLFormElement} form
 * @param {string} name
 * @param {string} value
 * @param {boolean} isHidden
 */
// eslint-disable-next-line max-params
function addMbField (form, name, value, isHidden = false) {
  const field = document.createElement('input')
  field.name = name
  field.title = name
  field.value = value
  if (isHidden) field.hidden = true
  // field.required = true
  field.style.color = 'inherit'
  field.style.margin = '0.3rem 0 0'
  field.style.padding = '.2rem 0 .2rem 0.5rem'
  field.style.width = '220px'
  form.append(field)
}

/**
 * Add a submit button to the form
 * @param {HTMLFormElement} form
 */
// eslint-disable-next-line max-statements
function addMbSubmit (form) {
  const submit = document.createElement('input')
  submit.type = 'submit'
  submit.value = 'Export to MusicBrainz'
  submit.style.borderRadius = '1rem'
  submit.style.cursor = 'pointer'
  submit.style.margin = '0.5rem auto 0'
  submit.style.textTransform = 'uppercase'
  submit.style.fontSize = '0.8rem'
  submit.style.padding = '0.4rem 1rem 0.2rem'
  submit.style.display = 'block'
  submit.style.backgroundColor = 'steelblue'
  submit.style.color = 'white'
  form.append(submit)
}

/**
 * Insert the form into the page
 * @param {{ app: { id:string, title: string }, title: string, artist: string, date: {day:string, month:string, year: string}, tracks: {number: string, name: string, artist: string, duration: string}[], label: string, url: string, urlType: string }} data
 * @returns
 */
// eslint-disable-next-line max-statements
function insertMbForm ({ app, title, artist, date, tracks, label, url, urlType }) {
  if (!title || !artist) { console.info(app.id, 'cannot work without data, exiting...'); return }
  console.log(app.id, 'got data :', { title, artist, date, tracks, label, url, urlType })
  const form = createMbForm(app)
  addMbField(form, 'name', title)
  addMbField(form, 'artist_credit.names.0.name', artist)
  addMbField(form, 'status', 'official', true)
  addMbField(form, 'type', 'Album', true)
  addMbField(form, 'country', 'XW', true) // worldwide
  if (date.year) addMbField(form, 'date.year', date.year)
  if (date.month) addMbField(form, 'date.month', date.month)
  if (date.day) addMbField(form, 'date.day', date.day)
  tracks.forEach((track, index) => {
    addMbField(form, `mediums.0.track.${index}.number`, track.number, true)
    addMbField(form, `mediums.0.track.${index}.name`, track.name, true)
    addMbField(form, `mediums.0.track.${index}.artist_credit.names.0.name`, track.artist || artist, true)
    addMbField(form, `mediums.0.track.${index}.length`, track.duration, true)
  })
  addMbField(form, 'mediums.0.format', 'Digital Media', true)
  addMbField(form, 'labels.0.name', label)
  addMbField(form, 'urls.0.url', url, true)
  addMbField(form, 'urls.0.link_type', urlType, true)
  addMbField(form, 'edit_note', `Release ${url} imported using github.com/Shuunen/user-scripts/blob/master/src/${app.id}.user.js`, true)
  addMbSubmit(form)
  document.body.append(form)
}
