/* global document */
// eslint-disable-next-line no-unused-vars
const textFromSelector = (sel, context) => {
  const element = (context || document).querySelector(sel)
  if (!element) return ''
  return element.textContent.trim()
}

const createMbForm = app => {
  const existing = document.querySelector(`#${app.id}`)
  if (existing) existing.remove()
  const form = document.createElement('form')
  form.id = app.id
  form.method = 'post'
  form.target = 'blank'
  form.action = 'https://musicbrainz.org/release/add?tport=8000'
  form.acceptCharset = 'UTF-8'
  form.style = 'position: absolute; z-index: 1000; display: flex; flex-direction: column;padding: 0.7rem 0.8rem;color: rgb(51, 51, 51);background-color: white;top: 60px;right: 1rem;border-radius: 0.2rem;'
  const header = document.createElement('h2')
  header.textContent = app.title
  header.style = 'text-align: center;padding: 0.2rem 0;font-size: 1.2rem;margin: 0;'
  form.append(header)
  return form
}

const addMbField = (form, name, value, isHidden = false) => {
  const field = document.createElement('input')
  field.name = name
  field.title = name
  field.value = value
  if (isHidden) field.hidden = true
  // field.required = true
  field.style = 'color: inherit; margin: 0.3rem 0 0; padding: .2rem 0 .2rem 0.5rem;width: 220px;'
  form.append(field)
}

const addMbSubmit = form => {
  const submit = document.createElement('input')
  submit.type = 'submit'
  submit.value = 'Export to MusicBrainz'
  submit.style = 'border-radius: 1rem;cursor: pointer;margin: 0.5rem auto 0;text-transform: uppercase;font-size: 0.8rem;padding: 0.4rem 1rem 0.2rem;display: block;background-color: steelblue;color: white;'
  form.append(submit)
}

// eslint-disable-next-line no-unused-vars
const insertMbForm = ({ app, title, artist, date, tracks, label, url, urlType }) => {
  if (!title || !artist) return console.info(app.id, 'cannot work without data, exiting...')
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
